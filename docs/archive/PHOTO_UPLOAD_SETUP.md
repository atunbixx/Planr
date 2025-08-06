# Photo Upload System Setup Guide

## Overview
The wedding planner photo upload system allows couples to upload, organize, and manage their wedding photos with features like:
- Drag & drop multi-file upload
- Automatic image optimization
- Gallery view with lightbox
- Photo tagging and metadata
- Search and filtering

## Setup Instructions

### 1. Database Setup

Run these migrations in your Supabase SQL Editor in order:

```sql
-- 1. First, run the storage setup migration
-- File: supabase/migrations/20250801101000_create_photo_storage.sql

-- 2. Then, run the photos table schema fix
-- File: supabase/migrations/20250802200000_fix_photos_table_schema.sql

-- 3. Finally, run the foreign key fix
-- File: supabase/migrations/20250802201000_fix_photos_foreign_key.sql
```

### 2. Verify Storage Bucket

The migrations should create a `wedding-photos` storage bucket. Verify it exists:

1. Go to Supabase Dashboard > Storage
2. You should see a `wedding-photos` bucket
3. It should be set to "Public" access

If the bucket doesn't exist, create it manually:
- Name: `wedding-photos`
- Public: Yes
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/jpg`

### 3. Test the Setup

1. Run the test script:
```bash
node test-photo-upload.js
```

2. Or visit the test page in your browser:
```
http://localhost:3000/test-photo-upload
```

### 4. Using the Photo System

The photo system has two main components:

#### PhotoUpload Component
```tsx
import { PhotoUpload } from '@/components/photos/PhotoUpload'

<PhotoUpload 
  coupleId={coupleId} 
  onUploadComplete={(urls) => console.log('Uploaded:', urls)}
  maxFiles={10}
  maxSizeInMB={10}
/>
```

Features:
- Drag & drop interface
- Multi-file upload (up to 10 files)
- Progress indicators
- Error handling with retry
- Automatic image optimization for files >2MB
- File size limit (10MB default)

#### PhotoGallery Component
```tsx
import { PhotoGallery } from '@/components/photos/PhotoGallery'

<PhotoGallery coupleId={coupleId} />
```

Features:
- Grid and list view modes
- Search by caption, tags, photographer, location
- Filter by tags
- Lightbox for full-size viewing
- Edit photo metadata
- Delete photos
- Download photos

## Troubleshooting

### "Upload failed" errors

1. Check that the storage bucket exists and is public
2. Verify the user is authenticated
3. Check browser console for specific error messages

### "Database insert failed" errors

1. Run all migrations in order
2. Verify the photos table has all required columns:
   - `image_url` (text)
   - `photo_date` (timestamp)
   - `photographer` (text)
   - `location` (text)

### Photos not showing in gallery

1. Check that photos were saved to database
2. Verify the couple_id matches the logged-in user
3. Check RLS policies are properly set

### Performance issues

- Images >2MB are automatically optimized
- Gallery loads photos with pagination
- Consider implementing lazy loading for large galleries

## API Reference

### Photos Table Schema

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| couple_id | uuid | Foreign key to wedding_couples |
| image_url | text | Public URL of the photo |
| caption | text | Optional photo caption |
| tags | text[] | Array of tags |
| photo_date | timestamp | When the photo was taken |
| photographer | text | Photographer name |
| location | text | Photo location |
| created_at | timestamp | Upload timestamp |
| updated_at | timestamp | Last modified |

### Storage Structure

Photos are stored in the following structure:
```
wedding-photos/
  {couple_id}/
    {timestamp}-{random}.{ext}
```

This ensures photos are organized by couple and have unique names.