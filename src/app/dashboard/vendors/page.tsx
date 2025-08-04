import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AddVendorDialog from './components/AddVendorDialog'
import VendorList from './components/VendorList'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function VendorsPage() {
  const user = await currentUser()
  
  let vendors: any[] = []
  let categories: any[] = []
  let categoryStats: any[] = []
  let summary = {
    total_vendors: 0,
    booked_vendors: 0,
    pending_vendors: 0,
    total_estimated_cost: 0,
    total_actual_cost: 0,
    contracts_signed: 0
  }
  
  if (user?.id) {
    try {
      // Use the service role Supabase client directly for server-side rendering
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Get user's couple data using admin client
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          couples (id)
        `)
        .eq('clerk_user_id', user.id)
        .single()

      if (!userError && userData?.couples?.[0]) {
        const coupleId = userData.couples[0].id

        // Get vendors for this couple using admin client
        const { data: vendorData, error: vendorError } = await supabaseAdmin
          .from('vendors')
          .select(`
            *,
            vendor_categories (
              id,
              name,
              icon,
              color
            )
          `)
          .eq('couple_id', coupleId)
          .order('created_at', { ascending: false })

        if (!vendorError) {
          vendors = vendorData || []
          
          // Calculate summary from vendors data
          summary = {
            total_vendors: vendors.length,
            booked_vendors: vendors.filter(v => v.status === 'booked').length,
            pending_vendors: vendors.filter(v => ['potential', 'contacted', 'quote_requested', 'in_discussion'].includes(v.status)).length,
            total_estimated_cost: vendors.reduce((sum, v) => sum + (v.estimated_cost || 0), 0),
            total_actual_cost: vendors.reduce((sum, v) => sum + (v.actual_cost || 0), 0),
            contracts_signed: vendors.filter(v => v.contract_signed).length
          }
        }
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      // Fall back to empty arrays
    }
    
    // Get vendor categories (always available)
    const { data: categoriesData } = await supabase
      .from('vendor_categories')
      .select('*')
      .order('display_order')
    
    categories = categoriesData || []
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'booked':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Booked</Badge>
      case 'in_discussion':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Discussion</Badge>
      case 'quote_requested':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Quote Requested</Badge>
      case 'contacted':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Contacted</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Declined</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>
      default:
        return <Badge variant="outline">Potential</Badge>
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 mt-2">Find and manage your wedding vendors</p>
        </div>
        <AddVendorDialog categories={categories} />
      </div>

      {/* Vendor Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_vendors}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Booked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.booked_vendors}</div>
            <p className="text-xs text-muted-foreground">
              {summary.total_vendors > 0 ? Math.round((summary.booked_vendors / summary.total_vendors) * 100) : 0}% booked
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contracts Signed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.contracts_signed}</div>
            <p className="text-xs text-muted-foreground">
              of {summary.booked_vendors} booked
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estimated Cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${Number(summary.total_estimated_cost || 0).toLocaleString()}
            </div>
            {summary.total_actual_cost > 0 && (
              <p className="text-xs text-muted-foreground">
                Actual: ${Number(summary.total_actual_cost).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendor Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Categories</CardTitle>
          <CardDescription>Browse vendors by category</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryStats.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoryStats.map((category) => (
                <Card key={category.category_name} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <span className="text-3xl mb-2 block">{category.category_icon}</span>
                    <h3 className="font-semibold">{category.category_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {Number(category.vendor_count)} vendor{Number(category.vendor_count) !== 1 ? 's' : ''}
                      {Number(category.booked_count) > 0 && (
                        <> • {Number(category.booked_count)} booked</>
                      )}
                    </p>
                    {Number(category.total_estimated_cost) > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${Number(category.total_estimated_cost).toLocaleString()} estimated
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow opacity-50">
                  <CardContent className="p-4 text-center">
                    <span className="text-3xl mb-2 block">{category.icon}</span>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">0 vendors</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Vendors */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Vendors</CardTitle>
              <CardDescription>Vendors you're working with</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vendors.length > 0 ? (
            <VendorList vendors={vendors} categories={categories} />
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold mb-2">No vendors added yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start building your vendor list by adding wedding service providers.
              </p>
              <AddVendorDialog categories={categories} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}