import { apiClient } from '../base/client'
import { ApiResponse, PaginatedResponse, QueryParams, UploadProgress } from '../types'

export interface Photo {
  id: string
  couple_id: string
  url: string
  thumbnail_url?: string
  title?: string
  description?: string
  tags?: string[]
  album_id?: string
  uploaded_by: string
  uploaded_at: string
  metadata?: {
    width: number
    height: number
    size: number
    format: string
    camera?: string
    taken_at?: string
  }
  is_featured: boolean
  is_private: boolean
  view_count: number
}

export interface Album {
  id: string
  couple_id: string
  name: string
  description?: string
  cover_photo_id?: string
  cover_photo_url?: string
  photo_count: number
  is_private: boolean
  created_at: string
  updated_at: string
  share_token?: string
}

export interface PhotoFilters extends QueryParams {
  album_id?: string
  tags?: string[]
  uploaded_by?: string
  date_from?: string
  date_to?: string
  is_featured?: boolean
  is_private?: boolean
}

export interface PhotoUploadOptions {
  album_id?: string
  title?: string
  description?: string
  tags?: string[]
  is_private?: boolean
  onProgress?: (progress: UploadProgress) => void
}

export interface PhotoAnalytics {
  total_photos: number
  total_albums: number
  total_size: number
  by_month: {
    month: string
    count: number
    size: number
  }[]
  by_album: {
    album_id: string
    album_name: string
    count: number
  }[]
  top_tags: {
    tag: string
    count: number
  }[]
  storage_usage: {
    used: number
    limit: number
    percentage: number
  }
}

class PhotosApiService {
  private basePath = '/photos'

  // Get photos with filters
  async getPhotos(
    filters?: PhotoFilters
  ): Promise<ApiResponse<PaginatedResponse<Photo>>> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, String(value))
          }
        }
      })
    }
    
    return apiClient.get<PaginatedResponse<Photo>>(`${this.basePath}?${params}`)
  }

  // Get single photo
  async getPhoto(id: string): Promise<ApiResponse<Photo>> {
    return apiClient.get<Photo>(`${this.basePath}/${id}`)
  }

  // Upload photo
  async uploadPhoto(
    file: File,
    options?: PhotoUploadOptions
  ): Promise<ApiResponse<Photo>> {
    const formData = new FormData()
    formData.append('file', file)
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && key !== 'onProgress') {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, String(value))
          }
        }
      })
    }
    
    return apiClient.upload<Photo>(
      this.basePath,
      formData,
      {
        // TODO: Implement progress tracking with XMLHttpRequest
      }
    )
  }

  // Upload multiple photos
  async uploadMultiple(
    files: File[],
    options?: PhotoUploadOptions
  ): Promise<ApiResponse<Photo[]>> {
    const formData = new FormData()
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file)
    })
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && key !== 'onProgress') {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, String(value))
          }
        }
      })
    }
    
    return apiClient.upload<Photo[]>(
      `${this.basePath}/bulk`,
      formData,
      {
        // TODO: Implement progress tracking
      }
    )
  }

  // Update photo
  async updatePhoto(
    id: string,
    data: {
      title?: string
      description?: string
      tags?: string[]
      album_id?: string
      is_featured?: boolean
      is_private?: boolean
    }
  ): Promise<ApiResponse<Photo>> {
    return apiClient.patch<Photo>(`${this.basePath}/${id}`, data)
  }

  // Delete photo
  async deletePhoto(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`${this.basePath}/${id}`)
  }

  // Bulk delete photos
  async bulkDelete(photoIds: string[]): Promise<ApiResponse<{ deleted: number }>> {
    return apiClient.post<{ deleted: number }>(`${this.basePath}/bulk-delete`, {
      photo_ids: photoIds
    })
  }

  // Albums CRUD
  async getAlbums(): Promise<ApiResponse<Album[]>> {
    return apiClient.get<Album[]>(`${this.basePath}/albums`)
  }

  async getAlbum(id: string): Promise<ApiResponse<Album>> {
    return apiClient.get<Album>(`${this.basePath}/albums/${id}`)
  }

  async createAlbum(data: {
    name: string
    description?: string
    is_private?: boolean
  }): Promise<ApiResponse<Album>> {
    return apiClient.post<Album>(`${this.basePath}/albums`, data)
  }

  async updateAlbum(
    id: string,
    data: {
      name?: string
      description?: string
      cover_photo_id?: string
      is_private?: boolean
    }
  ): Promise<ApiResponse<Album>> {
    return apiClient.patch<Album>(`${this.basePath}/albums/${id}`, data)
  }

  async deleteAlbum(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`${this.basePath}/albums/${id}`)
  }

  // Album operations
  async addToAlbum(
    albumId: string,
    photoIds: string[]
  ): Promise<ApiResponse<{ added: number }>> {
    return apiClient.post<{ added: number }>(
      `${this.basePath}/albums/${albumId}/photos`,
      { photo_ids: photoIds }
    )
  }

  async removeFromAlbum(
    albumId: string,
    photoIds: string[]
  ): Promise<ApiResponse<{ removed: number }>> {
    return apiClient.delete<{ removed: number }>(
      `${this.basePath}/albums/${albumId}/photos`,
      { body: JSON.stringify({ photo_ids: photoIds }) }
    )
  }

  // Share album
  async shareAlbum(
    albumId: string,
    options?: {
      expires_at?: string
      password?: string
      allow_download?: boolean
    }
  ): Promise<ApiResponse<{ share_url: string; token: string }>> {
    return apiClient.post<{ share_url: string; token: string }>(
      `${this.basePath}/albums/${albumId}/share`,
      options
    )
  }

  // Photo operations
  async downloadPhoto(
    id: string,
    size?: 'original' | 'large' | 'medium' | 'small'
  ): Promise<ApiResponse<{ url: string }>> {
    return apiClient.get<{ url: string }>(
      `${this.basePath}/${id}/download?size=${size || 'original'}`
    )
  }

  async rotatePhoto(
    id: string,
    degrees: 90 | 180 | 270
  ): Promise<ApiResponse<Photo>> {
    return apiClient.post<Photo>(`${this.basePath}/${id}/rotate`, { degrees })
  }

  // Analytics
  async getAnalytics(): Promise<ApiResponse<PhotoAnalytics>> {
    return apiClient.get<PhotoAnalytics>(`${this.basePath}/analytics`)
  }

  // AI features
  async generateTags(photoId: string): Promise<ApiResponse<{ tags: string[] }>> {
    return apiClient.post<{ tags: string[] }>(`${this.basePath}/${photoId}/ai/tags`)
  }

  async enhancePhoto(
    photoId: string,
    options?: {
      auto_enhance?: boolean
      remove_background?: boolean
      upscale?: boolean
    }
  ): Promise<ApiResponse<{ enhanced_url: string }>> {
    return apiClient.post<{ enhanced_url: string }>(
      `${this.basePath}/${photoId}/ai/enhance`,
      options
    )
  }

  async createCollage(
    photoIds: string[],
    template?: string
  ): Promise<ApiResponse<{ collage_url: string }>> {
    return apiClient.post<{ collage_url: string }>(`${this.basePath}/ai/collage`, {
      photo_ids: photoIds,
      template
    })
  }
}

export const photosApi = new PhotosApiService()