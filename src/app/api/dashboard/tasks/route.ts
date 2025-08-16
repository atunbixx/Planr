import { DashboardTasksHandler } from '@/lib/api/handlers/analytics-handler'
import { NextRequest } from 'next/server'

const handler = new DashboardTasksHandler()

export async function GET(request: Request) {
  return handler.handle(request as NextRequest)
}