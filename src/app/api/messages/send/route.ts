import { MessagesHandlerV2 } from '@/lib/api/handlers/messages-handler-v2'
import { NextRequest } from 'next/server'

const handler = new MessagesHandlerV2()

export async function POST(request: Request) {
  return handler.sendMessages(request as NextRequest)
}