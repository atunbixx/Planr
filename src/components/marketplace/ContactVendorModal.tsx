'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { MarketplaceVendorDisplay } from '@/types/marketplace'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  eventDate: z.date().optional(),
  eventType: z.string().optional(),
  guestCount: z.number().int().positive().optional(),
  budgetRange: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  specificQuestions: z.string().optional()
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactVendorModalProps {
  vendor: MarketplaceVendorDisplay | null
  isOpen: boolean
  onClose: () => void
}

export function ContactVendorModal({ vendor, isOpen, onClose }: ContactVendorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      eventType: 'wedding',
      budgetRange: 'Not sure yet'
    }
  })

  const eventDate = watch('eventDate')

  if (!vendor) return null

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/marketplace/vendors/${vendor.id}/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          eventDate: data.eventDate?.toISOString(),
          guestCount: data.guestCount ? parseInt(data.guestCount.toString()) : undefined
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send inquiry')
      }

      toast({
        title: 'Inquiry sent!',
        description: 'The vendor will contact you soon.',
      })

      reset()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send inquiry',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact {vendor.business_name}</DialogTitle>
          <DialogDescription>
            Send an inquiry to this vendor. They'll respond within 24-48 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="John & Jane Doe"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label>Event Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !eventDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={(date) => setValue('eventDate', date as Date)}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestCount">Estimated Guests</Label>
              <Input
                id="guestCount"
                type="number"
                {...register('guestCount', { valueAsNumber: true })}
                placeholder="150"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetRange">Budget Range</Label>
              <select
                id="budgetRange"
                {...register('budgetRange')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Not sure yet">Not sure yet</option>
                <option value="Under $1,000">Under $1,000</option>
                <option value="$1,000 - $5,000">$1,000 - $5,000</option>
                <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                <option value="$10,000 - $20,000">$10,000 - $20,000</option>
                <option value="Over $20,000">Over $20,000</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder={`Hi! We're interested in your ${vendor.category} services for our wedding...`}
              rows={4}
            />
            {errors.message && (
              <p className="text-sm text-red-500">{errors.message.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="specificQuestions">Specific Questions (Optional)</Label>
            <Textarea
              id="specificQuestions"
              {...register('specificQuestions')}
              placeholder="Do you have availability on our date? What packages do you offer?"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Inquiry'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}