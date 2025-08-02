import { useState, useCallback, useMemo } from 'react'
import { useApiQuery, useApiMutation } from './base'
import { photosApi, Photo, Album, PhotoFilters, PhotoUploadOptions } from '../services/photos'
import { QueryOptions, MutationOptions } from '../types'

// Photos hooks
export function usePhotos(filters?: PhotoFilters, options?: QueryOptions) {
  return useApiQuery(
    () => photosApi.getPhotos(filters),
    options
  )
}

export function usePhoto(id: string, options?: QueryOptions) {
  return useApiQuery(
    () => photosApi.getPhoto(id),
    {
      enabled: !!id,
      ...options
    }
  )
}

export function useUploadPhoto(
  options?: MutationOptions<Photo, { file: File; options?: PhotoUploadOptions }>
) {
  return useApiMutation(
    ({ file, options: uploadOptions }) => photosApi.uploadPhoto(file, uploadOptions),
    options
  )
}

export function useUploadMultiplePhotos(
  options?: MutationOptions<Photo[], { files: File[]; options?: PhotoUploadOptions }>
) {
  return useApiMutation(
    ({ files, options: uploadOptions }) => photosApi.uploadMultiple(files, uploadOptions),
    options
  )
}

export function useUpdatePhoto(
  options?: MutationOptions<Photo, { 
    id: string; 
    data: Parameters<typeof photosApi.updatePhoto>[1] 
  }>
) {
  return useApiMutation(
    ({ id, data }) => photosApi.updatePhoto(id, data),
    options
  )
}

export function useDeletePhoto(
  options?: MutationOptions<{ success: boolean }, string>
) {
  return useApiMutation(
    (id) => photosApi.deletePhoto(id),
    options
  )
}

export function useBulkDeletePhotos(
  options?: MutationOptions<{ deleted: number }, string[]>
) {
  return useApiMutation(
    (photoIds) => photosApi.bulkDelete(photoIds),
    options
  )
}

// Albums hooks
export function useAlbums(options?: QueryOptions) {
  return useApiQuery(
    () => photosApi.getAlbums(),
    options
  )
}

export function useAlbum(id: string, options?: QueryOptions) {
  return useApiQuery(
    () => photosApi.getAlbum(id),
    {
      enabled: !!id,
      ...options
    }
  )
}

export function useCreateAlbum(
  options?: MutationOptions<Album, Parameters<typeof photosApi.createAlbum>[0]>
) {
  return useApiMutation(
    (data) => photosApi.createAlbum(data),
    options
  )
}

export function useUpdateAlbum(
  options?: MutationOptions<Album, { 
    id: string; 
    data: Parameters<typeof photosApi.updateAlbum>[1] 
  }>
) {
  return useApiMutation(
    ({ id, data }) => photosApi.updateAlbum(id, data),
    options
  )
}

export function useDeleteAlbum(
  options?: MutationOptions<{ success: boolean }, string>
) {
  return useApiMutation(
    (id) => photosApi.deleteAlbum(id),
    options
  )
}

// Album operations
export function useAddToAlbum(
  options?: MutationOptions<{ added: number }, { albumId: string; photoIds: string[] }>
) {
  return useApiMutation(
    ({ albumId, photoIds }) => photosApi.addToAlbum(albumId, photoIds),
    options
  )
}

export function useRemoveFromAlbum(
  options?: MutationOptions<{ removed: number }, { albumId: string; photoIds: string[] }>
) {
  return useApiMutation(
    ({ albumId, photoIds }) => photosApi.removeFromAlbum(albumId, photoIds),
    options
  )
}

export function useShareAlbum(
  options?: MutationOptions<
    { share_url: string; token: string },
    { albumId: string; options?: Parameters<typeof photosApi.shareAlbum>[1] }
  >
) {
  return useApiMutation(
    ({ albumId, options: shareOptions }) => photosApi.shareAlbum(albumId, shareOptions),
    options
  )
}

// Photo operations
export function useRotatePhoto(
  options?: MutationOptions<Photo, { id: string; degrees: 90 | 180 | 270 }>
) {
  return useApiMutation(
    ({ id, degrees }) => photosApi.rotatePhoto(id, degrees),
    options
  )
}

// Analytics
export function usePhotoAnalytics(options?: QueryOptions) {
  return useApiQuery(
    () => photosApi.getAnalytics(),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
      ...options
    }
  )
}

// AI features
export function useGenerateTags(
  options?: MutationOptions<{ tags: string[] }, string>
) {
  return useApiMutation(
    (photoId) => photosApi.generateTags(photoId),
    options
  )
}

export function useEnhancePhoto(
  options?: MutationOptions<
    { enhanced_url: string },
    { photoId: string; options?: Parameters<typeof photosApi.enhancePhoto>[1] }
  >
) {
  return useApiMutation(
    ({ photoId, options: enhanceOptions }) => photosApi.enhancePhoto(photoId, enhanceOptions),
    options
  )
}

export function useCreateCollage(
  options?: MutationOptions<
    { collage_url: string },
    { photoIds: string[]; template?: string }
  >
) {
  return useApiMutation(
    ({ photoIds, template }) => photosApi.createCollage(photoIds, template),
    options
  )
}

// Composite hook for photo gallery management
export function usePhotoGallery() {
  const [filters, setFilters] = useState<PhotoFilters>({})
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid')
  
  const photos = usePhotos(filters)
  const albums = useAlbums()
  const analytics = usePhotoAnalytics()
  
  const uploadPhoto = useUploadPhoto({
    onSuccess: () => {
      photos.refetch()
      analytics.refetch()
    }
  })
  
  const uploadMultiple = useUploadMultiplePhotos({
    onSuccess: () => {
      photos.refetch()
      analytics.refetch()
    }
  })
  
  const updatePhoto = useUpdatePhoto({
    onSuccess: () => {
      photos.refetch()
    }
  })
  
  const deletePhoto = useDeletePhoto({
    onSuccess: () => {
      photos.refetch()
      analytics.refetch()
    }
  })
  
  const bulkDelete = useBulkDeletePhotos({
    onSuccess: () => {
      photos.refetch()
      analytics.refetch()
      setSelectedPhotos([])
    }
  })
  
  const createAlbum = useCreateAlbum({
    onSuccess: () => {
      albums.refetch()
    }
  })
  
  const updateAlbum = useUpdateAlbum({
    onSuccess: () => {
      albums.refetch()
    }
  })
  
  const deleteAlbum = useDeleteAlbum({
    onSuccess: () => {
      albums.refetch()
      if (activeAlbum === 'deleted') {
        setActiveAlbum(null)
      }
    }
  })
  
  const addToAlbum = useAddToAlbum({
    onSuccess: () => {
      photos.refetch()
      setSelectedPhotos([])
    }
  })

  // Filter helpers
  const updateFilters = useCallback((newFilters: Partial<PhotoFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])
  
  const setAlbumFilter = useCallback((albumId: string | null) => {
    setActiveAlbum(albumId)
    if (albumId) {
      updateFilters({ album_id: albumId })
    } else {
      updateFilters({ album_id: undefined })
    }
  }, [updateFilters])

  // Selection helpers
  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }, [])
  
  const selectAllPhotos = useCallback(() => {
    if (photos.data?.data) {
      setSelectedPhotos(photos.data.data.map(p => p.id))
    }
  }, [photos.data])
  
  const clearSelection = useCallback(() => {
    setSelectedPhotos([])
  }, [])

  // Computed values
  const photosList = useMemo(() => photos.data?.data || [], [photos.data])
  const albumsList = useMemo(() => albums.data || [], [albums.data])
  const totalPhotos = useMemo(() => photos.data?.count || 0, [photos.data])
  const hasMore = useMemo(() => photos.data?.hasMore || false, [photos.data])
  
  const selectedPhotoDetails = useMemo(() => 
    photosList.filter(p => selectedPhotos.includes(p.id)),
    [photosList, selectedPhotos]
  )
  
  const storageUsage = useMemo(() => analytics.data?.storage_usage || {
    used: 0,
    limit: 0,
    percentage: 0
  }, [analytics.data])

  return {
    // Photos data
    photos: photosList,
    totalPhotos,
    hasMore,
    
    // Albums data
    albums: albumsList,
    activeAlbum,
    
    // Filters
    filters,
    updateFilters,
    clearFilters,
    setAlbumFilter,
    
    // View
    viewMode,
    setViewMode,
    
    // Selection
    selectedPhotos,
    selectedPhotoDetails,
    togglePhotoSelection,
    selectAllPhotos,
    clearSelection,
    
    // Analytics
    analytics: analytics.data,
    storageUsage,
    
    // Actions
    uploadPhoto: uploadPhoto.mutate,
    uploadMultiple: uploadMultiple.mutate,
    updatePhoto: updatePhoto.mutate,
    deletePhoto: deletePhoto.mutate,
    bulkDelete: bulkDelete.mutate,
    createAlbum: createAlbum.mutate,
    updateAlbum: updateAlbum.mutate,
    deleteAlbum: deleteAlbum.mutate,
    addToAlbum: addToAlbum.mutate,
    
    // Refetch
    refetch: photos.refetch,
    refetchAlbums: albums.refetch,
    refetchAnalytics: analytics.refetch,
    
    // Loading states
    isLoading: photos.isLoading || albums.isLoading,
    isUploading: uploadPhoto.isLoading || uploadMultiple.isLoading,
    isDeleting: deletePhoto.isLoading || bulkDelete.isLoading,
    
    // Error states
    error: photos.error || albums.error
  }
}