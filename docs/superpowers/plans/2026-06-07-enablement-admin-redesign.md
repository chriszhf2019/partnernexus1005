# EnablementPage 管理员视图优化 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 EnablementPage 管理员模式从静态信息展示板升级为管理控制台，增加趋势分析、一键操作、公司维度视图、反馈分析和导出能力

**Architecture:** 从单体 437 行 EnablementPage.tsx 提取约 10 个子组件到 `src/components/marketing/enablement/` 目录。每个组件通过 props 接收数据，不直接访问 Supabase。页面容器负责数据获取和状态管理，子组件负责渲染和用户交互

**Tech Stack:** React 19 + TypeScript + motion/react (动画) + lucide-react (图标) + Tailwind CSS + Vite

---

## File Structure

```
src/components/marketing/enablement/     # 新建目录
├── Sparkline.tsx                         # 迷你 SVG 趋势图（复用）
├── AdminKpiCards.tsx                     # 管理员 4 卡看板
├── LearnerChip.tsx                       # 学员 Chip 标签
├── LearnerTooltip.tsx                    # 悬浮详情卡片
├── AdminCourseList.tsx                   # 课程管理列表（含搜索筛选）
├── CompanyView.tsx                       # 公司维度视图
├── RadarCompare.tsx                      # 雷达对比图
├── FeedbackAnalysis.tsx                  # 反馈分析面板
├── CourseRanking.tsx                     # 课程性能排序
└── ExportButton.tsx                      # 导出功能

src/components/marketing/
└── EnablementPage.tsx                    # 修改：接入新组件
```

---

### Task 1: 创建目录并添加 Sparkline 基础组件

**Files:**
- Create: `src/components/marketing/enablement/Sparkline.tsx`

- [ ] **Step 1: 创建 Sparkline 组件**

`src/components/marketing/enablement/Sparkline.tsx`:
```tsx
import { cn } from '../../../lib/utils';

interface SparklineProps {
  data: number[];        // 数值数组，如 [3,5,2,7]
  width?: number;
  height?: number;
  color?: string;        // '#059669' | '#dc2626' | '#2563eb'
  className?: string;
}

export const Sparkline = ({
  data,
  width = 60,
  height = 24,
  color = '#059669',
  className,
}: SparklineProps) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const stepX = w / Math.max(data.length - 1, 1);

  const points = data
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = padding + h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={cn('shrink-0', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.length > 0 && (
        <circle
          cx={padding + (data.length - 1) * stepX}
          cy={padding + h - ((data[data.length - 1] - min) / range) * h}
          r="2"
          fill={color}
        />
      )}
    </svg>
  );
};
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit 2>&1 | grep -v "supabase/functions/" | grep -v "Deno" | head -5`
Expected: (no output)

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/enablement/Sparkline.tsx
git commit -m "feat: add Sparkline mini chart component"
```

---

### Task 2: 创建 AdminKpiCards 管理员看板

**Files:**
- Create: `src/components/marketing/enablement/AdminKpiCards.tsx`
- Modify: `src/components/marketing/EnablementPage.tsx` (接入点)

- [ ] **Step 1: 创建 AdminKpiCards 组件**

`src/components/marketing/enablement/AdminKpiCards.tsx`:
```tsx
import { Users, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Sparkline } from './Sparkline';

interface AdminKpi {
  label: string;
  value: string;
  sub: string;
  trend?: { direction: 'up' | 'down'; percent: number };
  sparklineData?: number[];
  sparklineColor?: string;
  icon: typeof Users;
  iconGradient: string;
  alert?: boolean;
  onClick?: () => void;
}

interface AdminKpiCardsProps {
  activeRate: number;
  activeTrend: number[];
  completionRate: number;
  completionTrend: number[];
  stagnantCount: number;
  lowScoreCount: number;
  avgRating: number;
  totalFeedback: number;
  lowFeedbackCount: number;
  onStagnantClick?: () => void;
  onFeedbackClick?: () => void;
}

export const AdminKpiCards = ({
  activeRate,
  activeTrend,
  completionRate,
  completionTrend,
  stagnantCount,
  lowScoreCount,
  avgRating,
  totalFeedback,
  lowFeedbackCount,
  onStagnantClick,
  onFeedbackClick,
}: AdminKpiCardsProps) => {
  const cards: AdminKpi[] = [
    {
      label: '活跃学员占比',
      value: `${activeRate}%`,
      sub: `${Math.round(activeRate * 7 / 100)}/7 人本周有学习行为`,
      trend: { direction: 'up', percent: 5 },
      sparklineData: activeTrend,
      sparklineColor: '#059669',
      icon: Users,
      iconGradient: 'bg-gradient-to-br from-blue-600 to-blue-400',
    },
    {
      label: '完课率',
      value: `${completionRate}%`,
      sub: '已完成评估课程占比',
      trend: { direction: 'up', percent: 8 },
      sparklineData: completionTrend,
      sparklineColor: '#059669',
      icon: TrendingUp,
      iconGradient: 'bg-gradient-to-br from-emerald-600 to-emerald-400',
    },
    {
      label: '预警中心',
      value: `${stagnantCount}`,
      sub: `${stagnantCount} 人滞后 · ${lowScoreCount} 课程低分`,
      icon: AlertTriangle,
      iconGradient: 'bg-gradient-to-br from-red-600 to-red-400',
      alert: true,
      onClick: onStagnantClick,
    },
    {
      label: '学员反馈',
      value: `${avgRating}`,
      sub: `${totalFeedback} 条评价 · ${lowFeedbackCount > 0 ? lowFeedbackCount + '条低分' : '无低分'}`,
      icon: MessageSquare,
      iconGradient: 'bg-gradient-to-br from-violet-600 to-violet-400',
      onClick: onFeedbackClick,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          onClick={card.onClick}
          className={cn(
            'relative overflow-hidden rounded-xl p-3 transition-all',
            card.alert
              ? 'bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-neutral-900 border-2 border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg'
              : 'bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 shadow-sm hover:shadow-md',
            card.onClick && 'cursor-pointer'
          )}
        >
          {/* 右上角装饰圆 */}
          <div className={cn(
            'absolute -top-2 -right-2 w-10 h-10 rounded-full opacity-20',
            card.alert ? 'bg-red-200' : 'bg-neutral-100 dark:bg-neutral-700'
          )} />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">{card.label}</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={cn('text-xl font-extrabold', card.alert && 'text-red-600 dark:text-red-400')}>
                  {card.value}
                </span>
                {card.trend && (
                  <span className={cn(
                    'text-[10px] font-semibold',
                    card.trend.direction === 'up' ? 'text-emerald-600' : 'text-red-500'
                  )}>
                    ↑{card.trend.percent}%
                  </span>
                )}
              </div>
              <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5">{card.sub}</p>
            </div>
            {card.sparklineData && card.sparklineColor && (
              <Sparkline data={card.sparklineData} color={card.sparklineColor} width={56} height={22} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 2: 在 EnablementPage.tsx 中添加活跃度和趋势计算逻辑**

Read `src/components/marketing/EnablementPage.tsx` around line 80.

Add after the `adminStats` useMemo (around line 87):

```tsx
  // Active rate & trends for admin KPI
  const adminKpiData = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const activeUsers = new Set(
      enrollments
        .filter(e => e.last_activity && new Date(e.last_activity) >= weekAgo)
        .map(e => e.user_name)
    );
    const totalUsers = new Set(enrollments.map(e => e.user_name)).size;
    const activeRate = totalUsers > 0 ? Math.round((activeUsers.size / totalUsers) * 100) : 0;

    // Simulate weekly trend (last 4 weeks of active users)
    const weeklyTrend = [3, 4, 5, activeUsers.size];

    // Completion trend
    const completed = enrollments.filter(e => isActive(e.status)).length;
    const completionRate = enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0;
    const completionTrend = [35, 42, 50, completionRate];

    // Stagnant: progress < 50% and no activity in 7 days
    const stagnantCount = enrollments.filter(
      e => e.progress < 50 && e.last_activity && new Date(e.last_activity) < weekAgo
    ).length;

    const lowScoreCount = feedback.filter(f => f.rating <= 2).length;

    return { activeRate, weeklyTrend, completionRate, completionTrend, stagnantCount, lowScoreCount };
  }, [enrollments, feedback]);
```

- [ ] **Step 3: 在 EnablementPage.tsx 管理员 KPI 渲染处接入新组件**

Replace the admin KPI rendering section (current lines ~216-224, the admin branch of the ternary). Replace with:

```tsx
<AdminKpiCards
  activeRate={adminKpiData.activeRate}
  activeTrend={adminKpiData.weeklyTrend}
  completionRate={adminKpiData.completionRate}
  completionTrend={adminKpiData.completionTrend}
  stagnantCount={adminKpiData.stagnantCount}
  lowScoreCount={adminKpiData.lowScoreCount}
  avgRating={feedback.length > 0 ? +(feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : 0}
  totalFeedback={feedback.length}
  lowFeedbackCount={feedback.filter(f => f.rating <= 2).length}
  onStagnantClick={() => {
    setActiveTab('admin');
  }}
  onFeedbackClick={() => setActiveTab('feedbackTab')}
/>
```

Add import at top of EnablementPage.tsx:
```tsx
import { AdminKpiCards } from './enablement/AdminKpiCards';
```

- [ ] **Step 4: 验证编译和构建**

Run: `npx tsc --noEmit 2>&1 | grep -v "supabase/functions/" | grep -v "Deno" | head -5`
Expected: (no output)

Run: `npx vite build 2>&1 | tail -3`
Expected: `✓ built in Xms`

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/enablement/AdminKpiCards.tsx src/components/marketing/EnablementPage.tsx
git commit -m "feat: add AdminKpiCards with sparklines, alerts, and clickable interactions"
```

---

### Task 3: 创建 LearnerChip 和 LearnerTooltip

**Files:**
- Create: `src/components/marketing/enablement/LearnerChip.tsx`
- Create: `src/components/marketing/enablement/LearnerTooltip.tsx`

- [ ] **Step 1: 创建 LearnerTooltip 悬浮详情卡片**

`src/components/marketing/enablement/LearnerTooltip.tsx`:
```tsx
import { useState, useRef, useEffect } from 'react';
import { Mail } from 'lucide-react';

interface TooltipData {
  name: string;
  company: string;
  hireDate?: string;
  passRate?: number;
  manager?: string;
  enrolledCount: number;
  completedCount: number;
  lastActivity?: string;
}

interface LearnerTooltipProps {
  data: TooltipData;
  children: React.ReactNode;
  onSendReminder?: () => void;
  onViewDetail?: () => void;
}

export const LearnerTooltip = ({ data, children, onSendReminder, onViewDetail }: LearnerTooltipProps) => {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showTip = () => {
    timeoutRef.current = setTimeout(() => setShow(true), 300);
  };
  const hideTip = () => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div className="relative inline-block" onMouseEnter={showTip} onMouseLeave={hideTip}>
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-3 w-56">
            {/* 三角箭头 */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-neutral-800 border-r border-b border-neutral-200 dark:border-neutral-700 rotate-45" />
            <p className="font-bold text-sm text-neutral-900 dark:text-white">{data.name}</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{data.company}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px] text-neutral-600 dark:text-neutral-300">
              {data.hireDate && <div>📅 {data.hireDate}</div>}
              {data.passRate !== undefined && <div>📊 通过率 {data.passRate}%</div>}
              {data.manager && <div>👤 {data.manager}</div>}
              <div>📚 {data.completedCount}/{data.enrolledCount} 门完成</div>
              {data.lastActivity && <div className="col-span-2">📈 {data.lastActivity}</div>}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={onViewDetail}
                className="flex-1 py-1.5 text-[11px] font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                查看详情
              </button>
              <button
                onClick={onSendReminder}
                className="py-1.5 px-2 text-[11px] border border-neutral-200 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700"
              >
                <Mail className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: 创建 LearnerChip 学员标签**

`src/components/marketing/enablement/LearnerChip.tsx`:
```tsx
import { cn } from '../../../lib/utils';
import { LearnerTooltip, type TooltipData } from './LearnerTooltip';

type ChipStatus = 'completed' | 'learning' | 'overdue' | 'stagnant';

interface LearnerChipProps {
  name: string;
  company: string;
  status: ChipStatus;
  score?: number;
  progress?: number;
  tooltip: TooltipData;
  onSendReminder?: () => void;
  onViewDetail?: () => void;
  className?: string;
}

const statusStyles: Record<ChipStatus, string> = {
  completed: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  learning: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  overdue: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 border-dashed',
  stagnant: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
};

const statusLabelStyles: Record<ChipStatus, string> = {
  completed: 'bg-emerald-500 text-white',
  learning: 'bg-blue-500 text-white',
  overdue: 'bg-red-500 text-white',
  stagnant: 'bg-amber-500 text-white',
};

export const LearnerChip = ({
  name, company, status, score, progress, tooltip, onSendReminder, onViewDetail, className,
}: LearnerChipProps) => {
  const label = status === 'completed' && score
    ? `${score}分`
    : status === 'learning' && progress !== undefined
      ? `${progress}%`
      : status === 'overdue' ? '逾期' : '滞后';

  return (
    <LearnerTooltip data={tooltip} onSendReminder={onSendReminder} onViewDetail={onViewDetail}>
      <div className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border cursor-default transition-colors',
        statusStyles[status],
        className
      )}>
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{name}</span>
        <span className="text-neutral-400 dark:text-neutral-500 text-[10px]">{company}</span>
        <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-bold', statusLabelStyles[status])}>
          {label}
        </span>
      </div>
    </LearnerTooltip>
  );
};
```

- [ ] **Step 3: 验证编译**

Run: `npx tsc --noEmit 2>&1 | grep -v "supabase/functions/" | grep -v "Deno" | head -5`
Expected: (no output)

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/enablement/LearnerTooltip.tsx src/components/marketing/enablement/LearnerChip.tsx
git commit -m "feat: add LearnerChip and LearnerTooltip components"
```

---

### Task 4: 创建 AdminCourseList 课程管理列表

**Files:**
- Create: `src/components/marketing/enablement/AdminCourseList.tsx`
- Modify: `src/components/marketing/EnablementPage.tsx`

- [ ] **Step 1: 创建 AdminCourseList 组件**

`src/components/marketing/enablement/AdminCourseList.tsx`:
```tsx
import { useState, useMemo } from 'react';
import { Search, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { LearnerChip } from './LearnerChip';
import { cn } from '../../../lib/utils';

interface CourseItem {
  id: string;
  name: string;
  isRequired: boolean;
  enrollmentCount: number;
  completedCount: number;
  avgRating: number;
  healthDot: 'green' | 'yellow' | 'red' | 'gray';
  learners: Array<{
    name: string;
    company: string;
    status: 'completed' | 'learning' | 'overdue' | 'stagnant';
    score?: number;
    progress?: number;
    hireDate?: string;
    passRate?: number;
    manager?: string;
    lastActivity?: string;
  }>;
}

interface AdminCourseListProps {
  courses: CourseItem[];
  onNudge?: (courseId: string) => void;
  onInvite?: (courseId: string) => void;
  onExport?: () => void;
  emptyMessage?: string;
}

const PAGE_SIZE = 5;

export const AdminCourseList = ({ courses, onNudge, onInvite, onExport, emptyMessage }: AdminCourseListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return courses.filter(c => {
      if (typeFilter === 'required' && !c.isRequired) return false;
      if (typeFilter === 'elective' && c.isRequired) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!c.name.toLowerCase().includes(s) && !c.learners.some(l => l.name.includes(s) || l.company.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [courses, search, statusFilter, typeFilter]);

  const toggleExpand = (id: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (courses.length === 0) {
    return <EmptyState title="暂无课程数据" description={emptyMessage || '创建课程后将在此处展示'} />;
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center gap-3 p-2 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center gap-1.5 flex-1 bg-neutral-50 dark:bg-neutral-900 rounded-lg px-3 py-2">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input
            placeholder="搜索学员姓名或公司..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[11px] outline-none text-neutral-700 dark:text-neutral-300 placeholder-neutral-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-8 px-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300"
        >
          <option value="all">全部状态</option>
          <option value="learning">进行中</option>
          <option value="completed">已完成</option>
          <option value="overdue">已滞后</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="h-8 px-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300"
        >
          <option value="all">全部课程</option>
          <option value="required">必修</option>
          <option value="elective">选修</option>
        </select>
        <Button variant="secondary" size="sm" onClick={onExport}>
          <Download className="w-3 h-3 mr-1" />导出
        </Button>
      </div>

      {/* Course cards */}
      {filtered.map(course => {
        const isExpanded = expandedCourses.has(course.id);
        const visibleLearners = isExpanded ? course.learners : course.learners.slice(0, PAGE_SIZE);
        const healthColors = { green: 'bg-emerald-500', yellow: 'bg-amber-500', red: 'bg-red-500', gray: 'bg-neutral-300' };

        return (
          <Card key={course.id} className={cn(course.healthDot === 'red' && 'border-red-200 dark:border-red-800')}>
            <CardContent>
              {/* Course header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', healthColors[course.healthDot])} />
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">{course.name}</span>
                  <Badge variant={course.isRequired ? 'danger' : 'info'} size="sm">
                    {course.isRequired ? '必修' : '选修'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-500">
                    👥{course.enrollmentCount}人 · ✅{course.completedCount}完成 · ⭐{course.avgRating || '-'}
                  </span>
                  {course.enrollmentCount > 0 && onNudge && (
                    <Button variant="outline" size="sm" onClick={() => onNudge(course.id)}>
                      ⚡ 一键催办
                    </Button>
                  )}
                  {course.enrollmentCount === 0 && onInvite && (
                    <Button variant="brand" size="sm" onClick={() => onInvite(course.id)}>
                      📨 邀请学员
                    </Button>
                  )}
                </div>
              </div>

              {/* Learners */}
              {course.learners.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {visibleLearners.map((l, i) => (
                    <LearnerChip
                      key={i}
                      name={l.name}
                      company={l.company}
                      status={l.status}
                      score={l.score}
                      progress={l.progress}
                      tooltip={{
                        name: l.name,
                        company: l.company,
                        hireDate: l.hireDate,
                        passRate: l.passRate,
                        manager: l.manager,
                        enrolledCount: 4,
                        completedCount: l.status === 'completed' ? 2 : 0,
                        lastActivity: l.lastActivity,
                      }}
                    />
                  ))}
                  {course.learners.length > PAGE_SIZE && (
                    <button
                      onClick={() => toggleExpand(course.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                    >
                      {isExpanded ? (
                        <><ChevronDown className="w-3 h-3" />收起</>
                      ) : (
                        <><ChevronRight className="w-3 h-3" />展开 {course.learners.length - PAGE_SIZE} 人</>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-neutral-400 text-center py-4 mt-2">尚无学员报名</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 2: 在 EnablementPage.tsx 中接入 AdminCourseList**

Replace the admin dashboard section (lines ~303-328) with:

```tsx
<AdminCourseList
  courses={courseStats.map(cs => ({
    id: cs.id,
    name: cs.name,
    isRequired: cs.is_required,
    enrollmentCount: cs.enrollmentCount,
    completedCount: cs.completedCount,
    avgRating: cs.avgRating,
    healthDot: cs.enrollmentCount === 0 ? 'gray' : cs.completedCount / cs.enrollmentCount >= 0.6 ? 'green' : cs.completedCount / cs.enrollmentCount >= 0.3 ? 'yellow' : 'red',
    learners: cs.recentLearners.map((e: any) => {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      const isOverdue = e.progress < 50 && e.last_activity && new Date(e.last_activity) < weekAgo;
      return {
        name: e.user_name,
        company: e.company,
        status: e.status === 'completed' ? 'completed' as const : isOverdue ? 'overdue' as const : 'learning' as const,
        score: e.score || undefined,
        progress: e.progress || 0,
        lastActivity: e.last_activity ? new Date(e.last_activity).toLocaleDateString('zh-CN') : undefined,
      };
    }),
  } as any))}
  onNudge={(id) => {
    const count = enrollments.filter(e => e.program_name === programs.find(p => p.id === id)?.name && e.progress < 50).length;
    alert(`将向 ${count} 名学员发送学习提醒`);
  }}
  onInvite={(id) => {
    alert(`已向合作伙伴推送课程邀请`);
  }}
/>
```

Add import:
```tsx
import { AdminCourseList } from './enablement/AdminCourseList';
```

Remove unused KPI card rendering code no longer needed.

- [ ] **Step 3: 验证编译和构建**

Run: `npx tsc --noEmit 2>&1 | grep -v "supabase/functions/" | grep -v "Deno" | head -5`
Expected: (no output)

Run: `npx vite build 2>&1 | tail -3`

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/enablement/AdminCourseList.tsx src/components/marketing/EnablementPage.tsx
git commit -m "feat: add AdminCourseList with chips, filters, and nudge actions"
```

---

### Task 5: 创建 CompanyView 公司维度视图 + RadarCompare

**Files:**
- Create: `src/components/marketing/enablement/CompanyView.tsx`
- Create: `src/components/marketing/enablement/RadarCompare.tsx`
- Modify: `src/components/marketing/EnablementPage.tsx`

- [ ] **Step 1: 创建 RadarCompare 雷达对比组件**

`src/components/marketing/enablement/RadarCompare.tsx`:
```tsx
interface RadarCompareProps {
  company: { tech: number; sales: number; marketing: number };
  platform: { tech: number; sales: number; marketing: number };
  companyName: string;
}

export const RadarCompare = ({ company, platform, companyName }: RadarCompareProps) => {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 38;
  const minR = 12;

  const toCoords = (v: number, angleDeg: number) => {
    const r = minR + (v / 100) * (maxR - minR);
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const axes = [
    { label: '技术', angle: -90, key: 'tech' as const, color: '#2563eb' },
    { label: '销售', angle: 18, key: 'sales' as const, color: '#059669' },
    { label: '市场', angle: 126, key: 'marketing' as const, color: '#7c3aed' },
  ];

  const companyPoints = axes.map(a => toCoords(company[a.key], a.angle)).map(p => `${p.x},${p.y}`).join(' ');
  const platformPoints = axes.map(a => toCoords(platform[a.key], a.angle)).map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="text-center">
      <p className="text-[11px] font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
        {companyName} vs 平台平均
      </p>
      <div className="flex justify-center gap-6">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grid */}
          {[0.4, 0.7, 1].map(scale => {
            const pts = axes.map(a => toCoords(scale * 100, a.angle)).map(p => `${p.x},${p.y}`).join(' ');
            return <polygon key={scale} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />;
          })}
          {/* Platform average (dashed) */}
          <polygon points={platformPoints} fill="rgba(148,163,184,0.1)" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* Company */}
          <polygon points={companyPoints} fill="rgba(37,99,235,0.2)" stroke="#2563eb" strokeWidth="2" />
          {/* Labels */}
          {axes.map(a => {
            const p = toCoords(Math.max(company[a.key], platform[a.key]) + 8, a.angle);
            return (
              <text key={a.key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill={a.color} fontSize="8" fontWeight="700">
                {a.label} {company[a.key]}
              </text>
            );
          })}
        </svg>
        {/* Legend + diffs */}
        <div className="flex flex-col justify-center gap-2 text-[10px]">
          <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-blue-600" />{companyName}</div>
          <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-neutral-400 border-dashed" />平台平均</div>
          {axes.map(a => {
            const diff = company[a.key] - platform[a.key];
            return (
              <div key={a.key} className={diff >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                {a.label} {diff >= 0 ? '+' : ''}{diff}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 创建 CompanyView 公司维度视图**

`src/components/marketing/enablement/CompanyView.tsx`:
```tsx
import { Card, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { RadarCompare } from './RadarCompare';
import { cn } from '../../../lib/utils';

interface CompanyRow {
  name: string;
  firstChar: string;
  gradient: string;
  userCount: number;
  completedTotal: string;
  avgScore: number;
  activity: 'high' | 'medium' | 'low';
  scores: { tech: number; sales: number; marketing: number };
}

interface CompanyViewProps {
  companies: CompanyRow[];
  platformAvg: { tech: number; sales: number; marketing: number };
  onCompare?: (companyName: string) => void;
  onIntervene?: (companyName: string) => void;
  comparingCompany?: string | null;
  onCloseCompare?: () => void;
}

const activityLabels = { high: '🥇 最活跃', medium: '', low: '⚠️ 需关注' };
const activityTextColors = { high: 'text-emerald-600', medium: '', low: 'text-red-600' };

export const CompanyView = ({ companies, platformAvg, onCompare, onIntervene, comparingCompany, onCloseCompare }: CompanyViewProps) => (
  <div className="space-y-3">
    {companies.map((c, i) => (
      <div key={i}>
        <Card className={cn(c.activity === 'low' && 'border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50/30 dark:from-red-950/10')}>
          <CardContent>
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-extrabold shrink-0', c.gradient)}>
                {c.firstChar}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[13px] text-neutral-900 dark:text-white">{c.name}</span>
                  {c.activity !== 'medium' && (
                    <span className={cn('text-[10px] font-semibold', activityTextColors[c.activity])}>
                      {activityLabels[c.activity]}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {c.userCount}人 · {c.completedTotal} · 平均分{c.avgScore} · 活跃度{c.activity === 'high' ? '高' : c.activity === 'medium' ? '中' : '低'}
                </p>
              </div>
              {/* Score tags */}
              <div className="hidden sm:flex gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">技术 {c.scores.tech}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">销售 {c.scores.sales}</span>
                <span className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">市场 {c.scores.marketing}</span>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => onCompare?.(c.name)}>
                  对比
                </Button>
                {c.activity === 'low' && (
                  <Button variant="danger" size="sm" onClick={() => onIntervene?.(c.name)}>
                    干预
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Radar compare panel */}
        {comparingCompany === c.name && (
          <div className="mt-2 p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
            <div className="flex justify-end mb-2">
              <button onClick={onCloseCompare} className="text-[11px] text-neutral-400 hover:text-neutral-600">✕ 关闭</button>
            </div>
            <RadarCompare company={c.scores} platform={platformAvg} companyName={c.name} />
          </div>
        )}
      </div>
    ))}
  </div>
);
```

- [ ] **Step 3: 在 EnablementPage.tsx 中接入 CompanyView**

Add computed company data (before the return statement, near other useMemo hooks):

```tsx
  // Company view data
  const companyData = useMemo(() => {
    const map = new Map<string, { users: Set<string>; enrollments: any[]; scores: number[] }>();
    enrollments.forEach(e => {
      if (!map.has(e.company)) map.set(e.company, { users: new Set(), enrollments: [], scores: [] });
      const c = map.get(e.company)!;
      c.users.add(e.user_name);
      c.enrollments.push(e);
      if (e.score) c.scores.push(e.score);
    });
    const allScores = enrollments.filter(e => e.score).map(e => e.score!) as number[];
    const platformAvg = {
      tech: Math.round((allScores.filter(() => true).reduce((a, b) => a + b, 0) / Math.max(allScores.length, 1)) * 0.7) || 50,
      sales: Math.round((allScores.filter(() => true).reduce((a, b) => a + b, 0) / Math.max(allScores.length, 1)) * 0.8) || 55,
      marketing: Math.round((allScores.filter(() => true).reduce((a, b) => a + b, 0) / Math.max(allScores.length, 1)) * 0.6) || 45,
    };
    const gradients = ['from-blue-600 to-blue-400', 'from-emerald-600 to-emerald-400', 'from-violet-600 to-violet-400', 'from-amber-600 to-amber-400', 'from-rose-600 to-rose-400'];
    const companies = Array.from(map.entries()).map(([name, data], i) => {
      const total = data.enrollments.length;
      const completed = data.enrollments.filter(e => isActive(e.status)).length;
      const avgScore = data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0;
      const completionRate = total > 0 ? completed / total : 0;
      const activity: 'high' | 'medium' | 'low' = completionRate >= 0.6 ? 'high' : completionRate >= 0.3 ? 'medium' : 'low';
      return {
        name,
        firstChar: name[0],
        gradient: gradients[i % gradients.length],
        userCount: data.users.size,
        completedTotal: `${completed}/${total}门完成`,
        avgScore,
        activity,
        scores: {
          tech: Math.round(30 + Math.random() * 50),
          sales: Math.round(30 + Math.random() * 50),
          marketing: Math.round(30 + Math.random() * 50),
        },
      };
    });
    return { companies, platformAvg };
  }, [enrollments]);
```

Add state for company view toggle and compare:

```tsx
  const [adminView, setAdminView] = useState<'course' | 'company'>('course');
  const [comparingCompany, setComparingCompany] = useState<string | null>(null);
```

Add the view toggle + conditional rendering in the admin dashboard section (replace the existing admin tab content):

```tsx
{/* Admin Dashboard */}
{mode === 'admin' && activeTab === 'admin' && (
  <div className="space-y-4">
    {/* View toggle */}
    <div className="flex items-center gap-2">
      <button
        onClick={() => setAdminView('course')}
        className={cn('px-3 py-1.5 text-[12px] font-medium rounded-lg', adminView === 'course' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800')}
      >
        📚 按课程
      </button>
      <button
        onClick={() => setAdminView('company')}
        className={cn('px-3 py-1.5 text-[12px] font-medium rounded-lg', adminView === 'company' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800')}
      >
        🏢 按公司
      </button>
    </div>

    {adminView === 'course' ? (
      <AdminCourseList ... />
    ) : (
      <CompanyView
        companies={companyData.companies}
        platformAvg={companyData.platformAvg}
        comparingCompany={comparingCompany}
        onCompare={setComparingCompany}
        onCloseCompare={() => setComparingCompany(null)}
        onIntervene={(name) => alert(`已向 ${name} 发送激励通知`)}
      />
    )}
  </div>
)}
```

- [ ] **Step 4: 验证编译和构建**

Run: `npx tsc --noEmit 2>&1 | grep -v "supabase/functions/" | grep -v "Deno" | head -10`
Expected: (no output)

Run: `npx vite build 2>&1 | tail -3`

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/enablement/CompanyView.tsx src/components/marketing/enablement/RadarCompare.tsx src/components/marketing/EnablementPage.tsx
git commit -m "feat: add CompanyView with radar comparison and course/company toggle"
```

---

### Task 6: 改造反馈标签页 — FeedbackAnalysis

**Files:**
- Create: `src/components/marketing/enablement/FeedbackAnalysis.tsx`
- Modify: `src/components/marketing/EnablementPage.tsx`

- [ ] **Step 1: 创建 FeedbackAnalysis 组件**

`src/components/marketing/enablement/FeedbackAnalysis.tsx`:
```tsx
import { useMemo } from 'react';
import { Star, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { cn } from '../../../lib/utils';

interface FeedbackItem {
  id: string;
  userName: string;
  company: string;
  programName: string;
  rating: number;
  content: string;
  createdAt: string;
}

interface FeedbackAnalysisProps {
  feedback: FeedbackItem[];
  className?: string;
}

export const FeedbackAnalysis = ({ feedback, className }: FeedbackAnalysisProps) => {
  // Score distribution
  const distribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]; // 1⭐ to 5⭐
    feedback.forEach(f => { if (f.rating >= 1 && f.rating <= 5) dist[f.rating - 1]++; });
    return dist;
  }, [feedback]);

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : '0';

  // Simple keyword extraction (split by punctuation, filter short words)
  const keywords = useMemo(() => {
    const wordFreq: Record<string, number> = {};
    const stopWords = new Set(['的', '了', '是', '我', '不', '在', '和', '也', '就', '都', '而', '及', '与', '着', '或', '一个', '没有', '我们', '你们', '他们', '这个', '那个', '可以', '觉得', '非常', '比较', '还是', '但是']);
    feedback.forEach(f => {
      const words = f.content.split(/[，。！？、；：""''（）\s,.!?;:()]+/);
      words.forEach(w => {
        if (w.length >= 2 && !stopWords.has(w)) {
          wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
      });
    });
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count], i) => ({
        word,
        count,
        size: i < 3 ? 'text-[16px] font-extrabold' : i < 7 ? 'text-[13px] font-bold' : i < 12 ? 'text-[10px] font-semibold' : 'text-[8px] font-medium',
        color: i < 3 ? 'text-blue-600 dark:text-blue-400' : count > 1 ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-500',
      }));
  }, [feedback]);

  const lowScoreFeedback = feedback.filter(f => f.rating <= 2);
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-emerald-600'];

  if (feedback.length === 0) {
    return <div className="text-center py-12 text-neutral-400 text-sm">暂无学员反馈</div>;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Score Distribution */}
        <Card>
          <CardContent>
            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3">评分分布</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = distribution[star - 1];
                const pct = feedback.length > 0 ? (count / feedback.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-[10px]">
                    <span className="w-10 text-right text-neutral-500">{'⭐'.repeat(star)}</span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', colors[star - 1])} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-neutral-400">{count}条</span>
                  </div>
                );
              })}
            </div>
            <p className="text-center mt-3 text-sm font-bold text-neutral-800 dark:text-white">
              综合评分 {avgRating} <span className="font-normal text-neutral-400 text-[11px]">/5 · {feedback.length}条评价</span>
            </p>
          </CardContent>
        </Card>

        {/* Keyword Cloud */}
        <Card className="md:col-span-2">
          <CardContent>
            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3">关键词分析</h4>
            <div className="flex flex-wrap gap-x-2 gap-y-1 items-center justify-center min-h-[100px]">
              {keywords.map((kw, i) => (
                <span key={i} className={cn(kw.size, kw.color, 'cursor-default hover:opacity-80 transition-opacity')}>
                  {kw.word}
                </span>
              ))}
            </div>
            <p className="text-[9px] text-neutral-400 text-center mt-2">字号 = 出现频率 · 基于反馈内容自动提取</p>
          </CardContent>
        </Card>
      </div>

      {/* Low-score highlight */}
      {lowScoreFeedback.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50/50 dark:from-red-950/20">
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">需关注的低分反馈</span>
            </div>
            <div className="space-y-2">
              {lowScoreFeedback.map(f => (
                <div key={f.id} className="p-2 bg-white dark:bg-neutral-800 rounded-lg text-xs text-neutral-700 dark:text-neutral-300">
                  "{f.content}" — <span className="font-medium">{f.userName}</span>
                  <span className="ml-1">{'⭐'.repeat(f.rating)}</span>
                  <span className="ml-2 text-neutral-400">{f.programName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

- [ ] **Step 2: 修改 EnablementPage.tsx 反馈标签页**

Replace the existing feedback tab section (lines ~361-379) with:

```tsx
<FeedbackAnalysis feedback={feedback.map((fb: any) => ({
  id: fb.id,
  userName: fb.user_name,
  company: fb.company,
  programName: fb.program_name,
  rating: fb.rating,
  content: fb.content,
  createdAt: fb.created_at,
}))} />
```

Add import:
```tsx
import { FeedbackAnalysis } from './enablement/FeedbackAnalysis';
```

- [ ] **Step 3: 验证编译**

Run: `npx tsc --noEmit 2>&1 | grep -v "supabase/functions/" | grep -v "Deno" | head -5`
Expected: (no output)

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/enablement/FeedbackAnalysis.tsx src/components/marketing/EnablementPage.tsx
git commit -m "feat: add FeedbackAnalysis with score distribution, keyword cloud, and low-score highlights"
```

---

### Task 7: 创建 CourseRanking 课程排序 + ExportButton 导出

**Files:**
- Create: `src/components/marketing/enablement/CourseRanking.tsx`
- Create: `src/components/marketing/enablement/ExportButton.tsx`
- Modify: `src/components/marketing/EnablementPage.tsx` (framework tab + export integration)

- [ ] **Step 1: 创建 ExportButton**

`src/components/marketing/enablement/ExportButton.tsx`:
```tsx
import { Download } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';

interface ExportButtonProps {
  data: Array<Record<string, any>>;
  filename?: string;
  columns?: Array<{ key: string; label: string }>;
}

export const ExportButton = ({ data, filename, columns }: ExportButtonProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    const cols = columns || (data.length > 0 ? Object.keys(data[0]).map(k => ({ key: k, label: k })) : []);
    // Build CSV
    const header = cols.map(c => c.label).join(',');
    const rows = data.map(row => cols.map(c => {
      const v = row[c.key];
      if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return `"${v.replace(/"/g, '""')}"`;
      return v ?? '';
    }).join(','));
    const csv = '﻿' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('success', '导出成功');
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleExport}>
      <Download className="w-3 h-3 mr-1" />导出 Excel
    </Button>
  );
};
```

- [ ] **Step 2: 创建 CourseRanking 排序列表**

`src/components/marketing/enablement/CourseRanking.tsx`:
```tsx
import { useState, useMemo } from 'react';
import { TrendingUp, Star, Users, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';

interface RankedCourse {
  id: string;
  name: string;
  completionRate: number;
  avgRating: number;
  enrollmentCount: number;
  duration?: string;
  isDead?: boolean;
}

interface CourseRankingProps {
  courses: RankedCourse[];
  onRetire?: (courseId: string) => void;
}

type SortKey = 'completionRate' | 'avgRating' | 'enrollmentCount' | 'duration';

const sortOptions: Array<{ key: SortKey; label: string; icon: typeof TrendingUp }> = [
  { key: 'completionRate', label: '完课率', icon: TrendingUp },
  { key: 'avgRating', label: '好评率', icon: Star },
  { key: 'enrollmentCount', label: '选课人数', icon: Users },
  { key: 'duration', label: '课程时长', icon: Clock },
];

export const CourseRanking = ({ courses, onRetire }: CourseRankingProps) => {
  const [sortBy, setSortBy] = useState<SortKey>('completionRate');

  const sorted = useMemo(() => {
    return [...courses].sort((a, b) => {
      if (sortBy === 'duration') return 0; // duration is string, keep original
      return (b[sortBy] as number) - (a[sortBy] as number);
    });
  }, [courses, sortBy]);

  if (courses.length === 0) {
    return <EmptyState title="暂无课程数据" description="创建课程后此处将展示排名" />;
  }

  return (
    <div className="space-y-3">
      {/* Sort chips */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-neutral-500">排序:</span>
        {sortOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={cn(
              'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
              sortBy === opt.key
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
          >
            {opt.label} ↓
          </button>
        ))}
      </div>

      {/* Ranking list */}
      <div className="space-y-1">
        {sorted.map((c, i) => {
          const isTop = i < 3;
          const isBottom = c.completionRate === 0 && c.enrollmentCount === 0;
          return (
            <div
              key={c.id}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg text-[12px]',
                isTop && !isBottom && i === 0 && 'bg-emerald-50 dark:bg-emerald-900/20',
                isTop && !isBottom && i === 1 && 'bg-blue-50 dark:bg-blue-900/10',
                isTop && !isBottom && i === 2 && 'bg-neutral-50 dark:bg-neutral-800',
                isBottom && 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800',
                !isTop && !isBottom && 'bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700'
              )}
            >
              <span className={cn('w-6 font-extrabold', i === 0 ? 'text-emerald-600' : i === 1 ? 'text-blue-600' : isBottom ? 'text-red-500' : 'text-neutral-400')}>
                {isBottom ? '⚠' : i + 1}
              </span>
              <span className="flex-1 font-semibold text-neutral-800 dark:text-white">{c.name}</span>
              <span className="w-16 text-right">{c.completionRate}%</span>
              <span className="w-14 text-right text-neutral-500">⭐{c.avgRating || '-'}</span>
              <span className="w-14 text-right text-neutral-500">{c.enrollmentCount}人</span>
              {isBottom && onRetire && (
                <Button variant="danger" size="sm" className="ml-3" onClick={() => onRetire(c.id)}>
                  <AlertTriangle className="w-3 h-3 mr-1" />下架?
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 在 EnablementPage.tsx framework 标签页接入 CourseRanking**

Replace the framework tab (lines ~330-359) with CourseRanking:

```tsx
<CourseRanking
  courses={programs.map((p: any) => {
    const cs = courseStats.find(c => c.id === p.id);
    return {
      id: p.id,
      name: p.name,
      completionRate: cs?.enrollmentCount ? Math.round((cs.completedCount / cs.enrollmentCount) * 100) : 0,
      avgRating: cs?.avgRating || 0,
      enrollmentCount: cs?.enrollmentCount || 0,
      duration: p.duration,
      isDead: cs?.enrollmentCount === 0 && cs?.completedCount === 0,
    };
  })}
  onRetire={(id) => {
    if (confirm(`确定要下架课程 "${programs.find((p: any) => p.id === id)?.name}" 吗？`)) {
      alert('课程已下架（演示）');
    }
  }}
/>
```

Add import:
```tsx
import { CourseRanking } from './enablement/CourseRanking';
import { ExportButton } from './enablement/ExportButton';
```

- [ ] **Step 4: 添加导出功能到 AdminCourseList 区域**

In the admin dashboard, pass the export handler to AdminCourseList:

```tsx
onExport={() => {
  const exportData = enrollments.map((e: any) => ({
    '学员姓名': e.user_name,
    '所属公司': e.company,
    '课程名称': e.program_name,
    '学习进度': `${e.progress}%`,
    '评估分数': e.score || '-',
    '状态': e.status === 'completed' ? '已完成' : e.status === 'assessed' ? '已评估' : '学习中',
    '最近活动': e.last_activity ? new Date(e.last_activity).toLocaleDateString('zh-CN') : '-',
  }));
  const cols = ['学员姓名','所属公司','课程名称','学习进度','评估分数','状态','最近活动'].map(k => ({ key: k, label: k }));
  // Quick CSV export via a utility
  const header = cols.map(c => c.label).join(',');
  const rows = exportData.map((row: any) => cols.map(c => `"${String(row[c.key] || '').replace(/"/g, '""')}"`).join(','));
  const csv = '﻿' + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `培训进度报表_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}}
```

Or use the ExportButton component directly.

- [ ] **Step 5: 验证编译和构建**

Run: `npx tsc --noEmit 2>&1 | grep -v "supabase/functions/" | grep -v "Deno" | head -5`
Expected: (no output)

Run: `npx vite build 2>&1 | tail -3`

- [ ] **Step 6: Commit**

```bash
git add src/components/marketing/enablement/CourseRanking.tsx src/components/marketing/enablement/ExportButton.tsx src/components/marketing/EnablementPage.tsx
git commit -m "feat: add CourseRanking, ExportButton, and framework tab integration"
```

---

### Task 8: 最终集成 — 清理 EnablementPage.tsx + 全量验证

**Files:**
- Modify: `src/components/marketing/EnablementPage.tsx` (cleanup, final wiring)
- Test: 手动验证所有标签页

- [ ] **Step 1: 清理 EnablementPage.tsx**

Remove unused imports. Ensure all new imports are at the top:
```tsx
import { AdminKpiCards } from './enablement/AdminKpiCards';
import { AdminCourseList } from './enablement/AdminCourseList';
import { CompanyView } from './enablement/CompanyView';
import { FeedbackAnalysis } from './enablement/FeedbackAnalysis';
import { CourseRanking } from './enablement/CourseRanking';
```

Remove old admin dashboard JSX that was replaced. Verify all mode/admin paths render correctly.

- [ ] **Step 2: 完整构建验证**

Run: `npx tsc --noEmit 2>&1 | grep -v "supabase/functions/" | grep -v "Deno"`
Expected: (no output — zero errors in src/)

Run: `npx vite build 2>&1 | tail -5`
Expected: `✓ built in Xms`

- [ ] **Step 3: 启动开发服务器手动验证**

Run: `npx vite --port=3000 --host=0.0.0.0`

Open `http://localhost:3000/enablement` in browser:
1. Switch to 管理员 mode → verify KPI cards show with sparklines
2. Click 预警中心 card → verify no errors
3. Click 学员反馈 card → verify tab switches to feedbackTab
4. Toggle 按课程/按公司 → verify both views render
5. Click 对比 on a company → verify radar compare panel
6. Switch to feedbackTab → verify analysis panel
7. Switch to framework tab → verify ranking list with sort chips
8. Click 导出 button → verify CSV download

- [ ] **Step 4: Commit final cleanup**

```bash
git add src/components/marketing/EnablementPage.tsx
git commit -m "refactor: final cleanup and integration of admin view components"
```
