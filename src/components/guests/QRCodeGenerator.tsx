'use client';

import { useState } from 'react';
import { QrCode, Download, Printer, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/overlay';
import { RadioGroup, RadioGroupItem } from '@/components/ui/inputs';
import { Label } from '@/components/ui/inputs';
import { Checkbox } from '@/components/ui/inputs';
import { getQRCodeService } from '@/lib/api/qr-code';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
  guests: Array<{
    id: string;
    name: string;
    email?: string;
    tableNumber?: string;
  }>;
  eventId: string;
  eventName: string;
  eventDate: Date;
}

type GenerationMode = 'individual' | 'bulk' | 'labels';

interface GenerationOptions {
  mode: GenerationMode;
  includeTableInfo: boolean;
  sendEmail: boolean;
  selectedGuests: Set<string>;
}

export default function QRCodeGenerator({
  guests,
  eventId,
  eventName,
  eventDate,
}: QRCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<Map<string, string>>(new Map());
  const [options, setOptions] = useState<GenerationOptions>({
    mode: 'bulk',
    includeTableInfo: true,
    sendEmail: false,
    selectedGuests: new Set(guests.map(g => g.id)),
  });

  const qrCodeService = getQRCodeService();

  const handleGenerate = async () => {
    if (options.selectedGuests.size === 0) {
      toast.error('Please select at least one guest');
      return;
    }

    setIsGenerating(true);

    try {
      const selectedGuestsList = guests.filter(g => options.selectedGuests.has(g.id));

      switch (options.mode) {
        case 'individual':
          await generateIndividualCodes(selectedGuestsList);
          break;
        case 'bulk':
          await generateBulkDownload(selectedGuestsList);
          break;
        case 'labels':
          await generatePrintableLabels(selectedGuestsList);
          break;
      }

      toast.success('QR codes generated successfully');
    } catch (error) {
      console.error('QR generation error:', error);
      toast.error('Failed to generate QR codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateIndividualCodes = async (guestsList: typeof guests) => {
    const codes = await qrCodeService.generateBulkQRCodes(
      guestsList.map(g => ({
        ...g,
        id: g.id,
        name: g.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        coupleId: '',
        attendingStatus: 'pending',
        side: 'bride',
      })),
      eventId
    );
    
    setGeneratedCodes(codes);
    setShowDialog(true);
  };

  const generateBulkDownload = async (guestsList: typeof guests) => {
    // Generate all QR codes
    const codes = await qrCodeService.generateBulkQRCodes(
      guestsList.map(g => ({
        ...g,
        id: g.id,
        name: g.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        coupleId: '',
        attendingStatus: 'pending',
        side: 'bride',
      })),
      eventId
    );

    // Create a zip file with all QR codes
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    codes.forEach((dataUrl, guestId) => {
      const guest = guestsList.find(g => g.id === guestId);
      if (guest) {
        const base64Data = dataUrl.split(',')[1];
        const fileName = `${guest.name.replace(/[^a-z0-9]/gi, '-')}-qr.png`;
        zip.file(fileName, base64Data, { base64: true });
      }
    });

    // Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventName.replace(/[^a-z0-9]/gi, '-')}-qr-codes.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePrintableLabels = async (guestsList: typeof guests) => {
    const html = await qrCodeService.generateQRCodeLabels(
      guestsList.map(g => ({
        ...g,
        id: g.id,
        name: g.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        coupleId: '',
        attendingStatus: 'pending',
        side: 'bride',
      })),
      eventId,
      {
        labelsPerRow: 3,
        labelSize: 200,
        includeGuestName: true,
        includeTableNumber: options.includeTableInfo,
      }
    );

    // Open print preview
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleGuestToggle = (guestId: string) => {
    const newSelected = new Set(options.selectedGuests);
    if (newSelected.has(guestId)) {
      newSelected.delete(guestId);
    } else {
      newSelected.add(guestId);
    }
    setOptions({ ...options, selectedGuests: newSelected });
  };

  const handleSelectAll = () => {
    if (options.selectedGuests.size === guests.length) {
      setOptions({ ...options, selectedGuests: new Set() });
    } else {
      setOptions({ ...options, selectedGuests: new Set(guests.map(g => g.id)) });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate Check-In QR Codes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generation Mode */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Generation Mode</Label>
            <RadioGroup
              value={options.mode}
              onValueChange={(value) => setOptions({ ...options, mode: value as GenerationMode })}
            >
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <RadioGroupItem value="individual" />
                  <div>
                    <p className="font-medium">Individual Display</p>
                    <p className="text-sm text-muted-foreground">
                      View QR codes on screen for selected guests
                    </p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <RadioGroupItem value="bulk" />
                  <div>
                    <p className="font-medium">Bulk Download</p>
                    <p className="text-sm text-muted-foreground">
                      Download all QR codes as a ZIP file
                    </p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <RadioGroupItem value="labels" />
                  <div>
                    <p className="font-medium">Printable Labels</p>
                    <p className="text-sm text-muted-foreground">
                      Generate print-ready label sheets
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={options.includeTableInfo}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeTableInfo: !!checked })
                }
              />
              <span className="text-sm">Include table assignments</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={options.sendEmail}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, sendEmail: !!checked })
                }
                disabled
              />
              <span className="text-sm text-muted-foreground">
                Email QR codes to guests (coming soon)
              </span>
            </label>
          </div>

          {/* Guest Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Select Guests</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {options.selectedGuests.size === guests.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="border rounded-lg max-h-48 overflow-y-auto p-2">
              <div className="space-y-2">
                {guests.map((guest) => (
                  <label
                    key={guest.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-accent/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={options.selectedGuests.has(guest.id)}
                      onCheckedChange={() => handleGuestToggle(guest.id)}
                    />
                    <span className="text-sm flex-1">{guest.name}</span>
                    {guest.tableNumber && (
                      <span className="text-xs text-muted-foreground">
                        Table {guest.tableNumber}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {options.selectedGuests.size} of {guests.length} guests selected
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || options.selectedGuests.size === 0}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="mr-2 h-4 w-4" />
                Generate QR Codes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Individual Display Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated QR Codes</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {Array.from(generatedCodes.entries()).map(([guestId, qrCode]) => {
              const guest = guests.find(g => g.id === guestId);
              if (!guest) return null;
              
              return (
                <Card key={guestId} className="overflow-hidden">
                  <CardContent className="p-4 text-center">
                    <img
                      src={qrCode}
                      alt={`QR code for ${guest.name}`}
                      className="w-full h-auto mb-2"
                    />
                    <p className="font-medium text-sm">{guest.name}</p>
                    {guest.tableNumber && (
                      <p className="text-xs text-muted-foreground">
                        Table {guest.tableNumber}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}