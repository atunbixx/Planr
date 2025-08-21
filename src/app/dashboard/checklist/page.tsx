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
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  LinearProgress,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  Assignment as TaskIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Flag as PriorityIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  monthsBeforeWedding: number;
}

interface ChecklistCategory {
  id: string;
  name: string;
  color: string;
  items: ChecklistItem[];
}

const defaultCategories = [
  { id: 'venue', name: 'Venue & Catering', color: '#000000' },
  { id: 'vendors', name: 'Vendors', color: '#333333' },
  { id: 'attire', name: 'Attire & Beauty', color: '#666666' },
  { id: 'legal', name: 'Legal & Documentation', color: '#999999' },
  { id: 'details', name: 'Final Details', color: '#CCCCCC' },
];

export default function ChecklistPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { themeMode } = useCustomTheme();
  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'venue',
    priority: 'medium',
    dueDate: '',
    monthsBeforeWedding: '12',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Mock checklist data organized by timeline
    const mockItems: ChecklistItem[] = [
      // 12+ Months Before
      {
        id: '1',
        title: 'Set wedding date',
        description: 'Choose your perfect wedding date',
        category: 'venue',
        priority: 'high',
        dueDate: '2024-06-15',
        completed: true,
        completedAt: '2024-05-20',
        monthsBeforeWedding: 12,
      },
      {
        id: '2',
        title: 'Determine budget',
        description: 'Set overall wedding budget and allocate funds',
        category: 'legal',
        priority: 'high',
        completed: true,
        completedAt: '2024-05-25',
        monthsBeforeWedding: 12,
      },
      {
        id: '3',
        title: 'Book venue',
        description: 'Reserve ceremony and reception venues',
        category: 'venue',
        priority: 'high',
        dueDate: '2024-08-01',
        completed: false,
        monthsBeforeWedding: 12,
      },
      // 9 Months Before
      {
        id: '4',
        title: 'Book photographer',
        description: 'Hire wedding photographer and videographer',
        category: 'vendors',
        priority: 'high',
        dueDate: '2024-09-15',
        completed: false,
        monthsBeforeWedding: 9,
      },
      {
        id: '5',
        title: 'Choose bridal party',
        description: 'Ask friends and family to be in wedding party',
        category: 'details',
        priority: 'medium',
        completed: false,
        monthsBeforeWedding: 9,
      },
      // 6 Months Before
      {
        id: '6',
        title: 'Send save the dates',
        description: 'Mail save the date cards to guests',
        category: 'details',
        priority: 'medium',
        dueDate: '2024-12-15',
        completed: false,
        monthsBeforeWedding: 6,
      },
      {
        id: '7',
        title: 'Order wedding dress',
        description: 'Purchase or order wedding dress',
        category: 'attire',
        priority: 'high',
        dueDate: '2024-12-01',
        completed: false,
        monthsBeforeWedding: 6,
      },
      // 3 Months Before
      {
        id: '8',
        title: 'Send invitations',
        description: 'Mail wedding invitations to all guests',
        category: 'details',
        priority: 'high',
        dueDate: '2025-03-15',
        completed: false,
        monthsBeforeWedding: 3,
      },
      {
        id: '9',
        title: 'Book honeymoon',
        description: 'Plan and book honeymoon travel',
        category: 'details',
        priority: 'medium',
        completed: false,
        monthsBeforeWedding: 3,
      },
      // 1 Month Before
      {
        id: '10',
        title: 'Final venue walkthrough',
        description: 'Meet with venue coordinator for final details',
        category: 'venue',
        priority: 'high',
        dueDate: '2025-05-15',
        completed: false,
        monthsBeforeWedding: 1,
      },
    ];

    // Organize items by category
    const organizedCategories = defaultCategories.map(cat => ({
      ...cat,
      items: mockItems.filter(item => item.category === cat.id),
    }));

    setCategories(organizedCategories);
  }, []);

  const getTimelineItems = () => {
    const allItems = categories.flatMap(cat => cat.items);
    const timelines = [
      { label: '12+ Months Before', months: 12, items: [] as ChecklistItem[] },
      { label: '9 Months Before', months: 9, items: [] as ChecklistItem[] },
      { label: '6 Months Before', months: 6, items: [] as ChecklistItem[] },
      { label: '3 Months Before', months: 3, items: [] as ChecklistItem[] },
      { label: '1 Month Before', months: 1, items: [] as ChecklistItem[] },
    ];

    allItems.forEach(item => {
      const timeline = timelines.find(t => t.months === item.monthsBeforeWedding);
      if (timeline) {
        timeline.items.push(item);
      }
    });

    return timelines;
  };

  const getTotalProgress = () => {
    const allItems = categories.flatMap(cat => cat.items);
    const completedItems = allItems.filter(item => item.completed);
    return allItems.length > 0 ? (completedItems.length / allItems.length) * 100 : 0;
  };

  const getCategoryProgress = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category || category.items.length === 0) return 0;
    const completedItems = category.items.filter(item => item.completed);
    return (completedItems.length / category.items.length) * 100;
  };

  const handleToggleComplete = (itemId: string) => {
    setCategories(categories.map(cat => ({
      ...cat,
      items: cat.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date().toISOString() : undefined,
            }
          : item
      ),
    })));
  };

  const handleOpenDialog = (item?: ChecklistItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        dueDate: item.dueDate || '',
        monthsBeforeWedding: item.monthsBeforeWedding.toString(),
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        category: 'venue',
        priority: 'medium',
        dueDate: '',
        monthsBeforeWedding: '12',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    // TODO: Save to API
    handleCloseDialog();
  };

  const handleDelete = (itemId: string) => {
    // TODO: Delete via API
    setCategories(categories.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.id !== itemId),
    })));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#999999';
    }
  };

  const getOverdueTasks = () => {
    const allItems = categories.flatMap(cat => cat.items);
    const today = new Date();
    return allItems.filter(item => 
      !item.completed && 
      item.dueDate && 
      new Date(item.dueDate) < today
    );
  };

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

  const overdueTasks = getOverdueTasks();
  const timelineItems = getTimelineItems();
  const Layout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;

  return (
    <Layout>
      <Box sx={{ px: 0, py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, px: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>
              Wedding Checklist
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stay organized with your wedding planning tasks
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Task
          </Button>
        </Box>

        {/* Progress Overview */}
        <Box sx={{ mb: 4, px: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }} component="div">
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
                    OVERALL PROGRESS
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h2" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 300, mr: 2 }}>
                      {Math.round(getTotalProgress())}%
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        Wedding Planning Complete
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getTotalProgress()}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#F5F5F5',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#000000',
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {overdueTasks.length > 0 && (
                    <Box sx={{ p: 2, bgcolor: '#FFF3E0', border: '1px solid #FFB74D', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <WarningIcon sx={{ color: '#FF9800', mr: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      {overdueTasks.slice(0, 3).map(task => (
                        <Typography key={task.id} variant="body2" color="text.secondary">
                          • {task.title}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} component="div">
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
                    CATEGORY PROGRESS
                  </Typography>

                  {defaultCategories.map((category) => {
                    const progress = getCategoryProgress(category.id);
                    const categoryData = categories.find(cat => cat.id === category.id);
                    const itemCount = categoryData?.items.length || 0;
                    
                    return (
                      <Box key={category.id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{category.name}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {Math.round(progress)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: '#F5F5F5',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: category.color,
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {itemCount} tasks
                        </Typography>
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Tabs */}
        <Box sx={{ px: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Timeline View" />
            <Tab label="Category View" />
          </Tabs>

          {selectedTab === 0 ? (
            // Timeline View
            <Box>
              {timelineItems.map((timeline) => (
                <Accordion key={timeline.months} defaultExpanded={timeline.months >= 6}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ bgcolor: '#FAFAFA' }}
                  >
                    <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>
                      {timeline.label}
                    </Typography>
                    <Chip
                      label={`${timeline.items.length} tasks`}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    {timeline.items.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No tasks for this timeline
                      </Typography>
                    ) : (
                      <List>
                        {timeline.items.map((item) => (
                          <ListItem
                            key={item.id}
                            sx={{
                              border: '1px solid #F0F0F0',
                              mb: 1,
                              borderRadius: 0,
                              opacity: item.completed ? 0.6 : 1,
                            }}
                          >
                            <ListItemIcon>
                              <Checkbox
                                checked={item.completed}
                                onChange={() => handleToggleComplete(item.id)}
                                icon={<UncheckedIcon />}
                                checkedIcon={<CheckCircleIcon />}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <span
                                    style={{
                                      textDecoration: item.completed ? 'line-through' : 'none',
                                      fontFamily: '"Bodoni Moda", serif',
                                      fontWeight: 400,
                                      fontSize: '1rem',
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {item.title}
                                  </span>
                                  <Chip
                                    label={item.priority}
                                    size="small"
                                    sx={{
                                      bgcolor: getPriorityColor(item.priority) + '20',
                                      color: getPriorityColor(item.priority),
                                      height: 20,
                                      fontSize: '0.625rem',
                                    }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <div style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                                    {item.description}
                                  </div>
                                  {item.dueDate && (
                                    <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                      <CalendarIcon sx={{ fontSize: 12 }} />
                                      Due: {new Date(item.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDelete(item.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            // Category View
            <Grid container spacing={3}>
              {categories.map((category) => (
                <Grid size={{ xs: 12, md: 6 }} key={category.id} component="div">
                  <Card>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 400 }}>
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {Math.round(getCategoryProgress(category.id))}% complete
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={getCategoryProgress(category.id)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          mb: 2,
                          bgcolor: '#F5F5F5',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: category.color,
                          },
                        }}
                      />

                      {category.items.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No tasks in this category
                        </Typography>
                      ) : (
                        <List dense>
                          {category.items.slice(0, 5).map((item) => (
                            <ListItem key={item.id} sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <Checkbox
                                  size="small"
                                  checked={item.completed}
                                  onChange={() => handleToggleComplete(item.id)}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={item.title}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: { textDecoration: item.completed ? 'line-through' : 'none' },
                                }}
                              />
                            </ListItem>
                          ))}
                          {category.items.length > 5 && (
                            <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                              +{category.items.length - 5} more tasks
                            </Typography>
                          )}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingItem ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Task Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }} component="div">
                  <TextField
                    select
                    label="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    fullWidth
                    slotProps={{ select: { native: true } }}
                  >
                    {defaultCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6 }} component="div">
                  <TextField
                    select
                    label="Priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    fullWidth
                    slotProps={{ select: { native: true } }}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </TextField>
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }} component="div">
                  <TextField
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }} component="div">
                  <TextField
                    select
                    label="Timeline"
                    value={formData.monthsBeforeWedding}
                    onChange={(e) => setFormData({ ...formData, monthsBeforeWedding: e.target.value })}
                    fullWidth
                    slotProps={{ select: { native: true } }}
                  >
                    <option value="12">12+ Months Before</option>
                    <option value="9">9 Months Before</option>
                    <option value="6">6 Months Before</option>
                    <option value="3">3 Months Before</option>
                    <option value="1">1 Month Before</option>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              {editingItem ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}