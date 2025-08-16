import { DashboardHandlerV2 } from '@/lib/api/handlers/dashboard-handler-v2'
import { NextRequest } from 'next/server'

const handler = new DashboardHandlerV2()

export async function GET(request: Request) {
  return handler.getStats(request as NextRequest)
}