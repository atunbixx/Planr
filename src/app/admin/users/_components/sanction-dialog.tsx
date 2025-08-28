'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, UserProfile, SanctionType } from '@prisma/client';

type UserWithProfile = User & { profile: UserProfile | null };

interface SanctionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithProfile | null;
  onSuccess: () => void;
}

export function SanctionDialog({ isOpen, onClose, user, onSuccess }: SanctionDialogProps) {
  const [type, setType] = React.useState<SanctionType>('WARN');
  const [reasonCode, setReasonCode] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      // Reset form on close
      setType('WARN');
      setReasonCode('');
      setNotes('');
      setExpiresAt('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/sanction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type,
          reasonCode,
          notes,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to apply sanction.');
      }

      onSuccess();
      onClose();

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply Sanction to {user.email}</DialogTitle>
          <DialogDescription>
            Select the sanction type and provide details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Select onValueChange={(value) => setType(value as SanctionType)} defaultValue={type}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a sanction type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SanctionType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reasonCode" className="text-right">Reason Code</Label>
              <Input id="reasonCode" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiresAt" className="text-right">Expires At</Label>
              <Input id="expiresAt" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Apply Sanction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
