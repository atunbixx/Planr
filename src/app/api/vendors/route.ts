import { NextRequest } from 'next/server'
import { VendorsHandler } from '@/lib/api/handlers/vendors-handler'

const handler = new VendorsHandler()

export async function GET(request: NextRequest) {
  return handler.handle(request)
}

export async function POST(request: NextRequest) {
  return handler.handle(request)
}