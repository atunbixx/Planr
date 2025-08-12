import { QRGenerateHandler } from '@/lib/api/handlers/export-handler'

const handler = new QRGenerateHandler()

export async function POST(request: Request) {
  return handler.handle(request as any)
}