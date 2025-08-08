import { getVendorsData } from '@/lib/server/db'
import AddVendorDialog from './components/AddVendorDialog'
import VendorList from './components/VendorList'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Phone, Mail, Calendar, DollarSign } from 'lucide-react'

interface VendorsPageProps {
  searchParams: Promise<{
    status?: string
    category?: string
    search?: string
    page?: string
    limit?: string
    sort_field?: string
    sort_direction?: 'asc' | 'desc'
  }>
}

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  const resolvedSearchParams = await searchParams
  
  const filters = {
    status: resolvedSearchParams.status,
    category: resolvedSearchParams.category,
    search: resolvedSearchParams.search
  }
  
  const sort = {
    field: resolvedSearchParams.sort_field || 'createdAt',
    direction: resolvedSearchParams.sort_direction || 'desc' as 'desc'
  }
  
  const pagination = {
    page: parseInt(resolvedSearchParams.page || '1'),
    limit: parseInt(resolvedSearchParams.limit || '20')
  }

  const { vendors, categories, summary } = await getVendorsData({
    filters,
    sort,
    pagination
  })

  return (
    <div className="px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Vendors</h1>
        <p className="text-lg font-light text-gray-600">Manage your wedding vendors and track contracts</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-gray-900">{summary.total_vendors}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Total Vendors</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-[#7a9b7f]">{summary.booked_vendors}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Booked</p>
          <p className="text-xs font-light text-gray-500 mt-1">{summary.contracts_signed} contracts signed</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-amber-600">{summary.pending_vendors}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Pending</p>
          <p className="text-xs font-light text-gray-500 mt-1">In discussion</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-gray-900">${summary.total_estimated_cost.toLocaleString()}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Estimated Cost</p>
          <p className="text-xs font-light text-gray-500 mt-1">Actual: ${summary.total_actual_cost.toLocaleString()}</p>
        </div>
      </div>

      {/* Vendors List */}
      <div className="bg-white rounded-sm shadow-sm">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Your Vendors</h2>
              <p className="text-sm font-light text-gray-600 mt-1">Track vendors, manage contracts, and stay organized</p>
            </div>
            <AddVendorDialog categories={categories}>
              <Button className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light tracking-wider uppercase">
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </AddVendorDialog>
          </div>
        </div>
        
        <div className="p-0">
          <Suspense fallback={<VendorListSkeleton />}>
            <VendorList vendors={vendors} categories={categories} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function VendorListSkeleton() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-6 border-b border-gray-50">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gray-200 rounded-sm"></div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded-sm"></div>
                <div className="h-3 w-24 bg-gray-200 rounded-sm"></div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 rounded-sm"></div>
                <div className="h-3 w-16 bg-gray-200 rounded-sm"></div>
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded-sm"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}