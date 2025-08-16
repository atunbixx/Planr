import { MessagesHandlerV2 } from '@/lib/api/handlers/messages-handler-v2'
import { NextRequest } from 'next/server'

const handler = new MessagesHandlerV2()

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handler.updateTemplate(request as NextRequest, id)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handler.deleteTemplate(request as NextRequest, id)
}