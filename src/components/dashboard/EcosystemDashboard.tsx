import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Users, Target, Activity, Clock,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Zap, CheckCircle2,
  MapPin, Building2, Layers, Info, BarChart3,
} from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCockpitData } from '../../hooks/useData';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { EmptyState } from '../ui/EmptyState';
import { cn, formatCurrency } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Area } from 'recharts';

import { StrategicGoalBoard } from './StrategicGoalBoard';
import { HistoricalTrendChart } from './HistoricalTrendChart';
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

const SectionHeader = ({ number, title, subtitle, highlight }: { number: string; title: string; subtitle: string; highlight?: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <div className="w-9 h-9 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-white dark:text-neutral-900">{number}</span>
    </div>
    <div><h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}{highlight && <span className="ml-2 text-sm font-normal text-amber-600">{highlight}</span>}</h2><p className="text-sm text-neutral-500">{subtitle}</p></div>
    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800 ml-4" />
  </div>
);

const barColorsBrand = ['#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#a1a1aa'];

export const EcosystemDashboard = ({ onViewChange, onSelectPartner }: EcosystemDashboardProps) => {
  const { config } = useConfig();
  const { t } = useLanguage();
  const { data: cockpitData, loading: cockpitLoading } = useCockpitData();
  const [detailDim, setDetailDim] = useState<string>('region');

  const { revenue, activePartners, pipeline, leadsConversion, marketing, insights } = cockpitData;
  const ecosystem = activePartners?.partner_ecosystem_details;
  const revForces = revenue?.strategic_revenue?.forces;
  const pipelineOverview = pipeline?.reporting_overview;
  const currency = config?.currency || 'CNY';

  const kpis = useMemo(() => [
    { label: '季度营收', value: formatCurrency(revenue?.achievements?.quarterly?.current ?? 0, currency), target: formatCurrency(revenue?.achievements?.quarterly?.target ?? 0, currency), rate: revenue?.achievements?.quarterly?.rate ?? 0, change: revenue?.qoq ?? 0, spark: revenue?.monthly_data?.map((d) => d.value / 100000) ?? [], color: '#18181b', diagnosis: (revenue?.qoq ?? 0) >= 0 ? '华东区贡献42%增长，华南新伙伴发力明显' : '华北制造业需求放缓拖累整体，需重点关注' },
    { label: '活跃伙伴数', value: Math.round(activePartners?.current_value ?? 0).toLocaleString(), target: Math.round(activePartners?.achievements?.quarterly?.target ?? 0).toLocaleString(), rate: activePartners?.achievements?.quarterly?.rate ?? 0, change: activePartners?.qoq ?? 0, spark: activePartners?.monthly_data?.map((d) => Math.round(d.value)) ?? [], color: '#2563eb', diagnosis: activePartners?.active_split ? `下单率${Math.round(activePartners.active_split.order_placing.rate)}%，报备率${Math.round(activePartners.active_split.leads_reporting.rate)}%——报备活跃但下单转化有瓶颈` : '伙伴基数增长稳定，但活跃质量需提升' },
    { label: 'Pipeline 商机额', value: formatCurrency(pipeline?.current_value ?? 0, currency), target: formatCurrency(pipeline?.achievements?.quarterly?.target ?? 0, currency), rate: pipeline?.achievements?.quarterly?.rate ?? 0, change: pipeline?.qoq ?? 0, spark: pipeline?.monthly_data?.map((d) => d.value / 100000) ?? [], color: '#52525b', diagnosis: pipeline?.pipeline_batch ? `当季新增占${pipeline.pipeline_batch.new_in_q_ratio}%，历史积存${pipeline.pipeline_batch.historical_ratio}%——需警惕死单堆积` : '商机储备充裕，但转化周期在拉长' },
    { label: '线索转化率', value: `${(leadsConversion?.current_value ?? 0).toFixed(1)}%`, target: `${(leadsConversion?.achievements?.quarterly?.target ?? 0).toFixed(1)}%`, rate: leadsConversion?.achievements?.quarterly?.rate ?? 0, change: leadsConversion?.qoq ?? 0, spark: leadsConversion?.monthly_data?.map((d) => d.value) ?? [], color: '#a1a1aa', diagnosis: leadsConversion?.conversion_details ? `转化周期${leadsConversion.conversion_details.cycle_days}天，POC→签约环节耗时最长——方案能力是瓶颈` : '转化效率低于目标，需关注POC阶段流失' },
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

  return (
    <div className="space-y-12 pb-24">
      <section>
        <SectionHeader number="1" title="业绩总揽与根因分析" subtitle="不只呈现结果，更揭示驱动业绩变化的深层原因" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi) => (
            <Card key={kpi.label} hover>
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
                <div className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-500 leading-relaxed">{kpi.diagnosis}</p>
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} formatter={(v: number) => [formatCurrency(v, currency), '']} />
                    <Area type="monotone" dataKey="value" stroke="#18181b" fill="url(#revArea)" strokeWidth={2} />
                    <defs><linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18181b" stopOpacity={0.08} /><stop offset="100%" stopColor="#18181b" stopOpacity={0} /></linearGradient></defs>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {config?.sections?.revenueAlignment && (
            <ErrorBoundary><StrategicGoalBoard revenue={revenue} insights={insights} onNavigate={onViewChange} /></ErrorBoundary>
          )}
        </div>
      </section>

      {/* Part 2: 渠道三要素 */}
      <section>
        <SectionHeader number="2" title="渠道分析：覆盖 · 活跃度 · 绩效评估" subtitle="从三个核心维度全面诊断渠道健康度" />
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
                      return (<div key={i} className={cn('p-3 rounded-lg border', isLow ? 'border-amber-200 dark:border-amber-800 bg-amber-50/20' : 'border-neutral-200 dark:border-neutral-800')}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><MapPin className={cn('w-4 h-4', isLow ? 'text-amber-500' : 'text-neutral-400')} /><span className="text-sm font-medium">{region.region}</span><Badge variant="default" size="sm">{region.partner_count} 伙伴</Badge></div></div><div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"><div className={cn('h-full rounded-full', isLow ? 'bg-amber-400' : 'bg-blue-500')} style={{ width: `${(region.partner_count / max) * 100}%` }} /></div></div>);
                    })}</div>
                  ) : <EmptyState title="覆盖数据加载中" />}
                </CardContent>
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
                      {[{ label: 'L1: 交易活跃', data: activePartners.active_split.order_placing, color: '#18181b', detail: '核心交易伙伴，平均单笔订单¥45.2万，复购率85%' }, { label: 'L2: 项目活跃', data: activePartners.active_split.leads_reporting, color: '#2563eb', detail: '报备项目总额¥12.5亿，但转化周期拉长10%' }, { label: 'L3: 参与活跃', data: activePartners.active_split.incentive_participants, color: '#0891b2', detail: '营销活动参与度极高' }].map((l) => (
                        <div key={l.label}><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">{l.label}</span><div className="text-right"><span className="text-lg font-semibold">{l.data.value}</span><span className="text-xs text-neutral-400 ml-1">/ {l.data.target}</span></div></div><ProgressBar value={l.data.rate} max={150} size="md" /></div>
                      ))}
                      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">活跃度诊断：L1下单活跃度健康，但L2→L3之间存在明显断层</div>
                    </div>
                  ) : <EmptyState title="活跃度数据加载中" />}
                </CardContent>
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
            </Card>
          </div>
        </div>
      </section>

      {/* Part 3: 深度洞察 */}
      <section>
        <SectionHeader number="3" title="渠道深度洞察与行动建议" subtitle="相关性分析、生命周期管理与健康度诊断" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights?.map((insight, i) => (
            <Card key={i} hover onClick={() => onViewChange(insight.actionId === 'pmdf' ? 'marketing' : insight.actionId === 'training' ? 'enablement' : 'analytics')}>
              <div className="flex items-start gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', insight.type === 'trend' ? 'bg-blue-50 dark:bg-blue-900/20' : insight.type === 'risk' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20')}>
                  {insight.type === 'trend' ? <TrendingUp className="w-4 h-4 text-blue-600" /> : insight.type === 'risk' ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <Zap className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold">{insight.title}</p><p className="text-xs text-neutral-500 mt-1">{insight.content}</p></div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-neutral-500" /></div>
          <div><h2 className="text-lg font-semibold">历史趋势</h2></div>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800 ml-4" /></div>
        <HistoricalTrendChart />
      </section>
    </div>
  );
};
