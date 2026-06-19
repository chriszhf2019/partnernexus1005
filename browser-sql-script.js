// 在 Supabase SQL Editor 页面执行的 JavaScript
// 1. 找到编辑器并输入 SQL
// 2. 点击执行按钮

const lifecycleSql = `
-- 生命周期系统：为核心表添加阶段和健康度字段
-- 合作伙伴表扩展
ALTER TABLE partners ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE partners ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS onboarding_completion INT DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS active_deals_count INTEGER DEFAULT 0;

-- 商机表扩展
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Registered';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE deals ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS conversion_probability DECIMAL(5,2) DEFAULT 0.25;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS weighted_value DECIMAL(15,2) DEFAULT 0;

-- 激励计划表扩展
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active';
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS budget_utilization_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0;

-- 培训认证表扩展
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Enrolling';
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0;

-- 培训报名表扩展
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS enrollment_stage TEXT DEFAULT 'enrolled';
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_score INTEGER;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_passed BOOLEAN DEFAULT false;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_expires_at TIMESTAMPTZ;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_id TEXT;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_name TEXT;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;

-- 营销活动表扩展
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Planning';
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS registered_attendees INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS checked_in_attendees INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lead_conversion_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS deal_conversion_count INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS total_deal_value_generated DECIMAL(15,2) DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0;

-- 活动参会者扩展
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS attendee_lifecycle_stage TEXT DEFAULT 'registered';
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50;
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS follow_up_assigned_to TEXT;
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS deal_id UUID;

-- 创建 exec 函数（供后续 API 调用）
CREATE OR REPLACE FUNCTION exec(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

console.log('SQL 内容长度:', lifecycleSql.length);
console.log('准备执行...');

// 尝试找到编辑器输入框
let editor = null;
let textarea = null;

// 方法1: 查找 textarea
const textareas = document.querySelectorAll('textarea');
if (textareas.length > 0) {
  textarea = textareas[0];
  console.log('找到 textarea:', textarea);
}

// 方法2: 查找 CodeMirror
const cmEditors = document.querySelectorAll('.cm-editor');
if (cmEditors.length > 0) {
  editor = cmEditors[0];
  console.log('找到 CodeMirror 编辑器');
}

// 方法3: 查找 contenteditable
if (!textarea && !editor) {
  const editables = document.querySelectorAll('[contenteditable="true"]');
  console.log('找到 contenteditable 数量:', editables.length);
  if (editables.length > 0) textarea = editables[0];
}

// 输入内容
if (textarea) {
  textarea.focus();
  textarea.value = lifecycleSql;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  console.log('已输入 SQL 到 textarea');
} else if (editor) {
  // 尝试通过 CodeMirror API
  const editable = editor.querySelector('[contenteditable="true"]') || editor;
  editable.focus();
  editable.textContent = lifecycleSql;
  editable.dispatchEvent(new Event('input', { bubbles: true }));
  console.log('已输入 SQL 到 CodeMirror');
}

// 查找执行按钮
const runButton = Array.from(document.querySelectorAll('button')).find(b => {
  const txt = b.textContent?.toLowerCase() || '';
  return txt.includes('run') || txt.includes('执行') || txt.includes('▶') || txt.includes('query');
});

console.log('找到执行按钮:', runButton);

if (runButton) {
  runButton.click();
  console.log('已点击执行按钮');
} else {
  console.log('未找到执行按钮，尝试快捷键 Ctrl+Enter...');
  const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true });
  (textarea || editor || document.activeElement).dispatchEvent(event);
}

'执行完毕，请在页面查看结果';
