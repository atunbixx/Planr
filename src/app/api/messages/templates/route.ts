import { MessagesHandlerV2 } from '@/lib/api/handlers/messages-handler-v2'
import { NextRequest } from 'next/server'

const handler = new MessagesHandlerV2()

export async function GET(request: Request) {
  return handler.listTemplates(request as NextRequest)
}

export async function POST(request: Request) {
  return handler.createTemplate(request as NextRequest)
}