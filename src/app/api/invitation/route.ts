import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find the invitation
    const collaborator = await prisma.couple_collaborators.findFirst({
      where: {
        invitation_token: token,
        status: 'pending'
      },
      include: {
        couples: true
      }
    })

    if (!collaborator) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // Get couple names
    const couple_names = `${collaborator.couples.partner1Name} & ${collaborator.couples.partner2Name}`

    return NextResponse.json({
      invitation: {
        id: collaborator.id,
        couple_names,
        weddingDate: collaborator.couples.weddingDate,
        role: collaborator.role,
        permissions: collaborator.permissions
      }
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    )
  }
}