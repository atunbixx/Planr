'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vendor } from '@prisma/client';

type CreditsTabProps = {
  vendor: Vendor;
};

export function CreditsTab({ vendor }: CreditsTabProps) {
  const [delta, setDelta] = React.useState(0);
  const [reason, setReason] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: Number(delta), reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add credits.');
      }
      setSuccess(true);
      setDelta(0);
      setReason('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Grant Promotional Credits</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="delta">Amount</Label>
            <Input id="delta" type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} required />
            <p className="text-xs text-muted-foreground mt-1">Use a positive value to add credits, negative to remove.</p>
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">Credits granted successfully!</p>}
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Submitting...' : 'Grant Credits'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
