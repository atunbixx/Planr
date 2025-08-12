import { DashboardHandlerV2 } from '@/lib/api/handlers/dashboard-handler-v2'

const handler = new DashboardHandlerV2()

export async function GET(request: Request) {
  return handler.getRecentActivity(request)
}