-- Run this SQL in your Supabase SQL editor to set up seating tables

-- Create tables for seating chart management

-- Table for defining seating tables/arrangements
CREATE TABLE IF NOT EXISTS seating_tables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid REFERENCES wedding_couples(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  table_type text DEFAULT 'round' CHECK (table_type IN ('round', 'rectangle', 'square', 'custom')),
  capacity integer NOT NULL DEFAULT 8,
  x_position integer DEFAULT 0,
  y_position integer DEFAULT 0,
  width integer DEFAULT 150,
  height integer DEFAULT 150,
  rotation integer DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Table for guest seating assignments
CREATE TABLE IF NOT EXISTS seating_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id uuid REFERENCES wedding_couples(id) ON DELETE CASCADE NOT NULL,
  guest_id uuid REFERENCES wedding_guests(id) ON DELETE CASCADE NOT NULL,
  table_id uuid REFERENCES seating_tables(id) ON DELETE CASCADE NOT NULL,
  seat_number integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(guest_id) -- Each guest can only be assigned to one table
);

-- Create indexes for better performance
CREATE INDEX idx_seating_tables_couple_id ON seating_tables(couple_id);
CREATE INDEX idx_seating_assignments_couple_id ON seating_assignments(couple_id);
CREATE INDEX idx_seating_assignments_table_id ON seating_assignments(table_id);
CREATE INDEX idx_seating_assignments_guest_id ON seating_assignments(guest_id);

-- Enable RLS
ALTER TABLE seating_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for seating_tables
CREATE POLICY "Users can view their own seating tables"
  ON seating_tables FOR SELECT
  USING (auth.uid() IN (
    SELECT partner1_user_id FROM wedding_couples WHERE id = couple_id
    UNION
    SELECT partner2_user_id FROM wedding_couples WHERE id = couple_id
  ));

CREATE POLICY "Users can create seating tables for their wedding"
  ON seating_tables FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT partner1_user_id FROM wedding_couples WHERE id = couple_id
    UNION
    SELECT partner2_user_id FROM wedding_couples WHERE id = couple_id
  ));

CREATE POLICY "Users can update their own seating tables"
  ON seating_tables FOR UPDATE
  USING (auth.uid() IN (
    SELECT partner1_user_id FROM wedding_couples WHERE id = couple_id
    UNION
    SELECT partner2_user_id FROM wedding_couples WHERE id = couple_id
  ));

CREATE POLICY "Users can delete their own seating tables"
  ON seating_tables FOR DELETE
  USING (auth.uid() IN (
    SELECT partner1_user_id FROM wedding_couples WHERE id = couple_id
    UNION
    SELECT partner2_user_id FROM wedding_couples WHERE id = couple_id
  ));

-- RLS policies for seating_assignments
CREATE POLICY "Users can view their own seating assignments"
  ON seating_assignments FOR SELECT
  USING (auth.uid() IN (
    SELECT partner1_user_id FROM wedding_couples WHERE id = couple_id
    UNION
    SELECT partner2_user_id FROM wedding_couples WHERE id = couple_id
  ));

CREATE POLICY "Users can create seating assignments for their wedding"
  ON seating_assignments FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT partner1_user_id FROM wedding_couples WHERE id = couple_id
    UNION
    SELECT partner2_user_id FROM wedding_couples WHERE id = couple_id
  ));

CREATE POLICY "Users can update their own seating assignments"
  ON seating_assignments FOR UPDATE
  USING (auth.uid() IN (
    SELECT partner1_user_id FROM wedding_couples WHERE id = couple_id
    UNION
    SELECT partner2_user_id FROM wedding_couples WHERE id = couple_id
  ));

CREATE POLICY "Users can delete their own seating assignments"
  ON seating_assignments FOR DELETE
  USING (auth.uid() IN (
    SELECT partner1_user_id FROM wedding_couples WHERE id = couple_id
    UNION
    SELECT partner2_user_id FROM wedding_couples WHERE id = couple_id
  ));