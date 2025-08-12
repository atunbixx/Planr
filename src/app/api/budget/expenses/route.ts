import { BudgetExpensesHandler } from '@/lib/api/handlers/budget-handler'

const handler = new BudgetExpensesHandler()

export async function GET(request: Request) {
  return handler.handle(request as any)
}

export async function POST(request: Request) {
  return handler.handle(request as any)
}

export async function PATCH(request: Request, context: any) {
  return handler.handle(request as any, context)
}

export async function PUT(request: Request, context: any) {
  // For backward compatibility, route PUT to PATCH
  return handler.handle(request as any, context)
}

export async function DELETE(request: Request, context: any) {
  return handler.handle(request as any, context)
}