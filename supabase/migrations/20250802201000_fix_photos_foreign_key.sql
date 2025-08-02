-- =============================================
-- FIX PHOTOS FOREIGN KEY REFERENCE
-- Updates photos table to reference couples view correctly
-- =============================================

-- 1. First, ensure the photos table has all required columns
ALTER TABLE photos ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS photo_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS photographer TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Drop the existing foreign key constraint
ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_couple_id_fkey;

-- 3. Add the foreign key back, but referencing wedding_couples directly
-- (since 'couples' is a view, we reference the underlying table)
ALTER TABLE photos 
  ADD CONSTRAINT photos_couple_id_fkey 
  FOREIGN KEY (couple_id) 
  REFERENCES wedding_couples(id) 
  ON DELETE CASCADE;

-- 4. Migrate existing data if needed
UPDATE photos 
SET image_url = 
  CASE 
    WHEN storage_path IS NOT NULL AND storage_path != '' 
    THEN concat(
      'https://gpfxxbhowailwllpgphe.supabase.co/storage/v1/object/public/wedding-photos/',
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

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_image_url ON photos(image_url);
CREATE INDEX IF NOT EXISTS idx_photos_photo_date ON photos(photo_date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_photographer ON photos(photographer);
CREATE INDEX IF NOT EXISTS idx_photos_location ON photos(location);

-- 6. Ensure RLS is enabled
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 7. Drop and recreate RLS policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own photos" ON photos;
DROP POLICY IF EXISTS "Users can upload photos for their wedding" ON photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;

-- Create policies that work with the couples view
CREATE POLICY "Users can view their own photos"
  ON photos FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM wedding_couples 
      WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload photos for their wedding"
  ON photos FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM wedding_couples 
      WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own photos"
  ON photos FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM wedding_couples 
      WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own photos"
  ON photos FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM wedding_couples 
      WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    )
  );

-- 8. Grant permissions
GRANT ALL ON photos TO authenticated;
GRANT SELECT ON photos TO anon;

-- 9. Add helpful comment
COMMENT ON TABLE photos IS 'Wedding photos storage with proper foreign key to wedding_couples table. Uses image_url for public URLs.';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================