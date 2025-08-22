'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users as PeopleIcon, 
  DollarSign as MoneyIcon, 
  CheckCircle as CheckIcon, 
  Store as VendorIcon, 
  Calendar as CalendarIcon, 
  Heart as HeartIcon, 
  Image as PhotoIcon, 
  MessageSquare as MessageIcon, 
  Activity as TimelineIcon, 
  CheckSquare as CheckBoxIcon, 
  Clock as ScheduleIcon, 
  Trophy as TrophyIcon, 
  TrendingUp as TrendingUpIcon, 
  Clock as ClockIcon, 
  Calendar as EventIcon,
  ArrowRight
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'
import PremiumDashboardOverview from '@/components/dashboard/PremiumDashboardOverview'

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  path: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, path }) => {
  const router = useRouter();
  return (
    <div className="group hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 cursor-pointer" onClick={() => router.push(path)}>
      <Card className="h-full border-none shadow-[0_2px_8px_rgba(0,0,0,0.06)] group-hover:shadow-none transition-all duration-300">
        <CardHeader className="flex flex-col items-center text-center pb-4 pt-8">
          <div className="mb-4 p-3 bg-[#F5F5F5] group-hover:bg-black transition-all duration-300">
            <div className="group-hover:text-white transition-all duration-300">
              {icon}
            </div>
          </div>
          <CardTitle className="text-lg font-light text-black">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <p className="text-sm text-[#666666] font-light leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
};


export default function DashboardPage() {
  const router = useRouter();
  const { user, signout, isLoading } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [guestTotal, setGuestTotal] = useState<number | null>(null);
  const [vendorTotal, setVendorTotal] = useState<number | null>(null);
  const [vendorBookedTotal, setVendorBookedTotal] = useState<number | null>(null);
  const [guestAccepted, setGuestAccepted] = useState<number | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<{ totalAmount: number; totalAllocated: number; totalActual: number; percentSpent?: number } | null>(null);
  const [weddingDate, setWeddingDate] = useState<Date | null>(null);
  const [venue, setVenue] = useState<string | null>(null);
  const [teamRoles, setTeamRoles] = useState<Array<{ key: string; role: string; status: 'needed' | 'hired' }>>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

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

        const wd = await fetch('/api/wedding-details', { headers })
        if (wd.ok) {
          const wj = await wd.json()
          const w = wj?.data
          if (w?.weddingDate) setWeddingDate(new Date(w.weddingDate))
          if (w?.venue) setVenue(w.venue)
        }

        const cl = await fetch('/api/dashboard/checklist', { headers })
        if (cl.ok) {
          const cj = await cl.json()
          setTasks((cj?.data?.items || []).map((i: any, idx: number) => ({ id: idx+1, title: i.title, completed: i.completed })))
          setCompletedTasks(cj?.data?.completed || 0)
          setTotalTasks(cj?.data?.total || 0)
        }

        const tr = await fetch('/api/dashboard/team', { headers })
        if (tr.ok) {
          const tj = await tr.json()
          setTeamRoles(tj?.data || [])
        }
        
        const ra = await fetch('/api/dashboard/activity', { headers })
        if (ra.ok) {
          const rj = await ra.json()
          setRecentActivity(rj?.data?.items || [])
        }
      } catch (e) {
        console.error('Failed to load dashboard stats', e);
      }
    };

    fetchStats();
  }, []);

  const getDaysUntilWedding = () => {
    if (!weddingDate) return '-';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weddingDay = new Date(weddingDate);
    weddingDay.setHours(0, 0, 0, 0);
    const diffTime = weddingDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading || !user) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your dashboard...</p>
            </div>
        </div>
    )
  }

  const planningProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#E9F5EB]">
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-light text-black mb-4">Welcome, {user.email}!</h1>
            <p className="text-xl text-[#666666] font-light">Let's get your wedding planned. Here's your overview.</p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Countdown and Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-1 flex flex-col justify-center items-center text-center bg-black text-white border-none shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] transition-all duration-300">
                  <CardContent className="p-8">
                    <p className="text-7xl font-light mb-2">{getDaysUntilWedding()}</p>
                    <p className="text-lg font-light tracking-wide">days to go</p>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2 shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-2xl font-light">Key Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-6 text-base">
                    <div className="space-y-2">
                      <p className="text-[#666666] text-sm font-medium tracking-wide uppercase">Wedding Date</p>
                      <p className="font-light text-black text-lg">{weddingDate ? weddingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[#666666] text-sm font-medium tracking-wide uppercase">Venue</p>
                      <p className="font-light text-black text-lg">{venue || 'Not selected'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[#666666] text-sm font-medium tracking-wide uppercase">Guests</p>
                      <p className="font-light text-black text-lg">{guestTotal ?? 0} invited, {guestAccepted ?? 0} accepted</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[#666666] text-sm font-medium tracking-wide uppercase">Vendors</p>
                      <p className="font-light text-black text-lg">{vendorBookedTotal ?? 0} / {vendorTotal ?? 0} booked</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Planning Progress */}
              <Card className="shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-light">Planning Progress</CardTitle>
                  <CardDescription className="text-lg text-[#666666] mt-2">{completedTasks} of {totalTasks} tasks completed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Progress value={planningProgress} className="h-3 bg-[#F5F5F5]" />
                  <div className="flex justify-between text-base text-[#666666]">
                    <span className="font-medium">Tasks</span>
                    <span className="font-light text-xl">{planningProgress}%</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white transition-all duration-200 font-medium tracking-wide" onClick={() => router.push('/dashboard/checklist')}>View Checklist</Button>
                </CardFooter>
              </Card>

              {/* Quick Actions */}
              <div>
                <h2 className="text-3xl font-light text-black mb-8">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <FeatureCard title="Manage Guests" description="Add, edit, and track RSVPs" icon={<PeopleIcon className="w-5 h-5 text-black"/>} path="/dashboard/guests" />
                  <FeatureCard title="Track Budget" description="Keep an eye on your spending" icon={<MoneyIcon className="w-5 h-5 text-black"/>} path="/dashboard/budget" />
                  <FeatureCard title="Find Vendors" description="Discover and book professionals" icon={<VendorIcon className="w-5 h-5 text-black"/>} path="/dashboard/vendors" />
                  <FeatureCard title="View Timeline" description="See your wedding day schedule" icon={<CalendarIcon className="w-5 h-5 text-black"/>} path="/dashboard/timeline" />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Budget Overview */}
              <Card className="shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-light">Budget Overview</CardTitle>
                  <CardDescription className="text-lg text-[#666666] mt-2">
                    ${(budgetSummary?.totalActual ?? 0).toLocaleString()} spent of ${(budgetSummary?.totalAmount ?? 0).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Progress value={budgetSummary?.percentSpent || 0} className="h-3 bg-[#F5F5F5]" />
                    <div className="text-right">
                      <span className="text-2xl font-light text-black">{Math.round(budgetSummary?.percentSpent || 0)}%</span>
                    </div>
                </CardContent>
                <CardFooter className="pt-6">
                    <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white transition-all duration-200 font-medium tracking-wide w-full" onClick={() => router.push('/dashboard/budget')}>
                        Manage Budget
                    </Button>
                </CardFooter>
              </Card>

              {/* Wedding Team */}
              <Card className="shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-light">Your Wedding Team</CardTitle>
                  <CardDescription className="text-lg text-[#666666] mt-2">Key vendors for your big day</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  {teamRoles.slice(0, 4).map((vendor) => (
                    <div key={vendor.key} className="text-center space-y-3">
                      <Avatar className="mx-auto mb-3 w-12 h-12">
                        <AvatarFallback className="bg-[#F5F5F5] text-black"><VendorIcon className="w-6 h-6"/></AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium text-black">{vendor.role}</p>
                      <Badge variant={vendor.status === 'hired' ? "default" : "secondary"} className="text-xs bg-black text-white border-none">{vendor.status === 'hired' ? 'Hired' : 'Needed'}</Badge>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="pt-6">
                  <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white transition-all duration-200 font-medium tracking-wide w-full" onClick={() => router.push('/dashboard/vendors')}>Manage Your Team</Button>
                </CardFooter>
              </Card>

              {/* Recent Activity */}
              <Card className="shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-light">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {recentActivity.slice(0, 4).map((activity, index) => (
                      <li key={activity.id || `activity-${index}`} className="flex items-start text-base border-b border-[#F5F5F5] pb-3 last:border-b-0">
                        <CheckIcon className="w-5 h-5 mr-4 text-black mt-0.5 flex-shrink-0" />
                        <span className="text-[#666666] font-light">{activity.title}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                    <Button variant="ghost" size="sm" className="text-black hover:bg-[#F5F5F5] font-medium tracking-wide" onClick={() => router.push('/admin/logs')}>
                        View all activity <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
