'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  // Grid2 as Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Restaurant as FoodIcon,
  PhotoCamera as PhotoIcon,
  LocalFlorist as FlowerIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import AuthClient from '@/lib/auth/client';
import { useAuth } from '@/hooks/useAuth';

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
  { value: 'ceremony', label: 'Ceremony', icon: <EventIcon />, color: '#000000' },
  { value: 'reception', label: 'Reception', icon: <FoodIcon />, color: '#333333' },
  { value: 'photo', label: 'Photography', icon: <PhotoIcon />, color: '#666666' },
  { value: 'vendor', label: 'Vendor', icon: <PeopleIcon />, color: '#999999' },
  { value: 'personal', label: 'Personal', icon: <FlowerIcon />, color: '#CCCCCC' },
];

export default function TimelinePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { themeMode } = useCustomTheme();
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

  const sortedEvents = events.sort((a, b) => a.time.localeCompare(b.time));

  if (isLoading || !user) {
    const LoadingLayout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;
    return (
      <LoadingLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </LoadingLayout>
    );
  }

  const Layout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;

  return (
    <Layout>
      <Box sx={{ px: 0, py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, px: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>
              Wedding Day Timeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Plan every moment of your perfect day
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Event
          </Button>
        </Box>

        {/* Timeline Overview */}
        <Box sx={{ mb: 4, px: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontSize: '0.625rem',
                      letterSpacing: '0.2em',
                      fontWeight: 600,
                      fontFamily: '"Bodoni Moda", serif',
                      mb: 2,
                      display: 'block',
                    }}
                  >
                    JUNE 15, 2025 SCHEDULE
                  </Typography>

                  {sortedEvents.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <ScheduleIcon sx={{ fontSize: 48, color: '#CCCCCC', mb: 2 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, color: '#999999' }} gutterBottom>
                        No events scheduled yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Start by adding your first event to create your timeline
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                      >
                        Add First Event
                      </Button>
                    </Box>
                  ) : (
                    <List>
                      {sortedEvents.map((event) => {
                        const categoryInfo = getCategoryInfo(event.category);
                        return (
                          <ListItem
                            key={event.id}
                            sx={{
                              border: '1px solid #F0F0F0',
                              mb: 1,
                              borderRadius: 0,
                              '&:hover': {
                                bgcolor: '#FAFAFA',
                              },
                            }}
                          >
                            <ListItemIcon>
                              <Avatar
                                sx={{
                                  bgcolor: categoryInfo.color,
                                  color: '#FFFFFF',
                                  width: 40,
                                  height: 40,
                                }}
                              >
                                {categoryInfo.icon}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>
                                    {event.title}
                                  </Typography>
                                  <Chip
                                    label={categoryInfo.label}
                                    size="small"
                                    sx={{ bgcolor: categoryInfo.color + '20', color: categoryInfo.color }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {event.description}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <TimeIcon sx={{ fontSize: 14 }} />
                                      {event.time} ({event.duration} min)
                                    </Typography>
                                    {event.location && (
                                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <EventIcon sx={{ fontSize: 14 }} />
                                        {event.location}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton size="small" onClick={() => handleOpenDialog(event)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDelete(event.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontSize: '0.625rem',
                      letterSpacing: '0.2em',
                      fontWeight: 600,
                      fontFamily: '"Bodoni Moda", serif',
                      mb: 2,
                      display: 'block',
                    }}
                  >
                    TIMELINE SUMMARY
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 300 }}>
                      {sortedEvents.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Events
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400, mb: 1 }}>
                      Event Categories
                    </Typography>
                    {eventCategories.map((category) => {
                      const count = events.filter(e => e.category === category.value).length;
                      return (
                        <Box key={category.value} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{category.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{count}</Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => router.push('/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                required
                label="Event Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                fullWidth
                error={titleError}
                helperText={titleError ? 'Title is required' : ' '}
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    required
                    label="Time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, time: true }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={timeError}
                    helperText={timeError ? 'Time is required' : ' '}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Duration (minutes)"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </Grid>
              <TextField
                select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                fullWidth
                slotProps={{ select: { native: true } }}
              >
                {eventCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </TextField>
              <TextField
                label="Location (optional)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                fullWidth
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" disabled={!canSave}>
              {editingEvent ? 'Save Changes' : 'Add Event'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}
