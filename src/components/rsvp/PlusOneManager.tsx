'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import MealSelection from './MealSelection'

interface MealOption {
  id: string
  name: string
  description: string
  category: string
}

interface PlusOneManagerProps {
  plusOneAttending: boolean
  plusOneName: string
  plusOneMealChoice: string
  plusOneDietaryRestrictions: string
  mealOptions: MealOption[]
  onAttendingChange: (value: boolean) => void
  onNameChange: (value: string) => void
  onMealSelect: (value: string) => void
  onDietaryChange: (value: string) => void
  errors?: {
    name?: string
    meal?: string
  }
}

export default function PlusOneManager({
  plusOneAttending,
  plusOneName,
  plusOneMealChoice,
  plusOneDietaryRestrictions,
  mealOptions,
  onAttendingChange,
  onNameChange,
  onMealSelect,
  onDietaryChange,
  errors
}: PlusOneManagerProps) {
  return (
    <div className="space-y-6">
      {/* Plus One Attendance Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onAttendingChange(true)}
          className={cn(
            'p-6 rounded-lg border-2 transition-all duration-200',
            'hover:shadow-md hover:scale-[1.01]',
            plusOneAttending === true
              ? 'border-wedding-sage bg-wedding-sage/10'
              : 'border-gray-200 hover:border-gray-300',
            'flex flex-col items-center text-center'
          )}
        >
          <span className="text-4xl mb-2">👥</span>
          <span className="font-semibold">Yes, bringing a guest</span>
        </button>

        <button
          type="button"
          onClick={() => onAttendingChange(false)}
          className={cn(
            'p-6 rounded-lg border-2 transition-all duration-200',
            'hover:shadow-md hover:scale-[1.01]',
            plusOneAttending === false
              ? 'border-gray-400 bg-gray-100'
              : 'border-gray-200 hover:border-gray-300',
            'flex flex-col items-center text-center'
          )}
        >
          <span className="text-4xl mb-2">👤</span>
          <span className="font-semibold">Just me</span>
        </button>
      </div>

      {/* Plus One Details */}
      {plusOneAttending && (
        <div className="space-y-6 mt-8 animate-in slide-in-from-top-2 duration-300">
          <div>
            <h3 className="font-semibold text-lg mb-4">Guest Details</h3>
            <Input
              label="Guest's Full Name"
              placeholder="Enter your guest's name"
              value={plusOneName}
              onChange={(e) => onNameChange(e.target.value)}
              error={errors?.name}
              fullWidth
            />
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Guest's Meal Selection</h3>
            <MealSelection
              mealOptions={mealOptions}
              selectedMeal={plusOneMealChoice}
              dietaryRestrictions={plusOneDietaryRestrictions}
              onMealSelect={onMealSelect}
              onDietaryChange={onDietaryChange}
              error={errors?.meal}
            />
          </div>
        </div>
      )}
    </div>
  )
}