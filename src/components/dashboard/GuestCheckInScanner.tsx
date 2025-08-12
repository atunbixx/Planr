'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { QrCode, Camera, Search, X, Check, AlertCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/inputs';
import { Alert, AlertDescription } from '@/components/ui/overlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/overlay';
import { Badge } from '@/components/ui/advanced';
import { getQRCodeService, CheckInData } from '@/lib/api/qr-code';
import { dayOfDashboardService } from '@/lib/api/day-of-dashboard';
import { formatTime } from '@/lib/utils/date';
import { toast } from 'sonner';
import QrScanner from 'qr-scanner';

interface GuestCheckInScannerProps {
  eventId: string;
  onCheckIn?: (guestId: string) => void;
}

interface CheckInResult {
  success: boolean;
  guestName?: string;
  tableNumber?: string;
  checkInTime?: Date;
  message?: string;
}

export default function GuestCheckInScanner({ eventId, onCheckIn }: GuestCheckInScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isManualSearch, setIsManualSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastCheckIn, setLastCheckIn] = useState<CheckInResult | null>(null);
  const [checkInStats, setCheckInStats] = useState({
    total: 0,
    checkedIn: 0,
    percentage: 0,
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const qrCodeService = getQRCodeService();

  // Fetch check-in stats
  const fetchCheckInStats = useCallback(async () => {
    try {
      const stats = await dayOfDashboardService().getGuestCheckInStats(eventId);
      setCheckInStats(stats);
    } catch (error) {
      console.error('Failed to fetch check-in stats:', error);
    }
  }, [eventId]);

  useEffect(() => {
    fetchCheckInStats();
  }, [fetchCheckInStats]);

  // Initialize QR scanner
  const startScanning = async () => {
    setIsScanning(true);
    setLastCheckIn(null);

    if (videoRef.current) {
      try {
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => handleQRCodeDetected(result.data),
          {
            preferredCamera: 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          }
        );
        
        await scannerRef.current.start();
      } catch (error) {
        console.error('Failed to start camera:', error);
        toast.error('Failed to access camera');
        setIsScanning(false);
      }
    }
  };

  // Stop scanning
  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Handle QR code detection
  const handleQRCodeDetected = async (data: string) => {
    try {
      // Extract encoded data from URL
      const url = new URL(data);
      const encodedData = url.searchParams.get('data');
      
      if (!encodedData) {
        throw new Error('Invalid QR code format');
      }

      const checkInData = qrCodeService.decodeCheckInData(encodedData);
      
      // Validate check-in data
      const validation = qrCodeService.validateCheckInData(checkInData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Process check-in
      await processCheckIn(checkInData.guestId);
      
    } catch (error) {
      console.error('QR code processing error:', error);
      toast.error(error instanceof Error ? error.message : 'Invalid QR code');
    }
  };

  // Process guest check-in
  const processCheckIn = async (guestId: string) => {
    try {
      const result = await dayOfDashboardService().checkInGuest(eventId, guestId);
      
      setLastCheckIn({
        success: true,
        guestName: result.guestName,
        tableNumber: result.tableNumber,
        checkInTime: new Date(result.checkInTime),
      });
      
      // Update stats
      await fetchCheckInStats();
      
      // Notify parent component
      if (onCheckIn) {
        onCheckIn(guestId);
      }
      
      // Show success message
      toast.success(`${result.guestName} checked in successfully!`);
      
      // Stop scanning after successful check-in
      stopScanning();
      
    } catch (error) {
      console.error('Check-in error:', error);
      setLastCheckIn({
        success: false,
        message: error instanceof Error ? error.message : 'Check-in failed',
      });
      toast.error('Failed to check in guest');
    }
  };

  // Manual search for guests
  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const guests = await dayOfDashboardService().searchGuests(eventId, searchQuery);
      
      if (guests.length === 0) {
        toast.error('No guests found');
        return;
      }
      
      if (guests.length === 1) {
        // Auto check-in if only one result
        await processCheckIn(guests[0].id);
        setIsManualSearch(false);
        setSearchQuery('');
      } else {
        // Show selection dialog for multiple results
        // Implementation would show a list of guests to select from
        toast.info(`Found ${guests.length} guests. Please refine your search.`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Guest Check-In</CardTitle>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {checkInStats.checkedIn} / {checkInStats.total}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Check-in Progress</span>
              <span className="text-sm font-medium">{checkInStats.percentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${checkInStats.percentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner Card */}
      <Card>
        <CardContent className="pt-6">
          {!isScanning && !isManualSearch ? (
            <div className="space-y-4">
              <Button
                onClick={startScanning}
                className="w-full"
                size="lg"
                variant="default"
              >
                <QrCode className="mr-2 h-5 w-5" />
                Scan QR Code
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <Button
                onClick={() => setIsManualSearch(true)}
                className="w-full"
                size="lg"
                variant="outline"
              >
                <Search className="mr-2 h-5 w-5" />
                Search Guest
              </Button>
              
              {lastCheckIn && (
                <Alert variant={lastCheckIn.success ? 'default' : 'destructive'}>
                  {lastCheckIn.success ? (
                    <>
                      <Check className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium">{lastCheckIn.guestName} checked in</div>
                        {lastCheckIn.tableNumber && (
                          <div className="text-sm">Table {lastCheckIn.tableNumber}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatTime(lastCheckIn.checkInTime!)}
                        </div>
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{lastCheckIn.message}</AlertDescription>
                    </>
                  )}
                </Alert>
              )}
            </div>
          ) : isScanning ? (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-white/20 m-8 rounded-lg" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-48 h-48 border-2 border-primary rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
              
              <Button
                onClick={stopScanning}
                className="w-full"
                variant="outline"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Scanning
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  className="flex-1"
                />
                <Button onClick={handleManualSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={() => {
                  setIsManualSearch(false);
                  setSearchQuery('');
                }}
                className="w-full"
                variant="outline"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}