'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Fab,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Restaurant as FoodIcon,
  PhotoCamera as PhotoIcon,
  MusicNote as MusicIcon,
  LocalFlorist as FlowerIcon,
  AccessTime as TimeIcon,
  DateRange as DateIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Mock timeline events
    setEvents([
      {
        id: '1',
        title: 'Bridal Party Preparation',
        time: '12:00',
        description: 'Hair and makeup for bridal party',
        category: 'personal',
        duration: 180,
        location: 'Bridal Suite',
      },
      {
        id: '2',
        title: 'Wedding Ceremony',
        time: '16:00',
        description: 'Exchange of vows and rings',
        category: 'ceremony',
        duration: 45,
        location: 'Garden Pavilion',
      },
      {
        id: '3',
        title: 'Cocktail Hour',
        time: '16:45',
        description: 'Drinks and appetizers while photos are taken',
        category: 'reception',
        duration: 75,
        location: 'Terrace',
      },
      {
        id: '4',
        title: 'Reception Dinner',
        time: '18:00',
        description: 'Dinner service and speeches',
        category: 'reception',
        duration: 120,
        location: 'Main Hall',
      },
    ]);
  }, []);

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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEvent(null);
  };

  const handleSave = () => {
    // TODO: Save to API
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    // TODO: Delete via API
    setEvents(events.filter(event => event.id !== id));
  };

  const getCategoryInfo = (category: string) => {
    return eventCategories.find(cat => cat.value === category) || eventCategories[0];
  };

  const sortedEvents = events.sort((a, b) => a.time.localeCompare(b.time));

  if (isLoading || !user) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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
            <Grid item xs={12} md={8}>
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
                      {sortedEvents.map((event, index) => {
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

            <Grid item xs={12} md={4}>
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
                label="Event Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
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
                SelectProps={{ native: true }}
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
            <Button onClick={handleSave} variant="contained">
              {editingEvent ? 'Save Changes' : 'Add Event'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}