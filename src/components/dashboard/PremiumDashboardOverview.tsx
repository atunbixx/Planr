'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  DollarSign,
  Store,
  CheckCircle,
  Calendar,
  Activity,
  Image,
  TrendingUp,
  Trophy,
  Heart,
  ArrowRight,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import WeddingProgressChart from '@/components/charts/WeddingProgressChart';
import BudgetTrackingChart from '@/components/charts/BudgetTrackingChart';
import WeddingCountdown from '@/components/ui/WeddingCountdown';

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
    <div 
      className={cn(
        "h-full transition-all duration-200",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <Card className="h-full bg-white border border-gray-100 relative overflow-hidden hover:shadow-md">
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback 
                className="text-white font-semibold"
                style={{ backgroundColor: gradient }}
              >
                {icon}
              </AvatarFallback>
            </Avatar>
            {trend && (
              <Badge 
                className={cn(
                  "text-xs font-semibold",
                  trend.isPositive 
                    ? "bg-green-100 text-green-600 hover:bg-green-100" 
                    : "bg-red-100 text-red-600 hover:bg-red-100"
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </Badge>
            )}
          </div>
          
          <h3 className="text-3xl font-bold text-slate-900 mb-1">
            {value}
          </h3>
          
          <h4 className="text-lg font-medium text-slate-600 mb-1">
            {title}
          </h4>
          
          {subtitle && (
            <p className="text-sm text-slate-500">
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
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
    <div 
      className="cursor-pointer h-full transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl"
      onClick={onClick}
    >
      <Card className="h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback 
                className="font-semibold"
                style={{ 
                  backgroundColor: `${color}20`, 
                  color: color 
                }}
              >
                {icon}
              </AvatarFallback>
            </Avatar>
            
            {badge && (
              <Badge className="text-xs font-semibold bg-opacity-20">
                 {badge}
               </Badge>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full"
              style={{
                color: color,
                backgroundColor: `${color}10`
              }}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <h3 className="text-lg font-semibold mb-2 text-slate-900">
            {title}
          </h3>
          
          <p className="text-sm text-slate-600 mb-4 flex-grow">
            {description}
          </p>
          
          {progress !== undefined && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-slate-500">
                  Progress
                </span>
                <span className="text-xs text-slate-500">
                  {progress}%
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-2"
                style={{
                  backgroundColor: `${color}20`
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
  weddingDate?: Date;
}

const PremiumDashboardOverview: React.FC<PremiumDashboardOverviewProps> = ({
  guestTotal = 0,
  vendorTotal = 0,
  budgetSummary,
  completedTasks = 0,
  totalTasks = 0,
  weddingDate,
}) => {
  const router = useRouter();

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const budgetPercentage = budgetSummary?.percentSpent || 0;

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold mb-2 text-[#722F37]">
          Welcome to Your Wedding Dashboard
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Your complete wedding planning command center with beautiful insights and seamless organization
        </p>
      </div>

      {/* Wedding Countdown */}
      {weddingDate && (
        <div className="mb-8 flex justify-center">
          <WeddingCountdown 
            weddingDate={weddingDate} 
            className="max-w-2xl w-full"
          />
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Guests"
          value={guestTotal}
          subtitle="Invited to your special day"
          icon={<Users className="h-6 w-6" />}
          gradient="#722F37"
          trend={{ value: 12, isPositive: true }}
          onClick={() => router.push('/dashboard/guests')}
        />
        
        <StatsCard
          title="Vendors"
          value={vendorTotal}
          subtitle="Professional services booked"
          icon={<Store className="h-6 w-6" />}
          gradient="#6B7C32"
          trend={{ value: 8, isPositive: true }}
          onClick={() => router.push('/dashboard/vendors')}
        />
        
        <StatsCard
          title="Budget Used"
          value={`${budgetPercentage}%`}
          subtitle={budgetSummary ? `$${budgetSummary.totalActual.toLocaleString()} spent` : 'Track your expenses'}
          icon={<DollarSign className="h-6 w-6" />}
          gradient="#6B7C32"
          trend={{ value: budgetPercentage > 80 ? -5 : 3, isPositive: budgetPercentage <= 80 }}
          onClick={() => router.push('/dashboard/budget')}
        />
        
        <StatsCard
          title="Tasks Done"
          value={`${progressPercentage}%`}
          subtitle={`${completedTasks} of ${totalTasks} completed`}
          icon={<CheckCircle className="h-6 w-6" />}
          gradient="#722F37"
          trend={{ value: 15, isPositive: true }}
          onClick={() => router.push('/dashboard/checklist')}
        />
      </div>

      {/* Wedding Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <WeddingProgressChart
          title="Wedding Planning Progress"
          data={{
            categories: ['Venue', 'Catering', 'Photography', 'Music', 'Flowers', 'Attire'],
            completed: [1, 0, 1, 0, 0, 0],
            total: [1, 3, 2, 2, 1, 2]
          }}
        />
        
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
      </div>
      
      {/* Planning Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 h-full bg-slate-50 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-[#722F37]">
            Overall Progress
          </h3>
          <div className="text-3xl font-bold text-[#722F37] mb-2">
            {Math.round((2 / 11) * 100)}%
          </div>
          <p className="text-sm text-slate-600">
            Tasks completed across all categories
          </p>
        </Card>
        
        <Card className="p-6 h-full bg-slate-50 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-[#6B7C32]">
            Budget Status
          </h3>
          <div className="text-3xl font-bold text-[#6B7C32] mb-2">
            72%
          </div>
          <p className="text-sm text-slate-600">
            Of total budget spent • $8.8k under budget
          </p>
        </Card>
        
        <Card className="p-6 h-full bg-slate-50 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-[#722F37]">
            Next Priority
          </h3>
          <div className="text-xl font-semibold mb-2">
            Book Catering
          </div>
          <p className="text-sm text-slate-600">
            3 vendors to review • 365 days remaining
          </p>
        </Card>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ActionCard
          title="Wedding Timeline"
          description="Plan your perfect day with detailed timeline management and vendor coordination"
          icon={<Activity className="h-6 w-6" />}
          color="#722F37"
          onClick={() => router.push('/dashboard/timeline')}
          progress={65}
        />
        
        <ActionCard
          title="Photo Gallery"
          description="Organize and share your engagement photos, venue visits, and inspiration"
          icon={<Image className="h-6 w-6" />}
          color="#6B7C32"
          onClick={() => router.push('/dashboard/photos')}
          badge="New"
        />
        
        <ActionCard
          title="Table Seating"
          description="Create the perfect seating arrangement for your reception with drag-and-drop ease"
          icon={<Trophy className="h-6 w-6" />}
          color="#6B7C32"
          onClick={() => router.push('/dashboard/seating')}
          progress={30}
        />
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-slate-50 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">
          Quick Actions
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            className="flex-1"
            onClick={() => router.push('/dashboard/guests')}
          >
            <Users className="mr-2 h-4 w-4" />
            Add Guests
          </Button>
          
          <Button
            className="flex-1"
            onClick={() => router.push('/dashboard/vendors')}
          >
            <Store className="mr-2 h-4 w-4" />
            Find Vendors
          </Button>
          
          <Button
            className="flex-1"
            onClick={() => router.push('/dashboard/budget')}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Track Budget
          </Button>
          
          <Button
            className="flex-1"
            onClick={() => router.push('/dashboard/timeline')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Plan Timeline
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PremiumDashboardOverview;