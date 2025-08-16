/**
 * Vendors API - Individual vendor management
 * GET /api/vendors/[id] - Get vendor by ID
 * PATCH /api/vendors/[id] - Update vendor
 * DELETE /api/vendors/[id] - Delete vendor
 */

import { NextRequest } from 'next/server'
import { VendorsApiHandler } from '@/features/vendors'

const handler = new VendorsApiHandler()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.getVendorById(request, resolvedParams)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.updateVendor(request, resolvedParams)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.deleteVendor(request, resolvedParams)
}