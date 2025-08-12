-- CreateEnum for day-of dashboard
CREATE TYPE "EventStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'delayed', 'cancelled');
CREATE TYPE "VendorCheckInStatus" AS ENUM ('not_arrived', 'checked_in', 'setup_complete', 'departed');
CREATE TYPE "IssueStatus" AS ENUM ('reported', 'acknowledged', 'in_progress', 'resolved', 'escalated');
CREATE TYPE "IssuePriority" AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "WeatherCondition" AS ENUM ('clear', 'partly_cloudy', 'cloudy', 'light_rain', 'heavy_rain', 'storm', 'snow');

-- Create timeline_events table
CREATE TABLE "timeline_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL,
  "event_name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "scheduled_time" TIMESTAMPTZ(6) NOT NULL,
  "actual_start_time" TIMESTAMPTZ(6),
  "actual_end_time" TIMESTAMPTZ(6),
  "duration_minutes" INTEGER NOT NULL DEFAULT 30,
  "location" VARCHAR(200),
  "status" "EventStatus" NOT NULL DEFAULT 'scheduled',
  "responsible_vendor_id" UUID,
  "responsible_staff" VARCHAR(200),
  "notes" TEXT,
  "is_milestone" BOOLEAN DEFAULT false,
  "display_order" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "timeline_events_couple_id_fkey" FOREIGN KEY ("couple_id") 
    REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "timeline_events_vendor_id_fkey" FOREIGN KEY ("responsible_vendor_id") 
    REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create vendor_checkins table
CREATE TABLE "vendor_checkins" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vendor_id" UUID NOT NULL,
  "expected_arrival" TIMESTAMPTZ(6) NOT NULL,
  "actual_arrival" TIMESTAMPTZ(6),
  "setup_start" TIMESTAMPTZ(6),
  "setup_complete" TIMESTAMPTZ(6),
  "departure_time" TIMESTAMPTZ(6),
  "status" "VendorCheckInStatus" NOT NULL DEFAULT 'not_arrived',
  "checked_in_by" UUID,
  "contact_person" VARCHAR(200),
  "contact_phone" VARCHAR(50),
  "setup_location" VARCHAR(200),
  "special_instructions" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "vendor_checkins_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vendor_checkins_vendor_id_fkey" FOREIGN KEY ("vendor_id") 
    REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "vendor_checkins_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") 
    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT "vendor_checkins_unique_vendor" UNIQUE ("vendor_id")
);

-- Create emergency_contacts table
CREATE TABLE "emergency_contacts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "role" VARCHAR(100),
  "phone_primary" VARCHAR(50) NOT NULL,
  "phone_secondary" VARCHAR(50),
  "email" VARCHAR(200),
  "relationship" VARCHAR(100),
  "is_day_of_contact" BOOLEAN DEFAULT true,
  "priority_order" INTEGER DEFAULT 99,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "emergency_contacts_couple_id_fkey" FOREIGN KEY ("couple_id") 
    REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create wedding_day_issues table
CREATE TABLE "wedding_day_issues" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT NOT NULL,
  "status" "IssueStatus" NOT NULL DEFAULT 'reported',
  "priority" "IssuePriority" NOT NULL DEFAULT 'medium',
  "reported_by" UUID,
  "assigned_to" VARCHAR(200),
  "related_vendor_id" UUID,
  "related_event_id" UUID,
  "reported_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acknowledged_at" TIMESTAMPTZ(6),
  "resolved_at" TIMESTAMPTZ(6),
  "resolution_notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "wedding_day_issues_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wedding_day_issues_couple_id_fkey" FOREIGN KEY ("couple_id") 
    REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "wedding_day_issues_reported_by_fkey" FOREIGN KEY ("reported_by") 
    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT "wedding_day_issues_vendor_id_fkey" FOREIGN KEY ("related_vendor_id") 
    REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT "wedding_day_issues_event_id_fkey" FOREIGN KEY ("related_event_id") 
    REFERENCES "timeline_events"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create guest_checkins table
CREATE TABLE "guest_checkins" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "guest_id" UUID NOT NULL,
  "checked_in_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checked_in_by" UUID,
  "table_confirmed" BOOLEAN DEFAULT false,
  "meal_served" BOOLEAN DEFAULT false,
  "special_notes" TEXT,
  
  CONSTRAINT "guest_checkins_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guest_checkins_guest_id_fkey" FOREIGN KEY ("guest_id") 
    REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "guest_checkins_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") 
    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT "guest_checkins_unique_guest" UNIQUE ("guest_id")
);

-- Create weather_updates table
CREATE TABLE "weather_updates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL,
  "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "temperature_celsius" DECIMAL(4,1),
  "temperature_fahrenheit" DECIMAL(4,1),
  "condition" "WeatherCondition" NOT NULL,
  "wind_speed_mph" INTEGER,
  "precipitation_chance" INTEGER CHECK ("precipitation_chance" >= 0 AND "precipitation_chance" <= 100),
  "humidity_percent" INTEGER CHECK ("humidity_percent" >= 0 AND "humidity_percent" <= 100),
  "sunset_time" TIME,
  "notes" TEXT,
  
  CONSTRAINT "weather_updates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "weather_updates_couple_id_fkey" FOREIGN KEY ("couple_id") 
    REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create day_of_config table for dashboard settings
CREATE TABLE "day_of_config" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL,
  "wedding_date" DATE NOT NULL,
  "ceremony_time" TIME NOT NULL,
  "reception_time" TIME,
  "venue_opens" TIME,
  "venue_closes" TIME,
  "coordinator_pin" VARCHAR(6),
  "vendor_access_enabled" BOOLEAN DEFAULT true,
  "guest_checkin_enabled" BOOLEAN DEFAULT false,
  "weather_tracking_enabled" BOOLEAN DEFAULT true,
  "emergency_protocol" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "day_of_config_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "day_of_config_couple_id_fkey" FOREIGN KEY ("couple_id") 
    REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "day_of_config_unique_couple" UNIQUE ("couple_id")
);

-- Create indexes for performance
CREATE INDEX "idx_timeline_events_couple_id" ON "timeline_events"("couple_id");
CREATE INDEX "idx_timeline_events_scheduled_time" ON "timeline_events"("scheduled_time");
CREATE INDEX "idx_timeline_events_status" ON "timeline_events"("status");
CREATE INDEX "idx_timeline_events_display_order" ON "timeline_events"("couple_id", "display_order");

CREATE INDEX "idx_vendor_checkins_vendor_id" ON "vendor_checkins"("vendor_id");
CREATE INDEX "idx_vendor_checkins_status" ON "vendor_checkins"("status");
CREATE INDEX "idx_vendor_checkins_expected_arrival" ON "vendor_checkins"("expected_arrival");

CREATE INDEX "idx_emergency_contacts_couple_id" ON "emergency_contacts"("couple_id");
CREATE INDEX "idx_emergency_contacts_priority" ON "emergency_contacts"("couple_id", "priority_order");

CREATE INDEX "idx_wedding_day_issues_couple_id" ON "wedding_day_issues"("couple_id");
CREATE INDEX "idx_wedding_day_issues_status" ON "wedding_day_issues"("status");
CREATE INDEX "idx_wedding_day_issues_priority" ON "wedding_day_issues"("priority");
CREATE INDEX "idx_wedding_day_issues_reported_at" ON "wedding_day_issues"("reported_at");

CREATE INDEX "idx_guest_checkins_guest_id" ON "guest_checkins"("guest_id");
CREATE INDEX "idx_guest_checkins_checked_in_at" ON "guest_checkins"("checked_in_at");

CREATE INDEX "idx_weather_updates_couple_id" ON "weather_updates"("couple_id");
CREATE INDEX "idx_weather_updates_recorded_at" ON "weather_updates"("recorded_at");

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON "timeline_events"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_checkins_updated_at BEFORE UPDATE ON "vendor_checkins"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_day_issues_updated_at BEFORE UPDATE ON "wedding_day_issues"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_day_of_config_updated_at BEFORE UPDATE ON "day_of_config"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE "timeline_events" IS 'Wedding day timeline with scheduled events and real-time status tracking';
COMMENT ON TABLE "vendor_checkins" IS 'Track vendor arrivals, setup progress, and departures on wedding day';
COMMENT ON TABLE "emergency_contacts" IS 'Emergency contact list for wedding day coordination and issues';
COMMENT ON TABLE "wedding_day_issues" IS 'Real-time issue tracking and resolution during wedding events';
COMMENT ON TABLE "guest_checkins" IS 'Guest arrival tracking and meal service confirmation';
COMMENT ON TABLE "weather_updates" IS 'Weather monitoring for outdoor weddings and contingency planning';
COMMENT ON TABLE "day_of_config" IS 'Configuration settings for day-of wedding dashboard access and features';

-- Add some helpful views for the dashboard
CREATE VIEW "active_timeline_view" AS
SELECT 
  te.*,
  v.name as vendor_name,
  v.phone as vendor_phone,
  v.email as vendor_email
FROM timeline_events te
LEFT JOIN vendors v ON te.responsible_vendor_id = v.id
WHERE te.scheduled_time::date = CURRENT_DATE
ORDER BY te.display_order;

CREATE VIEW "vendor_status_view" AS
SELECT 
  v.id,
  v.name,
  v.category,
  v.phone,
  vc.status,
  vc.expected_arrival,
  vc.actual_arrival,
  vc.setup_complete,
  vc.contact_person,
  vc.contact_phone
FROM vendors v
LEFT JOIN vendor_checkins vc ON v.id = vc.vendor_id
WHERE v.status = 'booked';

CREATE VIEW "guest_checkin_summary" AS
SELECT 
  g.couple_id,
  COUNT(DISTINCT g.id) as total_guests,
  COUNT(DISTINCT gc.guest_id) as checked_in,
  COUNT(DISTINCT CASE WHEN gc.table_confirmed THEN gc.guest_id END) as table_confirmed,
  COUNT(DISTINCT CASE WHEN gc.meal_served THEN gc.guest_id END) as meals_served
FROM guests g
LEFT JOIN guest_checkins gc ON g.id = gc.guest_id
WHERE g.rsvp_status = 'attending'
GROUP BY g.couple_id;