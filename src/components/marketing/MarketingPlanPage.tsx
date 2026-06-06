import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Save, Send, CheckCircle2, XCircle,
  TrendingUp, RefreshCw, History, DollarSign, PieChart, BarChart3,
  AlertCircle, CheckCircle, Users, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { SearchableSelect } from '../ui/SearchableSelect';
import { formatCurrency, currencyName } from '../../lib/utils';
import { useConfig } from '../../contexts/ConfigContext';
import { useToast } from '../ui/Toast';

// ── Constants ──────────────────────────────────────────
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
const CATEGORIES = ['线下峰会', '线下沙龙', 'Webinar', '联合营销', '渠道招募', '行业大会', '培训', '其他'];
const EXEC_STATUSES = ['draft', 'approved', 'executed'] as const;
const EXEC_LABELS: Record<string, string> = { draft: '草稿', approved: '已批复', executed: '已完成' };
const QCOLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed'];
const STATUS_LABEL: Record<string, string> = { draft: '草稿', pending: '已提交', approved: '已批复' };
const STATUS_COLOR: Record<string, string> = { draft: 'text-neutral-500', pending: 'text-amber-600', approved: 'text-emerald-600' };
const STATUS_BG: Record<string, string> = { draft: 'bg-neutral-100 dark:bg-neutral-800', pending: 'bg-amber-50 dark:bg-amber-900/20', approved: 'bg-emerald-50 dark:bg-emerald-900/20' };

// ── Helpers ────────────────────────────────────────────
const normalizeExecStatus = (status: string | null | undefined): string => {
  const legacyMap: Record<string, string> = {
    // 英文旧值
    Planning: 'draft', 'In Progress': 'approved', Completed: 'executed', Cancelled: 'draft',
    // 中文旧值
    '计划中': 'draft', '进行中': 'approved', '已执行': 'executed', '已完成': 'executed', '已取消': 'draft',
  };
  if (!status) return 'draft';
  // 如果已经是新三态之一，直接返回
  if (['draft', 'approved', 'executed'].includes(status)) return status;
  return legacyMap[status] || 'draft';
};

const normalizeQuarter = (quarter: string): string => {
  const mapping: Record<string, string> = {
    Q1: 'Q1', q1: 'Q1', '第一季度': 'Q1', '1': 'Q1',
    Q2: 'Q2', q2: 'Q2', '第二季度': 'Q2', '2': 'Q2',
    Q3: 'Q3', q3: 'Q3', '第三季度': 'Q3', '3': 'Q3',
    Q4: 'Q4', q4: 'Q4', '第四季度': 'Q4', '4': 'Q4',
  };
  return mapping[quarter] || quarter;
};

// ── Types ──────────────────────────────────────────────
interface BudgetConfig {
  annual_budget: number;
  q1_budget: number;
  q2_budget: number;
  q3_budget: number;
  q4_budget: number;
  status: string;
  q1_adjust: number;
  q2_adjust: number;
  q3_adjust: number;
  q4_adjust: number;
  approved_at?: string | null;
}

interface PlanActivity {
  id: string;
  year: number;
  quarter: string;
  activity_type: string;
  partner_id: string;
  partner_name: string;
  category: string;
  region: string;
  city: string;
  expected_date: string;
  total_budget: number;
  approved_amount: number;
  expected_attendees: number;
  expected_output: string;
  responsible_person: string;
  goal: string;
  execution_status: string;
  plan_status?: string;
  budget?: number;
  target_leads?: number;
  target_opps?: number;
  _new?: boolean;
  business_objective?: string;
  forecast_pipeline?: number;
  actual_spend?: number;
  actual_leads?: number;
  actual_opps?: number;
  baseline_locked?: boolean;
  budget_utilization?: number;
}

interface ChangeLogEntry {
  id?: string;
  config_id: string;
  action: string;
  q1_budget: number;
  q2_budget: number;
  q3_budget: number;
  q4_budget: number;
  created_at: string;
}

interface PartnerMDF {
  allocated: number;
  used: number;
  remaining: number;
}

// ── Memoized PieSVG ────────────────────────────────────
const PieSVG = memo(({ data, size = 120, currency = 'CNY' }: { data: number[]; size?: number; currency?: string }) => {
  const total = data.reduce((s, v) => s + v, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  let angle = -Math.PI / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="预算分配饼图">
      {data.map((v, i) => {
        if (v <= 0) return null;
        const a = (v / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(angle + a);
        const y2 = cy + r * Math.sin(angle + a);
        const large = a > Math.PI ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        const midAngle = angle + a / 2;
        const lx = cx + r * 0.7 * Math.cos(midAngle);
        const ly = cy + r * 0.7 * Math.sin(midAngle);
        angle += a;
        const pct = Math.round((v / total) * 100);
        return (
          <g key={i}>
            <path d={d} fill={QCOLORS[i]} />
            {pct >= 10 && (
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" className="fill-white text-[9px] font-semibold">
                {pct}%
              </text>
            )}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.5} fill="white" className="dark:fill-neutral-900" />
      <text x={cx} y={cy - 4} textAnchor="middle" className="text-[10px] fill-neutral-400">总预算</text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="text-xs font-bold fill-neutral-900 dark:fill-white">
        {formatCurrency(total, currency as 'CNY' | 'USD')}
      </text>
    </svg>
  );
});
PieSVG.displayName = 'PieSVG';

// ── Stats Grid ─────────────────────────────────────────
const StatsGrid = memo(({ items }: { items: { label: string; value: string; sub?: string; icon: React.FC<{ className?: string }>; color: string; bg: string; alert?: 'red' | 'yellow' | 'green' }[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {items.map((kpi, i) => (
      <Card key={i} className={kpi.alert === 'red' ? 'border-red-200 dark:border-red-800' : kpi.alert === 'yellow' ? 'border-amber-200 dark:border-amber-800' : ''}>
        <div className="flex items-center gap-3 p-4">
          <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs text-neutral-500">{kpi.label}</p>
              {kpi.alert === 'red' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
            </div>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">{kpi.value}</p>
            {kpi.sub && <p className="text-[11px] text-neutral-400 truncate">{kpi.sub}</p>}
          </div>
        </div>
      </Card>
    ))}
  </div>
));
StatsGrid.displayName = 'StatsGrid';

// ── Budget Adjustment Modal ────────────────────────────
const BudgetAdjustmentModal = memo(({
  config, onConfigChange, onCancel, onSave, saving, fmt,
}: {
  config: BudgetConfig;
  onConfigChange: (update: Partial<BudgetConfig>) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  fmt: (v: number) => string;
}) => (
  <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600" />预算调整申请
      </CardTitle>
      <span className="text-xs text-amber-600">在原批复预算基础上调整</span>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {QUARTERS.map((q, i) => (
          <div key={q}>
            <label className="text-xs text-neutral-500">
              {q} 原预算 {fmt(Number((config as any)[`q${i + 1}_budget`] || 0))}
            </label>
            <input
              type="number"
              className="w-full h-10 px-3 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              value={(config as any)[`q${i + 1}_adjust`] || ''}
              onChange={e => onConfigChange({ [`q${i + 1}_adjust`]: Number(e.target.value) })}
              placeholder="调整金额"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onCancel}>取消</Button>
        <Button variant="brand" onClick={onSave} disabled={saving} loading={saving}>确认调整</Button>
      </div>
    </CardContent>
  </Card>
));
BudgetAdjustmentModal.displayName = 'BudgetAdjustmentModal';

// ── Budget Change Log ──────────────────────────────────
const BudgetChangeLog = memo(({ changeLog, fmt }: { changeLog: ChangeLogEntry[]; fmt: (v: number) => string }) => (
  <Card className="lg:col-span-1">
    <CardHeader>
      <CardTitle><History className="w-4 h-4 inline mr-1" />预算修改记录</CardTitle>
    </CardHeader>
    <CardContent>
      {changeLog.length === 0 ? (
        <p className="text-xs text-neutral-400 py-4 text-center">暂无记录</p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {changeLog.map((log, i) => (
            <div key={log.id || i} className="flex gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  log.action === '批复通过' ? 'bg-emerald-500' : log.action?.includes('重新批复') ? 'bg-amber-500' : 'bg-blue-500'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{log.action}</p>
                <p className="text-[10px] text-neutral-400 truncate">
                  Q1:{fmt(log.q1_budget || 0)} Q2:{fmt(log.q2_budget || 0)} Q3:{fmt(log.q3_budget || 0)} Q4:{fmt(log.q4_budget || 0)}
                </p>
                <p className="text-[10px] text-neutral-400">{new Date(log.created_at).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
));
BudgetChangeLog.displayName = 'BudgetChangeLog';

// ── Quarterly Plan Card ────────────────────────────────
interface QuarterlyPlanCardProps {
  quarter: string;
  qIndex: number;
  qBudget: number;
  qOriginalBudget?: number;
  qAdjust?: number;
  items: PlanActivity[];
  partners: any[];
  partnerMDF: Record<string, PartnerMDF>;
  currentYear: number;
  onUpdateRow: (id: string, field: string, value: any) => void;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onSaveRows: (status: 'draft' | 'submitted') => void;
  onApproveAll: () => void;
  onReload: () => void;
  fmt: (v: number) => string;
  saving: boolean;
}

const QuarterlyPlanCard = memo(({
  quarter, qIndex, qBudget, qOriginalBudget, qAdjust, items, partners, partnerMDF, currentYear,
  onUpdateRow, onAddRow, onRemoveRow, onSaveRows, onApproveAll, onReload, fmt,
  saving,
}: QuarterlyPlanCardProps) => {
  const lineTotal = useMemo(() => items.reduce((s, p) => s + Number(p.total_budget || 0), 0), [items]);
  const approvedTotal = useMemo(() => items.reduce((s, p) => s + Number(p.approved_amount || 0), 0), [items]);
  const remaining = qBudget - approvedTotal;
  const planStatus = items.length > 0 ? (items[0].plan_status || 'draft') : 'draft';
  const pmdfCount = useMemo(() => items.filter(p => p.activity_type === 'PMDF').length, [items]);
  const totalAttendees = useMemo(() => items.reduce((s, p) => s + Number(p.expected_attendees || 0), 0), [items]);

  const planStatusColors: Record<string, string> = { draft: 'text-neutral-400 bg-neutral-100', submitted: 'text-neutral-400 bg-neutral-100', approved: 'text-blue-600 bg-blue-50' };
  const planStatusLabels: Record<string, string> = { draft: '草稿', submitted: '草稿', approved: '已批复' };

  const categoryBreakdown = useMemo(() => {
    const catMap: Record<string, { count: number; budget: number; approved: number; attendees: number }> = {};
    items.forEach(p => {
      const cat = p.category || '其他';
      if (!catMap[cat]) catMap[cat] = { count: 0, budget: 0, approved: 0, attendees: 0 };
      catMap[cat].count++;
      catMap[cat].budget += Number(p.total_budget || 0);
      catMap[cat].approved += Number(p.approved_amount || 0);
      catMap[cat].attendees += Number(p.expected_attendees || 0);
    });
    return Object.entries(catMap);
  }, [items]);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-8 rounded-full" style={{ background: QCOLORS[qIndex] }} />
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{quarter} 季度活动计划</CardTitle>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${planStatusColors[planStatus] || planStatusColors.draft}`}>
                {planStatusLabels[planStatus] || '草稿'}
              </span>
            </div>
            <span className="text-xs text-neutral-400">
              季度预算 {fmt(qBudget)}
              {qOriginalBudget && qOriginalBudget !== qBudget ? <span className="text-amber-600"> (调整: {qAdjust && qAdjust > 0 ? '+' : ''}{fmt(qAdjust||0)})</span> : ''}
              {' · '}已批复 {fmt(approvedTotal)} · {items.length} 项
              {lineTotal > 0 && <> · 申请 {fmt(lineTotal)}</>}
              {' · '}
              {remaining >= 0 ? <span className="text-emerald-600">剩余 {fmt(remaining)}</span> : <span className="text-red-500">超支 {fmt(Math.abs(remaining))}</span>}
              {pmdfCount > 0 && <span className="text-purple-500"> · PMDF {pmdfCount}项</span>}
            </span>
            {qOriginalBudget && qOriginalBudget !== qBudget && (
              <span className="text-[10px] text-amber-600 mt-0.5 block">
                📌 原计划 {fmt(qOriginalBudget)} → 调整后 {fmt(qBudget)}
              </span>
            )}
            {/* 效能进度条 */}
            {qBudget > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>预算执行: {Math.round((approvedTotal / qBudget) * 100)}%</span>
                  <span>目标达成率: {items.filter((p:any) => p.execution_status === 'executed').length > 0 ? Math.round(items.filter((p:any) => p.execution_status === 'executed').length / Math.max(items.length, 1) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(Math.round((approvedTotal / qBudget) * 100), 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={onAddRow} disabled={saving}><Plus className="w-3.5 h-3.5" />添加</Button>
          <Button variant="secondary" size="sm" onClick={() => onSaveRows('draft')} disabled={saving} loading={saving}>保存</Button>
          <Button variant="brand" size="sm" onClick={() => onSaveRows('submitted')} disabled={saving} loading={saving}>提交</Button>
          {items.length > 0 && planStatus === 'submitted' && (
            <Button variant="brand" size="sm" onClick={onApproveAll} disabled={saving} loading={saving}>批复通过</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-neutral-400 py-4 text-center">暂无活动计划，点击"添加"创建</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500">
                  <th className="text-left py-2 px-2">类型</th>
                  <th className="text-left py-2 px-2">合作伙伴</th>
                  <th className="text-left py-2 px-2">类别</th>
                  <th className="text-left py-2 px-2">业务目标</th>
                  <th className="text-left py-2 px-2">城市</th>
                  <th className="text-left py-2 px-2">时间</th>
                  <th className="text-right py-2 px-2">总预算</th>
                  <th className="text-right py-2 px-2">批复</th>
                  <th className="text-right py-2 px-2">参加人数</th>
                  <th className="text-left py-2 px-2">产出</th>
                  <th className="text-left py-2 px-2">负责人</th>
                  <th className="text-center py-2 px-2">状态</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map(p => {
                  const isPMDF = (p.activity_type || 'Marketing') === 'PMDF';
                  const execStatus = normalizeExecStatus(p.execution_status);
                  return (
                    <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-2 px-2">
                        <select value={p.activity_type || 'Marketing'} onChange={e => onUpdateRow(p.id, 'activity_type', e.target.value)} className="w-16 bg-transparent text-[11px] focus:outline-none">
                          <option value="Marketing">Marketing</option>
                          <option value="PMDF">PMDF</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        {isPMDF ? (
                          <div>
                            <SearchableSelect
                              value={p.partner_id || ''}
                              onChange={(id, label) => { onUpdateRow(p.id, 'partner_id', id); onUpdateRow(p.id, 'partner_name', label); }}
                              options={partners.map((pt: any) => ({ id: pt.id, label: pt.name, sub: pt.tier }))}
                              placeholder="搜索伙伴..."
                              className="w-28"
                            />
                            {p.partner_id && partnerMDF[p.partner_id] && (
                              <span className={`text-[9px] block ${partnerMDF[p.partner_id].remaining > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                MDF: {fmt(partnerMDF[p.partner_id].allocated)} / 余{fmt(partnerMDF[p.partner_id].remaining)}
                              </span>
                            )}
                          </div>
                        ) : <span className="text-neutral-400 text-[11px]">自办</span>}
                      </td>
                      <td className="py-2 px-2">
                        <select value={p.category || '线下峰会'} onChange={e => onUpdateRow(p.id, 'category', e.target.value)} className="w-16 bg-transparent text-[11px] focus:outline-none">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <select value={(p as any).business_objective || '品牌曝光'} onChange={e => onUpdateRow(p.id, 'business_objective', e.target.value)} className="w-20 bg-transparent text-[11px] focus:outline-none">
                          {['拉新','存量增购','品牌曝光','新产品抢位','客户关系'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input className="w-20 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/30" value={p.city || ''} onChange={e => onUpdateRow(p.id, 'city', e.target.value)} placeholder="城市" />
                      </td>
                      <td className="py-2 px-2">
                        <input className="w-28 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/30" type="date" value={p.expected_date || ''} onChange={e => onUpdateRow(p.id, 'expected_date', e.target.value)} />
                      </td>
                      <td className="py-2 px-2">
                        <input className="w-20 text-right bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/30" type="number" value={p.total_budget || ''} onChange={e => onUpdateRow(p.id, 'total_budget', e.target.value)} />
                        {(p as any).actual_spend > 0 && (
                          <span className={`text-[9px] block ${(p as any).actual_spend > p.total_budget ? 'text-red-500' : 'text-emerald-500'}`}>
                            实: {fmt((p as any).actual_spend)} {((p as any).actual_spend - p.total_budget)/p.total_budget > 0.2 ? '🔴' : '🟢'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <input className="w-20 text-right bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/30" type="number" value={p.approved_amount || ''} onChange={e => onUpdateRow(p.id, 'approved_amount', e.target.value)} />
                      </td>
                      <td className="py-2 px-2">
                        <input className="w-12 text-right bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/30" type="number" value={p.expected_attendees || ''} onChange={e => onUpdateRow(p.id, 'expected_attendees', e.target.value)} />
                      </td>
                      <td className="py-2 px-2">
                        <input className="w-16 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/30" value={p.expected_output || ''} onChange={e => onUpdateRow(p.id, 'expected_output', e.target.value)} placeholder="线索/商机" />
                        {(p as any).actual_leads > 0 && (
                          <button onClick={() => navigate('/deals')} className="text-[9px] block text-blue-500 hover:underline">
                            实: {(p as any).actual_leads}条 · {(p as any).actual_opps||0}商机 →
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <input className="w-16 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/30" value={p.responsible_person || ''} onChange={e => onUpdateRow(p.id, 'responsible_person', e.target.value)} placeholder="姓名" />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={execStatus}
                          onChange={e => onUpdateRow(p.id, 'execution_status', e.target.value)}
                          className={`w-16 bg-transparent text-[11px] focus:outline-none ${execStatus === 'executed' ? 'text-emerald-600' : execStatus === 'approved' ? 'text-blue-600' : 'text-neutral-500'}`}
                        >
                          {EXEC_STATUSES.map(s => <option key={s} value={s}>{EXEC_LABELS[s]}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <button onClick={() => onRemoveRow(p.id)} className="p-1 text-neutral-400 hover:text-red-500 transition-colors" title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {/* Category breakdown rows */}
                {categoryBreakdown.map(([cat, agg]) => (
                  <tr key={`cat-${cat}`} className="text-[10px] text-neutral-500">
                    <td className="py-1 px-2" colSpan={5}>  └ {cat} ({agg.count}项)</td>
                    <td className="py-1 px-2 text-right">{fmt(agg.budget)}</td>
                    <td className="py-1 px-2 text-right">{fmt(agg.approved)}</td>
                    <td className="py-1 px-2 text-right">{agg.attendees}</td>
                    <td colSpan={4} />
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-neutral-50 dark:bg-neutral-800/50 font-semibold text-[11px]">
                  <td className="py-2 px-2" colSpan={5}>合计 {items.length} 项</td>
                  <td className="py-2 px-2 text-right">{fmt(lineTotal)}</td>
                  <td className="py-2 px-2 text-right">{fmt(approvedTotal)}</td>
                  <td className="py-2 px-2 text-right">{totalAttendees}</td>
                  <td colSpan={4} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
QuarterlyPlanCard.displayName = 'QuarterlyPlanCard';

// ── Main Page Component ────────────────────────────────
export const MarketingPlanPage = () => {
  const navigate = useNavigate();
  const { config: appConfig } = useConfig();
  const { toast } = useToast();
  const globalCurrency = (appConfig?.currency || 'CNY') as 'CNY' | 'USD';
  const fmtW = useCallback((v: number) => formatCurrency(v, globalCurrency), [globalCurrency]);

  const now = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [plan, setPlan] = useState<PlanActivity[]>([]);
  const [config, setConfig] = useState<BudgetConfig>({
    annual_budget: 0, q1_budget: 0, q2_budget: 0, q3_budget: 0, q4_budget: 0,
    status: 'draft', q1_adjust: 0, q2_adjust: 0, q3_adjust: 0, q4_adjust: 0,
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [partnerMDF, setPartnerMDF] = useState<Record<string, PartnerMDF>>({});
  const [showAdjust, setShowAdjust] = useState(false);
  const [savingRows, setSavingRows] = useState(false);

  // Available years cache
  const availableYears = useMemo(
    () => Array.from({ length: (now.getFullYear() + 1) - 2024 + 1 }, (_, i) => 2024 + i),
    [now],
  );

  // ── Load Data ────────────────────────────────────────
  const loadData = useCallback((year: number) => {
    setDataLoaded(false);
    // Run all queries in parallel
    Promise.all([
      supabase.from('marketing_budget_config').select('*').eq('id', 'current').single(),
      supabase.from('marketing_plan').select('*').eq('year', year).order('quarter'),
      supabase.from('budget_change_log').select('*').eq('config_id', 'current').order('created_at', { ascending: false }).limit(20),
      supabase.from('marketing_activities').select('*').order('event_date'),
      supabase.from('partners').select('id, name, tier').order('name'),
      supabase.from('mdf_allocations').select('*'),
    ]).then(([budgetRes, planRes, logRes, actRes, partnerRes, mdfRes]: any[]) => {
      if (budgetRes.error) console.warn('Failed to load budget config:', budgetRes.error.message);
      if (budgetRes.data) setConfig(budgetRes.data);

      if (planRes.data?.length) setPlan(planRes.data);
      else setPlan([]);

      if (logRes.data) setChangeLog(logRes.data);

      if (actRes.data) setActivities(actRes.data);

      if (partnerRes.data) setPartners(partnerRes.data);

      if (mdfRes.data) {
        const mdfMap: Record<string, PartnerMDF> = {};
        mdfRes.data.forEach((a: any) => {
          const pid = a.partner_id;
          if (!pid) return;
          if (!mdfMap[pid]) mdfMap[pid] = { allocated: 0, used: 0, remaining: 0 };
          mdfMap[pid].allocated += Number(a.amount || 0);
          if (a.status === 'used') mdfMap[pid].used += Number(a.amount || 0);
          mdfMap[pid].remaining = mdfMap[pid].allocated - mdfMap[pid].used;
        });
        setPartnerMDF(mdfMap);
      }
      setDataLoaded(true);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setDataLoaded(true);
      toast('error', '数据加载失败，请刷新页面重试');
    });
  }, [toast]);

  useEffect(() => { loadData(currentYear); }, [currentYear, loadData]);

  // ── Computed Values ──────────────────────────────────
  const actualSpendQ = useMemo(() => {
    const spend = [0, 0, 0, 0];
    activities.forEach((a: any) => {
      const d = a.event_date || a.date || '';
      if (!d) return;
      const m = parseInt(d.split('-')[1] || '0');
      const val = Number(a.actual_spend || a.actualSpend || 0);
      if (m >= 1 && m <= 3) spend[0] += val;
      else if (m >= 4 && m <= 6) spend[1] += val;
      else if (m >= 7 && m <= 9) spend[2] += val;
      else if (m >= 10 && m <= 12) spend[3] += val;
    });
    return spend;
  }, [activities]);

  const qBudgets = useMemo(
    () => QUARTERS.map((_, i) => Number(config[`q${i + 1}_budget` as keyof BudgetConfig] || 0) + Number(config[`q${i + 1}_adjust` as keyof BudgetConfig] || 0)),
    [config],
  );

  const annualBudget = useMemo(() => qBudgets.reduce((s, v) => s + v, 0), [qBudgets]);
  const originalQBudgets = useMemo(
    () => QUARTERS.map((_, i) => Number(config[`q${i + 1}_budget` as keyof BudgetConfig] || 0)),
    [config],
  );
  const baseAnnual = useMemo(
    () => QUARTERS.reduce((s, _, i) => s + Number(config[`q${i + 1}_budget` as keyof BudgetConfig] || 0), 0),
    [config],
  );
  const totalAdjust = useMemo(
    () => QUARTERS.reduce((s, _, i) => s + Number(config[`q${i + 1}_adjust` as keyof BudgetConfig] || 0), 0),
    [config],
  );
  const totalActual = useMemo(() => actualSpendQ.reduce((s, v) => s + v, 0), [actualSpendQ]);

  const isDraft = config.status === 'draft';
  const isPending = config.status === 'pending';
  const isApproved = config.status === 'approved';
  const isEditable = isDraft;

  // Plan-level stats
  const totalPlans = plan.length;
  const completedPlans = useMemo(() => plan.filter(p => normalizeExecStatus(p.execution_status) === 'executed').length, [plan]);
  const inProgressPlans = useMemo(() => plan.filter(p => normalizeExecStatus(p.execution_status) === 'approved').length, [plan]);
  const totalBudgetRequested = useMemo(() => plan.reduce((s, p) => s + Number(p.total_budget || 0), 0), [plan]);
  const totalBudgetApproved = useMemo(() => plan.reduce((s, p) => s + Number(p.approved_amount || 0), 0), [plan]);
  const totalExpectedAttendees = useMemo(() => plan.reduce((s, p) => s + Number(p.expected_attendees || 0), 0), [plan]);
  const budgetUtilizationRate = annualBudget > 0 ? Math.round((totalActual / annualBudget) * 100) : 0;

  // ── Stats items ──────────────────────────────────────
  const forecastPipeline = useMemo(() => totalPlans * 850000, [totalPlans]);
  const forecastROI = annualBudget > 0 ? (forecastPipeline / annualBudget).toFixed(1) : '0';
  const varianceCount = useMemo(() => plan.filter(p => {
    const spendVariance = p.total_budget > 0 && p.actual_spend ? Math.abs((p.actual_spend - p.total_budget)/p.total_budget) : 0;
    const leadsVariance = p.expected_output && p.actual_leads ? Math.abs((p.actual_leads - parseInt(p.expected_output||'0'))/parseInt(p.expected_output||'1')) : 0;
    return spendVariance > 0.2 || leadsVariance > 0.5;
  }).length, [plan]);

  const statsItems = useMemo(() => [
    { label: '预估商机贡献总额', value: fmtW(forecastPipeline), sub: `预估ROI 1:${forecastROI} · ${totalPlans}项活动`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: '年度总预算', value: fmtW(annualBudget), sub: `执行率 ${budgetUtilizationRate}%`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: '活动计划', value: totalPlans + ' 项', sub: `进行中${inProgressPlans} · 已完成${completedPlans}`, icon: PieChart, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: '偏差预警', value: varianceCount > 0 ? `⚠️ ${varianceCount}项` : '✅ 正常', sub: varianceCount > 0 ? '预算或线索偏离超阈值' : '所有活动按计划执行', icon: AlertCircle, color: varianceCount > 0 ? 'text-red-500' : 'text-emerald-500', bg: varianceCount > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
  ], [fmtW, annualBudget, budgetUtilizationRate, totalPlans, inProgressPlans, completedPlans, forecastPipeline, forecastROI, varianceCount]);

  // ── Actions ──────────────────────────────────────────
  const logChange = useCallback(async (action: string) => {
    await supabase.from('budget_change_log').insert({
      config_id: 'current', action,
      q1_budget: qBudgets[0], q2_budget: qBudgets[1],
      q3_budget: qBudgets[2], q4_budget: qBudgets[3],
    });
  }, [qBudgets]);

  const reloadChangeLog = useCallback(() => {
    supabase.from('budget_change_log').select('*').eq('config_id', 'current')
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }: any) => { if (data) setChangeLog(data); });
  }, []);

  const saveConfig = useCallback(async (status?: string) => {
    setSavingConfig(true);
    setErrorMsg('');
    if (!dataLoaded || annualBudget <= 0) {
      setErrorMsg('数据加载中，请稍后再试');
      setSavingConfig(false);
      return;
    }
    const update: any = {
      annual_budget: baseAnnual,
      q1_budget: qBudgets[0] - Number(config.q1_adjust || 0),
      q2_budget: qBudgets[1] - Number(config.q2_adjust || 0),
      q3_budget: qBudgets[2] - Number(config.q3_adjust || 0),
      q4_budget: qBudgets[3] - Number(config.q4_adjust || 0),
    };
    if (status) update.status = status;
    if (status === 'approved') update.approved_at = new Date().toISOString();
    if (status === 'draft') {
      update.approved_at = null;
      update.q1_adjust = 0; update.q2_adjust = 0;
      update.q3_adjust = 0; update.q4_adjust = 0;
    }

    const { error } = await supabase.from('marketing_budget_config').upsert({ id: 'current', ...update });
    if (error) {
      setErrorMsg('保存失败: ' + error.message + ' (code: ' + error.code + ')');
      setSavingConfig(false);
      toast('error', '预算保存失败');
      return;
    }
    const actionLabel = status === 'approved' ? '批复通过' : status === 'pending' ? '提交审批' : status === 'draft' ? '重新批复（恢复编辑）' : '保存';
    await logChange(actionLabel);
    // Create baseline snapshot on approval
    if (status === 'approved') {
      await supabase.from('plan_baselines').insert({ year: currentYear, field_name: 'annual_budget', planned_value: JSON.stringify({ annual: annualBudget, q1:qBudgets[0],q2:qBudgets[1],q3:qBudgets[2],q4:qBudgets[3] }), status: 'active' });
    }
    setConfig(prev => ({ ...prev, ...update }));
    setSavingConfig(false);
    reloadChangeLog();
    toast('success', actionLabel + '成功');
  }, [dataLoaded, annualBudget, baseAnnual, qBudgets, config, logChange, reloadChangeLog, toast]);

  const saveAdjustment = useCallback(async () => {
    setSavingConfig(true);
    setErrorMsg('');
    const newQ1 = Number(config.q1_budget || 0) + Number(config.q1_adjust || 0);
    const newQ2 = Number(config.q2_budget || 0) + Number(config.q2_adjust || 0);
    const newQ3 = Number(config.q3_budget || 0) + Number(config.q3_adjust || 0);
    const newQ4 = Number(config.q4_budget || 0) + Number(config.q4_adjust || 0);
    const { error } = await supabase.from('marketing_budget_config').upsert({
      id: 'current', status: 'approved',
      q1_budget: newQ1, q2_budget: newQ2, q3_budget: newQ3, q4_budget: newQ4,
      q1_adjust: 0, q2_adjust: 0, q3_adjust: 0, q4_adjust: 0,
    });
    if (error) {
      setErrorMsg('调整失败: ' + error.message);
      setSavingConfig(false);
      toast('error', '预算调整失败');
      return;
    }
    setConfig(prev => ({
      ...prev, q1_budget: newQ1, q2_budget: newQ2, q3_budget: newQ3, q4_budget: newQ4,
      q1_adjust: 0, q2_adjust: 0, q3_adjust: 0, q4_adjust: 0,
    }));
    setShowAdjust(false);
    setSavingConfig(false);
    // Audit log
    await supabase.from('plan_audit_logs').insert({ plan_config_id: 'current', field_changed: '季度预算调整', old_value: JSON.stringify({q1:config.q1_budget,q2:config.q2_budget,q3:config.q3_budget,q4:config.q4_budget}), new_value: JSON.stringify({q1:newQ1,q2:newQ2,q3:newQ3,q4:newQ4}), change_reason: '预算调整', changed_by: '渠道经理' });
    await logChange('预算调整');
    toast('success', '预算调整成功');
  }, [config, toast]);

  const handleConfigChange = useCallback((update: Partial<BudgetConfig>) => {
    setConfig(prev => ({ ...prev, ...update }));
  }, []);

  // Plan row actions
  const updateRow = useCallback((id: string, field: string, value: any) => {
    setPlan(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  const addRow = useCallback((quarter: string) => {
    setPlan(prev => [...prev, {
      id: 'new-' + Date.now() + Math.random(),
      year: currentYear, quarter, activity_type: 'Marketing',
      partner_id: '', partner_name: '', category: '线下峰会',
      region: '', city: '', expected_date: '',
      total_budget: 0, approved_amount: 0, expected_attendees: 0,
      expected_output: '', responsible_person: '', goal: '',
      execution_status: 'draft', budget: 0, target_leads: 0, target_opps: 0,
      _new: true,
    }]);
  }, [currentYear]);

  const removeRow = useCallback((id: string) => {
    setPlan(prev => prev.filter(p => p.id !== id));
  }, []);

  const savePlanRows = useCallback(async (quarter: string, targetPlanStatus: 'draft' | 'submitted') => {
    setSavingRows(true);
    const items = plan.filter(p => normalizeQuarter(p.quarter) === quarter);
    try {
      const results = await Promise.all(items.map(async (p) => {
        const r: any = {
          year: currentYear, quarter, category: p.category,
          activity_type: p.activity_type, partner_id: p.partner_id,
          partner_name: p.partner_name, region: p.region, city: p.city,
          expected_date: p.expected_date,
          total_budget: Number(p.total_budget) || 0,
          approved_amount: Number(p.approved_amount) || 0,
          expected_attendees: Number(p.expected_attendees) || 0,
          expected_output: p.expected_output,
          responsible_person: p.responsible_person, goal: p.goal,
          execution_status: normalizeExecStatus(p.execution_status),
          plan_status: targetPlanStatus,
          budget: Number(p.total_budget) || 0,
          target_leads: Number(p.expected_output) || 0,
          target_opps: 0,
        };
        if (p._new) {
          const { data, error } = await supabase.from('marketing_plan').insert(r).select();
          return { success: !error, id: p.id, newId: data?.[0]?.id };
        } else {
          const { error } = await supabase.from('marketing_plan').update(r).eq('id', p.id);
          return { success: !error, id: p.id };
        }
      }));

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      if (failedCount === 0) {
        toast('success', `${quarter} 季度计划保存成功`);
        setPlan(prev => prev.map(p => {
          const result = results.find(r => r.id === p.id);
          if (result?.newId) {
            return { ...p, id: result.newId, _new: undefined };
          }
          return p;
        }));
      } else {
        toast('error', `${quarter} 季度计划部分保存失败 (成功 ${successCount} 项, 失败 ${failedCount} 项)`);
      }
    } catch (err: any) {
      toast('error', '保存失败: ' + (err.message || '未知错误'));
    } finally {
      setSavingRows(false);
    }
  }, [plan, currentYear, toast]);

  const approveAll = useCallback(async (quarter: string) => {
    const items = plan.filter(p => normalizeQuarter(p.quarter) === quarter);
    if (items.length === 0) return;
    try {
      const results = await Promise.all(
        items.map(async (p) => {
          const { error } = await supabase.from('marketing_plan').update({ plan_status: 'approved' }).eq('id', p.id);
          return { success: !error, id: p.id };
        })
      );
      const successCount = results.filter(r => r.success).length;
      if (successCount === items.length) {
        toast('success', `${quarter} 季度全部批复通过`);
        setPlan(prev => prev.map(p => {
          if (normalizeQuarter(p.quarter) === quarter) {
            return { ...p, plan_status: 'approved' };
          }
          return p;
        }));
      } else {
        toast('error', `${quarter} 季度部分批复失败 (成功 ${successCount} 项)`);
      }
    } catch (err: any) {
      toast('error', '批复失败: ' + (err.message || '未知错误'));
    }
  }, [plan, toast]);

  const saveAllPlans = useCallback(async (targetPlanStatus: 'draft' | 'submitted') => {
    setSavingRows(true);
    let totalSuccess = 0;
    let totalFailed = 0;

    try {
      for (const quarter of QUARTERS) {
        const items = plan.filter(p => normalizeQuarter(p.quarter) === quarter);
        if (items.length === 0) continue;

        const results = await Promise.all(items.map(async (p) => {
          const r: any = {
            year: currentYear, quarter, category: p.category,
            activity_type: p.activity_type, partner_id: p.partner_id,
            partner_name: p.partner_name, region: p.region, city: p.city,
            expected_date: p.expected_date,
            total_budget: Number(p.total_budget) || 0,
            approved_amount: Number(p.approved_amount) || 0,
            expected_attendees: Number(p.expected_attendees) || 0,
            expected_output: p.expected_output,
            responsible_person: p.responsible_person, goal: p.goal,
            execution_status: normalizeExecStatus(p.execution_status),
            plan_status: targetPlanStatus,
            budget: Number(p.total_budget) || 0,
            target_leads: Number(p.expected_output) || 0,
            target_opps: 0,
          };
          if (p._new) {
            const { data, error } = await supabase.from('marketing_plan').insert(r).select();
            return { success: !error, id: p.id, newId: data?.[0]?.id };
          } else {
            const { error } = await supabase.from('marketing_plan').update(r).eq('id', p.id);
            return { success: !error, id: p.id };
          }
        }));

        const successCount = results.filter(r => r.success).length;
        totalSuccess += successCount;
        totalFailed += results.length - successCount;

        setPlan(prev => prev.map(p => {
          const result = results.find(r => r.id === p.id);
          if (result?.newId) {
            return { ...p, id: result.newId, _new: undefined, plan_status: targetPlanStatus };
          }
          if (result?.success) {
            return { ...p, plan_status: targetPlanStatus };
          }
          return p;
        }));
      }

      if (totalFailed === 0) {
        toast('success', '所有季度计划保存成功');
      } else {
        toast('error', `计划保存完成 (成功 ${totalSuccess} 项, 失败 ${totalFailed} 项)`);
      }
    } catch (err: any) {
      toast('error', '保存失败: ' + (err.message || '未知错误'));
    } finally {
      setSavingRows(false);
    }
  }, [plan, currentYear, toast]);

  // ── Quarterly items grouped ──────────────────────────
  const quarterlyItems = useMemo(() => {
    return QUARTERS.map(q => plan.filter(p => normalizeQuarter(p.quarter) === q));
  }, [plan]);

  // ── Render ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/marketing')}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
                年度营销预算规划 · <span className="text-sm font-normal text-neutral-500">{currencyName(globalCurrency)} ({globalCurrency})</span>
              </h1>
              {/* Year selector */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-1">
                <button
                  onClick={() => currentYear > 2024 && setCurrentYear(prev => prev - 1)}
                  disabled={currentYear <= 2024}
                  className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <select
                  value={currentYear}
                  onChange={e => setCurrentYear(Number(e.target.value))}
                  className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer px-1"
                >
                  {availableYears.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <button
                  onClick={() => currentYear < now.getFullYear() + 1 && setCurrentYear(prev => prev + 1)}
                  disabled={currentYear >= now.getFullYear() + 1}
                  className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-neutral-500">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BG[config.status] || STATUS_BG.draft} ${STATUS_COLOR[config.status] || STATUS_COLOR.draft}`}>
                {STATUS_LABEL[config.status] || STATUS_LABEL.draft}
              </span>
              {isDraft && ' · 可编辑年度和季度预算'}
              {isPending && ' · 等待市场总监批复'}
              {isApproved && ' · 已锁定，可申请调整预算'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!dataLoaded && (
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />加载中...
            </span>
          )}
          {dataLoaded && isDraft && (
            <>
              <Button variant="secondary" size="sm" onClick={() => saveConfig()} disabled={savingConfig} loading={savingConfig}>
                <Save className="w-4 h-4" />保存
              </Button>
              <Button variant="brand" size="sm" onClick={() => saveConfig('pending')} disabled={savingConfig} loading={savingConfig}>
                <Send className="w-4 h-4" />提交审批
              </Button>
            </>
          )}
          {dataLoaded && isPending && (
            <>
              <Button variant="danger" size="sm" onClick={() => saveConfig('draft')} disabled={savingConfig}>
                <XCircle className="w-4 h-4" />驳回
              </Button>
              <Button variant="brand" size="sm" onClick={() => saveConfig('approved')} disabled={savingConfig} loading={savingConfig}>
                <CheckCircle2 className="w-4 h-4" />批复通过
              </Button>
            </>
          )}
          {dataLoaded && isApproved && !showAdjust && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowAdjust(true)}>
                <TrendingUp className="w-4 h-4" />调整预算
              </Button>
              <Button variant="secondary" size="sm" onClick={() => saveConfig('draft')}>
                <RefreshCw className="w-4 h-4" />重新批复
              </Button>
            </>
          )}
          {dataLoaded && (
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
          )}
          {dataLoaded && plan.length > 0 && (
            <>
              <Button variant="secondary" size="sm" onClick={() => saveAllPlans('draft')} disabled={savingRows} loading={savingRows}>
                <Save className="w-4 h-4" />保存全部
              </Button>
              <Button variant="brand" size="sm" onClick={() => saveAllPlans('submitted')} disabled={savingRows} loading={savingRows}>
                <Send className="w-4 h-4" />全部提交
              </Button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-auto text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

      {/* Stats Cards */}
      <StatsGrid items={statsItems} />

      {/* Budget Adjustment Modal */}
      {showAdjust && (
        <BudgetAdjustmentModal
          config={config}
          onConfigChange={handleConfigChange}
          onCancel={() => setShowAdjust(false)}
          onSave={saveAdjustment}
          saving={savingConfig}
          fmt={fmtW}
        />
      )}

      {/* Budget Display + Change Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BudgetChangeLog changeLog={changeLog} fmt={fmtW} />
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>年度预算 {isApproved ? '（已批复）' : isPending ? '（已提交）' : '（可编辑）'}</CardTitle>
              {totalAdjust > 0 && <span className="text-xs text-amber-600">含调整预算 {fmtW(totalAdjust)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-neutral-500">预算</span>
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-neutral-500">实际支出</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                <p className="text-[10px] text-blue-600 uppercase">总预算</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{fmtW(annualBudget)}</p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                <p className="text-[10px] text-neutral-400 uppercase">原批复</p>
                <p className="text-xl font-bold">{fmtW(baseAnnual)}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                <p className="text-[10px] text-amber-600 uppercase">调整</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{fmtW(totalAdjust)}</p>
              </div>
            </div>
            <div className="space-y-4">
              {QUARTERS.map((q, i) => {
                const actual = actualSpendQ[i];
                const pct = qBudgets[i] > 0 ? Math.round((actual / qBudgets[i]) * 100) : 0;
                const diff = qBudgets[i] - actual;
                const curQ = Math.floor(now.getMonth() / 3) + 1;
                return (
                  <div key={q} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: QCOLORS[i] }} />
                        <span className="text-sm font-semibold">{q}</span>
                        {curQ === i + 1 && (
                          <span className="text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded">当前</span>
                        )}
                        {isEditable ? (
                          <input
                            type="number"
                            className="w-36 h-8 px-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={qBudgets[i] || ''}
                            onChange={e => handleConfigChange({ [`q${i + 1}_budget`]: Number(e.target.value) } as any)}
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-sm font-bold">{fmtW(qBudgets[i])}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${pct > 100 ? 'text-red-500' : pct > 80 ? 'text-amber-500' : 'text-emerald-600'}`}>
                          实际 {fmtW(actual)}
                        </span>
                        <span className={`text-xs font-medium ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {diff >= 0 ? `剩余 ${fmtW(diff)}` : `超支 ${fmtW(Math.abs(diff))}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${pct > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 min-w-[3ch] text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Distribution Chart */}
      <Card>
        <CardHeader><CardTitle>{currentYear}年度预算分配与执行情况</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <PieSVG data={qBudgets} size={140} currency={globalCurrency} />
            <div className="flex-1">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {QUARTERS.map((q, i) => {
                  const remaining = qBudgets[i] - actualSpendQ[i];
                  const pct = qBudgets[i] > 0 ? Math.round((actualSpendQ[i] / qBudgets[i]) * 100) : 0;
                  return (
                    <div key={q} className="p-3 rounded-lg" style={{ backgroundColor: `${QCOLORS[i]}15` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: QCOLORS[i] }} />
                        <span className="text-xs font-medium">{q}</span>
                      </div>
                      <p className="text-lg font-bold" style={{ color: QCOLORS[i] }}>{fmtW(qBudgets[i])}</p>
                      <p className="text-[10px] text-neutral-500">
                        已支出 {fmtW(actualSpendQ[i])} ({pct}%) ·{' '}
                        {remaining >= 0 ? <span className="text-emerald-600">剩余 {fmtW(remaining)}</span> : <span className="text-red-500">超支 {fmtW(Math.abs(remaining))}</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400">年度预算总计</span>
                  <span className="font-bold text-blue-600">{fmtW(annualBudget)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400">年度实际支出</span>
                  <span className="font-bold text-emerald-600">{fmtW(totalActual)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400">预算申请总额</span>
                  <span className="font-bold text-amber-600">{fmtW(totalBudgetRequested)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400">预算批复总额</span>
                  <span className="font-bold text-purple-600">{fmtW(totalBudgetApproved)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Activity Plans */}
      {QUARTERS.map((q, i) => (
        <QuarterlyPlanCard
          key={q}
          quarter={q}
          qIndex={i}
          qBudget={qBudgets[i]}
          qOriginalBudget={originalQBudgets[i]}
          qAdjust={(qBudgets[i]||0) - (originalQBudgets[i]||0)}
          items={quarterlyItems[i]}
          partners={partners}
          partnerMDF={partnerMDF}
          currentYear={currentYear}
          onUpdateRow={updateRow}
          onAddRow={() => addRow(q)}
          onRemoveRow={removeRow}
          onSaveRows={(status) => savePlanRows(q, status)}
          onApproveAll={() => approveAll(q)}
          onReload={() => loadData(currentYear)}
          fmt={fmtW}
          saving={savingRows}
        />
      ))}

      {/* Footer navigation */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-neutral-400">
          {savingRows && (
            <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />保存中...</span>
          )}
        </p>
        <Button variant="secondary" onClick={() => navigate('/marketing')}>返回营销首页</Button>
      </div>
    </div>
  );
};
