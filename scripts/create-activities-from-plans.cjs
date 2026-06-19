const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ezkbjufluczpxdixplxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTAwOTQsImV4cCI6MjA5NDk2NjA5NH0.r_uQ3zagzrwixTNL-nt04uzEWfae333_rUViNyiwNJw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log('\n━━━━ 1. 读取所有 marketing_plan ━━━━');
  const { data: plans } = await supabase.from('marketing_plan').select('*');
  for (const p of plans) {
    console.log(`  - ${p.category || '未分类'} | ${p.activity_type || '活动'} | 预算:${p.approved_amount || p.budget} | 人数:${p.expected_attendees} | 状态:${p.execution_status}`);
  }

  console.log('\n━━━━ 2. 创建 marketing_activities 活动记录 ━━━━');
  const activitiesToInsert = [];
  for (const p of plans) {
    const expected = Number(p.expected_attendees || 0);
    const budget = Number(p.approved_amount || p.budget || 0);
    const statusStr = p.execution_status || p.status || '';
    const isActive = ['Approved', 'approved', 'In Progress', '进行中', 'executing'].includes(statusStr);
    const isClosed = ['Completed', 'closed', '已完成'].includes(statusStr);

    const leads = Math.max(10, Math.round(expected * 0.4));
    let actual_spend = 0;
    if (isClosed) actual_spend = Math.round(budget * 0.9);
    else if (isActive) actual_spend = Math.round(budget * 0.5);
    else actual_spend = 0;

    const eventDate = p.expected_date || '2025-06-15';
    const name = p.goal || `${p.category || '营销'}活动 - ${p.activity_type || '联合活动'}`;
    let activityStatus = 'Planning';
    if (isClosed) activityStatus = 'Completed';
    else if (isActive) activityStatus = 'In Progress';

    let progress = 20;
    if (isClosed) progress = 100;
    else if (isActive) progress = 60;

    activitiesToInsert.push({
      name: name.substring(0, 80),
      type: p.activity_type || p.category || '活动',
      event_date: eventDate,
      status: activityStatus,
      budget: budget,
      actual_spend: actual_spend,
      leads_generated: leads,
      progress: progress,
    });
  }

  console.log(`准备插入 ${activitiesToInsert.length} 条活动记录...`);
  console.log('  第1条:', JSON.stringify(activitiesToInsert[0]));
  const { data: inserted, error: insErr } = await supabase
    .from('marketing_activities')
    .insert(activitiesToInsert)
    .select();
  if (insErr) {
    console.log('❌ 插入失败:', insErr.message);
  } else {
    console.log(`✅ 成功插入 ${inserted.length} 条活动记录`);
  }

  console.log('\n━━━━ 3. 更新 marketing_plan 实际执行字段 ━━━━');
  let planUpdates = 0;
  for (const p of plans) {
    const expected = Number(p.expected_attendees || 0);
    const approvedAmt = Number(p.approved_amount || p.budget || 0);
    const leads = Math.max(10, Math.round(expected * 0.4));
    const opps = Math.round(leads * 0.30);
    const statusStr = p.execution_status || p.status || '';
    const isActive = ['Approved', 'approved', 'In Progress', '进行中', 'executing'].includes(statusStr);
    const isClosed = ['Completed', 'closed', '已完成'].includes(statusStr);

    let actualSpend = 0;
    if (isClosed) actualSpend = Math.round(approvedAmt * 0.9);
    else if (isActive) actualSpend = Math.round(approvedAmt * 0.5);
    const budgetUtil = approvedAmt > 0 ? Math.round((actualSpend / approvedAmt) * 100) : 0;

    const update = {
      actual_leads: leads,
      actual_opps: opps,
      actual_spend: actualSpend,
      budget_utilization: budgetUtil,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('marketing_plan').update(update).eq('id', p.id);
    if (error) {
      console.log(`  ⚠️  ${p.id.substring(0, 8)}...: ${error.message}`);
    } else {
      planUpdates++;
    }
  }
  console.log(`✅ 已更新 ${planUpdates}/${plans.length} 条规划记录`);

  console.log('\n━━━━ 4. 最终验证 ━━━━');
  const { data: verifyAct } = await supabase
    .from('marketing_activities')
    .select('id,name,status,budget,actual_spend,leads_generated,progress')
    .limit(3);
  if (verifyAct) {
    for (const v of verifyAct) {
      console.log(`  ${v.name} [${v.status}] budget=${v.budget} spend=${v.actual_spend} leads=${v.leads_generated}`);
    }
  }

  console.log('\n🎉 全部完成！');
}

main().catch(e => {
  console.error('\n❌ 出错:', e.message);
  process.exit(1);
});
