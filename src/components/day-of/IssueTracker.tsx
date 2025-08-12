import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, MessageSquare, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/inputs';
import { cn } from '@/lib/utils';
import { IssueStatus, IssuePriority } from '@prisma/client';
import { formatTime, getRelativeTime } from '@/lib/utils/date';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  reported_at: Date | string;
  acknowledged_at?: Date | string | null;
  resolved_at?: Date | string | null;
  assigned_to?: string | null;
  resolution_notes?: string | null;
  related_vendor?: {
    id: string;
    name: string;
  } | null;
  related_event?: {
    id: string;
    event_name: string;
  } | null;
  reported_by?: {
    id: string;
    email: string;
  } | null;
}

interface IssueTrackerProps {
  issue: Issue;
  onStatusChange: (status: IssueStatus) => void;
  onPriorityChange: (priority: IssuePriority) => void;
  onAssign: (assignee: string) => void;
  onResolve: (notes: string) => void;
}

export const IssueTracker: React.FC<IssueTrackerProps> = ({
  issue,
  onStatusChange,
  onPriorityChange,
  onAssign,
  onResolve,
}) => {
  const [showResolution, setShowResolution] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assignee, setAssignee] = useState(issue.assigned_to || '');

  const getPriorityColor = (priority: IssuePriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'escalated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: IssueStatus) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'escalated':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const handleResolve = () => {
    onResolve(resolutionNotes);
    setShowResolution(false);
    setResolutionNotes('');
  };

  const handleAssign = () => {
    onAssign(assignee);
  };

  const getElapsedTime = () => {
    const reportedTime = new Date(issue.reported_at);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - reportedTime.getTime()) / 60000);
    
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-200',
        issue.priority === 'critical' && issue.status !== 'resolved' && 'border-red-500 shadow-lg'
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{issue.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
          </div>
          <div className="flex gap-2">
            <Badge className={getPriorityColor(issue.priority)}>
              {issue.priority}
            </Badge>
            <Badge className={cn('flex items-center gap-1', getStatusColor(issue.status))}>
              {getStatusIcon(issue.status)}
              <span className="capitalize">{issue.status.replace('_', ' ')}</span>
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Reported:</span> {getElapsedTime()}
          </div>
          {issue.related_vendor && (
            <div>
              <span className="font-medium">Vendor:</span> {issue.related_vendor.name}
            </div>
          )}
          {issue.related_event && (
            <div>
              <span className="font-medium">Event:</span> {issue.related_event.event_name}
            </div>
          )}
          {issue.assigned_to && (
            <div>
              <span className="font-medium">Assigned:</span> {issue.assigned_to}
            </div>
          )}
        </div>

        {issue.status === 'resolved' && issue.resolution_notes && (
          <div className="p-2 bg-green-50 rounded text-sm">
            <strong>Resolution:</strong> {issue.resolution_notes}
            {issue.resolved_at && (
              <span className="text-xs text-gray-600 ml-2">
                (Resolved {getRelativeTime(issue.resolved_at)})
              </span>
            )}
          </div>
        )}

        {showResolution ? (
          <div className="space-y-2">
            <Input
              type="text"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Resolution notes..."
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleResolve}>
                Resolve Issue
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowResolution(false);
                  setResolutionNotes('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {issue.status === 'reported' && (
              <Button
                size="sm"
                onClick={() => onStatusChange('acknowledged')}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Acknowledge
              </Button>
            )}
            
            {issue.status === 'acknowledged' && (
              <Button
                size="sm"
                onClick={() => onStatusChange('in_progress')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Working
              </Button>
            )}
            
            {issue.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={() => setShowResolution(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Resolve
              </Button>
            )}
            
            {issue.status !== 'resolved' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange('escalated')}
                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                >
                  Escalate
                </Button>
                
                <div className="flex items-center gap-2 ml-auto">
                  <Input
                    type="text"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    placeholder="Assign to..."
                    className="text-sm w-32"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAssign}
                  >
                    Assign
                  </Button>
                </div>
              </>
            )}
            
            {issue.status === 'resolved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange('in_progress')}
              >
                Reopen
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};