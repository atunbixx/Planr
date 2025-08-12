'use client'

import { useState } from 'react'
import { useLocale } from '@/providers/LocaleProvider'
import { getAvailableLocales } from '@/lib/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Globe, DollarSign, Clock, Calendar } from 'lucide-react'

export function LocaleSelector() {
  const { localeConfig, setLocale, formatCurrency, formatDate, formatNumber } = useLocale()
  const [selectedLocale, setSelectedLocale] = useState(localeConfig.locale)
  const [isSaving, setIsSaving] = useState(false)

  const availableLocales = getAvailableLocales()

  const handleLocaleChange = async (newLocale: string) => {
    setSelectedLocale(newLocale)
  }

  const handleSave = async () => {
    if (selectedLocale === localeConfig.locale) return

    setIsSaving(true)
    try {
      await setLocale(selectedLocale)
    } catch (error) {
      console.error('Failed to save locale:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const previewConfig = availableLocales.find(l => l.locale === selectedLocale) || localeConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Language & Region Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div>
            <Label htmlFor="locale-select">Language & Region</Label>
            <Select value={selectedLocale} onValueChange={handleLocaleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableLocales.map((locale) => (
                  <SelectItem key={locale.locale} value={locale.locale}>
                    {getLocaleName(locale.locale)} ({locale.locale})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-4">Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Currency:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat(previewConfig.locale, {
                    style: 'currency',
                    currency: previewConfig.currency
                  }).format(1234.56)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Date format:</span>
                <span className="font-medium">
                  {new Intl.DateTimeFormat(previewConfig.locale).format(new Date())}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Timezone:</span>
                <span className="font-medium">{previewConfig.timezone}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Numbers:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat(previewConfig.locale).format(1234567.89)}
                </span>
              </div>
            </div>
          </div>

          {selectedLocale !== localeConfig.locale && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getLocaleName(locale: string): string {
  const names: Record<string, string> = {
    'en-NG': '🇳🇬 English (Nigeria)',
    'en-US': 'English (United States)',
    'en-GB': 'English (United Kingdom)',
    'en-CA': 'English (Canada)',
    'en-AU': 'English (Australia)',
    'en-GH': 'English (Ghana)',
    'en-KE': 'English (Kenya)',
    'en-ZA': 'English (South Africa)',
    'es-ES': 'Español (España)',
    'es-MX': 'Español (México)',
    'fr-FR': 'Français (France)',
    'fr-CA': 'Français (Canada)',
    'de-DE': 'Deutsch (Deutschland)',
    'it-IT': 'Italiano (Italia)',
    'pt-BR': 'Português (Brasil)',
    'pt-PT': 'Português (Portugal)',
    'ja-JP': '日本語 (日本)',
    'zh-CN': '中文 (中国)',
    'hi-IN': 'हिन्दी (भारत)',
    'ar-SA': 'العربية (السعودية)'
  }
  return names[locale] || locale
}