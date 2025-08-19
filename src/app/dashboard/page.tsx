'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  IconButton,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  CardActionArea,
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Store as VendorIcon,
  CalendarToday as CalendarIcon,
  Favorite as HeartIcon,
  PhotoLibrary as PhotoIcon,
  Message as MessageIcon,
  Timeline as TimelineIcon,
  CheckBox as CheckBoxIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as ClockIcon,
  EventNote as EventIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import AuthClient from '@/lib/auth/client';

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  path: string;
  stats?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, signout, isLoading } = useAuth();
  const [topCards, setTopCards] = useState<FeatureCard[]>([]);
  const [middleCards, setMiddleCards] = useState<FeatureCard[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [guestTotal, setGuestTotal] = useState<number | null>(null);
  const [vendorTotal, setVendorTotal] = useState<number | null>(null);
  const [vendorBookedTotal, setVendorBookedTotal] = useState<number | null>(null);
  const [guestAccepted, setGuestAccepted] = useState<number | null>(null);
  const [vendorCritical, setVendorCritical] = useState<{ venue: boolean; photographer: boolean; caterer: boolean; music: boolean; florist: boolean } | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<{ totalAmount: number; totalAllocated: number; totalActual: number; percentSpent?: number } | null>(null);
  const [weddingDate, setWeddingDate] = useState<Date | null>(null);
  const [venue, setVenue] = useState<string | null>(null);
  const [teamRoles, setTeamRoles] = useState<Array<{ key: string; role: string; status: 'needed' | 'hired' }>>([]);
  const [nextEventLabel, setNextEventLabel] = useState<string | null>(null);
  const [timelineCount, setTimelineCount] = useState<number>(0);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Set up the feature cards
    setTopCards([
      {
        title: 'Guest Management',
        description: 'Manage your guest list and RSVPs',
        icon: <PeopleIcon sx={{ fontSize: 28 }} />,
        color: '#000000',
        path: '/dashboard/guests',
        stats: guestTotal === null ? '—' : `${guestTotal} ${guestTotal === 1 ? 'guest' : 'guests'}`,
      },
      {
        title: 'Budget Tracker',
        description: 'Track expenses and stay on budget',
        icon: <MoneyIcon sx={{ fontSize: 28 }} />,
        color: '#000000',
        path: '/dashboard/budget',
        stats: budgetSummary ? `$${Number(budgetSummary.totalActual).toLocaleString()} spent` : '—',
      },
      {
        title: 'Vendor Directory',
        description: 'Find and manage wedding vendors',
        icon: <VendorIcon sx={{ fontSize: 28 }} />,
        color: '#000000',
        path: '/dashboard/vendors',
        stats: vendorTotal === null ? '—' : `${vendorTotal} ${vendorTotal === 1 ? 'vendor' : 'vendors'}`,
      },
    ]);

    setMiddleCards([
      {
        title: 'Timeline',
        description: 'Plan your wedding day schedule',
        icon: <TimelineIcon sx={{ fontSize: 28 }} />,
        color: '#000000',
        path: '/dashboard/timeline',
        stats: 'Not started',
      },
      {
        title: 'Photo Gallery',
        description: 'Collect and share wedding photos',
        icon: <PhotoIcon sx={{ fontSize: 28 }} />,
        color: '#000000',
        path: '/dashboard/photos',
        stats: '0 photos',
      },
      {
        title: 'Messages',
        description: 'Communicate with guests and vendors',
        icon: <MessageIcon sx={{ fontSize: 28 }} />,
        color: '#000000',
        path: '/dashboard/messages',
        stats: '0 messages',
      },
    ]);

    // Tasks, recent activity, and budget breakdown are loaded dynamically below
  }, [guestTotal, vendorTotal, budgetSummary]);

  // Fetch live stats via consolidated overview endpoint to minimize DB calls
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = AuthClient.getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/dashboard/overview', { headers });
        if (res.ok) {
          const data = await res.json();
          const d = data?.data;
          if (d) {
            if (typeof d.guestTotal === 'number') setGuestTotal(d.guestTotal);
            if (typeof d?.guests?.accepted === 'number') setGuestAccepted(d.guests.accepted);
            if (typeof d.vendorTotal === 'number') setVendorTotal(d.vendorTotal);
            if (typeof d.vendorBookedTotal === 'number') setVendorBookedTotal(d.vendorBookedTotal);
            if (d.vendorCritical) setVendorCritical(d.vendorCritical);
            if (d.budget) {
              setBudgetSummary({
                totalAmount: d.budget.totalAmount,
                totalAllocated: d.budget.totalAllocated,
                totalActual: d.budget.totalActual,
                percentSpent: d.budget.percentSpent,
              });
            }
          }
        }

        // Wedding details (date & venue)
        const wd = await fetch('/api/wedding-details', { headers })
        if (wd.ok) {
          const wj = await wd.json()
          const w = wj?.data
          if (w?.weddingDate) setWeddingDate(new Date(w.weddingDate))
          if (w?.venue) setVenue(w.venue)
        }

        // Checklist
        const cl = await fetch('/api/dashboard/checklist', { headers })
        if (cl.ok) {
          const cj = await cl.json()
          setTasks((cj?.data?.items || []).map((i: any, idx: number) => ({ id: idx+1, title: i.title, completed: i.completed })))
          setCompletedTasks(cj?.data?.completed || 0)
          setTotalTasks(cj?.data?.total || 0)
        }

        // Team roles
        const tr = await fetch('/api/dashboard/team', { headers })
        if (tr.ok) {
          const tj = await tr.json()
          setTeamRoles(tj?.data || [])
        }

        // Timeline next event label
        const tl = await fetch('/api/dashboard/timeline', { headers })
        if (tl.ok) {
          const tj = await tl.json()
          const events: Array<{ time: string; title: string }> = tj?.data?.events || []
          setTimelineCount(events.length)
          const now = new Date()
          const upcoming = events
            .map(e => ({ ...e, date: new Date(e.time) }))
            .filter(e => !isNaN(e.date.getTime()))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .find(e => e.date.getTime() >= now.getTime())
          if (upcoming) {
            const t = upcoming.date
            const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            setNextEventLabel(`${upcoming.title.toUpperCase()} AT ${timeStr}`)
          } else {
            setNextEventLabel(null)
          }
        }
        // Recent activity
        const ra = await fetch('/api/dashboard/activity', { headers })
        if (ra.ok) {
          const rj = await ra.json()
          setRecentActivity(rj?.data?.items || [])
        }
      } catch (e) {
        // Silently ignore; UI will keep placeholders
        console.error('Failed to load dashboard stats', e);
      }
    };

    fetchStats();
  }, []);

  const getDaysUntilWedding = () => {
    const date = weddingDate || new Date();
    const today = new Date();
    const diffTime = Math.abs(date.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <Box sx={{ px: 0, py: 3 }}>
        {/* Hero Section - Countdown Focus */}
        <Grid container spacing={3} sx={{ mb: 4, px: 3 }}>
          <Grid item xs={12} lg={4} md={5}>
            <Paper
              sx={{
                p: 6,
                background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                color: '#FFFFFF',
                borderRadius: 0,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 320,
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography 
                  variant="overline" 
                  sx={{ 
                    fontSize: '0.625rem', 
                    letterSpacing: '0.2em',
                    opacity: 0.8,
                    fontWeight: 600,
                    fontFamily: '"Bodoni Moda", serif',
                  }}
                >
                  YOUR WEDDING DAY
                </Typography>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontFamily: '"Bodoni Moda", "Playfair Display", serif',
                    fontSize: '5rem',
                    fontWeight: 300,
                    letterSpacing: '-0.05em',
                    lineHeight: 1,
                    mt: 2,
                    mb: 1,
                  }}
                >
                  {getDaysUntilWedding()}
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontFamily: '"Bodoni Moda", serif',
                    fontWeight: 300,
                    letterSpacing: '0.05em',
                    mb: 4,
                  }}
                >
                  DAYS TO GO
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: '1.125rem',
                    opacity: 0.9,
                    mb: 3,
                    fontStyle: 'italic',
                  }}
                >
                  {weddingDate ? weddingDate.toLocaleDateString() : '—'}{venue ? ` • ${venue}` : ''}
                </Typography>
                <Button
                  variant="outlined"
                  sx={{
                    color: '#FFFFFF',
                    borderColor: '#FFFFFF',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: '#FFFFFF',
                      color: '#000000',
                    },
                  }}
                  onClick={() => router.push('/dashboard/timeline')}
                >
                  VIEW TIMELINE
                </Button>
              </Box>
              {/* Decorative element */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </Paper>
          </Grid>

          {/* Planning Progress */}
          <Grid item xs={12} lg={3} md={4}>
            <Paper
              sx={{
                p: 4,
                backgroundColor: '#FFFFFF',
                borderRadius: 0,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                height: '100%',
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontSize: '0.625rem',
                  letterSpacing: '0.2em',
                  fontWeight: 600,
                  fontFamily: '"Bodoni Moda", serif',
                  mb: 3,
                }}
              >
                PLANNING PROGRESS
              </Typography>
              
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative', mb: 4 }}>
                  <CircularProgress
                    variant="determinate"
                    value={totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}
                    size={120}
                    thickness={2}
                    sx={{
                      color: '#000000',
                      position: 'absolute',
                      left: '50%',
                      marginLeft: '-60px',
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={120}
                    thickness={2}
                    sx={{
                      color: '#F5F5F5',
                      position: 'absolute',
                      left: '50%',
                      marginLeft: '-60px',
                      zIndex: 0,
                    }}
                  />
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 120,
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        fontFamily: '"Bodoni Moda", serif',
                        fontWeight: 400,
                      }}
                    >
                      {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontFamily: '"Bodoni Moda", serif', mb: 1 }}>
                    Almost There!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {completedTasks} of {totalTasks} tasks completed
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 3 }}
                onClick={() => router.push('/dashboard/checklist')}
              >
                VIEW CHECKLIST
              </Button>
            </Paper>
          </Grid>

          {/* Your Wedding Team - Compact Version */}
          <Grid item xs={12} lg={5} md={3}>
            <Paper
              sx={{
                p: 4,
                backgroundColor: '#FFFFFF',
                borderRadius: 0,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                height: '100%',
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontSize: '0.625rem',
                  letterSpacing: '0.2em',
                  fontWeight: 600,
                  fontFamily: '"Bodoni Moda", serif',
                  mb: 2,
                }}
              >
                YOUR WEDDING TEAM
              </Typography>
              
              <Box sx={{ flex: 1 }}>
                <Grid container spacing={1.5}>
                  {teamRoles.map((vendor) => (
                    <Grid item xs={4} key={vendor.key}>
                      <Box
                        sx={{
                          p: 1.5,
                          border: '1px solid #F0F0F0',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#000000',
                            bgcolor: '#FAFAFA',
                          },
                        }}
                        onClick={() => router.push('/dashboard/vendors')}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: '#FAFAFA',
                            color: '#999999',
                            mx: 'auto',
                            mb: 0.5,
                          }}
                        >
                          <VendorIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.625rem',
                            mb: 0.5,
                            lineHeight: 1.2,
                            fontWeight: 500,
                          }}
                        >
                          {vendor.role}
                        </Typography>
                        <Chip
                          label={vendor.status === 'needed' ? 'HIRE' : '✓'}
                          size="small"
                          sx={{
                            fontSize: '0.5rem',
                            height: 16,
                            fontWeight: 600,
                            bgcolor: vendor.status === 'needed' ? '#FFF' : '#000',
                            color: vendor.status === 'needed' ? '#000' : '#FFF',
                            border: '1px solid #000',
                            minWidth: 35,
                          }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 3 }}
                onClick={() => router.push('/dashboard/vendors')}
              >
                FIND VENDORS
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Priority Actions - What Matters Most */}
        <Box sx={{ mb: 4, px: 3 }}>
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
            PRIORITY ACTIONS
          </Typography>
          
          <Grid container spacing={3}>
            {/* Recent Activity */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" sx={{ fontSize: '0.625rem', letterSpacing: '0.2em', fontWeight: 600, fontFamily: '"Bodoni Moda", serif', mb: 2, display: 'block' }}>RECENT ACTIVITY</Typography>
                  {recentActivity && recentActivity.length > 0 ? (
                    <List dense>
                      {recentActivity.slice(0,6).map((a:any, idx:number) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemText primary={a.title} secondary={new Date(a.when).toLocaleString()} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No recent changes.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            {/* Guest Management - Most Important */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  borderRadius: 0,
                  transition: 'box-shadow 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
                  },
                }}
              >
                <CardActionArea onClick={() => router.push('/dashboard/guests')}>
                  <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={8}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontFamily: '"Bodoni Moda", serif',
                            fontWeight: 400,
                            mb: 1,
                          }}
                        >
                          Guest List
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                          Manage RSVPs and seating arrangements
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                          <Box>
                            <Typography variant="h3" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 300 }}>
                              {guestAccepted ?? 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              CONFIRMED
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="h3" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 300 }}>
                              {guestTotal ?? 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              INVITED
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <PeopleIcon sx={{ fontSize: 64, color: '#F5F5F5' }} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            {/* Budget Tracker */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  borderRadius: 0,
                  transition: 'box-shadow 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
                  },
                }}
              >
                <CardActionArea onClick={() => router.push('/dashboard/budget')}>
                  <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={8}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontFamily: '"Bodoni Moda", serif',
                            fontWeight: 400,
                            mb: 1,
                          }}
                        >
                          Budget
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                          Track expenses and payments
                        </Typography>
                        <Box>
                          <Typography variant="h3" sx={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 300 }}>
                            {budgetSummary ? `$${Number(budgetSummary.totalAmount).toLocaleString()}` : '—'}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, Math.max(0, Number(budgetSummary?.percentSpent ?? 0)))}
                            sx={{
                              height: 4,
                              mt: 1,
                              bgcolor: '#F5F5F5',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#000000',
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {budgetSummary
                              ? `${Math.round(Number((budgetSummary.percentSpent ?? ((Number(budgetSummary.totalAmount)||0) > 0 ? (Number(budgetSummary.totalActual)/Number(budgetSummary.totalAmount))*100 : 0))))}% spent ($${Number(budgetSummary.totalActual).toLocaleString()} of $${Number(budgetSummary.totalAmount).toLocaleString()})`
                              : '—'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <MoneyIcon sx={{ fontSize: 64, color: '#F5F5F5' }} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Immediate Actions & Vendor Status */}
        <Box sx={{ mb: 4, px: 3 }}>
          <Grid container spacing={3}>
            {/* Immediate Actions */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" sx={{ fontSize: '0.625rem', letterSpacing: '0.2em', fontWeight: 600, fontFamily: '"Bodoni Moda", serif', mb: 2, display: 'block' }}>IMMEDIATE ACTIONS</Typography>
                  {tasks && tasks.length > 0 ? (
                    <List dense>
                      {tasks.filter((t:any)=>!t.completed).slice(0,5).map((t:any, idx:number) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon><CheckIcon color={t.completed ? 'success' : 'disabled'} /></ListItemIcon>
                          <ListItemText primary={t.title} secondary={t.hint || ''} />
                        </ListItem>
                      ))}
                      {tasks.filter((t:any)=>!t.completed).length === 0 && (
                        <ListItem sx={{ px: 0 }}><ListItemText primary="You're all caught up!" /></ListItem>
                      )}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No urgent tasks right now.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            {/* Key Vendor Status */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" sx={{ fontSize: '0.625rem', letterSpacing: '0.2em', fontWeight: 600, fontFamily: '"Bodoni Moda", serif', mb: 2, display: 'block' }}>KEY VENDOR STATUS</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {/* These chips will be updated by overview vendorCritical if present */}
                    <Chip label={`Venue`} variant='outlined' />
                    <Chip label={`Photographer`} variant='outlined' />
                    <Chip label={`Caterer`} variant='outlined' />
                    <Chip label={`Music/DJ`} variant='outlined' />
                    <Chip label={`Florist`} variant='outlined' />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Your Wedding Journey - Visual Cards */}
        <Box sx={{ mb: 4, px: 3 }}>
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
            YOUR WEDDING JOURNEY
          </Typography>
          
          <Grid container spacing={3}>
            {/* Vendors - Visual Focus */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  borderRadius: 0,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea onClick={() => router.push('/dashboard/vendors')}>
                  <Box
                    sx={{
                      height: 180,
                      background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <VendorIcon sx={{ fontSize: 72, color: '#E0E0E0' }} />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        bgcolor: '#000000',
                        color: '#FFFFFF',
                        px: 2,
                        py: 0.5,
                        fontSize: '0.625rem',
                        letterSpacing: '0.1em',
                        fontWeight: 600,
                      }}
                    >
                      {vendorBookedTotal === null ? '—' : `${vendorBookedTotal} BOOKED`}
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: '"Bodoni Moda", serif',
                        fontWeight: 400,
                        mb: 1,
                      }}
                    >
                      Vendor Directory
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Find and manage your dream team
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip label="Photographer" size="small" variant="outlined" />
                      <Chip label="Florist" size="small" variant="outlined" />
                      <Chip label="+5 more" size="small" variant="outlined" />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            {/* Timeline - Day Schedule */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  borderRadius: 0,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea onClick={() => router.push('/dashboard/timeline')}>
                  <Box
                    sx={{
                      height: 180,
                      background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <TimelineIcon sx={{ fontSize: 72, color: '#E0E0E0' }} />
                    <Typography
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        fontSize: '0.625rem',
                        letterSpacing: '0.1em',
                        fontWeight: 600,
                        color: '#666666',
                      }}
                    >
                      {nextEventLabel || 'SET YOUR TIMELINE'}
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: '"Bodoni Moda", serif',
                        fontWeight: 400,
                        mb: 1,
                      }}
                    >
                      Day Timeline
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Plan every magical moment
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={timelineCount > 0 ? Math.min(100, (timelineCount / 12) * 100) : 0}
                      sx={{
                        height: 4,
                        bgcolor: '#F5F5F5',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#000000',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {timelineCount} of 12 events planned
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            {/* Photo Gallery */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  borderRadius: 0,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea onClick={() => router.push('/dashboard/photos')}>
                  <Box
                    sx={{
                      height: 180,
                      background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gridTemplateRows: 'repeat(2, 1fr)',
                      gap: 0.5,
                      p: 2,
                    }}
                  >
                    {[...Array(6)].map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          bgcolor: '#FFFFFF',
                          border: '1px solid #F0F0F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PhotoIcon sx={{ fontSize: 20, color: '#E0E0E0' }} />
                      </Box>
                    ))}
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: '"Bodoni Moda", serif',
                        fontWeight: 400,
                        mb: 1,
                      }}
                    >
                      Photo Gallery
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Collect and share memories
                    </Typography>
                    <Button
                      size="small"
                      sx={{
                        color: '#000000',
                        textTransform: 'uppercase',
                        fontSize: '0.625rem',
                        letterSpacing: '0.1em',
                        fontWeight: 600,
                      }}
                    >
                      Upload Photos →
                    </Button>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Wedding Inspiration Section */}
        <Box sx={{ mb: 4, px: 3 }}>
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
            WEDDING INSPIRATION
          </Typography>
          
          <Grid container spacing={3}>
            {/* Your Love Story */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  borderRadius: 0,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <HeartIcon sx={{ fontSize: 32, color: '#F5F5F5', mr: 2 }} />
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: '"Bodoni Moda", serif',
                          fontWeight: 400,
                        }}
                      >
                        Your Love Story
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Share your journey together
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic', color: 'text.secondary' }}>
                    "We met on a rainy Tuesday in October, and from that moment, everything changed..."
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => router.push('/dashboard/story')}
                  >
                    Write Your Story
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Wedding Vision Board */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  borderRadius: 0,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <TrophyIcon sx={{ fontSize: 32, color: '#F5F5F5', mr: 2 }} />
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: '"Bodoni Moda", serif',
                          fontWeight: 400,
                        }}
                      >
                        Vision Board
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Visualize your perfect day
                      </Typography>
                    </Box>
                  </Box>
                  <Grid container spacing={1}>
                    {['Garden Romance', 'Elegant Classic', 'Modern Minimal', 'Bohemian'].map((style) => (
                      <Grid item xs={6} key={style}>
                        <Chip
                          label={style}
                          variant="outlined"
                          sx={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            py: 2,
                            borderColor: '#F0F0F0',
                            '&:hover': {
                              bgcolor: '#FAFAFA',
                            },
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Activity Dashboard - Refined */}
        <Grid container spacing={3} sx={{ mb: 3, px: 3 }}>
          {/* Budget Overview - Enhanced */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: 360, backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', border: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontFamily: '"Didot", "Bodoni MT", "Playfair Display", serif', fontWeight: 400, fontSize: '1.125rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Budget Overview
                  </Typography>
                  <Typography variant="body2" color="primary">
                    $7.5K / $25K
                  </Typography>
                </Box>
                
                <List dense sx={{ py: 0 }}>
                  {budgetBreakdown.map((item, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: item.color,
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{item.category}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              ${item.amount}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <LinearProgress
                            variant="determinate"
                            value={item.percentage}
                            sx={{
                              mt: 0.5,
                              height: 4,
                              borderRadius: 2,
                              bgcolor: item.color + '20',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: item.color,
                                borderRadius: 2,
                              },
                            }}
                          />
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Button
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => router.push('/dashboard/budget')}
                >
                  Manage Budget
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Next Steps - Middle */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: 360, backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', border: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontFamily: '"Didot", "Bodoni MT", "Playfair Display", serif', fontWeight: 400, fontSize: '1.125rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Next Steps
                  </Typography>
                  <Chip
                    label="5 URGENT"
                    size="small"
                    sx={{ 
                      bgcolor: '#000000',
                      color: '#FFFFFF',
                      height: 24,
                      fontWeight: 600,
                    }}
                  />
                </Box>
                
                <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
                  {[
                    { id: 1, title: 'Book venue visit', priority: 'high', date: 'This week' },
                    { id: 2, title: 'Finalize guest list', priority: 'high', date: 'Next week' },
                    { id: 3, title: 'Choose photographer', priority: 'medium', date: '2 weeks' },
                    { id: 4, title: 'Send save the dates', priority: 'medium', date: '1 month' },
                    { id: 5, title: 'Book catering tasting', priority: 'low', date: '6 weeks' },
                  ].map((task) => (
                    <ListItem key={task.id} sx={{ px: 0, py: 1.5, borderBottom: '1px solid #F5F5F5' }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: task.priority === 'high' ? '#000000' : task.priority === 'medium' ? '#666666' : '#CCCCCC',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={task.date}
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Button
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => router.push('/dashboard/checklist')}
                >
                  View All Tasks
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Messages & Communication - Right */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: 360, backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', border: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontFamily: '"Didot", "Bodoni MT", "Playfair Display", serif', fontWeight: 400, fontSize: '1.125rem', mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Messages
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: '#FAFAFA', mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#000000', color: '#FFFFFF', mr: 2 }}>
                      <MessageIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Venue Coordinator
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        "Your venue is confirmed for June 15th!"
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      2h ago
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: '#FAFAFA', mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#666666', color: '#FFFFFF', mr: 2 }}>
                      <MessageIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Wedding Planner
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        "Let's schedule a call this week"
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      1d ago
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      fontSize: '0.625rem', 
                      letterSpacing: '0.1em',
                      fontFamily: '"Bodoni Moda", serif',
                    }}
                  >
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" variant="outlined" fullWidth>
                      Send Update
                    </Button>
                    <Button size="small" variant="outlined" fullWidth>
                      View All
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Box>
    </DashboardLayout>
  );
}
