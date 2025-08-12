import { MessagesHandlerV2 } from '@/lib/api/handlers/messages-handler-v2'

const handler = new MessagesHandlerV2()

export async function GET(request: Request) {
  return handler.listTemplates(request)
}

export async function POST(request: Request) {
  return handler.createTemplate(request)
}