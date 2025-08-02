-- Run this SQL in your Supabase SQL editor to set up vendor availability tables

-- Create tables for vendor availability and appointments

-- Table for vendor availability slots
CREATE TABLE IF NOT EXISTS vendor_availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Table for specific date availability overrides (holidays, special dates, etc)
CREATE TABLE IF NOT EXISTS vendor_date_overrides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  is_available boolean DEFAULT false,
  start_time time,
  end_time time,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(vendor_id, date)
);

-- Table for vendor appointments/bookings
CREATE TABLE IF NOT EXISTS vendor_appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  couple_id uuid REFERENCES wedding_couples(id) ON DELETE CASCADE NOT NULL,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  appointment_type text DEFAULT 'consultation',
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  location text,
  notes text,
  reminder_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_appointment_time CHECK (end_time > start_time)
);

-- Create indexes for better performance
CREATE INDEX idx_vendor_availability_vendor_id ON vendor_availability(vendor_id);
CREATE INDEX idx_vendor_availability_day ON vendor_availability(day_of_week);
CREATE INDEX idx_vendor_date_overrides_vendor_id ON vendor_date_overrides(vendor_id);
CREATE INDEX idx_vendor_date_overrides_date ON vendor_date_overrides(date);
CREATE INDEX idx_vendor_appointments_vendor_id ON vendor_appointments(vendor_id);
CREATE INDEX idx_vendor_appointments_couple_id ON vendor_appointments(couple_id);
CREATE INDEX idx_vendor_appointments_date ON vendor_appointments(appointment_date);
CREATE INDEX idx_vendor_appointments_status ON vendor_appointments(status);

-- Enable RLS
ALTER TABLE vendor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_date_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_appointments ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_availability
CREATE POLICY "Anyone can view vendor availability"
  ON vendor_availability FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Vendors can manage their own availability"
  ON vendor_availability FOR ALL
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE contact_email = auth.jwt() ->> 'email'
  ));

-- RLS policies for vendor_date_overrides
CREATE POLICY "Anyone can view vendor date overrides"
  ON vendor_date_overrides FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Vendors can manage their own date overrides"
  ON vendor_date_overrides FOR ALL
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE contact_email = auth.jwt() ->> 'email'
  ));

-- RLS policies for vendor_appointments
CREATE POLICY "Users can view their own appointments"
  ON vendor_appointments FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM wedding_couples 
      WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    )
    OR
    vendor_id IN (
      SELECT id FROM vendors WHERE contact_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create appointments for their wedding"
  ON vendor_appointments FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM wedding_couples 
      WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own appointments"
  ON vendor_appointments FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM wedding_couples 
      WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    )
    OR
    vendor_id IN (
      SELECT id FROM vendors WHERE contact_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can cancel their own appointments"
  ON vendor_appointments FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM wedding_couples 
      WHERE partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
    )
  );

-- Insert some sample availability for testing (optional)
-- This creates availability for all vendors Mon-Fri 9am-5pm
INSERT INTO vendor_availability (vendor_id, day_of_week, start_time, end_time)
SELECT 
  v.id,
  d.day,
  '09:00:00'::time,
  '17:00:00'::time
FROM vendors v
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS d(day) -- Mon-Fri
ON CONFLICT DO NOTHING;