"use client"

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout';
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PhotosClient, AlbumsClient } from '@/lib/api/photos.client'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionCard, SectionCardBody, SectionCardHeader, SectionCardTitle } from '@/components/ui/section-card'
import { FormField } from '@/components/ui/form-field'

export default function PhotosPage() {
  return (
    <PremiumDashboardLayout>
      <ClientGallery />
    </PremiumDashboardLayout>
  );
}

function ClientGallery() {
  const [photos, setPhotos] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string|undefined>()
  const [albums, setAlbums] = React.useState<any[]>([])
  const [albumId, setAlbumId] = React.useState<string>('')
  const [q, setQ] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState<{ url: string; caption?: string }>({ url: '' })
  const [newAlbum, setNewAlbum] = React.useState<{ name: string; description?: string }>({ name: '' })
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [uploads, setUploads] = React.useState<Array<{ id: string; name: string; size: number; progress: number; status: 'queued'|'uploading'|'done'|'error'; error?: string }>>([])

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [{ photos }, alb] = await Promise.all([
          PhotosClient.list({ albumId: albumId || undefined, q: q || undefined, limit: 100 }),
          AlbumsClient.list({ limit: 100 })
        ])
        if (!mounted) return
        setPhotos(photos)
        setAlbums(alb.albums || [])
      } catch (e:any) {
        if (mounted) setError(e?.message || 'Failed to load photos')
      } finally { if (mounted) setLoading(false) }
    }
    load();
    return () => { mounted = false }
  }, [albumId, q])

  async function handleAddByUrl() {
    try {
      setCreating(true)
      await PhotosClient.create({ url: form.url, caption: form.caption, albumId: albumId || undefined })
      setForm({ url: '' })
      // reload
      const { photos } = await PhotosClient.list({ albumId: albumId || undefined, q: q || undefined, limit: 100 })
      setPhotos(photos)
    } catch (e:any) {
      setError(e?.message || 'Failed to add photo')
    } finally { setCreating(false) }
  }

  async function handleCreateAlbum() {
    try {
      if (!newAlbum.name.trim()) return
      setCreating(true)
      await AlbumsClient.create({ name: newAlbum.name.trim(), description: newAlbum.description })
      setNewAlbum({ name: '' })
      const alb = await AlbumsClient.list({ limit: 100 })
      setAlbums(alb.albums || [])
    } catch (e:any) {
      setError(e?.message || 'Failed to create album')
    } finally { setCreating(false) }
  }

  function queueFiles(files: FileList | File[]) {
    const arr = Array.from(files)
    const queued = arr.map(f => ({ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, name: f.name, size: f.size, progress: 0, status: 'queued' as const }))
    setUploads(prev => [...queued, ...prev])
    void startUploads(arr, queued.map(q => q.id))
  }

  async function startUploads(files: File[], ids: string[]) {
    // For each file, upload with XHR to get progress
    await Promise.all(files.map((file, idx) => uploadSingleFile(file, ids[idx])))
    // Refresh gallery after batch
    const { photos } = await PhotosClient.list({ albumId: albumId || undefined, q: q || undefined, limit: 100 })
    setPhotos(photos)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function uploadSingleFile(file: File, uploadId: string) {
    return new Promise<void>(async (resolve) => {
      // Best-effort extract dimensions
      let width: number | undefined
      let height: number | undefined
      try {
        const dims = await new Promise<{ width?: number; height?: number }>((resolveDims) => {
          const img = new Image()
          img.onload = () => resolveDims({ width: img.width, height: img.height })
          img.onerror = () => resolveDims({})
          img.src = URL.createObjectURL(file)
        })
        width = dims.width; height = dims.height
      } catch {}

      const formData = new FormData()
      formData.set('file', file)
      if (albumId) formData.set('albumId', albumId)
      if (width) formData.set('width', String(width))
      if (height) formData.set('height', String(height))

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/photos/upload', true)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'uploading', progress: pct } : u))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'done', progress: 100 } : u))
        } else {
          const msg = (() => { try { return JSON.parse(xhr.responseText)?.error?.message } catch { return undefined } })()
          setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: msg || `HTTP ${xhr.status}` } : u))
        }
        resolve()
      }
      xhr.onerror = () => {
        setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: 'Network error' } : u))
        resolve()
      }
      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'uploading', progress: 0 } : u))
      xhr.send(formData)
    })
  }

  function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    queueFiles(files)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length) queueFiles(files)
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  return (
    <div className="p-6 content-defaults form-elegant">
      <PageHeader kicker="PHOTOS" title="Photos" />
      {/* Controls */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="album">Album</Label>
          <select id="album" className="mt-1 w-full border rounded-md px-3 py-2 bg-white text-black dark:bg-dark-2 dark:text-white" value={albumId} onChange={e=>setAlbumId(e.target.value)}>
            <option value="">All photos</option>
            {albums.map((a:any)=> (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="q">Search</Label>
          <Input id="q" placeholder="Search caption or alt" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
      </div>

      {/* Add by URL */}
      <SectionCard className="mt-6">
        <SectionCardTitle kicker="PHOTOS" title={<span>Add Photo by URL</span>} />
        <SectionCardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Image URL" htmlFor="purl" required>
              <Input id="purl" placeholder="https://…" value={form.url} onChange={e=>setForm(f=>({...f, url: e.target.value}))} />
            </FormField>
            <FormField label="Caption" htmlFor="pcap">
              <Input id="pcap" placeholder="Optional caption" value={form.caption || ''} onChange={e=>setForm(f=>({...f, caption: e.target.value}))} />
            </FormField>
            <div className="self-end">
              <Button onClick={handleAddByUrl} disabled={!form.url} isLoading={creating}>Add Photo</Button>
            </div>
          </div>
        </SectionCardBody>
      </SectionCard>

      {/* Create album */}
      <SectionCard className="mt-4">
        <SectionCardTitle kicker="PHOTOS" title={<span>Create Album</span>} />
        <SectionCardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Name" htmlFor="aname" required>
              <Input id="aname" placeholder="e.g. Engagement" value={newAlbum.name} onChange={e=>setNewAlbum(a=>({...a, name: e.target.value}))} />
            </FormField>
            <FormField label="Description" htmlFor="adesc">
              <Input id="adesc" placeholder="Optional" value={newAlbum.description || ''} onChange={e=>setNewAlbum(a=>({...a, description: e.target.value}))} />
            </FormField>
            <div className="self-end">
              <Button onClick={handleCreateAlbum} disabled={!newAlbum.name} isLoading={creating}>Create Album</Button>
            </div>
          </div>
        </SectionCardBody>
      </SectionCard>

      {/* Upload file(s) + Drag and Drop */}
      <SectionCard className="mt-4">
        <SectionCardTitle kicker="PHOTOS" title={<span>Upload Photos</span>} />
        <SectionCardBody>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="flex flex-col items-center justify-center gap-2 py-10 rounded-lg border-2 border-dashed border-slate-300 dark:border-dark-3 bg-slate-50 dark:bg-dark-2/40 text-slate-600 dark:text-neutral-300"
        >
          <p className="text-sm">Drag and drop images here</p>
          <p className="text-xs">or</p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUploadFile} className="hidden" />
        </div>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2">Stored in Supabase if configured, then S3 if available, otherwise in <code>/public/uploads</code>.</p>
        {uploads.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploads.map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate">{u.name}</span>
                    <span>{u.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-dark-3 rounded-full overflow-hidden">
                    <div className={`h-full ${u.status==='error' ? 'bg-red-500' : 'bg-[hsl(var(--primary))]'} transition-all`} style={{ width: `${u.progress}%` }} />
                  </div>
                  {u.status==='error' && <div className="text-xs text-rose-600 mt-1">{u.error || 'Upload failed'}</div>}
                </div>
                <div className="text-xs text-slate-500 w-14 text-right">{u.status}</div>
              </div>
            ))}
          </div>
        )}
        </SectionCardBody>
      </SectionCard>
      {loading && <p className="mt-2 text-slate-600 dark:text-neutral-300">Loading…</p>}
      {error && <p className="mt-2 text-rose-600">{error}</p>}
      {!loading && !error && (
        photos.length === 0 ? (
          <EmptyState className="mt-6" icon={<span>🖼️</span>} title="No photos yet" description="Once you add photos via upload or URL, they’ll appear here." />
        ) : (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((p:any) => (
              <div key={p.id} className="relative group overflow-hidden rounded-lg bg-gray-100">
                <img src={p.url} alt={p.alt || 'photo'} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                {p.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs">{p.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
