import { QRGenerateHandler } from '@/lib/api/handlers/export-handler'
import { NextRequest } from 'next/server'

const handler = new QRGenerateHandler()

export async function POST(request: Request) {
  return handler.handle(request as NextRequest)
}