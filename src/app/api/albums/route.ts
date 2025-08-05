import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id }
    })

    if (!couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    const albums = await prisma.photoAlbum.findMany({
      where: { coupleId: couple.id },
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true
          },
          take: 1,
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            photos: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Add cover photo URL to each album
    const albumsWithCovers = albums.map(album => ({
      ...album,
      coverPhoto: album.photos[0] || null,
      photoCount: album._count.photos
    }))

    return NextResponse.json(albumsWithCovers)
  } catch (error) {
    console.error('Error fetching photo albums:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id }
    })

    if (!couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, isPublic, sortOrder } = body

    const album = await prisma.photoAlbum.create({
      data: {
        coupleId: couple.id,
        name,
        description,
        isPublic: isPublic || false,
        sortOrder: sortOrder || 0
      }
    })

    return NextResponse.json(album)
  } catch (error) {
    console.error('Error creating photo album:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}