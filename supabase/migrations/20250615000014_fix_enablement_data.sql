-- Fix: EnablementPage 数据修复 — 状态修正 + 评估记录种子
-- 在 Supabase SQL Editor 中执行此脚本
-- 项目: ezkbjufluczpxdixplxu

BEGIN;

-- ═══════════════════════════════════════════════════════
-- Step 1: 将 score >= 60 的 assessed 改为 completed
-- ═══════════════════════════════════════════════════════
UPDATE user_enrollments
SET status = 'completed',
    completed_at = COALESCE(completed_at, last_activity, NOW()),
    updated_at = NOW()
WHERE status = 'assessed'
  AND score IS NOT NULL
  AND score >= 60;

-- 显示更新结果
DO $$
DECLARE
  v_count INT;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Step 1: % enrollments updated from assessed → completed', v_count;
END $$;

-- ═══════════════════════════════════════════════════════
-- Step 2: 为有评分的选课插入评估记录
-- ═══════════════════════════════════════════════════════
INSERT INTO assessment_records (user_name, program_name, type, score, level, answers, created_at)
SELECT
  e.user_name,
  e.program_name,
  'post' AS type,
  e.score,
  CASE
    WHEN e.score >= 80 THEN '专家级'
    WHEN e.score >= 60 THEN '中级'
    ELSE '初级'
  END AS level,
  '{}'::jsonb AS answers,
  COALESCE(e.completed_at, e.last_activity, NOW()) AS created_at
FROM user_enrollments e
WHERE e.score IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM assessment_records a
    WHERE a.user_name = e.user_name
      AND a.program_name = e.program_name
      AND a.type = 'post'
  );

DO $$
DECLARE
  v_count INT;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Step 2: % assessment records inserted', v_count;
END $$;

-- ═══════════════════════════════════════════════════════
-- Step 3: Verify final state
-- ═══════════════════════════════════════════════════════
RAISE NOTICE '--- Final counts ---';
RAISE NOTICE 'Completed enrollments: %', (SELECT COUNT(*) FROM user_enrollments WHERE status = 'completed');
RAISE NOTICE 'Assessed enrollments: %', (SELECT COUNT(*) FROM user_enrollments WHERE status = 'assessed');
RAISE NOTICE 'Learning enrollments: %', (SELECT COUNT(*) FROM user_enrollments WHERE status = 'learning');
RAISE NOTICE 'Assessment records: %', (SELECT COUNT(*) FROM assessment_records);

COMMIT;
