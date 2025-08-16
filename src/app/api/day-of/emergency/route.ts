import { EmergencyContactsHandler } from '@/lib/api/handlers/day-of-handler'
import { NextRequest } from 'next/server'

const handler = new EmergencyContactsHandler()

export async function GET(request: Request) {
  return handler.handle(request as NextRequest)
}

export async function POST(request: Request) {
  return handler.handle(request as NextRequest)
}

export async function DELETE(request: Request) {
  return handler.handle(request as NextRequest)
}