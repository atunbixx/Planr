'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Users, AlertTriangle, CheckCircle, Cloud, Calendar, Plus, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimelineEvent } from '@/components/day-of/TimelineEvent';
import { VendorCheckIn } from '@/components/day-of/VendorCheckIn';
import { IssueTracker } from '@/components/day-of/IssueTracker';
import { useDayOfWebSocket } from '@/hooks/useWebSocket';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/utils/date';

interface TimelineItem {
  id: string
  event_name: string
  scheduled_time: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed'
  notes?: string
  vendor_id?: string
  duration_minutes?: number
}

interface Vendor {
  id: string
  name: string
  category: string
  status: 'not_arrived' | 'checked_in' | 'setup_complete' | 'departed'
  arrival_time?: string
  phone?: string
}

interface Issue {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved'
  created_at: string
  assigned_to?: string
}

export default function DayOfDashboardPage() {
  const { isOffline } = usePWA();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);

  // WebSocket connection
  const {
    connected,
    updateTimeline,
    checkInVendor,
    createIssue,
    updateIssue,
    checkInGuest,
    updateWeather,
    on,
    off,
  } = useDayOfWebSocket('current-couple-id'); // TODO: Get from context

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load dashboard data
  useEffect(() => {
    loadDashboard();
  }, []);

  // WebSocket event listeners
  useEffect(() => {
    const handleTimelineUpdate = (data: any) => {
      // Update local state with real-time changes
      setDashboardData((prev: any) => {
        if (!prev) return prev;
        // Update timeline event in state
        return {
          ...prev,
          timeline: {
            ...prev.timeline,
            // Update counts based on status change
          },
        };
      });
    };

    const handleVendorUpdate = (data: any) => {
      // Update vendor check-in status
      loadDashboard(); // For now, just reload
    };

    const handleIssueUpdate = (data: any) => {
      // Update issue in state
      loadDashboard(); // For now, just reload
    };

    on('timeline:updated', handleTimelineUpdate);
    on('vendor:checked-in', handleVendorUpdate);
    on('issue:updated', handleIssueUpdate);

    return () => {
      off('timeline:updated', handleTimelineUpdate);
      off('vendor:checked-in', handleVendorUpdate);
      off('issue:updated', handleIssueUpdate);
    };
  }, [on, off]);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard/day-of', {
        headers: {
          'x-couple-id': 'current-couple-id', // TODO: Get from context
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimelineStatusChange = async (eventId: string, status: string) => {
    updateTimeline(eventId, status);
    // Optimistically update UI
    await loadDashboard();
  };

  const handleVendorCheckIn = async (vendorId: string) => {
    checkInVendor(vendorId, 'checked_in');
    await loadDashboard();
  };

  const handleVendorSetupComplete = async (vendorId: string) => {
    checkInVendor(vendorId, 'setup_complete');
    await loadDashboard();
  };

  const handleCreateIssue = async (issue: any) => {
    createIssue(issue);
    await loadDashboard();
  };

  const handleUpdateIssue = async (issueId: string, updates: any) => {
    updateIssue(issueId, updates);
    await loadDashboard();
  };

  if (loading || !dashboardData) {
    return (
      <div className="px-8 py-12">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200/50 rounded-sm"></div>
        </div>
      </div>
    );
  }

  const { timeline, vendors, guests, issues, weather, config } = dashboardData;

  // Calculate next event
  const upcomingEvents = timeline.events?.filter((e: any) => 
    e.status === 'scheduled' && new Date(e.scheduled_time) > currentTime
  ) || [];
  const nextEvent = upcomingEvents[0];

  // Format time for display
  const formatTimeOnly = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'delayed': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  return (
    <div className="px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Day of Wedding</h1>
            <div className="flex items-center gap-6 text-sm font-light text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-lg font-normal">{formatTimeOnly(currentTime)}</span>
            </div>
            {weather && (
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-gray-400" />
                <span>{weather.temperature_fahrenheit}°F • {weather.condition}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isOffline && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-light">Offline Mode</Badge>
          )}
          {connected && (
            <Badge variant="outline" className="text-green-600 border-green-600 font-light">
              Live Updates
            </Badge>
          )}
        </div>
      </div>
    </div>

    {/* Stats Overview */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
      <div className="bg-white p-6 rounded-sm shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-green-600">
            <CheckCircle className="w-10 h-10" />
          </div>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Timeline</p>
        </div>
        <p className="text-3xl font-light text-gray-900">
          {timeline.completed}/{timeline.total_events}
        </p>
        {nextEvent && (
          <p className="text-xs font-light text-gray-600 mt-2">
            Next: {nextEvent.event_name} at {formatTimeOnly(nextEvent.scheduled_time)}
          </p>
        )}
      </div>

      <div className="bg-white p-6 rounded-sm shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-blue-600">
            <Users className="w-10 h-10" />
          </div>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Vendors</p>
        </div>
        <p className="text-3xl font-light text-gray-900">
          {vendors.checked_in}/{vendors.total}
        </p>
        <p className="text-xs font-light text-gray-600 mt-2">
          {vendors.setup_complete} setup complete
        </p>
      </div>

      <div className="bg-white p-6 rounded-sm shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-purple-600">
            <Users className="w-10 h-10" />
          </div>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Guests</p>
        </div>
        <p className="text-3xl font-light text-gray-900">
          {guests.checked_in}/{guests.total_expected}
        </p>
        <p className="text-xs font-light text-gray-600 mt-2">
          {guests.meals_served} meals served
        </p>
      </div>

      <div className="bg-white p-6 rounded-sm shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            issues.critical > 0 ? 'text-red-600' : 'text-gray-400'
          )}>
            <AlertTriangle className="w-10 h-10" />
          </div>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Issues</p>
        </div>
        <p className="text-3xl font-light text-gray-900">
          {issues.active}
        </p>
        {issues.critical > 0 && (
          <p className="text-xs font-light text-red-600 mt-2">
            {issues.critical} critical issue{issues.critical !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>

    {/* Main Content Tabs */}
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-sm shadow-sm">
        <TabsTrigger value="timeline" className="rounded-sm font-light tracking-wide uppercase text-xs data-[state=active]:bg-[#7a9b7f] data-[state=active]:text-white">
          Timeline
          {timeline.delayed > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {timeline.delayed}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="vendors" className="rounded-sm font-light tracking-wide uppercase text-xs data-[state=active]:bg-[#7a9b7f] data-[state=active]:text-white">
          Vendors
          {vendors.not_arrived > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {vendors.not_arrived}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="issues" className="rounded-sm font-light tracking-wide uppercase text-xs data-[state=active]:bg-[#7a9b7f] data-[state=active]:text-white">
          Issues
          {issues.active > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {issues.active}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="guests" className="rounded-sm font-light tracking-wide uppercase text-xs data-[state=active]:bg-[#7a9b7f] data-[state=active]:text-white">Guests</TabsTrigger>
      </TabsList>

      <TabsContent value="timeline" className="space-y-6">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Event Timeline</h2>
            <Button 
              onClick={() => setIsAddingEvent(true)}
              className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
          
          {/* Timeline visualization */}
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {dashboardData?.timeline?.events?.length > 0 ? (
                dashboardData.timeline.events.map((event: TimelineItem, index: number) => {
                  const isCompleted = event.status === 'completed'
                  const isInProgress = event.status === 'in_progress'
                  const isDelayed = event.status === 'delayed'
                  const isPast = new Date(event.scheduled_time) < currentTime
                  
                  return (
                    <div key={event.id} className="relative flex items-start gap-6">
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute left-6 w-5 h-5 rounded-full border-2 bg-white z-10",
                        isCompleted ? "border-green-600" : 
                        isInProgress ? "border-blue-600" :
                        isDelayed ? "border-red-600" :
                        isPast ? "border-gray-400" : "border-gray-300"
                      )}>
                        {isCompleted && <CheckCircle className="w-3 h-3 text-green-600 absolute inset-0 m-auto" />}
                        {isInProgress && <div className="w-2 h-2 bg-blue-600 rounded-full absolute inset-0 m-auto animate-pulse" />}
                        {isDelayed && <AlertCircle className="w-3 h-3 text-red-600 absolute inset-0 m-auto" />}
                      </div>
                      
                      {/* Event card */}
                      <div className="flex-1 ml-12">
                        <div className={cn(
                          "p-4 rounded-sm border transition-all",
                          isInProgress ? "bg-blue-50 border-blue-200" :
                          isDelayed ? "bg-red-50 border-red-200" :
                          isCompleted ? "bg-green-50 border-green-200" :
                          "bg-white border-gray-200 hover:border-gray-300"
                        )}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-normal text-gray-900">{event.event_name}</h3>
                              <p className="text-sm font-light text-gray-600 mt-1">
                                {formatTimeOnly(event.scheduled_time)}
                                {event.duration_minutes && ` • ${event.duration_minutes} minutes`}
                              </p>
                              {event.notes && (
                                <p className="text-sm font-light text-gray-500 mt-2">{event.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs font-light",
                                  getStatusColor(event.status)
                                )}
                              >
                                {event.status.replace('_', ' ')}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleTimelineStatusChange(
                                  event.id,
                                  event.status === 'scheduled' ? 'in_progress' :
                                  event.status === 'in_progress' ? 'completed' :
                                  'scheduled'
                                )}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-light">No timeline events yet</p>
                  <Button 
                    onClick={() => setIsAddingEvent(true)}
                    className="mt-4 bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light"
                  >
                    Create First Event
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="vendors" className="space-y-6">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Vendor Status</h2>
          </div>
          
          <div className="space-y-4">
            {dashboardData?.vendors?.list?.length > 0 ? (
              dashboardData.vendors.list.map((vendor: Vendor) => (
                <div key={vendor.id} className="border border-gray-200 rounded-sm p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-normal text-gray-900">{vendor.name}</h3>
                      <p className="text-sm font-light text-gray-600">{vendor.category}</p>
                      {vendor.phone && (
                        <p className="text-sm font-light text-gray-500 mt-1">{vendor.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-light",
                          vendor.status === 'setup_complete' ? 'text-green-600 bg-green-50 border-green-200' :
                          vendor.status === 'checked_in' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                          'text-gray-600 bg-gray-50 border-gray-200'
                        )}
                      >
                        {vendor.status.replace('_', ' ')}
                      </Badge>
                      {vendor.status === 'not_arrived' && (
                        <Button
                          onClick={() => handleVendorCheckIn(vendor.id)}
                          size="sm"
                          className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm text-xs font-light"
                        >
                          Check In
                        </Button>
                      )}
                      {vendor.status === 'checked_in' && (
                        <Button
                          onClick={() => handleVendorSetupComplete(vendor.id)}
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-sm text-xs font-light"
                        >
                          Setup Complete
                        </Button>
                      )}
                    </div>
                  </div>
                  {vendor.arrival_time && (
                    <p className="text-xs font-light text-gray-500 mt-2">
                      Arrived at {formatTimeOnly(vendor.arrival_time)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-light">No vendors to track</p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="issues" className="space-y-6">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Issue Tracker</h2>
            <Button 
              onClick={() => setIsReportingIssue(true)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-sm px-4 py-2 text-sm font-light"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          </div>
          
          <div className="space-y-4">
            {dashboardData?.issues?.list?.length > 0 ? (
              dashboardData.issues.list.map((issue: Issue) => (
                <div 
                  key={issue.id} 
                  className={cn(
                    "border rounded-sm p-4 transition-colors",
                    issue.status === 'resolved' ? 'bg-gray-50 border-gray-200' :
                    issue.priority === 'critical' ? 'bg-red-50 border-red-200' :
                    issue.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                    'bg-white border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-normal text-gray-900">{issue.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs font-light",
                            getPriorityColor(issue.priority)
                          )}
                        >
                          {issue.priority}
                        </Badge>
                      </div>
                      <p className="text-sm font-light text-gray-600 mt-1">{issue.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs font-light text-gray-500">
                          Reported {new Date(issue.created_at).toLocaleTimeString()}
                        </p>
                        {issue.assigned_to && (
                          <p className="text-xs font-light text-gray-500">
                            Assigned to {issue.assigned_to}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-light",
                          issue.status === 'resolved' ? 'text-green-600 bg-green-50 border-green-200' :
                          issue.status === 'in_progress' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                          'text-gray-600 bg-gray-50 border-gray-200'
                        )}
                      >
                        {issue.status.replace('_', ' ')}
                      </Badge>
                      {issue.status !== 'resolved' && (
                        <Button
                          onClick={() => handleUpdateIssue(issue.id, { 
                            status: issue.status === 'open' ? 'in_progress' : 'resolved' 
                          })}
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-sm text-xs font-light"
                        >
                          {issue.status === 'open' ? 'Start' : 'Resolve'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-light">No issues reported</p>
                <p className="text-sm text-gray-400 font-light mt-1">Everything is running smoothly!</p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="guests" className="space-y-6">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Guest Check-ins</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <p className="text-4xl font-light text-gray-900">{guests.checked_in}</p>
              <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Arrived</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-light text-amber-600">{guests.total_expected - guests.checked_in}</p>
              <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-light text-green-600">{guests.meals_served}</p>
              <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Meals Served</p>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-sm p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-light">Guest check-in system</p>
            <p className="text-sm text-gray-400 font-light mt-1">Scan QR codes or search by name</p>
            <Button 
              className="mt-4 bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-6 py-2 text-sm font-light"
            >
              Start Check-in
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
  );
}