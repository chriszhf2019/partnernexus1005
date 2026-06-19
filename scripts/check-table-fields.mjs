import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aVrd26m9Gq26oBamwvtKtQ_JdQy9pNf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllFields() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🔍 检查主表完整字段');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const mainTables = ['partners', 'deals', 'incentive_programs', 'certification_programs', 'marketing_activities'];

  for (const table of mainTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        const fields = Object.keys(data[0]);
        console.log(`\n📋 ${table} (${fields.length} 个字段):`);
        console.log(`   ${fields.join(', ')}`);

        // 检查是否有生命周期相关字段
        const lifecycleFields = fields.filter(f =>
          f.toLowerCase().includes('lifecycle') ||
          f.toLowerCase().includes('stage') ||
          f.toLowerCase().includes('health') ||
          f.toLowerCase().includes('entered_at')
        );
        if (lifecycleFields.length > 0) {
          console.log(`   ✅ 生命周期字段: ${lifecycleFields.join(', ')}`);
        } else {
          console.log(`   ⚠️  缺少生命周期字段`);
        }

        // 显示一行示例数据
        console.log(`   📝 示例: ${JSON.stringify(data[0]).substring(0, 200)}...`);
      } else {
        console.log(`\n📋 ${table}: 表存在但暂无数据`);
      }
    } catch (err) {
      console.log(`\n❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

checkAllFields();
