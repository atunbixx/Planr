import { DayOfIssuesHandler } from '@/lib/api/handlers/day-of-handler'

const handler = new DayOfIssuesHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}

export async function POST(request: Request) {
  return handler.handle(request as any)
}

export async function PATCH(request: Request) {
  return handler.handle(request as any)
}