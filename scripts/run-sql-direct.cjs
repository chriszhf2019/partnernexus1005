const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(msg, color) {
  const c = color || 'reset';
  console.log(`${colors[c]}${msg}${colors.reset}`);
}

// SQL 语句列表
const SQL_STATEMENTS = [
  // 合作伙伴表扩展
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active'",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS next_action TEXT",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS onboarding_completion INT DEFAULT 0",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS active_deals_count INTEGER DEFAULT 0",

  // 商机表扩展
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Registered'",
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0",
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS conversion_probability DECIMAL(5,2) DEFAULT 0.25",
  "ALTER TABLE deals ADD COLUMN IF NOT EXISTS weighted_value DECIMAL(15,2) DEFAULT 0",

  // 激励计划表扩展
  "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active'",
  "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
  "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0",
  "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",
  "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS budget_utilization_rate DECIMAL(5,2) DEFAULT 0",
  "ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0",

  // 培训认证表扩展
  "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Enrolling'",
  "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
  "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0",
  "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",
  "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0",
  "ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0",

  // 培训报名表扩展
  "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS enrollment_stage TEXT DEFAULT 'enrolled'",
  "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
  "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_score INTEGER",
  "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_passed BOOLEAN DEFAULT false",
  "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ",
  "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_expires_at TIMESTAMPTZ",
  "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_id TEXT",
  "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_id UUID",
  "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_name TEXT",
  "ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",

  // 营销活动表扩展
  "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Planning'",
  "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
  "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0",
  "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80",
  "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS registered_attendees INTEGER DEFAULT 0",
  "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS checked_in_attendees INTEGER DEFAULT 0",
  "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lead_conversion_rate DECIMAL(5,2) DEFAULT 0",
  "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS deal_conversion_count INTEGER DEFAULT 0",
  "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS total_deal_value_generated DECIMAL(15,2) DEFAULT 0",
  "ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0",

  // 活动参会者扩展
  "ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS attendee_lifecycle_stage TEXT DEFAULT 'registered'",
  "ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()",
  "ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50",
  "ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS follow_up_assigned_to TEXT",
  "ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS follow_up_notes TEXT",
  "ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS deal_id UUID",

  // exec 函数
  "CREATE OR REPLACE FUNCTION exec(query text) RETURNS void AS $$ BEGIN EXECUTE query; END; $$ LANGUAGE plpgsql SECURITY DEFINER"
];

const VERIFY_TABLES = ['partners', 'deals', 'incentive_programs', 'certification_programs',
  'user_enrollments', 'marketing_activities', 'campaign_attendees'];

async function main() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.argv[2];

  log('\n═══════════════════════════════════════════', 'blue');
  log('🚀 生命周期系统 SQL 迁移执行器', 'magenta');
  log('═══════════════════════════════════════════\n', 'blue');

  if (!dbPassword) {
    log('❌ 错误：未提供数据库密码！', 'red');
    log('\n用法:', 'yellow');
    log('   SUPABASE_DB_PASSWORD="你的密码" node scripts/run-sql-direct.cjs', 'reset');
    log('   或:', 'reset');
    log('   node scripts/run-sql-direct.cjs "你的密码"\n', 'reset');
    log('💡 从 Supabase Dashboard 获取密码:', 'cyan');
    log('   https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu/settings/database\n', 'reset');
    process.exit(1);
  }

  const config = {
    host: 'db.ezkbjufluczpxdixplxu.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  };

  log(`🔌 正在连接: ${config.host}`, 'blue');
  log(`   数据库: ${config.database}, 用户: ${config.user}`, 'cyan');

  const client = new Client(config);

  try {
    await client.connect();
    log('✅ 连接成功！\n', 'green');

    // 执行 SQL 语句
    log(`📊 开始执行 ${SQL_STATEMENTS.length} 条 SQL 语句...\n`, 'blue');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < SQL_STATEMENTS.length; i++) {
      const stmt = SQL_STATEMENTS[i];
      try {
        await client.query(stmt);
        log(`✅ [${i + 1}/${SQL_STATEMENTS.length}] ${stmt.substring(0, 70)}...`, 'green');
        successCount++;
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('already exists') || msg.includes('column of relation')) {
          log(`⚠  [${i + 1}/${SQL_STATEMENTS.length}] 已存在，跳过: ${stmt.substring(0, 60)}`, 'yellow');
          skipCount++;
        } else {
          log(`❌ [${i + 1}/${SQL_STATEMENTS.length}] ${msg}`, 'red');
          errorCount++;
        }
      }
    }

    log('\n═══════════════════════════════════════════', 'blue');
    log('📊 执行结果统计', 'blue');
    log('═══════════════════════════════════════════', 'blue');
    log(`✅ 成功: ${successCount} 条`, 'green');
    log(`⚠  跳过: ${skipCount} 条 (已存在)`, 'yellow');
    log(`❌ 失败: ${errorCount} 条`, errorCount > 0 ? 'red' : 'green');
    log('═══════════════════════════════════════════\n', 'blue');

    // 验证
    log('🔍 验证各表的生命周期字段...\n', 'blue');

    for (const table of VERIFY_TABLES) {
      try {
        const result = await client.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
          [table]
        );
        const columns = result.rows.map(r => r.column_name);
        const lifecycleCols = columns.filter(c =>
          c.includes('lifecycle') || c.includes('stage_entered') || c.includes('health') ||
          c.includes('onboarding') || c.includes('enrollment_stage') || c.includes('attendee_lifecycle')
        );
        log(`   ✅ ${table}: ${lifecycleCols.length} 个生命周期字段 (${lifecycleCols.join(', ')})`, 'green');
      } catch (err) {
        log(`   ❌ ${table}: ${err.message}`, 'red');
      }
    }

    log('\n🎉 所有操作完成！\n', 'magenta');

  } catch (err) {
    log(`\n❌ 发生错误: ${err.message}`, 'red');
    if (err.message.includes('password authentication')) {
      log('\n💡 密码验证失败，请确认密码是否正确。', 'yellow');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
