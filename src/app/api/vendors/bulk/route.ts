/**
 * Vendors API - Bulk operations
 * PATCH /api/vendors/bulk - Bulk update vendors
 */

import { NextRequest } from 'next/server'
import { VendorsApiHandler } from '@/features/vendors'

const handler = new VendorsApiHandler()

export async function PATCH(request: NextRequest) {
  return handler.bulkUpdateVendors(request)
}