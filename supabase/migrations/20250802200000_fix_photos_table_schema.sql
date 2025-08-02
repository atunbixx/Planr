-- =============================================
-- FIX PHOTOS TABLE SCHEMA
-- Updates the photos table to match component expectations
-- =============================================

-- 1. Add missing columns to photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS photo_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS photographer TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Migrate existing data
-- If storage_path exists, construct the public URL
UPDATE photos 
SET image_url = 
  CASE 
    WHEN storage_path IS NOT NULL AND storage_path != '' 
    THEN concat(
      (SELECT value FROM app_settings WHERE key = 'supabase_url' LIMIT 1),
      '/storage/v1/object/public/wedding-photos/',
      storage_path
    )
    WHEN url IS NOT NULL AND url != ''
    THEN url
    ELSE NULL
  END
WHERE image_url IS NULL;

-- Set photo_date from created_at if not set
UPDATE photos 
SET photo_date = created_at
WHERE photo_date IS NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_image_url ON photos(image_url);
CREATE INDEX IF NOT EXISTS idx_photos_photo_date ON photos(photo_date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_photographer ON photos(photographer);
CREATE INDEX IF NOT EXISTS idx_photos_location ON photos(location);

-- 4. Ensure RLS policies are correct for the couples view
DROP POLICY IF EXISTS "Users can view their own photos" ON photos;
DROP POLICY IF EXISTS "Users can upload photos for their wedding" ON photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;

-- Recreate policies using the couples view
CREATE POLICY "Users can view their own photos"
  ON photos FOR SELECT
  USING (couple_id IN (
    SELECT id FROM couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

CREATE POLICY "Users can upload photos for their wedding"
  ON photos FOR INSERT
  WITH CHECK (couple_id IN (
    SELECT id FROM couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own photos"
  ON photos FOR UPDATE
  USING (couple_id IN (
    SELECT id FROM couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own photos"
  ON photos FOR DELETE
  USING (couple_id IN (
    SELECT id FROM couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

-- 5. Add comment to document the expected schema
COMMENT ON TABLE photos IS 'Wedding photos storage. Key columns: image_url (public URL), caption, tags (array), photo_date, photographer, location';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================