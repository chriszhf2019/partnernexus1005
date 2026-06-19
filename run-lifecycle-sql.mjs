import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseAnonKey = 'sb_publishable_aVrd26m9Gq26oBamwvtKtQ_JdQy9pNf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAndExecute() {
  console.log('\n🔍 测试 exec_sql 函数...\n');

  // 1. 先测试 exec_sql 函数是否存在
  try {
    const { error } = await supabase.rpc('exec_sql', {
      query: 'SELECT 1 as test'
    });
    if (error) {
      console.log('❌ exec_sql 函数失败:', error.message);
    } else {
      console.log('✅ exec_sql 函数可用！\n');
    }
  } catch (e) {
    console.log('❌ exec_sql 函数异常:', e.message);
  }

  // 2. 执行生命周期字段添加
  console.log('\n🚀 开始执行生命周期 SQL 迁移...\n');
  
  const statements = [
    // Partners
    "ALTER TABLE partners ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active'",
    "ALTER TABLE partners ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
    "ALTER TABLE partners ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0",
    "ALTER TABLE partners ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",
    "ALTER TABLE partners ADD COLUMN IF NOT EXISTS next_action TEXT",
    "ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ",
    "ALTER TABLE partners ADD COLUMN IF NOT EXISTS onboarding_completion INT DEFAULT 0",
    "ALTER TABLE partners ADD COLUMN IF NOT EXISTS active_deals_count INTEGER DEFAULT 0",
    
    // Deals
    "ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Registered'",
    "ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
    "ALTER TABLE deals ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0",
    "ALTER TABLE deals ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",
    "ALTER TABLE deals ADD COLUMN IF NOT EXISTS conversion_probability DECIMAL(5,2) DEFAULT 0.25",
    "ALTER TABLE deals ADD COLUMN IF NOT EXISTS weighted_value DECIMAL(15,2) DEFAULT 0",
    
    // Incentive programs
    "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active'",
    "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
    "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0",
    "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",
    "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS budget_utilization_rate DECIMAL(5,2) DEFAULT 0",
    "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0",
    
    // Certification programs
    "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Enrolling'",
    "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
    "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0",
    "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",
    "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0",
    "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0",
    
    // User enrollments
    "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS enrollment_stage TEXT DEFAULT 'enrolled'",
    "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
    "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_score INTEGER",
    "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_passed BOOLEAN DEFAULT false",
    "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ",
    "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_expires_at TIMESTAMPTZ",
    "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_id TEXT",
    "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_id UUID",
    "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_name TEXT",
    
    // Marketing activities
    "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active'",
    "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
    "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0",
    "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",
    "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0",
    
    // Campaign attendees
    "ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS deal_id UUID",
    
    // 生命周期事件表
    "CREATE TABLE IF NOT EXISTS partner_lifecycle_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), partner_id UUID REFERENCES partners(id) ON DELETE CASCADE, from_stage TEXT, to_stage TEXT NOT NULL, event_date TIMESTAMPTZ DEFAULT NOW(), operator TEXT, event_type TEXT NOT NULL, reason TEXT, notes TEXT, related_deal_id UUID REFERENCES deals(id), duration_days_previous INTEGER, health_delta INTEGER, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW())",
    "CREATE TABLE IF NOT EXISTS deal_lifecycle_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), deal_id UUID REFERENCES deals(id) ON DELETE CASCADE, from_stage TEXT, to_stage TEXT NOT NULL, event_date TIMESTAMPTZ DEFAULT NOW(), operator TEXT, event_type TEXT NOT NULL, reason TEXT, notes TEXT, related_partner_id UUID REFERENCES partners(id), duration_days_previous INTEGER, health_delta INTEGER, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW())",
    "CREATE TABLE IF NOT EXISTS incentive_lifecycle_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), program_id UUID REFERENCES incentive_programs(id) ON DELETE CASCADE, from_stage TEXT, to_stage TEXT NOT NULL, event_date TIMESTAMPTZ DEFAULT NOW(), operator TEXT, event_type TEXT NOT NULL, reason TEXT, notes TEXT, duration_days_previous INTEGER, health_delta INTEGER, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW())",
    "CREATE TABLE IF NOT EXISTS enablement_lifecycle_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), program_id UUID REFERENCES certification_programs(id) ON DELETE CASCADE, from_stage TEXT, to_stage TEXT NOT NULL, event_date TIMESTAMPTZ DEFAULT NOW(), operator TEXT, event_type TEXT NOT NULL, reason TEXT, notes TEXT, duration_days_previous INTEGER, health_delta INTEGER, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW())",
    "CREATE TABLE IF NOT EXISTS campaign_lifecycle_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), activity_id UUID REFERENCES marketing_activities(id) ON DELETE CASCADE, from_stage TEXT, to_stage TEXT NOT NULL, event_date TIMESTAMPTZ DEFAULT NOW(), operator TEXT, event_type TEXT NOT NULL, reason TEXT, notes TEXT, duration_days_previous INTEGER, health_delta INTEGER, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW())",
  ];

  let success = 0, failed = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      if (error) {
        console.log(`   ⚠️  [${i + 1}/${statements.length}] ${error.message.substring(0, 100)}`);
        failed++;
      } else {
        const tableMatch = stmt.match(/ALTER TABLE\s+(\w+)/i);
        const colMatch = stmt.match(/ADD COLUMN IF NOT EXISTS\s+(\w+)/i);
        const createMatch = stmt.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
        
        let msg = `   ✅ [${i + 1}/${statements.length}] `;
        if (tableMatch && colMatch) {
          msg += `ALTER ${tableMatch[1]} ADD ${colMatch[1]}`;
        } else if (createMatch) {
          msg += `CREATE TABLE ${createMatch[1]}`;
        } else {
          msg += 'OK';
        }
        
        console.log(msg);
        success++;
      }
    } catch (err) {
      console.log(`   ❌ [${i + 1}/${statements.length}] ${err.message.substring(0, 100)}`);
      failed++;
    }
  }

  console.log(`\n✅ 完成: 成功 ${success} 条, 失败 ${failed} 条`);
  
  // 3. 验证
  console.log('\n📋 验证字段添加...\n');
  
  try {
    const { data } = await supabase.from('partners').select('*').limit(1);
    if (data && data.length > 0) {
      const cols = Object.keys(data[0]);
      const lifecycleCols = cols.filter(c => [
        'lifecycle_stage', 'stage_entered_at', 'days_in_current_stage', 
        'health_score', 'next_action', 'last_activity_at',
        'onboarding_completion', 'active_deals_count'
      ].includes(c));
      console.log(`   Partners 生命周期字段: ${lifecycleCols.join(', ')}`);
      console.log(`   共 ${lifecycleCols.length}/8 个 lifecycle 字段`);
    }
  } catch (e) {
    console.log('   验证失败:', e.message);
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

testAndExecute();
