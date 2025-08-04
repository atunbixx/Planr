-- Photo table migration to add missing columns
-- Run this in Supabase SQL Editor to update existing photos table

-- First, create photo_albums table if it doesn't exist
CREATE TABLE IF NOT EXISTS photo_albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cover_photo_id UUID, -- Will reference photos table
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing photos table
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES photo_albums(id) ON DELETE SET NULL;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS alt_text TEXT;

-- Cloudinary columns (rename existing image_url to cloudinary_url for consistency)
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS cloudinary_url TEXT;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS cloudinary_secure_url TEXT;

-- Copy existing image_url to cloudinary_secure_url
UPDATE photos 
SET cloudinary_secure_url = image_url 
WHERE cloudinary_secure_url IS NULL AND image_url IS NOT NULL;

-- Image properties
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS original_filename TEXT;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS file_size INTEGER;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS width INTEGER;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS height INTEGER;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS format TEXT;

-- Wedding-specific metadata
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS event_type TEXT;

-- Organization columns
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS uploaded_by UUID;

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make couple_id NOT NULL (it should always have a value)
ALTER TABLE photos 
ALTER COLUMN couple_id SET NOT NULL;

-- Create other required tables for photo gallery

-- Photo shares table
CREATE TABLE IF NOT EXISTS photo_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    album_id UUID REFERENCES photo_albums(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL,
    share_token TEXT NOT NULL UNIQUE,
    share_type TEXT NOT NULL CHECK (share_type IN ('photo', 'album')),
    is_public BOOLEAN DEFAULT false,
    password_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    download_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo comments table
CREATE TABLE IF NOT EXISTS photo_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    commenter_name TEXT NOT NULL,
    commenter_email TEXT,
    comment_text TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo reactions table
CREATE TABLE IF NOT EXISTS photo_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    reactor_name TEXT,
    reactor_email TEXT,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(photo_id, reactor_email, reaction_type)
);

-- Add foreign key constraint for cover_photo_id after photos table is updated
ALTER TABLE photo_albums 
ADD CONSTRAINT fk_cover_photo 
FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_couple_id ON photos(couple_id);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos(is_favorite);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_tags ON photos USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_photo_albums_couple_id ON photo_albums(couple_id);
CREATE INDEX IF NOT EXISTS idx_photo_albums_is_public ON photo_albums(is_public);

CREATE INDEX IF NOT EXISTS idx_photo_shares_photo_id ON photo_shares(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_shares_album_id ON photo_shares(album_id);
CREATE INDEX IF NOT EXISTS idx_photo_shares_share_token ON photo_shares(share_token);

CREATE INDEX IF NOT EXISTS idx_photo_comments_photo_id ON photo_comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_reactions_photo_id ON photo_reactions(photo_id);

-- Enable Row Level Security (RLS)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their couple's photos" ON photos;
DROP POLICY IF EXISTS "Users can manage their couple's albums" ON photo_albums;
DROP POLICY IF EXISTS "Users can manage their couple's photo shares" ON photo_shares;
DROP POLICY IF EXISTS "Public can view shared photos" ON photos;
DROP POLICY IF EXISTS "Public can comment on shared photos" ON photo_comments;
DROP POLICY IF EXISTS "Public can react to shared photos" ON photo_reactions;

-- RLS Policies for photos
CREATE POLICY "Users can manage their couple's photos" ON photos
    FOR ALL USING (
        couple_id IN (
            SELECT c.id FROM couples c
            JOIN users u ON u.id = c.partner1_user_id OR u.id = c.partner2_user_id
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS Policies for photo_albums
CREATE POLICY "Users can manage their couple's albums" ON photo_albums
    FOR ALL USING (
        couple_id IN (
            SELECT c.id FROM couples c
            JOIN users u ON u.id = c.partner1_user_id OR u.id = c.partner2_user_id
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS Policies for photo_shares
CREATE POLICY "Users can manage their couple's photo shares" ON photo_shares
    FOR ALL USING (
        photo_id IN (
            SELECT p.id FROM photos p
            JOIN couples c ON p.couple_id = c.id
            JOIN users u ON u.id = c.partner1_user_id OR u.id = c.partner2_user_id
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
        OR
        album_id IN (
            SELECT pa.id FROM photo_albums pa
            JOIN couples c ON pa.couple_id = c.id
            JOIN users u ON u.id = c.partner1_user_id OR u.id = c.partner2_user_id
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Public access policies for shared content
CREATE POLICY "Public can view shared photos" ON photos
    FOR SELECT USING (
        id IN (
            SELECT ps.photo_id FROM photo_shares ps 
            WHERE ps.is_public = true
        )
        OR
        album_id IN (
            SELECT ps.album_id FROM photo_shares ps 
            WHERE ps.is_public = true AND ps.share_type = 'album'
        )
    );

CREATE POLICY "Public can comment on shared photos" ON photo_comments
    FOR INSERT WITH CHECK (
        photo_id IN (
            SELECT ps.photo_id FROM photo_shares ps 
            WHERE ps.is_public = true
        )
    );

CREATE POLICY "Public can react to shared photos" ON photo_reactions
    FOR INSERT WITH CHECK (
        photo_id IN (
            SELECT ps.photo_id FROM photo_shares ps 
            WHERE ps.is_public = true
        )
    );

-- Create function to get photo statistics
CREATE OR REPLACE FUNCTION get_photo_stats(p_couple_id UUID)
RETURNS TABLE (
    total_photos BIGINT,
    total_albums BIGINT,
    favorite_photos BIGINT,
    shared_photos BIGINT,
    storage_used BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM photos WHERE couple_id = p_couple_id) as total_photos,
        (SELECT COUNT(*) FROM photo_albums WHERE couple_id = p_couple_id) as total_albums,
        (SELECT COUNT(*) FROM photos WHERE couple_id = p_couple_id AND is_favorite = true) as favorite_photos,
        (SELECT COUNT(DISTINCT ps.photo_id) FROM photo_shares ps 
         JOIN photos p ON ps.photo_id = p.id 
         WHERE p.couple_id = p_couple_id) as shared_photos,
        (SELECT COALESCE(SUM(file_size), 0) FROM photos WHERE couple_id = p_couple_id) as storage_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at
    BEFORE UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_photo_albums_updated_at ON photo_albums;
CREATE TRIGGER update_photo_albums_updated_at
    BEFORE UPDATE ON photo_albums
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON photos TO authenticated;
GRANT ALL ON photo_albums TO authenticated;
GRANT ALL ON photo_shares TO authenticated;
GRANT ALL ON photo_comments TO authenticated;
GRANT ALL ON photo_reactions TO authenticated;

GRANT EXECUTE ON FUNCTION get_photo_stats TO authenticated;

-- Success message
SELECT 'Photo gallery migration completed successfully! All missing columns and tables have been added.' as status;