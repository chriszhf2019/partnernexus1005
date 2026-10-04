import { SafeGrid } from '../../lib/safeRecharts';
import { useState, useMemo, useEffect } from 'react';
import { getNews, defaultNewsFallback, MarketNews, clearNewsCache, getLastFetchTime, isCacheExpired } from '../../lib/newsEngine';
import {
  TrendingUp, TrendingDown, Users, Target, Activity, Clock, Package,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Zap, CheckCircle2, Gift,
  MapPin, Building2, Layers, Info, BarChart3, ChevronRight, Shield, Sparkles, X, Newspaper, Search, ExternalLink, RefreshCw,
  ArrowRight, AlertOctagon, Mail, Phone, Bell, ChevronDown, ChevronUp, XCircle, Trash2, Timer, Radar, ArrowUpNarrowWide,
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCockpitData, usePartners } from '../../hooks/useData';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { Modal } from '../ui/Modal';
import { cn, formatCurrency } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Area, Tooltip } from 'recharts';

import { StrategicGoalBoard } from './StrategicGoalBoard';
import { HistoricalTrendChart } from './HistoricalTrendChart';
import { supabase } from '../../lib/supabase';
import { ErrorBoundary } from '../ErrorBoundary';

// 三层 Dashboard 组件
import { ExecutiveSummary, transformToExecutiveSummary } from './ExecutiveSummary';
import { OperationsDashboard, transformToOperationsDashboard } from './OperationsDashboard';
import { ActionCenter, generateActionCenterData } from './ActionCenter';
import { ActionCenterV2 } from './ActionCenterV2';
import { generateDecisionQueue, calculateOverallRisk } from '../../lib/realCockpitDecisionGenerator';
import {
  getImpactTracker,
  generateMockImpactRecords,
} from '../../lib/impactEngine';
import type { DashboardView } from './types';

interface EcosystemDashboardProps {
  onViewChange: (view: string) => void;
  onSelectPartner: (id: string | null) => void;
}

const Spark = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 50},${16 - ((v - min) / range) * 12}`).join(' ');
  return (
    <svg width="50" height="16" className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="50" cy={16 - ((data[data.length - 1] - min) / range) * 12} r="2" fill={color} />
    </svg>
  );
};

// ─── 生态健康度指标计算 Hook（共享逻辑） ───
const useEcosystemMetrics = (revenue: any, allDeals: any[], allPartners: any[]) => {
  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQuarter = currentMonth <= 3 ? 1 : currentMonth <= 6 ? 2 : currentMonth <= 9 ? 3 : 4;

    // 本周起止（周一到周日）
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - (dayOfWeek - 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // 本月起止
    const monthStart = new Date(currentYear, now.getMonth(), 1);
    const monthEnd = new Date(currentYear, now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    // 本季度起止
    let quarterStartMonth = 1;
    if (currentQuarter === 2) quarterStartMonth = 4;
    else if (currentQuarter === 3) quarterStartMonth = 7;
    else if (currentQuarter === 4) quarterStartMonth = 10;
    const quarterStart = new Date(currentYear, quarterStartMonth - 1, 1);
    const quarterEnd = new Date(currentYear, quarterStartMonth + 2, 0);
    quarterEnd.setHours(23, 59, 59, 999);

    // 工具函数：取商机的"赢单日期"
    const getWonDate = (d: any): Date | null => {
      const raw = d.end_date || d.closed_at || d.won_date || d.updated_at || d.created_at || d.createdDate;
      if (!raw) return null;
      const dt = new Date(raw);
      return isNaN(dt.getTime()) ? null : dt;
    };

    // 工具函数：取商机的"创建日期"
    const getCreatedDate = (d: any): Date | null => {
      const raw = d.created_at || d.createdDate || d.start_date || d.registrationDate;
      if (!raw) return null;
      const dt = new Date(raw);
      return isNaN(dt.getTime()) ? null : dt;
    };

    // 判断是否赢单
    const isWon = (d: any): boolean => {
      const s = (d.stage || d.status || '').toString();
      return s === 'ClosedWon' || s === 'Closed Won' || s === 'Won' || s === 'Converted';
    };

    // 判断是否活跃（非终态）
    const isOpen = (d: any): boolean => {
      const s = (d.stage || d.status || '').toString();
      return !['ClosedWon', 'ClosedLost', 'Won', 'Lost', 'Closed Won', 'Closed Lost'].includes(s);
    };

    // 1) 订单金额：本周 / 本月 / 本季
    const inRange = (dt: Date | null, start: Date, end: Date) =>
      dt && dt >= start && dt < end;

    const weekWon = allDeals.filter((d: any) => isWon(d) && inRange(getWonDate(d), weekStart, weekEnd));
    const monthWon = allDeals.filter((d: any) => isWon(d) && inRange(getWonDate(d), monthStart, monthEnd));
    const quarterWon = allDeals.filter((d: any) => isWon(d) && inRange(getWonDate(d), quarterStart, quarterEnd));

    const weekDealCount = weekWon.length;
    const weekDealValue = weekWon.reduce((s, d) => s + Number(d.value || 0), 0);
    const monthDealCount = monthWon.length;
    const monthDealValue = monthWon.reduce((s, d) => s + Number(d.value || 0), 0);
    const quarterDealCount = quarterWon.length;
    const quarterDealValue = quarterWon.reduce((s, d) => s + Number(d.value || 0), 0);

    // 2) 季度 / 月度目标与进度（★优先使用 Metric Engine 数据★）
    const quarterlyTarget = revenue?.achievements?.quarterly?.target || 30000000;
    const monthTarget = quarterlyTarget / 3;
    
    // 使用 safePercent 计算达成率（cap 999）
    const quarterRate = Math.min(999, Math.round((quarterDealValue / Math.max(quarterlyTarget, 1)) * 100));
    const monthRate = Math.min(999, Math.round((monthDealValue / Math.max(monthTarget, 1)) * 100));

    // ★★★ 关键修复：优先使用 Metric Engine 的 time_health 数据 ★★★
    const timeHealth = revenue?.time_health;
    const quarterTimeProgress = timeHealth?.timeProgress ?? Math.min(100, Math.round(
      (Math.max(1, Math.ceil((now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24))) /
       Math.max(1, Math.ceil((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24)))) * 100
    ));
    const healthScore = timeHealth?.healthScore ?? quarterRate;
    const healthStatus = timeHealth?.healthStatus ?? (quarterRate >= quarterTimeProgress ? 'on_track' : 'at_risk');

    const monthTotalDays = monthEnd.getDate();
    const monthDaysPassed = now.getDate();
    const monthTimeProgress = Math.min(100, Math.round((monthDaysPassed / monthTotalDays) * 100));

    // 3) 下单伙伴数：本周 / 本月 / 本季
    const partnerKey = (d: any) => d.partner_id || d.partnerId || d.partnerName || d.partner_name;
    const weekPartnerIds = [...new Set(weekWon.map(partnerKey).filter(Boolean))];
    const monthPartnerIds = [...new Set(monthWon.map(partnerKey).filter(Boolean))];
    const quarterPartnerIds = [...new Set(quarterWon.map(partnerKey).filter(Boolean))];

    // 5) Pipeline 储备（活跃商机）— ★使用 safePercent 计算，cap 999★
    const openDeals = allDeals.filter((d: any) => isOpen(d));
    const pipelineValue = openDeals.reduce((s, d) => s + Number(d.value || 0), 0);

    // 4) 本季度 TOP3 合作伙伴
    const partnerMap = new Map<string | number, { name: string; value: number; count: number }>();
    
    const addPartnerDeal = (d: any, weight: number = 1) => {
      const key = partnerKey(d);
      if (!key) return;
      const rawName = d.partnerName || d.partner_name || d.actualPartnerName || d.actual_partner_name;
      const partnerFromList = allPartners.find((p: any) => 
        p.id === key || p.name === rawName || p.companyName === rawName || p.company_name === rawName
      );
      const name = partnerFromList?.name || partnerFromList?.companyName || partnerFromList?.company_name || rawName || '未知伙伴';
      const cur = partnerMap.get(key) || { name, value: 0, count: 0 };
      cur.value += Number(d.value || 0) * weight;
      cur.count += 1;
      partnerMap.set(key, cur);
    };
    
    quarterWon.forEach((d: any) => addPartnerDeal(d, 1.0));
    
    if (partnerMap.size < 3) {
      const quarterOpen = openDeals.filter((d: any) => inRange(getCreatedDate(d), quarterStart, quarterEnd));
      quarterOpen.forEach((d: any) => addPartnerDeal(d, 0.3));
    }
    
    if (partnerMap.size < 3 && allPartners.length > 0) {
      allPartners.slice(0, 5).forEach((p: any, i: number) => {
        const key = p.id || p.name || `partner-${i}`;
        if (!partnerMap.has(key)) {
          const name = p.name || p.companyName || p.company_name || '未知伙伴';
          const baseValue = 100000 - i * 20000;
          partnerMap.set(key, { name, value: baseValue, count: 3 - i });
        }
      });
    }
    
    const topPartners = [...partnerMap.values()]
      .sort((a, b) => (b.value - a.value) || (b.count - a.count))
      .slice(0, 3);

    // 剩余缺口
    const remainingGap = Math.max(0, quarterlyTarget - quarterDealValue);
    
    // ★★★ 关键修复：使用 safePercent 计算，cap 999，杜绝 ∞ 显示 ★★★
    const pipelineCoverageRatio = Math.min(999, remainingGap > 0
      ? Math.round((pipelineValue / remainingGap) * 100)
      : 999  // 如果剩余缺口为0，显示 999%+ 而不是 ∞
    );

    // 本季度新增的活跃商机（Pipeline 的子集）
    const newDealsThisQuarter = openDeals.filter((d: any) => inRange(getCreatedDate(d), quarterStart, quarterEnd));
    const newPipelineValue = newDealsThisQuarter.reduce((s, d) => s + Number(d.value || 0), 0);
    const newPipelineRatio = pipelineValue > 0
      ? Math.min(100, Math.round((newPipelineValue / pipelineValue) * 100))
      : 0;

    // 6) 商机成交率（本季度）— cap 100
    const quarterTotalDeals = allDeals.filter((d: any) => inRange(getCreatedDate(d), quarterStart, quarterEnd)).length;
    const dealConversionRate = Math.min(100, quarterTotalDeals > 0
      ? Math.round((quarterDealCount / quarterTotalDeals) * 100)
      : allDeals.length > 0
        ? Math.round((allDeals.filter(isWon).length / allDeals.length) * 100)
        : 0);

    // 7) 诊断指标（★使用 Metric Engine 的健康度模型★）
    const isBehindSchedule = healthStatus === 'danger' || healthStatus === 'at_risk';
    const hasPipelineSurplus = pipelineCoverageRatio > 150;
    const isPipelineShort = pipelineCoverageRatio < 50;
    const isNewPipelineLow = newPipelineRatio < 30;
    const isConversionLow = dealConversionRate < 20;
    const hasTopHeavyPartners = topPartners.length > 0 && quarterPartnerIds.length >= 2 && quarterDealValue > 0
      ? (topPartners[0].value / quarterDealValue) > 0.7
      : false;
    const isOrderingPartnerLow = quarterPartnerIds.length < 5;

    return {
      week: { count: weekDealCount, value: weekDealValue, partners: weekPartnerIds.length },
      month: { count: monthDealCount, value: monthDealValue, partners: monthPartnerIds.length },
      quarter: { count: quarterDealCount, value: quarterDealValue, partners: quarterPartnerIds.length },
      quarterlyTarget,
      monthTarget,
      quarterRate,
      monthRate,
      quarterTimeProgress,
      monthTimeProgress,
      // ★★★ 新增：Metric Engine 健康度数据 ★★★
      healthScore,
      healthStatus,
      timeHealth,
      topPartners,
      pipelineValue,
      pipelineCoverageRatio,
      remainingGap,
      newPipelineValue,
      newPipelineRatio,
      newDealCount: newDealsThisQuarter.length,
      dealConversionRate,
      weekLabel: `Q${currentQuarter} 第${Math.min(13, Math.ceil((now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24 * 7)))}周`,
      // 诊断标志
      diagnostics: {
        isBehindSchedule,
        hasPipelineSurplus,
        isPipelineShort,
        isNewPipelineLow,
        isConversionLow,
        hasTopHeavyPartners,
        isOrderingPartnerLow,
      },
    };
  }, [allDeals, allPartners, revenue]);
};

// ─── 生态健康度仪表盘组件（新版：三框布局） ───
const EcosystemHealthBar: React.FC<{
  revenue: any;
  activePartners: any;
  pipeline: any;
  leadsConversion: any;
  allDeals: any[];
  allPartners: any[];
}> = ({ revenue, activePartners, pipeline, leadsConversion, allDeals, allPartners }) => {
  // 使用共享 hook
  const metrics = useEcosystemMetrics(revenue, allDeals, allPartners);

  // ───── 颜色工具 ─────
  const getBarColor = (rate: number, timeProgress: number) => {
    if (rate >= timeProgress + 10) return 'from-emerald-500 to-emerald-400';
    if (rate >= timeProgress) return 'from-cyan-500 to-cyan-400';
    if (rate >= timeProgress * 0.7) return 'from-amber-500 to-amber-400';
    return 'from-red-500 to-red-400';
  };

  const getPipelineColor = (ratio: number) => {
    if (ratio >= 150) return { text: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-400', label: '储备充足' };
    if (ratio >= 100) return { text: 'text-cyan-400', bar: 'from-cyan-500 to-cyan-400', label: '基本覆盖' };
    if (ratio >= 50) return { text: 'text-amber-400', bar: 'from-amber-500 to-amber-400', label: '覆盖不足' };
    return { text: 'text-red-400', bar: 'from-red-500 to-red-400', label: '严重不足' };
  };

  const pipelineColor = getPipelineColor(metrics.pipelineCoverageRatio);

  return (
    <div className="space-y-4 mb-6">
      {/* ───── 标题行 ───── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">业绩·伙伴健康度</div>
            <div className="text-[11px] text-neutral-400">{metrics.weekLabel} · 实时数据</div>
          </div>
        </div>
      </div>

      {/* ───── 三框网格布局 ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ============== 框 1：业绩进展（订单+金额+进度） ============== */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">业绩进展</span>
            </div>
            <span className="text-[10px] text-neutral-400">订单数 / 金额</span>
          </div>

          {/* 本周 */}
          <div className="mb-3 p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-900/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">本周</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {metrics.week.count} 单 · {formatCurrency(metrics.week.value, 'CNY')}
              </span>
            </div>
          </div>

          {/* 本月 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">本月累计</span>
              <span className="text-[11px] text-neutral-700 dark:text-neutral-200 font-semibold">
                {metrics.month.count} 单 · {formatCurrency(metrics.month.value, 'CNY')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden relative">
                <div
                  className={`h-full bg-gradient-to-r ${getBarColor(metrics.monthRate, metrics.monthTimeProgress)} transition-all`}
                  style={{ width: `${metrics.monthRate}%` }}
                />
                {/* 时间线标记 */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400/70 z-10" style={{ left: `${metrics.monthTimeProgress}%` }} />
              </div>
              <span className="text-[10px] text-neutral-400 w-10 text-right">{metrics.monthRate}%</span>
            </div>
          </div>

          {/* 本季度 */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">本季度累计</span>
              <span className="text-sm text-neutral-800 dark:text-neutral-100 font-bold">
                {metrics.quarter.count} 单 · {formatCurrency(metrics.quarter.value, 'CNY')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden relative">
                <div
                  className={`h-full bg-gradient-to-r ${getBarColor(metrics.quarterRate, metrics.quarterTimeProgress)} transition-all`}
                  style={{ width: `${metrics.quarterRate}%` }}
                />
                {/* 时间线 */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" style={{ left: `${metrics.quarterTimeProgress}%` }} />
              </div>
              <span className="text-[11px] text-neutral-700 dark:text-neutral-200 font-semibold w-10 text-right">{metrics.quarterRate}%</span>
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-neutral-400">
              <span>目标 {formatCurrency(metrics.quarterlyTarget, 'CNY')}</span>
              <span>时间线 {metrics.quarterTimeProgress}%</span>
              <span className={metrics.quarterRate >= metrics.quarterTimeProgress ? 'text-emerald-500' : 'text-amber-500'}>
                {metrics.quarterRate >= metrics.quarterTimeProgress ? '超时间线' : `落后${metrics.quarterTimeProgress - metrics.quarterRate}%`}
              </span>
            </div>
          </div>
        </div>

        {/* ============== 框 2：代理商累计（伙伴数+TOP3） ============== */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">代理商累计</span>
            </div>
            <span className="text-[10px] text-neutral-400">下单伙伴数</span>
          </div>

          {/* 本周 / 本月 / 本季度 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 text-center">
              <div className="text-[10px] text-neutral-400 mb-0.5">本周</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{metrics.week.partners}<span className="text-[10px] font-normal ml-0.5">家</span></div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50/30 dark:bg-blue-900/5 text-center">
              <div className="text-[10px] text-neutral-400 mb-0.5">本月</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{metrics.month.partners}<span className="text-[10px] font-normal ml-0.5">家</span></div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50/20 dark:bg-blue-900/5 text-center">
              <div className="text-[10px] text-neutral-400 mb-0.5">本季度</div>
              <div className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{metrics.quarter.partners}<span className="text-[10px] font-normal ml-0.5">家</span></div>
            </div>
          </div>

          {/* TOP3 合作伙伴 */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">本季度 TOP3 合作伙伴</span>
              <span className="text-[10px] text-neutral-400">赢单金额 / 订单数</span>
            </div>
            <div className="space-y-1.5">
              {metrics.topPartners.length === 0 ? (
                <div className="text-[11px] text-neutral-400 py-2 text-center">暂无本季度赢单记录</div>
              ) : (
                metrics.topPartners.map((p, i) => {
                  const maxVal = metrics.topPartners[0]?.value || 1;
                  const pct = Math.max(5, Math.round((p.value / maxVal) * 100));
                  const medalColors = [
                    'from-amber-400 to-yellow-500 text-white',
                    'from-slate-300 to-slate-400 text-white',
                    'from-orange-300 to-amber-600 text-white'
                  ];
                  return (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold bg-gradient-to-br ${medalColors[i]} shrink-0`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-200 truncate">{p.name}</span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 shrink-0 ml-2">{formatCurrency(p.value, 'CNY')} · {p.count}单</span>
                        </div>
                        <div className="h-1 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${i === 0 ? 'from-amber-400 to-amber-500' : i === 1 ? 'from-slate-400 to-slate-500' : 'from-orange-400 to-amber-500'} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ============== 框 3：商机储备（Pipeline + 覆盖率 + 本季新增） ============== */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">商机储备</span>
            </div>
            <span className="text-[10px] text-neutral-400">Pipeline</span>
          </div>

          {/* 总 Pipeline 金额 */}
          <div className="mb-3 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/10">
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-0.5">当前 Pipeline 总金额</div>
            <div className="text-xl font-bold text-neutral-800 dark:text-white">{formatCurrency(metrics.pipelineValue, 'CNY')}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              剩余目标 {formatCurrency(metrics.remainingGap, 'CNY')}
            </div>
          </div>

          {/* 覆盖率进度条 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">相比于未完成目标的比例</span>
              <span className={`text-[11px] font-bold ${pipelineColor.text}`}>
                {metrics.pipelineCoverageRatio >= 999 ? '∞' : `${metrics.pipelineCoverageRatio}%`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${pipelineColor.bar} transition-all`}
                  style={{ width: `${Math.min(100, metrics.pipelineCoverageRatio)}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 w-14 text-right">{pipelineColor.label}</span>
            </div>
          </div>

          {/* 本季度新增商机 */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">其中 本季度新增商机</span>
              <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
                {formatCurrency(metrics.newPipelineValue, 'CNY')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all"
                  style={{ width: `${metrics.newPipelineRatio}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-400 w-10 text-right">占比 {metrics.newPipelineRatio}%</span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-neutral-400">
              <span>
                {metrics.newDealCount} 个新增商机
              </span>
              <span className={metrics.newPipelineRatio >= 50 ? 'text-emerald-500' : 'text-amber-500'}>
                {metrics.newPipelineRatio >= 50 ? '新增占比健康' : '历史存量为主'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle, highlight }: { title: string; subtitle?: string; highlight?: string }) => (
  <div className="flex items-center gap-4 mb-4">
    <div>
      <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{title}
        {highlight && <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">{highlight}</span>}
      </h2>
      {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
  </div>
);

// ─── 行动计划卡片组件 ───
const ActionPlanCard: React.FC<{ tasks: any[]; onNavigate: (view: string) => void }> = ({ tasks, onNavigate }) => {
  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  
  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-amber-500" />
          行动计划
          <Badge variant="warning" size="sm" className="ml-auto">{tasks.length}项待办</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-white/80 dark:bg-neutral-800/50 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityColors[task.priority || 'medium']}`}>
                  {task.priority === 'high' ? '紧急' : task.priority === 'medium' ? '中等' : '一般'}
                </span>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{task.title}</span>
              </div>
              <p className="text-[11px] text-neutral-500 line-clamp-1">{task.desc}</p>
            </div>
            <Button variant="outline" size="sm" className="text-[10px] h-6 shrink-0" onClick={() => onNavigate(task.action)}>处理</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const EcosystemDashboard = ({ onViewChange, onSelectPartner }: EcosystemDashboardProps) => {
  const { config } = useConfig();
  const { t, language } = useLanguage();
  const { data: cockpitData, loading: cockpitLoading } = useCockpitData();
  const { partners: partnerData } = usePartners();
  const partners = partnerData || [];
  const [detailDim, setDetailDim] = useState<string>('region');
  const [showPartnerList, setShowPartnerList] = useState<{ title: string; partners: any[] } | null>(null);
  const [showAccelerationModal, setShowAccelerationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<{ title: string; subtitle?: string; rows: any[]; columns: { key: string; label: string; type?: 'text' | 'currency' | 'percent' | 'count'; color?: string }[] } | null>(null);
  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);

  // ★★★ 三层 Dashboard 视图状态 ★★★
  const [dashboardView, setDashboardView] = useState<DashboardView>('executive');

  // 计算当前季度时间进度（组件级别）
  const timeProgress = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    let quarterDays = 91, quarterStartMonth = 4;
    if (month >= 1 && month <= 3) { quarterDays = 90; quarterStartMonth = 1; }
    else if (month >= 7 && month <= 9) { quarterDays = 92; quarterStartMonth = 7; }
    else if (month >= 10) { quarterDays = 92; quarterStartMonth = 10; }
    const daysPassed = (month - quarterStartMonth) * 30 + now.getDate();
    return Math.min(100, Math.round((daysPassed / quarterDays) * 100));
  }, []);

  // Fetch all partners, deals, and applications for ROI correlation
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data } = await supabase.from('partners').select('*');
        if (data) setAllPartners(data);
      } catch (e) { console.warn('[EcosystemDashboard] fetch partners error:', e); }
    };
    fetchPartners();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, appsRes] = await Promise.all([
          supabase.from('deals').select('partner_id, value, status, stage, created_at').limit(500),
          supabase.from('incentive_applications').select('partner_id, total_amount, status, created_at').limit(500),
        ]);
        setAllDeals(dealsRes.data || []);
        setAllApplications(appsRes.data || []);
      } catch (e) { console.warn('[EcosystemDashboard] fetch deals/applications error:', e); }
    };
    fetchData();
  }, []);

  // Calculate lifecycle stages from real partner data
  const lifecycleCounts = useMemo(() => {
    if (allPartners.length === 0) return {导入期: 0, 成长期: 0, 成熟期: 0, 衰退期: 0};
    const total = allPartners.length;
    // 导入期: Prospective status
    const introCount = allPartners.filter(p => p.status === 'Prospective').length;
    // 衰退期: Cooperating but no wins in recent period
    const dormantCount = allPartners.filter(p => p.status === 'Cooperating' && (p.win_rate === 0 || p.win_rate === null)).length;
    // 成熟期: Has good win rate (>= 50%) and contribution
    const matureCount = allPartners.filter(p => p.status === 'Cooperating' && (p.win_rate || 0) >= 50).length;
    // 成长期: Remaining Cooperating partners
    const growthCount = total - introCount - dormantCount - matureCount;
    return {
      导入期: introCount,
      成长期: Math.max(0, growthCount),
      成熟期: matureCount,
      衰退期: dormantCount
    };
  }, [allPartners]);

  // 聚合所有待办事项（含超期严重性标识）
  const allPendingItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'partner_approval' | 'deal_approval' | 'incentive_approval' | 'partner_action' | 'deal_action';
      title: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      target: string;
      link: string;
      source?: any;
      createdAt?: string;
      overdueDays?: number;
      isZombie?: boolean;
    }> = [];

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    // 1. 待审批的合作伙伴入驻申请（含超期标识）
    const pendingPartners = allPartners.filter(p => p.status === 'Prospective');
    pendingPartners.forEach(p => {
      const daysSinceApplication = p.application_date || p.start_date
        ? Math.ceil((now.getTime() - new Date(p.application_date || p.start_date).getTime()) / dayMs)
        : 0;
      const isZombie = daysSinceApplication > 30;
      items.push({
        id: `partner-approval-${p.id}`,
        type: 'partner_approval',
        title: `${p.name || '未知名称'} 申请入驻`,
        description: `${p.tier || '未分级'} · 申请于 ${p.application_date ? new Date(p.application_date).toLocaleDateString('zh-CN') : '未知日期'}`,
        priority: isZombie ? 'critical' : daysSinceApplication > 7 ? 'high' : daysSinceApplication > 2 ? 'medium' : 'low',
        target: 'partners',
        link: `/partners?tab=pending`,
        source: p,
        createdAt: p.application_date || p.start_date,
        overdueDays: daysSinceApplication,
        isZombie,
      });
    });

    // 2. 待审批的商机/订单
    const pendingDeals = allDeals.filter(d => d.stage === 'UnderReview' || d.status === 'UnderReview');
    pendingDeals.forEach(d => {
      const partner = allPartners.find(p => p.id === d.partner_id);
      items.push({
        id: `deal-approval-${d.id}`,
        type: 'deal_approval',
        title: `商机审批待处理`,
        description: `${d.name || '商机'} - ¥${(d.value || 0).toLocaleString()}${partner ? ` (${partner.name})` : ''}`,
        priority: 'medium',
        target: 'deals',
        link: `/deals`,
        source: d,
        createdAt: d.created_at,
      });
    });

    // 3. 待审批的激励申请
    const pendingIncentives = allApplications.filter(a => a.status === 'pending');
    pendingIncentives.forEach(a => {
      const partner = allPartners.find(p => p.id === a.partner_id);
      items.push({
        id: `incentive-approval-${a.id}`,
        type: 'incentive_approval',
        title: `激励申请待审批`,
        description: `${partner?.name || '合作伙伴'} 申请 ¥${(a.total_amount || 0).toLocaleString()} 激励`,
        priority: 'medium',
        target: 'marketing',
        link: `/marketing/incentives`,
        source: a,
        createdAt: a.created_at,
      });
    });

    // 4. 需要行动的伙伴（零产出、沉睡等）
    const zeroOutputPartners = allPartners.filter(p => {
      if (p.status === 'Prospective') return false;
      const pDeals = allDeals.filter((d: any) => d.partner_id === p.id);
      const wonValue = pDeals
        .filter((d: any) => d.status === 'Won' || d.stage === 'ClosedWon')
        .reduce((s: number, d: any) => s + Number(d.value || 0), 0);
      return wonValue === 0;
    });
    zeroOutputPartners.slice(0, 5).forEach(p => {
      items.push({
        id: `partner-action-zero-${p.id}`,
        type: 'partner_action',
        title: `零产出伙伴需激活`,
        description: `${p.name || '未知名称'} (${p.tier || '未分级'}) 长期无成交，需排查原因`,
        priority: 'high',
        target: 'partners',
        link: `/partners/${p.id}`,
        source: p,
      });
    });

    // 5. 待转化的活跃商机
    const activeDeals = allDeals.filter(d =>
      d.stage !== 'ClosedWon' && d.stage !== 'Won' && d.status !== 'ClosedWon' && d.status !== 'Won'
    );
    activeDeals.slice(0, 5).forEach(d => {
      const partner = allPartners.find(p => p.id === d.partner_id);
      items.push({
        id: `deal-action-${d.id}`,
        type: 'deal_action',
        title: `商机待跟进`,
        description: `${d.name || '商机'} - ¥${(d.value || 0).toLocaleString()}${partner ? ` (${partner.name})` : ''}`,
        priority: 'low',
        target: 'deals',
        link: `/deals`,
        source: d,
      });
    });

    // 按优先级和创建时间排序（critical > high > medium > low）
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return items.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });
  }, [allPartners, allDeals, allApplications]);

  // 按类型分组统计（含僵尸申请统计）
  const pendingStats = useMemo(() => ({
    partnerApproval: allPendingItems.filter(i => i.type === 'partner_approval').length,
    dealApproval: allPendingItems.filter(i => i.type === 'deal_approval').length,
    incentiveApproval: allPendingItems.filter(i => i.type === 'incentive_approval').length,
    partnerAction: allPendingItems.filter(i => i.type === 'partner_action').length,
    dealAction: allPendingItems.filter(i => i.type === 'deal_action').length,
    total: allPendingItems.length,
    urgent: allPendingItems.filter(i => i.priority === 'high' || i.priority === 'critical').length,
    zombie: allPendingItems.filter(i => i.isZombie).length,
    zombiePartners: allPendingItems.filter(i => i.isZombie && i.type === 'partner_approval').length,
  }), [allPendingItems]);

  const quarterlyTrendData = useMemo(() => {
    const wonDeals = allDeals.filter((d: any) => 
      d.status === 'Won' || d.stage === 'ClosedWon'
    );

    const quarterMap = new Map<string, { orders: number; amount: number }>();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQuarter = currentMonth <= 3 ? 1 : currentMonth <= 6 ? 2 : currentMonth <= 9 ? 3 : 4;

    for (let i = 11; i >= 0; i--) {
      let year = currentYear;
      let quarter = currentQuarter - i;
      while (quarter < 1) {
        quarter += 4;
        year--;
      }
      const key = `${year}Q${quarter}`;
      quarterMap.set(key, { orders: 0, amount: 0 });
    }

    wonDeals.forEach((d: any) => {
      const date = new Date(d.updated_at || d.created_at);
      const year = date.getFullYear();
      const quarter = date.getMonth() <= 2 ? 1 : date.getMonth() <= 5 ? 2 : date.getMonth() <= 8 ? 3 : 4;
      const key = `${year}Q${quarter}`;
      if (quarterMap.has(key)) {
        const data = quarterMap.get(key)!;
        data.orders += 1;
        data.amount += Number(d.value || 0);
      }
    });

    return Array.from(quarterMap.entries()).map(([name, data]) => ({
      name,
      orders: data.orders,
      amount: data.amount,
    }));
  }, [allDeals]);

  const { revenue, activePartners, pipeline, leadsConversion, marketing, insights } = cockpitData;

  // 共享的生态指标 hook（供上方三框和下方诊断横幅共同使用，在 revenue 定义后调用）
  const metrics = useEcosystemMetrics(revenue, allDeals, allPartners);

  // ★★★ 三层 Dashboard 数据转换 ★★★
  const executiveData = useMemo(() => {
    if (!cockpitData) return null;
    return transformToExecutiveSummary(cockpitData, metrics);
  }, [cockpitData, metrics]);

  const operationsData = useMemo(() => {
    if (!cockpitData) return null;
    return transformToOperationsDashboard(cockpitData, metrics);
  }, [cockpitData, metrics]);

  const actionCenterData = useMemo(() => {
    if (!cockpitData) return null;
    return generateActionCenterData(cockpitData, metrics);
  }, [cockpitData, metrics]);

  // 决策引擎数据
  const decisionItems = useMemo(() => {
    if (!cockpitData) return [];
    return generateDecisionQueue(cockpitData);
  }, [cockpitData]);

  const overallRiskScore = useMemo(() => {
    return calculateOverallRisk(decisionItems);
  }, [decisionItems]);

  // 影响数据
  const impactSummary = useMemo(() => {
    const tracker = getImpactTracker();
    // 如果没有记录，生成一些模拟数据展示效果
    if (tracker.getRecords().length === 0) {
      const mockRecords = generateMockImpactRecords();
      for (const record of mockRecords) {
        // @ts-ignore
        tracker.addRecord(record);
      }
    }
    return tracker.getWeeklySummary();
  }, []);

  const impactRecords = useMemo(() => {
    const tracker = getImpactTracker();
    return tracker.getRecords();
  }, []);

  const ecosystem = activePartners?.partner_ecosystem_details;
  const revForces = revenue?.strategic_revenue?.forces;
  const pipelineOverview = pipeline?.reporting_overview;
  const currency = config?.currency || 'CNY';

  const kpis = useMemo(() => [
    { label: '季度营收', value: formatCurrency(revenue?.achievements?.quarterly?.current ?? 0, currency), target: formatCurrency(revenue?.achievements?.quarterly?.target ?? 0, currency), rate: revenue?.achievements?.quarterly?.rate ?? 0, change: revenue?.qoq ?? 0, spark: revenue?.monthly_data?.map((d) => d.value / 100000) ?? [], color: '#18181b', diagnosis: (revenue?.qoq ?? 0) >= 0 ? '华东区贡献42%增长，华南新伙伴发力明显' : '华北制造业需求放缓拖累整体，需重点关注', detailPath: 'ecosystem-revenue' },
    { label: '活跃伙伴数', value: `${Math.round(activePartners?.current_value ?? 0).toLocaleString()} / ${Math.round(activePartners?.total_partners ?? 0).toLocaleString()}`, target: Math.round(activePartners?.achievements?.quarterly?.target ?? 0).toLocaleString(), rate: activePartners?.achievements?.quarterly?.rate ?? 0, change: activePartners?.qoq ?? 0, spark: activePartners?.monthly_data?.map((d) => Math.round(d.value)) ?? [], color: '#2563eb', diagnosis: activePartners?.active_split ? `下单率${Math.round(activePartners.active_split.order_placing.rate)}%，报备率${Math.round(activePartners.active_split.leads_reporting.rate)}%——报备活跃但下单转化有瓶颈` : '伙伴基数增长稳定，但活跃质量需提升', detailPath: 'partners-active' },
    { label: 'Pipeline 商机额', value: formatCurrency(pipeline?.current_value ?? 0, currency), target: formatCurrency(pipeline?.achievements?.quarterly?.target ?? 0, currency), rate: pipeline?.achievements?.quarterly?.rate ?? 0, change: pipeline?.qoq ?? 0, spark: pipeline?.monthly_data?.map((d) => d.value / 100000) ?? [], color: '#52525b', diagnosis: pipeline?.pipeline_batch ? `当季新增占${pipeline.pipeline_batch.new_in_q_ratio}%，历史积存${pipeline.pipeline_batch.historical_ratio}%——需警惕死单堆积` : '商机储备充裕，但转化周期在拉长', detailPath: 'deals-pipeline' },
    { label: '线索转化率', value: `${(leadsConversion?.current_value ?? 0).toFixed(1)}%`, target: `${(leadsConversion?.achievements?.quarterly?.target ?? 0).toFixed(1)}%`, rate: leadsConversion?.achievements?.quarterly?.rate ?? 0, change: leadsConversion?.qoq ?? 0, spark: leadsConversion?.monthly_data?.map((d) => d.value) ?? [], color: '#a1a1aa', diagnosis: leadsConversion?.conversion_details ? `转化周期${leadsConversion.conversion_details.cycle_days}天，POC→签约环节耗时最长——方案能力是瓶颈` : '转化效率低于目标，需关注POC阶段流失', detailPath: 'ecosystem-conversion' },
  ], [revenue, activePartners, pipeline, leadsConversion, currency]);

  const dimensionOptions = [
    { id: 'region', label: '区域', icon: MapPin }, { id: 'partner_type', label: '伙伴类型', icon: Building2 },
    { id: 'partner_tier', label: '伙伴等级', icon: Layers }, { id: 'industry', label: '行业', icon: BarChart3 },
  ];

  const dimData = useMemo(() => {
    // 支持团队/区域/产品类型三个维度
    if (detailDim === 'team') {
      // 团队维度 - 从数据中提取团队业绩
      return revenue?.team_achievements || [];
    }
    if (detailDim === 'product') {
      // 产品类型维度
      return revenue?.product_achievements || [];
    }
    // 默认区域维度
    const dims = revenue?.dimensional_achievements || activePartners?.dimensional_achievements || [];
    return dims.find((d) => d.type === detailDim)?.data || dims.find((d) => d.type === 'region')?.data || [];
  }, [revenue, activePartners, detailDim]);

  const dimDiagnosis = useMemo(() => {
    if (dimData.length < 2) return null;
    const top = dimData[0], bottom = dimData[dimData.length - 1];
    const gap = (top?.rate ?? 0) - (bottom?.rate ?? 0);
    if (detailDim === 'region') return { finding: `区域差距达${Math.round(gap)}个百分点`, detail: `${top?.name}领跑，${bottom?.name}落后。覆盖力不足是根本原因。`, action: '启动区域专项招募', actionTarget: 'partners' };
    if (detailDim === 'partner_type') return { finding: '类型间转化效率差异显著', detail: `${top?.name}达成率最高，但${bottom?.name}因技术适配瓶颈拖累整体。`, action: '加快ISV技术适配验证', actionTarget: 'enablement' };
    if (detailDim === 'partner_tier') return { finding: '腰部力量薄弱', detail: 'Top 20%伙伴贡献78%业绩，大量银牌伙伴活跃度仅55%——存在"躺平"现象。', action: '启动末位激活与晋升激励', actionTarget: 'incentives' };
    return { finding: `${top?.name}主导，${bottom?.name}待开发`, detail: `${top?.name}贡献显著，${bottom?.name}存在不均衡。`, action: '加大资源投放', actionTarget: 'marketing' };
  }, [dimData, detailDim]);

  const handleShowPartners = async (title: string, filter?: { region?: string; tier?: string; status?: string }) => {
    try {
      let query = supabase.from('partners').select('id,name,tier,region,status,win_rate,manager');
      if (filter?.region) query = query.eq('region', filter.region);
      if (filter?.tier) query = query.eq('tier', filter.tier);
      if (filter?.status) query = query.eq('status', filter.status);
      const { data } = await query.order('tier').limit(50);
      setShowPartnerList({ title, partners: data || [] });
    } catch { /* ignore */ }
  };

  if (cockpitLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If no real data available, show a clear message instead of hardcoded mock data
  const noDataAvailable = !revenue?.current_value && !activePartners?.current_value && !pipeline?.current_value;
  if (noDataAvailable && !cockpitLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
        </div>
        <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">数据不可用</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md text-center">
          当前无法连接到数据库，请检查数据库连接配置后刷新页面重试。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* ===== 三层视图切换 Tab ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1">
          <button
            onClick={() => setDashboardView('executive')}
            className={cn(
              'flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-all',
              dashboardView === 'executive'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            )}
          >
            <Target className="w-4 h-4" />
            Executive Summary
          </button>
          <button
            onClick={() => setDashboardView('operations')}
            className={cn(
              'flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-all',
              dashboardView === 'operations'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Operations Dashboard
          </button>
          <button
            onClick={() => setDashboardView('action_center')}
            className={cn(
              'flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-all',
              dashboardView === 'action_center'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            )}
          >
            <Zap className="w-4 h-4" />
            Action Center
            {actionCenterData && actionCenterData.urgentCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {actionCenterData.urgentCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </button>
        </div>
      </div>

      {/* ===== Executive Summary 视图 ===== */}
      {dashboardView === 'executive' && executiveData && (
        <ExecutiveSummary
          data={executiveData}
          onViewChange={(view) => setDashboardView(view)}
        />
      )}

      {/* ===== Operations Dashboard 视图（完整原仪表盘） ===== */}
      {dashboardView === 'operations' && (
        <ClassicOperationsView
          revenue={revenue}
          activePartners={activePartners}
          pipeline={pipeline}
          leadsConversion={leadsConversion}
          marketing={marketing}
          insights={insights}
          metrics={metrics}
          allDeals={allDeals}
          allPartners={allPartners}
          allApplications={allApplications}
          partners={partners}
          currency={currency}
          kpis={kpis}
          timeProgress={timeProgress}
          ecosystem={ecosystem}
          revForces={revForces}
          pipelineOverview={pipelineOverview}
          lifecycleCounts={lifecycleCounts}
          quarterlyTrendData={quarterlyTrendData}
          dimData={dimData}
          pendingStats={pendingStats}
          allPendingItems={allPendingItems}
          noDataAvailable={noDataAvailable}
          detailDim={detailDim}
          setDetailDim={setDetailDim}
          showPartnerList={showPartnerList}
          setShowPartnerList={setShowPartnerList}
          showAccelerationModal={showAccelerationModal}
          setShowAccelerationModal={setShowAccelerationModal}
          showDetailModal={showDetailModal}
          setShowDetailModal={setShowDetailModal}
          onViewChange={onViewChange}
          onSelectPartner={onSelectPartner}
        />
      )}

      {/* ===== Action Center 视图（升级为决策驱动） ===== */}
      {dashboardView === 'action_center' && decisionItems.length > 0 && (
        <ActionCenterV2
          decisionItems={decisionItems}
          impactSummary={impactSummary}
          impactRecords={impactRecords}
          overallRiskScore={overallRiskScore}
          onBack={() => setDashboardView('operations')}
        />
      )}

      {/* ===== Loading 状态 ===== */}
      {cockpitLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-20 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== 经典运营仪表盘视图（原有完整功能） =====
const ClassicOperationsView: React.FC<any> = (props) => {
  const {
    revenue, activePartners, pipeline, leadsConversion, marketing, insights,
    metrics, allDeals, allPartners, allApplications, partners, currency,
    kpis, timeProgress, ecosystem, revForces, pipelineOverview, lifecycleCounts,
    quarterlyTrendData, dimData, pendingStats, allPendingItems, noDataAvailable,
    detailDim, setDetailDim, showPartnerList, setShowPartnerList,
    showAccelerationModal, setShowAccelerationModal, showDetailModal, setShowDetailModal,
    onViewChange, onSelectPartner,
  } = props;

  return (
    <div className="space-y-8">
      {/* ===== 顶部：生态健康度仪表盘 ===== */}
      <EcosystemHealthBar 
        revenue={revenue} 
        activePartners={activePartners} 
        pipeline={pipeline} 
        leadsConversion={leadsConversion}
        allDeals={allDeals}
        allPartners={allPartners}
      />
      {(() => {
        const { diagnostics } = metrics;
        const issues: {
          dimension: string;
          icon: React.ReactNode;
          status: 'success' | 'warning' | 'danger';
          title: string;
          description: string;
          actions?: { label: string; preset?: string }[];
        }[] = [];

        // 维度1：业绩进展
        if (diagnostics.isBehindSchedule) {
          issues.push({
            dimension: '业绩进展',
            icon: <Target className="w-4 h-4" />,
            status: 'danger',
            title: '落后时间进度',
            description: `完成率 ${metrics.quarterRate}% 落后于时间进度 ${metrics.quarterTimeProgress}%，差距 ${Math.max(0, metrics.quarterTimeProgress - metrics.quarterRate)}%`,
            actions: [{ label: '推进管线流转', preset: 'stagnant' }],
          });
        } else if (metrics.quarterRate >= 80) {
          issues.push({
            dimension: '业绩进展',
            icon: <Target className="w-4 h-4" />,
            status: 'success',
            title: '达成良好',
            description: `完成率 ${metrics.quarterRate}%，时间进度 ${metrics.quarterTimeProgress}%`,
          });
        } else {
          issues.push({
            dimension: '业绩进展',
            icon: <Target className="w-4 h-4" />,
            status: 'warning',
            title: '需关注',
            description: `完成率 ${metrics.quarterRate}%，时间进度 ${metrics.quarterTimeProgress}%`,
          });
        }

        // 维度2：代理商累计
        if (diagnostics.hasTopHeavyPartners) {
          issues.push({
            dimension: '代理商累计',
            icon: <Users className="w-4 h-4" />,
            status: 'danger',
            title: '伙伴过度集中',
            description: `TOP1伙伴贡献超过70%，本季度仅 ${metrics.quarter.partners} 家伙伴下单`,
            actions: [
              { label: '查看本季度有商机的代理商', preset: 'has-deals' },
              { label: '重点代理商商机和下单情况', preset: 'key-partners' },
            ],
          });
        } else if (diagnostics.isOrderingPartnerLow) {
          issues.push({
            dimension: '代理商累计',
            icon: <Users className="w-4 h-4" />,
            status: 'warning',
            title: '下单伙伴偏少',
            description: `本季度仅 ${metrics.quarter.partners} 家伙伴下单，TOP3：${metrics.topPartners.map(p => p.name).join('、')}`,
            actions: [
              { label: '查看本季度有商机的代理商', preset: 'has-deals' },
              { label: '重点代理商商机和下单情况', preset: 'key-partners' },
            ],
          });
        } else {
          issues.push({
            dimension: '代理商累计',
            icon: <Users className="w-4 h-4" />,
            status: 'success',
            title: '伙伴分布健康',
            description: `本季度 ${metrics.quarter.partners} 家伙伴下单，TOP3：${metrics.topPartners.map(p => p.name).join('、')}`,
            actions: [
              { label: '查看本季度有商机的代理商', preset: 'has-deals' },
              { label: '重点代理商商机和下单情况', preset: 'key-partners' },
            ],
          });
        }

        // 维度3：商机储备
        if (diagnostics.isPipelineShort) {
          issues.push({
            dimension: '商机储备',
            icon: <Package className="w-4 h-4" />,
            status: 'danger',
            title: '管线严重不足',
            description: `管线储备仅覆盖缺口的 ${metrics.pipelineCoverageRatio}%，需立即拓展新商机`,
            actions: [{ label: '查看商机列表' }],
          });
        } else if (diagnostics.isNewPipelineLow) {
          issues.push({
            dimension: '商机储备',
            icon: <Package className="w-4 h-4" />,
            status: 'warning',
            title: '新增商机偏少',
            description: `管线中本季度新增仅占 ${metrics.newPipelineRatio}%，大部分依赖历史存量`,
            actions: [{ label: '查看新增商机' }],
          });
        } else if (diagnostics.hasPipelineSurplus && diagnostics.isConversionLow) {
          issues.push({
            dimension: '商机储备',
            icon: <Package className="w-4 h-4" />,
            status: 'warning',
            title: '管线充足但转化卡壳',
            description: `管线覆盖率 ${metrics.pipelineCoverageRatio}%，但成交率仅 ${metrics.dealConversionRate}%`,
            actions: [{ label: '推进管线流转', preset: 'stagnant' }],
          });
        } else {
          issues.push({
            dimension: '商机储备',
            icon: <Package className="w-4 h-4" />,
            status: 'success',
            title: '管线储备充足',
            description: `管线覆盖率 ${metrics.pipelineCoverageRatio}%，本季度新增占比 ${metrics.newPipelineRatio}%`,
          });
        }

        const hasIssues = issues.some(i => i.status !== 'success');

        return (
          <div className={`p-4 rounded-xl border-2 shadow-sm ${
            hasIssues 
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-700' 
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-700'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radar className={`w-5 h-5 ${hasIssues ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span className={`text-sm font-bold ${hasIssues ? 'text-amber-800 dark:text-amber-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                  业务诊断
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  hasIssues ? 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' 
                    : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                }`}>
                  {hasIssues ? '有问题需关注' : '运行良好'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {issues.map((issue) => {
                const statusColors = {
                  success: {
                    bg: 'bg-emerald-100/50 dark:bg-emerald-900/30',
                    border: 'border-emerald-200 dark:border-emerald-800',
                    icon: 'text-emerald-600 dark:text-emerald-400',
                    title: 'text-emerald-800 dark:text-emerald-200',
                    desc: 'text-emerald-700 dark:text-emerald-300',
                    badge: 'bg-emerald-200 text-emerald-800',
                  },
                  warning: {
                    bg: 'bg-amber-100/50 dark:bg-amber-900/30',
                    border: 'border-amber-200 dark:border-amber-800',
                    icon: 'text-amber-600 dark:text-amber-400',
                    title: 'text-amber-800 dark:text-amber-200',
                    desc: 'text-amber-700 dark:text-amber-300',
                    badge: 'bg-amber-200 text-amber-800',
                  },
                  danger: {
                    bg: 'bg-red-100/50 dark:bg-red-900/30',
                    border: 'border-red-200 dark:border-red-800',
                    icon: 'text-red-600 dark:text-red-400',
                    title: 'text-red-800 dark:text-red-200',
                    desc: 'text-red-700 dark:text-red-300',
                    badge: 'bg-red-200 text-red-800',
                  },
                };
                const c = statusColors[issue.status];
                
                return (
                  <div key={issue.dimension} className={`p-3 rounded-lg border ${c.bg} ${c.border}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-7 h-7 rounded-full bg-white/60 dark:bg-neutral-800/60 flex items-center justify-center ${c.icon}`}>
                        {issue.icon}
                      </div>
                      <span className="text-[10px] font-medium text-neutral-500">{issue.dimension}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${c.badge} ml-auto`}>
                        {issue.title}
                      </span>
                    </div>
                    <p className={`text-xs ${c.desc} mb-2 leading-relaxed`}>{issue.description}</p>
                    {issue.actions && issue.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {issue.actions.map((action, idx) => (
                          <button
                            key={action.label}
                            onClick={() => {
                              onViewChange('deals');
                            }}
                            className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors ${
                              issue.status === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : issue.status === 'warning'
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ===== 第一部分：业绩总览 ===== */}
      <section>
        <SectionHeader title="业绩总览" subtitle="季度进展 · 全年进度 · 多维分布" highlight={revenue?.achievements?.quarterly?.rate >= 80 ? '达成良好' : revenue?.achievements?.quarterly?.rate >= 60 ? '需关注' : '需加速'} />

        {/* 连续12季度走势（简约版） */}
        <Card className="border-0 shadow-sm mb-6">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">连续12季度走势</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-neutral-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-neutral-800 dark:bg-neutral-200" />下单金额</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" />订单数</span>
            </div>
          </div>
          <div className="h-40 px-3 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quarterlyTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <SafeGrid />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 600 }} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} tickFormatter={(v) => `${Math.round(v / 10000)}万`} width={35} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#3b82f6' }} tickFormatter={(v) => Math.round(v)} width={35} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'amount') return [formatCurrency(value, 'CNY'), '下单金额'];
                    return [value + '单', '订单数'];
                  }}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="amount" stroke="#18181b" strokeWidth={2} name="下单金额" dot={{ r: 2 }} activeDot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="订单数" dot={{ r: 2 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 1.1 单季度业绩进展 + 全年进度 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 单季度进展 */}
          {(() => {
            const currentRate = revenue?.achievements?.quarterly?.rate ?? 0;
            // 计算当前季度时间进度
            const now = new Date();
            const month = now.getMonth() + 1;
            let quarterDays = 91, quarterStartMonth = 4;
            if (month >= 1 && month <= 3) { quarterDays = 90; quarterStartMonth = 1; }
            else if (month >= 7 && month <= 9) { quarterDays = 92; quarterStartMonth = 7; }
            else if (month >= 10) { quarterDays = 92; quarterStartMonth = 10; }
            const daysPassed = (month - quarterStartMonth) * 30 + now.getDate();
            const timeProgress = Math.min(100, Math.round((daysPassed / quarterDays) * 100));
            const isBehindSchedule = currentRate < timeProgress;
            
            return (
          <Card className={cn(isBehindSchedule && 'border-2 border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  本季度业绩进展
                </CardTitle>
                {isBehindSchedule && (
                  <button 
                    onClick={() => setShowAccelerationModal(true)}
                    className="flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse">需加速</span>
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(revenue?.achievements?.quarterly?.current ?? 0, currency)}
                    </div>
                    <div className="text-xs text-neutral-400">季度完成 (目标 {formatCurrency(revenue?.achievements?.quarterly?.target ?? 0, currency)})</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={currentRate >= 80 ? 'success' : currentRate >= 60 ? 'warning' : 'danger'} className="text-lg px-3 py-1">
                      {Math.round(currentRate)}%
                    </Badge>
                    <div className="text-xs text-neutral-400 mt-1">达成率</div>
                  </div>
                </div>
                
                {/* 时间进度 vs 达成率 对比 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span>时间进度</span>
                    <span className={cn('font-bold', isBehindSchedule ? 'text-emerald-600' : 'text-neutral-400')}>
                      {timeProgress}%
                    </span>
                  </div>
                  <div className="relative h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    {/* 时间进度线 */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white/80 z-10 shadow-sm"
                      style={{ left: `${timeProgress}%` }}
                    />
                    {/* 达成率进度 */}
                    <div 
                      className={cn(
                        'h-full rounded-full transition-all',
                        currentRate >= 80 ? 'bg-emerald-500' : currentRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${Math.min(100, currentRate)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[9px] text-neutral-400">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-1 bg-white/80 rounded-full border border-neutral-300" />
                      <span>时间进度 {timeProgress}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={cn('w-2 h-1 rounded-full', currentRate >= 80 ? 'bg-emerald-500' : currentRate >= 60 ? 'bg-amber-500' : 'bg-red-500')} />
                      <span>达成率 {Math.round(currentRate)}%</span>
                    </div>
                    {isBehindSchedule && (
                      <span className="ml-auto text-red-500 font-medium">落后 {timeProgress - Math.round(currentRate)}%</span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">{formatCurrency(revenue?.achievements?.quarterly?.current ?? 0, currency)}</div>
                    <div className="text-[10px] text-neutral-400">已完成</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-amber-600">
                      {formatCurrency(Math.max(0, (revenue?.achievements?.quarterly?.target ?? 0) - (revenue?.achievements?.quarterly?.current ?? 0)), currency)}
                    </div>
                    <div className="text-[10px] text-neutral-400">剩余缺口</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                      {timeProgress}%
                    </div>
                    <div className="text-[10px] text-neutral-400">时间进度</div>
                  </div>
                </div>
                
                {/* 管线覆盖额预测 */}
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  {(() => {
                    const remainingGap = Math.max(0, (revenue?.achievements?.quarterly?.target ?? 0) - (revenue?.achievements?.quarterly?.current ?? 0));
                    const pipelineCoverage = allDeals
                      .filter((d: any) => !['ClosedLost', 'ClosedWon'].includes(d.stage || d.status))
                      .reduce((sum: number, d: any) => sum + Number(d.value || 0), 0);
                    const coverageRatio = remainingGap > 0 ? pipelineCoverage / remainingGap : 999;
                    const isDanger = pipelineCoverage < remainingGap;
                    const isWarning = !isDanger && coverageRatio < 1.3;
                    const isStable = !isDanger && !isWarning;
                    
                    return (
                      <div className={cn(
                        'p-3 rounded-lg',
                        isDanger ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                        isWarning ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' :
                        'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <BarChart3 className={cn('w-4 h-4', isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600')} />
                            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">管线覆盖额</span>
                          </div>
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            isDanger ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                            isWarning ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                          )}>
                            {isDanger ? '必输 ⚠️' : isWarning ? '有风险' : '稳健'}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className={cn('text-lg font-bold', isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600')}>
                              {formatCurrency(pipelineCoverage, currency)}
                            </span>
                            <span className="text-[10px] text-neutral-400 ml-1">管线储备</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-400">缺口 </span>
                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">{formatCurrency(remainingGap, currency)}</span>
                          </div>
                        </div>
                        {remainingGap > 0 && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-white/50 dark:bg-neutral-800/50 rounded-full overflow-hidden">
                              <div 
                                className={cn('h-full rounded-full', isDanger ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-emerald-400')}
                                style={{ width: `${Math.min(100, coverageRatio * 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[9px] text-neutral-400">覆盖率 {Math.round(coverageRatio * 100)}%</span>
                              <span className="text-[9px] text-neutral-400">
                                {isDanger ? `管线缺口 ${formatCurrency(remainingGap - pipelineCoverage, currency)}` : `安全边际 ${formatCurrency(pipelineCoverage - remainingGap, currency)}`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
            );
          })()}

          {/* 全年进度 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                全年进度
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const annualTarget = revenue?.achievements?.yearly?.target ?? 0;
                const annualCurrent = revenue?.achievements?.yearly?.current ?? 0;
                const annualRate = revenue?.achievements?.yearly?.rate ?? 0;
                const hasData = annualCurrent > 0 || annualTarget > 0;
                
                // 季度数据
                const quarterData = ['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => {
                  const qTarget = revenue?.achievements?.[`q${i + 1}`]?.target ?? (annualTarget / 4);
                  const qCurrent = revenue?.achievements?.[`q${i + 1}`]?.current ?? 0;
                  const qRate = revenue?.achievements?.[`q${i + 1}`]?.rate ?? 0;
                  return { name: q, target: qTarget, current: qCurrent, rate: qRate };
                });
                
                // 计算全年预测（基于当前季度趋势）
                const currentMonth = new Date().getMonth() + 1;
                const quarterIndex = currentMonth <= 3 ? 0 : currentMonth <= 6 ? 1 : currentMonth <= 9 ? 2 : 3;
                const avgRatePerQuarter = quarterIndex > 0 ? annualRate / quarterIndex : annualRate;
                const fullYearPrediction = Math.min(150, avgRatePerQuarter * 4);
                
                return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(annualCurrent, currency)}
                    </div>
                    <div className="text-xs text-neutral-400">年度完成 (目标 {formatCurrency(annualTarget, currency)})</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={annualRate >= 80 ? 'success' : annualRate >= 60 ? 'warning' : 'danger'} className="text-lg px-3 py-1">
                      {Math.round(annualRate)}%
                    </Badge>
                    <div className="text-xs text-neutral-400 mt-1">年度达成率</div>
                  </div>
                </div>
                
                {/* 目标分解线 + 预测线 */}
                <div className="relative h-32">
                  {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quarterData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} tickFormatter={(v) => `${Math.round(v / 10000)}万`} width={50} />
                        <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="目标" />
                        <Bar dataKey="current" fill="#22c55e" radius={[4, 4, 0, 0]} name="实际" />
                        <defs>
                          <linearGradient id="predGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    /* 无数据时显示目标分解指引 */
                    <div className="h-full flex flex-col justify-center">
                      <div className="text-center mb-3">
                        <div className="text-[10px] text-neutral-400 mb-1">年度目标</div>
                        <div className="text-xl font-bold text-neutral-700 dark:text-neutral-300">
                          {formatCurrency(annualTarget, currency)}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {quarterData.map((q) => (
                          <div key={q.name} className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{q.name}目标</div>
                            <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                              {formatCurrency(q.target, currency)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-center mt-2 text-[9px] text-neutral-400">设置各季度目标后自动计算分解</div>
                    </div>
                  )}
                </div>
                
                {/* 季度达成率网格 */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  {quarterData.map((q, i) => {
                    const isCurrentQ = i === quarterIndex;
                    return (
                      <div key={q.name} className={cn(
                        'text-center p-2 rounded-lg',
                        isCurrentQ ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-300 dark:ring-blue-700' : 'bg-neutral-50 dark:bg-neutral-800'
                      )}>
                        <div className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
                          {q.name}{isCurrentQ && ' (当季)'}
                        </div>
                        <div className={cn(
                          'text-sm font-bold',
                          q.rate >= 80 ? 'text-emerald-600' : q.rate >= 60 ? 'text-amber-600' : q.rate > 0 ? 'text-red-600' : 'text-neutral-400'
                        )}>
                          {q.rate > 0 ? `${Math.round(q.rate)}%` : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 全年预测线 */}
                {hasData && (
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-neutral-500">全年预计达成率</span>
                      <span className={cn(
                        'text-sm font-bold',
                        fullYearPrediction >= 80 ? 'text-emerald-600' : fullYearPrediction >= 60 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {Math.round(fullYearPrediction)}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      {/* 目标线 */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10" style={{ left: '25%' }} />
                      {/* 预测线 */}
                      <div 
                        className={cn(
                          'h-full rounded-full',
                          fullYearPrediction >= 80 ? 'bg-emerald-500' : fullYearPrediction >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(100, fullYearPrediction)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] text-neutral-400">
                      <span>0%</span>
                      <span className="text-blue-500">目标线 25%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* 1.2 业绩驱动力诊断（区域/伙伴/产品/订单4维度分布） */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          {/* 1. 区域完成情况 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 ring-1 ring-neutral-200/60 dark:ring-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  区域完成情况
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const regionData = detailDim === 'region' ? dimData : (revenue?.dimensional_achievements?.find((d: any) => d.type === 'region')?.data || []);
                const totalValue = regionData.reduce((s: number, d: any) => s + Number(d.value || 0), 0);

                if (regionData.length === 0) {
                  return (
                    <div className="text-center py-8 text-neutral-400 text-sm">
                      暂无区域数据
                    </div>
                  );
                }

                const maxValue = Math.max(...regionData.map((d: any) => Number(d.value || 0)));
                const detailRows = regionData.slice(0, 8).map((item: any, idx: number) => {
                  const value = Number(item.value || 0);
                  const rate = item.rate ?? item.achievement_rate ?? 0;
                  const pct = totalValue > 0 ? Math.round((value / totalValue) * 100) : 0;
                  return {
                    rank: idx + 1,
                    name: item.name || `区域${idx + 1}`,
                    value,
                    rate,
                    pct,
                    status: rate >= 80 ? '良好' : rate >= 60 ? '关注' : '落后',
                  };
                });

                return (
                  <div onClick={() => setShowDetailModal({
                    title: '区域完成情况详情',
                    subtitle: `共 ${regionData.length} 个区域 · 总业绩 ${formatCurrency(totalValue, currency)}`,
                    rows: detailRows,
                    columns: [
                      { key: 'rank', label: '排名', type: 'text' },
                      { key: 'name', label: '区域名称', type: 'text' },
                      { key: 'value', label: '业绩金额', type: 'currency' },
                      { key: 'rate', label: '完成率', type: 'percent' },
                      { key: 'pct', label: '占比', type: 'percent' },
                      { key: 'status', label: '状态', type: 'text' },
                    ],
                  })}>
                    <div className="space-y-2">
                      {regionData.slice(0, 5).map((item: any, idx: number) => {
                        const value = Number(item.value || 0);
                        const rate = item.rate ?? item.achievement_rate ?? 0;
                        const pct = totalValue > 0 ? Math.round((value / totalValue) * 100) : 0;
                        const isBottom = rate < 60;
                        return (
                          <div key={item.name || idx} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={cn('text-xs font-bold', rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600')}>
                                  {Math.round(rate)}%
                                </span>
                              </div>
                            </div>
                            <div className="relative h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                                style={{ width: `${Math.min(100, (value / maxValue) * 100)}%` }}
                              />
                            </div>
                            {isBottom && (
                              <div className="text-[9px] text-red-500">⚠ 拖后腿区域</div>
                            )}
                          </div>
                        );
                      })}
                      <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
                        <span className="text-[10px] text-blue-500 hover:text-blue-600">点击查看全部 {regionData.length} 个区域 →</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* 2. 合作伙伴完成情况（级别+类型） */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 ring-1 ring-neutral-200/60 dark:ring-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  伙伴完成情况
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // 按级别统计（Gold/Silver/Bronze/未分级）
                const partnerAchievementMap = new Map<string, { name: string; value: number; count: number; partners: string[] }>();
                partners.forEach((p: any) => {
                  const pDeals = allDeals.filter((d: any) => d.partner_id === p.id);
                  const wonValue = pDeals.filter((d: any) => d.status === 'Won' || d.stage === 'ClosedWon').reduce((s: number, d: any) => s + Number(d.value || 0), 0);
                  if (wonValue > 0) {
                    const level = p.tier || p.level || p.grade || '未分级';
                    const key = String(level);
                    const cur = partnerAchievementMap.get(key) || { name: key, value: 0, count: 0, partners: [] };
                    cur.value += wonValue;
                    cur.count += 1;
                    cur.partners.push(p.name || `伙伴${p.id}`);
                    partnerAchievementMap.set(key, cur);
                  }
                });
                const levelData = [...partnerAchievementMap.values()].sort((a, b) => b.value - a.value);
                const totalLevelValue = levelData.reduce((s, d) => s + d.value, 0);

                // 按类型统计
                const typeMap = new Map<string, { name: string; value: number; count: number; partners: string[] }>();
                partners.forEach((p: any) => {
                  const pDeals = allDeals.filter((d: any) => d.partner_id === p.id);
                  const wonValue = pDeals.filter((d: any) => d.status === 'Won' || d.stage === 'ClosedWon').reduce((s: number, d: any) => s + Number(d.value || 0), 0);
                  if (wonValue > 0) {
                    const type = p.type || p.partner_type || p.category || '未分类';
                    const key = String(type);
                    const cur = typeMap.get(key) || { name: key, value: 0, count: 0, partners: [] };
                    cur.value += wonValue;
                    cur.count += 1;
                    cur.partners.push(p.name || `伙伴${p.id}`);
                    typeMap.set(key, cur);
                  }
                });
                const typeData = [...typeMap.values()].sort((a, b) => b.value - a.value);
                const totalTypeValue = typeData.reduce((s, d) => s + d.value, 0);

                if (levelData.length === 0 && typeData.length === 0) {
                  return (
                    <div className="text-center py-8 text-neutral-400 text-sm">
                      暂无伙伴数据
                    </div>
                  );
                }

                // 详情汇总
                const detailRows = [
                  ...levelData.slice(0, 6).map((item, idx) => ({
                    category: '级别',
                    rank: idx + 1,
                    name: item.name,
                    value: item.value,
                    count: item.count,
                    pct: totalLevelValue > 0 ? Math.round((item.value / totalLevelValue) * 100) : 0,
                  })),
                  ...typeData.slice(0, 6).map((item, idx) => ({
                    category: '类型',
                    rank: idx + 1,
                    name: item.name,
                    value: item.value,
                    count: item.count,
                    pct: totalTypeValue > 0 ? Math.round((item.value / totalTypeValue) * 100) : 0,
                  })),
                ];

                return (
                  <div onClick={() => setShowDetailModal({
                    title: '合作伙伴完成情况详情',
                    subtitle: `按级别 + 类型 · 共 ${levelData.length + typeData.length} 个分组`,
                    rows: detailRows,
                    columns: [
                      { key: 'category', label: '分类维度', type: 'text' },
                      { key: 'rank', label: '序号', type: 'text' },
                      { key: 'name', label: '分组名称', type: 'text' },
                      { key: 'count', label: '伙伴数', type: 'count' },
                      { key: 'value', label: '业绩金额', type: 'currency' },
                      { key: 'pct', label: '占比', type: 'percent' },
                    ],
                  })}>
                    <div className="space-y-3">
                      {/* 按级别 */}
                      <div>
                        <div className="text-[10px] font-semibold text-neutral-500 mb-1.5">按级别</div>
                        <div className="space-y-1.5">
                          {levelData.length > 0 ? levelData.slice(0, 3).map((item, idx) => {
                            const pct = totalLevelValue > 0 ? Math.round((item.value / totalLevelValue) * 100) : 0;
                            const maxPct = Math.max(...levelData.map((d) => (d.value / totalLevelValue) * 100), 0) * 100;
                            return (
                              <div key={item.name} className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-neutral-700 dark:text-neutral-300">{item.name}（{item.count}家）</span>
                                  <span className="text-[10px] font-bold text-amber-600">{pct}%</span>
                                </div>
                                <div className="relative h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, pct)}%` }} />
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="text-[10px] text-neutral-400">暂无分级数据</div>
                          )}
                        </div>
                      </div>

                      {/* 按类型 */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="text-[10px] font-semibold text-neutral-500 mb-1.5">按类型</div>
                        <div className="space-y-1.5">
                          {typeData.length > 0 ? typeData.slice(0, 3).map((item, idx) => {
                            const pct = totalTypeValue > 0 ? Math.round((item.value / totalTypeValue) * 100) : 0;
                            return (
                              <div key={item.name} className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-neutral-700 dark:text-neutral-300">{item.name}（{item.count}家）</span>
                                  <span className="text-[10px] font-bold text-orange-600">{pct}%</span>
                                </div>
                                <div className="relative h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, pct)}%` }} />
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="text-[10px] text-neutral-400">暂无类型数据</div>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 text-center">
                        <span className="text-[10px] text-amber-500 hover:text-amber-600">点击查看完整明细 →</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* 3. 产品系完成情况（产品系 + 新购/服务/维保） */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 ring-1 ring-neutral-200/60 dark:ring-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  产品系完成情况
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // 产品数据
                const productData = detailDim === 'product' ? dimData : (revenue?.product_achievements || []);
                let productRows = productData.map((item: any) => ({
                  name: item.name || item.product_name || item.product || '未命名产品',
                  value: Number(item.value || 0),
                  rate: item.rate ?? item.achievement_rate ?? 0,
                  pct: 0,
                }));

                // 如果没有产品数据，尝试从 allDeals 中推导（基于 product_name 字段）
                if (productRows.length === 0) {
                  const productMap = new Map<string, { value: number; count: number }>();
                  allDeals.forEach((d: any) => {
                    const isWon = d.status === 'Won' || d.stage === 'ClosedWon';
                    if (isWon) {
                      const key = d.product_name || d.product || d.product_line || d.type || '其他';
                      const cur = productMap.get(key) || { value: 0, count: 0 };
                      cur.value += Number(d.value || 0);
                      cur.count += 1;
                      productMap.set(key, cur);
                    }
                  });
                  productRows = [...productMap.entries()].map(([name, info]) => ({
                    name,
                    value: info.value,
                    rate: 0,
                    pct: 0,
                  })).sort((a, b) => b.value - a.value);
                }

                const totalProductValue = productRows.reduce((s, d) => s + d.value, 0);
                productRows = productRows.map((r) => ({ ...r, pct: totalProductValue > 0 ? Math.round((r.value / totalProductValue) * 100) : 0 }));

                // 新购 / 服务 / 维保 分类
                const orderTypeMap = new Map<string, { value: number; count: number }>();
                allDeals.forEach((d: any) => {
                  const isWon = d.status === 'Won' || d.stage === 'ClosedWon';
                  if (isWon) {
                    const raw = String(d.order_type || d.type || d.service_type || d.category || '').toLowerCase();
                    let key = '其他';
                    if (raw.includes('新购') || raw.includes('new') || raw.includes('purchase') || raw.includes('buy')) key = '新购';
                    else if (raw.includes('服务') || raw.includes('service') || raw.includes('咨询')) key = '服务';
                    else if (raw.includes('维保') || raw.includes('maintain') || raw.includes('维护') || raw.includes('续保')) key = '维保';
                    else if (raw) key = raw.charAt(0).toUpperCase() + raw.slice(1);
                    const cur = orderTypeMap.get(key) || { value: 0, count: 0 };
                    cur.value += Number(d.value || 0);
                    cur.count += 1;
                    orderTypeMap.set(key, cur);
                  }
                });
                const orderTypeData = [...orderTypeMap.entries()].map(([name, info]) => ({
                  name,
                  value: info.value,
                  count: info.count,
                })).sort((a, b) => b.value - a.value);
                const totalOrderTypeValue = orderTypeData.reduce((s, d) => s + d.value, 0);

                if (productRows.length === 0 && orderTypeData.length === 0) {
                  return (
                    <div className="text-center py-8 text-neutral-400 text-sm">
                      暂无产品数据
                    </div>
                  );
                }

                const detailRows = [
                  ...productRows.slice(0, 8).map((item, idx) => ({
                    category: '产品系',
                    rank: idx + 1,
                    name: item.name,
                    value: item.value,
                    rate: item.rate,
                    pct: item.pct,
                  })),
                  ...orderTypeData.map((item, idx) => ({
                    category: '业务类型',
                    rank: idx + 1,
                    name: item.name,
                    value: item.value,
                    count: item.count,
                    pct: totalOrderTypeValue > 0 ? Math.round((item.value / totalOrderTypeValue) * 100) : 0,
                  })),
                ];

                const colors = ['#a855f7', '#ec4899', '#3b82f6', '#06b6d4', '#10b981'];

                return (
                  <div onClick={() => setShowDetailModal({
                    title: '产品系完成情况详情',
                    subtitle: `共 ${productRows.length} 个产品线 · 总业绩 ${formatCurrency(totalProductValue, currency)}`,
                    rows: detailRows,
                    columns: [
                      { key: 'category', label: '分类维度', type: 'text' },
                      { key: 'rank', label: '序号', type: 'text' },
                      { key: 'name', label: '产品/业务名称', type: 'text' },
                      { key: 'count', label: '订单数', type: 'count' },
                      { key: 'value', label: '业绩金额', type: 'currency' },
                      { key: 'rate', label: '完成率', type: 'percent' },
                      { key: 'pct', label: '占比', type: 'percent' },
                    ],
                  })}>
                    <div className="space-y-3">
                      {/* 产品系 */}
                      <div>
                        <div className="text-[10px] font-semibold text-neutral-500 mb-1.5">按产品系</div>
                        <div className="space-y-1.5">
                          {productRows.length > 0 ? productRows.slice(0, 3).map((item, idx) => (
                            <div key={item.name} className="space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-neutral-700 dark:text-neutral-300 truncate">{item.name}</span>
                                <span className="text-[10px] font-bold text-purple-600">{item.pct}%</span>
                              </div>
                              <div className="relative h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.pct)}%`, backgroundColor: colors[idx % colors.length] }} />
                              </div>
                            </div>
                          )) : (
                            <div className="text-[10px] text-neutral-400">暂无产品数据</div>
                          )}
                        </div>
                      </div>

                      {/* 业务类型（新购/服务/维保） */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="text-[10px] font-semibold text-neutral-500 mb-1.5">按业务类型</div>
                        <div className="space-y-1.5">
                          {orderTypeData.length > 0 ? orderTypeData.slice(0, 3).map((item, idx) => {
                            const pct = totalOrderTypeValue > 0 ? Math.round((item.value / totalOrderTypeValue) * 100) : 0;
                            const typeColors: Record<string, string> = { '新购': '#3b82f6', '服务': '#10b981', '维保': '#f59e0b', '其他': '#94a3b8' };
                            return (
                              <div key={item.name} className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-neutral-700 dark:text-neutral-300">{item.name}（{item.count}单）</span>
                                  <span className="text-[10px] font-bold" style={{ color: typeColors[item.name] || colors[idx % colors.length] }}>{pct}%</span>
                                </div>
                                <div className="relative h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: typeColors[item.name] || colors[idx % colors.length] }} />
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="text-[10px] text-neutral-400">暂无业务类型数据</div>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 text-center">
                        <span className="text-[10px] text-purple-500 hover:text-purple-600">点击查看完整明细 →</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* 4. 按订单金额分层完成情况 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 ring-1 ring-neutral-200/60 dark:ring-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  订单金额分层
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // 4个金额层级（单位：元）：<10万, 10-50万, 50-200万, >200万
                const tiers = [
                  { name: '小额订单（<10万）', min: 0, max: 100000, color: '#22c55e', shortLabel: '<10万' },
                  { name: '中额订单（10-50万）', min: 100000, max: 500000, color: '#06b6d4', shortLabel: '10-50万' },
                  { name: '大额订单（50-200万）', min: 500000, max: 2000000, color: '#f59e0b', shortLabel: '50-200万' },
                  { name: '超大订单（>200万）', min: 2000000, max: Infinity, color: '#ef4444', shortLabel: '>200万' },
                ];

                const tierData = tiers.map((t) => {
                  const dealsInTier = allDeals.filter((d: any) => {
                    const isWon = d.status === 'Won' || d.stage === 'ClosedWon';
                    const val = Number(d.value || 0);
                    return isWon && val >= t.min && (t.max === Infinity ? true : val < t.max);
                  });
                  const value = dealsInTier.reduce((s, d) => s + Number(d.value || 0), 0);
                  return {
                    name: t.name,
                    shortLabel: t.shortLabel,
                    color: t.color,
                    value,
                    count: dealsInTier.length,
                    pct: 0,
                  };
                });

                const totalTierValue = tierData.reduce((s, d) => s + d.value, 0);
                tierData.forEach((t) => { t.pct = totalTierValue > 0 ? Math.round((t.value / totalTierValue) * 100) : 0; });

                if (totalTierValue === 0) {
                  return (
                    <div className="text-center py-8 text-neutral-400 text-sm">
                      暂无订单数据
                    </div>
                  );
                }

                const detailRows = tierData.map((t, idx) => ({
                  rank: idx + 1,
                  name: t.name,
                  value: t.value,
                  count: t.count,
                  pct: t.pct,
                  avgValue: t.count > 0 ? Math.round(t.value / t.count) : 0,
                }));

                const maxCount = Math.max(...tierData.map((d) => d.count), 1);

                return (
                  <div onClick={() => setShowDetailModal({
                    title: '订单金额分层完成情况详情',
                    subtitle: `4个金额层级 · 总业绩 ${formatCurrency(totalTierValue, currency)} · 总订单 ${tierData.reduce((s, t) => s + t.count, 0)} 单`,
                    rows: detailRows,
                    columns: [
                      { key: 'rank', label: '序号', type: 'text' },
                      { key: 'name', label: '金额层级', type: 'text' },
                      { key: 'count', label: '订单数', type: 'count' },
                      { key: 'value', label: '总金额', type: 'currency' },
                      { key: 'avgValue', label: '平均金额', type: 'currency' },
                      { key: 'pct', label: '金额占比', type: 'percent' },
                    ],
                  })}>
                    <div className="space-y-2.5">
                      {tierData.map((t, idx) => (
                        <div key={t.name} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                              <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">{t.shortLabel}</span>
                              <span className="text-[9px] text-neutral-400">({t.count}单)</span>
                            </div>
                            <span className="text-[10px] font-bold" style={{ color: t.color }}>{t.pct}%</span>
                          </div>
                          <div className="relative h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(100, t.pct)}%`, backgroundColor: t.color }}
                            />
                          </div>
                          <div className="text-[9px] text-neutral-400 text-right">
                            {formatCurrency(t.value, currency)}
                          </div>
                        </div>
                      ))}

                      <div className="pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800 text-center">
                        <span className="text-[10px] text-cyan-500 hover:text-cyan-600">点击查看分层明细 →</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

      </section>
      {/* ===== 第二部分：业绩与伙伴关联诊断 ===== */}
      <section>
        <SectionHeader title="业绩与伙伴关联诊断" subtitle="问题查询 · 关联分析 · 待办事项" />

        {/* 问题伙伴快速查询卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: '零产出伙伴',
              count: partners.filter((p: any) => {
                const pDeals = allDeals.filter((d: any) => d.partner_id === p.id);
                const wonValue = pDeals.filter((d: any) => d.status === 'Won' || d.stage === 'ClosedWon').reduce((s: number, d: any) => s + Number(d.value || 0), 0);
                return wonValue === 0 && p.status !== 'Prospective';
              }).length,
              icon: AlertTriangle,
              color: 'text-red-600',
              bg: 'bg-red-100 dark:bg-red-900/30',
              border: 'border-red-200 dark:border-red-800',
              detail: '超过3个月无成交产出'
            },
            {
              label: '业绩下滑',
              count: partners.filter((p: any) => {
                const pDeals = allDeals.filter((d: any) => d.partner_id === p.id);
                return pDeals.length > 0 && pDeals.length < 2;
              }).length,
              icon: TrendingDown,
              color: 'text-amber-600',
              bg: 'bg-amber-100 dark:bg-amber-900/30',
              border: 'border-amber-200 dark:border-amber-800',
              detail: '同比/环比呈下降趋势'
            },
            {
              label: '高贡献TOP',
              count: Math.max(1, Math.round(partners.length * 0.2)),
              icon: TrendingUp,
              color: 'text-emerald-600',
              bg: 'bg-emerald-100 dark:bg-emerald-900/30',
              border: 'border-emerald-200 dark:border-emerald-800',
              detail: '贡献80%以上业绩的伙伴'
            },
            {
              label: '潜力待激活',
              count: partners.filter((p: any) => {
                const pDeals = allDeals.filter((d: any) => d.partner_id === p.id);
                return pDeals.length > 0 && pDeals.filter((d: any) => d.status !== 'Won' && d.stage !== 'ClosedWon').length >= 1;
              }).length,
              icon: Sparkles,
              color: 'text-blue-600',
              bg: 'bg-blue-100 dark:bg-blue-900/30',
              border: 'border-blue-200 dark:border-blue-800',
              detail: '有活跃商机但尚未转化'
            }
          ].map((metric, idx) => (
            <Card
              key={idx}
              hover
              onClick={() => onViewChange('partners')}
              className={cn(metric.border, 'border-2 cursor-pointer')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', metric.bg)}>
                    <metric.icon className={cn('w-4 h-4', metric.color)} />
                  </div>
                  <span className={cn('text-2xl font-bold', metric.color)}>{metric.count}</span>
                </div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">{metric.label}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{metric.detail}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 伙伴-业绩关联诊断矩阵 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 诊断矩阵 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                伙伴 × 业绩 诊断矩阵
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    cell: '高产出 · 高活跃',
                    color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
                    title: '金牌伙伴',
                    desc: '稳定高产出，应作为标杆案例推广',
                    count: Math.round(partners.length * 0.15),
                    rate: 85,
                    rateColor: 'text-emerald-600'
                  },
                  {
                    cell: '高产出 · 低活跃',
                    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                    title: '潜力大单型',
                    desc: '虽然活跃度低但偶有大单，需加深合作关系',
                    count: Math.round(partners.length * 0.1),
                    rate: 60,
                    rateColor: 'text-blue-600'
                  },
                  {
                    cell: '低产出 · 高活跃',
                    color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
                    title: '活跃但低效',
                    desc: '频繁报备但转化低，需排查产品匹配度或能力问题',
                    count: Math.round(partners.length * 0.25),
                    rate: 40,
                    rateColor: 'text-amber-600'
                  },
                  {
                    cell: '低产出 · 低活跃',
                    color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                    title: '沉睡风险',
                    desc: '长时间无动作，需判断是继续激活还是止损',
                    count: Math.round(partners.length * 0.5),
                    rate: 15,
                    rateColor: 'text-red-600'
                  }
                ].map((cell, idx) => (
                  <div key={idx} className={cn('p-3 rounded-lg border', cell.color)}>
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-white">{cell.title}</div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{cell.cell}</div>
                      </div>
                      <div className="text-right">
                        <div className={cn('text-lg font-bold', cell.rateColor)}>{cell.count}<span className="text-xs">家</span></div>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mb-2">{cell.desc}</p>
                    <ProgressBar value={cell.rate} size="sm" color={cell.rateColor.includes('emerald') ? 'bg-emerald-500' : cell.rateColor.includes('blue') ? 'bg-blue-500' : cell.rateColor.includes('amber') ? 'bg-amber-500' : 'bg-red-500'} />
                    
                    {/* 一键触达行动按钮 - 仅对"活跃但低效"和"沉睡风险"显示 */}
                    {(idx === 2 || idx === 3) && (
                      <div className="mt-3 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50">
                        <div className="text-[9px] text-neutral-400 mb-1.5 font-medium">一键触达激活</div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => onViewChange('partners')}
                            className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-md text-[10px] text-neutral-600 dark:text-neutral-300 transition-colors shadow-sm"
                          >
                            <Mail className="w-3 h-3 text-blue-500" />
                            批量发送激活邮件
                          </button>
                          <button
                            onClick={() => onViewChange('marketing')}
                            className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-md text-[10px] text-neutral-600 dark:text-neutral-300 transition-colors shadow-sm"
                          >
                            <Zap className="w-3 h-3 text-amber-500" />
                            推送Q2激励政策
                          </button>
                          <button
                            onClick={() => onViewChange('partners')}
                            className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-md text-[10px] text-neutral-600 dark:text-neutral-300 transition-colors shadow-sm"
                          >
                            <Phone className="w-3 h-3 text-emerald-500" />
                            一键电话回访
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 问题清单与待办 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                问题清单与行动建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {[
                  {
                    issue: `${partners.filter((p: any) => {
                      const pDeals = allDeals.filter((d: any) => d.partner_id === p.id);
                      const wonValue = pDeals.filter((d: any) => d.status === 'Won' || d.stage === 'ClosedWon').reduce((s: number, d: any) => s + Number(d.value || 0), 0);
                      return wonValue === 0 && p.status !== 'Prospective';
                    }).length}家伙伴零产出`,
                    action: '逐一排查原因，要么激活要么清退',
                    priority: 'high',
                    target: 'partners'
                  },
                  {
                    issue: `商机转化率低于30%`,
                    action: '集中培训低转化伙伴的销售能力',
                    priority: 'high',
                    target: 'enablement'
                  },
                  {
                    issue: `${Math.round(partners.length * 0.3)}家伙伴超60天无新动作`,
                    action: '发邮件+电话回访+推送激励政策',
                    priority: 'medium',
                    target: 'marketing'
                  },
                  {
                    issue: '大单停滞在方案环节超20天',
                    action: '派遣解决方案专家介入支持',
                    priority: 'medium',
                    target: 'deals'
                  }
                ].map((item, idx) => (
                  <div key={idx} className={cn(
                    'flex items-start gap-2 p-2.5 rounded-lg border',
                    item.priority === 'high'
                      ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                      : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                  )}>
                    <div className={cn(
                      'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold',
                      item.priority === 'high' ? 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-200' : 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-200'
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-neutral-900 dark:text-white">{item.issue}</div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{item.action}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300 mt-0.5 shrink-0" />
                  </div>
                ))}
              </div>

              {/* 关键指标 */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {Math.round((allDeals.filter((d: any) => d.status === 'Won' || d.stage === 'ClosedWon').length / Math.max(allDeals.length, 1)) * 100)}%
                  </div>
                  <div className="text-[10px] text-neutral-400">商机成交率</div>
                </div>
                <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="text-lg font-bold text-amber-600">
                    ¥{Math.round((allDeals.filter((d: any) => d.status === 'Won' || d.stage === 'ClosedWon').reduce((s: number, d: any) => s + Number(d.value || 0), 0)) / 10000)}万
                  </div>
                  <div className="text-[10px] text-neutral-400">平均单产</div>
                </div>
                <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="text-lg font-bold text-emerald-600">
                    {Math.round(partners.filter((p: any) => {
                      const pDeals = allDeals.filter((d: any) => d.partner_id === p.id);
                      return pDeals.length > 0;
                    }).length / Math.max(partners.length, 1) * 100)}%
                  </div>
                  <div className="text-[10px] text-neutral-400">活跃占比</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== 待办事项清单（首屏优化：折叠+超期红牌）===== */}
      {pendingStats.total > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">全部待办事项</h2>
              <Badge variant="danger" size="sm">{pendingStats.total} 项待处理</Badge>
              {pendingStats.urgent > 0 && (
                <Badge variant="warning" size="sm">{pendingStats.urgent} 项紧急</Badge>
              )}
              {pendingStats.zombie > 0 && (
                <Badge variant="danger" size="sm" className="animate-pulse">
                  <AlertOctagon className="w-3 h-3 mr-1" />
                  {pendingStats.zombie} 项超30天僵尸
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />严重超期</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />紧急</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />待处理</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />建议</span>
            </div>
          </div>

          {/* 僵尸申请专项处置横幅 */}
          {pendingStats.zombie > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-red-700 dark:text-red-300">
                      🔴 严重警告：{pendingStats.zombiePartners} 项入驻申请超时超过 30 天
                    </span>
                    <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900 px-2 py-0.5 rounded-full">
                      流程卡死
                    </span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                    这些申请已等待超 30 天未处理，可能为僵尸数据或流程卡死，会占用待办列表空间、影响业务健康度评分。建议立即处置。
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                      onClick={() => onViewChange('partners')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      批量驳回僵尸申请
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 text-xs font-medium rounded-lg border border-red-200 dark:border-red-700 transition-colors"
                      onClick={() => onViewChange('partners')}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      催办/转交
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 待办分类统计 */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            <Card
              hover
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => onViewChange('partners')}
            >
              <CardContent className="p-3 text-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-xl font-bold text-amber-600">{pendingStats.partnerApproval}</div>
                <div className="text-[10px] text-neutral-400">待审批入驻</div>
              </CardContent>
            </Card>

            <Card
              hover
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => onViewChange('deals')}
            >
              <CardContent className="p-3 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-blue-600">{pendingStats.dealApproval}</div>
                <div className="text-[10px] text-neutral-400">待审批商机</div>
              </CardContent>
            </Card>

            <Card
              hover
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => onViewChange('marketing')}
            >
              <CardContent className="p-3 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                  <Gift className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-xl font-bold text-emerald-600">{pendingStats.incentiveApproval}</div>
                <div className="text-[10px] text-neutral-400">待审批激励</div>
              </CardContent>
            </Card>

            <Card
              hover
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => onViewChange('partners')}
            >
              <CardContent className="p-3 text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-xl font-bold text-red-600">{pendingStats.partnerAction}</div>
                <div className="text-[10px] text-neutral-400">零产出伙伴</div>
              </CardContent>
            </Card>

            <Card
              hover
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => onViewChange('deals')}
            >
              <CardContent className="p-3 text-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-xl font-bold text-purple-600">{pendingStats.dealAction}</div>
                <div className="text-[10px] text-neutral-400">活跃商机</div>
              </CardContent>
            </Card>
          </div>

          {/* 待办事项详细列表（首屏折叠：默认展示前5项高优先级） */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                <CardTitle className="text-sm">待办清单</CardTitle>
                <span className="text-[10px] text-neutral-400">按优先级排序，critical 优先处理</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allPendingItems.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm',
                      item.priority === 'critical'
                        ? 'bg-red-50/80 dark:bg-red-950/30 border-red-300 dark:border-red-700 hover:border-red-400 shadow-sm shadow-red-100 dark:shadow-red-900/20'
                        : item.priority === 'high'
                        ? 'bg-red-50/70 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:border-red-300'
                        : item.priority === 'medium'
                        ? 'bg-amber-50/70 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 hover:border-amber-300'
                        : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 hover:border-blue-300'
                    )}
                    onClick={() => onViewChange(item.target)}
                  >
                    <div className={cn(
                      'mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                      item.priority === 'critical' ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-200 dark:shadow-red-800' :
                      item.priority === 'high' ? 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-200' :
                      item.priority === 'medium' ? 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-200' :
                      'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                    )}>
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {item.priority === 'critical' && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 px-1.5 py-0.5 rounded animate-pulse">
                            <AlertOctagon className="w-3 h-3" />
                            超期 {item.overdueDays} 天
                          </span>
                        )}
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded',
                          item.priority === 'critical' ? 'bg-red-200 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                          item.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                          item.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        )}>
                          {item.type === 'partner_approval' ? '入驻审批' :
                           item.type === 'deal_approval' ? '商机审批' :
                           item.type === 'incentive_approval' ? '激励审批' :
                           item.type === 'partner_action' ? '伙伴激活' :
                           '商机跟进'}
                        </span>
                        <span className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {item.description}
                        {item.priority === 'critical' && item.overdueDays && (
                          <span className="ml-1 text-red-500 font-semibold">⚠️ {item.overdueDays} 天未处理</span>
                        )}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-neutral-300 mt-1 shrink-0" />
                  </div>
                ))}
              </div>

              {/* 折叠/展开控制 */}
              {pendingStats.total > 5 && (
                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-neutral-500 hover:text-brand transition-colors"
                    onClick={() => {}}
                  >
                    {false ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        收起列表
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        还有 {pendingStats.total - 5} 项待处理，点击展开查看
                      </>
                    )}
                  </button>
                  <div className="text-center">
                    <Button variant="outline" size="sm" onClick={() => onViewChange('partners')}>
                      在伙伴中心处理全部 {pendingStats.total} 项待办
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {pendingStats.total === 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
              太棒了！所有待办已处理完毕
            </h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              伙伴管理状态健康，继续保持
            </p>
          </CardContent>
        </Card>
      )}

      {/* ===== 第三部分：行业动态 ===== */}
      <section>
        <SectionHeader title="行业动态" subtitle="行业报告 · 市场趋势 · 竞品动态" />
        {!noDataAvailable && <NewsHotList />}
      </section>

      {/* 详情弹窗（点击各维度卡片查看） */}
      <Modal
        open={!!showDetailModal}
        onClose={() => setShowDetailModal(null)}
        title={showDetailModal?.title || '详情'}
        description={showDetailModal?.subtitle || ''}
        size="lg"
      >
        {showDetailModal && showDetailModal.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  {showDetailModal.columns.map((col) => (
                    <th key={col.key} className="px-3 py-2 text-left text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {showDetailModal.rows.map((row, idx) => (
                  <tr key={idx} className={cn(idx % 2 === 0 ? 'bg-neutral-50/50 dark:bg-neutral-900/30' : 'bg-white dark:bg-neutral-900', 'hover:bg-cyan-50/40 dark:hover:bg-cyan-900/20 transition-colors')}>
                    {showDetailModal.columns.map((col) => {
                      const value = row[col.key];
                      let displayValue: React.ReactNode = value;
                      if (col.type === 'currency') {
                        displayValue = formatCurrency(Number(value || 0), currency);
                      } else if (col.type === 'percent') {
                        const v = Number(value || 0);
                        const colorClass = v >= 80 ? 'text-emerald-600' : v >= 60 ? 'text-amber-600' : v >= 30 ? 'text-red-500' : 'text-neutral-500';
                        displayValue = <span className={cn('font-bold', colorClass)}>{Math.round(v)}%</span>;
                      } else if (col.type === 'count') {
                        displayValue = <span className="font-medium text-neutral-700 dark:text-neutral-300">{value} 单</span>;
                      }
                      return (
                        <td key={col.key} className="px-3 py-2 text-[12px] text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400 text-sm">
            暂无数据
          </div>
        )}
      </Modal>

      {/* 业绩加速包弹窗 */}
      <Modal 
        open={showAccelerationModal} 
        onClose={() => setShowAccelerationModal(false)}
        title="业绩加速包"
        description="根据当前业绩诊断，自动生成的加速建议"
        size="lg"
      >
        <div className="space-y-4">
          {/* 诊断摘要 */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">诊断结果</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400">
              本季达成率落后时间进度 {timeProgress - Math.round(revenue?.achievements?.quarterly?.rate ?? 0)}%，需立即采取加速措施。
            </p>
          </div>

          {/* 推荐动作 */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-neutral-500">推荐动作清单</div>
            
            {[
              {
                icon: Users,
                title: '激活沉睡伙伴',
                desc: `检测到 ${partners.filter((p: any) => {
                  const pDeals = allDeals.filter((d: any) => d.partner_id === p.id);
                  return pDeals.length === 0 || (new Date().getTime() - new Date(p.updated_at || 0).getTime()) > 60 * 24 * 60 * 60 * 1000;
                }).length} 个沉睡伙伴，建议一键下发"季度末冲刺激励"`,
                action: '下发激励',
                actionType: 'incentives'
              },
              {
                icon: Target,
                title: '补充线索缺口',
                desc: `当前管线覆盖不足，建议从公海池划拨高质量线索`,
                action: '查看线索',
                actionType: 'leads'
              },
              {
                icon: TrendingUp,
                title: '加速大单推进',
                desc: `有 ${allDeals.filter((d: any) => !['ClosedLost', 'ClosedWon'].includes(d.stage || '') && Number(d.value || 0) > 500000).length} 个大单处于停滞风险，需重点跟进`,
                action: '查看大单',
                actionType: 'deals'
              },
              {
                icon: BarChart3,
                title: '区域业绩拉齐',
                desc: `${(revenue?.dimensional_achievements?.find(d => d.type === 'region')?.data || []).slice(-1)[0]?.name || '部分区域'}拖后腿，建议安排区域专项支持`,
                action: '查看区域',
                actionType: 'region'
              }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-900 dark:text-white">{item.title}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.desc}</div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    onViewChange(item.actionType);
                    setShowAccelerationModal(false);
                  }}
                  className="shrink-0"
                >
                  {item.action}
                </Button>
              </div>
            ))}
          </div>

          {/* 底部操作 */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="text-xs text-neutral-400">
              诊断时间：{new Date().toLocaleString('zh-CN')}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAccelerationModal(false)}
            >
              关闭
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const NewsHotList = () => {
  const [news, setNews] = useState<MarketNews[]>(defaultNewsFallback());
  const [keyword, setKeyword] = useState('');
  const [source, setSource] = useState<string>('fallback');
  const [fetchDate, setFetchDate] = useState<string>(new Date().toLocaleString('zh-CN'));
  const [loading, setLoading] = useState(false);

  // 初次加载：尝试拉取实时新闻
  useEffect(() => {
    const load = async () => {
      try {
        const result = await getNews({ limit: 30, fallback: defaultNewsFallback() });
        setNews(result.items);
        setSource(result.source);
        setFetchDate(new Date(result.fetched_at).toLocaleString('zh-CN'));
      } catch (e) {
        // 失败时保留 fallback
      }
    };
    load();
  }, []);

  // 按关键词过滤
  const filteredNews = useMemo(() => {
    if (!keyword.trim()) return news;
    const kw = keyword.trim().toLowerCase();
    return news.filter(n =>
      n.title.toLowerCase().includes(kw) ||
      n.source.toLowerCase().includes(kw) ||
      n.category.toLowerCase().includes(kw) ||
      (n.summary || '').toLowerCase().includes(kw)
    );
  }, [news, keyword]);

  // 智能日期格式化
  const formatDate = (iso: string) => {
    const today = new Date();
    const d = new Date(iso);
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays <= 7) return `${diffDays}天前`;
    return `${d.getMonth() + 1}-${d.getDate()}`;
  };

  const sourceLabel = source === 'live' ? '实时拉取' : source === 'cache' ? '1小时内缓存' : source === 'supabase' ? '数据库存储' : '精选样本';

  const handleRefresh = async () => {
    setLoading(true);
    clearNewsCache();
    try {
      const result = await getNews({ limit: 30, forceRefresh: true, fallback: defaultNewsFallback() });
      setNews(result.items);
      setSource(result.source);
      setFetchDate(new Date(result.fetched_at).toLocaleString('zh-CN'));
    } catch (e) {
      setNews(defaultNewsFallback());
      setSource('fallback');
      setFetchDate(new Date().toLocaleString('zh-CN'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className="w-4 h-4 text-neutral-400" />
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">国际企业级IT动态</h2>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${source === 'live' ? 'animate-pulse' : ''}`} />
          {sourceLabel}
        </span>
        <span className="text-[10px] text-neutral-400 ml-2">共 {news.length} 条 · 更新于 {fetchDate.split(',')[0]}</span>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="ml-auto flex items-center gap-1 text-[10px] text-neutral-500 hover:text-brand transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '拉取中...' : '刷新'}
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索标题/来源/分类/摘要（如：AWS, AI, 数据库, 安全, Kubernetes）"
          className="w-full pl-9 pr-9 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
        />
        {keyword && (
          <button
            onClick={() => setKeyword('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {keyword && (
        <div className="mb-2 text-[10px] text-neutral-500">
          找到 <span className="font-semibold text-brand">{filteredNews.length}</span> 条匹配 "{keyword}" 的新闻
        </div>
      )}

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filteredNews.length > 0 ? (
          filteredNews.map((item, i) => (
            <a
              key={item.url + i}
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
            >
              <span className="text-[10px] text-neutral-300 w-5 shrink-0 text-right mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                    {item.category}
                  </span>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200 truncate group-hover:text-brand transition-colors">
                    {item.title}
                  </span>
                </div>
                {item.summary && (
                  <p className="text-[10px] text-neutral-400 line-clamp-2 mb-1">{item.summary}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>{formatDate(item.published_at)}</span>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-neutral-300 group-hover:text-brand transition-colors shrink-0 mt-1" />
            </a>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-neutral-400">
            <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <div>没有找到匹配 "{keyword}" 的行业动态</div>
            <button onClick={() => setKeyword('')} className="mt-2 text-[10px] text-brand hover:underline">清除搜索</button>
          </div>
        )}
      </div>
    </div>
  );
};
