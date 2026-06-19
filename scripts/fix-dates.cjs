const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ezkbjufluczpxdixplxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTAwOTQsImV4cCI6MjA5NDk2NjA5NH0.r_uQ3zagzrwixTNL-nt04uzEWfae333_rUViNyiwNJw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // 更新活动日期为2026年（当前年份）
  console.log('\n━━━━ 修复活动日期为2026年 Q2 ━━━━');
  const { data: activities } = await supabase.from('marketing_activities').select('id,event_date,name');
  
  const months = [4, 5, 6]; // Q2: 4月, 5月, 6月
  let idx = 0;
  
  for (const a of activities) {
    const month = months[idx % months.length];
    const day = Math.floor(Math.random() * 28) + 1;
    const newDate = `2026-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    await supabase.from('marketing_activities').update({
      event_date: newDate
    }).eq('id', a.id);
    
    console.log(`  ${a.name} -> ${newDate}`);
    idx++;
  }
  
  // 验证更新
  const { data: updated } = await supabase.from('marketing_activities').select('name,event_date,status,budget,leads_generated');
  console.log('\n━━━━ 验证更新结果 ━━━━');
  for (const a of updated) {
    console.log(`  ${a.name} [${a.status}] ${a.event_date} | budget=${a.budget} leads=${a.leads_generated}`);
  }
  
  console.log('\n🎉 日期已更新为2026年Q2！页面现在应该能显示数据了');
}

main().catch(e => {
  console.error('❌ 出错:', e.message);
  process.exit(1);
});
