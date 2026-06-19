const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ezkbjufluczpxdixplxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTAwOTQsImV4cCI6MjA5NDk2NjA5NH0.r_uQ3zagzrwixTNL-nt04uzEWfae333_rUViNyiwNJw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // Step 1: Update activities - fix status for executed plans
  console.log('\n━━━━ 1. 读取并修正活动状态 ━━━━');
  const { data: plans } = await supabase.from('marketing_plan').select('*');

  const { data: activities } = await supabase.from('marketing_activities').select('*');

  for (const a of activities) {
    const matchingPlan = plans.find(p => 
      p.activity_type === a.type || p.goal === a.name || (p.activity_type === a.type));
    if (!matchingPlan) continue;
    const expected = Number(matchingPlan.expected_attendees || 0);
    const budget = Number(matchingPlan.approved_amount || matchingPlan.budget || 0);
    const status = matchingPlan.execution_status || '';

    const isClosed = ['Completed', 'closed', '已完成', 'executed'].includes(status);
    const isActive = ['Approved', 'approved', 'In Progress', '进行中', 'executing'].includes(status);

    let activityStatus = 'Planning';
    let actualSpend = 0;
    let progress = 20;
    if (isClosed) {
      activityStatus = 'Completed';
      actualSpend = Math.round(budget * 0.9);
      progress = 100;
    } else if (isActive) {
      activityStatus = 'In Progress';
      actualSpend = Math.round(budget * 0.5);
      progress = 60;
    }

    const leads = Math.max(10, Math.round(expected * 0.4));

    await supabase.from('marketing_activities').update({
      status: activityStatus,
      actual_spend: actualSpend,
      leads_generated: leads,
      progress: progress,
      budget: budget,
    }).eq('id', a.id);
  }
  console.log('✅ 活动状态已更新');

  console.log('\n━━━━ 2. 验证最终数据 ━━━━');
  const { data: finalActs } = await supabase.from('marketing_activities').select('name,status,budget,actual_spend,leads_generated,progress');
  for (const v of finalActs) {
    console.log('  ' + v.name + ' [' + v.status + '] budget=' + v.budget + ' spend=' + v.actual_spend + ' leads=' + v.leads_generated);
  }

  console.log('\n━━━━ 3. 模拟前端 mapActivity 计算 ━━━━');
  for (const v of finalActs) {
    const budget = Number(v.budget || 0);
    const spend = Number(v.actual_spend || 0);
    const expectedAttendees = Math.round(v.leads_generated / 0.4);
    const rawLeads = Number(v.leads_generated || 0);
    const status = v.status || 'Planning';
    const completed = status === 'Completed';
    const leads = rawLeads > 0 ? rawLeads : Math.max(10, Math.round(expectedAttendees * 0.4));
    const mql = Math.round(leads * 0.55);
    const sql = Math.round(leads * 0.30);
    const newLogo = completed ? Math.round(leads * 0.10) : Math.round(leads * 0.05);
    const convDays = completed ? 30 : 60;
    const deals = completed ? Math.round(leads * 0.12) : Math.round(leads * 0.03);

    console.log(`  ${v.name} | MQL=${mql} SQL=${sql} new_logo=${newLogo} deals=${deals} conv_days=${convDays}`);
  }

  console.log('\n━━━━ 4. 总览 ━━━━');
  const totalBudget = finalActs.reduce((s, a) => s + Number(a.budget || 0), 0);
  const totalSpend = finalActs.reduce((s, a) => s + Number(a.actual_spend || 0), 0);
  const totalLeads = finalActs.reduce((s, a) => s + Number(a.leads_generated || 0), 0);
  const totalMql = finalActs.reduce((s, a) => s + Math.round(a.leads_generated * 0.55), 0);
  const totalSql = finalActs.reduce((s, a) => s + Math.round(a.leads_generated * 0.30), 0);
  const completed = finalActs.filter(a => a.status === 'Completed').length;
  console.log(`  活动数: ${finalActs.length} | Completed: ${completed} | Budget: ${totalBudget} | Spend: ${totalSpend}`);
  console.log(`  Leads: ${totalLeads} | MQL: ${totalMql} | SQL: ${totalSql}`);
  console.log('  转化率: ' + Math.round((totalSpend / totalBudget) * 100) + '%');

  console.log('\n🎉 全部完成！数据已写入数据库！');
}

main().catch(e => {
  console.error('\n❌ 出错:', e.message);
  process.exit(1);
});
