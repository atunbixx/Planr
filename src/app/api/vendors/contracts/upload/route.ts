'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const vendorId = formData.get('vendorId') as string

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'File size exceeds 10MB limit'
      }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'File type not allowed. Please upload PDF, DOC, or DOCX files only.'
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const filename = `contracts/${user.id}/${vendorId || 'general'}/${timestamp}-${randomString}.${fileExtension}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('wedding-documents')
      .upload(filename, buffer, {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          vendorId: vendorId || '',
          uploadedBy: user.id,
          uploadedAt: new Date().toISOString()
        }
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file'
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('wedding-documents')
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
        path: data.path
      }
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    }, { status: 500 })
  }
}