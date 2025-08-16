import { AcceptCollaborationHandler } from '@/lib/api/handlers/collaboration-handler'
import { NextRequest } from 'next/server'

const handler = new AcceptCollaborationHandler()

export async function POST(request: Request) {
  return handler.handle(request as NextRequest)
}