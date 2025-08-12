-- CreateEnum for seating planner
CREATE TYPE "TableShape" AS ENUM ('round', 'rectangular', 'square', 'oval', 'custom');
CREATE TYPE "SeatingPreferenceType" AS ENUM (
  'must_sit_together',
  'cannot_sit_together', 
  'near_entrance',
  'near_bar',
  'near_dance_floor',
  'near_restroom',
  'away_from_speakers',
  'wheelchair_accessible'
);

-- Drop existing tables table if it exists (it's too basic)
DROP TABLE IF EXISTS "tables";

-- Create venue_layouts table
CREATE TABLE "venue_layouts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "venue_name" VARCHAR(200),
  "dimensions_width" INTEGER DEFAULT 1000,
  "dimensions_height" INTEGER DEFAULT 800,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_active" BOOLEAN DEFAULT true,
  
  CONSTRAINT "venue_layouts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "venue_layouts_couple_id_fkey" FOREIGN KEY ("couple_id") 
    REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "venue_layouts_unique_name" UNIQUE ("couple_id", "name")
);

-- Create tables table (enhanced version)
CREATE TABLE "tables" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "layout_id" UUID NOT NULL,
  "table_number" VARCHAR(50) NOT NULL,
  "table_name" VARCHAR(100),
  "capacity" INTEGER NOT NULL CHECK ("capacity" > 0 AND "capacity" <= 20),
  "shape" "TableShape" NOT NULL DEFAULT 'round',
  "x_position" DECIMAL(10,2) NOT NULL,
  "y_position" DECIMAL(10,2) NOT NULL,
  "rotation" INTEGER DEFAULT 0,
  "width" DECIMAL(10,2),
  "height" DECIMAL(10,2),
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "tables_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tables_layout_id_fkey" FOREIGN KEY ("layout_id") 
    REFERENCES "venue_layouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "tables_unique_number" UNIQUE ("layout_id", "table_number")
);

-- Create seating_assignments table
CREATE TABLE "seating_assignments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "guest_id" UUID NOT NULL,
  "table_id" UUID NOT NULL,
  "seat_number" INTEGER,
  "assigned_by" UUID,
  "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  
  CONSTRAINT "seating_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "seating_assignments_guest_id_fkey" FOREIGN KEY ("guest_id") 
    REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "seating_assignments_table_id_fkey" FOREIGN KEY ("table_id") 
    REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "seating_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") 
    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT "seating_assignments_unique_guest" UNIQUE ("guest_id"),
  CONSTRAINT "seating_assignments_unique_seat" UNIQUE ("table_id", "seat_number")
);

-- Create seating_preferences table
CREATE TABLE "seating_preferences" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL,
  "preference_type" "SeatingPreferenceType" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "seating_preferences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "seating_preferences_couple_id_fkey" FOREIGN KEY ("couple_id") 
    REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create seating_preference_guests table (many-to-many)
CREATE TABLE "seating_preference_guests" (
  "preference_id" UUID NOT NULL,
  "guest_id" UUID NOT NULL,
  
  CONSTRAINT "seating_preference_guests_pkey" PRIMARY KEY ("preference_id", "guest_id"),
  CONSTRAINT "seating_preference_guests_preference_id_fkey" FOREIGN KEY ("preference_id") 
    REFERENCES "seating_preferences"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "seating_preference_guests_guest_id_fkey" FOREIGN KEY ("guest_id") 
    REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create indexes for performance
CREATE INDEX "idx_venue_layouts_couple_id" ON "venue_layouts"("couple_id");
CREATE INDEX "idx_venue_layouts_is_active" ON "venue_layouts"("is_active");

CREATE INDEX "idx_tables_layout_id" ON "tables"("layout_id");
CREATE INDEX "idx_tables_position" ON "tables"("x_position", "y_position");

CREATE INDEX "idx_seating_assignments_table_id" ON "seating_assignments"("table_id");
CREATE INDEX "idx_seating_assignments_guest_id" ON "seating_assignments"("guest_id");

CREATE INDEX "idx_seating_preferences_couple_id" ON "seating_preferences"("couple_id");
CREATE INDEX "idx_seating_preferences_type" ON "seating_preferences"("preference_type");

CREATE INDEX "idx_seating_preference_guests_guest_id" ON "seating_preference_guests"("guest_id");

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_venue_layouts_updated_at BEFORE UPDATE ON "venue_layouts"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON "tables"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE "venue_layouts" IS 'Stores different layout configurations for wedding venues';
COMMENT ON TABLE "tables" IS 'Individual tables within a venue layout with positioning and capacity';
COMMENT ON TABLE "seating_assignments" IS 'Maps guests to specific tables and seats';
COMMENT ON TABLE "seating_preferences" IS 'Seating rules and constraints for guest arrangements';
COMMENT ON TABLE "seating_preference_guests" IS 'Guests associated with each seating preference rule';