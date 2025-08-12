import { GuestCheckInHandler } from '@/lib/api/handlers/day-of-handler'

const handler = new GuestCheckInHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}

export async function POST(request: Request) {
  return handler.handle(request as any)
}