import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseAnonKey = 'sb_publishable_aVrd26m9Gq26oBamwvtKtQ_JdQy9pNf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('\n🔍 检查数据库当前状态...\n');

  // 检查 partners 表的完整字段
  console.log('📋 1. Partners 表:');
  try {
    const { data } = await supabase
      .from('partners')
      .select('id, name, status, created_at')
      .limit(3);
    
    if (data) {
      console.log(`   存在，共约 ${data.length} 条记录`);
    }
  } catch (e) {
    console.log('   错误:', e.message);
  }

  // 检查有多少表可以查询
  const tablesToCheck = ['partners', 'deals', 'incentive_programs', 'certification_programs', 
    'user_enrollments', 'marketing_activities', 'campaign_attendees', 'partner_lifecycle_events'];
  
  console.log('\n📋 2. 表检查:');
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: 存在`);
      }
    } catch (e) {
      console.log(`   ❌ ${table}: ${e.message}`);
    }
  }

  // 检查是否有任何 RPC 函数可以调用
  console.log('\n📋 3. 可用的 RPC 函数检查:');
  const rpcFunctions = ['exec', 'exec_sql', 'run_sql', 'execute_sql'];
  for (const func of rpcFunctions) {
    try {
      const { error } = await supabase.rpc(func, { query: 'SELECT 1' });
      if (error) {
        console.log(`   ❌ ${func}: ${error.message}`);
      } else {
        console.log(`   ✅ ${func}: 可用！`);
      }
    } catch (e) {
      console.log(`   ❌ ${func}: ${e.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('⚠️  需要手动在 Supabase Dashboard 中创建 exec_sql 函数:');
  console.log('');
  console.log('   1. 访问: https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu');
  console.log('   2. 打开 SQL Editor');
  console.log('   3. 执行以下 SQL 创建 exec_sql 函数:');
  console.log('');
  console.log('   CREATE OR REPLACE FUNCTION exec_sql(query text)');
  console.log('   RETURNS void AS $$');
  console.log('   BEGIN');
  console.log('     EXECUTE query;');
  console.log('   END;');
  console.log('   $$ LANGUAGE plpgsql SECURITY DEFINER;');
  console.log('');
  console.log('   4. 然后执行 LIFECYCLE_SQL_EXECUTE.sql 中的所有 ALTER TABLE 语句');
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

checkDatabase();
