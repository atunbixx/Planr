import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvatarUpload } from '@/components/settings/AvatarUpload'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn()
      }))
    }
  }
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn()
}))

describe('AvatarUpload', () => {
  const mockUserId = 'test-user-123'
  const mockCurrentAvatarUrl = 'https://example.com/avatar.jpg'
  const mockOnUploadComplete = jest.fn()
  const mockToast = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
  })

  it('renders with current avatar', () => {
    render(
      <AvatarUpload
        userId={mockUserId}
        currentAvatarUrl={mockCurrentAvatarUrl}
        onUploadComplete={mockOnUploadComplete}
      />
    )

    const avatarImage = screen.getByAltText('Profile')
    expect(avatarImage).toHaveAttribute('src', mockCurrentAvatarUrl)
  })

  it('renders with default avatar when no current avatar', () => {
    render(
      <AvatarUpload
        userId={mockUserId}
        currentAvatarUrl=""
        onUploadComplete={mockOnUploadComplete}
      />
    )

    const uploadIcon = screen.getByText(/fas fa-camera/)
    expect(uploadIcon).toBeInTheDocument()
  })

  it('handles successful file upload', async () => {
    const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
    const mockPublicUrl = 'https://example.com/new-avatar.jpg'

    const mockStorage = {
      upload: jest.fn().mockResolvedValue({ data: { path: 'avatars/test.jpg' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: mockPublicUrl } }),
      remove: jest.fn()
    }

    ;(supabase.storage.from as jest.Mock).mockReturnValue(mockStorage)

    const { container } = render(
      <AvatarUpload
        userId={mockUserId}
        currentAvatarUrl=""
        onUploadComplete={mockOnUploadComplete}
      />
    )

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    await act(async () => {
      await userEvent.upload(fileInput, mockFile)
    })

    await waitFor(() => {
      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringContaining('avatar-'),
        mockFile,
        expect.any(Object)
      )
      expect(mockOnUploadComplete).toHaveBeenCalledWith(mockPublicUrl)
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Avatar uploaded',
        description: 'Your profile photo has been updated.'
      })
    })
  })

  it('handles upload error', async () => {
    const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
    const mockError = new Error('Upload failed')

    const mockStorage = {
      upload: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      getPublicUrl: jest.fn(),
      remove: jest.fn()
    }

    ;(supabase.storage.from as jest.Mock).mockReturnValue(mockStorage)

    const { container } = render(
      <AvatarUpload
        userId={mockUserId}
        currentAvatarUrl=""
        onUploadComplete={mockOnUploadComplete}
      />
    )

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      await userEvent.upload(fileInput, mockFile)
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive'
      })
      expect(mockOnUploadComplete).not.toHaveBeenCalled()
    })
  })

  it('validates file size', async () => {
    const mockLargeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })

    const { container } = render(
      <AvatarUpload
        userId={mockUserId}
        currentAvatarUrl=""
        onUploadComplete={mockOnUploadComplete}
      />
    )

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      await userEvent.upload(fileInput, mockLargeFile)
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'File too large',
        description: 'Please select an image under 5MB.',
        variant: 'destructive'
      })
    })
  })

  it('validates file type', async () => {
    const mockInvalidFile = new File(['test'], 'document.pdf', { type: 'application/pdf' })

    const { container } = render(
      <AvatarUpload
        userId={mockUserId}
        currentAvatarUrl=""
        onUploadComplete={mockOnUploadComplete}
      />
    )

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      await userEvent.upload(fileInput, mockInvalidFile)
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Invalid file type',
        description: 'Please select a valid image file (JPEG, PNG, or WebP).',
        variant: 'destructive'
      })
    })
  })

  it('handles avatar deletion', async () => {
    const mockStorage = {
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn().mockResolvedValue({ error: null })
    }

    ;(supabase.storage.from as jest.Mock).mockReturnValue(mockStorage)

    render(
      <AvatarUpload
        userId={mockUserId}
        currentAvatarUrl={mockCurrentAvatarUrl}
        onUploadComplete={mockOnUploadComplete}
      />
    )

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    
    await act(async () => {
      fireEvent.click(deleteButton)
    })

    await waitFor(() => {
      expect(mockStorage.remove).toHaveBeenCalled()
      expect(mockOnUploadComplete).toHaveBeenCalledWith('')
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Avatar removed',
        description: 'Your profile photo has been removed.'
      })
    })
  })

  it('shows loading state during upload', async () => {
    const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })

    const mockStorage = {
      upload: jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => 
          resolve({ data: { path: 'test.jpg' }, error: null }), 100
        ))
      ),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'test.jpg' } }),
      remove: jest.fn()
    }

    ;(supabase.storage.from as jest.Mock).mockReturnValue(mockStorage)

    const { container } = render(
      <AvatarUpload
        userId={mockUserId}
        currentAvatarUrl=""
        onUploadComplete={mockOnUploadComplete}
      />
    )

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    await act(async () => {
      await userEvent.upload(fileInput, mockFile)
    })

    expect(screen.getByText(/uploading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument()
    })
  })
})