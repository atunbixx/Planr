import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { marketplaceApi } from '@/lib/api/services/marketplace'
import type { MarketplaceVendorDisplay } from '@/types/marketplace'

interface QuoteRequestModalProps {
  vendor: MarketplaceVendorDisplay | null
  isOpen: boolean
  onClose: () => void
}

export function QuoteRequestModal({ vendor, isOpen, onClose }: QuoteRequestModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    service_type: '',
    description: '',
    budget: '',
    event_date: '',
    guest_count: '',
    contact_email: '',
    contact_phone: ''
  })
  const { toast } = useToast()

  if (!vendor) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await marketplaceApi.requestQuote(vendor.id, {
        vendor_id: vendor.id,
        service_type: formData.service_type,
        description: formData.description,
        budget: formData.budget ? parseInt(formData.budget) : undefined,
        event_date: formData.event_date,
        guest_count: formData.guest_count ? parseInt(formData.guest_count) : undefined,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined
      })

      toast({
        title: "Quote requested!",
        description: `Your quote request has been sent to ${vendor.business_name}.`,
      })

      setFormData({
        service_type: '',
        description: '',
        budget: '',
        event_date: '',
        guest_count: '',
        contact_email: '',
        contact_phone: ''
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request quote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const serviceOptions = [
    'Full Wedding Package',
    'Photography',
    'Videography',
    'DJ/Music',
    'Catering',
    'Flowers',
    'Venue',
    'Makeup & Hair',
    'Transportation',
    'Other'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Quote from {vendor.business_name}</DialogTitle>
          <DialogDescription>
            Tell us about your wedding needs and we'll get you a personalized quote.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="service_type">Service Type *</Label>
            <Select
              value={formData.service_type}
              onValueChange={(value) => handleChange('service_type', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your wedding vision, specific needs, or any special requests..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="event_date">Event Date</Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => handleChange('event_date', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="guest_count">Guest Count</Label>
            <Input
              id="guest_count"
              type="number"
              value={formData.guest_count}
              onChange={(e) => handleChange('guest_count', e.target.value)}
              placeholder="Number of guests"
            />
          </div>

          <div>
            <Label htmlFor="budget">Budget Range</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              placeholder="Enter your budget"
            />
          </div>

          <div>
            <Label htmlFor="contact_email">Your Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <Label htmlFor="contact_phone">Your Phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Request Quote'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}