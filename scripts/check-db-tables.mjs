import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aVrd26m9Gq26oBamwvtKtQ_JdQy9pNf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 查询当前数据库中的表');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('🔌 使用 Supabase URL:', supabaseUrl);
  console.log('🔑 使用 anon key:', supabaseAnonKey.substring(0, 20) + '...\n');

  try {
    // 1. 检查合作伙伴表
    console.log('📋 检查核心业务表...\n');

    const coreTables = [
      'partners', 'deals', 'partner_contacts', 'mdf_allocations',
      'incentive_programs', 'marketing_activities', 'mp_events', 'mp_users',
      'campaign_attendees', 'campaign_registrations',
      'certification_programs', 'user_enrollments',
      'partner_lifecycle_events', 'deal_lifecycle_events',
      'incentive_lifecycle_events', 'training_lifecycle_events',
      'campaign_lifecycle_events'
    ];

    const results = [];
    for (const table of coreTables) {
      try {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          results.push({ table, status: '❌ 不存在', error: error.message });
        } else {
          results.push({ table, status: '✅ 存在', count: data?.[0]?.count || 0 });
        }
      } catch (e) {
        results.push({ table, status: '❌ 不存在', error: e.message });
      }
    }

    console.log('\n📊 表状态统计:');
    console.log('═══════════════════════════════════════════════════════════════');

    const existing = results.filter(r => r.status.includes('存在'));
    const missing = results.filter(r => !r.status.includes('存在'));

    console.log(`\n✅ 已存在的表: ${existing.length} 个`);
    existing.forEach(r => console.log(`   • ${r.table}`));

    console.log(`\n❌ 缺失的表: ${missing.length} 个`);
    missing.forEach(r => console.log(`   • ${r.table}`));

    console.log('\n═══════════════════════════════════════════════════════════════');

    if (missing.length > 0) {
      console.log('\n💡 提示: 需要执行 SQL 迁移来创建缺失的表。');
      console.log('   执行命令: SUPABASE_DB_PASSWORD="your-password" node scripts/run-sql.cjs <sql-file>');
      console.log('   示例: SUPABASE_DB_PASSWORD="your-password" node scripts/run-sql.cjs supabase/migrations/20250615000002_lifecycle_system_v2.sql');
      console.log('\n   你也可以:');
      console.log('   1. 访问 https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu');
      console.log('   2. 打开 SQL Editor');
      console.log('   3. 直接复制粘贴 SQL 文件内容执行\n');
    } else {
      console.log('\n🎉 所有核心表都已存在！\n');
    }

  } catch (err) {
    console.error('\n❌ 查询失败:', err.message);
    process.exit(1);
  }
}

checkTables();
