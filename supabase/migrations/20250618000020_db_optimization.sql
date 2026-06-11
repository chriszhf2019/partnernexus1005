-- ═══════════════════════════════════════════════════════════════
-- Database Optimization: Missing Indexes + updated_at Triggers
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. Reusable trigger function for updated_at
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- 2. Missing Indexes (query patterns from src/services/ + src/components/)
-- ═══════════════════════════════════════════════════════════════

-- HIGH PRIORITY: deals table
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
DROP INDEX IF EXISTS idx_deals_partner;
CREATE INDEX IF NOT EXISTS idx_deals_partner_date ON deals(partner_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_deals_region_status ON deals(region, status);

-- HIGH PRIORITY: partner_contacts (contact display order)
CREATE INDEX IF NOT EXISTS idx_contacts_partner_primary ON partner_contacts(partner_id, is_primary DESC);

-- HIGH PRIORITY: marketing_activities (frequent queries)
CREATE INDEX IF NOT EXISTS idx_mkt_activities_partner ON marketing_activities(partner_id);
CREATE INDEX IF NOT EXISTS idx_mkt_activities_event_date ON marketing_activities(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_activities_status ON marketing_activities(status);

-- HIGH PRIORITY: incentive_programs (status filtering)
CREATE INDEX IF NOT EXISTS idx_incentive_programs_status ON incentive_programs(status);

-- HIGH PRIORITY: deal_lifecycle_events (timeline queries)
DROP INDEX IF EXISTS idx_deal_lifecycle_events_deal;
CREATE INDEX IF NOT EXISTS idx_deal_events_deal_date ON deal_lifecycle_events(deal_id, event_date DESC);

-- MEDIUM PRIORITY: pmdf_applications
CREATE INDEX IF NOT EXISTS idx_pmdf_partner_status ON pmdf_applications(partner_id, status);

-- MEDIUM PRIORITY: saved_views (rebuild as composite index with is_preset)
DROP INDEX IF EXISTS idx_saved_views_user;
CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id, is_preset);

-- MEDIUM PRIORITY: marketing_plan (year/quarter/status filter)
CREATE INDEX IF NOT EXISTS idx_mkt_plan_year_quarter_status ON marketing_plan(year, quarter, execution_status);

-- MEDIUM PRIORITY: staff_records (rebuild as composite with date order)
DROP INDEX IF EXISTS idx_staff_records_contact;
CREATE INDEX IF NOT EXISTS idx_staff_records_contact_date ON staff_records(contact_id, date DESC);

-- MEDIUM PRIORITY: FK indexes on frequently joined tables
DROP INDEX IF EXISTS idx_deal_activities_deal;
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal ON deal_activities(deal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_phase_tasks_activity ON marketing_phase_tasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_mp_events_application ON mp_events(pmdf_application_id);

-- ═══════════════════════════════════════════════════════════════
-- 3. updated_at triggers on all tables that have the column
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'partners', 'deals', 'pmdf_applications', 'partner_contacts',
      'marketing_plan', 'marketing_materials', 'marketing_guests',
      'marketing_activities', 'marketing_execution_phases', 'marketing_phase_tasks',
      'marketing_evaluations', 'marketing_evaluation_leads',
      'marketing_budget_config',
      'protection_rules', 'jbp_meetings',
      'incentive_templates', 'incentive_applications',
      'incentive_roi_tracking', 'incentive_participation_tracking',
      'incentive_settlement_records', 'incentive_budget_alerts',
      'campaign_funnel', 'certification_programs',
      'customer_intelligence', 'global_settings',
      'partner_certifications', 'settings'
    ])
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'updated_at'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name = 'trg_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END;
$$;
