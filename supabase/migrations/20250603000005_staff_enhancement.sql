-- Staff/Personnel Enhancement
-- Run in Supabase SQL Editor

-- 1. Add rich columns to partner_contacts
ALTER TABLE partner_contacts ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE partner_contacts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE partner_contacts ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;
ALTER TABLE partner_contacts ADD COLUMN IF NOT EXISTS join_date DATE;
ALTER TABLE partner_contacts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Create staff_records table (tracks everything per person)
CREATE TABLE IF NOT EXISTS staff_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES partner_contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,          -- training, activity, project, customer, points, change
  title TEXT,                  -- description/title
  date DATE DEFAULT CURRENT_DATE,
  data JSONB DEFAULT '{}',    -- flexible data payload
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_records_contact ON staff_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_staff_records_type ON staff_records(type);

-- 3. RLS for staff_records
ALTER TABLE staff_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all staff_records" ON staff_records FOR ALL USING (true);
