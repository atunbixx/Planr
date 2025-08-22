'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Calendar, CalendarDays, Users, Utensils, Camera, Flower, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import AuthClient from '@/lib/auth/client';

type TimelineEventCategory = 'ceremony' | 'reception' | 'photo' | 'vendor' | 'personal';

interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  description: string;
  category: 'ceremony' | 'reception' | 'photo' | 'vendor' | 'personal';
  duration: number; // in minutes
  location?: string;
}

const eventCategories = [
  { value: 'ceremony', label: 'Ceremony', icon: <CalendarDays />, color: '#000000' },
  { value: 'reception', label: 'Reception', icon: <Utensils />, color: '#333333' },
  { value: 'photo', label: 'Photography', icon: <Camera />, color: '#666666' },
  { value: 'vendor', label: 'Vendor', icon: <Users />, color: '#999999' },
  { value: 'personal', label: 'Personal', icon: <Flower />, color: '#CCCCCC' },
];

export default function TimelinePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    time: '',
    description: '',
    category: 'ceremony',
    duration: '60',
    location: '',
  });
  const [touched, setTouched] = useState<{ title: boolean; time: boolean }>({ title: false, time: false })
  const canSave = (formData.title || '').trim().length > 0 && (formData.time || '').trim().length > 0
  const titleError = touched.title && !(formData.title || '').trim().length
  const timeError = touched.time && !(formData.time || '').trim().length

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  async function loadEvents() {
    try {
      const token = AuthClient.getToken()
      const headers: Record<string,string> = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch('/api/dashboard/timeline', { headers })
      const json = await res.json()
      const ev = (json?.data?.events || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        time: e.time,
        description: e.description || '',
        category: (e.category as any) || 'personal',
        duration: typeof e.duration === 'number' ? e.duration : 60,
        location: e.location || '',
      })) as TimelineEvent[]
      setEvents(ev)
    } catch (e) {
      setEvents([])
    }
  }

  useEffect(() => { if (!isLoading && user) loadEvents() }, [isLoading, user])

  const handleOpenDialog = (event?: TimelineEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        time: event.time,
        description: event.description,
        category: event.category,
        duration: event.duration.toString(),
        location: event.location || '',
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        time: '',
        description: '',
        category: 'ceremony',
        duration: '60',
        location: '',
      });
    }
    setTouched({ title: false, time: false })
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEvent(null);
  };

  const handleSave = async () => {
    try {
      const token = AuthClient.getToken()
      const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      if (editingEvent) {
        await fetch(`/api/dashboard/timeline/${editingEvent.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            title: formData.title,
            time: formData.time,
            description: formData.description,
            category: formData.category,
            duration: Number(formData.duration || 0),
            location: formData.location,
          })
        })
      } else {
        await fetch(`/api/dashboard/timeline`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: formData.title,
            time: formData.time,
            description: formData.description,
            category: formData.category,
            duration: Number(formData.duration || 0),
            location: formData.location,
          })
        })
      }
      await loadEvents()
    } finally {
      handleCloseDialog();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = AuthClient.getToken()
      const headers: Record<string,string> = token ? { Authorization: `Bearer ${token}` } : {}
      await fetch(`/api/dashboard/timeline/${id}`, { method: 'DELETE', headers })
      await loadEvents()
    } catch {}
  };

  const getCategoryInfo = (category: string) => {
    return eventCategories.find(cat => cat.value === category) || eventCategories[0];
  };

  const sortedEvents = useMemo(() => events.sort((a, b) => a.time.localeCompare(b.time)), [events]);

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-3">
        <div>
          <h1 className="text-4xl font-bodoni-moda">Wedding Day Timeline</h1>
          <p className="text-sm text-gray-500">Plan every moment of your perfect day</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Timeline Overview */}
      <div className="mb-4 px-3">
        <div className="flex flex-wrap -mx-3">
          <div className="w-full md:w-2/3 px-3">
            <Card>
              <CardContent className="p-4">
                <span
                  className="text-xs tracking-widest font-semibold font-bodoni-moda mb-2 block"
                >
                  JUNE 15, 2025 SCHEDULE
                </span>

                {sortedEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <h2 className="text-xl font-bodoni-moda text-gray-500">No events scheduled yet</h2>
                    <p className="text-sm text-gray-500 mb-3">Start by adding your first event to create your timeline</p>
                    <Button
                      onClick={() => handleOpenDialog()}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Event
                    </Button>
                  </div>
                ) : (
                  <div>
                    {sortedEvents.map((event) => {
                      const categoryInfo = getCategoryInfo(event.category);
                      return (
                        <div
                          key={event.id}
                          className="border border-gray-200 mb-1 rounded-md hover:bg-gray-50 p-4 flex items-center"
                        >
                          <div className="mr-4">
                            <Avatar
                              style={{
                                backgroundColor: categoryInfo.color,
                                color: '#FFFFFF',
                                width: 40,
                                height: 40,
                              }}
                            >
                              <AvatarFallback>
                                {categoryInfo.icon}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bodoni-moda">{event.title}</h3>
                              <Badge variant="secondary">
                                {categoryInfo.label}
                              </Badge>
                            </div>
                            <div className="mt-1">
                              <p className="text-sm text-gray-500">{event.description}</p>
                              <div className="flex gap-2 mt-1">
                                <p className="text-xs flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.time} ({event.duration} min)
                                </p>
                                {event.location && (
                                  <p className="text-xs flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    {event.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(event)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-1/3 px-3">
            <Card>
              <CardContent className="p-3">
                <span
                  className="text-xs tracking-widest font-semibold font-bodoni-moda mb-2 block"
                >
                  TIMELINE SUMMARY
                </span>

                <div className="mb-3">
                  <h2 className="text-4xl font-bodoni-moda font-light">{sortedEvents.length}</h2>
                  <p className="text-sm text-gray-500">Total Events</p>
                </div>

                <div className="mb-3">
                  <h3 className="text-lg font-bodoni-moda mb-1">Event Categories</h3>
                  {eventCategories.map((category) => {
                    const count = events.filter(e => e.category === category.value).length;
                    return (
                      <div key={category.value} className="flex justify-between mb-1">
                        <p className="text-sm">{category.label}</p>
                        <p className="text-sm font-medium">{count}</p>
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input
              required
              placeholder="Event Title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, title: true }))}
            />
            {titleError && <p className="text-red-500 text-xs mt-1">Title is required</p>}
            
            <div className="flex flex-wrap -mx-2">
              <div className="w-1/2 px-2">
                <Input
                  required
                  placeholder="Time"
                  type="time"
                  value={formData.time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, time: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, time: true }))}
                />
                {timeError && <p className="text-red-500 text-xs mt-1">Time is required</p>}
              </div>
              <div className="w-1/2 px-2">
                <Input
                  placeholder="Duration (minutes)"
                  type="number"
                  value={formData.duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as TimelineEventCategory })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {eventCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Location (optional)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {editingEvent ? 'Save Changes' : 'Add Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
