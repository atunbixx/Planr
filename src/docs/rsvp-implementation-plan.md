# RSVP System Implementation Plan

## Overview
This document provides a detailed implementation plan for the RSVP system, including file structure, component hierarchy, API routes, and integration points with the existing wedding planner system.

## 1. File Structure

```
src/
├── app/
│   ├── rsvp/                          # Public RSVP pages (no auth)
│   │   ├── layout.tsx                 # RSVP-specific layout
│   │   ├── page.tsx                   # Landing page (code entry)
│   │   ├── [code]/
│   │   │   ├── page.tsx               # Main RSVP form
│   │   │   ├── confirm/
│   │   │   │   └── page.tsx           # Confirmation page
│   │   │   ├── edit/
│   │   │   │   └── page.tsx           # Edit RSVP
│   │   │   ├── plus-one/
│   │   │   │   └── page.tsx           # Plus-one management
│   │   │   ├── dietary/
│   │   │   │   └── page.tsx           # Dietary restrictions
│   │   │   └── success/
│   │   │       └── page.tsx           # Success page
│   │   └── api/
│   │       ├── validate-code/
│   │       │   └── route.ts           # POST: Validate invite code
│   │       └── [code]/
│   │           ├── guest/
│   │           │   └── route.ts       # GET: Get guest info
│   │           ├── response/
│   │           │   └── route.ts       # PUT: Update RSVP
│   │           ├── meal-options/
│   │           │   └── route.ts       # GET: Get meal options
│   │           ├── dietary/
│   │           │   └── route.ts       # POST: Update dietary
│   │           └── plus-one/
│   │               └── route.ts       # PUT: Update plus-one
│   ├── api/
│   │   └── admin/
│   │       └── rsvp/
│   │           ├── stats/
│   │           │   └── route.ts       # GET: RSVP statistics
│   │           └── export/
│   │               └── route.ts       # GET: Export RSVP data
│   └── dashboard/
│       └── rsvp/                      # Admin RSVP management
│           ├── page.tsx               # RSVP dashboard
│           └── [guestId]/
│               └── page.tsx           # Individual guest RSVP
├── components/
│   └── rsvp/                          # RSVP components
│       ├── InviteCodeForm.tsx         # Code entry form
│       ├── RSVPForm.tsx               # Main RSVP form
│       ├── AttendanceSelector.tsx     # Yes/No/Maybe selector
│       ├── MealSelector.tsx           # Meal choice component
│       ├── PlusOneForm.tsx            # Plus-one details
│       ├── DietaryForm.tsx            # Dietary restrictions
│       ├── RSVPProgress.tsx           # Progress indicator
│       ├── RSVPConfirmation.tsx       # Confirmation display
│       └── RSVPSessionTimer.tsx       # Session timer
├── hooks/
│   └── rsvp/
│       ├── useRSVPSession.ts          # Session management
│       ├── useRSVPGuest.ts            # Guest data hook
│       ├── useRSVPForm.ts             # Form state management
│       └── useMealOptions.ts          # Meal options hook
├── lib/
│   └── rsvp/
│       ├── validation.ts              # Input validation
│       ├── session.ts                 # Session utilities
│       ├── security.ts                # Security functions
│       ├── rate-limit.ts              # Rate limiting
│       └── email-templates.ts         # Email templates
├── types/
│   └── rsvp.ts                        # RSVP type definitions
└── middleware/
    └── rsvp.ts                        # RSVP-specific middleware
```

## 2. Database Schema Implementation

### 2.1 SQL Migration Scripts

```sql
-- Migration: 001_add_rsvp_tables.sql

-- Add RSVP-specific fields to wedding_guests if not exists
ALTER TABLE wedding_guests 
ADD COLUMN IF NOT EXISTS rsvp_reminder_sent TIMESTAMP,
ADD COLUMN IF NOT EXISTS rsvp_ip_address INET,
ADD COLUMN IF NOT EXISTS rsvp_user_agent TEXT,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_via_rsvp BOOLEAN DEFAULT false;

-- Create meal options table
CREATE TABLE IF NOT EXISTS meal_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES wedding_couples(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('adult', 'child', 'vegetarian', 'vegan', 'gluten_free')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RSVP sessions table
CREATE TABLE IF NOT EXISTS rsvp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code VARCHAR(6) NOT NULL,
  guest_id UUID REFERENCES wedding_guests(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  blocked_until TIMESTAMP WITH TIME ZONE,
  successful BOOLEAN DEFAULT false
);

-- Create RSVP activity logs table
CREATE TABLE IF NOT EXISTS rsvp_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES wedding_guests(id) ON DELETE CASCADE,
  session_id UUID REFERENCES rsvp_sessions(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_rsvp_sessions_invite_code ON rsvp_sessions(invite_code);
CREATE INDEX idx_rsvp_sessions_ip_address ON rsvp_sessions(ip_address);
CREATE INDEX idx_rsvp_sessions_expires_at ON rsvp_sessions(expires_at);
CREATE INDEX idx_rsvp_activity_logs_guest_id ON rsvp_activity_logs(guest_id);
CREATE INDEX idx_rsvp_activity_logs_created_at ON rsvp_activity_logs(created_at);

-- Add RLS policies
ALTER TABLE meal_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_activity_logs ENABLE ROW LEVEL SECURITY;

-- Meal options: Couples can manage, public can read active options
CREATE POLICY "Couples can manage their meal options" ON meal_options
  FOR ALL USING (
    auth.uid() IN (
      SELECT partner1_user_id FROM wedding_couples WHERE id = couple_id
      UNION
      SELECT partner2_user_id FROM wedding_couples WHERE id = couple_id
    )
  );

CREATE POLICY "Public can read active meal options" ON meal_options
  FOR SELECT USING (is_active = true);

-- RSVP sessions: Only system can manage
CREATE POLICY "System manages RSVP sessions" ON rsvp_sessions
  FOR ALL USING (false);

-- Activity logs: Couples can read their logs
CREATE POLICY "Couples can read their activity logs" ON rsvp_activity_logs
  FOR SELECT USING (
    guest_id IN (
      SELECT id FROM wedding_guests WHERE couple_id IN (
        SELECT id FROM wedding_couples WHERE 
          partner1_user_id = auth.uid() OR 
          partner2_user_id = auth.uid()
      )
    )
  );
```

### 2.2 Supabase Edge Functions

```typescript
// supabase/functions/validate-invite-code/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { code, ip_address, user_agent } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Check rate limits
  const { data: recentAttempts } = await supabase
    .from('rsvp_sessions')
    .select('id')
    .eq('ip_address', ip_address)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString())
  
  if (recentAttempts && recentAttempts.length >= 5) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429 }
    )
  }
  
  // Validate code
  const { data: guest } = await supabase
    .from('wedding_guests')
    .select('*')
    .eq('invite_code', code.toUpperCase())
    .single()
  
  if (!guest) {
    // Log failed attempt
    await supabase.from('rsvp_sessions').insert({
      invite_code: code,
      ip_address,
      user_agent,
      successful: false,
      expires_at: new Date(Date.now() + 7200000).toISOString()
    })
    
    return new Response(
      JSON.stringify({ error: 'Invalid code' }),
      { status: 400 }
    )
  }
  
  // Create session
  const { data: session } = await supabase
    .from('rsvp_sessions')
    .insert({
      invite_code: code,
      guest_id: guest.id,
      ip_address,
      user_agent,
      successful: true,
      expires_at: new Date(Date.now() + 7200000).toISOString()
    })
    .select()
    .single()
  
  return new Response(
    JSON.stringify({ 
      session_id: session.id,
      guest: {
        id: guest.id,
        first_name: guest.first_name,
        last_name: guest.last_name,
        has_responded: !!guest.rsvp_date
      }
    }),
    { status: 200 }
  )
})
```

## 3. Component Implementation

### 3.1 Core Types

```typescript
// src/types/rsvp.ts
export interface RSVPSession {
  id: string
  guestId: string
  inviteCode: string
  expiresAt: Date
  ipAddress: string
  userAgent: string
}

export interface RSVPGuest {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  rsvpStatus: 'pending' | 'attending' | 'not_attending' | 'maybe'
  rsvpDate?: Date
  mealChoice?: string
  dietaryRestrictions?: string
  plusOneAllowed: boolean
  plusOneName?: string
  plusOneAttending?: boolean
  plusOneMealChoice?: string
  plusOneDietaryRestrictions?: string
  notes?: string
}

export interface MealOption {
  id: string
  name: string
  description?: string
  category: 'adult' | 'child' | 'vegetarian' | 'vegan' | 'gluten_free'
  sortOrder: number
}

export interface RSVPFormData {
  attending: boolean | null
  mealChoice: string | null
  dietaryRestrictions: string
  plusOneAttending: boolean
  plusOneName: string
  plusOneMealChoice: string | null
  plusOneDietaryRestrictions: string
  notes: string
}
```

### 3.2 Session Management Hook

```typescript
// src/hooks/rsvp/useRSVPSession.ts
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export function useRSVPSession() {
  const [session, setSession] = useState<RSVPSession | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const sessionId = Cookies.get('rsvp_session')
    if (!sessionId) {
      setLoading(false)
      return
    }

    // Validate session
    fetch('/api/rsvp/session', {
      headers: {
        'x-session-id': sessionId
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setSession(data.session)
        } else {
          Cookies.remove('rsvp_session')
          router.push('/rsvp')
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  const createSession = async (inviteCode: string) => {
    const response = await fetch('/api/rsvp/validate-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: inviteCode })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Invalid code')
    }

    const data = await response.json()
    Cookies.set('rsvp_session', data.sessionId, {
      expires: new Date(data.expiresAt),
      sameSite: 'strict',
      secure: true
    })
    
    setSession(data.session)
    return data
  }

  const clearSession = () => {
    Cookies.remove('rsvp_session')
    setSession(null)
    router.push('/rsvp')
  }

  return {
    session,
    loading,
    createSession,
    clearSession,
    isAuthenticated: !!session
  }
}
```

### 3.3 Main RSVP Form Component

```typescript
// src/components/rsvp/RSVPForm.tsx
'use client'

import { useState } from 'react'
import { useRSVPGuest } from '@/hooks/rsvp/useRSVPGuest'
import { useMealOptions } from '@/hooks/rsvp/useMealOptions'
import { AttendanceSelector } from './AttendanceSelector'
import { MealSelector } from './MealSelector'
import { PlusOneForm } from './PlusOneForm'
import { DietaryForm } from './DietaryForm'
import { RSVPProgress } from './RSVPProgress'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface RSVPFormProps {
  inviteCode: string
}

export function RSVPForm({ inviteCode }: RSVPFormProps) {
  const { guest, updateRSVP, loading } = useRSVPGuest(inviteCode)
  const { mealOptions } = useMealOptions(guest?.coupleId)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<RSVPFormData>({
    attending: guest?.rsvpStatus === 'attending' ? true : 
              guest?.rsvpStatus === 'not_attending' ? false : null,
    mealChoice: guest?.mealChoice || null,
    dietaryRestrictions: guest?.dietaryRestrictions || '',
    plusOneAttending: guest?.plusOneAttending || false,
    plusOneName: guest?.plusOneName || '',
    plusOneMealChoice: guest?.plusOneMealChoice || null,
    plusOneDietaryRestrictions: guest?.plusOneDietaryRestrictions || '',
    notes: guest?.notes || ''
  })

  const totalSteps = guest?.plusOneAllowed ? 5 : 4

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      await updateRSVP(formData)
      toast.success('RSVP submitted successfully!')
      // Redirect to confirmation page
      window.location.href = `/rsvp/${inviteCode}/success`
    } catch (error) {
      toast.error('Failed to submit RSVP. Please try again.')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!guest) {
    return <div>Guest not found</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <RSVPProgress currentStep={step} totalSteps={totalSteps} />
      
      <div className="mt-8">
        {step === 1 && (
          <AttendanceSelector
            value={formData.attending}
            onChange={(attending) => setFormData({ ...formData, attending })}
            guestName={`${guest.firstName} ${guest.lastName}`}
          />
        )}

        {step === 2 && formData.attending && (
          <MealSelector
            value={formData.mealChoice}
            onChange={(mealChoice) => setFormData({ ...formData, mealChoice })}
            options={mealOptions}
          />
        )}

        {step === 3 && formData.attending && (
          <DietaryForm
            value={formData.dietaryRestrictions}
            onChange={(dietaryRestrictions) => 
              setFormData({ ...formData, dietaryRestrictions })
            }
          />
        )}

        {step === 4 && guest.plusOneAllowed && (
          <PlusOneForm
            formData={formData}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
            mealOptions={mealOptions}
          />
        )}

        {step === totalSteps && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your RSVP</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><strong>Attending:</strong> {formData.attending ? 'Yes' : 'No'}</p>
              {formData.attending && (
                <>
                  <p><strong>Meal:</strong> {mealOptions.find(m => m.id === formData.mealChoice)?.name}</p>
                  {formData.dietaryRestrictions && (
                    <p><strong>Dietary Restrictions:</strong> {formData.dietaryRestrictions}</p>
                  )}
                  {guest.plusOneAllowed && formData.plusOneAttending && (
                    <>
                      <p><strong>Plus One:</strong> {formData.plusOneName}</p>
                      <p><strong>Plus One Meal:</strong> {mealOptions.find(m => m.id === formData.plusOneMealChoice)?.name}</p>
                    </>
                  )}
                </>
              )}
            </div>
            <textarea
              className="w-full p-3 border rounded-lg"
              placeholder="Any notes for the couple? (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        {step > 1 && (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        )}
        <div className="ml-auto">
          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              Submit RSVP
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
```

## 4. API Routes Implementation

### 4.1 Validate Code Route

```typescript
// src/app/rsvp/api/validate-code/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'
import { validateInviteCode } from '@/lib/rsvp/validation'
import { checkRateLimit } from '@/lib/rsvp/rate-limit'
import { createRSVPSession } from '@/lib/rsvp/session'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Validate code format
    if (!validateInviteCode(code)) {
      return NextResponse.json(
        { error: 'Invalid code format' },
        { status: 400 }
      )
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(ip, 'validate-code')
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many attempts. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter 
        },
        { status: 429 }
      )
    }

    // Look up guest
    const { data: guest, error } = await supabase
      .from('wedding_guests')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .single()

    if (error || !guest) {
      // Log failed attempt
      await supabase.from('rsvp_sessions').insert({
        invite_code: code,
        ip_address: ip,
        user_agent: userAgent,
        successful: false,
        expires_at: new Date(Date.now() + 7200000).toISOString()
      })

      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 400 }
      )
    }

    // Create session
    const session = await createRSVPSession(guest.id, code, ip, userAgent)

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      sessionId: session.id,
      guest: {
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        hasResponded: !!guest.rsvp_date
      }
    })

    response.cookies.set('rsvp_session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7200 // 2 hours
    })

    return response
  } catch (error) {
    console.error('Error validating invite code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 4.2 Update RSVP Route

```typescript
// src/app/rsvp/api/[code]/response/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'
import { validateRSVPSession } from '@/lib/rsvp/session'
import { logRSVPActivity } from '@/lib/rsvp/activity'
import { sendRSVPConfirmationEmail } from '@/lib/rsvp/email'

export async function PUT(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Validate session
    const sessionId = request.cookies.get('rsvp_session')?.value
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    const session = await validateRSVPSession(sessionId)
    if (!session || session.inviteCode !== params.code.toUpperCase()) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const formData = await request.json()
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get current guest data
    const { data: currentGuest } = await supabase
      .from('wedding_guests')
      .select('*')
      .eq('id', session.guestId)
      .single()

    // Update guest RSVP
    const { data: updatedGuest, error } = await supabase
      .from('wedding_guests')
      .update({
        rsvp_status: formData.attending ? 'attending' : 'not_attending',
        rsvp_date: new Date().toISOString(),
        meal_choice: formData.mealChoice,
        dietary_restrictions: formData.dietaryRestrictions,
        plus_one_attending: formData.plusOneAttending,
        plus_one_name: formData.plusOneName,
        plus_one_meal_choice: formData.plusOneMealChoice,
        plus_one_dietary_restrictions: formData.plusOneDietaryRestrictions,
        rsvp_notes: formData.notes,
        rsvp_ip_address: ip,
        rsvp_user_agent: userAgent,
        updated_via_rsvp: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.guestId)
      .select()
      .single()

    if (error) {
      console.error('Error updating RSVP:', error)
      return NextResponse.json(
        { error: 'Failed to update RSVP' },
        { status: 500 }
      )
    }

    // Log activity
    await logRSVPActivity({
      guestId: session.guestId,
      sessionId: session.id,
      actionType: 'rsvp_updated',
      oldValues: currentGuest,
      newValues: updatedGuest,
      ipAddress: ip,
      userAgent
    })

    // Send confirmation email
    if (updatedGuest.email) {
      await sendRSVPConfirmationEmail(updatedGuest)
    }

    return NextResponse.json({
      success: true,
      message: 'RSVP updated successfully'
    })
  } catch (error) {
    console.error('Error updating RSVP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## 5. Security Implementation

### 5.1 Rate Limiting

```typescript
// src/lib/rsvp/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
}

export async function checkRateLimit(
  identifier: string,
  action: string
): Promise<RateLimitResult> {
  const key = `rate_limit:${action}:${identifier}`
  const limit = getRateLimitConfig(action)
  
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, limit.window)
  }
  
  if (current > limit.max) {
    const ttl = await redis.ttl(key)
    return {
      allowed: false,
      retryAfter: ttl
    }
  }
  
  return { allowed: true }
}

function getRateLimitConfig(action: string) {
  const configs = {
    'validate-code': { max: 5, window: 3600 }, // 5 per hour
    'update-rsvp': { max: 10, window: 3600 },  // 10 per hour
    'view-rsvp': { max: 30, window: 3600 }     // 30 per hour
  }
  
  return configs[action] || { max: 10, window: 3600 }
}
```

### 5.2 Session Validation

```typescript
// src/lib/rsvp/session.ts
import { supabase } from '@/lib/supabase-admin'
import { v4 as uuidv4 } from 'uuid'

export async function createRSVPSession(
  guestId: string,
  inviteCode: string,
  ipAddress: string,
  userAgent: string
) {
  const sessionId = uuidv4()
  const expiresAt = new Date(Date.now() + 7200000) // 2 hours
  
  const { data, error } = await supabase
    .from('rsvp_sessions')
    .insert({
      id: sessionId,
      guest_id: guestId,
      invite_code: inviteCode,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString(),
      successful: true
    })
    .select()
    .single()
  
  if (error) throw error
  
  return data
}

export async function validateRSVPSession(sessionId: string) {
  const { data: session } = await supabase
    .from('rsvp_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('successful', true)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (!session) return null
  
  // Update last activity
  await supabase
    .from('rsvp_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', sessionId)
  
  return {
    id: session.id,
    guestId: session.guest_id,
    inviteCode: session.invite_code,
    expiresAt: new Date(session.expires_at)
  }
}
```

## 6. Email Templates

```typescript
// src/lib/rsvp/email-templates.ts
export function getRSVPConfirmationEmail(guest: any) {
  const attending = guest.rsvp_status === 'attending'
  
  return {
    subject: `RSVP Confirmed - ${guest.couple_name} Wedding`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 10px 20px; 
              background-color: #007bff; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
            }
            .details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>RSVP Confirmation</h1>
            </div>
            <div class="content">
              <p>Dear ${guest.first_name},</p>
              
              <p>Thank you for your RSVP! We've received your response.</p>
              
              <div class="details">
                <h3>Your Response:</h3>
                <p><strong>Attending:</strong> ${attending ? 'Yes' : 'No'}</p>
                ${attending ? `
                  <p><strong>Meal Selection:</strong> ${guest.meal_name || 'Not selected'}</p>
                  ${guest.dietary_restrictions ? `
                    <p><strong>Dietary Restrictions:</strong> ${guest.dietary_restrictions}</p>
                  ` : ''}
                  ${guest.plus_one_attending ? `
                    <p><strong>Plus One:</strong> ${guest.plus_one_name}</p>
                  ` : ''}
                ` : ''}
              </div>
              
              ${attending ? `
                <h3>Event Details</h3>
                <p><strong>Date:</strong> ${guest.wedding_date}</p>
                <p><strong>Time:</strong> ${guest.wedding_time}</p>
                <p><strong>Venue:</strong> ${guest.venue_name}</p>
                <p><strong>Address:</strong> ${guest.venue_address}</p>
                
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${guest.calendar_link}" class="button">Add to Calendar</a>
                </p>
              ` : ''}
              
              <p>If you need to update your RSVP, you can do so using your invite code: <strong>${guest.invite_code}</strong></p>
              
              <p>If you have any questions, please don't hesitate to reach out.</p>
              
              <p>Best regards,<br>${guest.couple_name}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
RSVP Confirmation

Dear ${guest.first_name},

Thank you for your RSVP! We've received your response.

Your Response:
Attending: ${attending ? 'Yes' : 'No'}
${attending ? `Meal Selection: ${guest.meal_name || 'Not selected'}` : ''}
${attending && guest.dietary_restrictions ? `Dietary Restrictions: ${guest.dietary_restrictions}` : ''}
${attending && guest.plus_one_attending ? `Plus One: ${guest.plus_one_name}` : ''}

${attending ? `
Event Details:
Date: ${guest.wedding_date}
Time: ${guest.wedding_time}
Venue: ${guest.venue_name}
Address: ${guest.venue_address}
` : ''}

If you need to update your RSVP, you can do so using your invite code: ${guest.invite_code}

If you have any questions, please don't hesitate to reach out.

Best regards,
${guest.couple_name}
    `
  }
}
```

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// src/__tests__/rsvp/validation.test.ts
import { validateInviteCode } from '@/lib/rsvp/validation'

describe('Invite Code Validation', () => {
  test('accepts valid 6-character codes', () => {
    expect(validateInviteCode('ABC123')).toBe(true)
    expect(validateInviteCode('XYZ789')).toBe(true)
  })
  
  test('rejects invalid codes', () => {
    expect(validateInviteCode('ABC')).toBe(false)      // Too short
    expect(validateInviteCode('ABCDEFG')).toBe(false)  // Too long
    expect(validateInviteCode('ABC!23')).toBe(false)   // Special chars
    expect(validateInviteCode('AAAAAA')).toBe(false)   // Repeated chars
  })
  
  test('handles case insensitive input', () => {
    expect(validateInviteCode('abc123')).toBe(true)
    expect(validateInviteCode('AbC123')).toBe(true)
  })
})
```

### 7.2 Integration Tests

```typescript
// src/__tests__/rsvp/api.test.ts
import { POST as validateCode } from '@/app/rsvp/api/validate-code/route'

describe('RSVP API', () => {
  test('validates correct invite code', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABC123' })
    })
    
    const response = await validateCode(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.sessionId).toBeDefined()
  })
  
  test('rate limits excessive attempts', async () => {
    // Make 6 requests (limit is 5)
    for (let i = 0; i < 6; i++) {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ code: 'WRONG' }),
        headers: { 'x-forwarded-for': '192.168.1.1' }
      })
      
      const response = await validateCode(request)
      
      if (i < 5) {
        expect(response.status).toBe(400) // Invalid code
      } else {
        expect(response.status).toBe(429) // Rate limited
      }
    }
  })
})
```

## 8. Deployment Checklist

### Pre-deployment
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Redis/Upstash configured for rate limiting
- [ ] Email service configured
- [ ] SSL certificates in place
- [ ] Security headers configured
- [ ] CORS settings reviewed
- [ ] Error tracking (Sentry) configured

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Security scan completed
- [ ] Performance testing done
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing completed

### Monitoring
- [ ] Application monitoring configured
- [ ] Error alerting set up
- [ ] Performance metrics tracked
- [ ] Security monitoring active
- [ ] Database query monitoring
- [ ] Rate limit monitoring

### Post-deployment
- [ ] Verify all endpoints working
- [ ] Test RSVP flow end-to-end
- [ ] Check email delivery
- [ ] Monitor error rates
- [ ] Review performance metrics
- [ ] Security audit
- [ ] Update documentation