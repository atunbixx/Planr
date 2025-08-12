'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe } from 'lucide-react'
import { locales, localeNames, type Locale } from '@/i18n'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isChanging, setIsChanging] = useState(false)

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) return
    
    setIsChanging(true)
    try {
      // Save the preference to the backend
      const response = await fetch('/api/settings/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLocale })
      })

      if (response.ok) {
        // Reload the page to apply the new locale
        window.location.reload()
      } else {
        toast.error('Failed to update language preference')
      }
    } catch (error) {
      console.error('Error changing language:', error)
      toast.error('Failed to change language')
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <Select value={locale} onValueChange={handleLanguageChange} disabled={isChanging}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}