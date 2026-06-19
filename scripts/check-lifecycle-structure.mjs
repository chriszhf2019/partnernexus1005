import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aVrd26m9Gq26oBamwvtKtQ_JdQy9pNf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLifecycleStructure() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🔍 验证生命周期系统表结构');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const lifecycleTables = [
    { table: 'partner_lifecycle_events', mainTable: 'partners', stageField: 'lifecycle_stage' },
    { table: 'deal_lifecycle_events', mainTable: 'deals', stageField: 'lifecycle_stage' },
    { table: 'incentive_lifecycle_events', mainTable: 'incentive_programs', stageField: 'lifecycle_stage' },
    { table: 'training_lifecycle_events', mainTable: 'certification_programs', stageField: 'lifecycle_stage' },
    { table: 'campaign_lifecycle_events', mainTable: 'marketing_activities', stageField: 'lifecycle_stage' },
  ];

  for (const { table, mainTable, stageField } of lifecycleTables) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 检查: ${table}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      // 1. 查询事件表的行数
      const { count: eventCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      console.log(`   • 事件记录数: ${eventCount || 0}`);

      // 2. 查询主表是否有 lifecycle_stage 字段
      // 通过选择一条记录来检查
      const { data: sampleData, error: queryError } = await supabase
        .from(mainTable)
        .select('*')
        .limit(1);

      if (!queryError && sampleData && sampleData.length > 0) {
        const keys = Object.keys(sampleData[0]);
        const hasLifecycleStage = keys.some(k =>
          k.toLowerCase().includes('lifecycle') || k.toLowerCase().includes('stage')
        );
        console.log(`   • 主表字段: ${keys.length} 个字段`);
        console.log(`   • 含阶段字段: ${hasLifecycleStage ? '✅' : '⚠️  需检查'}`);
        const stageFields = keys.filter(k => k.toLowerCase().includes('stage'));
        if (stageFields.length > 0) {
          console.log(`   • 阶段字段名: ${stageFields.join(', ')}`);
        }
        // 显示前3条主表记录的相关字段
        const relevantFields = keys.filter(k =>
          k.toLowerCase().includes('stage') ||
          k.toLowerCase().includes('health') ||
          k.toLowerCase().includes('lifecycle') ||
          k === 'id' || k === 'name' || k === 'title' || k === 'status'
        );
        console.log(`   • 关键字段: ${relevantFields.join(', ')}`);

        // 显示一条示例数据的阶段/健康度值
        const sample = sampleData[0];
        const sampleValues = relevantFields.map(f => `${f}: ${JSON.stringify(sample[f])}`).join(', ');
        if (sampleValues.length > 0) {
          console.log(`   • 示例值: ${sampleValues.substring(0, 200)}...`);
        }
      } else if (queryError) {
        console.log(`   ⚠️  主表查询警告: ${queryError.message}`);
      } else {
        console.log(`   ℹ️  主表暂无数据`);
      }

    } catch (err) {
      console.log(`   ❌ 检查失败: ${err.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ 验证完成！');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

checkLifecycleStructure();
