# 活动执行过程优化 - 部署指南

## 更新状态
✅ 代码已完成并提交到本地仓库

## 需要执行的步骤

### 1. 数据库更新（重要！）

请在Supabase SQL Editor中执行以下SQL：

```sql
-- 活动执行阶段扩展功能SQL脚本

-- 1. 创建阶段日志表
CREATE TABLE IF NOT EXISTS marketing_phase_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  operator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建附件表
CREATE TABLE IF NOT EXISTS marketing_phase_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'file',
  url TEXT,
  file_type TEXT,
  size INT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_activity ON marketing_phase_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_phase ON marketing_phase_logs(phase_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_created ON marketing_phase_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_attachments_phase ON marketing_phase_attachments(phase_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_attachments_activity ON marketing_phase_attachments(activity_id);

-- 4. 添加阶段备注字段
ALTER TABLE marketing_execution_phases ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. 添加负责人字段
ALTER TABLE marketing_execution_phases ADD COLUMN IF NOT EXISTS responsible_person TEXT;
```

### 2. 部署网站

**方式A：通过GitHub自动部署（推荐）**
1. 在本地执行：`git push origin main`
2. GitHub Actions将自动构建并部署

**方式B：手动部署到Vercel**
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd /Volumes/z/101/partner-management-1-main
vercel --prod
```

**方式C：手动部署到其他服务器**
```bash
# 构建
npm run build

# 将dist文件夹内容上传到服务器
scp -r dist/* user@server:/var/www/html/
```

## 新功能说明

### 执行阶段工作流
- **时间轴导航**：左侧垂直时间轴显示5个阶段，颜色区分状态
- **折叠面板**：默认展开当前进行中阶段，其他收起
- **任务清单**：看板化显示任务、负责人、截止日期、状态
- **快速添加**：每个阶段可快速添加任务，支持预设模板
- **自动提示**：阶段所有任务完成时提示开启下一阶段
- **文件关联**：每个阶段可添加附件和链接
- **动态日志**：右侧显示最近操作记录

### 预设任务模板
系统为每个阶段预设了标准化任务：
- 活动前准备：物料清单确认、场地合同签署、PPT初稿完成等
- 宣传推广：公众号推文撰写、海报设计定稿、邮件邀请发送等
- 客户邀请：邀请函发送、回执确认、VIP客户跟进等
- 活动执行：签到管理、现场摄影、互动环节等
- 活动收尾：场地恢复、照片整理、感谢邮件等

## 访问地址

生产环境：https://partner.velolabs.top
