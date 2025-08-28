'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Vendor, VendorVerification } from '@prisma/client';

type VerificationTabProps = {
  vendor: Vendor & { verificationDetails: VendorVerification | null };
};

export function VerificationTab({ vendor }: VerificationTabProps) {
  const [notes, setNotes] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (approve: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approve,
          notes,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Verification update failed.');
      }
      // Refresh the page to see changes
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Verification</CardTitle>
        <CardDescription>Review and approve/reject the vendor's verification status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium">Current Status</h4>
          <Badge>{vendor.verification}</Badge>
        </div>
        {vendor.verificationDetails && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Last Reviewed By: {vendor.verificationDetails.reviewerId}</p>
            <p>Last Reviewed At: {new Date(vendor.verificationDetails.reviewedAt!).toLocaleString()}</p>
            <p>Expires At: {vendor.verificationDetails.expiresAt ? new Date(vendor.verificationDetails.expiresAt).toLocaleDateString() : 'N/A'}</p>
            <p>Notes: {vendor.verificationDetails.notes || 'N/A'}</p>
          </div>
        )}

        <div className="space-y-4 border-t pt-6">
          <h4 className="font-medium">Update Status</h4>
          <div className="space-y-2">
            <Label htmlFor="notes">Review Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Verification Expires At (Optional)</Label>
            <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-4">
            <Button onClick={() => handleSubmit(true)} disabled={isLoading}>Approve</Button>
            <Button variant="destructive" onClick={() => handleSubmit(false)} disabled={isLoading}>Reject</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
