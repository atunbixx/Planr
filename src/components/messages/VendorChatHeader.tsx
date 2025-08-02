'use client';

import React from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Circle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VendorChatHeaderProps {
  vendorName: string;
  vendorCategory?: string;
  vendorAvatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  onBack?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onViewDetails?: () => void;
  onViewContract?: () => void;
  onScheduleMeeting?: () => void;
  className?: string;
}

export function VendorChatHeader({
  vendorName,
  vendorCategory,
  vendorAvatar,
  isOnline = false,
  lastSeen,
  onBack,
  onCall,
  onVideoCall,
  onViewDetails,
  onViewContract,
  onScheduleMeeting,
  className,
}: VendorChatHeaderProps) {
  const getAvatarFallback = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusText = () => {
    if (isOnline) return 'Active now';
    if (lastSeen) {
      const minutesAgo = Math.floor((Date.now() - lastSeen.getTime()) / 60000);
      if (minutesAgo < 1) return 'Active just now';
      if (minutesAgo < 60) return `Active ${minutesAgo}m ago`;
      const hoursAgo = Math.floor(minutesAgo / 60);
      if (hoursAgo < 24) return `Active ${hoursAgo}h ago`;
      const daysAgo = Math.floor(hoursAgo / 24);
      return `Active ${daysAgo}d ago`;
    }
    return 'Offline';
  };

  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Back button (mobile) */}
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Avatar */}
        <div className="relative">
          {vendorAvatar ? (
            <img
              src={vendorAvatar}
              alt={vendorName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
              <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                {getAvatarFallback(vendorName)}
              </span>
            </div>
          )}
          {isOnline && (
            <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
          )}
        </div>

        {/* Vendor info */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {vendorName}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            {vendorCategory && (
              <>
                <span>{vendorCategory}</span>
                <span>·</span>
              </>
            )}
            <span className="flex items-center gap-1">
              {isOnline && <Circle className="w-2 h-2 fill-green-500" />}
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onCall && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCall}
            className="hidden sm:flex"
          >
            <Phone className="h-5 w-5" />
          </Button>
        )}

        {onVideoCall && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onVideoCall}
            className="hidden sm:flex"
          >
            <Video className="h-5 w-5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {onCall && (
              <DropdownMenuItem onClick={onCall} className="sm:hidden">
                <Phone className="mr-2 h-4 w-4" />
                Voice call
              </DropdownMenuItem>
            )}
            {onVideoCall && (
              <DropdownMenuItem onClick={onVideoCall} className="sm:hidden">
                <Video className="mr-2 h-4 w-4" />
                Video call
              </DropdownMenuItem>
            )}
            {(onCall || onVideoCall) && <DropdownMenuSeparator className="sm:hidden" />}
            
            {onViewDetails && (
              <DropdownMenuItem onClick={onViewDetails}>
                View vendor details
              </DropdownMenuItem>
            )}
            {onViewContract && (
              <DropdownMenuItem onClick={onViewContract}>
                View contract
              </DropdownMenuItem>
            )}
            {onScheduleMeeting && (
              <DropdownMenuItem onClick={onScheduleMeeting}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule meeting
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 dark:text-red-400">
              Block vendor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}