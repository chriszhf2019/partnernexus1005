import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';
import {
  ArrowLeft, Building2, Users, Target, TrendingUp, AlertTriangle, Shield,
  DollarSign, Calendar, MapPin, BarChart3, Zap, Lightbulb, ChevronRight,
  ExternalLink, Search, Star, Brain, Clock, CheckCircle2, Eye
} from 'lucide-react';

const cur = (v: number) => formatCurrency(v, 'CNY');

// 7-Factor Analysis Framework
const FACTORS = [
  { key: 'basic', label: '基本信息', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'industry', label: '行业属性', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'scale', label: '企业规模', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'decision', label: '决策链', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'budget', label: '预算评估', icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'timeline', label: '时间窗口', icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'competition', label: '竞争格局', icon: Shield, color: 'text-orange-600', bg: 'bg-orange-50' },
];

export const CustomerAnalysis = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'factors' | 'correlation' | 'deep'>('factors');

  const customerName = decodeURIComponent(name || '');

  useEffect(() => {
    if (!customerName) { setLoading(false); return; }
    const load = async () => {
      try {
        // Fetch all deals for this customer
        const { data } = await supabase.from('deals').select('*')
          .or(`customer_name.eq.${customerName},customer.eq.${customerName}`)
          .order('created_date', { ascending: false });
        if (data) setDeals(data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [customerName]);

  // Compute analytics
  const analytics = useMemo(() => {
    const totalValue = deals.reduce((s, d) => s + (d.value || 0), 0);
    const wonDeals = deals.filter(d => d.stage === 'ClosedWon');
    const wonValue = wonDeals.reduce((s, d) => s + d.value, 0);
    const activeDeals = deals.filter(d => d.stage !== 'ClosedWon' && d.stage !== 'ClosedLost');
    const partners = [...new Set(deals.map(d => d.partner_name).filter(Boolean))];
    const regions = [...new Set(deals.map(d => d.region).filter(Boolean))];
    const products = [...new Set(deals.map(d => d.product_type).filter(Boolean))];
    const stages = deals.reduce((acc: Record<string, number>, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1; return acc;
    }, {} as Record<string, number>);

    // Decision chain inference
    const contacts = [...new Set(deals.map(d => d.sales_name).filter(Boolean))];
    const hasIT = deals.some(d => d.product_type?.includes('AI') || d.product_type?.includes('云') || d.product_type?.includes('数据'));
    const hasSecurity = deals.some(d => d.product_type?.includes('安全'));
    const avgDealSize = deals.length > 0 ? Math.round(totalValue / deals.length) : 0;
    const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

    return {
      totalValue, wonValue, activeDeals: activeDeals.length, partners, regions, products,
      stages, contacts, hasIT, hasSecurity, avgDealSize, winRate, totalDeals: deals.length,
    };
  }, [deals]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-neutral-400">加载中...</div>;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3">
            <ArrowLeft className="w-4 h-4" />返回
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">{customerName}</h1>
              <p className="text-white/70 text-sm mt-1">
                客户全景分析 · {analytics.totalDeals} 个商机 · {analytics.partners.length} 个合作伙伴
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">商机总额</p>
              <p className="text-3xl font-extrabold">{cur(analytics.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: '活跃商机', value: analytics.activeDeals, icon: Zap, color: 'text-blue-600' },
            { label: '赢单金额', value: cur(analytics.wonValue), icon: TrendingUp, color: 'text-emerald-600' },
            { label: '赢单率', value: `${analytics.winRate}%`, icon: Target, color: 'text-purple-600' },
            { label: '均单金额', value: cur(analytics.avgDealSize), icon: DollarSign, color: 'text-amber-600' },
          ].map((s, i) => (
            <Card key={i}><div className="p-4 text-center">
              <s.icon className={cn('w-5 h-5 mx-auto mb-2', s.color)} />
              <p className="text-[10px] text-neutral-500">{s.label}</p>
              <p className={cn('text-xl font-extrabold mt-0.5', s.color)}>{s.value}</p>
            </div></Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { id: 'factors' as const, label: '🔍 7要素分析' },
            { id: 'correlation' as const, label: '🔗 相关性分析' },
            { id: 'deep' as const, label: '🧠 深度洞察' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ 7-Factor Analysis ═══ */}
        {activeTab === 'factors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Factor 1: Basic */}
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" />基本信息</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-[10px] text-neutral-400">客户名称</p>
                    <p className="font-semibold">{customerName}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-[10px] text-neutral-400">覆盖区域</p>
                    <p className="font-semibold">{analytics.regions.join(' · ') || '待分析'}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-[10px] text-neutral-400">涉及产品线</p>
                    <p className="font-semibold">{analytics.products.join(' · ') || '待分析'}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-[10px] text-neutral-400">首次合作</p>
                    <p className="font-semibold">{deals.length > 0 ? deals[deals.length - 1].created_date?.slice(0, 10) : '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Factor 2: Industry */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-4 h-4 text-emerald-600" />行业属性</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">行业分类</p>
                  <p className="font-semibold text-emerald-700">{deals[0]?.customer_industry || '金融/保险'}</p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">数字化程度</p>
                  <p className="font-semibold text-emerald-700">{analytics.hasIT ? '高 · 已采购AI/云产品' : '中等'}</p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">合规要求</p>
                  <p className="font-semibold text-emerald-700">{analytics.hasSecurity ? '高 · 涉及安全产品' : '标准'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Factor 3: Scale */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-600" />企业规模</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">商机总量</p>
                  <p className="font-semibold text-purple-700">{cur(analytics.totalValue)}</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">均单规模</p>
                  <p className="font-semibold text-purple-700">{cur(analytics.avgDealSize)}</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">合作频次</p>
                  <p className="font-semibold text-purple-700">{analytics.totalDeals} 次</p>
                </div>
              </CardContent>
            </Card>

            {/* Factor 4: Decision Chain */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-4 h-4 text-amber-600" />决策链</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">我方对接人</p>
                  <p className="font-semibold text-amber-700">{analytics.contacts.slice(0, 3).join(' · ') || '待建立'}</p>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">合作渠道</p>
                  <p className="font-semibold text-amber-700">{analytics.partners.slice(0, 3).join(' · ') || '待分析'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Factor 5: Budget */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-red-600" />预算评估</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">已投入</p>
                  <p className="font-semibold text-red-700">{cur(analytics.totalValue)}</p>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">赢单产出</p>
                  <p className="font-semibold text-red-700">{cur(analytics.wonValue)}</p>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">预算充裕度</p>
                  <Badge variant={analytics.totalValue > 5000000 ? 'success' : 'warning'}>
                    {analytics.totalValue > 5000000 ? '高 · 大客户' : '中等'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Factor 6: Timeline */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-600" />时间窗口</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">最近商机</p>
                  <p className="font-semibold text-cyan-700">{deals[0]?.created_date?.slice(0, 10) || '-'}</p>
                </div>
                <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">活跃商机阶段</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(Object.entries(analytics.stages) as [string, number][]).slice(0, 3).map(([stage, count]) => (
                      <Badge key={stage} size="sm" variant="info">{stage}: {String(count)}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Factor 7: Competition */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-orange-600" />竞争格局</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">合作渠道数</p>
                  <p className="font-semibold text-orange-700">{analytics.partners.length} 家</p>
                </div>
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">渠道竞争度</p>
                  <Badge variant={analytics.partners.length > 1 ? 'warning' : 'success'}>
                    {analytics.partners.length > 2 ? '激烈 · 多伙伴竞争' : analytics.partners.length > 1 ? '温和' : '独家'}
                  </Badge>
                </div>
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-[10px] text-neutral-500">丢单分析</p>
                  <p className="font-semibold text-orange-700">{deals.filter(d => d.stage === 'ClosedLost').length} 个丢单</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ Correlation Analysis ═══ */}
        {activeTab === 'correlation' && (
          <div className="space-y-4">
            {/* Partner Correlation */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" />合作伙伴相关度</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.partners.map((partner, i) => {
                    const pDeals = deals.filter(d => d.partner_name === partner);
                    const pValue = pDeals.reduce((s, d) => s + (d.value || 0), 0);
                    const pWon = pDeals.filter(d => d.stage === 'ClosedWon').length;
                    return (
                      <div key={i} className="flex items-center gap-3 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <span className="font-semibold text-sm flex-1">{partner}</span>
                        <span className="text-[11px] text-neutral-500">{pDeals.length} 个商机</span>
                        <span className="text-[11px] text-neutral-500">{cur(pValue)}</span>
                        <Badge variant={pWon > 0 ? 'success' : 'default'}>{pWon > 0 ? `赢${pWon}单` : '无赢单'}</Badge>
                      </div>
                    );
                  })}
                  {analytics.partners.length === 0 && <p className="text-sm text-neutral-400 text-center py-4">暂无合作伙伴数据</p>}
                </div>
              </CardContent>
            </Card>
            {/* Product Correlation */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-4 h-4 text-emerald-600" />产品偏好分析</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {analytics.products.map((product, i) => {
                    const pDeals = deals.filter(d => d.product_type === product);
                    return (
                      <div key={i} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                        <p className="font-semibold text-emerald-700">{product}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">{pDeals.length} 个商机 · {cur(pDeals.reduce((s, d) => s + d.value, 0))}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            {/* Stage Distribution */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-600" />阶段分布</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-32 px-4">
                  {(Object.entries(analytics.stages) as [string, number][]).map(([stage, count]) => {
                    const vals: number[] = Object.values(analytics.stages) as number[];
                    const maxCount = Math.max(...vals);
                    const h = Math.round((count / maxCount) * 100);
                    const isWon = stage === 'ClosedWon';
                    const isLost = stage === 'ClosedLost';
                    return (
                      <div key={stage} className="flex-1 text-center">
                        <div className={cn('w-full rounded-t-lg mx-auto', isWon ? 'bg-emerald-500' : isLost ? 'bg-red-500' : 'bg-blue-500')}
                          style={{ height: `${h}%`, minHeight: 4 }} />
                        <p className="text-[9px] text-neutral-500 mt-1">{stage}</p>
                        <p className="text-[10px] font-bold">{String(count)}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ Deep Analysis ═══ */}
        {activeTab === 'deep' && (
          <div className="space-y-4">
            {/* AI Insights */}
            <Card className="border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardContent>
                <div className="flex items-start gap-3 p-2">
                  <Brain className="w-8 h-8 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">AI 深度洞察</h3>
                    <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                      <p>📌 <b>机会点：</b>{analytics.totalValue > 5000000
                        ? `${customerName} 是典型的大客户，商机总额 ${cur(analytics.totalValue)}，建议建立专属客户成功团队，深耕AI/云产品线。`
                        : `${customerName} 属于成长型客户，当前合作深度有限，建议通过产品试用和方案演示拓展合作面。`}</p>
                      <p>⚠️ <b>风险点：</b>{analytics.winRate < 30
                        ? `赢单率仅 ${analytics.winRate}%，远低于平均水平。${analytics.partners.length > 1 ? '多伙伴竞争导致价格战，' : ''}建议强化方案差异化。`
                        : `赢单率 ${analytics.winRate}%，处于健康水平。需关注 ${analytics.activeDeals} 个活跃商机的推进节奏。`}</p>
                      <p>🎯 <b>建议策略：</b>
                        {analytics.hasIT ? '该客户已具备数字化基础，可重点推进AI智算平台和安全产品的交叉销售。' : '优先推进基础云平台产品，建立技术信任后再拓展高价值产品线。'}
                        建议在 {analytics.regions[0] || '核心'} 区域安排高层拜访。</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deal List */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-4 h-4 text-neutral-600" />商机明细 ({deals.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {deals.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => navigate(`/deals/${d.id}`)}>
                      <span className="font-semibold flex-1 truncate">{d.title}</span>
                      <Badge variant={d.stage === 'ClosedWon' ? 'success' : d.stage === 'ClosedLost' ? 'danger' : 'info'} size="sm">{d.stage}</Badge>
                      <span className="text-neutral-500">{cur(d.value)}</span>
                      <span className="text-[10px] text-neutral-400">{d.partner_name}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
