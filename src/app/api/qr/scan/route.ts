import { QRScanHandler } from '@/lib/api/handlers/export-handler'
import { NextRequest } from 'next/server'

const handler = new QRScanHandler()

export async function POST(request: Request) {
  return handler.handle(request as NextRequest)
}