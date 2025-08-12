'use client'

import { useTranslations } from 'next-intl'
import { useLocale } from '@/providers/LocaleProvider'

export function TranslationTest() {
  const t = useTranslations('common')
  const { localeConfig, formatCurrency } = useLocale()

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Translation & Locale Test 🇳🇬</h3>
      <div className="space-y-2 text-sm">
        <p><strong>Current Language:</strong> {localeConfig.language}</p>
        <p><strong>Current Locale:</strong> {localeConfig.locale}</p>
        <p><strong>Currency:</strong> {localeConfig.currency}</p>
        <p><strong>Timezone:</strong> {localeConfig.timezone}</p>
        <p><strong>Sample Currency:</strong> {formatCurrency(1234.56)}</p>
        <p><strong>Large Amount (Full):</strong> {formatCurrency(5000000)}</p>
        <p><strong>Large Amount (Abbreviated):</strong> {formatCurrency(5000000, true)}</p>
        {/* Special showcase for Nigerian Naira */}
        {localeConfig.currency === 'NGN' && (
          <p className="text-green-600 font-medium">
            🇳🇬 <strong>Nigerian Wedding Budget:</strong> {formatCurrency(5000000, true)} (₦5M format!)
          </p>
        )}
        <p><strong>Translation Test:</strong></p>
        <ul className="ml-4 space-y-1">
          <li>Loading: {t('loading')}</li>
          <li>Save: {t('save')}</li>
          <li>Cancel: {t('cancel')}</li>
          <li>Delete: {t('delete')}</li>
        </ul>
        <p className="text-blue-600 font-medium mt-2">
          🎉 Perfect for Nigerian weddings! Naira (NGN) fully supported!
        </p>
      </div>
    </div>
  )
}