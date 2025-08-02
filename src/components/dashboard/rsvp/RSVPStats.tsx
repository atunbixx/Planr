'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Guest } from '@/types/database'
import { Users, UserCheck, UserX, Clock, Mail, Percent } from 'lucide-react'

interface RSVPStatsProps {
  guests: Guest[]
  guestStats: {
    totalGuests: number
    totalInvited: number
    attendingGuests: number
    notAttendingGuests: number
    pendingResponses: number
    totalMealsNeeded: number
  }
}

export function RSVPStats({ guests, guestStats }: RSVPStatsProps) {
  // Calculate additional stats
  const responseRate = guestStats.totalInvited > 0 
    ? Math.round((guestStats.attendingGuests + guestStats.notAttendingGuests) / guestStats.totalInvited * 100)
    : 0

  const attendanceRate = guestStats.totalInvited > 0
    ? Math.round(guestStats.attendingGuests / guestStats.totalInvited * 100)
    : 0

  // Calculate stats for plus ones
  const plusOnesAttending = guests.filter(g => g.rsvp_status === 'attending' && g.plus_one_attending).length
  const totalAttendees = guestStats.attendingGuests + plusOnesAttending

  // Days until wedding (would need wedding date from couple context)
  const daysUntilDeadline = 30 // This would be calculated from actual deadline

  const stats = [
    {
      title: 'Total Invited',
      value: guestStats.totalInvited,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: `${guestStats.totalGuests} total guests`
    },
    {
      title: 'Confirmed Attending',
      value: guestStats.attendingGuests,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: `+${plusOnesAttending} plus ones`
    },
    {
      title: 'Not Attending',
      value: guestStats.notAttendingGuests,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Declined invitation'
    },
    {
      title: 'Pending Responses',
      value: guestStats.pendingResponses,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: `${daysUntilDeadline} days until deadline`
    },
    {
      title: 'Response Rate',
      value: `${responseRate}%`,
      icon: Percent,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Of invited guests'
    },
    {
      title: 'Total Attendees',
      value: totalAttendees,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Including plus ones'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className={`absolute top-0 right-0 p-4 ${stat.bgColor} rounded-bl-2xl`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              
              {stat.title === 'Response Rate' && (
                <div className="mt-2">
                  <Progress value={responseRate} className="h-2" />
                </div>
              )}
              
              {stat.title === 'Confirmed Attending' && guestStats.totalInvited > 0 && (
                <div className="mt-2">
                  <Progress value={attendanceRate} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{attendanceRate}% attendance rate</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}