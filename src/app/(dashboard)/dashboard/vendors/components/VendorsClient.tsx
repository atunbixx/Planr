'use client'

import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import AddVendorDialog from './AddVendorDialog'
import VendorList from './VendorList'

interface Vendor {
  id: string
  businessName: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  category: string
  status: string
  estimatedCost?: number
  actualCost?: number
  contractSigned: boolean
  notes?: string
}

interface VendorStats {
  total: number
  potential: number
  contacted: number
  quoted: number
  booked: number
  completed: number
}

interface VendorCosts {
  estimated: number
  actual: number
}

interface Category {
  name: string
  icon: string
}

export default function VendorsClient() {
  const { user, isSignedIn, isLoading } = useSupabaseAuth()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<VendorStats>({
    total: 0,
    potential: 0,
    contacted: 0,
    quoted: 0,
    booked: 0,
    completed: 0
  })
  const [costs, setCosts] = useState<VendorCosts>({
    estimated: 0,
    actual: 0
  })
  const [categories] = useState<Category[]>([
    { name: 'Venue', icon: '🏛️' },
    { name: 'Catering', icon: '🍽️' },
    { name: 'Photography', icon: '📸' },
    { name: 'Videography', icon: '🎥' },
    { name: 'Music/DJ', icon: '🎵' },
    { name: 'Flowers', icon: '💐' },
    { name: 'Transportation', icon: '🚗' },
    { name: 'Wedding Cake', icon: '🎂' },
    { name: 'Hair & Makeup', icon: '💄' },
    { name: 'Officiant', icon: '👨‍💼' },
    { name: 'Decorations', icon: '🎀' },
    { name: 'Other', icon: '📝' }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVendors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/vendors')
      if (!response.ok) {
        throw new Error(`Failed to fetch vendors: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setVendors(data.vendors)
        setStats(data.stats)
        setCosts(data.costs)
      } else {
        setError(data.error || 'Failed to load vendors')
      }
    } catch (err) {
      console.error('Error fetching vendors:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      fetchVendors()
    }
  }, [isLoading, isSignedIn])

  if (loading) {
    return (
      <div className="px-8 py-12">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 data-testid="vendors-page-title" className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Vendors</h1>
        <p className="text-lg font-light text-gray-600">Manage your wedding vendors and track contracts</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p data-testid="total-vendors" className="text-3xl font-light text-gray-900">{stats.total}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Total Vendors</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-[#7a9b7f]">{stats.booked}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Booked</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-amber-600">{stats.contacted + stats.quoted}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Pending</p>
          <p className="text-xs font-light text-gray-500 mt-1">In discussion</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-gray-900">${costs.estimated.toLocaleString()}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Estimated Cost</p>
          <p className="text-xs font-light text-gray-500 mt-1">Actual: ${costs.actual.toLocaleString()}</p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-sm text-sm">
          {error}
        </div>
      )}

      {/* Vendors List */}
      <div className="bg-white rounded-sm shadow-sm">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Your Vendors</h2>
              <p className="text-sm font-light text-gray-600 mt-1">Track vendors, manage contracts, and stay organized</p>
            </div>
            <AddVendorDialog categories={categories} onVendorAdded={fetchVendors}>
              <Button data-testid="add-vendor-button" className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light tracking-wider uppercase">
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </AddVendorDialog>
          </div>
        </div>
        
        <div className="p-8">
          {vendors.length === 0 ? (
            <div data-testid="empty-vendors" className="text-center py-12 text-gray-500 font-light">
              No vendors added yet. Start by adding your first vendor.
            </div>
          ) : (
            <VendorList data-testid="vendor-list" vendors={vendors.map(v => ({
              ...v,
              name: v.businessName
            }))} categories={categories} />
          )}
        </div>
      </div>
    </div>
  )
}