import React from 'react';
import { Clock, MapPin, User, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TimelineEvent as TimelineEventType, EventStatus } from '@prisma/client';
import { formatTime, getRelativeTime } from '@/lib/utils/date';

interface TimelineEventProps {
  event: TimelineEventType & {
    responsible_vendor?: {
      id: string;
      name: string;
      phone: string | null;
    };
  };
  onStatusChange: (status: EventStatus) => void;
  onEdit: () => void;
  isActive?: boolean;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({
  event,
  onStatusChange,
  onEdit,
  isActive = false,
}) => {
  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delayed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Play className="w-4 h-4" />;
      case 'delayed':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <Pause className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getNextStatus = (): EventStatus => {
    switch (event.status) {
      case 'scheduled':
        return 'in_progress';
      case 'in_progress':
        return 'completed';
      case 'completed':
        return 'scheduled';
      default:
        return 'scheduled';
    }
  };

  const isOverdue = () => {
    if (event.status !== 'scheduled') return false;
    const scheduledTime = new Date(event.scheduled_time);
    return scheduledTime < new Date();
  };

  const getTimeDifference = () => {
    if (!event.actual_start_time) return null;
    
    const scheduled = new Date(event.scheduled_time);
    const actual = new Date(event.actual_start_time);
    const diffMinutes = Math.round((actual.getTime() - scheduled.getTime()) / 60000);
    
    if (diffMinutes === 0) return 'On time';
    if (diffMinutes > 0) return `${diffMinutes}m late`;
    return `${Math.abs(diffMinutes)}m early`;
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-200',
        isActive && 'ring-2 ring-blue-500 shadow-lg',
        isOverdue() && 'border-red-500'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">
                {event.is_milestone && '⭐ '}
                {event.event_name}
              </h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(event.scheduled_time)}</span>
                  {getTimeDifference() && (
                    <span className="text-xs ml-1">({getTimeDifference()})</span>
                  )}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge
              className={cn(
                'flex items-center gap-1',
                getStatusColor(event.status)
              )}
            >
              {getStatusIcon(event.status)}
              <span className="capitalize">{event.status.replace('_', ' ')}</span>
            </Badge>
          </div>

          {event.description && (
            <p className="text-sm text-gray-600">{event.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              {event.responsible_vendor && (
                <div className="flex items-center gap-1 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{event.responsible_vendor.name}</span>
                  {event.responsible_vendor.phone && (
                    <a
                      href={`tel:${event.responsible_vendor.phone}`}
                      className="ml-1 text-blue-600 hover:underline"
                    >
                      {event.responsible_vendor.phone}
                    </a>
                  )}
                </div>
              )}
              {event.responsible_staff && (
                <div className="flex items-center gap-1 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{event.responsible_staff}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
              >
                Edit
              </Button>
              {event.status !== 'cancelled' && (
                <Button
                  size="sm"
                  onClick={() => onStatusChange(getNextStatus())}
                  className={cn(
                    event.status === 'scheduled' && 'bg-blue-600 hover:bg-blue-700',
                    event.status === 'in_progress' && 'bg-green-600 hover:bg-green-700'
                  )}
                >
                  {event.status === 'scheduled' && 'Start'}
                  {event.status === 'in_progress' && 'Complete'}
                  {event.status === 'completed' && 'Reopen'}
                </Button>
              )}
            </div>
          </div>

          {event.notes && (
            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
              <strong>Notes:</strong> {event.notes}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};