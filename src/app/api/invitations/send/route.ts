import { SendInvitationsHandler } from '@/lib/api/handlers/invitations-handler'

const handler = new SendInvitationsHandler()

export async function POST(request: Request) {
  return handler.handle(request as any)
}