import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'
import { getOnboardingState, setStep } from '@/lib/onboarding'

export async function handleOnboardingStep(
  request: NextRequest,
  step: string
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (request.method === 'GET') {
    // Get current step data
    const state = await getOnboardingState(user.id)
    return NextResponse.json({
      step,
      stepData: state.stepData?.[step] || {},
      completed: state.stepsCompleted?.includes(step) || false
    })
  } else if (request.method === 'POST') {
    // Save step data
    try {
      let body = {}
      
      // Try to parse JSON, but handle empty body gracefully
      try {
        const text = await request.text()
        body = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.log('No JSON body provided, using empty object')
        body = {}
      }
      
      // If body contains only { completed: true }, mark step as completed
      if (body.completed === true && Object.keys(body).length === 1) {
        await setStep(user.id, step, {})
        return NextResponse.json({ success: true })
      }
      
      // Otherwise save the step data
      await setStep(user.id, step, body)
      
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error(`Error saving ${step} data:`, error)
      return NextResponse.json(
        { error: 'Failed to save data' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}