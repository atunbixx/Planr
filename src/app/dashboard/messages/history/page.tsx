'use client';

import { MessageHistory } from '@/components/messages/MessageHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MessageHistoryPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/messages">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Message History</h1>
            <p className="text-muted-foreground">View all sent messages and their delivery status</p>
          </div>
        </div>
      </div>

      <MessageHistory limit={100} showStats={true} />
    </div>
  );
}