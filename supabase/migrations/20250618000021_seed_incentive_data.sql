-- Seed realistic incentive_applications data
-- Populates the incentive_applications table with data linked to existing partners and programs
DO $$
DECLARE
  program RECORD;
  partner RECORD;
  plan_count INT;
  app_count INT := 0;
  v_claimed NUMERIC;
  v_payout NUMERIC;
  v_status TEXT;
  v_metric TEXT;
  v_submitted_date DATE;
  v_random FLOAT;
BEGIN
  -- Check if we already have applications
  SELECT COUNT(*) INTO app_count FROM incentive_applications;
  IF app_count > 0 THEN
    RAISE NOTICE 'incentive_applications already has % records, skipping seed', app_count;
    RETURN;
  END IF;

  -- Create applications for each active program with random partners
  FOR program IN SELECT * FROM incentive_programs WHERE status IN ('Active', 'Ended') LOOP
    plan_count := 0;
    FOR partner IN
      SELECT id, name, tier FROM partners
      WHERE status = 'Cooperating'
      ORDER BY RANDOM()
      LIMIT (5 + FLOOR(RANDOM() * 15))::INT
    LOOP
      -- Random metric type
      v_random := RANDOM();
      v_metric := CASE
        WHEN v_random < 0.4 THEN '商机报备'
        WHEN v_random < 0.7 THEN '销售达成'
        WHEN v_random < 0.9 THEN '客户转化'
        ELSE '培训参与'
      END;

      -- Random claimed value: 1-30% of total budget
      v_claimed := FLOOR(RANDOM() * program.total_budget * 0.3)::NUMERIC;
      IF v_claimed < 1000 THEN v_claimed := 1000; END IF;

      -- Payout: 40-70% of claimed value
      v_payout := FLOOR(v_claimed * (0.4 + RANDOM() * 0.3))::NUMERIC;

      -- Weighted random status
      v_random := RANDOM();
      v_status := CASE
        WHEN v_random < 0.35 THEN 'approved'
        WHEN v_random < 0.55 THEN 'paid'
        WHEN v_random < 0.75 THEN 'pending'
        WHEN v_random < 0.90 THEN 'reviewing'
        ELSE 'rejected'
      END;

      -- Random submission date between program start and now
      v_submitted_date := (program.start_date::DATE + (RANDOM() * (LEAST(CURRENT_DATE, program.end_date::DATE) - program.start_date::DATE))::INT);

      INSERT INTO incentive_applications (
        plan_id, partner_id, partner_name, partner_tier,
        metric, claimed_value, payout_amount,
        status, submitted_at, approved_at
      ) VALUES (
        program.id,
        partner.id,
        partner.name,
        COALESCE(partner.tier, 'Silver'),
        v_metric,
        v_claimed,
        v_payout,
        v_status,
        v_submitted_date,
        CASE WHEN v_status IN ('approved', 'paid') THEN v_submitted_date + (RANDOM() * 14)::INT * INTERVAL '1 day' ELSE NULL END
      );
      plan_count := plan_count + 1;
    END LOOP;

    -- Update program claimed_amount and participants_count based on seed data
    UPDATE incentive_programs SET
      claimed_amount = (
        SELECT COALESCE(SUM(claimed_value), 0)
        FROM incentive_applications
        WHERE plan_id = program.id AND status IN ('approved', 'paid')
      ),
      participants_count = (
        SELECT COUNT(DISTINCT partner_id)
        FROM incentive_applications
        WHERE plan_id = program.id
      )
    WHERE id = program.id;

    RAISE NOTICE 'Seeded % applications for program: %', plan_count, program.title;
  END LOOP;
END $$;
