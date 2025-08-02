import { createClient } from '@supabase/supabase-js'

// This script sets up storage buckets for the wedding planner app
// Run this once to create the necessary storage buckets

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  try {
    // Create vendor-documents bucket
    const { data: vendorBucket, error: vendorError } = await supabase
      .storage
      .createBucket('vendor-documents', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      })

    if (vendorError && vendorError.message !== 'The resource already exists') {
      throw vendorError
    }

    console.log('✅ Vendor documents bucket created/verified')

    // Set up RLS policies for vendor-documents bucket
    // These would typically be done in the Supabase dashboard
    console.log(`
To complete setup, add these RLS policies in Supabase Dashboard:

1. For vendor-documents bucket:
   - SELECT: Authenticated users can view their own documents
   - INSERT: Authenticated users can upload documents
   - UPDATE: Authenticated users can update their own documents
   - DELETE: Authenticated users can delete their own documents
`)

  } catch (error) {
    console.error('Error setting up storage:', error)
  }
}

// Run the setup
setupStorage()