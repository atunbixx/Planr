-- Photo Gallery Database Schema for Wedding Planner
-- Run this in Supabase SQL Editor

-- Create photo albums table
CREATE TABLE IF NOT EXISTS photo_albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cover_photo_id UUID, -- Will reference photos table
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    album_id UUID REFERENCES photo_albums(id) ON DELETE SET NULL,
    
    -- Photo metadata
    title TEXT,
    description TEXT,
    caption TEXT,
    alt_text TEXT,
    
    -- Cloudinary data
    cloudinary_public_id TEXT NOT NULL,
    cloudinary_url TEXT NOT NULL,
    cloudinary_secure_url TEXT NOT NULL,
    
    -- Image properties
    original_filename TEXT,
    file_size INTEGER, -- in bytes
    width INTEGER,
    height INTEGER,
    format TEXT, -- jpg, png, etc.
    
    -- Wedding-specific metadata
    photo_date DATE,
    location TEXT,
    photographer TEXT,
    event_type TEXT, -- engagement, ceremony, reception, etc.
    
    -- Organization
    tags TEXT[], -- array of tags
    is_favorite BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Sharing and permissions
    shared_with TEXT[], -- array of email addresses
    download_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for cover photo
ALTER TABLE photo_albums 
ADD CONSTRAINT fk_album_cover_photo 
FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL;

-- Create photo sharing table for guest access
CREATE TABLE IF NOT EXISTS photo_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    album_id UUID REFERENCES photo_albums(id) ON DELETE CASCADE,
    
    -- Sharing details
    share_token TEXT UNIQUE NOT NULL,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_email TEXT,
    shared_with_name TEXT,
    
    -- Permissions
    can_download BOOLEAN DEFAULT true,
    can_comment BOOLEAN DEFAULT true,
    
    -- Access control
    expires_at TIMESTAMP WITH TIME ZONE,
    password_hash TEXT, -- for password-protected shares
    max_downloads INTEGER,
    download_count INTEGER DEFAULT 0,
    
    -- Tracking
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photo comments table
CREATE TABLE IF NOT EXISTS photo_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    
    -- Comment details
    author_name TEXT NOT NULL,
    author_email TEXT,
    comment_text TEXT NOT NULL,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    is_flagged BOOLEAN DEFAULT false,
    
    -- Guest vs registered user
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photo reactions table (likes, hearts, etc.)
CREATE TABLE IF NOT EXISTS photo_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    
    -- Reaction details
    reaction_type TEXT NOT NULL DEFAULT 'like', -- like, love, heart, wow, etc.
    author_name TEXT,
    author_email TEXT,
    
    -- Guest vs registered user
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Prevent duplicate reactions
    UNIQUE(photo_id, user_id, author_email),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_couple_id ON photos(couple_id);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_cloudinary_public_id ON photos(cloudinary_public_id);
CREATE INDEX IF NOT EXISTS idx_photos_photo_date ON photos(photo_date);
CREATE INDEX IF NOT EXISTS idx_photos_event_type ON photos(event_type);
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos(is_favorite);
CREATE INDEX IF NOT EXISTS idx_photos_tags ON photos USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_photo_albums_couple_id ON photo_albums(couple_id);
CREATE INDEX IF NOT EXISTS idx_photo_albums_is_public ON photo_albums(is_public);
CREATE INDEX IF NOT EXISTS idx_photo_albums_is_featured ON photo_albums(is_featured);

CREATE INDEX IF NOT EXISTS idx_photo_shares_share_token ON photo_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_photo_shares_photo_id ON photo_shares(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_shares_album_id ON photo_shares(album_id);

CREATE INDEX IF NOT EXISTS idx_photo_comments_photo_id ON photo_comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_reactions_photo_id ON photo_reactions(photo_id);

-- Create RLS policies
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for photo_albums
CREATE POLICY "Users can view their own albums" ON photo_albums
    FOR SELECT USING (
        couple_id IN (
            SELECT c.id FROM couples c 
            JOIN users u ON c.partner1_id = u.id OR c.partner2_id = u.id 
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can manage their own albums" ON photo_albums
    FOR ALL USING (
        couple_id IN (
            SELECT c.id FROM couples c 
            JOIN users u ON c.partner1_id = u.id OR c.partner2_id = u.id 
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS policies for photos
CREATE POLICY "Users can view their own photos" ON photos
    FOR SELECT USING (
        couple_id IN (
            SELECT c.id FROM couples c 
            JOIN users u ON c.partner1_id = u.id OR c.partner2_id = u.id 
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can manage their own photos" ON photos
    FOR ALL USING (
        couple_id IN (
            SELECT c.id FROM couples c 
            JOIN users u ON c.partner1_id = u.id OR c.partner2_id = u.id 
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS policies for photo_shares
CREATE POLICY "Users can manage their own photo shares" ON photo_shares
    FOR ALL USING (
        shared_by IN (
            SELECT u.id FROM users u 
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS policies for comments and reactions (allow public access for shared photos)
CREATE POLICY "Anyone can view approved comments on public photos" ON photo_comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can manage comments on their photos" ON photo_comments
    FOR ALL USING (
        photo_id IN (
            SELECT p.id FROM photos p
            JOIN couples c ON p.couple_id = c.id
            JOIN users u ON c.partner1_id = u.id OR c.partner2_id = u.id
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Anyone can view reactions on public photos" ON photo_reactions
    FOR SELECT USING (true);

CREATE POLICY "Users can manage reactions on their photos" ON photo_reactions
    FOR ALL USING (
        photo_id IN (
            SELECT p.id FROM photos p
            JOIN couples c ON p.couple_id = c.id
            JOIN users u ON c.partner1_id = u.id OR c.partner2_id = u.id
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_photo_albums_updated_at BEFORE UPDATE ON photo_albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate share tokens function
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Insert default photo albums for existing couples
INSERT INTO photo_albums (couple_id, name, description, is_featured)
SELECT 
    c.id,
    'Engagement Photos',
    'Beautiful moments from our engagement',
    true
FROM couples c
WHERE NOT EXISTS (
    SELECT 1 FROM photo_albums pa 
    WHERE pa.couple_id = c.id AND pa.name = 'Engagement Photos'
);

INSERT INTO photo_albums (couple_id, name, description, is_featured)
SELECT 
    c.id,
    'Wedding Day',
    'Our special wedding day memories',
    true
FROM couples c
WHERE NOT EXISTS (
    SELECT 1 FROM photo_albums pa 
    WHERE pa.couple_id = c.id AND pa.name = 'Wedding Day'
);

INSERT INTO photo_albums (couple_id, name, description)
SELECT 
    c.id,
    'Reception',
    'Celebrating with family and friends',
    false
FROM couples c
WHERE NOT EXISTS (
    SELECT 1 FROM photo_albums pa 
    WHERE pa.couple_id = c.id AND pa.name = 'Reception'
);

-- Create database functions for photo statistics
CREATE OR REPLACE FUNCTION get_photo_stats(p_couple_id UUID)
RETURNS TABLE (
    total_photos BIGINT,
    total_albums BIGINT,
    favorite_photos BIGINT,
    shared_photos BIGINT,
    total_comments BIGINT,
    total_reactions BIGINT,
    storage_used BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM photos WHERE couple_id = p_couple_id),
        (SELECT COUNT(*) FROM photo_albums WHERE couple_id = p_couple_id),
        (SELECT COUNT(*) FROM photos WHERE couple_id = p_couple_id AND is_favorite = true),
        (SELECT COUNT(DISTINCT p.id) FROM photos p 
         JOIN photo_shares ps ON p.id = ps.photo_id 
         WHERE p.couple_id = p_couple_id),
        (SELECT COUNT(*) FROM photo_comments pc 
         JOIN photos p ON pc.photo_id = p.id 
         WHERE p.couple_id = p_couple_id),
        (SELECT COUNT(*) FROM photo_reactions pr 
         JOIN photos p ON pr.photo_id = p.id 
         WHERE p.couple_id = p_couple_id),
        (SELECT COALESCE(SUM(file_size), 0) FROM photos WHERE couple_id = p_couple_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE photo_albums IS 'Photo albums for organizing wedding photos';
COMMENT ON TABLE photos IS 'Individual photos with metadata and Cloudinary integration';
COMMENT ON TABLE photo_shares IS 'Shared photo access tokens for guests';
COMMENT ON TABLE photo_comments IS 'Comments on photos from guests and users';
COMMENT ON TABLE photo_reactions IS 'Reactions (likes, hearts) on photos';