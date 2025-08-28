'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Vendor, VendorSanction, SanctionType } from '@prisma/client';

type SanctionsTabProps = {
  vendor: Vendor & { sanctions: VendorSanction[] };
};

export function SanctionsTab({ vendor }: SanctionsTabProps) {
  const [type, setType] = React.useState<SanctionType>('WARN');
  const [reasonCode, setReasonCode] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}/sanction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, reasonCode, notes, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to apply sanction.');
      }
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Apply New Sanction</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select onValueChange={(v) => setType(v as SanctionType)} defaultValue={type}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.values(SanctionType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reasonCode">Reason Code</Label>
              <Input id="reasonCode" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="expiresAt">Expires At (Optional)</Label>
              <Input id="expiresAt" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Applying...' : 'Apply Sanction'}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Sanction History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendor.sanctions.length === 0 && <p className="text-muted-foreground">No sanctions found.</p>}
            {vendor.sanctions.map(s => (
              <div key={s.id} className="border-b pb-2">
                <div className="flex justify-between items-center">
                  <Badge>{s.type}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</span>
                </div>
                <p className="font-medium mt-1">{s.reasonCode}</p>
                {s.notes && <p className="text-sm text-muted-foreground mt-1">{s.notes}</p>}
                {s.expiresAt && <p className="text-xs text-muted-foreground mt-1">Expires: {new Date(s.expiresAt).toLocaleString()}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
