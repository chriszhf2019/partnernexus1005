-- Add missing columns to partners table to prevent data loss on partner creation
-- Vendor qualifications (JSONB) for {vendor: qualificationLevel}
-- Industries (JSONB) as array of industry strings
-- Application date tracking

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'vendor_qualifications') THEN
    ALTER TABLE partners ADD COLUMN vendor_qualifications JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'industries') THEN
    ALTER TABLE partners ADD COLUMN industries TEXT[] DEFAULT '{}';
  END IF;
END $$;
