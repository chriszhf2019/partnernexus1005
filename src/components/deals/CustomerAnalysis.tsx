import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCustomerIntel } from '../../data/customerIntelligence';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';
import {
  ArrowLeft, Building2, Users, Target, TrendingUp, AlertTriangle, Shield,
  DollarSign, Calendar, MapPin, BarChart3, Zap, Lightbulb, ChevronRight,
  ExternalLink, Brain, Clock, CheckCircle2, Eye, Radar, Sparkles,
  FileText, Edit3, Link2, ThumbsUp, TrendingDown, Search, Send
} from 'lucide-react';

const cur = (v: number) => formatCurrency(v, 'CNY');

// 7-factor scoring (0-100)
interface FactorScore {
  score: number; label: string; color: string;
  metrics: Array<{ label: string; value: string }>;
  aiFinding: string;
  sources: string[];
}

function generateFactorScores(customerName: string, deals: any[]): FactorScore[] {
  const intel = getCustomerIntel(customerName, deals);
  return [
    {
      score: intel.scores.scale, label: '行业地位', color: '#2563eb',
      metrics: [
        { label: '年度营收', value: intel.revenue },
        { label: '同比增速', value: intel.revenueGrowth },
        { label: '员工规模', value: intel.employees },
        { label: '行业排名', value: intel.rank },
      ],
      aiFinding: intel.aiFindings[0] || '暂无分析',
      sources: intel.sources || ['企查查', '行业报告'],
    },
    {
      score: intel.scores.strategy, label: '战略愿景', color: '#7c3aed',
      metrics: [
        { label: '战略关键词', value: intel.strategyKeywords.join(' ') },
        { label: '技术投入方向', value: 'AI/大数据/云原生' },
        { label: '数字化转型', value: intel.cloudMaturity + ' 上云' },
      ],
      aiFinding: intel.aiFindings[2] || intel.aiFindings[0] || '暂无分析',
      sources: intel.sources || ['媒体报道', '官网'],
    },
    {
      score: intel.scores.digital, label: '数字化成熟度', color: '#059669',
      metrics: [
        { label: '当前技术栈', value: intel.techStack },
        { label: '招聘热度', value: intel.hiringHot },
        { label: '云化程度', value: intel.cloudMaturity + ' 上云' },
      ],
      aiFinding: intel.aiFindings[1] || '暂无分析',
      sources: ['BOSS直聘/拉勾', '公开技术博客'],
    },
    {
      score: intel.scores.procurement, label: '采购性格', color: '#d97706',
      metrics: [
        { label: '核心供应商', value: intel.topVendors },
        { label: '平均招标周期', value: intel.bidCycle },
        { label: '决策模式', value: intel.decisionMode },
      ],
      aiFinding: '建议以"增量扩容"或"多云备份"名义切入，避免直接替换现有供应商。',
      sources: ['招投标公示', '政府采购网'],
    },
    {
      score: intel.scores.stakeholder, label: '决策人画像', color: '#dc2626',
      metrics: [
        { label: 'CIO/CTO', value: intel.cioProfile },
        { label: '背景', value: intel.cioBackground },
        { label: '关键偏好', value: intel.cioPreference },
      ],
      aiFinding: intel.aiFindings[0] || '暂无分析',
      sources: ['LinkedIn领英', '媒体采访'],
    },
    {
      score: intel.scores.financial, label: '财务健康', color: '#0891b2',
      metrics: [
        { label: '资产负债率', value: intel.debtRatio },
        { label: '现金流', value: intel.cashflow },
        { label: '预估IT预算增幅', value: intel.itBudgetGrowth },
      ],
      aiFinding: 'IT预算充足，对投资回报率(ROI)敏感，需提供详细的TCO对比分析。',
      sources: ['年报财务数据', '行业分析师报告'],
    },
    {
      score: intel.scores.dynamics, label: '重大动态', color: '#e11d48',
      metrics: [
        { label: '近期事件', value: intel.recentEvents.slice(0, 2).join(' · ') || '暂无' },
        { label: '风险预警', value: intel.riskAlerts.slice(0, 2).join(' · ') || '暂无' },
      ],
      aiFinding: intel.aiFindings[0] || '暂无分析',
      sources: ['百度新闻', '36氪/虎嗅', '监管部门公示'],
    },
  ];
}

// AI Strategy
function generateStrategy(customerName: string, deals: any[]): string[] {
  const intel = getCustomerIntel(customerName, deals);
  return [
    `切入时机：建议在${intel.bidCycle.replace('天', '')}天招标窗口期前拜访，利用${intel.recentEvents[0] || '数字化转型'}的时间窗口。`,
    `首选话术：重点谈我们如何帮助${customerName}解决"${intel.strategyKeywords[0]?.replace('#', '') || '数字化转型'}"，突出${intel.cioPreference || 'ROI'}。`,
    `防御策略：警惕${intel.topVendors.split('·')[0]?.trim() || '现有供应商'}在该客户侧的传统优势，主打我们的灵活架构与多云管理差异化。`,
    `ROI论证：准备详细的TCO对比分析，${intel.itBudgetGrowth.includes('+') ? `客户IT预算增长${intel.itBudgetGrowth}，预算窗口良好` : '强调长期成本优化价值'}。`,
  ];
}

export const CustomerAnalysis = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFactor, setSelectedFactor] = useState<number | null>(null);
  const [corrections, setCorrections] = useState<Record<number, string>>({});
  const [showCorrection, setShowCorrection] = useState<number | null>(null);

  const customerName = decodeURIComponent(name || '');

  useEffect(() => {
    if (!customerName) { setLoading(false); return; }
    const load = async () => {
      try {
        const { data } = await supabase.from('deals').select('*')
          .or(`customer_name.eq.${customerName},customer.eq.${customerName}`)
          .order('created_date', { ascending: false });
        if (data) setDeals(data);
      } catch { }
      setLoading(false);
    };
    load();
  }, [customerName]);

  const factors = useMemo(() => generateFactorScores(customerName, deals), [customerName, deals]);
  const strategy = useMemo(() => generateStrategy(customerName, deals), [customerName, deals]);
  const aiConfidence = 85;
  const totalValue = deals.reduce((s, d) => s + (d.value || 0), 0);
  const wonValue = deals.filter(d => d.stage === 'ClosedWon').reduce((s, d) => s + d.value, 0);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-neutral-400">加载中...</div>;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-[1600px] mx-auto px-6 py-5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-2">
            <ArrowLeft className="w-4 h-4" />返回商机列表
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold">{customerName}</h1>
                <span className="px-2 py-1 bg-white/10 rounded-full text-xs flex items-center gap-1">
                  <Brain className="w-3 h-3" />AI 数据置信度 {aiConfidence}%
                </span>
              </div>
              <p className="text-white/50 text-sm mt-1">{deals.length} 个商机 · {cur(totalValue)} 总额 · 赢单 {cur(wonValue)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => alert(`已基于7要素分析生成 ${customerName} 的定制化业务计划。\n\n包含：切入策略 · 推荐话术 · 产品匹配 · 竞品应对方案`)}>
                <Sparkles className="w-4 h-4 mr-1" />一键生成 BP
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main: Radar + Factors + Strategy */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ═══ LEFT: Radar Chart ═══ */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Radar className="w-4 h-4 text-purple-600" />七要素雷达</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  {/* Grid */}
                  {[0.3, 0.6, 1].map(scale => {
                    const pts = factors.map((_, i) => {
                      const angle = (i * 360 / 7 - 90) * Math.PI / 180;
                      const r = 30 + scale * 60;
                      return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                    }).join(' ');
                    return <polygon key={scale} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />;
                  })}
                  {/* Data polygon */}
                  <polygon
                    points={factors.map((f, i) => {
                      const angle = (i * 360 / 7 - 90) * Math.PI / 180;
                      const r = 30 + (f.score / 100) * 60;
                      return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="rgba(37,99,235,0.15)" stroke="#2563eb" strokeWidth="1.5"
                  />
                  {/* Points & Labels */}
                  {factors.map((f, i) => {
                    const angle = (i * 360 / 7 - 90) * Math.PI / 180;
                    const r = 30 + (f.score / 100) * 60 + 12;
                    const x = 100 + r * Math.cos(angle);
                    const y = 100 + r * Math.sin(angle);
                    return (
                      <g key={i}>
                        <circle cx={100 + (30 + (f.score / 100) * 60) * Math.cos(angle)} cy={100 + (30 + (f.score / 100) * 60) * Math.sin(angle)} r="3" fill={f.color} />
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="8" fill={f.color} fontWeight="600">{f.label} {f.score}</text>
                      </g>
                    );
                  })}
                </svg>
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-neutral-500">综合评估</p>
                  <p className="text-lg font-extrabold text-blue-600">
                    {Math.round(factors.reduce((s, f) => s + f.score, 0) / 7)}/100
                  </p>
                  <Badge variant={Math.round(factors.reduce((s, f) => s + f.score, 0) / 7) >= 70 ? 'success' : 'warning'} size="sm">
                    {Math.round(factors.reduce((s, f) => s + f.score, 0) / 7) >= 70 ? '优质客户' : '潜力客户'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ CENTER: 7 Factor Cards ═══ */}
          <div className="lg:col-span-2 space-y-3">
            {factors.map((factor, i) => {
              const isSelected = selectedFactor === i;
              const correction = corrections[i];
              return (
                <Card key={i} className={cn('transition-all cursor-pointer hover:shadow-md',
                  isSelected && 'ring-2 ring-blue-400 dark:ring-blue-600')}
                  onClick={() => setSelectedFactor(isSelected ? null : i)}>
                  <CardContent className="py-3">
                    {/* Header row */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold')}
                        style={{ background: factor.color }}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{factor.label}</h4>
                          <span className="text-[10px] text-neutral-400">评分 {factor.score}/100</span>
                        </div>
                        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full mt-1">
                          <div className="h-full rounded-full transition-all" style={{ width: `${factor.score}%`, background: factor.color }} />
                        </div>
                      </div>
                      <ChevronRight className={cn('w-4 h-4 text-neutral-400 transition-transform', isSelected && 'rotate-90')} />
                    </div>

                    {/* Expanded detail */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 space-y-3">
                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2">
                          {factor.metrics.map((m, j) => (
                            <div key={j} className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                              <p className="text-[9px] text-neutral-400">{m.label}</p>
                              <p className="text-[11px] font-semibold text-neutral-800 dark:text-white">{m.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* AI Finding */}
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <Brain className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 mb-0.5">AI 发现</p>
                              <p className="text-[11px] text-blue-800 dark:text-blue-200">{correction || factor.aiFinding}</p>
                            </div>
                            <button className="shrink-0 text-neutral-400 hover:text-blue-500"
                              onClick={(e) => { e.stopPropagation(); setShowCorrection(showCorrection === i ? null : i); }}>
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                          {/* Correction input */}
                          {showCorrection === i && (
                            <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                              <input
                                placeholder="修正AI发现..."
                                value={corrections[i] || ''}
                                onChange={e => setCorrections(prev => ({ ...prev, [i]: e.target.value }))}
                                className="flex-1 text-[11px] px-2 py-1 border rounded" autoFocus
                              />
                              <Button size="sm" variant="brand" className="text-[9px]" onClick={() => setShowCorrection(null)}>保存</Button>
                            </div>
                          )}
                        </div>

                        {/* Sources */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] text-neutral-400 flex items-center gap-1"><Link2 className="w-2.5 h-2.5" />溯源：</span>
                          {factor.sources.map((src, j) => (
                            <button key={j} className="text-[9px] text-blue-500 hover:underline flex items-center gap-0.5"
                              onClick={(e) => { e.stopPropagation(); alert(`跳转到: ${src}\n\n此处将打开外部链接查看原始数据。`); }}>
                              {src} <ExternalLink className="w-2 h-2" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ═══ RIGHT: AI Strategy ═══ */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />AI 策略建议
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {strategy.map((s, i) => (
                  <div key={i} className={cn('p-3 rounded-lg text-[11px]',
                    i === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800' :
                    i === 1 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800' :
                    i === 2 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800' :
                    'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800')}>
                    <p className="text-[9px] font-semibold mb-1">
                      {i === 0 ? '🎯 切入时机' : i === 1 ? '💬 首选话术' : i === 2 ? '🛡️ 防御策略' : '📊 ROI论证'}
                    </p>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{s}</p>
                  </div>
                ))}

                {/* Checked factors for BP generation */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-700">
                  <p className="text-[10px] font-semibold text-neutral-500 mb-2">勾选要素生成 BP：</p>
                  <div className="space-y-1">
                    {factors.map((f, i) => (
                      <label key={i} className="flex items-center gap-2 text-[10px] cursor-pointer">
                        <input type="checkbox" defaultChecked={f.score < 70} className="w-3 h-3 rounded accent-blue-600" />
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color }} />
                        {f.label} ({f.score}分)
                        {f.score < 70 && <span className="text-red-500 text-[8px]">待突破</span>}
                      </label>
                    ))}
                  </div>
                  <Button variant="brand" size="sm" className="w-full mt-3 text-[11px]"
                    onClick={() => alert(`已基于选中要素生成${customerName}的定制业务计划。\n\n包含：\n1. 切入策略与时间窗口\n2. 推荐话术与产品匹配\n3. 竞品应对方案\n4. ROI对比分析\n\n可下载为PPT格式用于客户拜访。`)}>
                    <FileText className="w-3.5 h-3.5 mr-1" />生成定制 BP
                  </Button>
                </div>

                {/* Sales actions */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-700 space-y-2">
                  <p className="text-[10px] font-semibold text-neutral-500">快捷操作</p>
                  <Button variant="secondary" size="sm" className="w-full text-[10px]" onClick={() => { alert(`已保存${customerName}的7要素分析报告到客户档案`); navigate('/deals'); }}>
                    <Send className="w-3 h-3 mr-1" />分享给销售团队
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};