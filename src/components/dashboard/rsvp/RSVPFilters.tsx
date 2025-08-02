'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { GUEST_CATEGORIES, RSVP_STATUSES } from '@/hooks/useGuests'
import { Guest, RSVPStatus, GuestCategory } from '@/types/database'
import { Search, Filter, Calendar, RotateCcw } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'

interface RSVPFiltersProps {
  selectedStatus: RSVPStatus | 'all'
  setSelectedStatus: (status: RSVPStatus | 'all') => void
  selectedCategory: GuestCategory | 'all'
  setSelectedCategory: (category: GuestCategory | 'all') => void
  selectedMeal: string
  setSelectedMeal: (meal: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  dateRange: { start: Date | null; end: Date | null }
  setDateRange: (range: { start: Date | null; end: Date | null }) => void
  guests: Guest[]
}

export function RSVPFilters({
  selectedStatus,
  setSelectedStatus,
  selectedCategory,
  setSelectedCategory,
  selectedMeal,
  setSelectedMeal,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  guests
}: RSVPFiltersProps) {
  // Get unique meal choices from guests
  const mealChoices = Array.from(new Set(
    guests
      .map(g => g.meal_choice)
      .filter(Boolean)
  )) as string[]

  // Reset all filters
  const handleReset = () => {
    setSelectedStatus('all')
    setSelectedCategory('all')
    setSelectedMeal('all')
    setSearchQuery('')
    setDateRange({ start: null, end: null })
  }

  // Check if any filters are active
  const hasActiveFilters = 
    selectedStatus !== 'all' ||
    selectedCategory !== 'all' ||
    selectedMeal !== 'all' ||
    searchQuery !== '' ||
    dateRange.start !== null ||
    dateRange.end !== null

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* RSVP Status Filter */}
            <div>
              <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mb-1 block">
                RSVP Status
              </Label>
              <Select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as RSVPStatus | 'all')}
                className="w-full"
              >
                <option value="all">All Statuses</option>
                {RSVP_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <Label htmlFor="category-filter" className="text-sm font-medium text-gray-700 mb-1 block">
                Guest Category
              </Label>
              <Select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as GuestCategory | 'all')}
                className="w-full"
              >
                <option value="all">All Categories</option>
                {GUEST_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Meal Choice Filter */}
            <div>
              <Label htmlFor="meal-filter" className="text-sm font-medium text-gray-700 mb-1 block">
                Meal Choice
              </Label>
              <Select
                id="meal-filter"
                value={selectedMeal}
                onChange={(e) => setSelectedMeal(e.target.value)}
                className="w-full"
              >
                <option value="all">All Meals</option>
                {mealChoices.map(meal => (
                  <option key={meal} value={meal}>
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Date Range Filters */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                Response From
              </Label>
              <DatePicker
                date={dateRange.start}
                onDateChange={(date) => setDateRange({ ...dateRange, start: date })}
                placeholder="Start date"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                Response To
              </Label>
              <DatePicker
                date={dateRange.end}
                onDateChange={(date) => setDateRange({ ...dateRange, end: date })}
                placeholder="End date"
              />
            </div>
          </div>

          {/* Filter Actions */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-600">
                <Filter className="inline h-4 w-4 mr-1" />
                Filters applied
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}