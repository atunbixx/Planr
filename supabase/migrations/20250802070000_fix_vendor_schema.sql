-- =============================================
-- FIX VENDOR SCHEMA
-- =============================================
-- Add missing fields that the vendor hook expects

-- Add missing columns to couple_vendors table
ALTER TABLE couple_vendors
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'US',
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contract_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS insurance_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS availability_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS service_radius_miles INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS booking_lead_time_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS requires_deposit BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT 24;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_couple_vendors_rating ON couple_vendors(rating);
CREATE INDEX IF NOT EXISTS idx_couple_vendors_deposit_paid ON couple_vendors(deposit_paid);
CREATE INDEX IF NOT EXISTS idx_couple_vendors_contract_signed ON couple_vendors(contract_signed);

-- Create a function to automatically update average_rating when rating changes
CREATE OR REPLACE FUNCTION update_vendor_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple logic: if rating is set, use it as average_rating
    -- In a full implementation, this would calculate from reviews
    IF NEW.rating IS NOT NULL THEN
        NEW.average_rating := NEW.rating;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for average rating update
DROP TRIGGER IF EXISTS update_vendor_average_rating_trigger ON couple_vendors;
CREATE TRIGGER update_vendor_average_rating_trigger
    BEFORE INSERT OR UPDATE OF rating ON couple_vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_average_rating();

-- Add some helpful views
CREATE OR REPLACE VIEW vendor_summary AS
SELECT 
    cv.*,
    c.partner1_name,
    c.partner2_name,
    CASE 
        WHEN cv.status IN ('booked', 'confirmed') THEN 'active'
        WHEN cv.status = 'cancelled' THEN 'inactive'
        ELSE 'prospective'
    END as vendor_state,
    COALESCE(cv.actual_cost, cv.estimated_cost) as current_cost
FROM couple_vendors cv
JOIN couples c ON cv.couple_id = c.id;

-- Grant permissions on the view
GRANT SELECT ON vendor_summary TO authenticated;

-- Insert sample vendor categories for new couples
CREATE OR REPLACE FUNCTION insert_default_vendor_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- This could be used to insert default vendor suggestions
    -- when a new couple is created
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the RLS policies to be more explicit
DROP POLICY IF EXISTS "Users can view their couple's vendors" ON couple_vendors;
CREATE POLICY "Users can view their couple's vendors" ON couple_vendors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM couples 
            WHERE couples.id = couple_vendors.couple_id
            AND (couples.partner1_user_id = auth.uid() 
                OR couples.partner2_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert vendors for their couple" ON couple_vendors;
CREATE POLICY "Users can insert vendors for their couple" ON couple_vendors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM couples 
            WHERE couples.id = couple_vendors.couple_id
            AND (couples.partner1_user_id = auth.uid() 
                OR couples.partner2_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their couple's vendors" ON couple_vendors;
CREATE POLICY "Users can update their couple's vendors" ON couple_vendors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM couples 
            WHERE couples.id = couple_vendors.couple_id
            AND (couples.partner1_user_id = auth.uid() 
                OR couples.partner2_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can delete their couple's vendors" ON couple_vendors;
CREATE POLICY "Users can delete their couple's vendors" ON couple_vendors
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM couples 
            WHERE couples.id = couple_vendors.couple_id
            AND (couples.partner1_user_id = auth.uid() 
                OR couples.partner2_user_id = auth.uid())
        )
    );

-- Add comment to table for documentation
COMMENT ON TABLE couple_vendors IS 'Stores vendor information for wedding couples including contact details, status, and financial information';
COMMENT ON COLUMN couple_vendors.status IS 'Current status in the vendor booking workflow';
COMMENT ON COLUMN couple_vendors.category IS 'Type of service the vendor provides';
COMMENT ON COLUMN couple_vendors.average_rating IS 'Calculated average rating from all reviews';