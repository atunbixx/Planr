'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/contexts/ToastContext'
import {
  Utensils,
  Leaf,
  Fish,
  Wheat,
  Baby,
  Users,
  AlertCircle,
  ChefHat
} from 'lucide-react'

interface MealOption {
  id: string
  meal_type: string
  course_type: string
  name: string
  description?: string
  ingredients?: string[]
  allergen_info?: string[]
  price_per_plate?: number
  is_default: boolean
}

interface DietaryStats {
  vegetarian_count: number
  vegan_count: number
  pescatarian_count: number
  gluten_free_count: number
  kids_meal_count: number
  has_dietary_restrictions: number
  has_allergies: number
  total_guests: number
}

interface AllergyData {
  allergy: string
  guest_count: number
}

export function MealPreferences() {
  const { couple } = useAuth()
  const { addToast } = useToastContext()
  const [loading, setLoading] = useState(true)
  const [mealOptions, setMealOptions] = useState<MealOption[]>([])
  const [dietaryStats, setDietaryStats] = useState<DietaryStats | null>(null)
  const [allergyData, setAllergyData] = useState<AllergyData[]>([])
  const [showAddMealOption, setShowAddMealOption] = useState(false)

  const mealTypeIcons = {
    standard: <Utensils className="h-4 w-4" />,
    vegetarian: <Leaf className="h-4 w-4 text-green-600" />,
    vegan: <Leaf className="h-4 w-4 text-green-700" />,
    pescatarian: <Fish className="h-4 w-4 text-blue-600" />,
    gluten_free: <Wheat className="h-4 w-4 text-amber-600" />,
    kids_meal: <Baby className="h-4 w-4 text-pink-600" />,
    vendor_meal: <Users className="h-4 w-4 text-gray-600" />
  }

  const mealTypeLabels = {
    standard: 'Standard',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    pescatarian: 'Pescatarian',
    gluten_free: 'Gluten Free',
    kids_meal: 'Kids Meal',
    vendor_meal: 'Vendor Meal'
  }

  const courseTypeLabels = {
    appetizer: 'Appetizer',
    main: 'Main Course',
    dessert: 'Dessert',
    kids: 'Kids Menu'
  }

  // Load meal options and statistics
  useEffect(() => {
    if (!couple?.id) return
    loadMealData()
  }, [couple?.id])

  const loadMealData = async () => {
    if (!couple?.id) return

    try {
      setLoading(true)

      // Load meal options
      const { data: optionsData, error: optionsError } = await supabase
        .from('meal_options')
        .select('*')
        .eq('couple_id', couple.id)
        .order('course_type')
        .order('meal_type')

      if (optionsError) throw optionsError
      setMealOptions(optionsData || [])

      // Load dietary statistics
      const { data: statsData, error: statsError } = await supabase
        .from('dietary_statistics')
        .select('*')
        .eq('couple_id', couple.id)
        .single()

      if (statsError && statsError.code !== 'PGRST116') throw statsError
      setDietaryStats(statsData)

      // Load allergy summary
      const { data: allergyData, error: allergyError } = await supabase
        .rpc('get_allergy_summary', { p_couple_id: couple.id })

      if (allergyError) throw allergyError
      setAllergyData(allergyData || [])

    } catch (error: any) {
      console.error('Error loading meal data:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load meal preferences data',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Add meal option form
  const AddMealOptionForm = () => {
    const [formData, setFormData] = useState({
      meal_type: 'standard',
      course_type: 'main',
      name: '',
      description: '',
      ingredients: '',
      allergen_info: '',
      price_per_plate: 0,
      is_default: false
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!couple?.id) return
      if (!formData.name.trim()) {
        addToast({
          title: 'Error',
          description: 'Meal name is required',
          type: 'error'
        })
        return
      }

      setIsSubmitting(true)
      try {
        const { error } = await supabase
          .from('meal_options')
          .insert({
            couple_id: couple.id,
            meal_type: formData.meal_type,
            course_type: formData.course_type,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()) : null,
            allergen_info: formData.allergen_info ? formData.allergen_info.split(',').map(a => a.trim()) : null,
            price_per_plate: formData.price_per_plate || null,
            is_default: formData.is_default
          })

        if (error) throw error

        addToast({
          title: 'Success',
          description: 'Meal option added successfully',
          type: 'success'
        })

        setShowAddMealOption(false)
        loadMealData()
      } catch (error: any) {
        console.error('Error adding meal option:', error)
        addToast({
          title: 'Error',
          description: error.message || 'Failed to add meal option',
          type: 'error'
        })
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Meal Option</CardTitle>
          <CardDescription>Define menu options for your wedding</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Meal Type"
                value={formData.meal_type}
                onChange={(e) => setFormData(prev => ({ ...prev, meal_type: e.target.value }))}
                fullWidth
              >
                {Object.entries(mealTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>

              <Select
                label="Course Type"
                value={formData.course_type}
                onChange={(e) => setFormData(prev => ({ ...prev, course_type: e.target.value }))}
                fullWidth
              >
                {Object.entries(courseTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>

            <Input
              label="Meal Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Herb-Crusted Chicken"
              required
              fullWidth
            />

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Pan-seared chicken breast with rosemary and thyme"
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ingredients (comma-separated)"
                value={formData.ingredients}
                onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                placeholder="e.g., chicken, rosemary, thyme, olive oil"
                fullWidth
              />

              <Input
                label="Allergens (comma-separated)"
                value={formData.allergen_info}
                onChange={(e) => setFormData(prev => ({ ...prev, allergen_info: e.target.value }))}
                placeholder="e.g., gluten, dairy"
                fullWidth
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Price per Plate ($)"
                type="number"
                step="0.01"
                value={formData.price_per_plate}
                onChange={(e) => setFormData(prev => ({ ...prev, price_per_plate: Number(e.target.value) }))}
                placeholder="75.00"
                fullWidth
              />

              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_default" className="text-sm">
                  Set as default option for this meal type
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" loading={isSubmitting}>
                Add Meal Option
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowAddMealOption(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading meal preferences...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Meal Preferences</h2>
          <p className="text-gray-600">Manage dietary requirements and meal options</p>
        </div>
        <Button onClick={() => setShowAddMealOption(true)}>
          Add Meal Option
        </Button>
      </div>

      {/* Dietary Statistics */}
      {dietaryStats && dietaryStats.total_guests > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{dietaryStats.vegetarian_count}</div>
                  <p className="text-xs text-gray-500">Vegetarian</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-700" />
                <div>
                  <div className="text-2xl font-bold">{dietaryStats.vegan_count}</div>
                  <p className="text-xs text-gray-500">Vegan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Wheat className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="text-2xl font-bold">{dietaryStats.gluten_free_count}</div>
                  <p className="text-xs text-gray-500">Gluten Free</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{dietaryStats.has_allergies}</div>
                  <p className="text-xs text-gray-500">Have Allergies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Meal Option Form */}
      {showAddMealOption && <AddMealOptionForm />}

      {/* Allergies Summary */}
      {allergyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allergy Summary</CardTitle>
            <CardDescription>Common allergies among your guests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allergyData.map((item) => (
                <div key={item.allergy} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="font-medium capitalize">{item.allergy}</span>
                  <Badge variant="secondary">
                    {item.guest_count} {item.guest_count === 1 ? 'guest' : 'guests'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meal Options by Course */}
      {['appetizer', 'main', 'dessert', 'kids'].map(courseType => {
        const courseOptions = mealOptions.filter(option => option.course_type === courseType)
        if (courseOptions.length === 0) return null

        return (
          <Card key={courseType}>
            <CardHeader>
              <CardTitle>{courseTypeLabels[courseType as keyof typeof courseTypeLabels]}</CardTitle>
              <CardDescription>Available options for this course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courseOptions.map((option) => (
                  <div key={option.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {mealTypeIcons[option.meal_type as keyof typeof mealTypeIcons]}
                          <h4 className="font-medium">{option.name}</h4>
                          {option.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        {option.description && (
                          <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">
                            {mealTypeLabels[option.meal_type as keyof typeof mealTypeLabels]}
                          </Badge>
                          {option.price_per_plate && (
                            <Badge variant="outline">
                              ${option.price_per_plate}/plate
                            </Badge>
                          )}
                          {option.allergen_info && option.allergen_info.length > 0 && (
                            <Badge variant="outline" className="text-red-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {option.allergen_info.join(', ')}
                            </Badge>
                          )}
                        </div>
                        {option.ingredients && option.ingredients.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Ingredients:</span> {option.ingredients.join(', ')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this meal option?')) {
                            try {
                              const { error } = await supabase
                                .from('meal_options')
                                .delete()
                                .eq('id', option.id)
                              
                              if (error) throw error
                              
                              addToast({
                                title: 'Success',
                                description: 'Meal option deleted',
                                type: 'success'
                              })
                              loadMealData()
                            } catch (error: any) {
                              addToast({
                                title: 'Error',
                                description: 'Failed to delete meal option',
                                type: 'error'
                              })
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Empty state */}
      {mealOptions.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No meal options yet</h3>
            <p className="text-gray-500 mb-4">
              Start by adding meal options for your wedding menu
            </p>
            <Button onClick={() => setShowAddMealOption(true)}>
              Add Your First Meal Option
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}