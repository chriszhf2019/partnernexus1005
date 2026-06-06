-- Complete migration for marketing_activities table
-- Adds all missing columns required by the frontend application

DO $$
BEGIN
  -- Basic fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'agenda') THEN
    ALTER TABLE marketing_activities ADD COLUMN agenda TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'guests') THEN
    ALTER TABLE marketing_activities ADD COLUMN guests TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'description') THEN
    ALTER TABLE marketing_activities ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'contact_name') THEN
    ALTER TABLE marketing_activities ADD COLUMN contact_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'contact_phone') THEN
    ALTER TABLE marketing_activities ADD COLUMN contact_phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'max_attendees') THEN
    ALTER TABLE marketing_activities ADD COLUMN max_attendees INT DEFAULT 100;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'enable_checkin') THEN
    ALTER TABLE marketing_activities ADD COLUMN enable_checkin BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'enable_questions') THEN
    ALTER TABLE marketing_activities ADD COLUMN enable_questions BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'enable_lottery') THEN
    ALTER TABLE marketing_activities ADD COLUMN enable_lottery BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'enable_share') THEN
    ALTER TABLE marketing_activities ADD COLUMN enable_share BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'lottery_reward') THEN
    ALTER TABLE marketing_activities ADD COLUMN lottery_reward TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'signup_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN signup_points INT DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'checkin_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN checkin_points INT DEFAULT 20;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'share_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN share_points INT DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'question_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN question_points INT DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'lottery_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN lottery_points INT DEFAULT 30;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'interaction_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN interaction_points INT DEFAULT 15;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'invite_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN invite_points INT DEFAULT 50;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'review_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN review_points INT DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'complete_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN complete_points INT DEFAULT 20;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'invitation_code') THEN
    ALTER TABLE marketing_activities ADD COLUMN invitation_code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'host_type') THEN
    ALTER TABLE marketing_activities ADD COLUMN host_type TEXT DEFAULT 'vendor';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'partner_id') THEN
    ALTER TABLE marketing_activities ADD COLUMN partner_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'partner_name') THEN
    ALTER TABLE marketing_activities ADD COLUMN partner_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'cover_image') THEN
    ALTER TABLE marketing_activities ADD COLUMN cover_image TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'tags') THEN
    ALTER TABLE marketing_activities ADD COLUMN tags TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'province') THEN
    ALTER TABLE marketing_activities ADD COLUMN province TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'city') THEN
    ALTER TABLE marketing_activities ADD COLUMN city TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'district') THEN
    ALTER TABLE marketing_activities ADD COLUMN district TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'start_time') THEN
    ALTER TABLE marketing_activities ADD COLUMN start_time TIME;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'end_time') THEN
    ALTER TABLE marketing_activities ADD COLUMN end_time TIME;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'end_date') THEN
    ALTER TABLE marketing_activities ADD COLUMN end_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'expected_attendees') THEN
    ALTER TABLE marketing_activities ADD COLUMN expected_attendees INT DEFAULT 0;
  END IF;
  
  RAISE NOTICE 'All missing columns added to marketing_activities table';
END $$;

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS marketing_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow all on marketing_activities') THEN
    CREATE POLICY "Allow all on marketing_activities" ON marketing_activities 
    FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
