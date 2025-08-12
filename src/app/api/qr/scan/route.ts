import { QRScanHandler } from '@/lib/api/handlers/export-handler'

const handler = new QRScanHandler()

export async function POST(request: Request) {
  return handler.handle(request as any)
}