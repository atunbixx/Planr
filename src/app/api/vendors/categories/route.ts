import { VendorCategoriesHandler } from '@/lib/api/handlers/vendor-categories-handler'

const handler = new VendorCategoriesHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}

export async function POST(request: Request) {
  return handler.handle(request as any)
}