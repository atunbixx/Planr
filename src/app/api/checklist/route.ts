import { ChecklistHandlerV2 } from '@/lib/api/handlers/checklist-handler-v2'
import { NextRequest } from 'next/server'

const handler = new ChecklistHandlerV2()

export async function GET(request: Request) {
  return handler.list(request as NextRequest)
}

export async function POST(request: Request) {
  return handler.create(request as NextRequest)
}