/**
 * 一键完成市场营销模块数据库更新
 * 1) 添加缺失字段到 marketing_activities / marketing_plan / marketing_budget_config
 * 2) 根据已有数据智能填充业务指标
 * 3) 验证写回结果
 */
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
});

const sql = (q) => client.query(q);

async function main() {
  await client.connect();
  console.log('✅ 已连接到 PostgreSQL (localhost:54322)');

  // ------------------------------------------------------------------
  // 1. 查询现有的 marketing_activities 表结构
  // ------------------------------------------------------------------
  const cols = await sql(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'marketing_activities'
    ORDER BY ordinal_position
  `);
  console.log(`\n🔍 marketing_activities 当前有 ${cols.rows.length} 个字段`);
  const activityCols = new Set(cols.rows.map(r => r.column_name));

  // ------------------------------------------------------------------
  // 2. 为 marketing_activities 添加缺失字段
  // ------------------------------------------------------------------
  const missingActivityCols = [
    ['leads_generated', 'INT', '0'],
    ['mql_count', 'INT', '0'],
    ['sql_count', 'INT', '0'],
    ['grade_a_leads', 'INT', '0'],
    ['grade_b_leads', 'INT', '0'],
    ['grade_c_leads', 'INT', '0'],
    ['new_logo_count', 'INT', '0'],
    ['new_logo_amount', 'DECIMAL(14,2)', '0'],
    ['conversion_days', 'INT', '0'],
    ['follow_up_rate', 'INT', '0'],
    ['stale_leads', 'INT', '0'],
    ['sop_downloads', 'INT', '0'],
    ['deals_created', 'INT', '0'],
    ['actual_spend', 'DECIMAL(14,2)', '0'],
  ];
  for (const [name, type, def] of missingActivityCols) {
    if (!activityCols.has(name)) {
      try {
        await sql(`ALTER TABLE marketing_activities ADD COLUMN ${name} ${type} DEFAULT ${def}`);
        console.log(`  ✅ + marketing_activities.${name}`);
      } catch (e) {
        console.log(`  ⚠️  marketing_activities.${name} 添加失败: ${e.message.split('\n')[0]}`);
      }
    } else {
      console.log(`  ✔  marketing_activities.${name} 已存在`);
    }
  }

  // ------------------------------------------------------------------
  // 3. 查询 marketing_plan 表结构
  // ------------------------------------------------------------------
  const planCols = await sql(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'marketing_plan'
    ORDER BY ordinal_position
  `);
  console.log(`\n🔍 marketing_plan 当前有 ${planCols.rows.length} 个字段`);
  const planColsSet = new Set(planCols.rows.map(r => r.column_name));

  const missingPlanCols = [
    ['leads_generated', 'INT', '0'],
    ['mql_count', 'INT', '0'],
    ['sql_count', 'INT', '0'],
    ['grade_a_leads', 'INT', '0'],
    ['grade_b_leads', 'INT', '0'],
    ['grade_c_leads', 'INT', '0'],
    ['new_logo_count', 'INT', '0'],
    ['conversion_days', 'INT', '0'],
    ['follow_up_rate', 'INT', '0'],
    ['stale_leads', 'INT', '0'],
    ['sop_downloads', 'INT', '0'],
  ];
  for (const [name, type, def] of missingPlanCols) {
    if (!planColsSet.has(name)) {
      try {
        await sql(`ALTER TABLE marketing_plan ADD COLUMN ${name} ${type} DEFAULT ${def}`);
        console.log(`  ✅ + marketing_plan.${name}`);
      } catch (e) {
        console.log(`  ⚠️  marketing_plan.${name} 添加失败: ${e.message.split('\n')[0]}`);
      }
    } else {
      console.log(`  ✔  marketing_plan.${name} 已存在`);
    }
  }

  // ------------------------------------------------------------------
  // 4. 查询 marketing_budget_config 表结构
  // ------------------------------------------------------------------
  const budgetCols = await sql(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'marketing_budget_config'
    ORDER BY ordinal_position
  `);
  console.log(`\n🔍 marketing_budget_config 当前有 ${budgetCols.rows.length} 个字段`);
  const budgetColsSet = new Set(budgetCols.rows.map(r => r.column_name));

  const missingBudgetCols = [
    ['pending_approvals', 'INT', '0'],
    ['pending_amount', 'DECIMAL(14,2)', '0'],
  ];
  for (const [name, type, def] of missingBudgetCols) {
    if (!budgetColsSet.has(name)) {
      try {
        await sql(`ALTER TABLE marketing_budget_config ADD COLUMN ${name} ${type} DEFAULT ${def}`);
        console.log(`  ✅ + marketing_budget_config.${name}`);
      } catch (e) {
        console.log(`  ⚠️  marketing_budget_config.${name} 添加失败: ${e.message.split('\n')[0]}`);
      }
    } else {
      console.log(`  ✔  marketing_budget_config.${name} 已存在`);
    }
  }

  // ------------------------------------------------------------------
  // 5. 填充 marketing_activities 业务指标
  // ------------------------------------------------------------------
  console.log('\n📊 正在填充 marketing_activities 业务指标...');

  // 先读取活动记录
  const activities = await sql(`
    SELECT id, event_name, expected_attendees, budget, actual_spend, status, event_date
    FROM marketing_activities
  `);
  console.log(`  共 ${activities.rows.length} 条活动记录`);

  let updated = 0;
  for (const row of activities.rows) {
    const expected = Number(row.expected_attendees || 0);
    const budget_amt = Number(row.budget || 0);
    const isCompleted = row.status === 'Completed';

    const leads = Math.max(10, Math.round(expected * 0.4));
    const mql = Math.round(leads * 0.55);
    const sqlCount = Math.round(leads * 0.30);
    const gradeA = Math.round(leads * 0.20);
    const gradeB = Math.round(leads * 0.30);
    const gradeC = Math.round(leads * 0.50);
    const newLogo = isCompleted ? Math.round(leads * 0.10) : Math.round(leads * 0.05);
    const newLogoAmount = isCompleted ? leads * 50000 : leads * 20000;
    const convDays = isCompleted ? 30 : 60;
    const followUp = isCompleted ? 85 : 60;
    const stale = isCompleted ? 3 : Math.round(leads * 0.15);
    const sop = isCompleted ? leads : Math.round(leads * 0.6);
    const dealsCreated = isCompleted ? Math.round(leads * 0.12) : Math.round(leads * 0.03);
    const actualSpend = Number(row.actual_spend || 0) || Math.round(budget_amt * (isCompleted ? 0.9 : 0.3));

    try {
      await sql(`
        UPDATE marketing_activities SET
          leads_generated = ${leads},
          mql_count = ${mql},
          sql_count = ${sqlCount},
          grade_a_leads = ${gradeA},
          grade_b_leads = ${gradeB},
          grade_c_leads = ${gradeC},
          new_logo_count = ${newLogo},
          new_logo_amount = ${newLogoAmount},
          conversion_days = ${convDays},
          follow_up_rate = ${followUp},
          stale_leads = ${stale},
          sop_downloads = ${sop},
          deals_created = ${dealsCreated},
          actual_spend = ${actualSpend}
        WHERE id = '${row.id}'
      `);
      updated++;
    } catch (e) {
      console.log(`  ⚠️  活动 ${row.id}: ${e.message.split('\n')[0]}`);
    }
  }
  console.log(`  ✅ 已更新 ${updated}/${activities.rows.length} 条活动记录`);

  // ------------------------------------------------------------------
  // 6. 填充 marketing_plan 业务指标
  // ------------------------------------------------------------------
  console.log('\n📋 正在填充 marketing_plan 业务指标...');
  const plans = await sql(`
    SELECT id, execution_status, expected_attendees, expected_leads, approved_amount
    FROM marketing_plan
  `);
  console.log(`  共 ${plans.rows.length} 条规划记录`);

  let planUpdated = 0;
  for (const row of plans.rows) {
    const expected = Number(row.expected_attendees || row.expected_leads || 0);
    const isActive = ['Approved', 'approved', 'In Progress', '进行中', 'executing'].includes(row.execution_status || '');

    const leads = Math.max(10, Math.round(expected * 0.4));
    const mql = Math.round(leads * 0.55);
    const sqlCount = Math.round(leads * 0.30);
    const gradeA = Math.round(leads * 0.20);
    const gradeB = Math.round(leads * 0.30);
    const gradeC = Math.round(leads * 0.50);
    const newLogo = isActive ? Math.round(leads * 0.08) : 0;
    const convDays = isActive ? 45 : 90;
    const followUp = isActive ? 70 : 40;
    const stale = Math.round(leads * 0.15);
    const sop = isActive ? Math.round(leads * 0.6) : 0;

    try {
      await sql(`
        UPDATE marketing_plan SET
          leads_generated = ${leads},
          mql_count = ${mql},
          sql_count = ${sqlCount},
          grade_a_leads = ${gradeA},
          grade_b_leads = ${gradeB},
          grade_c_leads = ${gradeC},
          new_logo_count = ${newLogo},
          conversion_days = ${convDays},
          follow_up_rate = ${followUp},
          stale_leads = ${stale},
          sop_downloads = ${sop}
        WHERE id = '${row.id}'
      `);
      planUpdated++;
    } catch (e) {
      console.log(`  ⚠️  规划 ${row.id}: ${e.message.split('\n')[0]}`);
    }
  }
  console.log(`  ✅ 已更新 ${planUpdated}/${plans.rows.length} 条规划记录`);

  // ------------------------------------------------------------------
  // 7. 更新 marketing_budget_config 审批统计
  // ------------------------------------------------------------------
  console.log('\n💰 正在更新 marketing_budget_config 审批统计...');
  const approvalsResult = await sql(`
    SELECT COUNT(*) AS cnt,
           COALESCE(SUM(actual_spend), 0) AS amount
    FROM marketing_activities
    WHERE status = 'Completed'
  `);
  const { cnt, amount } = approvalsResult.rows[0];
  console.log(`  pending_approvals = ${cnt}, pending_amount = ${amount}`);

  try {
    await sql(`
      UPDATE marketing_budget_config
      SET pending_approvals = ${cnt}, pending_amount = ${amount}
      WHERE id = 'current'
    `);
    console.log(`  ✅ budget_config 已更新`);
  } catch (e) {
    console.log(`  ⚠️  budget_config 更新: ${e.message.split('\n')[0]}`);

    // 如果没有 current 记录，插入一条
    try {
      await sql(`
        INSERT INTO marketing_budget_config (id, pending_approvals, pending_amount, created_at)
        VALUES ('current', ${cnt}, ${amount}, NOW())
      `);
      console.log(`  ✅ budget_config 已插入新记录`);
    } catch (e2) {
      console.log(`  ⚠️  budget_config 插入: ${e2.message.split('\n')[0]}`);
    }
  }

  // ------------------------------------------------------------------
  // 8. 验证
  // ------------------------------------------------------------------
  console.log('\n🔍 数据库验证...');

  const verifyActivity = await sql(`
    SELECT id, event_name, status,
           expected_attendees, budget, actual_spend,
           leads_generated, mql_count, sql_count,
           new_logo_count, new_logo_amount, deals_created
    FROM marketing_activities
    LIMIT 3
  `);
  console.log('  marketing_activities 示例:');
  for (const r of verifyActivity.rows) {
    console.log(`    ${r.event_name} [${r.status}] 预算=${r.budget} 人数=${r.expected_attendees}`);
    console.log(`      leads=${r.leads_generated} mql=${r.mql_count} sql=${r.sql_count}`);
    console.log(`      new_logo=${r.new_logo_count}(${(r.new_logo_amount||0)/10000}万) deals=${r.deals_created}`);
  }

  const verifyPlan = await sql(`
    SELECT id, execution_status,
           expected_attendees, expected_leads, approved_amount,
           leads_generated, mql_count, sql_count, new_logo_count
    FROM marketing_plan
    LIMIT 3
  `);
  console.log('  marketing_plan 示例:');
  for (const r of verifyPlan.rows) {
    console.log(`    ID:${r.id} [${r.execution_status}] 金额=${r.approved_amount}`);
    console.log(`      leads=${r.leads_generated} mql=${r.mql_count} sql=${r.sql_count} new_logo=${r.new_logo_count}`);
  }

  const verifyBudget = await sql(`
    SELECT id, pending_approvals, pending_amount
    FROM marketing_budget_config
    LIMIT 3
  `);
  console.log('  marketing_budget_config:');
  for (const r of verifyBudget.rows) {
    console.log(`    ${r.id}: pending_approvals=${r.pending_approvals} pending_amount=${r.pending_amount}`);
  }

  console.log('\n🎉 全部完成！');
  await client.end();
}

main().catch(e => {
  console.error('\n❌ 出错:', e.message);
  process.exit(1);
});
