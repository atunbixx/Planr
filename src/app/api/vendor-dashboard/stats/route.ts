import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-middleware/auth'

// GET /api/vendor-dashboard/stats - Get vendor dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request)
    if (!authResult.authenticated) {
      return authResult.response
    }
    
    // Get vendor ID from query params or user's vendor association
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    
    if (!vendorId) {
      // Try to find vendor associated with this user
      const vendorUser = await prisma.vendor_users.findFirst({
        where: { user_id: authResult.user.id },
        include: { marketplace_vendors: true }
      })
      
      if (!vendorUser) {
        return createErrorResponse('No vendor account found', 404)
      }
      
      // For MVP, return mock stats
      const mockStats = {
        vendor: {
          id: vendorUser.marketplace_vendors.id,
          business_name: vendorUser.marketplace_vendors.business_name,
          category: vendorUser.marketplace_vendors.category,
          average_rating: vendorUser.marketplace_vendors.average_rating || 0,
          total_reviews: vendorUser.marketplace_vendors.total_reviews || 0,
          total_bookings: vendorUser.marketplace_vendors.total_bookings || 0,
          verified: vendorUser.marketplace_vendors.verified,
          featured: vendorUser.marketplace_vendors.featured,
          latitude: vendorUser.marketplace_vendors.latitude,
          longitude: vendorUser.marketplace_vendors.longitude
        },
        stats: {
          totalInquiries: 0,
          unreadInquiries: 0,
          responseRate: 100,
          averageResponseTime: 0,
          monthlyViews: 0,
          conversionRate: 0
        },
        recentInquiries: [],
        upcomingBookings: []
      }
      
      // Get real inquiry stats
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const inquiryStats = await prisma.vendor_inquiries.aggregate({
        where: {
          vendor_id: vendorUser.marketplace_vendors.id,
          created_at: { gte: thirtyDaysAgo }
        },
        _count: { _all: true }
      })
      
      const unreadCount = await prisma.vendor_inquiries.count({
        where: {
          vendor_id: vendorUser.marketplace_vendors.id,
          responded: false
        }
      })
      
      const respondedStats = await prisma.vendor_inquiries.aggregate({
        where: {
          vendor_id: vendorUser.marketplace_vendors.id,
          responded: true,
          response_time_hours: { not: null }
        },
        _avg: { response_time_hours: true },
        _count: { _all: true }
      })
      
      // Get recent inquiries
      const recentInquiries = await prisma.vendor_inquiries.findMany({
        where: { vendor_id: vendorUser.marketplace_vendors.id },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          event_date: true,
          message: true,
          created_at: true,
          responded: true
        }
      })
      
      // Update mock stats with real data
      mockStats.stats.totalInquiries = inquiryStats._count._all
      mockStats.stats.unreadInquiries = unreadCount
      mockStats.stats.responseRate = inquiryStats._count._all > 0 
        ? Math.round((respondedStats._count._all / inquiryStats._count._all) * 100)
        : 100
      mockStats.stats.averageResponseTime = respondedStats._avg.response_time_hours || 0
      mockStats.recentInquiries = recentInquiries as any
      
      return createSuccessResponse(mockStats)
    }
    
    // If vendorId is provided, verify access
    const vendorUser = await prisma.vendor_users.findFirst({
      where: {
        vendor_id: vendorId,
        user_id: authResult.user.id
      }
    })
    
    if (!vendorUser) {
      return createErrorResponse('Access denied', 403)
    }
    
    // Return stats for specific vendor
    // ... similar logic as above but for specific vendorId
    
    return createSuccessResponse({ message: 'Stats endpoint' })
  } catch (error) {
    console.error('Vendor dashboard stats error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}