import { AcceptCollaboratorInvitationHandler } from '@/lib/api/handlers/invitations-handler'

const handler = new AcceptCollaboratorInvitationHandler()

export async function POST(request: Request) {
  return handler.handle(request as any)
}