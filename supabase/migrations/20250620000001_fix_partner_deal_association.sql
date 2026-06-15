-- Fix Partner-Deal associations
-- Ensure all deals reference valid partner IDs

-- First, get the partner IDs that we need
DO $$
DECLARE
    p_taiji_id uuid;
    p_yonyou_id uuid;
    p_shenzhencity_id uuid;
BEGIN
    -- Find partner IDs
    SELECT id INTO p_taiji_id FROM partners WHERE name = '太极计算机股份有限公司';
    SELECT id INTO p_yonyou_id FROM partners WHERE name = '用友网络科技股份有限公司';
    SELECT id INTO p_shenzhencity_id FROM partners WHERE name = '深圳智慧城市科技';

    -- Update deals to reference correct partner IDs
    -- 某直辖市智慧城市数据中台 -> 太极计算机
    UPDATE deals SET partner_id = p_taiji_id WHERE title = '某直辖市智慧城市数据中台';

    -- ERP系统云化升级 -> 用友网络
    UPDATE deals SET partner_id = p_yonyou_id WHERE title = 'ERP系统云化升级';

    -- 深圳市政府智慧政务平台二期 -> 深圳智慧城市科技
    UPDATE deals SET partner_id = p_shenzhencity_id WHERE title = '深圳市政府智慧政务平台二期';
END $$;
