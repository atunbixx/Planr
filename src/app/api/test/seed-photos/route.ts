import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { PhotoRepository, AlbumRepository } from '@/features/photos/repo/photo.repository'

const photos = [
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515516969-d4008cc6241a?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop'
]

async function POST(request: AuthenticatedRequest) {
  const userId = request.user!.id
  const albumRepo = new AlbumRepository()
  const photoRepo = new PhotoRepository()
  // Create or find demo album
  const existing = await albumRepo.listAlbums(userId, 1, 0)
  const album = existing.albums[0] || await albumRepo.createAlbum(userId, { name: 'Demo Album', description: 'Seeded photos' })
  // Add photos
  let order = 0
  for (const url of photos) {
    await photoRepo.createPhoto(userId, { url, caption: 'Demo', albumId: album.id, order, isPrimary: order === 0 })
    order++
  }
  return new Response(JSON.stringify({ success: true, data: { albumId: album.id } }), { status: 201, headers: { 'Content-Type': 'application/json' } })
}

export const POST_Handler = requireOnboarding(POST)
export const POST = POST_Handler

