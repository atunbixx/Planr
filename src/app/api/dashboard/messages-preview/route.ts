import { DashboardMessagesPreviewHandler } from '@/lib/api/handlers/analytics-handler'
import { NextRequest } from 'next/server'

const handler = new DashboardMessagesPreviewHandler()

export async function GET(request: Request) {
  return handler.handle(request as NextRequest)
}