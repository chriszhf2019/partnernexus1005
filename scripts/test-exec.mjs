import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aVrd26m9Gq26oBamwvtKtQ_JdQy9pNf';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  console.log('\n🔍 测试 exec 函数和可用的认证方式...\n');

  // 先用 anon key 测试
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  try {
    const { data, error } = await anonClient.rpc('exec', { query: 'SELECT 1 as test' });
    if (error) {
      console.log(`❌ anon key exec() 失败: ${error.message}`);
    } else {
      console.log(`✅ anon key exec() 成功! 结果:`, data);
    }
  } catch (e) {
    console.log(`❌ anon key 异常: ${e.message}`);
  }

  // 用 service_role key 测试（如果有）
  if (serviceRoleKey) {
    console.log('\n🔑 使用 service_role key 测试...');
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    try {
      const { data, error } = await serviceClient.rpc('exec', { query: 'SELECT 1 as test' });
      if (error) {
        console.log(`❌ service_role exec() 失败: ${error.message}`);
      } else {
        console.log(`✅ service_role exec() 成功! 结果:`, data);
      }

      // 测试 ALTER TABLE
      const { data: data2, error: error2 } = await serviceClient.rpc('exec', {
        query: `ALTER TABLE partners ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active'`
      });
      if (error2) {
        console.log(`❌ ALTER TABLE 失败: ${error2.message}`);
      } else {
        console.log(`✅ ALTER TABLE partners ADD lifecycle_stage 成功!`);
      }
    } catch (e) {
      console.log(`❌ service_role 异常: ${e.message}`);
    }
  } else {
    console.log('\n⚠️  没有 SUPABASE_SERVICE_ROLE_KEY，跳过 service_role 测试');
  }

  // 测试通过 HTTP 直接调用 SQL endpoint
  console.log('\n🌐 测试 Supabase SQL Editor API...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey || supabaseAnonKey,
        'Authorization': `Bearer ${serviceRoleKey || supabaseAnonKey}`
      },
      body: JSON.stringify({ query: 'SELECT 1 as test' })
    });
    const result = await response.json();
    console.log(`   HTTP API 状态: ${response.status}`);
    console.log(`   响应:`, JSON.stringify(result).substring(0, 200));
  } catch (e) {
    console.log(`   HTTP API 失败: ${e.message}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

test();
