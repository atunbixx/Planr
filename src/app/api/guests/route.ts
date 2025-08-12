import { NextRequest } from 'next/server'
import { GuestsHandler } from '@/lib/api/handlers/guests-handler'

const handler = new GuestsHandler()

export async function GET(request: NextRequest) {
  return handler.list(request)
}

export async function POST(request: NextRequest) {
  return handler.create(request)
}