import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationToggle, NotificationGroup, ToggleAll } from '@/components/settings/NotificationToggle'

describe('NotificationToggle', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('NotificationToggle Component', () => {
    it('renders with label and description', () => {
      render(
        <NotificationToggle
          checked={true}
          onChange={mockOnChange}
          label="Email Updates"
          description="Receive updates via email"
        />
      )

      expect(screen.getByText('Email Updates')).toBeInTheDocument()
      expect(screen.getByText('Receive updates via email')).toBeInTheDocument()
    })

    it('shows checked state correctly', () => {
      render(
        <NotificationToggle
          checked={true}
          onChange={mockOnChange}
          label="Test Toggle"
        />
      )

      const toggle = screen.getByRole('switch')
      expect(toggle).toBeChecked()
    })

    it('shows unchecked state correctly', () => {
      render(
        <NotificationToggle
          checked={false}
          onChange={mockOnChange}
          label="Test Toggle"
        />
      )

      const toggle = screen.getByRole('switch')
      expect(toggle).not.toBeChecked()
    })

    it('calls onChange when clicked', () => {
      render(
        <NotificationToggle
          checked={false}
          onChange={mockOnChange}
          label="Test Toggle"
        />
      )

      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)

      expect(mockOnChange).toHaveBeenCalledWith(true)
    })

    it('toggles from checked to unchecked', () => {
      render(
        <NotificationToggle
          checked={true}
          onChange={mockOnChange}
          label="Test Toggle"
        />
      )

      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)

      expect(mockOnChange).toHaveBeenCalledWith(false)
    })

    it('handles keyboard interaction', () => {
      render(
        <NotificationToggle
          checked={false}
          onChange={mockOnChange}
          label="Test Toggle"
        />
      )

      const toggle = screen.getByRole('switch')
      fireEvent.keyDown(toggle, { key: ' ' })

      expect(mockOnChange).toHaveBeenCalledWith(true)
    })

    it('applies disabled state when provided', () => {
      render(
        <NotificationToggle
          checked={true}
          onChange={mockOnChange}
          label="Test Toggle"
          disabled={true}
        />
      )

      const toggle = screen.getByRole('switch')
      expect(toggle).toBeDisabled()
    })

    it('does not call onChange when disabled', () => {
      render(
        <NotificationToggle
          checked={true}
          onChange={mockOnChange}
          label="Test Toggle"
          disabled={true}
        />
      )

      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)

      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('NotificationGroup Component', () => {
    it('renders with title and description', () => {
      render(
        <NotificationGroup
          title="Email Preferences"
          description="Manage your email notifications"
          icon="fas fa-envelope"
        >
          <div>Child content</div>
        </NotificationGroup>
      )

      expect(screen.getByText('Email Preferences')).toBeInTheDocument()
      expect(screen.getByText('Manage your email notifications')).toBeInTheDocument()
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('renders icon when provided', () => {
      render(
        <NotificationGroup
          title="Test Group"
          description="Test description"
          icon="fas fa-bell"
        >
          <div>Content</div>
        </NotificationGroup>
      )

      const icon = screen.getByRole('presentation')
      expect(icon).toHaveClass('fas', 'fa-bell')
    })

    it('renders without icon when not provided', () => {
      render(
        <NotificationGroup
          title="Test Group"
          description="Test description"
        >
          <div>Content</div>
        </NotificationGroup>
      )

      const icons = screen.queryAllByRole('presentation')
      expect(icons.length).toBe(0)
    })

    it('renders multiple children', () => {
      render(
        <NotificationGroup
          title="Test Group"
          description="Test description"
        >
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </NotificationGroup>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
      expect(screen.getByText('Child 3')).toBeInTheDocument()
    })

    it('applies proper styling classes', () => {
      const { container } = render(
        <NotificationGroup
          title="Test Group"
          description="Test description"
        >
          <div>Content</div>
        </NotificationGroup>
      )

      const group = container.firstChild
      expect(group).toHaveClass('space-y-4')
    })
  })

  describe('ToggleAll Component', () => {
    it('renders with correct text when enabled', () => {
      render(
        <ToggleAll
          enabled={true}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Enable all notifications')).toBeInTheDocument()
    })

    it('renders with correct text when disabled', () => {
      render(
        <ToggleAll
          enabled={false}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Enable all notifications')).toBeInTheDocument()
    })

    it('shows enabled state correctly', () => {
      render(
        <ToggleAll
          enabled={true}
          onChange={mockOnChange}
        />
      )

      const toggle = screen.getByRole('switch')
      expect(toggle).toBeChecked()
    })

    it('calls onChange when toggled', () => {
      render(
        <ToggleAll
          enabled={false}
          onChange={mockOnChange}
        />
      )

      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)

      expect(mockOnChange).toHaveBeenCalledWith(true)
    })

    it('applies special styling for toggle all', () => {
      const { container } = render(
        <ToggleAll
          enabled={true}
          onChange={mockOnChange}
        />
      )

      const toggleAllContainer = container.firstChild
      expect(toggleAllContainer).toHaveClass('border-b', 'pb-4', 'mb-4')
    })

    it('maintains accessibility features', () => {
      render(
        <ToggleAll
          enabled={true}
          onChange={mockOnChange}
        />
      )

      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-label')
    })
  })

  describe('Integration Tests', () => {
    it('works with NotificationGroup and NotificationToggle together', () => {
      const mockToggleChange = jest.fn()

      render(
        <NotificationGroup
          title="Email Settings"
          description="Configure email preferences"
          icon="fas fa-envelope"
        >
          <NotificationToggle
            checked={true}
            onChange={mockToggleChange}
            label="Daily Digest"
            description="Receive daily summary emails"
          />
          <NotificationToggle
            checked={false}
            onChange={mockToggleChange}
            label="Weekly Report"
            description="Receive weekly reports"
          />
        </NotificationGroup>
      )

      expect(screen.getByText('Email Settings')).toBeInTheDocument()
      expect(screen.getByText('Daily Digest')).toBeInTheDocument()
      expect(screen.getByText('Weekly Report')).toBeInTheDocument()

      const toggles = screen.getAllByRole('switch')
      expect(toggles).toHaveLength(2)
      expect(toggles[0]).toBeChecked()
      expect(toggles[1]).not.toBeChecked()
    })

    it('handles complex notification preference structure', () => {
      const preferences = {
        email: true,
        sms: false,
        push: true
      }

      const handleChange = (key: string) => (value: boolean) => {
        preferences[key as keyof typeof preferences] = value
      }

      const { rerender } = render(
        <>
          <ToggleAll
            enabled={Object.values(preferences).every(v => v === true)}
            onChange={(enabled) => {
              Object.keys(preferences).forEach(key => {
                preferences[key as keyof typeof preferences] = enabled
              })
            }}
          />
          <NotificationGroup title="Channels" description="Notification channels">
            {Object.entries(preferences).map(([key, value]) => (
              <NotificationToggle
                key={key}
                checked={value}
                onChange={handleChange(key)}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </NotificationGroup>
        </>
      )

      const toggleAll = screen.getAllByRole('switch')[0]
      expect(toggleAll).not.toBeChecked() // Not all are enabled

      fireEvent.click(toggleAll)

      rerender(
        <>
          <ToggleAll
            enabled={Object.values(preferences).every(v => v === true)}
            onChange={(enabled) => {
              Object.keys(preferences).forEach(key => {
                preferences[key as keyof typeof preferences] = enabled
              })
            }}
          />
          <NotificationGroup title="Channels" description="Notification channels">
            {Object.entries(preferences).map(([key, value]) => (
              <NotificationToggle
                key={key}
                checked={value}
                onChange={handleChange(key)}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </NotificationGroup>
        </>
      )

      expect(Object.values(preferences).every(v => v === true)).toBe(true)
    })
  })
})