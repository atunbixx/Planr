import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

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

    const photos = await prisma.photo.findMany({
      where: { coupleId: couple.id },
      include: {
        album: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate statistics
    const stats = {
      total: photos.length,
      withAlbums: photos.filter(p => p.albumId).length,
      recent: photos.filter(p => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(p.createdAt) > weekAgo
      }).length
    }

    return NextResponse.json({ photos, stats })
  } catch (error) {
    console.error('Error fetching photos:', error)
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
    const { 
      albumId, 
      filename, 
      originalName, 
      cloudinaryId, 
      url, 
      thumbnailUrl, 
      description, 
      tags, 
      sortOrder 
    } = body

    const photo = await prisma.photo.create({
      data: {
        coupleId: couple.id,
        albumId: albumId || null,
        filename,
        originalName,
        cloudinaryId,
        url,
        thumbnailUrl,
        description,
        tags: tags || [],
        uploadedBy: dbUser.id,
        sortOrder: sortOrder || 0
      },
      include: {
        album: {
          select: {
            name: true,
            id: true
          }
        }
      }
    })

    return NextResponse.json(photo)
  } catch (error) {
    console.error('Error creating photo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}