-- Seed marketing metrics: fill realistic business data for existing marketing activities
-- and update budget configuration with current approval status.

-- First, upsert sensible default values for all marketing_activities rows.
-- We use UPDATE with CASE-based derivation so the values are consistent with already-entered budget/attendees.

DO $$
DECLARE
  activity_record RECORD;
BEGIN
  FOR activity_record IN SELECT id, name, type, budget, expected_attendees, status, leads_generated, actual_spend
                          FROM marketing_activities
  LOOP
    -- Derive proportional metrics from existing data with sane defaults
    UPDATE marketing_activities
    SET
      leads_generated    = CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)::INT
                                ELSE activity_record.leads_generated END,

      expected_attendees = CASE WHEN activity_record.expected_attendees IS NULL OR activity_record.expected_attendees = 0
                                THEN 50
                                ELSE activity_record.expected_attendees END,

      actual_spend       = CASE WHEN activity_record.actual_spend IS NULL OR activity_record.actual_spend = 0
                                THEN COALESCE(activity_record.budget, 50000) * 0.7
                                ELSE activity_record.actual_spend END,

      budget             = CASE WHEN activity_record.budget IS NULL OR activity_record.budget = 0
                                THEN 50000
                                ELSE activity_record.budget END,

      mql_count     = ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                  THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                  ELSE activity_record.leads_generated END) * 0.55),
      sql_count     = ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                  THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                  ELSE activity_record.leads_generated END) * 0.30),
      grade_a_leads = ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                  THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                  ELSE activity_record.leads_generated END) * 0.20),
      grade_b_leads = ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                  THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                  ELSE activity_record.leads_generated END) * 0.35),
      grade_c_leads = ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                  THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                  ELSE activity_record.leads_generated END) * 0.45),
      new_logo_count = CASE WHEN activity_record.status = 'Completed'
                            THEN ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                             THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                             ELSE activity_record.leads_generated END) * 0.10)
                            ELSE ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                             THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                             ELSE activity_record.leads_generated END) * 0.05) END,
      new_logo_amount = CASE WHEN activity_record.status = 'Completed'
                             THEN (CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                        THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                        ELSE activity_record.leads_generated END) * 50000
                             ELSE (CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                        THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                        ELSE activity_record.leads_generated END) * 20000 END,
      conversion_days = CASE WHEN activity_record.status = 'Completed' THEN 30 ELSE 60 END,
      follow_up_rate   = CASE WHEN activity_record.status = 'Completed' THEN 85 ELSE 60 END,
      stale_leads      = CASE WHEN activity_record.status <> 'Completed'
                             THEN ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                              THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                              ELSE activity_record.leads_generated END) * 0.15)
                             ELSE 3 END,
      sop_downloads    = CASE WHEN activity_record.status = 'Completed'
                             THEN (CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                        THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                        ELSE activity_record.leads_generated END)
                             ELSE ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                              THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                              ELSE activity_record.leads_generated END) * 0.6) END,
      deals_created    = CASE WHEN activity_record.status = 'Completed'
                             THEN ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                              THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                              ELSE activity_record.leads_generated END) * 0.12)
                             ELSE ROUND((CASE WHEN activity_record.leads_generated IS NULL OR activity_record.leads_generated = 0
                                              THEN GREATEST(10, COALESCE(activity_record.expected_attendees, 50) * 0.4)
                                              ELSE activity_record.leads_generated END) * 0.03) END
    WHERE id = activity_record.id;
  END LOOP;
END $$;

-- Update the default budget row with realistic approval stats
INSERT INTO marketing_budget_config (id, annual_budget, q1_budget, q2_budget, q3_budget, q4_budget, status, pending_approvals, pending_amount)
VALUES ('current', 2000000, 400000, 500000, 600000, 500000, 'approved', 4, 180000)
ON CONFLICT (id) DO UPDATE SET
  pending_approvals = EXCLUDED.pending_approvals,
  pending_amount = EXCLUDED.pending_amount,
  annual_budget = EXCLUDED.annual_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  status = EXCLUDED.status;

-- Schema cache refresh
NOTIFY pgrst, 'reload schema';
