'use client';

import React from 'react';
import { Check, CheckCheck, Clock, X, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageStatusProps {
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'retrying';
  timestamp?: string;
  className?: string;
  onRetry?: () => void;
}

export function MessageStatus({ status, timestamp, className, onRetry }: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'queued':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sending':
        return <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <X className="h-3 w-3 text-red-500" />;
      case 'retrying':
        return <RefreshCw className="h-3 w-3 text-orange-500 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return 'Failed to send';
      case 'retrying':
        return 'Retrying...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'queued':
      case 'sending':
      case 'sent':
      case 'delivered':
        return 'text-gray-400';
      case 'read':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      case 'retrying':
        return 'text-orange-500';
    }
  };

  return (
    <div className={cn('flex items-center gap-1 text-xs mt-1', className)}>
      {getStatusIcon()}
      <span className={getStatusColor()}>{getStatusText()}</span>
      {timestamp && status !== 'failed' && status !== 'retrying' && (
        <span className="text-gray-400">
          • {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      {status === 'failed' && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-auto p-0 ml-2 text-xs text-blue-500 hover:text-blue-600"
        >
          Retry
        </Button>
      )}
    </div>
  );
}