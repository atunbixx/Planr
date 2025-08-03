-- =============================================
-- CREATE MARKETPLACE VENDORS TABLE
-- =============================================
-- This creates a separate marketplace_vendors table for the vendor marketplace
-- while keeping couple_vendors for personal vendor management

-- Create marketplace vendors table with all fields needed for the marketplace
CREATE TABLE IF NOT EXISTS marketplace_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Information
    business_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100),
    description TEXT,
    category vendor_category NOT NULL,
    
    -- Contact Information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    service_radius_miles INTEGER DEFAULT 50,
    
    -- Marketplace Features
    verified BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    price_range VARCHAR(50), -- e.g., "$1,000 - $5,000"
    specialties VARCHAR[] DEFAULT '{}',
    portfolio_images VARCHAR[] DEFAULT '{}',
    portfolio_videos VARCHAR[] DEFAULT '{}',
    
    -- Performance Metrics
    total_bookings INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    response_rate INTEGER DEFAULT 100,
    response_time_hours INTEGER DEFAULT 24,
    
    -- Business Details
    years_in_business INTEGER,
    team_size INTEGER,
    insurance_verified BOOLEAN DEFAULT FALSE,
    license_number VARCHAR(100),
    license_verified BOOLEAN DEFAULT FALSE,
    
    -- Availability
    booking_lead_time_days INTEGER DEFAULT 30,
    requires_deposit BOOLEAN DEFAULT TRUE,
    deposit_percentage INTEGER DEFAULT 25,
    cancellation_policy TEXT,
    
    -- SEO and Discovery
    tags VARCHAR[] DEFAULT '{}',
    search_keywords TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_marketplace_vendors_category ON marketplace_vendors(category);
CREATE INDEX idx_marketplace_vendors_location ON marketplace_vendors(city, state);
CREATE INDEX idx_marketplace_vendors_rating ON marketplace_vendors(average_rating DESC);
CREATE INDEX idx_marketplace_vendors_verified ON marketplace_vendors(verified);
CREATE INDEX idx_marketplace_vendors_featured ON marketplace_vendors(featured);
CREATE INDEX idx_marketplace_vendors_search ON marketplace_vendors USING gin(to_tsvector('english', 
    COALESCE(business_name, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(search_keywords, '')
));

-- Create vendor packages table for pricing tiers
CREATE TABLE IF NOT EXISTS vendor_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES marketplace_vendors(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    price_unit VARCHAR(50) DEFAULT 'flat', -- flat, hourly, per_person
    
    -- What's included
    included_items TEXT[] DEFAULT '{}',
    excluded_items TEXT[] DEFAULT '{}',
    
    -- Availability
    min_guests INTEGER,
    max_guests INTEGER,
    duration_hours INTEGER,
    
    -- Display
    is_popular BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor reviews table
CREATE TABLE IF NOT EXISTS vendor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES marketplace_vendors(id) ON DELETE CASCADE,
    couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
    
    -- Review Details
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review TEXT NOT NULL,
    
    -- Review Metadata
    reviewer_name VARCHAR(100) NOT NULL,
    event_date DATE,
    verified_booking BOOLEAN DEFAULT FALSE,
    
    -- Response
    vendor_response TEXT,
    vendor_response_date TIMESTAMPTZ,
    
    -- Media
    photos VARCHAR[] DEFAULT '{}',
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Status
    is_published BOOLEAN DEFAULT TRUE,
    moderation_status VARCHAR(50) DEFAULT 'approved',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor availability calendar
CREATE TABLE IF NOT EXISTS vendor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES marketplace_vendors(id) ON DELETE CASCADE,
    
    -- Availability
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_booked BOOLEAN DEFAULT FALSE,
    hold_until TIMESTAMPTZ,
    
    -- Pricing adjustments
    price_adjustment_percentage INTEGER DEFAULT 0, -- e.g., 20 for 20% increase
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(vendor_id, date)
);

-- Create vendor inquiries table
CREATE TABLE IF NOT EXISTS vendor_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES marketplace_vendors(id) ON DELETE CASCADE,
    couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
    
    -- Contact Info
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Event Details
    event_date DATE,
    event_type VARCHAR(50),
    guest_count INTEGER,
    budget_range VARCHAR(50),
    
    -- Message
    message TEXT NOT NULL,
    specific_questions TEXT,
    
    -- Tracking
    source VARCHAR(50) DEFAULT 'marketplace',
    ip_address INET,
    user_agent TEXT,
    
    -- Response
    responded BOOLEAN DEFAULT FALSE,
    responded_at TIMESTAMPTZ,
    response_time_hours INTEGER,
    
    -- Outcome
    converted_to_booking BOOLEAN DEFAULT FALSE,
    booking_value DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for marketplace vendors
ALTER TABLE marketplace_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_inquiries ENABLE ROW LEVEL SECURITY;

-- Public read access for marketplace vendors
CREATE POLICY "Anyone can view verified marketplace vendors" ON marketplace_vendors
    FOR SELECT USING (verified = true);

-- Vendor owners can update their own listings
CREATE POLICY "Vendors can update their own listings" ON marketplace_vendors
    FOR UPDATE USING (auth.uid() IN (
        SELECT user_id FROM vendor_users WHERE vendor_id = marketplace_vendors.id
    ));

-- Public read access for packages of verified vendors
CREATE POLICY "Anyone can view packages of verified vendors" ON vendor_packages
    FOR SELECT USING (vendor_id IN (
        SELECT id FROM marketplace_vendors WHERE verified = true
    ));

-- Public read access for published reviews
CREATE POLICY "Anyone can view published reviews" ON vendor_reviews
    FOR SELECT USING (is_published = true);

-- Couples can create reviews for vendors they've booked
CREATE POLICY "Couples can create reviews" ON vendor_reviews
    FOR INSERT WITH CHECK (couple_id IN (
        SELECT id FROM couples WHERE 
        partner1_user_id = auth.uid() OR 
        partner2_user_id = auth.uid()
    ));

-- Public read access for vendor availability
CREATE POLICY "Anyone can view vendor availability" ON vendor_availability
    FOR SELECT USING (vendor_id IN (
        SELECT id FROM marketplace_vendors WHERE verified = true
    ));

-- Couples can create inquiries
CREATE POLICY "Anyone can create vendor inquiries" ON vendor_inquiries
    FOR INSERT WITH CHECK (true);

-- Couples can view their own inquiries
CREATE POLICY "Couples can view their own inquiries" ON vendor_inquiries
    FOR SELECT USING (couple_id IN (
        SELECT id FROM couples WHERE 
        partner1_user_id = auth.uid() OR 
        partner2_user_id = auth.uid()
    ));

-- Create vendor users table for vendor authentication
CREATE TABLE IF NOT EXISTS vendor_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES marketplace_vendors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'owner', -- owner, admin, staff
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(vendor_id, user_id)
);

-- Grant permissions
GRANT ALL ON marketplace_vendors TO authenticated;
GRANT ALL ON vendor_packages TO authenticated;
GRANT ALL ON vendor_reviews TO authenticated;
GRANT ALL ON vendor_availability TO authenticated;
GRANT ALL ON vendor_inquiries TO authenticated;
GRANT ALL ON vendor_users TO authenticated;

-- Create triggers for updated_at
CREATE TRIGGER update_marketplace_vendors_updated_at 
    BEFORE UPDATE ON marketplace_vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_packages_updated_at 
    BEFORE UPDATE ON vendor_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_reviews_updated_at 
    BEFORE UPDATE ON vendor_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_availability_updated_at 
    BEFORE UPDATE ON vendor_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_inquiries_updated_at 
    BEFORE UPDATE ON vendor_inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample marketplace vendors for testing
INSERT INTO marketplace_vendors (
    business_name, category, description, contact_email, contact_phone,
    city, state, verified, featured, price_range, average_rating, total_reviews,
    specialties, portfolio_images
) VALUES 
(
    'Elegant Events Photography', 'photography', 
    'Award-winning wedding photography with a photojournalistic approach. We capture your special day with artistic flair and emotional depth.',
    'info@eleganteventsphoto.com', '555-0101',
    'San Francisco', 'CA', true, true, '$3,000 - $8,000', 4.8, 124,
    ARRAY['Photojournalistic', 'Fine Art', 'Black & White'],
    ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc']
),
(
    'Bloom & Blossom Florals', 'florist',
    'Creating stunning floral arrangements that reflect your unique style. From intimate gatherings to grand celebrations.',
    'hello@bloomblossom.com', '555-0102',
    'San Francisco', 'CA', true, false, '$1,500 - $5,000', 4.9, 89,
    ARRAY['Romantic', 'Modern', 'Garden Style'],
    ARRAY['https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d', 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d']
),
(
    'Golden Gate Catering', 'catering',
    'Farm-to-table catering with a focus on local, seasonal ingredients. Creating memorable culinary experiences.',
    'events@goldengatecatering.com', '555-0103',
    'San Francisco', 'CA', true, true, '$75 - $200 per person', 4.7, 156,
    ARRAY['Farm-to-Table', 'International Cuisine', 'Dietary Accommodations'],
    ARRAY['https://images.unsplash.com/photo-1555244162-803834f70033', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445']
);

-- Add comment explaining the table structure
COMMENT ON TABLE marketplace_vendors IS 'Master vendor directory for the marketplace - verified vendors that can be discovered and booked by couples';
COMMENT ON TABLE couple_vendors IS 'Personal vendor list for each couple - vendors they are considering or have booked for their wedding';