import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import SettingsPage from '@/app/dashboard/settings/page'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn()
    }
  }
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn()
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

describe('SettingsPage', () => {
  const mockRouter = { push: jest.fn() }
  const mockToast = jest.fn()
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'John Doe',
      wedding_date: '2024-06-15',
      partner_name: 'Jane Smith',
      venue: 'Garden Palace',
      guest_count: '150',
      avatar_url: 'https://example.com/avatar.jpg',
      notifications: {
        emailUpdates: true,
        taskReminders: true,
        vendorMessages: true,
        guestRsvpAlerts: true,
        budgetAlerts: true,
        dailyDigest: false,
        weeklyReport: true
      },
      theme: {
        colorScheme: 'wedding-blush',
        fontSize: 'medium',
        compactMode: false
      },
      privacy: {
        profileVisibility: 'private',
        shareWithVendors: false,
        allowGuestUploads: true,
        dataExport: true
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser })
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
  })

  describe('Initial Render', () => {
    it('renders loading state initially', () => {
      ;(useAuth as jest.Mock).mockReturnValue({ user: null })
      
      render(<SettingsPage />)
      
      expect(screen.getByText('Loading settings...')).toBeInTheDocument()
    })

    it('renders all navigation tabs', async () => {
      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Account')).toBeInTheDocument()
        expect(screen.getByText('Notifications')).toBeInTheDocument()
        expect(screen.getByText('Theme')).toBeInTheDocument()
        expect(screen.getByText('Privacy')).toBeInTheDocument()
        expect(screen.getByText('Integrations')).toBeInTheDocument()
      })
    })

    it('loads user data into profile form', async () => {
      render(<SettingsPage />)

      await waitFor(() => {
        const fullNameInput = screen.getByLabelText('Full Name') as HTMLInputElement
        expect(fullNameInput.value).toBe('John Doe')
        
        const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement
        expect(emailInput.value).toBe('test@example.com')
        expect(emailInput).toBeDisabled()
        
        const weddingDateInput = screen.getByLabelText('Wedding Date') as HTMLInputElement
        expect(weddingDateInput.value).toBe('2024-06-15')
      })
    })
  })

  describe('Profile Tab', () => {
    it('updates profile information successfully', async () => {
      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })

      render(<SettingsPage />)

      await waitFor(() => {
        const fullNameInput = screen.getByLabelText('Full Name')
        fireEvent.change(fullNameInput, { target: { value: 'John Updated' } })
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({
          data: {
            full_name: 'John Updated',
            wedding_date: '2024-06-15',
            partner_name: 'Jane Smith',
            venue: 'Garden Palace',
            guest_count: '150'
          }
        })
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Profile updated',
          description: 'Your profile has been successfully updated.'
        })
      })
    })

    it('handles profile update error', async () => {
      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ 
        error: new Error('Update failed') 
      })

      render(<SettingsPage />)

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive'
        })
      })
    })

    it('validates form inputs', async () => {
      render(<SettingsPage />)

      await waitFor(() => {
        const fullNameInput = screen.getByLabelText('Full Name')
        fireEvent.change(fullNameInput, { target: { value: '' } })
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Account Tab', () => {
    it('changes password successfully', async () => {
      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })

      render(<SettingsPage />)

      // Switch to Account tab
      const accountTab = screen.getByText('Account')
      fireEvent.click(accountTab)

      await waitFor(() => {
        const currentPasswordInput = screen.getByLabelText('Current Password')
        fireEvent.change(currentPasswordInput, { target: { value: 'currentpass123' } })
        
        const newPasswordInput = screen.getByLabelText('New Password')
        fireEvent.change(newPasswordInput, { target: { value: 'newpass123!' } })
        
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
        fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123!' } })
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({
          password: 'newpass123!'
        })
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Password updated',
          description: 'Your password has been successfully changed.'
        })
      })
    })

    it('validates password requirements', async () => {
      render(<SettingsPage />)

      const accountTab = screen.getByText('Account')
      fireEvent.click(accountTab)

      await waitFor(() => {
        const newPasswordInput = screen.getByLabelText('New Password')
        fireEvent.change(newPasswordInput, { target: { value: 'weak' } })
        
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
        fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } })
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('validates password confirmation match', async () => {
      render(<SettingsPage />)

      const accountTab = screen.getByText('Account')
      fireEvent.click(accountTab)

      await waitFor(() => {
        const newPasswordInput = screen.getByLabelText('New Password')
        fireEvent.change(newPasswordInput, { target: { value: 'newpass123!' } })
        
        const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
        fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass123!' } })
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })
  })

  describe('Notifications Tab', () => {
    it('updates notification preferences', async () => {
      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })

      render(<SettingsPage />)

      const notificationsTab = screen.getByText('Notifications')
      fireEvent.click(notificationsTab)

      await waitFor(() => {
        const taskRemindersToggle = screen.getByLabelText('Task reminders')
        fireEvent.click(taskRemindersToggle)
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({
          data: {
            notifications: expect.objectContaining({
              taskReminders: false
            })
          }
        })
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Notifications updated',
          description: 'Your notification preferences have been saved.'
        })
      })
    })

    it('toggles all notifications', async () => {
      render(<SettingsPage />)

      const notificationsTab = screen.getByText('Notifications')
      fireEvent.click(notificationsTab)

      await waitFor(() => {
        const toggleAllSwitch = screen.getAllByRole('switch')[0]
        fireEvent.click(toggleAllSwitch)
      })

      // Verify all toggles are now in the same state
      const allToggles = screen.getAllByRole('switch')
      allToggles.forEach(toggle => {
        expect(toggle).toBeChecked()
      })
    })
  })

  describe('Theme Tab', () => {
    it('updates theme preferences', async () => {
      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })

      render(<SettingsPage />)

      const themeTab = screen.getByText('Theme')
      fireEvent.click(themeTab)

      await waitFor(() => {
        const oceanBreezeTheme = screen.getByText('Ocean Breeze')
        fireEvent.click(oceanBreezeTheme)
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({
          data: {
            theme: expect.objectContaining({
              colorScheme: 'ocean-breeze'
            })
          }
        })
        expect(document.documentElement).toHaveAttribute('data-theme', 'ocean-breeze')
      })
    })

    it('updates font size preference', async () => {
      render(<SettingsPage />)

      const themeTab = screen.getByText('Theme')
      fireEvent.click(themeTab)

      await waitFor(() => {
        const fontSizeSelect = screen.getByLabelText('Font Size')
        fireEvent.change(fontSizeSelect, { target: { value: 'large' } })
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-font-size', 'large')
      })
    })

    it('toggles compact mode', async () => {
      render(<SettingsPage />)

      const themeTab = screen.getByText('Theme')
      fireEvent.click(themeTab)

      await waitFor(() => {
        const compactModeToggle = screen.getByLabelText('Compact Mode')
        fireEvent.click(compactModeToggle)
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('compact')
      })
    })
  })

  describe('Privacy Tab', () => {
    it('updates privacy settings', async () => {
      ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })

      render(<SettingsPage />)

      const privacyTab = screen.getByText('Privacy')
      fireEvent.click(privacyTab)

      await waitFor(() => {
        const visibilitySelect = screen.getByLabelText('Profile Visibility')
        fireEvent.change(visibilitySelect, { target: { value: 'vendors' } })
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({
          data: {
            privacy: expect.objectContaining({
              profileVisibility: 'vendors'
            })
          }
        })
      })
    })

    it('toggles guest upload permissions', async () => {
      render(<SettingsPage />)

      const privacyTab = screen.getByText('Privacy')
      fireEvent.click(privacyTab)

      await waitFor(() => {
        const guestUploadsToggle = screen.getByLabelText('Guest Photo Uploads')
        fireEvent.click(guestUploadsToggle)
      })

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({
          data: {
            privacy: expect.objectContaining({
              allowGuestUploads: false
            })
          }
        })
      })
    })
  })

  describe('Integrations Tab', () => {
    it('displays available integrations', async () => {
      render(<SettingsPage />)

      const integrationsTab = screen.getByText('Integrations')
      fireEvent.click(integrationsTab)

      await waitFor(() => {
        expect(screen.getByText('Google Calendar')).toBeInTheDocument()
        expect(screen.getByText('Instagram')).toBeInTheDocument()
        expect(screen.getByText('Pinterest')).toBeInTheDocument()
        expect(screen.getByText('Dropbox')).toBeInTheDocument()
      })
    })

    it('shows API key section', async () => {
      render(<SettingsPage />)

      const integrationsTab = screen.getByText('Integrations')
      fireEvent.click(integrationsTab)

      await waitFor(() => {
        expect(screen.getByText('API Access')).toBeInTheDocument()
        expect(screen.getByText('API Key')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('switches between tabs correctly', async () => {
      render(<SettingsPage />)

      const tabs = ['Profile', 'Account', 'Notifications', 'Theme', 'Privacy', 'Integrations']

      for (const tabName of tabs) {
        const tab = screen.getByText(tabName)
        fireEvent.click(tab)

        await waitFor(() => {
          expect(tab.parentElement).toHaveClass('border-black')
        })
      }
    })

    it('returns to dashboard on back button click', async () => {
      render(<SettingsPage />)

      const backButton = screen.getByRole('link', { name: /arrow-left/i })
      expect(backButton).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('Loading States', () => {
    it('shows loading state on save', async () => {
      ;(supabase.auth.updateUser as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )

      render(<SettingsPage />)

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      expect(screen.getByText('Saving...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })
    })

    it('disables save button while loading', async () => {
      ;(supabase.auth.updateUser as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )

      render(<SettingsPage />)

      const saveButton = screen.getByText('Save Changes')
      await act(async () => {
        fireEvent.click(saveButton)
      })

      expect(saveButton).toBeDisabled()

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled()
      })
    })
  })
})