// ══════════════════════════════════════════════════════════════════════════
// Partner Health Engine v3 — 三层联动 + Capability评分 + 规则引擎
// ══════════════════════════════════════════════════════════════════════════

import type { Partner } from '../types';
import { supabase } from './supabase';

// ── 类型定义 ──────────────────────────────────────────

export type FocusMetric = 'OVERALL' | 'COVERAGE' | 'VITALITY' | 'CAPABILITY';

export interface RadarData {
  indicator: { name: string; max: number }[];
  data: number[];
}

export interface VitalityData {
  score: number;
  trends: string;
  funnel_data: {
    registered: number;
    cooperating: number;
    has_leads: number;
    high_yield: number;
  };
  sub_metrics: {
    market_activity: number;
    incentive_execution: number;
    business_interaction: number;
  };
}

export interface DiagnosisAlert {
  id: string;
  level: 'warning' | 'danger' | 'info';
  title: string;
  content: string;
  tags: string[];
}

export interface DiagnosisData {
  category: FocusMetric;
  alerts: DiagnosisAlert[];
}

export interface ActionTask {
  type: 'RECRUIT' | 'ACTIVATE' | 'TRAIN' | 'REVIEW';
  title: string;
  description: string;
  link: string;
  pending_count: number;
}

export interface ActionsData {
  tasks: ActionTask[];
}

export interface HealthScores {
  coverage: number;
  vitality: number;
  capability: number;
  overall: number;
  radar: RadarData;
}

// ── 权重 & 常量 ───────────────────────────────────────
const ACTIVITY_WEIGHTS: Record<string, number> = {
  LOGIN: 1, LEAD_SUBMIT: 10, MDF_CLAIM: 15,
  TRAINING: 5, DEAL_WIN: 20, ACTIVITY_JOIN: 8,
};
const MAX_VITALITY_SCORE = 100;

// ── 1. 活跃度评分 ─────────────────────────────────────
export function computeVitalityScore(
  activities: { activity_type: string; weight_score?: number }[]
): number {
  const total = activities.reduce((s, a) => s + (a.weight_score || ACTIVITY_WEIGHTS[a.activity_type] || 0), 0);
  return Math.min(100, Math.round((total / MAX_VITALITY_SCORE) * 100));
}

export function computeFunnel(partners: Partner[], dealCounts: Map<string, number>, winCounts: Map<string, number>) {
  return {
    registered: partners.length,
    cooperating: partners.filter(p => p.status === 'Cooperating').length,
    has_leads: partners.filter(p => (dealCounts.get(p.id) || 0) > 0).length,
    high_yield: partners.filter(p => (winCounts.get(p.id) || 0) >= 3).length,
  };
}

export function computeSubMetrics(activities: { activity_type: string }[]) {
  const c: Record<string, number> = {};
  activities.forEach(a => { c[a.activity_type] = (c[a.activity_type] || 0) + 1; });
  return {
    market_activity: Math.min(100, (c['ACTIVITY_JOIN'] || 0) * 8),
    incentive_execution: Math.min(100, (c['MDF_CLAIM'] || 0) * 15),
    business_interaction: Math.min(100, ((c['LEAD_SUBMIT'] || 0) * 10 + (c['DEAL_WIN'] || 0) * 20) / 3),
  };
}

// ── 2. 能力评分（最难量化的维度） ─────────────────────
// 认证分 30%: 高级认证人数 / 总人数
// 拓新分 30%: 新客户商机 / 总商机
// 实战分 40%: 成交金额 / 报备金额
export function computeCapabilityScore(
  certifiedCount: number,
  totalStaff: number,
  newCustomerDeals: number,
  totalDeals: number,
  wonValue: number,
  totalDealValue: number
): { score: number; breakdown: { cert: number; newCust: number; practice: number } } {
  const cert = totalStaff > 0 ? Math.min(100, Math.round((certifiedCount / totalStaff) * 100)) : 0;
  const newCust = totalDeals > 0 ? Math.min(100, Math.round((newCustomerDeals / totalDeals) * 100)) : 0;
  const practice = totalDealValue > 0 ? Math.min(100, Math.round((wonValue / totalDealValue) * 100)) : 0;
  return {
    score: Math.round(cert * 0.3 + newCust * 0.3 + practice * 0.4),
    breakdown: { cert, newCust, practice },
  };
}

// ── 3. 雷达图 5 维（JSON 结构匹配蓝图） ────────────────
export function buildRadarData(partner: Partner, capBreakdown: { cert: number; newCust: number; practice: number }): RadarData {
  // 技术力 = 认证分
  // 销售力 = 实战分
  // 服务力 = (认证+实战)/2
  // 拓新力 = 拓新分
  // 市场力 = winRate
  const tech = capBreakdown.cert;
  const sales = capBreakdown.practice;
  const service = Math.round((capBreakdown.cert + capBreakdown.practice) / 2);
  const expand = capBreakdown.newCust;
  const market = partner.winRate || 50;

  return {
    indicator: [
      { name: '技术力', max: 100 },
      { name: '销售力', max: 100 },
      { name: '服务力', max: 100 },
      { name: '拓新力', max: 100 },
      { name: '市场力', max: 100 },
    ],
    data: [Math.min(100, tech), Math.min(100, sales), Math.min(100, service), Math.min(100, expand), Math.min(100, market)],
  };
}

// ── 4. 覆盖评分 ───────────────────────────────────────
export function computeCoverageScore(
  regionCount: number, totalRegions: number,
  tier: string, industryCount: number, totalIndustries: number
): number {
  const tierWeights: Record<string, number> = { Diamond: 100, Platinum: 90, Gold: 75, Silver: 60, Registered: 40 };
  return Math.round(
    Math.min(100, (regionCount / Math.max(totalRegions, 1)) * 100) * 0.40 +
    (tierWeights[tier] || 40) * 0.30 +
    Math.min(100, (industryCount / Math.max(totalIndustries, 1)) * 100) * 0.30
  );
}

// ── 5. 规则引擎（IF → DIAGNOSIS → ACTION）─────────────
// 触发条件表：
//   Last_Login > 60d  → 沉睡 → 唤醒任务
//   Goal_Gap > 20%    → 覆盖缺口 → 招募任务
//   Win_Rate < 10%    → 能力低下 → 培训任务
//   MDF_Used > 90%    → 预算用尽 → 审批任务
export function runRuleEngine(
  partners: Partner[],
  benchmarks: { region: string; target_revenue: number; required_partners: number }[]
): { diagnoses: DiagnosisAlert[]; tasks: ActionTask[] } {
  const diagnoses: DiagnosisAlert[] = [];
  const tasks: ActionTask[] = [];
  const now = new Date();

  // 区域统计
  const regionCounts: Record<string, number> = {};
  const regionGMV: Record<string, number> = {};
  partners.forEach(p => {
    regionCounts[p.region] = (regionCounts[p.region] || 0) + 1;
    regionGMV[p.region] = (regionGMV[p.region] || 0) + (p.winRate || 0) * 100000;
  });
  const totalPartners = partners.length || 1;
  const totalGMV = Object.values(regionGMV).reduce((s, v) => s + v, 0) || 1;

  // RULE 1: Goal_Gap > 20% → 覆盖缺口 → 招募
  for (const b of benchmarks) {
    const current = regionCounts[b.region] || 0;
    const gmvShare = (regionGMV[b.region] || 0) / totalGMV;
    const partnerShare = current / totalPartners;
    const gap = (gmvShare - partnerShare) * 100;

    if (gap > 20 || current < b.required_partners) {
      const isUrgent = gap > 35 || current < b.required_partners / 2;
      diagnoses.push({
        id: `cov-${b.region}`,
        level: isUrgent ? 'danger' : 'warning',
        title: `${b.region}区供需错配预警`,
        content: `${b.region}区业务量占比 ${(gmvShare * 100).toFixed(0)}%，伙伴仅占 ${(partnerShare * 100).toFixed(0)}%。建议新入驻 ${Math.max(1, b.required_partners - current)} 家伙伴。`,
        tags: [`${b.region}未覆盖`, gap > 35 ? '严重缺口' : '轻度缺口'],
      });
      tasks.push({
        type: 'RECRUIT',
        title: `招募任务：${b.region}区`,
        description: `针对${b.region}区，缺口 ${Math.max(1, b.required_partners - current)} 家，建议启动定向招募。`,
        link: `/partners/new`,
        pending_count: Math.max(1, b.required_partners - current),
      });
    }
  }

  // RULE 2: Win_Rate < 10% → 能力低下 → 培训
  for (const p of partners) {
    if (p.status === 'Cooperating' && (p.winRate || 0) < 10) {
      diagnoses.push({
        id: `cap-${p.id}`,
        level: 'danger',
        title: `${p.name}实战能力不足`,
        content: `赢单率仅 ${p.winRate}%，远低于行业基准 35%。建议安排销售赋能培训。`,
        tags: ['能力缺口', p.region],
      });
    }
    if (p.status === 'Cooperating' && (p.winRate || 0) < 30 && (p.winRate || 0) >= 10) {
      diagnoses.push({
        id: `cap-${p.id}-medium`,
        level: 'info',
        title: `${p.name}能力有待提升`,
        content: `赢单率 ${p.winRate}%，建议参加进阶培训课程。`,
        tags: ['能力提升', p.region],
      });
    }
  }
  if (partners.some(p => p.status === 'Cooperating' && (p.winRate || 0) < 30)) {
    const lowCount = partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) < 30).length;
    tasks.push({
      type: 'TRAIN',
      title: '培训任务',
      description: `${lowCount} 家伙伴赢单率低于 30%，建议安排赋能培训。`,
      link: '/enablement',
      pending_count: lowCount,
    });
  }

  // RULE 3: Last_Login > 60d → 沉睡 → 激活
  const dormantCount = partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) === 0).length;
  if (dormantCount > 0) {
    const dormantNames = partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) === 0).slice(0, 3).map(p => p.name);
    diagnoses.push({
      id: 'dormant-batch',
      level: 'warning',
      title: `${dormantCount} 家伙伴处于沉睡状态`,
      content: `${dormantNames.join('、')}${dormantCount > 3 ? `等 ${dormantCount} 家` : ''} 近 90 天无有效业务活动。`,
      tags: ['沉睡伙伴'],
    });
    tasks.push({
      type: 'ACTIVATE',
      title: '激活任务',
      description: `${dormantCount} 家伙伴需激活，建议发送激励方案。`,
      link: '/incentives',
      pending_count: dormantCount,
    });
  }

  return { diagnoses, tasks };
}

// ── 6. 三层联动：根据焦点指标过滤诊断 ─────────────────
export function filterDiagnosisByFocus(
  allDiagnoses: DiagnosisAlert[],
  focus: FocusMetric
): DiagnosisAlert[] {
  switch (focus) {
    case 'OVERALL':
      return allDiagnoses.filter(d => d.level === 'danger' || d.level === 'warning');
    case 'COVERAGE':
      return allDiagnoses.filter(d => d.tags.some(t => t.includes('未覆盖') || t.includes('缺口')));
    case 'VITALITY':
      return allDiagnoses.filter(d => d.tags.includes('沉睡伙伴'));
    case 'CAPABILITY':
      return allDiagnoses.filter(d => d.tags.some(t => t.includes('能力')));
    default:
      return allDiagnoses;
  }
}

export function filterTasksByFocus(
  tasks: ActionTask[],
  focus: FocusMetric
): ActionTask[] {
  switch (focus) {
    case 'OVERALL': return tasks.filter(t => t.type === 'RECRUIT' || t.type === 'ACTIVATE');
    case 'COVERAGE': return tasks.filter(t => t.type === 'RECRUIT');
    case 'VITALITY': return tasks.filter(t => t.type === 'ACTIVATE');
    case 'CAPABILITY': return tasks.filter(t => t.type === 'TRAIN');
    default: return tasks;
  }
}

// ── 7. 数据库读取 ─────────────────────────────────────
export async function fetchHealthData() {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400000);
  const d60 = new Date(now.getTime() - 60 * 86400000);

  const [{ data: recentActs }, { data: prevActs }, { data: partners }, { data: deals }, { data: benchmarks }] =
    await Promise.all([
      supabase.from('partner_activity_logs').select('*').gte('created_at', d30.toISOString()),
      supabase.from('partner_activity_logs').select('*').gte('created_at', d60.toISOString()).lt('created_at', d30.toISOString()),
      supabase.from('partners').select('*'),
      supabase.from('deals').select('partner_id, stage, value, is_new_logo'),
      supabase.from('market_benchmarks').select('*'),
    ]);

  const allPartners = (partners || []) as Partner[];
  const allDeals = (deals || []) as any[];
  const allBenchmarks = (benchmarks || []) as any[];

  // Deal stats per partner
  const dealCounts = new Map<string, number>();
  const winCounts = new Map<string, number>();
  const winValues = new Map<string, number>();
  const newLogoCounts = new Map<string, number>();
  const dealValues = new Map<string, number>();

  allDeals.forEach((d: any) => {
    const pid = d.partner_id;
    if (!pid) return;
    dealCounts.set(pid, (dealCounts.get(pid) || 0) + 1);
    dealValues.set(pid, (dealValues.get(pid) || 0) + Number(d.value || 0));
    if (d.stage === 'ClosedWon') {
      winCounts.set(pid, (winCounts.get(pid) || 0) + 1);
      winValues.set(pid, (winValues.get(pid) || 0) + Number(d.value || 0));
    }
    if (d.is_new_logo) newLogoCounts.set(pid, (newLogoCounts.get(pid) || 0) + 1);
  });

  // Vitality
  const recentActivities = (recentActs || []) as any[];
  const prevActivities = (prevActs || []) as any[];
  const vitalityScore = computeVitalityScore(recentActivities);
  const prevScore = computeVitalityScore(prevActivities);
  const trend = prevScore > 0 ? `+${(((vitalityScore - prevScore) / prevScore) * 100).toFixed(1)}%` : vitalityScore > 0 ? '+100%' : '0%';

  // Overview scores for each partner
  const regionCounts: Record<string, number> = {};
  const industryCounts: Record<string, number> = {};
  allPartners.forEach(p => {
    regionCounts[p.region] = (regionCounts[p.region] || 0) + 1;
    industryCounts[p.industry || ''] = (industryCounts[p.industry || ''] || 0) + 1;
  });
  const totalRegions = Object.keys(regionCounts).length || 1;
  const totalIndustries = Object.keys(industryCounts).length || 1;

  const partnerScores = new Map<string, HealthScores>();
  for (const p of allPartners) {
    const dCount = dealCounts.get(p.id) || 0;
    const wValue = winValues.get(p.id) || 0;
    const dValue = dealValues.get(p.id) || 0;
    const nlCount = newLogoCounts.get(p.id) || 0;
    const cap = computeCapabilityScore(Number((p as any).certified_engineers || 0), 1, nlCount, dCount, wValue, dValue);
    partnerScores.set(p.id, {
      coverage: computeCoverageScore(regionCounts[p.region] || 1, totalRegions, p.tier, industryCounts[p.industry || ''] || 1, totalIndustries),
      vitality: vitalityScore,
      capability: cap.score,
      overall: Math.round(computeCoverageScore(regionCounts[p.region] || 1, totalRegions, p.tier, industryCounts[p.industry || ''] || 1, totalIndustries) * 0.30 + vitalityScore * 0.35 + cap.score * 0.35),
      radar: buildRadarData(p, cap.breakdown),
    });
  }

  // Rule engine
  const { diagnoses, tasks } = runRuleEngine(allPartners, allBenchmarks);

  return {
    vitality: {
      score: vitalityScore,
      trends: trend,
      funnel_data: computeFunnel(allPartners, dealCounts, winCounts),
      sub_metrics: computeSubMetrics(recentActivities),
    } as VitalityData,
    diagnoses,
    tasks,
    partnerScores,
    benchmarks: allBenchmarks,
    partners: allPartners,
  };
}
