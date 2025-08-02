-- =============================================
-- COMPREHENSIVE WEDDING PLANNER SEED DATA
-- Schema-first development with realistic wedding data
-- =============================================

-- Note: This assumes we have test users in auth.users table
-- For local development, you can create test users via Supabase Auth

-- =============================================
-- SAMPLE COUPLES
-- =============================================

-- Create sample couples (assuming test users exist)
INSERT INTO couples (
    id,
    partner1_user_id, 
    partner2_user_id,
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
) VALUES 
(
    'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    '11111111-2222-3333-4444-555555555555', -- Replace with actual user IDs in development
    '66666666-7777-8888-9999-000000000000',
    'Sarah Johnson',
    'Michael Chen',
    '2024-09-15',
    'The Grand Ballroom',
    'San Francisco, CA',
    120,
    75000.00,
    'USD',
    'modern',
    NOW() - INTERVAL '3 months',
    NOW()
),
(
    'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
    '22222222-3333-4444-5555-666666666666',
    '77777777-8888-9999-0000-111111111111',
    'Emily Rodriguez',
    'David Thompson',
    '2024-11-02',
    'Rustic Farm Estate',
    'Napa Valley, CA',
    85,
    45000.00,
    'USD',
    'rustic',
    NOW() - INTERVAL '2 months',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- WEDDING VENDORS
-- =============================================

-- Vendors for Sarah & Michael's wedding
INSERT INTO couple_vendors (
    couple_id,
    name,
    business_name,
    category,
    status,
    email,
    phone,
    website,
    contact_person,
    address,
    city,
    state,
    zip_code,
    estimated_cost,
    actual_cost,
    rating,
    notes,
    referral_source,
    service_radius_miles,
    booking_lead_time_days,
    requires_deposit,
    deposit_percentage,
    total_bookings,
    total_reviews,
    average_rating,
    response_rate,
    response_time_hours
) VALUES 
-- Venue
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'The Grand Ballroom', 'Grand Events SF', 'venue', 'booked', 'events@grandballroomsf.com', '(415) 555-0123', 'https://grandballroomsf.com', 'Jennifer Martinez', '123 Elegant Ave', 'San Francisco', 'CA', '94102', 15000.00, 15000.00, 5, 'Absolutely stunning venue with city views. Perfect for our modern theme.', 'Wedding planner recommendation', 25, 90, true, 50, 156, 89, 4.8, 95, 4),

-- Photography
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Artistic Moments Photography', 'Artistic Moments Studio', 'photography', 'booked', 'hello@artisticmoments.com', '(415) 555-0234', 'https://artisticmoments.com', 'Rebecca Singh', '456 Creative St', 'San Francisco', 'CA', '94103', 3500.00, 3500.00, 5, 'Amazing portfolio, great reviews. Specializes in modern wedding photography.', 'Instagram discovery', 50, 60, true, 30, 89, 156, 4.9, 98, 2),

-- Catering
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Gourmet Affairs Catering', 'Gourmet Affairs', 'catering', 'confirmed', 'catering@gourmetaffairs.com', '(415) 555-0345', 'https://gourmetaffairs.com', 'Chef Antoine Dubois', '789 Culinary Blvd', 'San Francisco', 'CA', '94104', 8500.00, 8500.00, 5, 'Exceptional food quality. Tasting was incredible. Accommodates dietary restrictions well.', 'Venue recommendation', 30, 45, true, 25, 234, 198, 4.7, 92, 6),

-- Florist
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Bloom & Beyond', 'Bloom & Beyond Floral Design', 'florist', 'quoted', 'design@bloombeyond.com', '(415) 555-0456', 'https://bloombeyond.com', 'Maria Gonzalez', '321 Flower Lane', 'San Francisco', 'CA', '94105', 2800.00, NULL, 4, 'Beautiful modern arrangements. Waiting for final quote adjustment.', 'Google search', 40, 30, true, 20, 67, 89, 4.6, 89, 12),

-- Music/DJ
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Elite Sound Productions', 'Elite Sound', 'music_dj', 'booked', 'bookings@elitesound.com', '(415) 555-0567', 'https://elitesound.com', 'DJ Marcus Williams', '654 Beat Street', 'San Francisco', 'CA', '94106', 1800.00, 1800.00, 5, 'Professional DJ with great music selection. Has all the equipment we need.', 'Friend recommendation', 60, 21, true, 15, 145, 178, 4.8, 96, 3),

-- Transportation
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Luxury Limousines SF', 'Luxury Limos', 'transportation', 'researching', 'info@luxurylimossf.com', '(415) 555-0678', 'https://luxurylimossf.com', 'Robert Kim', '987 Transport Way', 'San Francisco', 'CA', '94107', 750.00, NULL, NULL, 'Considering for bridal party transportation. Need to check availability.', 'Online search', 35, 14, true, 25, 89, 67, 4.5, 87, 8);

-- Vendors for Emily & David's wedding (Rustic style)
INSERT INTO couple_vendors (
    couple_id,
    name,
    business_name,
    category,
    status,
    email,
    phone,
    estimated_cost,
    notes,
    referral_source
) VALUES 
-- Venue
('a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', 'Rustic Farm Estate', 'Valley View Farms', 'venue', 'booked', 'events@valleyviewfarms.com', '(707) 555-0123', 12000.00, 'Perfect rustic setting with vineyard views. Includes tables and chairs.', 'Venue website'),

-- Photography
('a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', 'Natural Light Photography', 'Natural Light Studio', 'photography', 'meeting_scheduled', 'info@naturallight.com', '(707) 555-0234', 2800.00, 'Specializes in outdoor and rustic weddings. Meeting scheduled for next week.', 'Photography blog'),

-- Catering
('a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', 'Farm-to-Table Catering', 'Fresh Harvest Catering', 'catering', 'proposal_received', 'hello@freshharvestcatering.com', '(707) 555-0345', 6200.00, 'Local organic ingredients. Proposal looks great, reviewing details.', 'Venue recommendation');

-- =============================================
-- WEDDING GUESTS
-- =============================================

-- Guests for Sarah & Michael's wedding
INSERT INTO guests (
    couple_id,
    first_name,
    last_name,
    email,
    phone,
    category,
    side,
    rsvp_status,
    plus_one_invited,
    plus_one_name,
    plus_one_rsvp,
    dietary_restrictions,
    notes,
    address,
    city,
    state,
    zip_code,
    invitation_sent,
    invitation_sent_date,
    rsvp_date
) VALUES 
-- Sarah's family
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Robert', 'Johnson', 'robert.johnson@email.com', '(555) 123-4567', 'family', 'partner1', 'accepted', false, NULL, 'pending', NULL, 'Father of the bride', '123 Family St', 'Sacramento', 'CA', '95814', true, '2024-07-15', '2024-07-22'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Linda', 'Johnson', 'linda.johnson@email.com', '(555) 123-4568', 'family', 'partner1', 'accepted', false, NULL, 'pending', 'Vegetarian', 'Mother of the bride', '123 Family St', 'Sacramento', 'CA', '95814', true, '2024-07-15', '2024-07-22'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Jessica', 'Johnson', 'jessica.johnson@email.com', '(555) 123-4569', 'family', 'partner1', 'accepted', true, 'Mark Stevens', 'accepted', NULL, 'Sister and maid of honor', '456 Sibling Ave', 'Los Angeles', 'CA', '90210', true, '2024-07-15', '2024-07-23'),

-- Michael's family
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Wei', 'Chen', 'wei.chen@email.com', '(555) 234-5678', 'family', 'partner2', 'accepted', false, NULL, 'pending', NULL, 'Father of the groom', '789 Heritage Rd', 'San Jose', 'CA', '95123', true, '2024-07-15', '2024-07-20'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Mei', 'Chen', 'mei.chen@email.com', '(555) 234-5679', 'family', 'partner2', 'accepted', false, NULL, 'pending', 'Gluten-free', 'Mother of the groom', '789 Heritage Rd', 'San Jose', 'CA', '95123', true, '2024-07-15', '2024-07-20'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Kevin', 'Chen', 'kevin.chen@email.com', '(555) 234-5680', 'family', 'partner2', 'accepted', true, 'Amy Liu', 'accepted', NULL, 'Brother and best man', '321 Tech Blvd', 'Mountain View', 'CA', '94041', true, '2024-07-15', '2024-07-21'),

-- Friends
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Emma', 'Davis', 'emma.davis@email.com', '(555) 345-6789', 'friends', 'both', 'accepted', true, 'James Wilson', 'accepted', 'Vegan', 'College roommate', '654 University Way', 'Berkeley', 'CA', '94720', true, '2024-07-15', '2024-07-25'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Alex', 'Rodriguez', 'alex.rodriguez@email.com', '(555) 456-7890', 'friends', 'both', 'tentative', false, NULL, 'pending', NULL, 'Work colleague', '987 Corporate Dr', 'San Francisco', 'CA', '94105', true, '2024-07-15', NULL),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Sophia', 'Martinez', 'sophia.martinez@email.com', '(555) 567-8901', 'friends', 'partner1', 'declined', false, NULL, 'pending', NULL, 'High school friend - out of town', '147 Distance Ln', 'New York', 'NY', '10001', true, '2024-07-15', '2024-07-28'),

-- Work colleagues
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Ryan', 'Taylor', 'ryan.taylor@email.com', '(555) 678-9012', 'work', 'partner2', 'pending', true, NULL, 'pending', NULL, 'Team lead at tech company', '258 Office Park', 'San Francisco', 'CA', '94107', true, '2024-07-15', NULL),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Lisa', 'Brown', 'lisa.brown@email.com', '(555) 789-0123', 'work', 'partner1', 'accepted', false, NULL, 'pending', 'Pescatarian', 'Marketing director', '369 Business Ave', 'San Francisco', 'CA', '94108', true, '2024-07-15', '2024-07-26');

-- =============================================
-- BUDGET CATEGORIES
-- =============================================

-- Budget categories for Sarah & Michael's wedding
INSERT INTO budget_categories (
    couple_id,
    name,
    allocated_amount,
    spent_amount,
    priority,
    notes
) VALUES 
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Venue & Reception', 18000.00, 15000.00, 1, 'Highest priority - sets the tone for everything else'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Catering & Bar', 12000.00, 8500.00, 1, 'Important for guest experience'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Photography & Videography', 8000.00, 3500.00, 2, 'Memories that will last forever'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Flowers & Decorations', 4000.00, 0.00, 3, 'Beautiful but can be adjusted if needed'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Music & Entertainment', 3000.00, 1800.00, 3, 'DJ booked, may add live music'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Wedding Attire', 5000.00, 2800.00, 2, 'Dress purchased, still need accessories'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Transportation', 2000.00, 0.00, 4, 'Still researching options'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Invitations & Stationery', 1500.00, 850.00, 4, 'Save-the-dates sent, invitations in progress'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Wedding Rings', 4000.00, 3600.00, 1, 'Both rings purchased'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Hair & Makeup', 1800.00, 0.00, 3, 'Trial scheduled for next month'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Honeymoon', 8000.00, 6200.00, 2, 'Flights and hotel booked for Italy'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Miscellaneous', 2000.00, 450.00, 5, 'Emergency fund for unexpected expenses');

-- =============================================
-- BUDGET EXPENSES
-- =============================================

-- Sample expenses for Sarah & Michael's wedding
INSERT INTO budget_expenses (
    couple_id,
    category_id,
    vendor_id,
    description,
    amount,
    date_incurred,
    payment_method,
    notes
) VALUES 
-- Get category IDs first, then add expenses
((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Venue & Reception'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'The Grand Ballroom'), 'Venue booking deposit', 7500.00, '2024-06-15', 'Credit Card', 'First payment - 50% deposit'),
((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Venue & Reception'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'The Grand Ballroom'), 'Venue final payment', 7500.00, '2024-08-15', 'Bank Transfer', 'Final payment completed'),

((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Photography & Videography'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Artistic Moments Photography'), 'Photography package deposit', 1050.00, '2024-07-01', 'Credit Card', '30% deposit for full day coverage'),
((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Photography & Videography'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Artistic Moments Photography'), 'Photography final payment', 2450.00, '2024-09-01', 'Bank Transfer', 'Final payment before wedding'),

((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Catering & Bar'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Gourmet Affairs Catering'), 'Catering deposit', 2125.00, '2024-07-10', 'Credit Card', '25% deposit after tasting'),
((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Catering & Bar'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Gourmet Affairs Catering'), 'Catering balance payment', 6375.00, '2024-09-10', 'Bank Transfer', 'Final payment 5 days before wedding'),

((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Music & Entertainment'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Elite Sound Productions'), 'DJ services full payment', 1800.00, '2024-08-05', 'Credit Card', 'Paid in full after contract signing'),

((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Wedding Attire'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Wedding dress', 2200.00, '2024-06-20', 'Credit Card', 'Designer dress from bridal boutique'),
((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Wedding Attire'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Groom suit and accessories', 600.00, '2024-07-05', 'Debit Card', 'Suit rental and shoes'),

((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Wedding Rings'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Engagement and wedding rings', 3600.00, '2024-05-15', 'Financing', 'Custom rings from local jeweler'),

((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Honeymoon'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Flights to Italy', 2400.00, '2024-06-30', 'Credit Card', 'Round trip flights to Rome'),
((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Honeymoon'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Hotel accommodations', 3800.00, '2024-07-15', 'Credit Card', '10 nights in Tuscany and Rome'),

((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Invitations & Stationery'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Save-the-date cards', 280.00, '2024-06-01', 'Credit Card', 'Mailed to 120 guests'),
((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Invitations & Stationery'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Wedding invitations', 570.00, '2024-07-20', 'Credit Card', 'Formal invitations with RSVP cards'),

((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Miscellaneous'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Wedding planning app subscription', 150.00, '2024-06-01', 'Credit Card', 'Annual subscription for planning tools'),
((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Miscellaneous'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Marriage license', 100.00, '2024-08-01', 'Cash', 'San Francisco City Hall'),
((SELECT id FROM budget_categories WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Miscellaneous'), 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Emergency fund usage', 200.00, '2024-08-15', 'Debit Card', 'Unexpected alterations needed');

-- =============================================
-- WEDDING TASKS
-- =============================================

-- Wedding planning tasks for Sarah & Michael
INSERT INTO tasks (
    couple_id,
    vendor_id,
    title,
    description,
    category,
    priority,
    assigned_to,
    due_date,
    estimated_duration_hours,
    completed,
    completed_date,
    notes
) VALUES 
-- Completed tasks
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Book wedding venue', 'Research and book the perfect venue for our wedding ceremony and reception', 'venue', 'high', 'both', '2024-06-01', 20, true, '2024-06-15', 'Booked The Grand Ballroom - perfect for our modern theme'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Artistic Moments Photography'), 'Hire wedding photographer', 'Find and book photographer for wedding day coverage', 'photography', 'high', 'partner1', '2024-07-01', 15, true, '2024-07-01', 'Artistic Moments Photography booked - amazing portfolio'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Gourmet Affairs Catering'), 'Select wedding catering', 'Choose caterer and finalize menu for reception', 'catering', 'high', 'both', '2024-07-15', 10, true, '2024-07-10', 'Gourmet Affairs selected after amazing tasting session'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Send save-the-dates', 'Design and mail save-the-date cards to all guests', 'invitations', 'medium', 'partner1', '2024-06-15', 8, true, '2024-06-01', 'Sent to 120 guests - great response so far'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Purchase wedding rings', 'Shop for and buy wedding bands', 'attire', 'high', 'both', '2024-05-20', 6, true, '2024-05-15', 'Custom rings from local jeweler - love them!'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Order wedding dress', 'Find and order the perfect wedding dress', 'attire', 'high', 'partner1', '2024-06-30', 12, true, '2024-06-20', 'Found THE dress! Needs minor alterations'),

-- In progress tasks
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Bloom & Beyond'), 'Finalize floral arrangements', 'Meet with florist to choose flowers and finalize arrangements', 'flowers', 'medium', 'partner1', '2024-08-15', 4, false, NULL, 'Waiting for final quote - looking good so far'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Create wedding website', 'Build website with details, registry, and RSVP functionality', 'planning', 'medium', 'partner2', '2024-08-20', 6, false, NULL, 'Template selected, working on content'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Address wedding invitations', 'Address and mail formal wedding invitations', 'invitations', 'high', 'both', '2024-08-10', 8, false, NULL, 'Invitations ordered, need to address and mail'),

-- Upcoming tasks
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Book hair and makeup trial', 'Schedule trial run for wedding day hair and makeup', 'beauty', 'medium', 'partner1', '2024-08-25', 3, false, NULL, 'Need to research stylists in the area'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Luxury Limousines SF'), 'Book wedding transportation', 'Arrange transportation for bridal party and family', 'transportation', 'medium', 'partner2', '2024-08-30', 2, false, NULL, 'Checking availability and pricing'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Plan bachelor/bachelorette parties', 'Coordinate celebration parties with wedding party', 'planning', 'low', 'both', '2024-08-31', 4, false, NULL, 'Thinking weekend in Napa for bachelorette'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Order wedding cake', 'Taste and order wedding cake from bakery', 'catering', 'medium', 'both', '2024-09-01', 3, false, NULL, 'Catering includes dessert but want special cake too'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Create seating chart', 'Plan table assignments for reception guests', 'planning', 'medium', 'both', '2024-09-05', 5, false, NULL, 'Wait until all RSVPs are in'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Wedding dress final fitting', 'Final alterations and fitting for wedding dress', 'attire', 'high', 'partner1', '2024-09-08', 2, false, NULL, 'Scheduled after losing those last few pounds'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Wedding rehearsal', 'Practice ceremony with wedding party and officiant', 'planning', 'high', 'both', '2024-09-14', 3, false, NULL, 'Day before wedding - everyone must attend'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Pack for honeymoon', 'Pack luggage for Italy honeymoon trip', 'honeymoon', 'medium', 'both', '2024-09-16', 2, false, NULL, 'Check weather forecast before packing');

-- =============================================
-- WEDDING TIMELINE
-- =============================================

-- Wedding day timeline for Sarah & Michael
INSERT INTO timeline_items (
    couple_id,
    vendor_id,
    title,
    description,
    type,
    start_time,
    end_time,
    duration_minutes,
    buffer_time_minutes,
    location,
    notes
) VALUES 
-- Morning preparation
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Hair and makeup begins', 'Bridal party hair and makeup', 'hair_makeup', '08:00:00', '11:30:00', 210, 15, 'Bridal suite at hotel', 'Start with bridesmaids, bride last'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Groomsmen getting ready', 'Groomsmen preparations and photos', 'getting_ready', '09:00:00', '11:00:00', 120, 15, 'Groom suite at hotel', 'Light breakfast provided'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Artistic Moments Photography'), 'Bridal party photos', 'Getting ready photos and bridal party portraits', 'photo_session', '11:00:00', '12:30:00', 90, 15, 'Hotel and nearby park', 'Golden hour lighting preferred'),

-- Pre-ceremony
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Bloom & Beyond'), 'Venue decoration setup', 'Final floral arrangements and decoration placement', 'vendor_setup', '12:00:00', '14:30:00', 150, 30, 'The Grand Ballroom', 'Florist and venue coordinator'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Elite Sound Productions'), 'Sound system setup', 'Audio equipment setup and sound check', 'vendor_setup', '13:00:00', '14:00:00', 60, 15, 'The Grand Ballroom', 'Test microphones and music'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Luxury Limousines SF'), 'Bridal party transportation', 'Transportation from hotel to venue', 'transportation', '14:30:00', '15:00:00', 30, 10, 'Hotel to venue', 'White limousine for bridal party'),

-- Ceremony
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Guest arrival', 'Guests arrive and find seats', 'ceremony', '15:30:00', '16:00:00', 30, 15, 'The Grand Ballroom ceremony space', 'Ushers to help with seating'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Wedding ceremony', 'Official wedding ceremony', 'ceremony', '16:00:00', '16:30:00', 30, 10, 'The Grand Ballroom ceremony space', 'Exchange of vows and rings'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Artistic Moments Photography'), 'Post-ceremony photos', 'Family and couple photos immediately after ceremony', 'photo_session', '16:30:00', '17:30:00', 60, 15, 'Venue grounds and photo locations', 'Family combinations list prepared'),

-- Reception
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Cocktail hour', 'Guests mingle with appetizers and drinks', 'reception', '17:30:00', '18:30:00', 60, 15, 'The Grand Ballroom cocktail area', 'Bar opens, appetizers served'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Reception entrance', 'Bridal party and couple entrance to reception', 'reception', '18:30:00', '18:45:00', 15, 5, 'The Grand Ballroom reception hall', 'Special entrance music and introductions'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'First dance', 'Couple first dance', 'dance', '18:45:00', '18:50:00', 5, 5, 'Reception dance floor', 'Our song: "At Last" by Etta James'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Gourmet Affairs Catering'), 'Dinner service', 'Three-course plated dinner service', 'meal', '19:00:00', '20:30:00', 90, 15, 'Reception dining area', 'Vegetarian and gluten-free options available'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Speeches and toasts', 'Best man, maid of honor, and parent speeches', 'speech', '20:30:00', '21:00:00', 30, 10, 'Reception main area', 'Microphone provided, 5 minute limit each'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Cake cutting', 'Traditional cake cutting ceremony', 'special_moment', '21:00:00', '21:10:00', 10, 5, 'Reception cake table', 'Photos and cake serving'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Elite Sound Productions'), 'Dancing and celebration', 'Open dancing and celebration', 'dance', '21:15:00', '23:30:00', 135, 15, 'Reception dance floor', 'Mix of classics and contemporary music'),

-- End of night
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Last dance', 'Final dance of the evening', 'dance', '23:30:00', '23:35:00', 5, 5, 'Reception dance floor', 'Same song as first dance'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Grand exit', 'Couple departure with sparkler send-off', 'special_moment', '23:35:00', '23:45:00', 10, 5, 'Venue exit', 'Sparklers provided for guests'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', NULL, 'Vendor breakdown', 'Cleanup and equipment removal', 'vendor_breakdown', '23:45:00', '01:00:00', 75, 15, 'Entire venue', 'Venue staff and vendors coordinate cleanup');

-- =============================================
-- SAMPLE ACTIVITY FEED
-- =============================================

-- Create some sample activity entries to demonstrate the feed
INSERT INTO activity_feed (
    couple_id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    entity_name,
    user_email,
    user_name,
    details,
    priority,
    is_read,
    created_at
) VALUES 
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', '11111111-2222-3333-4444-555555555555', 'vendor_booked', 'vendor', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'The Grand Ballroom'), 'The Grand Ballroom', 'sarah.johnson@email.com', 'Sarah Johnson', '{"cost": 15000, "date": "2024-09-15", "category": "venue"}', 5, false, NOW() - INTERVAL '2 weeks'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', '66666666-7777-8888-9999-000000000000', 'vendor_booked', 'vendor', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Artistic Moments Photography'), 'Artistic Moments Photography', 'michael.chen@email.com', 'Michael Chen', '{"cost": 3500, "package": "full day coverage", "category": "photography"}', 4, true, NOW() - INTERVAL '10 days'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', '11111111-2222-3333-4444-555555555555', 'guest_added', 'guest', (SELECT id FROM guests WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND first_name = 'Emma' AND last_name = 'Davis'), 'Emma Davis', 'sarah.johnson@email.com', 'Sarah Johnson', '{"relationship": "college roommate", "plus_one": true}', 2, true, NOW() - INTERVAL '5 days'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', '66666666-7777-8888-9999-000000000000', 'task_completed', 'task', (SELECT id FROM tasks WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND title = 'Send save-the-dates'), 'Send save-the-dates', 'michael.chen@email.com', 'Michael Chen', '{"completed_date": "2024-06-01", "guests_notified": 120}', 3, false, NOW() - INTERVAL '3 days'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', '11111111-2222-3333-4444-555555555555', 'expense_added', 'expense', (SELECT id FROM budget_expenses WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND description = 'Wedding dress'), 'Wedding dress', 'sarah.johnson@email.com', 'Sarah Johnson', '{"amount": 2200, "category": "Wedding Attire", "payment_method": "Credit Card"}', 2, true, NOW() - INTERVAL '2 days'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', '66666666-7777-8888-9999-000000000000', 'rsvp_confirmed', 'guest', (SELECT id FROM guests WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND first_name = 'Kevin' AND last_name = 'Chen'), 'Kevin Chen', 'michael.chen@email.com', 'Michael Chen', '{"rsvp_status": "accepted", "plus_one_attending": true, "dietary_restrictions": "none"}', 1, false, NOW() - INTERVAL '1 day');

-- =============================================
-- SAMPLE MESSAGES
-- =============================================

-- Sample messages between couple and vendors
INSERT INTO messages (
    couple_id,
    sender_user_id,
    vendor_id,
    subject,
    message,
    message_type,
    is_read,
    is_important,
    created_at
) VALUES 
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', '11111111-2222-3333-4444-555555555555', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Artistic Moments Photography'), 'Wedding timeline questions', 'Hi Rebecca! We are finalizing our wedding day timeline. Could you let us know what time you typically recommend starting the getting ready photos? Also, how long do family photos usually take after the ceremony? Thanks!', 'general', false, false, NOW() - INTERVAL '3 days'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', '66666666-7777-8888-9999-000000000000', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Gourmet Affairs Catering'), 'Final guest count update', 'Hi Chef Dubois, We have our final RSVP count: 118 guests. This is 2 less than our original estimate of 120. Please confirm this works with your catering quantities. Looking forward to the amazing food! Best, Michael', 'general', true, true, NOW() - INTERVAL '2 days'),
('c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', '11111111-2222-3333-4444-555555555555', (SELECT id FROM couple_vendors WHERE couple_id = 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' AND name = 'Bloom & Beyond'), 'Centerpiece color question', 'Hi Maria, We love the floral proposal! Quick question about the centerpieces - could we see a mockup with slightly more white flowers and less pink? We want to make sure it matches our color scheme perfectly. Thanks! Sarah', 'general', false, false, NOW() - INTERVAL '1 day');

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

-- Test that our seed data was inserted properly
DO $$
DECLARE
    couple_count INTEGER;
    vendor_count INTEGER;
    guest_count INTEGER;
    task_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO couple_count FROM couples;
    SELECT COUNT(*) INTO vendor_count FROM couple_vendors;
    SELECT COUNT(*) INTO guest_count FROM guests;
    SELECT COUNT(*) INTO task_count FROM tasks;
    
    RAISE NOTICE '🎉 SEED DATA INSERTED SUCCESSFULLY!';
    RAISE NOTICE '👰 Couples: %', couple_count;
    RAISE NOTICE '🏪 Vendors: %', vendor_count;
    RAISE NOTICE '👥 Guests: %', guest_count;
    RAISE NOTICE '✅ Tasks: %', task_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for wedding planning development!';
END;
$$;