import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'h:mm a');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDate(d);
  const timeStr = formatTime(d);
  
  return `${dateStr} at ${timeStr}`;
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getTimeDifference(start: Date | string, end: Date | string): string {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  
  if (diffMinutes === 0) return 'On time';
  if (diffMinutes > 0) return `${diffMinutes}m late`;
  return `${Math.abs(diffMinutes)}m early`;
}

export function isOverdue(scheduledTime: Date | string, currentStatus: string = 'scheduled'): boolean {
  if (currentStatus !== 'scheduled') return false;
  const scheduled = typeof scheduledTime === 'string' ? new Date(scheduledTime) : scheduledTime;
  return scheduled < new Date();
}