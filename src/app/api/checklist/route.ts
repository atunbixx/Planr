import { ChecklistHandlerV2 } from '@/lib/api/handlers/checklist-handler-v2'

const handler = new ChecklistHandlerV2()

export async function GET(request: Request) {
  return handler.list(request)
}

export async function POST(request: Request) {
  return handler.create(request)
}