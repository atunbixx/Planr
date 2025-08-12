'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/advanced';
import { Button } from '@/components/ui/button';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { cn } from '@/lib/utils';
import { formatTime, isOverdue } from '@/lib/utils/date';

interface TimelineEvent {
  id: string;
  title: string;
  time: Date;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed';
  category: 'ceremony' | 'reception' | 'photos' | 'preparation' | 'other';
  description?: string;
  vendor?: string;
  location?: string;
}

interface MobileTimelineProps {
  events: TimelineEvent[];
  currentTime?: Date;
  onEventClick?: (event: TimelineEvent) => void;
  onStatusChange?: (eventId: string, status: TimelineEvent['status']) => void;
}

const STATUS_COLORS = {
  scheduled: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  delayed: 'bg-red-500',
};

const STATUS_ICONS = {
  scheduled: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  delayed: AlertCircle,
};

const CATEGORY_COLORS = {
  ceremony: 'bg-purple-100 text-purple-800',
  reception: 'bg-pink-100 text-pink-800',
  photos: 'bg-blue-100 text-blue-800',
  preparation: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};

export default function MobileTimeline({
  events,
  currentTime = new Date(),
  onEventClick,
  onStatusChange,
}: MobileTimelineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardWidth = useRef(0);

  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => a.time.getTime() - b.time.getTime());

  // Find current or next event
  useEffect(() => {
    const currentOrNextIndex = sortedEvents.findIndex(
      event => event.status === 'in_progress' || event.time > currentTime
    );
    if (currentOrNextIndex !== -1) {
      setCurrentIndex(currentOrNextIndex);
    }
  }, [sortedEvents, currentTime]);

  // Calculate card width
  useEffect(() => {
    if (containerRef.current) {
      cardWidth.current = containerRef.current.clientWidth;
    }
  }, []);

  // Navigate to previous event
  const goToPrevious = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(currentIndex - 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Navigate to next event
  const goToNext = () => {
    if (currentIndex < sortedEvents.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Handle swipe gestures
  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      goToNext();
    } else {
      goToPrevious();
    }
  };

  // Set up touch gestures
  const touchRef = useTouchGestures<HTMLDivElement>({
    onSwipe: handleSwipe,
    onTap: (point) => {
      if (onEventClick && sortedEvents[currentIndex]) {
        onEventClick(sortedEvents[currentIndex]);
      }
    },
    minSwipeDistance: 50,
    minSwipeVelocity: 0.3,
  });

  const currentEvent = sortedEvents[currentIndex];
  const StatusIcon = currentEvent ? STATUS_ICONS[currentEvent.status] : Circle;
  const isEventOverdue = currentEvent && isOverdue(currentEvent.time, currentEvent.status);

  return (
    <div className="space-y-4">
      {/* Progress Dots */}
      <div className="flex justify-center items-center gap-2 px-4">
        {sortedEvents.map((event, index) => (
          <button
            key={event.id}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              index === currentIndex
                ? 'w-8 bg-primary'
                : index < currentIndex
                ? 'bg-primary/50'
                : 'bg-gray-300'
            )}
            aria-label={`Go to ${event.title}`}
          />
        ))}
      </div>

      {/* Event Cards */}
      <div 
        ref={(el) => {
          if (el) {
            (touchRef as any).current = el;
            containerRef.current = el;
          }
        }}
        className="relative h-[400px] overflow-hidden"
      >
        <div
          className="flex transition-transform duration-300 ease-out h-full"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {sortedEvents.map((event, index) => (
            <div
              key={event.id}
              className="w-full flex-shrink-0 px-4"
            >
              <Card className="h-full">
                <CardContent className="p-6 h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center',
                        STATUS_COLORS[event.status],
                        'text-white'
                      )}>
                        <StatusIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(event.time)} • {event.duration} min
                        </p>
                      </div>
                    </div>
                    {isEventOverdue && (
                      <Badge variant="destructive" className="animate-pulse">
                        Overdue
                      </Badge>
                    )}
                  </div>

                  {/* Category Badge */}
                  <Badge
                    variant="secondary"
                    className={cn('self-start mb-4', CATEGORY_COLORS[event.category])}
                  >
                    {event.category}
                  </Badge>

                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    {event.description && (
                      <p className="text-sm">{event.description}</p>
                    )}
                    
                    {event.vendor && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Vendor:</span>
                        <span className="text-muted-foreground">{event.vendor}</span>
                      </div>
                    )}
                    
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Location:</span>
                        <span className="text-muted-foreground">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  {onStatusChange && (
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      {event.status === 'scheduled' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStatusChange(event.id, 'in_progress')}
                          >
                            Start
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStatusChange(event.id, 'delayed')}
                          >
                            Delay
                          </Button>
                        </>
                      )}
                      {event.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onStatusChange(event.id, 'completed')}
                          className="col-span-2"
                        >
                          Mark Complete
                        </Button>
                      )}
                      {event.status === 'delayed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStatusChange(event.id, 'in_progress')}
                          className="col-span-2"
                        >
                          Resume
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <Button
          size="icon"
          variant="ghost"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10',
            'bg-white/80 backdrop-blur-sm shadow-lg',
            currentIndex === 0 && 'opacity-50'
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={goToNext}
          disabled={currentIndex === sortedEvents.length - 1}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10',
            'bg-white/80 backdrop-blur-sm shadow-lg',
            currentIndex === sortedEvents.length - 1 && 'opacity-50'
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Timeline Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {sortedEvents.filter(e => e.status === 'completed').length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {sortedEvents.filter(e => e.status === 'in_progress').length}
              </p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {sortedEvents.filter(e => e.status === 'scheduled').length}
              </p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {sortedEvents.filter(e => e.status === 'delayed').length}
              </p>
              <p className="text-xs text-muted-foreground">Delayed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}