'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppointmentBooking } from '@/components/vendors/AppointmentBooking'
import { VendorCalendar } from '@/components/vendors/VendorCalendar'
import { VendorContracts } from '@/components/vendors/VendorContracts'
import { useToast } from '@/hooks/useToast'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  DollarSign,
  User,
  Calendar,
  FileText,
  Star
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface Vendor {
  id: string
  name: string
  business_name?: string
  category: string
  status: string
  email?: string
  phone?: string
  website?: string
  contact_person?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  estimated_cost?: number
  actual_cost?: number
  deposit_amount?: number
  deposit_paid?: boolean
  final_payment_due?: string
  rating?: number
  notes?: string
  referral_source?: string
  contract_status?: string
  contract_start_date?: string
  contract_end_date?: string
  contract_amount?: number
  balance_due?: number
  created_at: string
  updated_at: string
}

export default function VendorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const vendorId = params.id as string
  
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)
  const [refreshCalendar, setRefreshCalendar] = useState(0)
  const [activeTab, setActiveTab] = useState<'info' | 'contracts' | 'appointments'>('info')
  
  const supabase = createClientComponentClient()
  const { addToast } = useToast()

  useEffect(() => {
    loadVendorAndCouple()
  }, [vendorId])

  const loadVendorAndCouple = async () => {
    try {
      // Get vendor details (using couple_vendors table)
      const { data: vendorData, error: vendorError } = await supabase
        .from('couple_vendors')
        .select('*')
        .eq('id', vendorId)
        .single()

      if (vendorError) throw vendorError

      setVendor(vendorData)

      // Get current couple
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: couple, error: coupleError } = await supabase
          .from('couples')
          .select('id')
          .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
          .single()

        if (!coupleError && couple) {
          setCoupleId(couple.id)
        }
      }
    } catch (error) {
      console.error('Error loading vendor:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load vendor details',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBookingComplete = () => {
    setShowBooking(false)
    setRefreshCalendar(prev => prev + 1)
    addToast({
      title: 'Success!',
      description: 'Appointment booked successfully',
      type: 'success'
    })
  }

  const handleContractStatusChange = async (newStatus: string) => {
    if (!vendor) return

    try {
      const { error } = await supabase
        .from('couple_vendors')
        .update({ 
          contract_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id)

      if (error) throw error

      setVendor(prev => prev ? { ...prev, contract_status: newStatus } : prev)
      
      addToast({
        title: 'Success',
        description: 'Contract status updated',
        type: 'success'
      })
    } catch (error) {
      console.error('Error updating contract status:', error)
      addToast({
        title: 'Error',
        description: 'Failed to update contract status',
        type: 'error'
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'booked':
        return 'default' as const
      case 'researching':
        return 'secondary' as const
      case 'contacted':
        return 'outline' as const
      case 'meeting_scheduled':
        return 'outline' as const
      case 'proposal_received':
        return 'outline' as const
      case 'rejected':
        return 'destructive' as const
      default:
        return 'secondary' as const
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor details...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <h3 className="text-lg font-semibold text-ink mb-2">Vendor not found</h3>
            <p className="text-gray-500">This vendor could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </Button>
        {coupleId && (
          <Button
            onClick={() => setShowBooking(!showBooking)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        )}
      </div>

      {/* Vendor Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{vendor.name}</CardTitle>
              {vendor.business_name && (
                <CardDescription className="text-lg mt-1">
                  {vendor.business_name}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {vendor.category.replace('_', ' ')}
              </Badge>
              <Badge variant={getStatusBadgeVariant(vendor.status)}>
                {vendor.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <Button
          variant={activeTab === 'info' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('info')}
          className={cn(
            "px-4 py-2",
            activeTab === 'info' && "bg-white shadow-sm"
          )}
        >
          <FileText className="h-4 w-4 mr-2" />
          Information
        </Button>
        <Button
          variant={activeTab === 'contracts' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('contracts')}
          className={cn(
            "px-4 py-2",
            activeTab === 'contracts' && "bg-white shadow-sm"
          )}
        >
          <FileText className="h-4 w-4 mr-2" />
          Contracts
        </Button>
        <Button
          variant={activeTab === 'appointments' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('appointments')}
          className={cn(
            "px-4 py-2",
            activeTab === 'appointments' && "bg-white shadow-sm"
          )}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Appointments
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <Card>
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendor.contact_person && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{vendor.contact_person}</span>
                </div>
              )}
              {vendor.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <a href={`mailto:${vendor.email}`} className="text-accent hover:underline">
                    {vendor.email}
                  </a>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <a href={`tel:${vendor.phone}`} className="text-accent hover:underline">
                    {vendor.phone}
                  </a>
                </div>
              )}
              {vendor.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <a 
                    href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {vendor.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {(vendor.address || vendor.city || vendor.state) && (
            <div>
              <h3 className="font-semibold mb-3">Location</h3>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  {vendor.address && <p>{vendor.address}</p>}
                  {(vendor.city || vendor.state || vendor.zip_code) && (
                    <p>
                      {vendor.city}{vendor.city && vendor.state && ', '}
                      {vendor.state} {vendor.zip_code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Financial Information */}
          <div>
            <h3 className="font-semibold mb-3">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vendor.estimated_cost && (
                <div>
                  <p className="text-sm text-gray-600">Estimated Cost</p>
                  <p className="font-semibold">${vendor.estimated_cost.toLocaleString()}</p>
                </div>
              )}
              {vendor.actual_cost && (
                <div>
                  <p className="text-sm text-gray-600">Actual Cost</p>
                  <p className="font-semibold">${vendor.actual_cost.toLocaleString()}</p>
                </div>
              )}
              {vendor.deposit_amount && (
                <div>
                  <p className="text-sm text-gray-600">Deposit</p>
                  <p className="font-semibold">
                    ${vendor.deposit_amount.toLocaleString()}
                    {vendor.deposit_paid && (
                      <Badge variant="default" className="ml-2 text-xs">Paid</Badge>
                    )}
                  </p>
                </div>
              )}
            </div>
            {vendor.final_payment_due && (
              <div className="mt-3">
                <p className="text-sm text-gray-600">Final Payment Due</p>
                <p className="font-semibold">
                  {new Date(vendor.final_payment_due).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Rating */}
          {vendor.rating && (
            <div>
              <h3 className="font-semibold mb-3">Rating</h3>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-5 w-5",
                      i < vendor.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    )}
                  />
                ))}
                <span className="text-sm text-gray-600">({vendor.rating}/5)</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {vendor.notes && (
            <div>
              <h3 className="font-semibold mb-3">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{vendor.notes}</p>
              </div>
            </div>
          )}

          {/* Referral Source */}
          {vendor.referral_source && (
            <div>
              <h3 className="font-semibold mb-3">Referral Source</h3>
              <p className="text-sm">{vendor.referral_source}</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && coupleId && (
        <VendorContracts
          vendorId={vendor.id}
          vendorName={vendor.name}
          contractStatus={vendor.contract_status}
          contractAmount={vendor.contract_amount}
          onStatusChange={handleContractStatusChange}
        />
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <>
          {/* Appointment Booking */}
          {showBooking && coupleId && (
            <AppointmentBooking
              vendorId={vendor.id}
              vendorName={vendor.name}
              coupleId={coupleId}
              onBookingComplete={handleBookingComplete}
            />
          )}

          {/* Appointments Calendar */}
          {coupleId && (
            <div key={refreshCalendar}>
              <h2 className="text-xl font-semibold mb-4">Appointments with {vendor.name}</h2>
              <VendorCalendar
                vendorId={vendor.id}
                coupleId={coupleId}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}