/**
 * Production Setup Script
 *
 * Usage:
 *   SUPABASE_URL=https://ezkbjufluczpxdixplxu.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx \
 *   npx tsx scripts/setup-production.ts
 *
 * This script:
 * 1. Creates 5 test user accounts
 * 2. Seeds the settings table with production config
 * 3. Verifies all data is accessible
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ezkbjufluczpxdixplxu.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required.');
  console.error('Get it from: https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu/settings/api');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Test Users ──────────────────────────────────────
const TEST_USERS = [
  {
    email: 'admin@partnernxus.com',
    password: 'YOUR_PASSWORD',
    display_name: '系统管理员',
    role: 'admin',
    confirm: true,
  },
  {
    email: 'channel@partnernxus.com',
    password: 'Channel@2024!',
    display_name: '渠道经理-张伟',
    role: 'channel_manager',
    confirm: true,
  },
  {
    email: 'marketing@partnernxus.com',
    password: 'Market@2024!',
    display_name: '市场经理-李婷',
    role: 'marketing_manager',
    confirm: true,
  },
  {
    email: 'partner@partnernxus.com',
    password: 'Partner@2024!',
    display_name: '合作伙伴管理员-云智联科技',
    role: 'partner_admin',
    confirm: true,
  },
  {
    email: 'sales@partnernxus.com',
    password: 'Sales@2024!',
    display_name: '合作伙伴销售-陈敏',
    role: 'partner_sales',
    confirm: true,
  },
];

// ── Settings Seed ────────────────────────────────────
const SETTINGS_DATA = {
  sections: {
    revenueAlignment: true,
    partnershipMatrix: true,
    ecosystemNetwork: true,
    mdfEfficiency: true,
  },
  partnerTiers: ['Diamond', 'Platinum', 'Gold', 'Silver', 'Registered', 'Premier', 'Standard'],
  partnerTypes: ['Reseller', 'ISV', 'SI', 'Service', 'VAD', 'VAR', 'OEM'],
  partnerStatuses: ['Cooperating', 'Inactive', 'Prospective'],
  partnerVendors: ['华为', '浪潮', '新华三', '联想', '曙光', 'Oracle', 'Microsoft', 'AWS', '阿里云', '腾讯云'],
  cooperationLevels: ['战略级', '金牌代理', '银牌代理', '认证代理', '注册代理'],
  salesStages: ['1. 需求发现', '2. 方案阶段', '3. 商务洽谈', '4. 合同签约', '5. 售后回访'],
  industries: ['金融', '医疗', '政务', '制造', '教育', '互联网', '能源'],
  regions: ['华北', '华东', '华南', '西部', '华中'],
  currency: 'CNY',
  productTypes: ['云原生平台', '大数据平台', 'AI 智算平台', '安全合规', '混合云方案', 'SaaS 应用', '运维服务'],
  ctaButtonLabel: '合作伙伴中心',
  partnerCenterUrl: 'https://www.partner-center.com',
  companyName: '星辰科技有限公司',
  companyNameEn: 'Star Technology Co., Ltd.',
  companyAddress: '北京市海淀区中关村科技园',
  companyPhone: '010-88886666',
  companyEmail: 'contact@startech.com',
  companyWebsite: 'https://www.startech.com',
  businessModel: '渠道合作伙伴关系管理（PRM），覆盖招募、赋能、激励、商机全生命周期',
  annualTarget: '¥10,000万',
  quarterlyTarget: '¥2,500万',
  partnerTarget: '新增200家',
  channelRegions: '华北、华东、华南、西部、华中',
  coreBusiness: '信创、医疗、金融、政务',
};

// ── Main ─────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting production setup...\n');

  // Step 1: Settings
  console.log('📋 Step 1/3: Seeding settings...');
  const { error: settingsError } = await supabaseAdmin
    .from('settings')
    .upsert({ id: 'global', data: SETTINGS_DATA, updated_at: new Date().toISOString() });
  if (settingsError) {
    console.error(`  ⚠️  Settings: ${settingsError.message}`);
  } else {
    console.log('  ✅ Settings configured');
  }

  // Step 2: Create users
  console.log('\n👤 Step 2/3: Creating test users...');
  for (const user of TEST_USERS) {
    try {
      // Try to get existing user by email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = (existingUsers?.users || []).find((u: any) => u.email === user.email);

      if (existing) {
        // Update existing user's password and metadata
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: user.password,
          email_confirm: true,
          user_metadata: { display_name: user.display_name, role: user.role },
        });
        console.log(`  ✅ ${user.email} (updated) → role: ${user.role}`);
      } else {
        // Create new user
        const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { display_name: user.display_name, role: user.role },
        });
        if (error) {
          console.log(`  ❌ ${user.email}: ${error.message}`);
        } else {
          console.log(`  ✅ ${user.email} (created) → role: ${user.role}`);
        }
      }
    } catch (err: any) {
      console.log(`  ❌ ${user.email}: ${err.message}`);
    }
  }

  // Step 3: Verify
  console.log('\n🔍 Step 3/3: Verifying data access...');

  const { data: partners, error: pErr } = await supabaseAdmin
    .from('partners')
    .select('id', { count: 'exact', head: true });
  console.log(`  📊 Partners: ${pErr ? 'error' : `count OK`}`);

  const { data: deals, error: dErr } = await supabaseAdmin
    .from('deals')
    .select('id', { count: 'exact', head: true });
  console.log(`  📊 Deals: ${dErr ? 'error' : 'count OK'}`);

  const { data: settings, error: sErr } = await supabaseAdmin
    .from('settings')
    .select('id')
    .eq('id', 'global')
    .single();
  console.log(`  📊 Settings: ${sErr ? 'NOT FOUND - check' : '✅ global row exists'}`);

  // List created users
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  console.log(`  👥 Total users in Auth: ${userList?.users?.length || 0}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Production setup complete!\n');
  console.log('📝 Test Accounts:');
  console.log('─'.repeat(50));
  for (const u of TEST_USERS) {
    console.log(`  ${u.role.padEnd(20)} | ${u.email.padEnd(30)} | ${u.password}`);
  }
  console.log('─'.repeat(50));
  console.log('\n🌐 App URL: https://partner-management-1-main.vercel.app');
  console.log('💡 All users have email_confirmed = true (no email check needed)\n');
}

main().catch(console.error);
