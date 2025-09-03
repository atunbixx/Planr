import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { PhotoRepository } from '@/features/photos/repo/photo.repository'
import { isS3Enabled, uploadBufferToS3 } from '@/lib/storage/s3'
import { isSupabaseEnabled, uploadBufferToSupabase } from '@/lib/storage/supabase'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

async function POST(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.id
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return new Response(JSON.stringify({ success: false, error: { message: 'file required' } }), { status: 400 })
    const albumId = (form.get('albumId') as string) || undefined
    const caption = (form.get('caption') as string) || undefined
    const alt = (form.get('alt') as string) || undefined
    const width = form.get('width') ? Number(form.get('width')) : undefined
    const height = form.get('height') ? Number(form.get('height')) : undefined

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = (file.type && file.type.includes('png')) ? 'png' : (file.type && file.type.includes('webp')) ? 'webp' : (file.name.split('.').pop() || 'jpg')
    const uuid = randomUUID()

    let publicUrl: string
    if (isSupabaseEnabled()) {
      const key = `users/${userId}/photos/${uuid}.${ext}`
      const u = await uploadBufferToSupabase(key, buffer, file.type || 'application/octet-stream')
      if (!u) throw new Error('Failed to generate Supabase public URL')
      publicUrl = u
    } else if (isS3Enabled()) {
      const key = `users/${userId}/photos/${uuid}.${ext}`
      publicUrl = await uploadBufferToS3(key, buffer, file.type || 'application/octet-stream')
    } else {
      // Local fallback: write to public/uploads
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'users', userId)
      fs.mkdirSync(uploadsDir, { recursive: true })
      const filename = `${uuid}.${ext}`
      const full = path.join(uploadsDir, filename)
      fs.writeFileSync(full, buffer)
      publicUrl = `/uploads/users/${userId}/${filename}`
    }

    const repo = new PhotoRepository()
    const created = await repo.createPhoto(userId, { url: publicUrl, caption, alt, albumId, width, height })
    return new Response(JSON.stringify({ success: true, data: created }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: { message: e?.message || 'Upload failed' } }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
}

export const POST_Handler = requireOnboarding(POST)
export const POST = POST_Handler
