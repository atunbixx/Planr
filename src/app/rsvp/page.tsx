'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { InviteCodeInput } from '@/components/rsvp/InviteCodeInput'
import { Button } from '@/components/ui/button'
import SimpleCaptcha from '@/components/rsvp/SimpleCaptcha'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield } from 'lucide-react'

export default function RSVPEntryPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [requiresCaptcha, setRequiresCaptcha] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const handleCodeComplete = (inviteCode: string) => {
    setCode(inviteCode)
    setError('')
  }

  useEffect(() => {
    // Check if user has been rate limited or needs captcha
    const checkSecurityStatus = async () => {
      const fpCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('rsvp_fp='))
      
      if (fpCookie) {
        // User has attempted before, may need captcha
        setAttempts(prev => prev + 1)
        if (attempts >= 2) {
          setRequiresCaptcha(true)
        }
      }
    }
    
    checkSecurityStatus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (code.length !== 6) {
      setError('Please enter your complete 6-character invite code')
      return
    }

    // Check if captcha is required and not verified
    if (requiresCaptcha && !captchaVerified) {
      setError('Please complete the security verification')
      return
    }

    setIsValidating(true)
    setError('')
    setAttempts(prev => prev + 1)

    try {
      // Validate the code
      const response = await fetch('/api/rsvp/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if we need captcha for next attempt
        if (response.status === 429 || attempts >= 2) {
          setRequiresCaptcha(true)
        }
        
        if (response.status === 429) {
          throw new Error('Too many attempts. Please try again later.')
        }
        
        throw new Error(data.error?.message || 'Invalid invite code')
      }

      // Check if server requires captcha
      if (data.data?.requiresCaptcha) {
        setRequiresCaptcha(true)
      }

      // Redirect to the RSVP form
      router.push(`/rsvp/${code}`)
    } catch (error: any) {
      setError(error.message || 'Invalid invite code. Please check and try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleCaptchaVerify = (isValid: boolean) => {
    setCaptchaVerified(isValid)
    if (isValid) {
      setError('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl md:text-5xl text-gray-900 mb-4">
              You're Invited
            </h1>
            <p className="text-gray-600 text-lg">
              Enter your invite code to RSVP
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Invite Code
              </label>
              <InviteCodeInput
                onComplete={handleCodeComplete}
                disabled={isValidating || (requiresCaptcha && !captchaVerified)}
              />
              {error && (
                <p className="mt-3 text-sm text-red-600 text-center">
                  {error}
                </p>
              )}
            </div>

            {/* CAPTCHA when required */}
            {requiresCaptcha && (
              <div className="space-y-4">
                <Alert className="border-amber-200 bg-amber-50">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    For security, please complete the verification below.
                  </AlertDescription>
                </Alert>
                <SimpleCaptcha 
                  onVerify={handleCaptchaVerify}
                  isDisabled={isValidating}
                />
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isValidating}
              disabled={code.length !== 6 || isValidating || (requiresCaptcha && !captchaVerified)}
            >
              {isValidating ? 'Validating...' : 'Continue'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Your invite code can be found on your wedding invitation
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Contact the couple for assistance
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}