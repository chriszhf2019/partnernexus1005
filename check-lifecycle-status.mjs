import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseAnonKey = 'sb_publishable_aVrd26m9Gq26oBamwvtKtQ_JdQy9pNf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('\n🔍 检查数据库状态...\n');

  // 1. 检查表数量
  console.log('📋 1. 检查现有表:');
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('count')
      .limit(1);
    if (error) {
      console.log(`   partners: ${error.message}`);
    } else {
      console.log(`   partners: 存在 (${data?.[0]?.count || '?'} 条记录)`);
    }
  } catch (e) {
    console.log(`   partners: ${e.message}`);
  }

  try {
    const { data, error } = await supabase
      .from('deals')
      .select('count')
      .limit(1);
    if (error) {
      console.log(`   deals: ${error.message}`);
    } else {
      console.log(`   deals: 存在 (${data?.[0]?.count || '?'} 条记录)`);
    }
  } catch (e) {
    console.log(`   deals: ${e.message}`);
  }

  // 2. 检查 information_schema (通过 rpc 或视图)
  console.log('\n📋 2. 检查 lifecycle_stage 字段是否存在:');
  
  try {
    // 通过查询 partners 表返回第一行，看看有什么字段
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .limit(1);
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`   partners 字段: ${columns.join(', ')}`);
      
      const lifecycleFields = [
        'lifecycle_stage', 'stage_entered_at', 'days_in_current_stage', 
        'health_score', 'next_action', 'last_activity_at'
      ];
      
      const missing = lifecycleFields.filter(f => !columns.includes(f));
      if (missing.length === 0) {
        console.log('   ✅ 所有 lifecycle 字段已存在');
      } else {
        console.log(`   ❌ 缺少字段: ${missing.join(', ')}`);
      }
    } else if (error) {
      console.log(`   错误: ${error.message}`);
    } else {
      console.log('   partners 表为空');
    }
  } catch (e) {
    console.log(`   错误: ${e.message}`);
  }

  // 3. 检查 deals 表
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .limit(1);
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`   deals 字段: ${columns.join(', ')}`);
      
      const lifecycleFields = [
        'stage', 'stage_entered_at', 'days_in_current_stage', 
        'health_score', 'conversion_probability'
      ];
      
      const missing = lifecycleFields.filter(f => !columns.includes(f));
      if (missing.length === 0) {
        console.log('   ✅ 所有 lifecycle 字段已存在');
      } else {
        console.log(`   ❌ 缺少字段: ${missing.join(', ')}`);
      }
    } else if (error) {
      console.log(`   错误: ${error.message}`);
    } else {
      console.log('   deals 表为空');
    }
  } catch (e) {
    console.log(`   错误: ${e.message}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

checkDatabase();
