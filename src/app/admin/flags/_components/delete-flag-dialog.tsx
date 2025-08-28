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
import { FeatureFlag } from '@prisma/client';

interface DeleteFlagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flag: FeatureFlag | null;
  onSuccess: () => void;
}

export function DeleteFlagDialog({ isOpen, onClose, flag, onSuccess }: DeleteFlagDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!flag) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/flags/${flag.key}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete flag.');
      }

      onSuccess();
      onClose();

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!flag) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Feature Flag</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the flag "{flag.key}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-red-500 py-4">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete Flag'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
