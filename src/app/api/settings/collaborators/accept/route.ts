import { AcceptCollaborationHandler } from '@/lib/api/handlers/collaboration-handler'

const handler = new AcceptCollaborationHandler()

export async function POST(request: Request) {
  return handler.handle(request as any)
}