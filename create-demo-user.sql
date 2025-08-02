-- =============================================
-- CREATE DEMO USER AND SAMPLE DATA
-- Run this in your Supabase SQL Editor after project setup
-- =============================================

-- This will create the demo user that matches your app credentials
-- Email: hello@atunbi.net
-- Password: Teniola=1

-- Note: You'll need to create the user via Supabase Dashboard Authentication > Users
-- Then run this script to create the couple profile

-- Sample couple data for the demo user
INSERT INTO couples (
    id,
    partner1_user_id, 
    partner1_name,
    partner2_name,
    wedding_date,
    venue_name,
    venue_location,
    guest_count_estimate,
    budget_total,
    currency,
    wedding_style,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM auth.users WHERE email = 'hello@atunbi.net' LIMIT 1),
    'Sarah Johnson',
    'Michael Chen',
    '2024-12-15',
    'The Grand Ballroom',
    'San Francisco, CA',
    120,
    75000.00,
    'USD',
    'modern',
    NOW(),
    NOW()
);

-- Add some sample vendors
INSERT INTO vendors (
    id,
    couple_id,
    name,
    category,
    contact_email,
    contact_phone,
    website,
    address,
    city,
    state,
    zip_code,
    notes,
    status,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM couples WHERE partner1_name = 'Sarah Johnson' LIMIT 1),
    'Bella Vista Photography',
    'photographer',
    'info@bellavistaphoto.com',
    '(555) 123-4567',
    'https://bellavistaphoto.com',
    '123 Mission St',
    'San Francisco',
    'CA',
    '94105',
    'Award-winning wedding photography studio',
    'confirmed',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM couples WHERE partner1_name = 'Sarah Johnson' LIMIT 1),
    'Golden Gate Catering',
    'caterer',
    'events@ggcatering.com',
    '(555) 987-6543',
    'https://ggcatering.com',
    '456 Valencia St',
    'San Francisco',
    'CA',
    '94110',
    'Farm-to-table wedding catering',
    'pending',
    NOW(),
    NOW()
);

-- Add sample budget items
INSERT INTO budget_items (
    id,
    couple_id,
    category,
    item_name,
    budgeted_amount,
    actual_amount,
    vendor_id,
    notes,
    is_paid,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM couples WHERE partner1_name = 'Sarah Johnson' LIMIT 1),
    'photography',
    'Wedding Photography Package',
    3500.00,
    3500.00,
    (SELECT id FROM vendors WHERE name = 'Bella Vista Photography' LIMIT 1),
    'Full day coverage + engagement session',
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM couples WHERE partner1_name = 'Sarah Johnson' LIMIT 1),
    'catering',
    'Reception Dinner',
    8500.00,
    NULL,
    (SELECT id FROM vendors WHERE name = 'Golden Gate Catering' LIMIT 1),
    'For 120 guests',
    false,
    NOW(),
    NOW()
);

-- Success message
SELECT 'Demo user data created successfully! You can now login with hello@atunbi.net' as message;