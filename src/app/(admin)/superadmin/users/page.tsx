'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  UserCog,
  CreditCard,
  Mail,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface User {
  id: string
  email: string
  name: string
  created_at: string
  plan: string
  subscription_status: string
  current_period_end?: string
  wedding_date?: string
  guest_count: number
  invoice_count: number
  storage_mb: number
  api_calls: number
  last_active: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export default function SuperAdminUsers() {
  const router = useRouter()
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  useEffect(() => {
    fetchUsers()
  }, [page, plan, status, sortBy, sortOrder])
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (page === 1) {
        fetchUsers()
      } else {
        setPage(1)
      }
    }, 300)
    
    return () => clearTimeout(delayDebounceFn)
  }, [search])
  
  async function fetchUsers() {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(search && { search }),
        ...(plan !== 'all' && { plan }),
        ...(status !== 'all' && { status }),
        sortBy,
        sortOrder
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }
  
  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }
  
  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      past_due: 'destructive',
      canceled: 'outline',
      none: 'outline'
    }
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    )
  }
  
  function getPlanBadge(plan: string) {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-indigo-100 text-indigo-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[plan] || colors.free}`}>
        {plan}
      </span>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="mt-2 text-gray-600">Manage user accounts and subscriptions</p>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setPlan('all')
                setStatus('all')
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    User
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('plan')}
                  >
                    Plan
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    Joined
                  </TableHead>
                  <TableHead>Wedding</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : data?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || 'Unnamed'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(user.plan)}</TableCell>
                      <TableCell>{getStatusBadge(user.subscription_status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {user.wedding_date ? (
                          <div className="text-sm">
                            <div>{format(new Date(user.wedding_date), 'MMM d, yyyy')}</div>
                            <div className="text-gray-500">{user.guest_count} guests</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{user.storage_mb} MB</div>
                          <div className="text-gray-500">{user.api_calls} API calls</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{user.invoice_count} invoices</div>
                          {user.current_period_end && (
                            <div className="text-gray-500">
                              Renews {format(new Date(user.current_period_end), 'MMM d')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => router.push(`/superadmin/users/${user.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCog className="mr-2 h-4 w-4" />
                              Impersonate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Change Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.subscription_status === 'active' ? (
                              <DropdownMenuItem className="text-red-600">
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-green-600">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Reactivate Account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {data && data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.pagination.total)} of {data.pagination.total} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pagination.total_pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}