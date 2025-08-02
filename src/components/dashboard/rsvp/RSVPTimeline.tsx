'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Guest } from '@/types/database'
import { format, subDays, startOfDay } from 'date-fns'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface RSVPTimelineProps {
  guests: Guest[]
}

export function RSVPTimeline({ guests }: RSVPTimelineProps) {
  // Calculate timeline data for the last 30 days
  const timelineData = useMemo(() => {
    const today = startOfDay(new Date())
    const thirtyDaysAgo = subDays(today, 30)
    
    // Group responses by date
    const responsesByDate = guests.reduce((acc, guest) => {
      if (guest.rsvp_date && guest.rsvp_status !== 'pending') {
        const date = format(new Date(guest.rsvp_date), 'yyyy-MM-dd')
        if (!acc[date]) {
          acc[date] = {
            attending: 0,
            not_attending: 0,
            maybe: 0,
            total: 0
          }
        }
        
        if (guest.rsvp_status === 'attending') acc[date].attending++
        else if (guest.rsvp_status === 'not_attending') acc[date].not_attending++
        else if (guest.rsvp_status === 'maybe') acc[date].maybe++
        acc[date].total++
      }
      return acc
    }, {} as Record<string, { attending: number; not_attending: number; maybe: number; total: number }>)

    // Create array of last 30 days
    const timeline = []
    let cumulativeAttending = 0
    let cumulativeNotAttending = 0
    let cumulativeTotal = 0
    
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayData = responsesByDate[dateStr] || { attending: 0, not_attending: 0, maybe: 0, total: 0 }
      
      cumulativeAttending += dayData.attending
      cumulativeNotAttending += dayData.not_attending
      cumulativeTotal += dayData.total
      
      timeline.push({
        date: dateStr,
        day: format(date, 'MMM d'),
        ...dayData,
        cumulativeAttending,
        cumulativeNotAttending,
        cumulativeTotal
      })
    }
    
    return timeline
  }, [guests])

  // Calculate max value for chart scaling
  const maxValue = Math.max(
    ...timelineData.map(d => Math.max(d.total, d.cumulativeTotal / 10))
  )

  // Calculate trend
  const lastWeekResponses = timelineData.slice(-7).reduce((sum, d) => sum + d.total, 0)
  const previousWeekResponses = timelineData.slice(-14, -7).reduce((sum, d) => sum + d.total, 0)
  const trend = previousWeekResponses > 0 
    ? ((lastWeekResponses - previousWeekResponses) / previousWeekResponses * 100).toFixed(1)
    : '0'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Response Timeline</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            {parseFloat(trend) > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600">+{trend}% this week</span>
              </>
            ) : parseFloat(trend) < 0 ? (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-red-600">{trend}% this week</span>
              </>
            ) : (
              <span className="text-gray-500">No change this week</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="relative h-48">
            <div className="absolute inset-0 flex items-end justify-between gap-1">
              {timelineData.map((day, index) => {
                const barHeight = maxValue > 0 ? (day.total / maxValue) * 100 : 0
                const attendingHeight = maxValue > 0 ? (day.attending / maxValue) * 100 : 0
                const notAttendingHeight = maxValue > 0 ? (day.not_attending / maxValue) * 100 : 0
                
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end relative group"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      <div>{day.day}</div>
                      <div>Total: {day.total}</div>
                      <div className="text-green-400">Attending: {day.attending}</div>
                      <div className="text-red-400">Not Attending: {day.not_attending}</div>
                    </div>
                    
                    {/* Stacked bar */}
                    <div className="w-full flex flex-col" style={{ height: `${barHeight}%` }}>
                      <div
                        className="bg-green-500 transition-all duration-300"
                        style={{ height: `${day.total > 0 ? (day.attending / day.total) * 100 : 0}%` }}
                      />
                      <div
                        className="bg-red-500 transition-all duration-300"
                        style={{ height: `${day.total > 0 ? (day.not_attending / day.total) * 100 : 0}%` }}
                      />
                      <div
                        className="bg-amber-500 transition-all duration-300"
                        style={{ height: `${day.total > 0 ? (day.maybe / day.total) * 100 : 0}%` }}
                      />
                    </div>
                    
                    {/* Show date label for every 5th day */}
                    {index % 5 === 0 && (
                      <div className="absolute -bottom-6 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(day.date), 'MMM d')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Cumulative line (simplified) */}
            <svg className="absolute inset-0 pointer-events-none">
              <polyline
                fill="none"
                stroke="rgb(99 102 241)"
                strokeWidth="2"
                points={timelineData.map((day, index) => {
                  const x = (index / (timelineData.length - 1)) * 100
                  const y = 100 - (maxValue > 0 ? (day.cumulativeTotal / (maxValue * 10)) * 100 : 0)
                  return `${x}%,${y}%`
                }).join(' ')}
              />
            </svg>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm mt-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Attending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Not Attending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded" />
              <span>Maybe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-0.5 bg-indigo-500" />
              <span>Cumulative</span>
            </div>
          </div>
          
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {timelineData[timelineData.length - 1]?.cumulativeTotal || 0}
              </div>
              <div className="text-xs text-gray-500">Total Responses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {timelineData[timelineData.length - 1]?.cumulativeAttending || 0}
              </div>
              <div className="text-xs text-gray-500">Total Attending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {timelineData.slice(-7).reduce((sum, d) => sum + d.total, 0)}
              </div>
              <div className="text-xs text-gray-500">Last 7 Days</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}