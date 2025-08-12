'use client';

import { useState } from 'react';
import { X, Download, FileText, Image, Table2, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/overlay';
import { RadioGroup, RadioGroupItem } from '@/components/ui/inputs';
import { Label } from '@/components/ui/inputs';
import { Checkbox } from '@/components/ui/inputs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs';
import { downloadSeatingChart } from '@/lib/export/seating-exporter';
import { useSeatingStore } from '@/store/seatingStore';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  layoutId: string;
}

interface ExportOptions {
  format: 'pdf' | 'png' | 'csv';
  includeDietaryInfo: boolean;
  includeContactInfo: boolean;
  includeNotes: boolean;
  includeTableDetails: boolean;
  paperSize: 'a4' | 'letter' | 'a3';
  orientation: 'portrait' | 'landscape';
}

const FORMAT_INFO = {
  pdf: {
    icon: FileText,
    title: 'PDF Document',
    description: 'Best for printing and sharing. Includes visual layout and table listings.',
    color: 'text-red-600',
  },
  png: {
    icon: Image,
    title: 'PNG Image',
    description: 'Visual representation only. Great for social media or quick sharing.',
    color: 'text-blue-600',
  },
  csv: {
    icon: Table2,
    title: 'CSV Spreadsheet',
    description: 'Data only. Perfect for importing into Excel or Google Sheets.',
    color: 'text-green-600',
  },
};

export default function ExportDialog({ open, onClose, layoutId }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeDietaryInfo: true,
    includeContactInfo: false,
    includeNotes: true,
    includeTableDetails: true,
    paperSize: 'a4',
    orientation: 'landscape',
  });

  const { layout, tables, assignments } = useSeatingStore();

  const handleExport = async () => {
    if (!layout) {
      toast.error('No layout data available');
      return;
    }

    setIsExporting(true);
    setExportComplete(false);

    try {
      // Prepare layout data with all details
      const layoutWithDetails = {
        ...layout,
        tables: tables.map(table => ({
          ...table,
          assignments: assignments
            .filter(a => a.tableId === table.id)
            .map(a => ({
              ...a,
              guest: {
                // Mock guest data - in real app, this would come from the store
                id: a.guestId,
                name: `Guest ${a.guestId.slice(-4)}`,
                email: 'guest@example.com',
                phone: '+1234567890',
                side: Math.random() > 0.5 ? 'bride' : 'groom',
                age_group: 'adult',
                dietaryRestrictions: Math.random() > 0.7 ? 'Vegetarian' : null,
              },
            })),
        })),
        couple: {
          partner1Name: 'Sarah',
          partner2Name: 'Michael',
          weddingDate: new Date('2024-06-15'),
          venueName: 'The Grand Ballroom',
        },
      };

      await downloadSeatingChart(layoutWithDetails, options);
      
      setExportComplete(true);
      toast.success('Export completed successfully!');
      
      // Reset and close after a delay
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export seating chart');
    } finally {
      setIsExporting(false);
    }
  };

  const isDataFormat = options.format === 'csv';
  const isVisualFormat = options.format === 'png';

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Export Seating Chart
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Export Format</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) => setOptions({ ...options, format: value as any })}
            >
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(FORMAT_INFO).map(([format, info]) => {
                  const Icon = info.icon;
                  return (
                    <label
                      key={format}
                      className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <RadioGroupItem value={format} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${info.color}`} />
                          <span className="font-medium">{info.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {info.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* PDF Options */}
          {options.format === 'pdf' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paper-size">Paper Size</Label>
                  <Select
                    value={options.paperSize}
                    onValueChange={(value) => setOptions({ ...options, paperSize: value as any })}
                  >
                    <SelectTrigger id="paper-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="a3">A3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="orientation">Orientation</Label>
                  <Select
                    value={options.orientation}
                    onValueChange={(value) => setOptions({ ...options, orientation: value as any })}
                  >
                    <SelectTrigger id="orientation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Data Options */}
          {!isVisualFormat && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Include Information</Label>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={options.includeTableDetails}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeTableDetails: !!checked })
                    }
                    disabled={isDataFormat}
                  />
                  <span className="text-sm">Table details (capacity, shape)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={options.includeDietaryInfo}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeDietaryInfo: !!checked })
                    }
                  />
                  <span className="text-sm">Dietary restrictions</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={options.includeContactInfo}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeContactInfo: !!checked })
                    }
                  />
                  <span className="text-sm">Contact information</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={options.includeNotes}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeNotes: !!checked })
                    }
                  />
                  <span className="text-sm">Seating notes</span>
                </label>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting || exportComplete}>
              {exportComplete ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Export Complete
                </>
              ) : isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export {options.format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}