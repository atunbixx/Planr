import { ExportHandler } from '@/lib/api/handlers/export-handler'

const handler = new ExportHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}