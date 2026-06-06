-- Add missing agenda column to marketing_activities table
ALTER TABLE marketing_activities 
ADD COLUMN IF NOT EXISTS agenda TEXT;

-- Add RLS policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow insert marketing_activities') THEN
    CREATE POLICY "Allow insert marketing_activities" ON marketing_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
