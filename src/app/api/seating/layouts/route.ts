import { SeatingLayoutsHandler } from '@/lib/api/handlers/seating-handler'

const handler = new SeatingLayoutsHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}

export async function POST(request: Request) {
  return handler.handle(request as any)
}