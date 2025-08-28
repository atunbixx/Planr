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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FeatureFlag, FeatureFlagType } from '@prisma/client';

interface FlagFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flag: FeatureFlag | null;
  onSuccess: () => void;
}

export function FlagFormDialog({ isOpen, onClose, flag, onSuccess }: FlagFormDialogProps) {
  const [key, setKey] = React.useState('');
  const [type, setType] = React.useState<FeatureFlagType>('BOOLEAN');
  const [enabled, setEnabled] = React.useState(false);
  const [percent, setPercent] = React.useState(0);
  const [rulesJson, setRulesJson] = React.useState('{}');

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isEditing = flag !== null;

  React.useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setKey(flag.key);
        setType(flag.type);
        setEnabled(flag.enabled ?? false);
        setPercent(flag.percent ?? 0);
        setRulesJson(flag.rulesJson ? JSON.stringify(flag.rulesJson, null, 2) : '{}');
      } else {
        // Reset for new flag
        setKey('');
        setType('BOOLEAN');
        setEnabled(false);
        setPercent(0);
        setRulesJson('{}');
      }
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, isEditing, flag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    let parsedRules;
    try {
      parsedRules = JSON.parse(rulesJson);
    } catch {
      setError('Invalid JSON in rules.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          type,
          enabled: type === 'BOOLEAN' ? enabled : null,
          percent: type === 'PERCENT_ROLL' ? percent : null,
          rulesJson: parsedRules,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save flag.');
      }

      onSuccess();
      onClose();

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Create'} Feature Flag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="key" className="text-right">Key</Label>
              <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} className="col-span-3" required disabled={isEditing} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Select onValueChange={(v) => setType(v as FeatureFlagType)} defaultValue={type}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FeatureFlagType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {type === 'BOOLEAN' && (
              <div className="flex items-center space-x-2 col-start-2 col-span-3">
                <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            )}

            {type === 'PERCENT_ROLL' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="percent" className="text-right">Percent</Label>
                <Input id="percent" type="number" min="0" max="100" value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="col-span-3" />
              </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="rulesJson" className="text-right pt-2">Rules JSON</Label>
              <Textarea id="rulesJson" value={rulesJson} onChange={(e) => setRulesJson(e.target.value)} className="col-span-3" rows={5} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Flag'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
