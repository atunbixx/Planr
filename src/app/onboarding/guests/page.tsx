'use client'

import { useState, useEffect } from 'react'
import StepWrapper from '@/components/onboarding/StepWrapper'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Upload, UserPlus, X } from 'lucide-react'

interface Guest {
  name: string
  email: string
  phone: string
}

export default function GuestsPage() {
  const [importMethod, setImportMethod] = useState<'manual' | 'csv' | null>(null)
  const [guests, setGuests] = useState<Guest[]>([
    { name: '', email: '', phone: '' },
    { name: '', email: '', phone: '' },
    { name: '', email: '', phone: '' }
  ])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<any>({})
  
  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/onboarding/guests')
        if (response.ok) {
          const data = await response.json()
          if (data.stepData?.guests && data.stepData.guests.length > 0) {
            setGuests(data.stepData.guests)
            setImportMethod('manual')
          }
        }
      } catch (error) {
        console.error('Error loading guests data:', error)
      }
    }
    loadData()
  }, [])
  
  const handleGuestChange = (index: number, field: keyof Guest, value: string) => {
    const newGuests = [...guests]
    newGuests[index] = { ...newGuests[index], [field]: value }
    setGuests(newGuests)
    
    // Clear errors for this guest
    if (errors[`guest${index}`]) {
      const newErrors = { ...errors }
      delete newErrors[`guest${index}`]
      setErrors(newErrors)
    }
  }
  
  const addGuest = () => {
    setGuests([...guests, { name: '', email: '', phone: '' }])
  }
  
  const removeGuest = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index))
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      setErrors({})
    } else {
      setErrors({ csv: 'Please select a CSV file' })
    }
  }
  
  const validateForm = () => {
    const newErrors: any = {}
    
    if (importMethod === 'manual') {
      // At least one guest should have a name
      const hasAnyGuest = guests.some(g => g.name.trim())
      if (!hasAnyGuest) {
        newErrors.general = 'Please add at least one guest or skip this step'
      }
      
      // Validate email formats where provided
      guests.forEach((guest, index) => {
        if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
          newErrors[`guest${index}`] = 'Invalid email format'
        }
      })
    } else if (importMethod === 'csv' && !csvFile) {
      newErrors.csv = 'Please select a CSV file to import'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = async () => {
    if (!validateForm()) {
      return false
    }
    
    try {
      let payload: any = {}
      
      if (importMethod === 'manual') {
        // Filter out empty guests
        const validGuests = guests.filter(g => g.name.trim())
        payload = { guests: validGuests }
      } else if (importMethod === 'csv' && csvFile) {
        // In a real app, we'd parse the CSV here
        // For now, just save that they want to import
        payload = { importCsv: true, fileName: csvFile.name }
      }
      
      const response = await fetch('/api/onboarding/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      return response.ok
    } catch (error) {
      console.error('Error saving guests:', error)
      return false
    }
  }
  
  const handleSkip = async () => {
    try {
      await fetch('/api/onboarding/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true })
      })
    } catch (error) {
      console.error('Error skipping guests:', error)
    }
  }
  
  return (
    <StepWrapper
      step="guests"
      title="Add a few guests to get started"
      subtitle="You can import your full guest list later"
      onNext={handleNext}
      onSkip={handleSkip}
      showSkip={true}
    >
      <div className="space-y-6">
        {!importMethod ? (
          <div className="space-y-4">
            <Label>How would you like to add guests?</Label>
            <div className="grid gap-3">
              <button
                onClick={() => setImportMethod('manual')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Add manually</div>
                    <div className="text-sm text-gray-600">Enter a few guests to start</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setImportMethod('csv')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Import CSV</div>
                    <div className="text-sm text-gray-600">Upload a spreadsheet with guest info</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : importMethod === 'manual' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Guest details</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setImportMethod(null)}
              >
                Change method
              </Button>
            </div>
            
            {errors.general && (
              <p className="text-sm text-red-600">{errors.general}</p>
            )}
            
            <div className="space-y-3">
              {guests.map((guest, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Name"
                    value={guest.name}
                    onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Email (optional)"
                    type="email"
                    value={guest.email}
                    onChange={(e) => handleGuestChange(index, 'email', e.target.value)}
                    className="flex-1"
                    aria-invalid={!!errors[`guest${index}`]}
                  />
                  <Input
                    placeholder="Phone (optional)"
                    value={guest.phone}
                    onChange={(e) => handleGuestChange(index, 'phone', e.target.value)}
                    className="flex-1"
                  />
                  {guests.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGuest(index)}
                      aria-label={`Remove guest ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addGuest}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add another guest
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Import guests from CSV</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setImportMethod(null)}
              >
                Change method
              </Button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <Label htmlFor="csvFile" className="cursor-pointer">
                <span className="text-purple-600 hover:text-purple-700">Choose a CSV file</span>
                {' '}or drag and drop
              </Label>
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {csvFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {csvFile.name}
                </p>
              )}
              {errors.csv && (
                <p className="text-sm text-red-600 mt-2">{errors.csv}</p>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Your CSV should have columns for: Name, Email, Phone
              </p>
            </div>
          </div>
        )}
      </div>
    </StepWrapper>
  )
}