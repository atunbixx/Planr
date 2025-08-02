import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeSelector, ThemePreview } from '@/components/settings/ThemeSelector'

describe('ThemeSelector', () => {
  const mockOnThemeChange = jest.fn()

  const themes = [
    { id: 'wedding-blush', name: 'Wedding Blush', colors: { primary: '#FFB6C1', secondary: '#FFF0F5' } },
    { id: 'sage-garden', name: 'Sage Garden', colors: { primary: '#87A96B', secondary: '#F0F4EC' } },
    { id: 'ocean-breeze', name: 'Ocean Breeze', colors: { primary: '#4682B4', secondary: '#E6F3FF' } },
    { id: 'classic-ivory', name: 'Classic Ivory', colors: { primary: '#FFFFF0', secondary: '#FAF9F6' } },
    { id: 'royal-purple', name: 'Royal Purple', colors: { primary: '#6B3AA0', secondary: '#F3E5FF' } }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ThemeSelector', () => {
    it('renders all theme options', () => {
      render(
        <ThemeSelector
          selectedTheme="wedding-blush"
          onThemeChange={mockOnThemeChange}
        />
      )

      themes.forEach(theme => {
        expect(screen.getByText(theme.name)).toBeInTheDocument()
      })
    })

    it('shows selected theme as active', () => {
      render(
        <ThemeSelector
          selectedTheme="sage-garden"
          onThemeChange={mockOnThemeChange}
        />
      )

      const selectedThemeElement = screen.getByText('Sage Garden').closest('div')
      expect(selectedThemeElement).toHaveClass('ring-2', 'ring-black')
    })

    it('calls onThemeChange when theme is selected', () => {
      render(
        <ThemeSelector
          selectedTheme="wedding-blush"
          onThemeChange={mockOnThemeChange}
        />
      )

      const oceanBreezeOption = screen.getByText('Ocean Breeze').closest('div')
      fireEvent.click(oceanBreezeOption!)

      expect(mockOnThemeChange).toHaveBeenCalledWith('ocean-breeze')
    })

    it('displays color swatches for each theme', () => {
      render(
        <ThemeSelector
          selectedTheme="wedding-blush"
          onThemeChange={mockOnThemeChange}
        />
      )

      const colorSwatches = screen.getAllByRole('presentation')
      expect(colorSwatches.length).toBeGreaterThan(0)
    })

    it('handles keyboard navigation', () => {
      render(
        <ThemeSelector
          selectedTheme="wedding-blush"
          onThemeChange={mockOnThemeChange}
        />
      )

      const firstTheme = screen.getByText('Wedding Blush').closest('div')
      
      // Simulate keyboard events
      fireEvent.keyDown(firstTheme!, { key: 'Enter' })
      expect(mockOnThemeChange).toHaveBeenCalledWith('wedding-blush')

      fireEvent.keyDown(firstTheme!, { key: ' ' })
      expect(mockOnThemeChange).toHaveBeenCalledTimes(2)
    })

    it('applies hover effects', () => {
      render(
        <ThemeSelector
          selectedTheme="wedding-blush"
          onThemeChange={mockOnThemeChange}
        />
      )

      const themeOption = screen.getByText('Sage Garden').closest('div')
      
      fireEvent.mouseEnter(themeOption!)
      expect(themeOption).toHaveClass('hover:shadow-lg')
      
      fireEvent.mouseLeave(themeOption!)
    })
  })

  describe('ThemePreview', () => {
    it('renders preview with correct theme', () => {
      render(<ThemePreview theme="ocean-breeze" />)

      expect(screen.getByText('Dashboard Preview')).toBeInTheDocument()
      expect(screen.getByText('This is how your dashboard will look with the selected theme.')).toBeInTheDocument()
    })

    it('displays sample UI elements', () => {
      render(<ThemePreview theme="wedding-blush" />)

      // Check for sample elements
      expect(screen.getByText('Sample Card')).toBeInTheDocument()
      expect(screen.getByText('Primary Button')).toBeInTheDocument()
      expect(screen.getByText('Secondary Button')).toBeInTheDocument()
      expect(screen.getByText('Sample notification message')).toBeInTheDocument()
    })

    it('applies theme colors correctly', () => {
      const { container } = render(<ThemePreview theme="royal-purple" />)

      const previewContainer = container.querySelector('[data-theme="royal-purple"]')
      expect(previewContainer).toBeInTheDocument()
    })

    it('shows sample form elements', () => {
      render(<ThemePreview theme="sage-garden" />)

      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
      expect(screen.getByText('Sample checkbox')).toBeInTheDocument()
    })

    it('displays sample progress indicators', () => {
      render(<ThemePreview theme="classic-ivory" />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '70')
    })

    it('updates preview when theme changes', () => {
      const { rerender, container } = render(<ThemePreview theme="wedding-blush" />)

      let previewContainer = container.querySelector('[data-theme="wedding-blush"]')
      expect(previewContainer).toBeInTheDocument()

      rerender(<ThemePreview theme="ocean-breeze" />)

      previewContainer = container.querySelector('[data-theme="ocean-breeze"]')
      expect(previewContainer).toBeInTheDocument()
    })

    it('maintains responsive layout', () => {
      render(<ThemePreview theme="sage-garden" />)

      const gridContainer = screen.getByText('Sample Card').closest('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2')
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      render(
        <ThemeSelector
          selectedTheme="wedding-blush"
          onThemeChange={mockOnThemeChange}
        />
      )

      const themeOptions = screen.getAllByRole('button')
      themeOptions.forEach(option => {
        expect(option).toHaveAttribute('aria-label')
      })
    })

    it('indicates selected state with ARIA', () => {
      render(
        <ThemeSelector
          selectedTheme="ocean-breeze"
          onThemeChange={mockOnThemeChange}
        />
      )

      const selectedOption = screen.getByText('Ocean Breeze').closest('[role="button"]')
      expect(selectedOption).toHaveAttribute('aria-selected', 'true')
    })

    it('supports keyboard focus', () => {
      render(
        <ThemeSelector
          selectedTheme="wedding-blush"
          onThemeChange={mockOnThemeChange}
        />
      )

      const themeOptions = screen.getAllByRole('button')
      themeOptions.forEach(option => {
        expect(option).toHaveAttribute('tabIndex', '0')
      })
    })
  })
})