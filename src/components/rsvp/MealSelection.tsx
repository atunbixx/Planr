'use client'

import React from 'react'
import { cn } from '@/utils/cn'

interface MealOption {
  id: string
  name: string
  description: string
  category: string
}

interface MealSelectionProps {
  mealOptions: MealOption[]
  selectedMeal: string
  dietaryRestrictions: string
  onMealSelect: (mealId: string) => void
  onDietaryChange: (value: string) => void
  error?: string
}

const MEAL_ICONS: Record<string, string> = {
  beef: '🥩',
  chicken: '🍗',
  fish: '🐟',
  vegetarian: '🥗',
  vegan: '🌱',
  child: '🧒',
  default: '🍽️'
}

export default function MealSelection({
  mealOptions,
  selectedMeal,
  dietaryRestrictions,
  onMealSelect,
  onDietaryChange,
  error
}: MealSelectionProps) {
  const getMealIcon = (category: string) => {
    return MEAL_ICONS[category.toLowerCase()] || MEAL_ICONS.default
  }

  const groupedMeals = mealOptions.reduce((acc, meal) => {
    const category = meal.category || 'Main Course'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(meal)
    return acc
  }, {} as Record<string, MealOption[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedMeals).map(([category, meals]) => (
        <div key={category}>
          <h3 className="font-semibold text-lg mb-3">{category}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meals.map((meal) => (
              <button
                key={meal.id}
                type="button"
                onClick={() => onMealSelect(meal.id)}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all duration-200',
                  'hover:shadow-md hover:scale-[1.01]',
                  selectedMeal === meal.id
                    ? 'border-wedding-sage bg-wedding-sage/10'
                    : 'border-gray-200 hover:border-gray-300',
                  'flex items-start gap-3'
                )}
              >
                <span className="text-2xl flex-shrink-0">
                  {getMealIcon(meal.category)}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-ink">{meal.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{meal.description}</p>
                </div>
                {selectedMeal === meal.id && (
                  <span className="text-wedding-sage flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <p className="text-red-500 text-sm font-medium">
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </span>
        </p>
      )}

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dietary Restrictions or Allergies
        </label>
        <textarea
          value={dietaryRestrictions}
          onChange={(e) => onDietaryChange(e.target.value)}
          className={cn(
            'w-full p-3 rounded-lg border border-gray-300',
            'focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink',
            'resize-none transition-all duration-200',
            'placeholder:text-gray-400'
          )}
          rows={3}
          placeholder="Please let us know about any dietary restrictions, allergies, or special requirements..."
        />
        <p className="text-xs text-gray-500 mt-1">
          We'll do our best to accommodate your needs
        </p>
      </div>
    </div>
  )
}