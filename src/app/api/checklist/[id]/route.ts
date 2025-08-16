import { ChecklistHandlerV2 } from '@/lib/api/handlers/checklist-handler-v2'
import { NextRequest } from 'next/server'

const handler = new ChecklistHandlerV2()

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handler.update(request as NextRequest, id)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handler.delete(request as NextRequest, id)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handler.toggleComplete(request as NextRequest, id)
}