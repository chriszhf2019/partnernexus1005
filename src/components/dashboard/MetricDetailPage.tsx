import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DollarSign, Target, CheckCircle2, Clock, Users, TrendingUp,
  Building2, Activity, ChevronLeft, BarChart3, PieChart, Shield,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PageLoader } from '../ui/PageLoader';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCockpitData } from '../../hooks/useData';
import { supabase } from '../../lib/supabase';
import { dealService } from '../../services/deal-service';
import { Deal, isDealWon } from '../../types';
import { enrichDealsWithMetrics, calculateDealWinProbability, getDefaultProbabilityConfig } from '../../lib/dealMetrics';

const METRIC_CONFIG: Record<string, { 
  title: string; 
  icon: any; 
  color: string; 
  description: string;
  module: 'deals' | 'partners' | 'marketing' | 'ecosystem';
}> = {
  'deals-pipeline': { title: '管线覆盖详情', icon: DollarSign, color: 'text-blue-600', description: '活跃商机管线总额，按阶段分布', module: 'deals' },
  'deals-weighted': { title: '加权预期详情', icon: Target, color: 'text-amber-600', description: '金额 × 真实赢单率，反映转化预期', module: 'deals' },
  'deals-won': { title: '赢单进展详情', icon: CheckCircle2, color: 'text-emerald-600', description: '已赢单笔数、金额和赢单率分析', module: 'deals' },
  'deals-cycle': { title: '周期健康详情', icon: Clock, color: 'text-amber-600', description: '各阶段平均周期天数', module: 'deals' },
  
  'partners-health': { title: '伙伴健康度详情', icon: Activity, color: 'text-green-600', description: '伙伴活跃度、质量评分及健康状态分布', module: 'partners' },
  'partners-active': { title: '活跃伙伴详情', icon: Users, color: 'text-blue-600', description: '各类别活跃伙伴清单及分布', module: 'partners' },
  'partners-coverage': { title: '覆盖健康详情', icon: Building2, color: 'text-blue-600', description: '区域/行业饱和度分析及伙伴清单', module: 'partners' },
  'partners-efficiency': { title: '能效健康详情', icon: TrendingUp, color: 'text-purple-600', description: '投入产出分析及伙伴效率清单', module: 'partners' },
  'partners-summary': { title: '综合健康详情', icon: Shield, color: 'text-amber-600', description: '生态健康综合分析及待办清单', module: 'partners' },
  'partners-growth': { title: '伙伴增长详情', icon: TrendingUp, color: 'text-purple-600', description: '伙伴增长趋势及新增伙伴分析', module: 'partners' },
  
  'marketing-budget': { title: '预算执行详情', icon: DollarSign, color: 'text-indigo-600', description: '营销预算分配、消耗率及执行进度分析', module: 'marketing' },
  'marketing-roi': { title: '投资回报详情', icon: BarChart3, color: 'text-emerald-600', description: '营销活动投资回报率分析及渠道效率对比', module: 'marketing' },
  'marketing-performance': { title: '营销绩效详情', icon: PieChart, color: 'text-amber-600', description: '各项营销指标完成情况及趋势分析', module: 'marketing' },
  
  'ecosystem-revenue': { title: '营收详情', icon: DollarSign, color: 'text-blue-600', description: '季度营收构成及区域分布', module: 'ecosystem' },
  'ecosystem-partners': { title: '伙伴生态详情', icon: Building2, color: 'text-teal-600', description: '伙伴生态构成及活跃度分析', module: 'ecosystem' },
  'ecosystem-conversion': { title: '转化详情', icon: Activity, color: 'text-purple-600', description: '线索转化漏斗及效率分析', module: 'ecosystem' },
};

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  'Registered': { label: '已报备', color: 'bg-neutral-400' },
  'UnderReview': { label: '审批中', color: 'bg-blue-500' },
  'Approved': { label: '已批复', color: 'bg-emerald-500' },
  'Solution': { label: '方案跟进', color: 'bg-purple-500' },
  'Commercial': { label: '商务洽谈', color: 'bg-amber-500' },
  'ClosedWon': { label: '赢单', color: 'bg-emerald-500' },
  'ClosedLost': { label: '丢单', color: 'bg-red-500' },
};

export const MetricDetailPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { data: cockpitData } = useCockpitData();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dealRes, partnerRes] = await Promise.all([
          dealService.list().catch(() => ({ items: [] as any[], total: 0, page: 1, pageSize: 0 })),
          Promise.resolve(supabase.from('partners').select('*')).then(r => r, () => ({ data: [] as any[] })),
        ]);
        setDeals(dealRes?.items || []);
        setPartners((partnerRes as any)?.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const config = METRIC_CONFIG[type || ''] || null;

  // ── 实时计算: 增强商机数据, 替换硬编码概率 ──
  const enrichedDeals = useMemo(() => enrichDealsWithMetrics(deals), [deals]);
  const probConfig = useMemo(() => getDefaultProbabilityConfig(), []);
  const pipelineValue = useMemo(() => enrichedDeals.filter(d => !['ClosedWon', 'ClosedLost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0), [enrichedDeals]);
  const wonValue = useMemo(() => enrichedDeals.filter(d => isDealWon(d)).reduce((s, d) => s + (d.value || 0), 0), [enrichedDeals]);
  const weightedPipelineValue = useMemo(() => enrichedDeals
    .filter(d => !['ClosedWon', 'ClosedLost'].includes(d.stage))
    .reduce((s, d) => s + (d.weightedValue || 0), 0), [enrichedDeals]);

  if (loading) return <PageLoader />;
  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-lg font-semibold text-neutral-400">未找到该指标</p>
        <button onClick={() => navigate('/ecosystem')} className="text-sm text-brand hover:underline">返回首页</button>
      </div>
    );
  }

  const Icon = config.icon;
  const module = config.module;

  const renderDealDetails = () => {
    if (!type?.startsWith('deals-')) return null;
    const dealType = type.replace('deals-', '');

    if (dealType === 'pipeline') {
      const stages = ['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial'];
      const stageDeals = selectedStage ? deals.filter(d => d.stage === selectedStage && !['ClosedWon','ClosedLost'].includes(d.stage)) : [];
      const cfg = selectedStage ? (STAGE_CONFIG[selectedStage] || { label: selectedStage, color: 'bg-neutral-400' }) : null;
      
      return (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50">
                <span className="text-2xl font-bold">{formatCurrency(pipelineValue)}</span>
                <span className="text-sm text-neutral-400 ml-2">活跃管线总额</span>
              </div>
              {stages.map(stage => {
                const count = deals.filter(d => d.stage === stage).length;
                const value = deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value || 0), 0);
                const stageCfg = STAGE_CONFIG[stage] || { label: stage, color: 'bg-neutral-400' };
                return (
                  <div 
                    key={stage} 
                    className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border-b border-neutral-100"
                    onClick={() => setSelectedStage(selectedStage === stage ? null : stage)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${stageCfg.color}`} />
                      <span className="text-sm font-medium">{stageCfg.label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-400'}`}>
                        {count} 笔
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(value)}</p>
                    </div>
                  </div>
                );
              })}
              <div className="p-3 bg-neutral-50 text-xs text-neutral-500">
                点击阶段查看详细商机清单
              </div>
            </CardContent>
          </Card>

          {selectedStage && cfg && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${cfg.color}`} />
                  {cfg.label} · {stageDeals.length} 笔商机
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 text-xs text-neutral-500 font-medium">商机名称</th>
                        <th className="text-left py-2 px-2 text-xs text-neutral-500 font-medium">合作伙伴</th>
                        <th className="text-right py-2 px-2 text-xs text-neutral-500 font-medium">金额</th>
                        <th className="text-left py-2 px-2 text-xs text-neutral-500 font-medium">阶段</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stageDeals.map((deal, i) => (
                        <tr key={deal.id} className="border-b hover:bg-neutral-50">
                          <td className="py-2 px-2 font-medium">{deal.title || '未命名商机'}</td>
                          <td className="py-2 px-2 text-neutral-500">{deal.partnerName || '-'}</td>
                          <td className="py-2 px-2 text-right font-semibold">{formatCurrency(deal.value || 0)}</td>
                          <td className="py-2 px-2"><Badge size="sm">{cfg.label}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {stageDeals.length === 0 && (
                  <p className="text-sm text-neutral-400 text-center py-8">该阶段暂无商机</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    if (dealType === 'weighted') {
      // ── 使用配置化的阶段概率, 不再硬编码 0.1/0.2/0.3... ──
      const activeDeals = enrichedDeals.filter(d => !['ClosedWon', 'ClosedLost'].includes(d.stage));
      const totalWeighted = activeDeals.reduce((s, d) => s + (d.weightedValue || 0), 0);
      const totalPipeline = activeDeals.reduce((s, d) => s + (d.value || 0), 0);
      const weightedDeals = activeDeals;
      const cfg = probConfig;

      return (
        <Card>
          <CardHeader>
            <CardTitle>加权预期详情</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-gradient-to-r from-amber-50 to-amber-100/50">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-amber-600">{formatCurrency(totalWeighted)}</span>
                <span className="text-sm text-neutral-400">加权预期金额</span>
              </div>
              <div className="flex gap-6 mt-3">
                <div>
                  <p className="text-xs text-neutral-400">管线总额</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalPipeline)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">转化预期</p>
                  <p className="text-lg font-semibold">{totalPipeline > 0 ? Math.round(totalWeighted / totalPipeline * 100) : 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">活跃商机</p>
                  <p className="text-lg font-semibold">{activeDeals.length}</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-neutral-500 mb-3">加权商机清单（按加权金额排序）</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {[...weightedDeals].sort((a, b) => b.weightedValue - a.weightedValue).map((deal, i) => (
                  <div key={deal.id} className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 hover:bg-neutral-50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                      <div>
                        <span className="font-medium">{deal.title || '未命名商机'}</span>
                        <span className="text-neutral-400 ml-2 text-xs">{deal.partnerName || '-'}</span>
                        <Badge size="sm" className="ml-2">{STAGE_CONFIG[deal.stage]?.label || deal.stage}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-600 font-semibold">{formatCurrency(deal.weightedValue)}</span>
                      <span className="text-xs text-neutral-400 ml-1">({Math.round((deal.winProbability || 0) * 100)}%)</span>
                    </div>
                  </div>
                ))}
                {weightedDeals.length === 0 && (
                  <p className="text-sm text-neutral-400 text-center py-8">暂无活跃商机</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (dealType === 'won') {
      const wonDeals = deals.filter(d => isDealWon(d));
      return (
        <Card>
          <CardHeader>
            <CardTitle>赢单详情</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-emerald-100/50">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-emerald-600">{formatCurrency(wonValue)}</span>
                <span className="text-sm text-neutral-400">赢单金额</span>
              </div>
              <div className="flex gap-6 mt-3">
                <div>
                  <p className="text-xs text-neutral-400">赢单笔数</p>
                  <p className="text-lg font-semibold">{wonDeals.length}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">赢单率</p>
                  <p className="text-lg font-semibold">{deals.length > 0 ? Math.round(wonDeals.length / deals.length * 100) : 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">总商机</p>
                  <p className="text-lg font-semibold">{deals.length}</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-neutral-500 mb-3">赢单清单（按金额排序）</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {[...wonDeals].sort((a, b) => (b.value || 0) - (a.value || 0)).map((deal, i) => (
                  <div key={deal.id} className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 hover:bg-neutral-50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                      <div>
                        <span className="font-medium">{deal.title || '未命名商机'}</span>
                        <span className="text-neutral-400 ml-2 text-xs">{deal.partnerName || '-'}</span>
                      </div>
                    </div>
                    <span className="text-emerald-600 font-semibold">{formatCurrency(deal.value || 0)}</span>
                  </div>
                ))}
                {wonDeals.length === 0 && (
                  <p className="text-sm text-neutral-400 text-center py-8">暂无赢单记录</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (dealType === 'cycle') {
      // ── 使用 enrichedDeals 中实时计算的指标, 不再依赖硬编码 ──
      const stagnantDeals = enrichedDeals.filter(d => d.isStagnant);
      const activeDeals = enrichedDeals.filter(d => !['ClosedWon', 'ClosedLost'].includes(d.stage));
      const avgCycleAll = activeDeals.length > 0
        ? Math.round(activeDeals.reduce((s, d) => s + (d.daysInCurrentStage || 0), 0) / activeDeals.length)
        : 0;
      return (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b bg-gradient-to-r from-amber-50 to-amber-100/50">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-neutral-400">停滞商机</p>
                    <p className="text-2xl font-bold text-amber-600">{stagnantDeals.length} 笔</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-400">平均周期</p>
                    <p className="text-2xl font-bold text-blue-600">{avgCycleAll} 天</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial'].map(stage => {
                  const cfg = STAGE_CONFIG[stage];
                  const stageDeals = enrichedDeals.filter(d => d.stage === stage);
                  const avgDays = stageDeals.length > 0 
                    ? Math.round(stageDeals.reduce((s, d) => s + (d.daysInCurrentStage || 0), 0) / stageDeals.length)
                    : 0;
                  return (
                    <div key={stage} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                        <span>{cfg.label}</span>
                      </div>
                      <span className="text-sm">{stageDeals.length}笔 · {avgDays}天</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {stagnantDeals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <span>⚠️</span> 停滞商机清单
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {stagnantDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between py-2 border-b hover:bg-amber-50">
                      <div>
                        <p className="font-medium">{deal.title || '未命名商机'}</p>
                        <p className="text-xs text-neutral-400">{deal.partnerName || '-'} · 停滞 {deal.daysInCurrentStage || 0} 天</p>
                      </div>
                      <Badge variant="warning" size="sm">{formatCurrency(deal.value || 0)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return null;
  };

  const renderPartnerDetails = () => {
    if (!type?.startsWith('partners-')) return null;
    const partnerType = type.replace('partners-', '');

    if (partnerType === 'active') {
      const activePartners = partners.filter(p => p.status === 'Cooperating');
      const groupedByTier = activePartners.reduce((acc, p) => {
        const tier = p.tier || 'Other';
        acc[tier] = (acc[tier] || []).concat(p);
        return acc;
      }, {} as Record<string, any[]>);
      
      return (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <span className="text-2xl font-bold">{activePartners.length}</span>
              <span className="text-sm text-neutral-400 ml-2">活跃合作伙伴</span>
            </div>
            {Object.entries(groupedByTier as Record<string, any[]>).map(([tier, items]) => (
              <div key={tier} className="border-b last:border-b-0">
                <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 font-medium text-sm">
                  {tier} · {items.length} 家
                </div>
                <div className="p-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {items.map(p => (
                    <div key={p.id} className="px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-neutral-400">{p.region}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    if (partnerType === 'health') {
      const healthy = partners.filter(p => p.health_score >= 80);
      const warning = partners.filter(p => p.health_score >= 50 && p.health_score < 80);
      const critical = partners.filter(p => p.health_score < 50);
      
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{healthy.length}</p>
                <p className="text-xs text-emerald-700">健康</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{warning.length}</p>
                <p className="text-xs text-amber-700">需关注</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{critical.length}</p>
                <p className="text-xs text-red-700">风险</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">风险伙伴清单</CardTitle>
            </CardHeader>
            <CardContent>
              {critical.length > 0 ? (
                <div className="space-y-2">
                  {critical.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-neutral-400">{p.region} · {p.tier}</p>
                      </div>
                      <Badge variant="danger">{p.health_score}分</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 text-center py-4">暂无风险伙伴</p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (partnerType === 'coverage') {
      const allRegions = ['华东', '华南', '华北', '华中', '西部', '西北', '西南'];
      const regions = [...new Set(partners.map(p => p.region).filter(Boolean))];
      const whiteSpaces = allRegions.filter(r => !regions.includes(r));
      
      const now = new Date();
      const currentQuarter = Math.floor((now.getMonth() / 3)) + 1;
      const currentYear = now.getFullYear();
      const newThisQ = partners.filter(p => {
        const startDate = new Date(p.startDate || p.start_date || '');
        if (isNaN(startDate.getTime())) return false;
        const quarter = Math.floor((startDate.getMonth() / 3)) + 1;
        const year = startDate.getFullYear();
        return year === currentYear && quarter === currentQuarter;
      }).length;
      
      const coopCount = partners.filter(p => p.status === 'Cooperating').length;
      const industries = [...new Set(partners.map(p => p.industry).filter(Boolean))];
      
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>覆盖健康分析</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-neutral-400">覆盖区域</p>
                  <p className="text-xl font-bold text-blue-600">{regions.length} 个</p>
                  <p className="text-xs text-blue-500">{regions.join(' · ')}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-neutral-400">空白市场</p>
                  <p className="text-xl font-bold text-amber-600">{whiteSpaces.length} 个</p>
                  <p className="text-xs text-amber-500">{whiteSpaces.join(' · ') || '-'}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-neutral-400">新签伙伴(本季)</p>
                  <p className="text-xl font-bold text-emerald-600">{newThisQ} 家</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-neutral-400">区域密度</p>
                  <p className="text-xl font-bold text-purple-600">{(coopCount / Math.max(regions.length, 1)).toFixed(0)} 家/区</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-neutral-400">行业覆盖</p>
                  <p className="text-xl font-bold text-indigo-600">{industries.length} 个</p>
                  <p className="text-xs text-indigo-500">{industries.join(' · ') || '-'}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-neutral-400">待招募区域</p>
                  <p className="text-xl font-bold text-orange-600">{whiteSpaces.length > 0 ? '需关注' : '饱和'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">区域伙伴清单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-xs text-neutral-500 font-medium">区域</th>
                      <th className="text-left py-2 px-2 text-xs text-neutral-500 font-medium">伙伴名称</th>
                      <th className="text-left py-2 px-2 text-xs text-neutral-500 font-medium">层级</th>
                      <th className="text-left py-2 px-2 text-xs text-neutral-500 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.sort((a, b) => (a.region || '').localeCompare(b.region || '')).map(p => (
                      <tr key={p.id} className="border-b hover:bg-neutral-50">
                        <td className="py-2 px-2 font-medium">{p.region || '-'}</td>
                        <td className="py-2 px-2">{p.name}</td>
                        <td className="py-2 px-2"><Badge size="sm">{p.tier}</Badge></td>
                        <td className="py-2 px-2"><Badge variant={p.status === 'Cooperating' ? 'default' : 'secondary'} size="sm">{p.status === 'Cooperating' ? '活跃' : '待批复'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (partnerType === 'efficiency') {
      const coopCount = partners.filter(p => p.status === 'Cooperating').length;
      const wonCount = partners.filter(p => (p.winRate || 0) > 0).length;
      const starPartners = partners.filter(p => (p.winRate || 0) >= 80);
      const corePartners = partners.filter(p => (p.winRate || 0) >= 50 && (p.winRate || 0) < 80);
      const needImprove = partners.filter(p => (p.winRate || 0) > 0 && (p.winRate || 0) < 50);
      const noWin = partners.filter(p => !(p.winRate || 0));
      
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>能效健康分析</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-neutral-400">ARPP(有赢单伙伴平均产出)</p>
                  <p className="text-xl font-bold text-purple-600">¥{(wonValue / Math.max(wonCount, 1) / 10000).toFixed(0)}万</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-neutral-400">有赢单伙伴</p>
                  <p className="text-xl font-bold text-emerald-600">{wonCount} 家</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-neutral-400">赢单率</p>
                  <p className="text-xl font-bold text-blue-600">{Math.round(wonCount / Math.max(partners.length, 1) * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">伙伴效率分层清单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-emerald-600">⭐ 明星伙伴(赢单率≥80%)</span>
                    <Badge variant="default" size="sm">{starPartners.length} 家</Badge>
                  </div>
                  <div className="space-y-1">
                    {starPartners.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-neutral-400">{p.region} · {p.tier}</p>
                        </div>
                        <span className="text-emerald-600 font-semibold">{p.winRate}%</span>
                      </div>
                    ))}
                    {starPartners.length === 0 && <p className="text-xs text-neutral-400 px-3">暂无明星伙伴</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600">中坚伙伴(赢单率50-79%)</span>
                    <Badge variant="default" size="sm">{corePartners.length} 家</Badge>
                  </div>
                  <div className="space-y-1">
                    {corePartners.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-neutral-400">{p.region} · {p.tier}</p>
                        </div>
                        <span className="text-blue-600 font-semibold">{p.winRate}%</span>
                      </div>
                    ))}
                    {corePartners.length === 0 && <p className="text-xs text-neutral-400 px-3">暂无中坚伙伴</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-amber-600">待提升(赢单率&lt;50%)</span>
                    <Badge variant="warning" size="sm">{needImprove.length} 家</Badge>
                  </div>
                  <div className="space-y-1">
                    {needImprove.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-neutral-400">{p.region} · {p.tier}</p>
                        </div>
                        <span className="text-amber-600 font-semibold">{p.winRate}%</span>
                      </div>
                    ))}
                    {needImprove.length === 0 && <p className="text-xs text-neutral-400 px-3">暂无待提升伙伴</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-red-600">零产出(无赢单)</span>
                    <Badge variant="danger" size="sm">{noWin.length} 家</Badge>
                  </div>
                  <div className="space-y-1">
                    {noWin.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-neutral-400">{p.region} · {p.tier} · {p.manager || '-'}</p>
                        </div>
                        <span className="text-red-600 font-semibold">0%</span>
                      </div>
                    ))}
                    {noWin.length === 0 && <p className="text-xs text-neutral-400 px-3">暂无零产出伙伴</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (partnerType === 'summary') {
      const coopCount = partners.filter(p => p.status === 'Cooperating').length;
      const pendingCount = partners.filter(p => p.status === 'Prospective').length;
      const wonCount = partners.filter(p => (p.winRate || 0) > 0).length;
      
      const healthScores = partners.map(p => p.health_score || p.healthScore || 0);
      const avgHealthScore = healthScores.length > 0 
        ? Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length) 
        : 0;
      
      const healthy = partners.filter(p => (p.health_score || p.healthScore || 0) >= 80).length;
      const warning = partners.filter(p => {
        const score = p.health_score || p.healthScore || 0;
        return score >= 50 && score < 80;
      }).length;
      const critical = partners.filter(p => (p.health_score || p.healthScore || 0) < 50).length;
      const noWin = partners.filter(p => !(p.winRate || 0));
      
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>生态健康综合分析</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600">{avgHealthScore}</p>
                  <p className="text-xs text-neutral-400">综合健康指数</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{coopCount}</p>
                  <p className="text-xs text-neutral-400">活跃伙伴</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{pendingCount}</p>
                  <p className="text-xs text-neutral-400">待批复</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{wonCount}</p>
                  <p className="text-xs text-neutral-400">有赢单</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 p-4">
                <div className="p-3 bg-emerald-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-emerald-600">{healthy}</p>
                  <p className="text-xs text-emerald-700">健康</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-amber-600">{warning}</p>
                  <p className="text-xs text-amber-700">需关注</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-red-600">{critical}</p>
                  <p className="text-xs text-red-700">风险</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">待办事项清单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingCount > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-red-600">待批复伙伴</span>
                      <Badge variant="danger" size="sm">{pendingCount} 家</Badge>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {partners.filter(p => p.status === 'Prospective').slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-red-200">
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-neutral-400">{p.tier}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {noWin.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-amber-600">零产出伙伴</span>
                      <Badge variant="warning" size="sm">{noWin.length} 家</Badge>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {noWin.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-amber-200">
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-neutral-400">{p.region} · {p.manager || '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-purple-600">高产出伙伴</span>
                    <Badge variant="default" size="sm">{partners.filter(p => (p.winRate || 0) >= 80).length} 家</Badge>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {partners.filter(p => (p.winRate || 0) >= 80).slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-purple-200">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-neutral-400">{p.region} · 赢单率 {p.winRate}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">动态分层标签</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🏆 高产出', count: partners.filter(p=>(p.winRate||0)>50&&p.status==='Cooperating').length, color: 'bg-emerald-100 text-emerald-700' },
                  { label: '💤 沉睡', count: partners.filter(p=>p.status==='Cooperating'&&(p.winRate||0)===0).length, color: 'bg-amber-100 text-amber-700' },
                  { label: '🆕 新进', count: partners.filter(p=>p.status==='Prospective').length, color: 'bg-blue-100 text-blue-700' },
                  { label: '📈 上升', count: partners.filter(p=>p.status==='Cooperating'&&new Date(p.startDate).getTime()>Date.now()-90*86400000).length, color: 'bg-purple-100 text-purple-700' },
                ].map((tag, i) => (
                  <div key={i} className={`px-4 py-2 rounded-full text-sm font-semibold ${tag.color}`}>
                    {tag.label} {tag.count} 家
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  };

  const renderEcosystemDetails = () => {
    if (!type?.startsWith('ecosystem-')) return null;
    const ecoType = type.replace('ecosystem-', '');

    if (ecoType === 'revenue') {
      const revenue = cockpitData.revenue;
      return (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold">{formatCurrency(revenue?.achievements?.quarterly?.current || 0)}</span>
                <span className="text-sm text-neutral-400">季度营收</span>
              </div>
              <div className="flex gap-6 mt-3">
                <div>
                  <p className="text-xs text-neutral-400">目标</p>
                  <p className="text-sm">{formatCurrency(revenue?.achievements?.quarterly?.target || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">达成率</p>
                  <p className="text-sm font-semibold">{(revenue?.achievements?.quarterly?.rate || 0).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">同比</p>
                  <p className={`text-sm font-semibold ${(revenue?.qoq || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {(revenue?.qoq || 0) >= 0 ? '+' : ''}{(revenue?.qoq || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-neutral-400 mb-3">区域分布</p>
              <div className="space-y-2">
                {(revenue?.dimensional_achievements?.find(d => d.type === 'region')?.data || []).map((region: any) => (
                  <div key={region.name} className="flex items-center justify-between">
                    <span className="text-sm">{region.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${region.rate}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 w-12 text-right">{region.rate.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  const getBackPath = () => {
    switch (module) {
      case 'deals': return '/deals';
      case 'partners': return '/partners';
      case 'marketing': return '/marketing';
      default: return '/ecosystem';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(getBackPath())} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{config.title}</h1>
          <p className="text-sm text-neutral-500">{config.description}</p>
        </div>
      </div>

      {renderDealDetails()}
      {renderPartnerDetails()}
      {renderEcosystemDetails()}
    </div>
  );
};