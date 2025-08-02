-- =============================================
-- SEED VENDOR DATA
-- =============================================
-- Sample vendors for testing and demo purposes

-- First, ensure we have at least one couple to work with
DO $$
DECLARE
    sample_couple_id UUID;
BEGIN
    -- Get the first couple or create a demo one
    SELECT id INTO sample_couple_id FROM couples LIMIT 1;
    
    IF sample_couple_id IS NULL THEN
        -- Create a demo couple if none exists
        INSERT INTO couples (
            id,
            partner1_user_id,
            partner2_user_id,
            partner1_name,
            partner2_name,
            partner1_email,
            partner2_email,
            wedding_date
        ) VALUES (
            gen_random_uuid(),
            auth.uid(), -- Current user
            NULL,
            'Demo Partner 1',
            'Demo Partner 2',
            'demo1@example.com',
            'demo2@example.com',
            CURRENT_DATE + INTERVAL '6 months'
        ) RETURNING id INTO sample_couple_id;
    END IF;
    
    -- Insert sample vendors
    INSERT INTO couple_vendors (couple_id, name, business_name, category, status, email, phone, website, contact_person, address, city, state, zip_code, estimated_cost, notes, rating, contract_signed, deposit_paid, deposit_amount, requires_deposit, deposit_percentage)
    VALUES 
    -- Venues
    (sample_couple_id, 'The Grand Ballroom', 'Grand Events LLC', 'venue', 'booked', 'info@grandballroom.com', '(555) 123-4567', 'https://grandballroom.com', 'Sarah Johnson', '123 Main St', 'New York', 'NY', '10001', 15000, 'Beautiful historic venue with excellent catering options', 5, true, true, 3750, true, 25),
    (sample_couple_id, 'Garden Paradise', 'Paradise Venues Inc', 'venue', 'contacted', 'contact@gardenparadise.com', '(555) 234-5678', 'https://gardenparadise.com', 'Mike Chen', '456 Oak Ave', 'Los Angeles', 'CA', '90001', 12000, 'Outdoor garden venue, weather backup available', 4, false, false, NULL, true, 30),
    
    -- Catering
    (sample_couple_id, 'Delicious Delights', 'DD Catering Services', 'catering', 'proposal_received', 'info@deliciousdelights.com', '(555) 345-6789', 'https://deliciousdelights.com', 'Chef Maria', '789 Food St', 'Chicago', 'IL', '60601', 8000, 'Farm-to-table catering, vegetarian options available', 5, false, false, NULL, true, 20),
    (sample_couple_id, 'Elite Cuisine', NULL, 'catering', 'researching', 'hello@elitecuisine.com', '(555) 456-7890', NULL, NULL, NULL, 'Chicago', 'IL', NULL, 10000, 'High-end catering service', NULL, false, false, NULL, true, 25),
    
    -- Photography
    (sample_couple_id, 'Moments Forever', 'Jennifer Smith Photography', 'photography', 'booked', 'jen@momentsforever.com', '(555) 567-8901', 'https://momentsforever.com', 'Jennifer Smith', NULL, 'San Francisco', 'CA', '94101', 4500, 'Award-winning photographer, includes engagement session', 5, true, true, 1125, true, 25),
    (sample_couple_id, 'Artistic Lens', NULL, 'photography', 'quoted', 'info@artisticlens.com', '(555) 678-9012', 'https://artisticlens.com', 'David Park', NULL, 'San Francisco', 'CA', NULL, 3500, 'Documentary style photography', 4, false, false, NULL, true, 20),
    
    -- Videography
    (sample_couple_id, 'Cinema Dreams', 'CD Video Productions', 'videography', 'meeting_scheduled', 'hello@cinemadreams.com', '(555) 789-0123', 'https://cinemadreams.com', 'Alex Rodriguez', NULL, 'Miami', 'FL', '33101', 3000, 'Cinematic wedding films, drone footage included', NULL, false, false, NULL, true, 30),
    
    -- Florist
    (sample_couple_id, 'Bloom & Blossom', NULL, 'florist', 'booked', 'orders@bloomblossom.com', '(555) 890-1234', 'https://bloomblossom.com', 'Rose Garden', '321 Flower Ln', 'Portland', 'OR', '97201', 2500, 'Sustainable, locally-sourced flowers', 5, true, false, NULL, false, 0),
    (sample_couple_id, 'Petals & Stems', 'PS Floral Design', 'florist', 'researching', 'info@petalsstems.com', '(555) 901-2345', NULL, NULL, NULL, 'Portland', 'OR', NULL, 2000, 'Modern floral arrangements', NULL, false, false, NULL, true, 25),
    
    -- Music/DJ
    (sample_couple_id, 'DJ Groove Master', 'GM Entertainment', 'music_dj', 'confirmed', 'book@djgroovemaster.com', '(555) 012-3456', 'https://djgroovemaster.com', 'Marcus Johnson', NULL, 'Austin', 'TX', '78701', 1500, 'Experienced DJ, includes lighting package', 5, true, true, 375, true, 25),
    
    -- Band
    (sample_couple_id, 'The Wedding Singers', 'Live Music Productions', 'band', 'contacted', 'booking@weddingsingers.com', '(555) 123-4567', 'https://weddingsingers.band', 'Tony Martinez', NULL, 'Nashville', 'TN', '37201', 3500, '6-piece band, plays all genres', 4, false, false, NULL, true, 30),
    
    -- Hair & Makeup
    (sample_couple_id, 'Glamour Studio', NULL, 'beauty', 'booked', 'appointments@glamourstudio.com', '(555) 234-5678', 'https://glamourstudio.com', 'Lisa Chang', '567 Beauty Blvd', 'Beverly Hills', 'CA', '90210', 1200, 'On-site hair and makeup for bridal party', 5, true, true, 300, true, 25),
    
    -- Wedding Cake
    (sample_couple_id, 'Sweet Celebrations', 'SC Bakery', 'cake', 'quoted', 'orders@sweetcelebrations.com', '(555) 345-6789', 'https://sweetcelebrations.com', 'Pierre Dubois', '890 Bakery St', 'Seattle', 'WA', '98101', 800, 'Custom designed cakes, tasting included', 4, false, false, NULL, true, 50),
    
    -- Transportation
    (sample_couple_id, 'Luxury Rides', 'LR Transportation Services', 'transportation', 'researching', 'reserve@luxuryrides.com', '(555) 456-7890', NULL, NULL, NULL, 'Las Vegas', 'NV', NULL, 1000, 'Vintage and modern vehicle options', NULL, false, false, NULL, true, 20),
    
    -- Wedding Planner
    (sample_couple_id, 'Dream Weddings Co', 'Emily Wilson Events', 'planner', 'cancelled', 'emily@dreamweddings.com', '(555) 567-8901', 'https://dreamweddings.com', 'Emily Wilson', NULL, 'Dallas', 'TX', '75201', 5000, 'Full-service planning - decided to plan ourselves', 5, false, false, NULL, true, 25);
    
    -- Log that seed data was inserted
    RAISE NOTICE 'Sample vendor data inserted successfully for couple ID: %', sample_couple_id;
END $$;