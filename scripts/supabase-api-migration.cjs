const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ezkbjufluczpxdixplxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTAwOTQsImV4cCI6MjA5NDk2NjA5NH0.r_uQ3zagzrwixTNL-nt04uzEWfae333_rUViNyiwNJw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // 1. 读取 marketing_activities
  console.log('\n━━━━ 1. 读取 marketing_activities ━━━━');
  const { data: activities, error: err1 } = await supabase.from('marketing_activities').select('*').limit(3);
  if (err1) {
    console.log('❌  读取失败:', err1.message);
  } else {
    console.log(`✅ 读取成功 ${activities.length} 条`);
    if (activities.length > 0) {
      console.log('字段:', Object.keys(activities[0]).join(', '));
      console.log('示例:', activities[0].event_name || activities[0].name, '|', 'status=', activities[0].status);
    }
  }

  // 2. 读取 marketing_plan
  console.log('\n━━━━ 2. 读取 marketing_plan ━━━━');
  const { data: plans, error: err2 } = await supabase.from('marketing_plan').select('*').limit(3);
  if (err2) {
    console.log('❌  读取失败:', err2.message);
  } else {
    console.log(`✅ 读取成功 ${plans.length} 条`);
    if (plans.length > 0) {
      console.log('字段:', Object.keys(plans[0]).join(', '));
    }
  }

  // 3. 读取 budget_config
  console.log('\n━━━━ 3. 读取 marketing_budget_config ━━━━');
  const { data: budget, error: err3 } = await supabase.from('marketing_budget_config').select('*');
  if (err3) {
    console.log('❌  读取失败:', err3.message);
  } else {
    console.log(`✅ 读取成功 ${budget.length} 条`);
    if (budget.length > 0) {
      console.log('字段:', Object.keys(budget[0]).join(', '));
    }
  }

  // 4. 尝试读取 activities 全量
  console.log('\n━━━━ 4. 读取全部 activities ━━━━');
  const { data: allActivities, error: err4 } = await supabase.from('marketing_activities').select('*');
  if (err4) {
    console.log('❌  读取失败:', err4.message);
  } else {
    console.log(`✅ 共 ${allActivities.length} 条活动`);
  }

  // 5. 读取 plans 全量
  console.log('\n━━━━ 5. 读取全部 plans ━━━━');
  const { data: allPlans, error: err5 } = await supabase.from('marketing_plan').select('*');
  if (err5) {
    console.log('❌  读取失败:', err5.message);
  } else {
    console.log(`✅ 共 ${allPlans.length} 条规划`);
  }

  // 6. 更新 activities 指标数据
  console.log('\n━━━━ 6. 更新 activities 业务指标 ━━━━');
  let activityUpdated = 0;
  for (const a of allActivities) {
    const expected = Number(a.expected_attendees || a.expectedAttendees || 0);
    const budget_amt = Number(a.budget || a.budget_amount || 0);
    const isCompleted = a.status === 'Completed';

    const leads = Math.max(10, Math.round(expected * 0.4));
    const mql = Math.round(leads * 0.55);
    const sqlCnt = Math.round(leads * 0.30);
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
    const actualSpend = Number(a.actual_spend || a.actualSpend || 0) || Math.round(budget_amt * (isCompleted ? 0.9 : 0.3));

    const update = {
      leads_generated: leads,
      mql_count: mql,
      sql_count: sqlCnt,
      grade_a_leads: gradeA,
      grade_b_leads: gradeB,
      grade_c_leads: gradeC,
      new_logo_count: newLogo,
      new_logo_amount: newLogoAmount,
      conversion_days: convDays,
      follow_up_rate: followUp,
      stale_leads: stale,
      sop_downloads: sop,
      deals_created: dealsCreated,
      actual_spend: actualSpend,
    };

    const { error } = await supabase.from('marketing_activities').update(update).eq('id', a.id);
    if (error) {
      console.log(`  ⚠️  ${a.id}: ${error.message}`);
    } else {
      activityUpdated++;
    }
  }
  console.log(`✅ 已更新 ${activityUpdated}/${allActivities.length} 条活动记录`);

  // 7. 更新 plans 指标数据
  console.log('\n━━━━ 7. 更新 marketing_plan 业务指标 ━━━━');
  let planUpdated = 0;
  for (const p of allPlans) {
    const expected = Number(p.expected_attendees || p.expected_leads || 0);
    const isActive = ['Approved', 'approved', 'In Progress', '进行中', 'executing'].includes(p.execution_status || p.status || '');

    const leads = Math.max(10, Math.round(expected * 0.4));
    const mql = Math.round(leads * 0.55);
    const sqlCnt = Math.round(leads * 0.30);
    const gradeA = Math.round(leads * 0.20);
    const gradeB = Math.round(leads * 0.30);
    const gradeC = Math.round(leads * 0.50);
    const newLogo = isActive ? Math.round(leads * 0.08) : 0;
    const convDays = isActive ? 45 : 90;
    const followUp = isActive ? 70 : 40;
    const stale = Math.round(leads * 0.15);
    const sop = isActive ? Math.round(leads * 0.6) : 0;

    const update = {
      leads_generated: leads,
      mql_count: mql,
      sql_count: sqlCnt,
      grade_a_leads: gradeA,
      grade_b_leads: gradeB,
      grade_c_leads: gradeC,
      new_logo_count: newLogo,
      conversion_days: convDays,
      follow_up_rate: followUp,
      stale_leads: stale,
      sop_downloads: sop,
    };

    const { error } = await supabase.from('marketing_plan').update(update).eq('id', p.id);
    if (error) {
      console.log(`  ⚠️  ${p.id}: ${error.message}`);
    } else {
      planUpdated++;
    }
  }
  console.log(`✅ 已更新 ${planUpdated}/${allPlans.length} 条规划记录`);

  // 8. 更新 budget_config 审批统计
  console.log('\n━━━━ 8. 更新 budget_config 审批统计 ━━━━');
  const completedCount = allActivities.filter(a => a.status === 'Completed').length;
  const totalSpend = allActivities
    .filter(a => a.status === 'Completed')
    .reduce((s, a) => s + Number(a.actual_spend || a.actualSpend || 0), 0);

  const { error: bcErr } = await supabase.from('marketing_budget_config').update({
    pending_approvals: completedCount,
    pending_amount: Math.round(totalSpend),
  }).eq('id', 'current');

  if (bcErr) {
    console.log('  ⚠️  更新失败:', bcErr.message);
    // 尝试插入
    const { error: insErr } = await supabase.from('marketing_budget_config').insert({
      id: 'current',
      pending_approvals: completedCount,
      pending_amount: Math.round(totalSpend),
    });
    if (insErr) {
      console.log('  ⚠️  插入失败:', insErr.message);
    } else {
      console.log('  ✅ 已插入新的 budget_config 记录');
    }
  } else {
    console.log(`  ✅ budget_config 已更新: pending_approvals=${completedCount}, pending_amount=${Math.round(totalSpend)}`);
  }

  // 9. 最终验证
  console.log('\n━━━━ 9. 最终验证 ━━━━');
  const { data: verify } = await supabase.from('marketing_activities').select('id,event_name,status,leads_generated,mql_count,sql_count,new_logo_count,new_logo_amount,deals_created').limit(3);
  if (verify && verify.length > 0) {
    for (const v of verify) {
      console.log(`  ${v.event_name || '活动'} [${v.status}] leads=${v.leads_generated} mql=${v.mql_count} sql=${v.sql_count} new_logo=${v.new_logo_count} deals=${v.deals_created}`);
    }
  }

  console.log('\n🎉 全部完成！');
}

main().catch(e => {
  console.error('\n❌ 出错:', e.message);
  process.exit(1);
});
