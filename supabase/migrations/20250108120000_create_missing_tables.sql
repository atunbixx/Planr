-- =============================================
-- CREATE MISSING TABLES MIGRATION
-- Fixes all missing database tables and elements
-- =============================================

-- =============================================
-- 1. CREATE PHOTOS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid REFERENCES wedding_couples(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  original_filename text,
  file_size integer,
  mime_type text,
  storage_path text NOT NULL,
  url text,
  caption text,
  tags text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- =============================================
-- 2. CREATE VENDORS TABLE (Master Directory)
-- =============================================

CREATE TABLE IF NOT EXISTS vendors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  category text NOT NULL,
  description text,
  website text,
  address text,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'US',
  service_radius_miles integer DEFAULT 50,
  average_rating decimal(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  verified boolean DEFAULT false,
  logo_url text,
  portfolio_images text[],
  specialties text[],
  price_range text,
  booking_lead_time_days integer DEFAULT 30,
  cancellation_policy text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- =============================================
-- 3. CREATE BUDGET_ITEMS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS budget_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid REFERENCES wedding_couples(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES budget_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  estimated_cost decimal(10,2),
  actual_cost decimal(10,2),
  paid_amount decimal(10,2) DEFAULT 0,
  vendor_id uuid REFERENCES couple_vendors(id) ON DELETE SET NULL,
  due_date date,
  paid_date date,
  payment_method text,
  receipt_url text,
  is_deposit boolean DEFAULT false,
  deposit_percentage integer,
  notes text,
  priority integer DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- =============================================
-- 4. CREATE PERFORMANCE INDEXES
-- =============================================

-- Photos indexes
CREATE INDEX IF NOT EXISTS idx_photos_couple_id ON photos(couple_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_tags ON photos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos(is_favorite);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);

-- Vendors indexes
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city);
CREATE INDEX IF NOT EXISTS idx_vendors_state ON vendors(state);
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors(verified);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_business_name ON vendors(business_name);

-- Budget items indexes
CREATE INDEX IF NOT EXISTS idx_budget_items_couple_id ON budget_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category_id ON budget_items(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_vendor_id ON budget_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_due_date ON budget_items(due_date);
CREATE INDEX IF NOT EXISTS idx_budget_items_status ON budget_items(status);
CREATE INDEX IF NOT EXISTS idx_budget_items_priority ON budget_items(priority);

-- =============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. CREATE RLS POLICIES
-- =============================================

-- Photos policies
CREATE POLICY "Users can view their own photos"
  ON photos FOR SELECT
  USING (couple_id IN (
    SELECT id FROM wedding_couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

CREATE POLICY "Users can upload photos for their wedding"
  ON photos FOR INSERT
  WITH CHECK (couple_id IN (
    SELECT id FROM wedding_couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own photos"
  ON photos FOR UPDATE
  USING (couple_id IN (
    SELECT id FROM wedding_couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own photos"
  ON photos FOR DELETE
  USING (couple_id IN (
    SELECT id FROM wedding_couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

-- Vendors policies (public read, admin write)
CREATE POLICY "Anyone can view vendors"
  ON vendors FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage vendors"
  ON vendors FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Budget items policies
CREATE POLICY "Users can view their own budget items"
  ON budget_items FOR SELECT
  USING (couple_id IN (
    SELECT id FROM wedding_couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

CREATE POLICY "Users can create budget items for their wedding"
  ON budget_items FOR INSERT
  WITH CHECK (couple_id IN (
    SELECT id FROM wedding_couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own budget items"
  ON budget_items FOR UPDATE
  USING (couple_id IN (
    SELECT id FROM wedding_couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own budget items"
  ON budget_items FOR DELETE
  USING (couple_id IN (
    SELECT id FROM wedding_couples 
    WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  ));

-- =============================================
-- 7. CREATE UPDATED_AT TRIGGERS
-- =============================================

CREATE TRIGGER update_photos_updated_at 
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at 
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at 
  BEFORE UPDATE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON photos TO authenticated;
GRANT SELECT ON vendors TO public;
GRANT ALL ON vendors TO authenticated;
GRANT ALL ON budget_items TO authenticated;

-- =============================================
-- 9. INSERT SAMPLE VENDOR DATA
-- =============================================

INSERT INTO vendors (business_name, contact_name, contact_email, category, description, city, state, verified) VALUES
('Elegant Events Photography', 'Sarah Johnson', 'sarah@elegantevents.com', 'photography', 'Professional wedding photography with artistic flair', 'New York', 'NY', true),
('Blooming Flowers Co', 'Maria Garcia', 'maria@bloomingflowers.com', 'florist', 'Fresh, beautiful wedding florals and arrangements', 'Los Angeles', 'CA', true),
('Sweet Celebrations Catering', 'Chef Michael Brown', 'chef@sweetcelebrations.com', 'catering', 'Gourmet catering for unforgettable wedding celebrations', 'Chicago', 'IL', true),
('Harmony Wedding Music', 'David Wilson', 'david@harmonywedding.com', 'music_dj', 'Professional DJ services for your perfect wedding day', 'Austin', 'TX', true),
('Vintage Venue Rentals', 'Lisa Chen', 'lisa@vintagevenue.com', 'venue', 'Stunning vintage venues for intimate wedding ceremonies', 'Seattle', 'WA', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================