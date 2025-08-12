import { SeatingAssignmentsHandler } from '@/lib/api/handlers/seating-assignments-handler'

const handler = new SeatingAssignmentsHandler()

export async function POST(request: Request) {
  return handler.handle(request as any)
}

export async function DELETE(request: Request) {
  return handler.handle(request as any)
}