import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const TEMP_DATA_FILE = join(process.cwd(), 'temp-onboarding-data.json')

function loadOnboardingData(): Record<string, any> {
  try {
    if (existsSync(TEMP_DATA_FILE)) {
      return JSON.parse(readFileSync(TEMP_DATA_FILE, 'utf8'))
    }
  } catch (error) {
    console.error('Error loading onboarding data:', error)
  }
  return {}
}

function saveOnboardingData(data: Record<string, any>) {
  try {
    writeFileSync(TEMP_DATA_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error saving onboarding data:', error)
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allData = loadOnboardingData()
    const userData = allData[user.id] || {}
    
    console.log(`[Onboarding API] GET data for user ${user.id}:`, userData)
    
    return NextResponse.json({
      stepData: userData,
      stepsCompleted: Object.keys(userData),
      lastStep: Object.keys(userData).length > 0 ? Object.keys(userData)[Object.keys(userData).length - 1] : 'welcome'
    })
  } catch (error) {
    console.error('Error getting onboarding data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stepId, stepData } = await request.json()
    
    const allData = loadOnboardingData()
    if (!allData[user.id]) {
      allData[user.id] = {}
    }
    
    allData[user.id][stepId] = stepData
    saveOnboardingData(allData)
    
    console.log(`[Onboarding API] POST data for user ${user.id}, step ${stepId}:`, stepData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving onboarding data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}