'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()
  const { signup, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'couple'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const result = await signup(formData.email, formData.password, formData.role)
      
      if (result.success) {
        // Redirect to onboarding for couples, dashboard for others
        if (formData.role === 'couple') {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      } else {
        setErrors({ submit: result.error?.message || 'Signup failed' })
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Start planning your perfect wedding
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="you@example.com"
                required
              />

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  I am a...
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="couple">Couple getting married</option>
                  <option value="planner">Wedding planner</option>
                  <option value="vendor">Wedding vendor</option>
                </select>
              </div>

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter your password"
                helpText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
                required
              />

              <Input
                label="Confirm password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
                required
              />

              {errors.submit && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {errors.submit}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/signin" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </Link>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}