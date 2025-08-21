'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
  Stack,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Store as VendorIcon,
  CheckCircle as CheckIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
  PhotoLibrary as PhotoIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Favorite as HeartIcon,
  ArrowForward as ArrowForwardIcon,
  Schedule as ScheduleIcon,
  EventNote as EventIcon,
} from '@mui/icons-material';
import WeddingProgressChart from '@/components/charts/WeddingProgressChart';
import BudgetTrackingChart from '@/components/charts/BudgetTrackingChart';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactElement;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  trend,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        backgroundColor: '#FFFFFF',
        color: '#1E293B',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #F1F5F9',
      }}
    >
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: gradient,
              color: '#FFFFFF',
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
          {trend && (
            <Chip
              label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
              size="small"
              sx={{
                bgcolor: trend.isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: trend.isPositive ? '#22C55E' : '#EF4444',
                fontWeight: 600,
              }}
            />
          )}
        </Box>
        
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: '#1E293B' }}>
          {value}
        </Typography>
        
        <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5, color: '#475569' }}>
          {title}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  onClick: () => void;
  progress?: number;
  badge?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  color,
  onClick,
  progress,
  badge,
}) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${color}20`,
              color: color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
          
          {badge && (
            <Chip
              label={badge}
              size="small"
              sx={{
                bgcolor: `${color}20`,
                color: color,
                fontWeight: 600,
              }}
            />
          )}
          
          <IconButton
            size="small"
            sx={{
              color: color,
              bgcolor: `${color}10`,
              '&:hover': {
                bgcolor: `${color}20`,
              },
            }}
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
          {title}
        </Typography>
        
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, flexGrow: 1 }}>
          {description}
        </Typography>
        
        {progress !== undefined && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: `${color}20`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: color,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

interface PremiumDashboardOverviewProps {
  guestTotal?: number;
  vendorTotal?: number;
  budgetSummary?: {
    totalAmount: number;
    totalAllocated: number;
    totalActual: number;
    percentSpent?: number;
  };
  completedTasks?: number;
  totalTasks?: number;
}

const PremiumDashboardOverview: React.FC<PremiumDashboardOverviewProps> = ({
  guestTotal = 0,
  vendorTotal = 0,
  budgetSummary,
  completedTasks = 0,
  totalTasks = 0,
}) => {
  const router = useRouter();

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const budgetPercentage = budgetSummary?.percentSpent || 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            mb: 1,
            color: '#722F37',
          }}
        >
          Welcome to Your Wedding Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Your complete wedding planning command center with beautiful insights and seamless organization
        </Typography>
      </Box>

      {/* Stats Cards Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Guests"
            value={guestTotal}
            subtitle="Invited to your special day"
            icon={<PeopleIcon />}
            gradient="#722F37"
            trend={{ value: 12, isPositive: true }}
            onClick={() => router.push('/dashboard/guests')}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Vendors"
            value={vendorTotal}
            subtitle="Professional services booked"
            icon={<VendorIcon />}
            gradient="#6B7C32"
            trend={{ value: 8, isPositive: true }}
            onClick={() => router.push('/dashboard/vendors')}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Budget Used"
            value={`${budgetPercentage}%`}
            subtitle={budgetSummary ? `$${budgetSummary.totalActual.toLocaleString()} spent` : 'Track your expenses'}
            icon={<MoneyIcon />}
            gradient="#6B7C32"
            trend={{ value: budgetPercentage > 80 ? -5 : 3, isPositive: budgetPercentage <= 80 }}
            onClick={() => router.push('/dashboard/budget')}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Tasks Done"
            value={`${progressPercentage}%`}
            subtitle={`${completedTasks} of ${totalTasks} completed`}
            icon={<CheckIcon />}
            gradient="#722F37"
            trend={{ value: 15, isPositive: true }}
            onClick={() => router.push('/dashboard/checklist')}
          />
        </Grid>
      </Grid>

      {/* Wedding Analytics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <WeddingProgressChart
            title="Wedding Planning Progress"
            data={{
              categories: ['Venue', 'Catering', 'Photography', 'Music', 'Flowers', 'Attire'],
              completed: [1, 0, 1, 0, 0, 0],
              total: [1, 3, 2, 2, 1, 2]
            }}
          />
        </Grid>
        
        <Grid size={{ xs: 12, lg: 6 }}>
          <BudgetTrackingChart
            title="Budget Overview"
            data={{
              categories: ['Venue', 'Catering', 'Photography', 'Music', 'Flowers', 'Attire'],
              budgeted: [15000, 8000, 3000, 2000, 1500, 2000],
              actual: [15000, 2500, 3200, 0, 800, 1200],
              totalBudget: 31500,
              totalSpent: 22700,
              variance: -8800
            }}
          />
        </Grid>
        
      </Grid>
      
      {/* Planning Insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#722F37' }}>
              Overall Progress
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#722F37', mb: 1 }}>
              {Math.round((2 / 11) * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tasks completed across all categories
            </Typography>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#6B7C32' }}>
              Budget Status
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#6B7C32', mb: 1 }}>
              72%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Of total budget spent • $8.8k under budget
            </Typography>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#722F37' }}>
              Next Priority
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Book Catering
            </Typography>
            <Typography variant="body2" color="text.secondary">
              3 vendors to review • 365 days remaining
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Action Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ActionCard
            title="Wedding Timeline"
            description="Plan your perfect day with detailed timeline management and vendor coordination"
            icon={<TimelineIcon />}
            color="#722F37"
            onClick={() => router.push('/dashboard/timeline')}
            progress={65}
          />
        </Grid>
        
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ActionCard
            title="Photo Gallery"
            description="Organize and share your engagement photos, venue visits, and inspiration"
            icon={<PhotoIcon />}
            color="#6B7C32"
            onClick={() => router.push('/dashboard/photos')}
            badge="New"
          />
        </Grid>
        
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ActionCard
            title="Table Seating"
            description="Create the perfect seating arrangement for your reception with drag-and-drop ease"
            icon={<TrophyIcon />}
            color="#6B7C32"
            onClick={() => router.push('/dashboard/seating')}
            progress={30}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
          Quick Actions
        </Typography>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            startIcon={<PeopleIcon />}
            onClick={() => router.push('/dashboard/guests')}
            sx={{ flex: 1 }}
          >
            Add Guests
          </Button>
          
          <Button
            variant="contained"
            startIcon={<VendorIcon />}
            onClick={() => router.push('/dashboard/vendors')}
            sx={{ flex: 1 }}
          >
            Find Vendors
          </Button>
          
          <Button
            variant="contained"
            startIcon={<MoneyIcon />}
            onClick={() => router.push('/dashboard/budget')}
            sx={{ flex: 1 }}
          >
            Track Budget
          </Button>
          
          <Button
            variant="contained"
            startIcon={<CalendarIcon />}
            onClick={() => router.push('/dashboard/timeline')}
            sx={{ flex: 1 }}
          >
            Plan Timeline
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PremiumDashboardOverview;