const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ezkbjufluczpxdixplxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTAwOTQsImV4cCI6MjA5NDk2NjA5NH0.r_uQ3zagzrwixTNL-nt04uzEWfae333_rUViNyiwNJw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // 1. 检查 marketing_activities 表的字段和所有数据
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│                    marketing_activities                    │');
  console.log('└─────────────────────────────────────────────────────────┘');
  const { data: activities } = await supabase.from('marketing_activities').select('*');
  console.log(`\n共 ${activities.length} 条记录\n`);
  if (activities.length > 0) {
    console.log('字段列表:', Object.keys(activities[0]).join(', '));
    console.log('');
    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      console.log(`  [${i+1}] ${a.name} | status=${a.status} | budget=${a.budget} | leads=${a.leads_generated} | deals=${a.deals_created} | actual_spend=${a.actual_spend}`);
      console.log(`       完整数据:`, JSON.stringify(a, null, 2).split('\n').map(l => '       ' + l).join('\n'));
    }
  }

  // 2. 检查 marketing_plan 表
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│                      marketing_plan                      │');
  console.log('└─────────────────────────────────────────────────────────┘');
  const { data: plans } = await supabase.from('marketing_plan').select('*');
  console.log(`\n共 ${plans.length} 条记录\n`);
  if (plans.length > 0) {
    console.log('字段列表:', Object.keys(plans[0]).join(', '));
    console.log('');
    for (let i = 0; i < plans.length; i++) {
      const p = plans[i];
      console.log(`  [${i+1}] ${p.category || p.id?.substring(0,8)} | ${p.activity_type || p.type || ''} | approved=${p.approved_amount} | leads=${p.actual_leads || p.expected_attendees} | ops=${p.actual_opps} | status=${p.execution_status || p.status}`);
    }
  }

  // 3. 检查 marketing_budget_config
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│                marketing_budget_config                   │');
  console.log('└─────────────────────────────────────────────────────────┘');
  const { data: budget } = await supabase.from('marketing_budget_config').select('*');
  console.log(`\n共 ${budget.length} 条记录`);
  for (const b of budget) {
    console.log('  ', JSON.stringify(b, null, 2).split('\n').map(l => '  ' + l).join('\n'));
  }

  // 4. 检查是否有 deals 表 (商机数据)
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log('│                        deals (商机)                      │');
  console.log('└─────────────────────────────────────────────────────────┘');
  try {
    const { data: deals, error } = await supabase.from('deals').select('count', { count: 'exact', head: true });
    console.log(`\ndeals 表存在 (count check)`);
    if (!error) {
      const { data: dealSample } = await supabase.from('deals').select('*').limit(3);
      console.log(`字段:`, dealSample && dealSample[0] ? Object.keys(dealSample[0]).join(', ') : '无数据');
      const { data: allDeals } = await supabase.from('deals').select('*').limit(5);
      if (allDeals && allDeals.length > 0) {
        for (let i = 0; i < allDeals.length; i++) {
          console.log(`  [${i+1}]`, JSON.stringify(allDeals[i], null, 2).split('\n').map(l => '  ' + l).join('\n'));
        }
      }
    }
  } catch(e) {
    console.log('  deals 表不存在或无权限');
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
