import { VendorCategoriesHandler } from '@/lib/api/handlers/vendor-categories-handler'
import { NextRequest } from 'next/server'

const handler = new VendorCategoriesHandler()

export async function GET(request: Request) {
  return handler.handle(request as NextRequest)
}

export async function POST(request: Request) {
  return handler.handle(request as NextRequest)
}