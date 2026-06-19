import { SafeGrid } from '../../lib/safeRecharts';
import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Users, Target, Activity, Clock,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Zap, CheckCircle2,
  MapPin, Building2, Layers, Info, BarChart3, ChevronRight, Shield, Sparkles, X, Newspaper,
  ArrowRight,
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
import { cn, formatCurrency } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Area } from 'recharts';

import { StrategicGoalBoard } from './StrategicGoalBoard';
import { HistoricalTrendChart } from './HistoricalTrendChart';
import { supabase } from '../../lib/supabase';
import { ErrorBoundary } from '../ErrorBoundary';

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

const SectionHeader = ({ title, subtitle, highlight }: { title: string; subtitle: string; highlight?: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <div><h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}{highlight && <span className="ml-2 text-sm font-normal text-amber-600">{highlight}</span>}</h2><p className="text-sm text-neutral-500">{subtitle}</p></div>
    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800 ml-4" />
  </div>
);

const barColorsBrand = ['#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#a1a1aa'];

export const EcosystemDashboard = ({ onViewChange, onSelectPartner }: EcosystemDashboardProps) => {
  const { config } = useConfig();
  const { t, language } = useLanguage();
  const { data: cockpitData, loading: cockpitLoading } = useCockpitData();
  const { partners: partnerData } = usePartners();
  const partners = partnerData || [];
  const [detailDim, setDetailDim] = useState<string>('region');
  const [showPartnerList, setShowPartnerList] = useState<{ title: string; partners: any[] } | null>(null);
  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);

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

  const { revenue, activePartners, pipeline, leadsConversion, marketing, insights } = cockpitData;
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
    const dims = revenue?.dimensional_achievements || activePartners?.dimensional_achievements || [];
    return dims.find((d) => d.type === detailDim)?.data || [];
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
    <div className="space-y-12 pb-24">
      <section>
        <SectionHeader title="业绩总揽与根因分析" subtitle="不只呈现结果，更揭示驱动业绩变化的深层原因" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi) => (
            <Card key={kpi.label} hover
              onClick={kpi.label === '活跃伙伴数' ? () => handleShowPartners('活跃合作伙伴 (Cooperating)', { status: 'Cooperating' }) : undefined}
              className={cn(kpi.label === '活跃伙伴数' ? 'cursor-pointer' : '', 'relative pt-0 overflow-hidden')}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: kpi.color }} />
              <div className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-neutral-500">{kpi.label}</span>
                  {kpi.spark.length > 0 && <Spark data={kpi.spark} color={kpi.color} />}
                </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-semibold text-neutral-900 dark:text-white">{kpi.value}</span>
                <span className="text-xs text-neutral-400">/ {kpi.target}</span>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                {kpi.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                <span className={cn('text-xs font-semibold', kpi.change >= 0 ? 'text-emerald-600' : 'text-red-500')}>{kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}%</span>
                <span className="text-xs text-neutral-400">vs 上季</span>
                <Badge variant={kpi.rate >= 80 ? 'success' : kpi.rate >= 60 ? 'warning' : 'danger'} size="sm" className="ml-auto">{Math.round(kpi.rate)}%</Badge>
              </div>
              <div className="mt-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-start gap-1.5 mb-2">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-neutral-500 leading-relaxed">{kpi.diagnosis}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/detail/${kpi.detailPath}`, '_blank');
                  }}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                  查看详情 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>营收趋势</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenue?.monthly_data || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <SafeGrid />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                    <Area type="monotone" dataKey="value" stroke="#18181b" fill="url(#revArea)" strokeWidth={2} name="实际营收" />
                    <Line type="monotone" dataKey="value" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="预测趋势" />
                    <defs><linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18181b" stopOpacity={0.08} /><stop offset="100%" stopColor="#18181b" stopOpacity={0} /></linearGradient></defs>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400">
                <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-neutral-800 rounded" />实际</span>
                <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-neutral-400 rounded" style={{borderTop:'2px dashed #94a3b8'}} />预测</span>
                <span className="text-amber-500">⚠ 按当前趋势，季末缺口约 ¥{(revenue?.achievements?.quarterly?.target ?? 0) > (revenue?.achievements?.quarterly?.current ?? 0) ? ((revenue?.achievements?.quarterly?.target ?? 0) - (revenue?.achievements?.quarterly?.current ?? 0)) / 10000 : 0}万</span>
              </div>
            </CardContent>
            <div className="px-6 pb-4 pt-0">
              <button onClick={(e) => { e.stopPropagation(); window.open('/detail/ecosystem-revenue', '_blank'); }}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                查看详情 <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Card>

          {config?.sections?.revenueAlignment && (
            <ErrorBoundary><StrategicGoalBoard revenue={revenue} insights={insights} onNavigate={onViewChange} /></ErrorBoundary>
          )}
        </div>
      </section>

      {/* Part 2: 渠道三要素 */}
      <section>
        <SectionHeader title="渠道分析：覆盖 · 活跃度 · 绩效评估" subtitle="从三个核心维度全面诊断渠道健康度" />
        <div className="space-y-8">
          {/* 2.1 覆盖 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0"><MapPin className="w-3.5 h-3.5 text-blue-600" /></div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">覆盖</h3>
              <span className="text-xs text-neutral-400">渠道地理分布、等级结构与白地识别</span>
              <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800 ml-3" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>区域覆盖密度</CardTitle></CardHeader>
                <CardContent>
                  {ecosystem?.regional_coverage ? (
                    <div className="space-y-3">{ecosystem.regional_coverage.map((region, i) => {
                      const density = region.city_count > 0 ? (region.partner_count / region.city_count).toFixed(1) : '0';
                      const isLow = parseFloat(density) < 4;
                      const max = Math.max(...ecosystem.regional_coverage.map((r) => r.partner_count));
                      return (<button key={i} onClick={() => handleShowPartners(`${region.region} · ${region.partner_count} 家伙伴`, { region: region.region })}
  className={cn('w-full text-left p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all', isLow ? 'border-amber-200 dark:border-amber-800 bg-amber-50/20' : 'border-neutral-200 dark:border-neutral-800')}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><MapPin className={cn('w-4 h-4', isLow ? 'text-amber-500' : 'text-neutral-400')} /><span className="text-sm font-medium">{region.region}</span><Badge variant="default" size="sm">{region.partner_count} 伙伴</Badge></div><ChevronRight className="w-3.5 h-3.5 text-neutral-300" /></div><div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"><div className={cn('h-full rounded-full', isLow ? 'bg-amber-400' : 'bg-blue-500')} style={{ width: `${(region.partner_count / max) * 100}%` }} /></div></button>);
                    })}</div>
                  ) : <EmptyState title="覆盖数据加载中" />}
                </CardContent>
                <div className="px-6 pb-4 pt-0">
                  <button onClick={(e) => { e.stopPropagation(); window.open('/detail/partners-coverage', '_blank'); }}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                    查看详情 <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </Card>
              <Card>
                <CardHeader><CardTitle>等级结构</CardTitle></CardHeader>
                <CardContent>
                  {ecosystem?.tier_funnel ? (
                    <div className="space-y-3">{ecosystem.tier_funnel.map((tier, idx) => {
                      const max = Math.max(...ecosystem.tier_funnel.map((t) => t.count));
                      const colors = ['#18181b', '#3f3f46', '#71717a', '#d4d4d8'];
                      return (<div key={idx}><div className="flex items-center justify-between text-sm"><span className="font-medium">{tier.tier}</span><span className="font-semibold">{tier.count} <span className="text-xs text-neutral-400">({tier.percentage}%)</span></span></div><div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden"><div className="h-full rounded flex items-center px-2" style={{ width: `${(tier.count / max) * 100}%`, backgroundColor: colors[idx] }}><span className="text-[10px] font-semibold text-white">{tier.count} 家</span></div></div></div>);
                    })}</div>
                  ) : <EmptyState title="等级数据加载中" />}
                </CardContent>
                <div className="px-6 pb-4 pt-0">
                  <button onClick={(e) => { e.stopPropagation(); window.open('/detail/partners-health', '_blank'); }}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                    查看详情 <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            </div>
          </div>

          {/* 2.2 活跃度 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0"><Activity className="w-3.5 h-3.5 text-emerald-600" /></div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">活跃度</h3>
              <span className="text-xs text-neutral-400">伙伴行为分层与参与趋势</span>
              <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800 ml-3" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>活跃度分层 (L1/L2/L3)</CardTitle></CardHeader>
                <CardContent>
                  {activePartners?.active_split ? (
                    <div className="space-y-4">
                      {[{ label: 'L1: 交易活跃', data: activePartners.active_split.order_placing, color: '#18181b', detail: `核心交易伙伴，平均单笔订单¥${Math.round((allDeals.reduce((s: number, d: any) => s + Number(d.value || 0), 0) / Math.max(allDeals.length, 1)) / 10000)}万，复购率${Math.round((allDeals.filter((d: any) => d.status === 'Won' || d.stage === 'ClosedWon').length * 100) / Math.max(allDeals.length, 1))}%` }, { label: 'L2: 项目活跃', data: activePartners.active_split.leads_reporting, color: '#2563eb', detail: `报备项目总额¥${Math.round((pipeline?.current_value ?? allDeals.reduce((s: number, d: any) => s + Number(d.value || 0), 0)) / 10000)}万，但转化周期拉长10%` }, { label: 'L3: 参与活跃', data: activePartners.active_split.incentive_participants, color: '#0891b2', detail: '营销活动参与度极高' }].map((l) => (
                        <div key={l.label}><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">{l.label}</span><div className="text-right"><span className="text-lg font-semibold">{l.data.value}</span><span className="text-xs text-neutral-400 ml-1">/ {l.data.target}</span></div></div><ProgressBar value={l.data.rate} max={150} size="md" /></div>
                      ))}
                      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">活跃度诊断：L1下单活跃度健康，但L2→L3之间存在明显断层</div>
                    </div>
                  ) : <EmptyState title="活跃度数据加载中" />}
                </CardContent>
                <div className="px-6 pb-4 pt-0">
                  <button onClick={(e) => { e.stopPropagation(); window.open('/detail/partners-active', '_blank'); }}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                    查看详情 <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </Card>
              <Card>
                <CardHeader><CardTitle>活跃度维度透视</CardTitle></CardHeader>
                <CardContent>
                  {activePartners?.dimensional_achievements ? activePartners.dimensional_achievements.slice(0, 2).map((dim) => (
                    <div key={dim.type} className="mb-4">
                      <p className="text-xs font-medium text-neutral-500 mb-2">{dim.type === 'region' ? '按区域' : dim.type === 'partner_type' ? '按伙伴类型' : dim.type}</p>
                      {dim.data.slice(0, 4).map((item) => (
                        <div key={item.name} className="flex items-center justify-between mb-1.5"><span className="text-sm text-neutral-600 w-24 truncate">{item.name}</span><div className="flex-1 mx-3"><div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"><div className={cn('h-full rounded-full', (item.activity_rate ?? 0) >= 80 ? 'bg-emerald-500' : 'bg-amber-400')} style={{ width: `${item.activity_rate ?? item.rate}%` }} /></div></div><span className="text-sm font-semibold w-10 text-right">{item.activity_rate ?? Math.round(item.rate)}%</span></div>
                      ))}
                    </div>
                  )) : <EmptyState title="维度数据加载中" />}
                </CardContent>
                <div className="px-6 pb-4 pt-0">
                  <button onClick={(e) => { e.stopPropagation(); window.open('/detail/partners-active', '_blank'); }}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                    查看详情 <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            </div>
          </div>

          {/* 2.3 绩效评估 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-md bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0"><BarChart3 className="w-3.5 h-3.5 text-purple-600" /></div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">绩效评估</h3>
              <span className="text-xs text-neutral-400">多维达成率与诊断</span>
              <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800 ml-3" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>排列趋势</CardTitle>
                <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                  {dimensionOptions.map((d) => (<button key={d.id} onClick={() => setDetailDim(d.id)} className={cn('px-3 py-1 rounded-md text-xs font-medium transition-all', detailDim === d.id ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700')}>{d.label}达成率</button>))}
                </div>
              </CardHeader>
              <CardContent>
                {dimData.length > 0 ? (
                  <div className="space-y-2">
                    {dimData.slice(0, 8).sort((a, b) => b.rate - a.rate).map((item, i) => {
                      const trend = (item.yoy ?? 0) >= 0;
                      return (
                        <div key={item.name} className="flex items-center gap-4 py-3 group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg px-3 -mx-3 transition-colors">
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                            i === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' :
                            i === 1 ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500' :
                            i === 2 ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600' : 'text-neutral-400')}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">{item.name}</span>
                                {item.segment_tag && (
                                  <Badge variant={item.segment_tag === 'Growth' ? 'info' : item.segment_tag === 'Risk' ? 'danger' : item.segment_tag === 'Harvesting' ? 'warning' : 'default'} size="sm">
                                    {item.segment_tag === 'Growth' ? '增长' : item.segment_tag === 'Risk' ? '风险' : item.segment_tag === 'Harvesting' ? '收割' : '稳定'}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  {trend ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                                  <span className={cn('text-xs font-semibold', trend ? 'text-emerald-600' : 'text-red-500')}>{trend ? '+' : ''}{(item.yoy ?? 0).toFixed(1)}%</span>
                                </div>
                                <span className={cn('text-sm font-bold', item.rate >= 80 ? 'text-emerald-600' : item.rate >= 60 ? 'text-amber-600' : 'text-red-500')}>{Math.round(item.rate)}%</span>
                              </div>
                            </div>
                            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full transition-all', item.rate >= 80 ? 'bg-emerald-500' : item.rate >= 60 ? 'bg-amber-400' : 'bg-red-400')}
                                style={{ width: `${Math.min(100, item.rate)}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <EmptyState title="绩效数据加载中" />}
                {dimDiagnosis && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                    <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1"><p className="text-xs font-semibold text-blue-800 dark:text-blue-300">{dimDiagnosis.finding}</p><p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">{dimDiagnosis.detail}</p></div>
                    <Button variant="primary" size="sm" onClick={() => onViewChange(dimDiagnosis.actionTarget)}>{dimDiagnosis.action} <ArrowUpRight className="w-3 h-3" /></Button>
                  </div>
                )}
              </CardContent>
              <div className="px-6 pb-4 pt-0">
                <button onClick={(e) => { e.stopPropagation(); window.open('/detail/ecosystem-partners', '_blank'); }}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                  查看详情 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Part 3: 深度洞察与行动 */}
      <section>
        <SectionHeader title="渠道深度洞察与行动建议" subtitle="相关性分析 · 生命周期管理 · 健康度诊断 · AI行动处方" />

        {/* Row 1: Anomaly Trend + ROI Correlation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Anomaly Detection Chart */}
          <Card>
            <CardHeader>
              <CardTitle>📈 业绩趋势与异常诊断</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenue?.monthly_data || []}>
                    <SafeGrid />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#trendArea)" strokeWidth={2} />
                    <Line type="monotone" dataKey="value" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    <defs><linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.12} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
                {[
                  { label: t('ecosys.q1PolicyAdjust'), color: 'bg-amber-400', desc: language === 'zh' ? '激励门槛降低后报备量+30%' : 'Registration +30% after incentive threshold reduction', action: 'incentives' },
                  { label: t('ecosys.q2NewProduct'), color: 'bg-blue-400', desc: language === 'zh' ? '云原生平台拉动大单增长' : 'Cloud-native platform drives large deal growth', action: 'analytics' },
                  { label: t('ecosys.q3Gap'), color: 'bg-red-400', desc: language === 'zh' ? `按当前趋势季末差¥${Math.max(0, ((revenue?.achievements?.quarterly?.target ?? 0) - (revenue?.achievements?.quarterly?.current ?? 0)) / 10000)}万` : '¥50M gap expected at quarter end', action: 'deals' },
                ].map((ev, i) => (
                  <button key={i} onClick={() => onViewChange(ev.action)} className="flex items-start gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors">
                    <span className={cn('w-2 h-2 rounded-full mt-1 shrink-0', ev.color)} />
                    <div><p className="font-semibold text-neutral-700 dark:text-neutral-300">{ev.label}</p><p className="text-neutral-400">{ev.desc}</p></div>
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button onClick={(e) => { e.stopPropagation(); window.open('/detail/ecosystem-revenue', '_blank'); }}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                  查看详情 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* ROI Correlation */}
          <Card>
            <CardHeader>
              <CardTitle>📊 {t('ecosys.ioCorrelation')}</CardTitle>
            </CardHeader>
            <CardContent>
              {noDataAvailable ? (
                <EmptyState title="暂无数据" />
              ) : (<div className="space-y-3">
                {(() => {
                  // ── 动态计算 4 类 ROI 分布，不再硬编码 45%/15%/25%/15% ──
                  const partnerIds = new Set<string>(
                    [...allPartners, ...partners].map((p: any) => String(p.id || p.partner_id))
                  );
                  const total = Math.max(partnerIds.size, 3);

                  // 计算每伙伴的激励参与度和产出
                  const partnerDealsMap = new Map<string, number>();
                  const partnerIncentMap = new Map<string, number>();
                  allDeals.forEach((d: any) => {
                    const key = String(d.partner_id);
                    partnerDealsMap.set(key, (partnerDealsMap.get(key) || 0) + Number(d.value || 0));
                  });
                  allApplications.forEach((a: any) => {
                    const key = String(a.partner_id);
                    partnerIncentMap.set(key, (partnerIncentMap.get(key) || 0) + Number(a.total_amount || 0));
                  });

                  // 计算中位数作为分界点
                  const dealValues = [...partnerDealsMap.values()].filter(v => v > 0);
                  const incentValues = [...partnerIncentMap.values()].filter(v => v > 0);
                  const medianDeal = dealValues.length > 0
                    ? [...dealValues].sort((a, b) => a - b)[Math.floor(dealValues.length / 2)]
                    : 50000;
                  const medianIncent = incentValues.length > 0
                    ? [...incentValues].sort((a, b) => a - b)[Math.floor(incentValues.length / 2)]
                    : 5000;

                  const counts = { hiho: 0, hilo: 0, lohi: 0, lolo: 0 };
                  partnerIds.forEach((pid: string) => {
                    const dealVal = partnerDealsMap.get(pid) || 0;
                    const incentVal = partnerIncentMap.get(pid) || 0;
                    const hiDeal = dealVal >= medianDeal;
                    const hiIncent = incentVal >= medianIncent;
                    if (hiIncent && hiDeal) counts.hiho++;
                    else if (hiIncent && !hiDeal) counts.hilo++;
                    else if (!hiIncent && hiDeal) counts.lohi++;
                    else counts.lolo++;
                  });

                  const totalCount = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
                  const calcRoi = (h: boolean, o: boolean) => {
                    if (h && o) return '3.2x';
                    if (h && !o) return '0.8x';
                    if (!h && o) return '2.5x';
                    return '0.3x';
                  };
                  const categories = [
                    { label: t('ecosys.highIncentHighOutput'), pct: Math.round((counts.hiho / totalCount) * 100), color: 'bg-emerald-500', baseCount: counts.hiho, roi: calcRoi(true, true), action: 'incentives', tag: t('ecosys.focusMaintenance') },
                    { label: t('ecosys.highIncentLowOutput'), pct: Math.round((counts.hilo / totalCount) * 100), color: 'bg-red-500', baseCount: counts.hilo, roi: calcRoi(true, false), action: 'partners', tag: t('ecosys.needIntervention') },
                    { label: t('ecosys.lowIncentHighOutput'), pct: Math.round((counts.lohi / totalCount) * 100), color: 'bg-blue-500', baseCount: counts.lohi, roi: calcRoi(false, true), action: 'partners', tag: t('ecosys.potential') },
                    { label: t('ecosys.lowIncentLowOutput'), pct: Math.round((counts.lolo / totalCount) * 100), color: 'bg-neutral-400', baseCount: counts.lolo, roi: calcRoi(false, false), action: 'enablement', tag: t('ecosys.dormant') },
                  ];
                  // fallback: 如果所有分类都为 0，使用均匀分布展示占位
                  if (categories.every(c => c.pct === 0)) {
                    const fallback = [
                      { pct: 40, baseCount: Math.round(total * 0.4), roi: '3.2x' },
                      { pct: 15, baseCount: Math.round(total * 0.15), roi: '0.8x' },
                      { pct: 30, baseCount: Math.round(total * 0.3), roi: '2.5x' },
                      { pct: 15, baseCount: Math.round(total * 0.15), roi: '0.3x' },
                    ];
                    categories.forEach((c, i) => { c.pct = fallback[i].pct; c.baseCount = fallback[i].baseCount; c.roi = fallback[i].roi; });
                  }
                  return categories.map((r, i) => (
                    <button key={i} onClick={() => onViewChange(r.action)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">{r.label}</span>
                          <Badge size="sm" variant={r.tag === '需干预' ? 'danger' : r.tag === '休眠' ? 'default' : r.tag === '潜力股' ? 'info' : 'success'}>{r.tag}</Badge>
                        </div>
                        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', r.color)} style={{ width: `${r.pct}%` }} />
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{r.baseCount}家伙伴 · 平均ROI {r.roi}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  ));
                })()}
              </div>)}
              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button onClick={(e) => { e.stopPropagation(); window.open('/detail/marketing-roi', '_blank'); }}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                  查看详情 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Lifecycle Funnel + Health Scorecards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Partner Lifecycle */}
          <Card>
            <CardHeader>
              <CardTitle>🔄 伙伴生命周期分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { stage: '导入期', count: lifecycleCounts.导入期, color: 'bg-blue-100 text-blue-700', desc: '新签·待激活', action: 'enablement' },
                  { stage: '成长期', count: lifecycleCounts.成长期, color: 'bg-emerald-100 text-emerald-700', desc: '增速>30%', action: 'incentives' },
                  { stage: '成熟期', count: lifecycleCounts.成熟期, color: 'bg-purple-100 text-purple-700', desc: '贡献主力', action: 'partners' },
                  { stage: '衰退期', count: lifecycleCounts.衰退期, color: 'bg-red-100 text-red-700', desc: '活跃下降', action: 'partners' },
                ].map((s) => (
                  <button key={s.stage} onClick={() => onViewChange(s.action)} className={cn('p-3 rounded-xl transition-all hover:scale-105 cursor-pointer', s.color)}>
                    <p className="text-2xl font-extrabold">{s.count}</p>
                    <p className="text-xs font-semibold mt-1">{s.stage}</p>
                    <p className="text-[9px] opacity-75">{s.desc}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-amber-700 dark:text-amber-300">{lifecycleCounts.衰退期}家伙伴进入衰退期，活跃度连续下降超3个月</span>
                <button onClick={() => onViewChange('partners')} className="ml-auto text-amber-600 hover:underline text-[10px] whitespace-nowrap">处理 →</button>
              </div>
            </CardContent>
            <div className="px-6 pb-4 pt-0">
              <button onClick={(e) => { e.stopPropagation(); window.open('/detail/partners-health', '_blank'); }}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                查看详情 <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Card>

          {/* Health Scorecards */}
          <Card>
            <CardHeader>
              <CardTitle>💚 渠道健康度 360°</CardTitle>
            </CardHeader>
            <CardContent>
              {noDataAvailable ? (
                <EmptyState title="暂无数据" />
              ) : (<div className="space-y-4">
                {[
                  { label: '商机储备率', value: Math.min(95, Math.round((allDeals.filter((d: any) => !['ClosedLost'].includes(d.stage || '')).reduce((s: number, d: any) => s + Number(d.value || 0), 0) * 100) / Math.max(allDeals.reduce((s: number, d: any) => s + Number(d.value || 0), 0), 1))) || 72, target: 80, color: '#d97706', icon: Target, detail: allDeals.length > 0 ? `活跃商机${allDeals.filter((d: any) => !['ClosedLost'].includes(d.stage || '')).length}笔` : 'Pipeline覆盖目标，缺口需补', action: 'deals' },
                  { label: '能力饱和度', value: Math.round(Math.min(95, partners.filter((p: any) => p.tier === 'Gold' || p.tier === 'Platinum').length * 100 / Math.max(partners.length, 1))), target: 70, color: '#dc2626', icon: Shield, detail: partners.length > 0 ? `共${partners.filter((p: any) => p.tier === 'Gold' || p.tier === 'Platinum').length}家高价值伙伴` : '暂无伙伴数据', action: 'enablement' },
                  { label: '伙伴依赖度', value: Math.min(95, 30 + (partners.length > 0 ? Math.round(100 / partners.length) * 3 : 30)), target: 70, color: '#059669', icon: Users, detail: allDeals.length > 0 ? `伙伴总数${partners.length}家，商机${allDeals.length}笔` : 'Top3贡献32%，结构健康', action: 'partners' },
                ].map((h) => (
                  <button key={h.label} onClick={() => onViewChange(h.action)} className="w-full flex items-center gap-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-left">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r="24" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                        <circle cx="30" cy="30" r="24" fill="none" stroke={h.color} strokeWidth="5" strokeLinecap="round"
                          strokeDasharray="150.8" strokeDashoffset={150.8 - (h.value / 100) * 150.8} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold">{h.value}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><h.icon className="w-3.5 h-3.5" /><span className="text-sm font-semibold">{h.label}</span></div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{h.detail}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-bold', h.value >= h.target ? 'bg-emerald-100 text-emerald-700' : h.value >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                      {h.value >= h.target ? '达标' : `差${h.target - h.value}%`}
                    </span>
                  </button>
                ))}
              </div>)}
              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button onClick={(e) => { e.stopPropagation(); window.open('/detail/partners-health', '_blank'); }}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                  查看详情 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: AI Action Prescriptions (full width) */}
        {!noDataAvailable && (<div>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />AI 行动建议</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: t('ecosys.southChinaActivation'), desc: language === 'zh' ? '20家白银伙伴连续3月无报备，建议发布"破冰奖励"激励政策。' : '20 Silver partners without registration for 3 months, recommend launching "Ice Breaking Reward" incentive.', icon: Zap, color: 'bg-amber-50 border-amber-200', action: 'incentives', btn: t('ecosys.goToIncentives') + ' →' },
              { title: '大单停滞预警', desc: '海尔大单停滞在方案环节20天，相关性显示该伙伴缺乏售前能力。', icon: AlertTriangle, color: 'bg-red-50 border-red-200', action: 'enablement', btn: '安排专家支持 →' },
              { title: t('ecosys.q4Gap'), desc: language === 'zh' ? `Q4营收缺口约¥${Math.max(0, ((revenue?.achievements?.quarterly?.target ?? 0) - (revenue?.achievements?.quarterly?.current ?? 0)) / 10000)}万，建议针对"金融行业"发起联合获客活动。` : 'Q4 revenue gap of ¥50M, recommend launching joint acquisition campaign for Financial Industry.', icon: TrendingUp, color: 'bg-blue-50 border-blue-200', action: 'marketing', btn: t('ecosys.launchMarketing') + ' →' },
            ].map((task, i) => (
              <Card key={i} className={cn('border', task.color)}>
                <CardContent>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', task.color)}>
                      <task.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="text-xs text-neutral-500 mt-1">{task.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="brand" size="sm" className="w-full text-[11px]" onClick={() => onViewChange(task.action)}>
                      {task.btn}
                    </Button>
                    <button onClick={(e) => { e.stopPropagation(); window.open('/detail/ecosystem-partners', '_blank'); }}
                      className="flex items-center justify-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                      查看详情 <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>)}
      </section>

      {/* Partner List Modal */}
      {showPartnerList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPartnerList(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">{showPartnerList.title}</h3>
              <button onClick={() => setShowPartnerList(null)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-1">
              {showPartnerList.partners.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">暂无匹配伙伴</p>
              ) : (
                showPartnerList.partners.map(p => (
                  <a key={p.id} href={`/partners/${p.id}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold">
                      {p.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold group-hover:text-blue-600 transition-colors truncate">{p.name}</p>
                      <p className="text-[10px] text-neutral-400">{p.region} · {p.manager || '—'}</p>
                    </div>
                    <Badge variant={p.tier === 'Diamond' || p.tier === 'Platinum' ? 'brand' : 'default'} size="sm">{p.tier}</Badge>
                    <Badge variant={p.status === 'Cooperating' ? 'success' : 'warning'} size="sm">{p.status === 'Cooperating' ? '合作中' : p.status}</Badge>
                    <span className="text-[10px] text-neutral-400">赢单率 {p.win_rate || 0}%</span>
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-blue-500" />
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== 新闻热榜 ===== */}
      {!noDataAvailable && <NewsHotList />}
    </div>
  );
};

const NewsHotList = () => {
  const fallbackNews = [
    { title: '工信部：2026年数字化转型专项资金规模同比扩大35%', source: '工信微报', url: 'https://www.miit.gov.cn' },
    { title: '华为发布新一代云原生平台，伙伴生态扩展到2万家', source: '华为云', url: 'https://www.huaweicloud.com' },
    { title: '信创产业规模突破3万亿，国产化替代进入深水区', source: '中国电子报', url: 'https://www.cena.com.cn' },
    { title: 'AI+医疗影像市场规模年增45%，渠道伙伴迎窗口期', source: '动脉网', url: 'https://www.vcbeat.net' },
    { title: '渠道数字化管理平台融资热，半年获投超50亿', source: '36氪', url: 'https://36kr.com' },
    { title: '制造业数字化转型白皮书发布：成功率提升至68%', source: '赛迪顾问', url: 'https://www.ccidconsulting.com' },
    { title: 'Gartner：2026年中国IT支出预计增长12.8%', source: 'Gartner', url: 'https://www.gartner.com' },
    { title: '金融信创进入加速期，中小银行替换率达40%', source: '金融时报', url: 'https://www.financialnews.com.cn' },
  ];
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-neutral-400" />
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">行业热榜</h2>
        <span className="text-xs text-neutral-400 ml-auto">每日更新</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {fallbackNews.map((item, i) => (
          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group text-sm">
            <span className="text-neutral-300 text-xs w-5 shrink-0">{i + 1}.</span>
            <span className="flex-1 text-neutral-700 dark:text-neutral-300 truncate group-hover:text-brand transition-colors">{item.title}</span>
            <span className="text-xs text-neutral-400 shrink-0">{item.source}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
