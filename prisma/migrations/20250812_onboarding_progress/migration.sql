-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  step_current TEXT,
  steps_completed JSONB DEFAULT '[]'::JSONB,
  step_data JSONB DEFAULT '{}'::JSONB,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on done status for faster queries
CREATE INDEX idx_onboarding_progress_done ON onboarding_progress(done);

-- Add has_onboarded column to users table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'has_onboarded'
  ) THEN
    ALTER TABLE users ADD COLUMN has_onboarded BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_onboarding_progress_updated_at 
  BEFORE UPDATE ON onboarding_progress 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();