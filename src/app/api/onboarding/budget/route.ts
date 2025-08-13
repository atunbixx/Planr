import { NextRequest } from 'next/server'
import { handleOnboardingStep } from '../base'

export async function GET(request: NextRequest) {
  return handleOnboardingStep(request, 'budget')
}

export async function POST(request: NextRequest) {
  return handleOnboardingStep(request, 'budget')
}