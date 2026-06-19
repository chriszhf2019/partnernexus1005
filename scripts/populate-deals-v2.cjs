/**
 * 优化版数据填充 - 用合理的业务基准
 * 
 * 业务基准（基于软件行业营销数据）：
 * - Completed 活动: 线索→商机转化率 = 25%
 * - In Progress 活动: 线索→商机转化率 = 10%
 * - Planning 活动: 线索→商机转化率 = 5%
 * - 商机平均金额 = ¥500,000 (行业合理值)
 * - 新客户比例 = 30% (Completed) / 20% (In Progress) / 10% (Planning)
 * - 新客户商机平均金额 = ¥800,000 (新客户通常项目较大)
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ezkbjufluczpxdixplxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTAwOTQsImV4cCI6MjA5NDk2NjA5NH0.r_uQ3zagzrwixTNL-nt04uzEWfae333_rUViNyiwNJw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 业务基准常量
const INDUSTRY_AVG_DEAL_VALUE = 500000;       // 平均商机金额 ¥50万
const INDUSTRY_NEW_LOGO_RATIO_COMPLETED = 0.30;  // Completed: 30% 是新客户
const INDUSTRY_NEW_LOGO_RATIO_PROGRESS = 0.20;   // In Progress: 20%
const INDUSTRY_NEW_LOGO_RATIO_PLANNING = 0.10;   // Planning: 10%
const INDUSTRY_NEW_LOGO_VALUE = 800000;          // 新客户平均商机 ¥80万
const CONVERSION_RATE_COMPLETED = 0.25;          // Completed: 25% 线索→商机
const CONVERSION_RATE_PROGRESS = 0.10;           // In Progress: 10%
const CONVERSION_RATE_PLANNING = 0.05;           // Planning: 5%

async function main() {
  const { data: activities } = await supabase.from('marketing_activities').select('*');
  const { data: plans } = await supabase.from('marketing_plan').select('*');

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│  基于业务基准填充活动数据                                      │');
  console.log('│  商机平均金额: ¥500,000 | 新客户平均商机: ¥800,000              │');
  console.log('│  Completed活动: 25% 转化率, 30% 新客户 | In Progress: 10%, 20% │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  let totalLeads = 0, totalDeals = 0, totalDealsAmount = 0;
  let totalNewLogo = 0, totalNewLogoAmount = 0;

  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    const leads = Number(a.leads_generated || 0);
    const status = a.status;
    const isCompleted = status === 'Completed';
    const isInProgress = status === 'In Progress';

    // 商机数: 优先用 matching plan 的 actual_opps，否则按转化率估算
    let dealsCount = 0;
    const matchingPlan = plans.find(p => {
      const planLeads = Number(p.actual_leads || p.expected_attendees || 0);
      const nameMatch = a.name.includes(p.activity_type) || a.name.includes(p.category);
      const leadsMatch = Math.abs(planLeads - leads) < 10 && leads > 0;
      return nameMatch || leadsMatch;
    });

    if (matchingPlan && matchingPlan.actual_opps) {
      dealsCount = Number(matchingPlan.actual_opps || 0);
    } else if (isCompleted) {
      dealsCount = Math.max(1, Math.round(leads * CONVERSION_RATE_COMPLETED));
    } else if (isInProgress) {
      dealsCount = Math.max(1, Math.round(leads * CONVERSION_RATE_PROGRESS));
    } else {
      dealsCount = Math.max(1, Math.round(leads * CONVERSION_RATE_PLANNING));
    }

    const dealsAmount = dealsCount * INDUSTRY_AVG_DEAL_VALUE;

    // 新客户数 = 商机数 × 新客户比例
    let newLogoCount = 0;
    if (isCompleted) newLogoCount = Math.max(0, Math.round(dealsCount * INDUSTRY_NEW_LOGO_RATIO_COMPLETED));
    else if (isInProgress) newLogoCount = Math.max(0, Math.round(dealsCount * INDUSTRY_NEW_LOGO_RATIO_PROGRESS));
    else newLogoCount = Math.max(0, Math.round(dealsCount * INDUSTRY_NEW_LOGO_RATIO_PLANNING));

    const newLogoAmount = newLogoCount * INDUSTRY_NEW_LOGO_VALUE;

    console.log(`  [${i+1}] ${a.name} [${status}]`);
    console.log(`       线索: ${leads} → 商机: ${dealsCount} (¥${(dealsAmount/10000).toFixed(0)}万)`);
    console.log(`       新客户: ${newLogoCount} (¥${(newLogoAmount/10000).toFixed(0)}万)`);

    totalLeads += leads;
    totalDeals += dealsCount;
    totalDealsAmount += dealsAmount;
    totalNewLogo += newLogoCount;
    totalNewLogoAmount += newLogoAmount;

    // 更新数据库
    await supabase.from('marketing_activities').update({
      deals_created: dealsCount,
      deals_amount: dealsAmount,
      new_logo_count: newLogoCount,
      new_logo_amount: newLogoAmount,
    }).eq('id', a.id);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  汇总:`);
  console.log(`    总线索: ${totalLeads}`);
  console.log(`    商机总数: ${totalDeals} (转化率: ${(totalDeals/totalLeads*100).toFixed(1)}%)`);
  console.log(`    商机金额: ¥${(totalDealsAmount/10000).toFixed(0)}万`);
  console.log(`    新客户数: ${totalNewLogo}`);
  console.log(`    新客户订单金额: ¥${(totalNewLogoAmount/10000).toFixed(0)}万`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n✅ 数据填充完成！');
}

main().catch(e => { console.error('\n❌ 出错:', e.message); process.exit(1); });
