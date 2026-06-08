import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';
import {
  ArrowLeft, TrendingUp, Users, Target, Award, Download, FileText, Save, ThumbsUp,
  BarChart3, PieChart, Clock, CheckCircle2, AlertTriangle, Star, Zap, Shield,
  Search, ChevronRight, ChevronDown, Calendar, Building2, Layers, Filter, Edit3,
  X, Plus, RefreshCw, MapPin, TrendingDown, Eye
} from 'lucide-react';

const cur = (v: number) => formatCurrency(v, 'CNY');

const NAV_ITEMS = [
  { id: 'overview', label: '总体概览', icon: BarChart3 },
  { id: 'policy', label: '政策回溯', icon: Shield },
  { id: 'participants', label: '参与明细', icon: Users },
  { id: 'finance', label: '财务结算', icon: TrendingUp },
  { id: 'conclusion', label: '建议总结', icon: Star },
];

// Expanded partner deal timeline data
const PARTNER_DEALS: Record<string, Array<{ id: string; date: string; amount: number; stage: string; product: string; region: string }>> = {
  '神州数码': [
    { id: 'D001', date: '06-02', amount: 350000, stage: 'Won', product: '云平台', region: '华北' },
    { id: 'D002', date: '06-08', amount: 280000, stage: 'Won', product: 'AI平台', region: '华北' },
    { id: 'D003', date: '06-15', amount: 420000, stage: 'Won', product: '大数据', region: '华东' },
    { id: 'D004', date: '06-22', amount: 350000, stage: 'Pending', product: '安全产品', region: '华北' },
  ],
  '东软集团': [
    { id: 'D011', date: '06-05', amount: 220000, stage: 'Won', product: '云平台', region: '东北' },
    { id: 'D012', date: '06-12', amount: 180000, stage: 'Won', product: 'AI平台', region: '东北' },
    { id: 'D013', date: '06-20', amount: 300000, stage: 'Lost', product: '大数据', region: '东北' },
  ],
  '浪潮集团': [
    { id: 'D021', date: '06-03', amount: 200000, stage: 'Won', product: '云平台', region: '华东' },
    { id: 'D022', date: '06-18', amount: 250000, stage: 'Won', product: '安全产品', region: '华东' },
  ],
  '中科软': [
    { id: 'D031', date: '06-10', amount: 150000, stage: 'Won', product: 'AI平台', region: '华东' },
    { id: 'D032', date: '06-25', amount: 180000, stage: 'Pending', product: '云平台', region: '华东' },
  ],
  '华为云': [
    { id: 'D041', date: '06-01', amount: 500000, stage: 'Won', product: '大数据', region: '华南' },
    { id: 'D042', date: '06-14', amount: 300000, stage: 'Won', product: '云平台', region: '华南' },
  ],
};

const REGIONS = ['全部', '华北', '华东', '华南', '东北', '西南'];

export const IncentiveClosingDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('全部');
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [editBudgetVal, setEditBudgetVal] = useState('');
  const [editingConclusion, setEditingConclusion] = useState(false);
  const [conclusionText, setConclusionText] = useState('');
  const [adjustedBudget, setAdjustedBudget] = useState<number | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const load = async () => {
      try {
        const { data } = await supabase.from('incentive_programs').select('*').eq('id', id).single();
        if (data) {
          setProgram(data);
          setConclusionText(`本计划已圆满结束，通过 ${Math.round((data.claimedAmount / Math.max(data.totalBudget, 1)) * 100)}% 的预算消耗拉动了显著商机。核心增长点在于「阶梯奖励+季末冲刺」的组合机制，建议下季度复刻该策略并增加区域专项推广。`);
        }
      } catch { /* not found */ }
      setLoading(false);
    };
    load();
  }, [id]);

  const effectiveBudget = adjustedBudget ?? program?.totalBudget ?? 0;
  const pct = effectiveBudget > 0 ? Math.round(((program?.claimedAmount ?? 0) / effectiveBudget) * 100) : 0;
  const roi = (program?.claimedAmount ?? 0) > 0 ? (effectiveBudget / (program?.claimedAmount || 1)).toFixed(1) : '0';
  const pipelineValue = Math.round((program?.claimedAmount || 0) * parseFloat(roi || '0'));

  const TOP_PARTNERS = [
    { name: '神州数码', tier: '钻石', deals: 4, incentive: 280000, conversion: 58, region: '华北', newClients: 5 },
    { name: '东软集团', tier: '金牌', deals: 3, incentive: 180000, conversion: 45, region: '东北', newClients: 3 },
    { name: '浪潮集团', tier: '金牌', deals: 2, incentive: 120000, conversion: 33, region: '华东', newClients: 2 },
    { name: '中科软', tier: '银牌', deals: 2, incentive: 85000, conversion: 40, region: '华东', newClients: 1 },
    { name: '华为云', tier: '钻石', deals: 2, incentive: 72000, conversion: 50, region: '华南', newClients: 4 },
  ];

  const DORMANT_PARTNERS = [
    { name: '广州智云', reason: '库存不足，无法承接新项目', region: '华南' },
    { name: '深圳鹏城', reason: '竞品拦截，已签约其他品牌', region: '华南' },
    { name: '成都天府', reason: '规则门槛过高，报备流程复杂', region: '西南' },
  ];

  const filteredPartners = TOP_PARTNERS.filter(p => regionFilter === '全部' || p.region === regionFilter);
  const filteredDormant = DORMANT_PARTNERS.filter(p => regionFilter === '全部' || p.region === regionFilter);

  // Funnel data by region
  const funnelData = useMemo(() => {
    const all = TOP_PARTNERS;
    const filtered = regionFilter === '全部' ? all : all.filter(p => p.region === regionFilter);
    const totalDeals = filtered.reduce((s, p) => s + p.deals, 0);
    return {
      reach: totalDeals * 4 + (regionFilter === '全部' ? DORMANT_PARTNERS.length * 3 : filteredDormant.length * 3),
      intent: Math.round(totalDeals * 2.5),
      registered: totalDeals,
      rewarded: Math.round(totalDeals * 0.7),
    };
  }, [regionFilter]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-neutral-400">加载中...</div>;
  if (!program) return <div className="flex flex-col items-center justify-center min-h-screen gap-3"><p className="text-lg font-semibold text-neutral-400">未找到该激励计划</p><Button variant="secondary" onClick={() => navigate('/incentives')}>返回列表</Button></div>;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <button onClick={() => navigate('/incentives')} className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" />返回激励政策列表
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-extrabold">{program.title}</h1>
                <Badge variant="default" className="bg-white/20 text-white border-white/30">已结束</Badge>
              </div>
              <p className="text-white/70 text-sm">{program.trigger_type} · {program.payout_type} · {program.start_date?.slice(0, 10)} ~ {program.end_date?.slice(0, 10)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">总 ROI</p>
              <p className="text-4xl font-extrabold">{roi}x</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar */}
        <nav className="w-48 shrink-0 space-y-1 sticky top-6 self-start">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                activeSection === item.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
              <item.icon className="w-4 h-4" />{item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0 space-y-6">
          {/* ═══ OVERVIEW ═══ */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: '预算执行率', value: `${pct}%`, sub: `${cur(program.claimedAmount)} / ${cur(effectiveBudget)}`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: '商机拉动', value: cur(pipelineValue), sub: `达标率 ${Math.round((pipelineValue / Math.max(effectiveBudget * 2, 1)) * 100)}%`, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: '参与伙伴', value: String(program.participantsCount), sub: `活跃率 ${Math.round(program.participantsCount / Math.max(program.participantsCount + 15, 1) * 100)}%`, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                  { label: '新客占比', value: '35%', sub: '激励带来新客户', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                ].map((k, i) => (
                  <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSection(i === 0 ? 'finance' : i === 2 ? 'participants' : 'overview')}>
                    <div className={cn('p-4 text-center rounded-xl', k.bg)}>
                      <p className="text-[11px] text-neutral-500">{k.label}</p>
                      <p className={cn('text-2xl font-extrabold mt-1', k.color)}>{k.value}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{k.sub}</p>
                    </div>
                  </Card>
                ))}
              </div>
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold">📈 预算消耗 vs 商机增长</h3>
                    <div className="flex items-center gap-2">
                      <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="text-[10px] px-2 py-1 border rounded bg-white dark:bg-neutral-800">
                        {REGIONS.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <svg width="100%" height="80" viewBox="0 0 400 80">
                    {[0, 25, 50, 75].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#f0f0f0" strokeWidth="0.5" />)}
                    <polyline points="0,70 80,65 160,58 240,48 320,30 360,18 400,12" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                    <polyline points="0,75 80,70 160,64 240,55 320,38 360,22 400,8" fill="none" stroke="#059669" strokeWidth="2.5" strokeDasharray="5 3" />
                    <circle cx="240" cy="55" r="5" fill="#dc2626" cursor="pointer"><title>5/20 培训会：商机+40%</title></circle>
                    <circle cx="350" cy="20" r="4" fill="#f59e0b" cursor="pointer"><title>季末冲刺：报备量翻倍</title></circle>
                    <text x="240" y="48" textAnchor="middle" fontSize="7" fill="#dc2626" fontWeight="700">5/20培训</text>
                    <text x="350" y="14" textAnchor="middle" fontSize="7" fill="#f59e0b" fontWeight="700">季末冲刺</text>
                    <text x="5" y="12" fontSize="8" fill="#2563eb" fontWeight="700">预算消耗</text>
                    <text x="5" y="20" fontSize="8" fill="#059669" fontWeight="700">商机增长</text>
                  </svg>
                  <div className="text-[10px] text-neutral-400 mt-2 text-center">
                    点击标记点查看详情 · 拖动时间轴可缩放 · 当前筛选: {regionFilter}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ POLICY ═══ */}
          {activeSection === 'policy' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-purple-600" />激励规则可视化</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all" onClick={() => alert('编辑规则：报备单值阈值')}>
                      <p className="text-[10px] text-neutral-500 flex items-center gap-1">报备商机 <Edit3 className="w-2.5 h-2.5" /></p>
                      <p className="font-bold text-blue-600">单值 &gt; ¥10万</p>
                    </div>
                    <span className="text-xl text-neutral-300">→</span>
                    <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center cursor-pointer hover:ring-2 hover:ring-amber-300 transition-all" onClick={() => alert('编辑规则：返点比例')}>
                      <p className="text-[10px] text-neutral-500 flex items-center gap-1">返点比例 <Edit3 className="w-2.5 h-2.5" /></p>
                      <p className="font-bold text-amber-600">2% 返点</p>
                    </div>
                    <span className="text-xl text-neutral-300">→</span>
                    <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center cursor-pointer hover:ring-2 hover:ring-emerald-300 transition-all" onClick={() => alert('编辑规则：额外奖励')}>
                      <p className="text-[10px] text-neutral-500 flex items-center gap-1">达标奖励 <Edit3 className="w-2.5 h-2.5" /></p>
                      <p className="font-bold text-emerald-600">额外 ¥5万</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent>
                  <h4 className="text-xs font-semibold mb-2">🎯 适用对象 <Edit3 className="w-3 h-3 inline text-neutral-400 cursor-pointer" onClick={() => alert('编辑适用范围')} /></h4>
                  <div className="space-y-1 text-[11px] text-neutral-600">
                    <div>✅ 钻石/金牌/银牌 伙伴</div><div>✅ 全部产品线</div><div>✅ 全国区域</div><div>❌ 铜牌伙伴不可参与</div>
                  </div>
                </CardContent></Card>
                <Card><CardContent>
                  <h4 className="text-xs font-semibold mb-2">📅 关键里程碑 <Plus className="w-3 h-3 inline text-neutral-400 cursor-pointer" onClick={() => alert('添加里程碑')} /></h4>
                  <div className="space-y-2 text-[11px]">
                    {[
                      { d: program.start_date?.slice(0, 10), label: '政策发布', color: 'bg-blue-500' },
                      { d: '05/20', label: '线上宣贯会', color: 'bg-emerald-500' },
                      { d: '06/10', label: '中期优化', color: 'bg-amber-500' },
                      { d: program.end_date?.slice(0, 10), label: '政策截止', color: 'bg-red-500' },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 rounded p-1" onClick={() => alert(`编辑里程碑: ${m.label}`)}>
                        <div className={cn('w-2 h-2 rounded-full', m.color)} />{m.d} {m.label}
                      </div>
                    ))}
                  </div>
                </CardContent></Card>
                <Card><CardContent>
                  <h4 className="text-xs font-semibold mb-2">📝 规则修订 <Plus className="w-3 h-3 inline text-neutral-400 cursor-pointer" onClick={() => alert('添加修订记录')} /></h4>
                  <div className="text-[11px] text-neutral-500 space-y-1">
                    <p className="cursor-pointer hover:bg-neutral-50 rounded p-1" onClick={() => alert('编辑修订: 华南区激励')}>06/10: 新增华南区额外 0.5% 激励</p>
                    <p className="cursor-pointer hover:bg-neutral-50 rounded p-1" onClick={() => alert('编辑修订: 审批流程')}>06/15: 缩短结算周期至 7 个工作日</p>
                  </div>
                </CardContent></Card>
              </div>
            </div>
          )}

          {/* ═══ PARTICIPANTS ═══ */}
          {activeSection === 'participants' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">区域筛选:</span>
                {REGIONS.map(r => (
                  <button key={r} onClick={() => setRegionFilter(r)}
                    className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
                      regionFilter === r ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200')}>{r}</button>
                ))}
              </div>

              {/* Funnel */}
              <Card>
                <CardContent>
                  <h3 className="text-sm font-bold mb-4">📊 伙伴转化漏斗 ({regionFilter})</h3>
                  <div className="flex items-end justify-center gap-8 px-8">
                    {[
                      { label: '触达', count: funnelData.reach, h: 35, color: 'bg-blue-400' },
                      { label: '意向', count: funnelData.intent, h: 55, color: 'bg-blue-500' },
                      { label: '报备', count: funnelData.registered, h: 75, color: 'bg-indigo-500' },
                      { label: '获激励', count: funnelData.rewarded, h: 95, color: 'bg-emerald-500' },
                    ].map((f, i) => (
                      <div key={i} className="text-center cursor-pointer" onClick={() => alert(`${f.label}环节详情\n\n数量: ${f.count}\n可展开查看具体名单`)}>
                        <div className={cn('text-white rounded-t-lg flex items-end justify-center pb-2 font-bold hover:opacity-80 transition-opacity', f.color)} style={{ width: 80, height: f.h }}>
                          <span className="text-lg">{f.count}</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">{f.label}</p>
                        {i > 0 && <p className="text-[9px] text-neutral-400">{Math.round((f.count / funnelData.reach) * 100)}%</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* TOP Partners with expandable rows */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-600" />TOP 贡献者 ({filteredPartners.length}家)</CardTitle></CardHeader>
                <CardContent>
                  {filteredPartners.map((p, i) => {
                    const isExpanded = expandedPartner === p.name;
                    const deals = PARTNER_DEALS[p.name] || [];
                    return (
                      <div key={i}>
                        <div className={cn('flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors', isExpanded ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800')}
                          onClick={() => setExpandedPartner(isExpanded ? null : p.name)}>
                          <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold', i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-neutral-400' : i === 2 ? 'bg-amber-700' : 'bg-neutral-500')}>{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{p.name}</span>
                              <Badge size="sm" variant={p.tier === '钻石' ? 'brand' : p.tier === '金牌' ? 'warning' : 'default'}>{p.tier}</Badge>
                              <span className="text-[10px] text-neutral-400"><MapPin className="w-2.5 h-2.5 inline" />{p.region}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-neutral-500 mt-1">
                              <span>报备 {p.deals}个</span><span>激励 {cur(p.incentive)}</span><span>转化率 {p.conversion}%</span><span>新客 {p.newClients}个</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                        </div>
                        {/* Expanded: Deal Timeline */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="ml-9 pl-4 border-l-2 border-blue-200 dark:border-blue-800 py-2 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">📋 报备订单时间线</h5>
                                  <span className="text-[10px] text-neutral-400">共 {deals.length} 笔 · 总金额 {cur(deals.reduce((s, d) => s + d.amount, 0))}</span>
                                </div>
                                {deals.map((d, j) => (
                                  <div key={j} className="flex items-start gap-3 relative">
                                    <div className={cn('w-2.5 h-2.5 rounded-full mt-1 shrink-0', d.stage === 'Won' ? 'bg-emerald-500' : d.stage === 'Lost' ? 'bg-red-500' : 'bg-amber-500')} />
                                    <div className="flex-1 bg-white dark:bg-neutral-800 rounded-lg p-2 border border-neutral-100 dark:border-neutral-700">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-semibold">{d.id}</span>
                                        <Badge size="sm" variant={d.stage === 'Won' ? 'success' : d.stage === 'Lost' ? 'danger' : 'warning'}>{d.stage === 'Won' ? '赢单' : d.stage === 'Lost' ? '失单' : '进行中'}</Badge>
                                      </div>
                                      <div className="flex items-center gap-3 text-[10px] text-neutral-500 mt-1">
                                        <span>{d.date}</span><span>{d.product}</span><span><MapPin className="w-2.5 h-2.5 inline" />{d.region}</span><span className="font-semibold text-neutral-700">{cur(d.amount)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Dormant */}
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" />沉睡伙伴 ({filteredDormant.length}家)</CardTitle></CardHeader>
                <CardContent>
                  {filteredDormant.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[12px] mb-2 last:mb-0">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-[10px] text-neutral-400"><MapPin className="w-2.5 h-2.5 inline" />{p.region}</span>
                        <span className="text-neutral-500 text-[11px]">{p.reason}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-[10px]" onClick={() => alert(`调整规则: 为${p.name}降低准入门槛`)}><Edit3 className="w-3 h-3 mr-1" />调整规则</Button>
                        <Button variant="brand" size="sm" className="text-[10px]" onClick={() => alert(`已向${p.name}推送政策提醒和简化版参与指南`)}>推送政策</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ FINANCE ═══ */}
          {activeSection === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: '已发放', value: cur((program.claimedAmount ?? 0) * 0.85), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', editable: false },
                  { label: '待发放', value: cur((program.claimedAmount ?? 0) * 0.1), color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', editable: false },
                  { label: '不合规扣除', value: cur((program.claimedAmount ?? 0) * 0.05), color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', editable: false },
                  { label: '预算余额', value: cur(Math.max(0, effectiveBudget - (program.claimedAmount ?? 0))), color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', editable: true },
                ].map((f, i) => (
                  <Card key={i}>
                    <div className={cn('p-4 rounded-xl text-center', f.bg)}>
                      <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1">
                        {f.label}
                        {f.editable && <Edit3 className="w-2.5 h-2.5 cursor-pointer hover:text-blue-500" onClick={() => { setEditingBudget(true); setEditBudgetVal(String(effectiveBudget)); }} />}
                      </p>
                      <p className={cn('text-xl font-extrabold mt-1', f.color)}>{f.value}</p>
                      {f.editable && <p className="text-[9px] text-neutral-400 mt-0.5">点击编辑图标调整预算</p>}
                    </div>
                  </Card>
                ))}
              </div>
              {/* Budget edit modal inline */}
              <AnimatePresence>
                {editingBudget && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-white dark:bg-neutral-800 rounded-xl border-2 border-blue-300 dark:border-blue-700">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">调整总预算：</span>
                      <input type="number" value={editBudgetVal} onChange={e => setEditBudgetVal(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm w-40" />
                      <Button variant="brand" size="sm" onClick={() => { setAdjustedBudget(Number(editBudgetVal)); setEditingBudget(false); }}>确认调整</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingBudget(false)}><X className="w-4 h-4" /></Button>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">调整后预算使用率将重新计算。原预算: {cur(program.totalBudget)}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <Card>
                <CardHeader><CardTitle>💳 支付渠道配比</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-6 flex-wrap">
                    <svg width="100" height="100" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="14" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle cx="20" cy="20" r="14" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray="52.8 88" transform="rotate(-90 20 20)" />
                      <circle cx="20" cy="20" r="14" fill="none" stroke="#059669" strokeWidth="8" strokeDasharray="17.6 88" strokeDashoffset="-52.8" transform="rotate(-90 20 20)" />
                      <circle cx="20" cy="20" r="14" fill="none" stroke="#7c3aed" strokeWidth="8" strokeDasharray="17.6 88" strokeDashoffset="-70.4" transform="rotate(-90 20 20)" />
                    </svg>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: '现金返点', pct: 60, color: 'bg-blue-500', amount: cur((program.claimedAmount ?? 0) * 0.6) },
                        { label: 'MDF基金', pct: 20, color: 'bg-emerald-500', amount: cur((program.claimedAmount ?? 0) * 0.2) },
                        { label: '抵扣券', pct: 20, color: 'bg-purple-500', amount: cur((program.claimedAmount ?? 0) * 0.2) },
                      ].map((ch, i) => (
                        <div key={i} className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded p-1" onClick={() => alert(`调整 ${ch.label} 配比\n当前: ${ch.pct}% — ${ch.amount}`)}>
                          <span className={cn('w-3 h-3 rounded-full', ch.color)} />{ch.label} {ch.pct}% — {ch.amount}
                          <Edit3 className="w-2.5 h-2.5 text-neutral-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ CONCLUSION ═══ */}
          {activeSection === 'conclusion' && (
            <div className="space-y-6">
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />成功因子</CardTitle>
                    <Plus className="w-3.5 h-3.5 text-neutral-400 cursor-pointer" onClick={() => alert('添加成功因子')} />
                  </div>
                </CardHeader>
                <CardContent>
                  {[
                    '阶梯奖励机制极大刺激了季末冲刺，最后两周报备量增长 40%',
                    '线上培训会有效激活了沉睡伙伴，会后一周参与度提升 25%',
                    '新客户占比 35%，证明政策有效拓展了增量市场',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-neutral-600 mb-2 cursor-pointer hover:bg-white/50 rounded p-1" onClick={() => alert(`编辑成功因子 #${i + 1}`)}>
                      <span className="text-emerald-500 mt-0.5">✓</span><span>{text}</span><Edit3 className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" />避坑指南</CardTitle>
                    <Plus className="w-3.5 h-3.5 text-neutral-400 cursor-pointer" onClick={() => alert('添加避坑记录')} />
                  </div>
                </CardHeader>
                <CardContent>
                  {[
                    '审批流程偏慢(平均5天)，部分伙伴反馈影响积极性，建议下期缩短至3天',
                    '华南区参与度低于预期，竞品同期推出类似政策形成分流',
                    '铜牌伙伴被排除但占比20%，建议下期增加低门槛参与通道',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-neutral-600 mb-2 cursor-pointer hover:bg-white/50 rounded p-1" onClick={() => alert(`编辑避坑记录 #${i + 1}`)}>
                      <span className="text-amber-500 mt-0.5">!</span><span>{text}</span><Edit3 className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold">🧠 AI 结案陈词</h3>
                    <Edit3 className="w-3.5 h-3.5 text-neutral-400 cursor-pointer" onClick={() => { setEditingConclusion(true); }} />
                  </div>
                  {editingConclusion ? (
                    <div className="space-y-2">
                      <textarea value={conclusionText} onChange={e => setConclusionText(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" rows={3} />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setEditingConclusion(false)}>取消</Button>
                        <Button variant="brand" size="sm" onClick={() => setEditingConclusion(false)}>保存</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {conclusionText}
                      <br /><span className="text-[11px] text-neutral-400 mt-1 inline-block">点击编辑图标修改结案陈词</span>
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm">推荐评级：</span>
                    <span onClick={() => alert('调整评级')} className="cursor-pointer"><Badge variant="warning" size="md">S级 · 建议存入金牌模版库</Badge></span>
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-3 flex-wrap">
                <Button variant="brand" onClick={() => alert('PDF报告已生成并下载')}><Download className="w-4 h-4 mr-2" />下载完整PDF报告</Button>
                <Button variant="secondary" onClick={() => alert('Excel明细已导出')}><FileText className="w-4 h-4 mr-2" />导出参与明细Excel</Button>
                <Button variant="outline" onClick={() => alert('已存入高产出模版库')}><Save className="w-4 h-4 mr-2" />存入金牌模版库</Button>
                <Button variant="outline" onClick={() => alert('已向TOP10伙伴发送感谢信')}><ThumbsUp className="w-4 h-4 mr-2" />感谢Top10</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
