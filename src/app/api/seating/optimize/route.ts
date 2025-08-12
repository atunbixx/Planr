import { SeatingOptimizeHandler } from '@/lib/api/handlers/seating-handler'

const handler = new SeatingOptimizeHandler()

export async function POST(request: Request) {
  return handler.handle(request as any)
}