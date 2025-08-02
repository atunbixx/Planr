'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    partnerName: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { signUp } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Your name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      await signUp(formData.email, formData.password, {
        fullName: formData.fullName,
        partnerName: formData.partnerName || undefined
      })
      
      // Redirect to onboarding to create couple profile
      router.push('/onboarding')
    } catch (error: unknown) {
      console.error('Sign up failed:', error)
      setErrors({ general: (error as Error).message || 'Failed to create account' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding-blush via-paper to-wedding-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-ink mb-2">Join Wedding Planner</h1>
          <p className="text-gray-600">Create your account and start planning your dream wedding</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Fill in your details to get started with your wedding planning journey
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                  {errors.general}
                </div>
              )}

              <Input
                label="Your Full Name"
                type="text"
                value={formData.fullName}
                onChange={handleChange('fullName')}
                error={errors.fullName}
                placeholder="Enter your full name"
                fullWidth
                disabled={isLoading}
              />

              <Input
                label="Partner's Name (Optional)"
                type="text"
                value={formData.partnerName}
                onChange={handleChange('partnerName')}
                error={errors.partnerName}
                placeholder="Enter your partner's name"
                helperText="You can add this later if you prefer"
                fullWidth
                disabled={isLoading}
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={errors.email}
                placeholder="you@example.com"
                fullWidth
                disabled={isLoading}
              />

              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                error={errors.password}
                placeholder="Create a secure password"
                helperText="At least 6 characters"
                fullWidth
                disabled={isLoading}
              />

              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
                fullWidth
                disabled={isLoading}
              />

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
                className="mt-6"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="link-editorial font-medium text-accent hover:text-accent/80">
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <Card className="mt-6 bg-wedding-cream/50">
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy. 
              Your wedding planning data is secure and private.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}