'use client';

import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Edit2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageBubbleProps {
  id: string;
  content: string;
  senderType: 'couple' | 'vendor' | 'system';
  senderName?: string;
  timestamp: Date;
  isRead?: boolean;
  readAt?: Date;
  isEdited?: boolean;
  editedAt?: Date;
  attachments?: any[];
  reactions?: { reaction: string; count: number; hasReacted: boolean }[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReact?: (id: string, reaction: string) => void;
  onReply?: (id: string) => void;
}

export function MessageBubble({
  id,
  content,
  senderType,
  senderName,
  timestamp,
  isRead,
  readAt,
  isEdited,
  editedAt,
  attachments = [],
  reactions = [],
  onEdit,
  onDelete,
  onReact,
  onReply,
}: MessageBubbleProps) {
  const isOwn = senderType === 'couple';
  const isSystem = senderType === 'system';

  const handleReaction = (reaction: string) => {
    onReact?.(id, reaction);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 mb-4', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl p-4 relative group',
          isOwn
            ? 'bg-pink-500 text-white ml-12'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-12'
        )}
      >
        {/* Sender name for vendor messages */}
        {!isOwn && senderName && (
          <div className="text-xs font-medium mb-1 opacity-80">{senderName}</div>
        )}

        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">{content}</div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {attachments.map((attachment, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-lg p-2 flex items-center gap-2',
                  isOwn ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                )}
              >
                <span className="text-sm truncate">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp and status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 text-xs',
            isOwn ? 'text-pink-100' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          <span title={format(timestamp, 'PPpp')}>
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
          {isEdited && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Edit2 className="w-3 h-3" />
                edited
              </span>
            </>
          )}
          {isOwn && (
            <>
              <span>·</span>
              {isRead ? (
                <CheckCheck className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </>
          )}
        </div>

        {/* Actions menu */}
        <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  isOwn
                    ? 'hover:bg-pink-600 text-white'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onReply && (
                <DropdownMenuItem onClick={() => onReply(id)}>
                  Reply
                </DropdownMenuItem>
              )}
              {isOwn && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(id)}>
                  Edit
                </DropdownMenuItem>
              )}
              {isOwn && onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(id)}
                  className="text-red-600 dark:text-red-400"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {reactions.map((reaction, idx) => (
              <button
                key={idx}
                onClick={() => handleReaction(reaction.reaction)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors',
                  reaction.hasReacted
                    ? isOwn
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                    : isOwn
                    ? 'bg-pink-400/30 hover:bg-pink-400/50'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <span>{reaction.reaction}</span>
                {reaction.count > 1 && (
                  <span className="text-xs">{reaction.count}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}