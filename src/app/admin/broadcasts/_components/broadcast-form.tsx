'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MessageChannel } from '@prisma/client';

export function BroadcastForm() {
  // Form state
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [channel, setChannel] = React.useState<MessageChannel>('EMAIL');
  const [segmentJson, setSegmentJson] = React.useState('{}');

  // API interaction state
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any>(null);

  const handleApiCall = async (dryRun: boolean) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    let parsedSegment;
    try {
      parsedSegment = JSON.parse(segmentJson);
    } catch (e) {
      setError('Invalid JSON in segment.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/broadcast?dryRun=${dryRun}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          channel,
          segmentJson: parsedSegment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'An unknown error occurred.');
      }

      setResult(data);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-card shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="font-medium text-foreground">Broadcast Composer</h3>
      </div>
      <div className="p-6.5">
        <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
          <div className="w-full xl:w-1/2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="w-full xl:w-1/2">
            <Label htmlFor="channel">Channel</Label>
            <Select onValueChange={(value) => setChannel(value as MessageChannel)} defaultValue={channel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MessageChannel).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="body">Body</Label>
          <Textarea id="body" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>

        <div className="mb-6">
          <Label htmlFor="segmentJson">Segment JSON</Label>
          <Textarea id="segmentJson" rows={4} value={segmentJson} onChange={(e) => setSegmentJson(e.target.value)} />
          <p className="text-xs mt-1">Example: {`{"plan": "pro", "country": "NG"}`}</p>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => handleApiCall(true)} disabled={isLoading}>
            {isLoading ? 'Running...' : 'Dry Run'}
          </Button>
          <Button onClick={() => handleApiCall(false)} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </div>

        {error && <p className="mt-4 text-red-500">Error: {error}</p>}

        {result && (
          <div className="mt-4 rounded-md bg-secondary p-4">
            <h4 className="font-bold">Result:</h4>
            {result.dryRun ? (
              <p>Dry run complete. Audience count: {result.audienceCount}</p>
            ) : (
              <p>Broadcast created successfully! It will be sent to {result.sentCount} users.</p>
            )}
            <pre className="mt-2 text-xs bg-background p-2 rounded-md overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
