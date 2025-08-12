import { SeatingTablesHandler } from '@/lib/api/handlers/seating-handler'

const handler = new SeatingTablesHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}

export async function POST(request: Request) {
  return handler.handle(request as any)
}