import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';
import {
  ArrowLeft, TrendingUp, Users, Target, Award, Download, FileText, Save, ThumbsUp,
  BarChart3, PieChart, Clock, CheckCircle2, AlertTriangle, Star, Zap, Shield,
  Search, ChevronRight, Calendar, Building2, Layers, Filter
} from 'lucide-react';

const cur = (v: number) => formatCurrency(v, 'CNY');

const NAV_ITEMS = [
  { id: 'overview', label: '总体概览', icon: BarChart3 },
  { id: 'policy', label: '政策回溯', icon: Shield },
  { id: 'participants', label: '参与明细', icon: Users },
  { id: 'finance', label: '财务结算', icon: TrendingUp },
  { id: 'conclusion', label: '建议总结', icon: Star },
];

export const IncentiveClosingDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partnerSearch, setPartnerSearch] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const load = async () => {
      try {
        const { data } = await supabase.from('incentive_programs').select('*').eq('id', id).single();
        if (data) setProgram(data);
      } catch { /* not found */ }
      setLoading(false);
    };
    load();
  }, [id]);

  const pct = program?.totalBudget > 0 ? Math.round((program.claimedAmount / program.totalBudget) * 100) : 0;
  const roi = program?.claimedAmount > 0 ? (program.totalBudget / program.claimedAmount).toFixed(1) : '0';
  const pipelineValue = Math.round((program?.claimedAmount || 0) * parseFloat(roi || '0'));

  // Simulated deep data
  const TOP_PARTNERS = [
    { name: '神州数码', tier: '钻石', deals: 12, incentive: 280000, conversion: 58, region: '华北', newClients: 5 },
    { name: '东软集团', tier: '金牌', deals: 8, incentive: 180000, conversion: 45, region: '东北', newClients: 3 },
    { name: '浪潮集团', tier: '金牌', deals: 6, incentive: 120000, conversion: 33, region: '华东', newClients: 2 },
    { name: '中科软', tier: '银牌', deals: 5, incentive: 85000, conversion: 40, region: '华东', newClients: 1 },
    { name: '华为云', tier: '钻石', deals: 4, incentive: 72000, conversion: 50, region: '华南', newClients: 4 },
    { name: '上海宝信', tier: '银牌', deals: 3, incentive: 45000, conversion: 28, region: '华东', newClients: 0 },
    { name: '北京华胜', tier: '铜牌', deals: 2, incentive: 20000, conversion: 20, region: '华北', newClients: 1 },
  ];

  const DORMANT_PARTNERS = [
    { name: '广州智云', reason: '库存不足，无法承接新项目' },
    { name: '深圳鹏城', reason: '竞品拦截，已签约其他品牌' },
    { name: '成都天府', reason: '规则门槛过高，报备流程复杂' },
  ];

  const filteredPartners = TOP_PARTNERS.filter(p => !partnerSearch || p.name.includes(partnerSearch) || p.region.includes(partnerSearch));

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

      {/* Left Nav + Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar Nav */}
        <nav className="w-48 shrink-0 space-y-1 sticky top-6 self-start">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* ═══ Section 1: Overview ═══ */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: '预算执行率', value: `${pct}%`, sub: `${cur(program.claimedAmount)} / ${cur(program.totalBudget)}`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: '商机拉动', value: cur(pipelineValue), sub: `达标率 ${Math.round((pipelineValue / Math.max(program.totalBudget * 2, 1)) * 100)}%`, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: '参与伙伴数', value: String(program.participantsCount), sub: `活跃率 ${Math.round(program.participantsCount / Math.max(program.participantsCount + 15, 1) * 100)}%`, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                  { label: '新客占比', value: '35%', sub: '激励带来新客户', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                ].map((k, i) => (
                  <Card key={i}><div className={cn('p-4 text-center rounded-xl', k.bg)}>
                    <p className="text-[11px] text-neutral-500">{k.label}</p>
                    <p className={cn('text-2xl font-extrabold mt-1', k.color)}>{k.value}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{k.sub}</p>
                  </div></Card>
                ))}
              </div>
              <Card>
                <CardContent>
                  <h3 className="text-sm font-bold mb-3">📈 预算消耗 vs 商机增长</h3>
                  <svg width="100%" height="60" viewBox="0 0 400 60">
                    {[0, 20, 40, 60].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#f0f0f0" strokeWidth="0.5" />)}
                    <polyline points="0,50 80,48 160,42 240,35 320,20 360,12 400,8" fill="none" stroke="#2563eb" strokeWidth="2" />
                    <polyline points="0,55 80,52 160,48 240,42 320,28 360,16 400,5" fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="4 2" />
                    <circle cx="320" cy="28" r="4" fill="#dc2626" />
                    <text x="320" y="22" textAnchor="middle" fontSize="7" fill="#dc2626">培训会</text>
                    <text x="5" y="10" fontSize="7" fill="#2563eb">预算消耗</text>
                    <text x="5" y="16" fontSize="7" fill="#059669">商机增长</text>
                  </svg>
                  <div className="text-[10px] text-neutral-400 mt-1 text-center">5/20 培训后商机增长陡增 40% · 政策截止前两周出现冲刺效应</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ Section 2: Policy Blueprint ═══ */}
          {activeSection === 'policy' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-purple-600" />激励规则可视化</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                      <p className="text-[10px] text-neutral-500">报备商机</p>
                      <p className="font-bold text-blue-600">单值 &gt; ¥10万</p>
                    </div>
                    <span className="text-xl text-neutral-300">→</span>
                    <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                      <p className="text-[10px] text-neutral-500">返点比例</p>
                      <p className="font-bold text-amber-600">2% 返点</p>
                    </div>
                    <span className="text-xl text-neutral-300">→</span>
                    <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                      <p className="text-[10px] text-neutral-500">成交额达标</p>
                      <p className="font-bold text-emerald-600">额外奖 ¥5万</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent>
                  <h4 className="text-xs font-semibold mb-2">🎯 适用对象</h4>
                  <div className="space-y-1 text-[11px] text-neutral-600">
                    <div>✅ 钻石/金牌/银牌 伙伴</div>
                    <div>✅ 全部产品线</div>
                    <div>✅ 全国区域</div>
                    <div>❌ 铜牌伙伴不可参与</div>
                  </div>
                </CardContent></Card>
                <Card><CardContent>
                  <h4 className="text-xs font-semibold mb-2">📅 关键里程碑</h4>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> {program.start_date?.slice(0, 10)} 政策发布</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> 05/20 线上宣贯会</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> 06/10 中期优化</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> {program.end_date?.slice(0, 10)} 政策截止</div>
                  </div>
                </CardContent></Card>
                <Card><CardContent>
                  <h4 className="text-xs font-semibold mb-2">📝 规则修订</h4>
                  <div className="text-[11px] text-neutral-500">
                    <p>06/10: 新增华南区额外 0.5% 激励，应对竞品冲击</p>
                    <p className="mt-1">06/15: 调整审批流程，缩短结算周期至 7 个工作日</p>
                  </div>
                </CardContent></Card>
              </div>
            </div>
          )}

          {/* ═══ Section 3: Participant Deep-dive ═══ */}
          {activeSection === 'participants' && (
            <div className="space-y-6">
              {/* Funnel */}
              <Card>
                <CardContent>
                  <h3 className="text-sm font-bold mb-4">📊 伙伴转化漏斗</h3>
                  <div className="flex items-end justify-center gap-8 px-8">
                    {[
                      { label: '触达', count: program.participantsCount * 3, color: 'bg-blue-400', h: 40 },
                      { label: '意向', count: Math.round(program.participantsCount * 1.8), color: 'bg-blue-500', h: 60 },
                      { label: '报备', count: program.participantsCount, color: 'bg-indigo-500', h: 80 },
                      { label: '获激励', count: Math.round(program.participantsCount * 0.7), color: 'bg-emerald-500', h: 100 },
                    ].map((f, i) => (
                      <div key={i} className="text-center">
                        <div className={cn('text-white rounded-t-lg flex items-end justify-center pb-2 font-bold', f.color)} style={{ width: 80, height: f.h }}>
                          <span className="text-lg">{f.count}</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">{f.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* TOP Contributors */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-600" />TOP 贡献者画像</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {TOP_PARTNERS.slice(0, 5).map((p, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        onClick={() => alert(`${p.name} 专项激励月报\n\n等级: ${p.tier}\n区域: ${p.region}\n报备: ${p.deals}个\n激励: ${cur(p.incentive)}\n转化率: ${p.conversion}%\n新客户: ${p.newClients}个\n\n详细报备单号可在此处展开`)}>
                        <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold', i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-neutral-400' : i === 2 ? 'bg-amber-700' : 'bg-neutral-500')}>
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{p.name}</span>
                            <Badge size="sm" variant={p.tier === '钻石' ? 'brand' : p.tier === '金牌' ? 'warning' : 'default'}>{p.tier}</Badge>
                            <span className="text-[10px] text-neutral-400">{p.region}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-neutral-500 mt-1">
                            <span>报备 {p.deals}个</span><span>激励 {cur(p.incentive)}</span><span>转化率 {p.conversion}%</span><span>新客 {p.newClients}个</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dormant */}
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" />沉睡伙伴分析</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {DORMANT_PARTNERS.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[12px]">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-neutral-500">原因：{p.reason}</span>
                        <Button variant="outline" size="sm" className="text-[10px]">推送政策</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ Section 4: Finance ═══ */}
          {activeSection === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: '已发放', value: cur(program.claimedAmount * 0.85), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: '待发放', value: cur(program.claimedAmount * 0.1), color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: '不合规扣除', value: cur(program.claimedAmount * 0.05), color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: '预算余额', value: cur(Math.max(0, program.totalBudget - program.claimedAmount)), color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                ].map((f, i) => (
                  <Card key={i}><div className={cn('p-4 rounded-xl text-center', f.bg)}>
                    <p className="text-[11px] text-neutral-500">{f.label}</p><p className={cn('text-xl font-extrabold mt-1', f.color)}>{f.value}</p>
                  </div></Card>
                ))}
              </div>
              <Card>
                <CardHeader><CardTitle>💳 支付渠道配比</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-6">
                    <svg width="100" height="100" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="14" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle cx="20" cy="20" r="14" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray="52.8 88" transform="rotate(-90 20 20)" />
                      <circle cx="20" cy="20" r="14" fill="none" stroke="#059669" strokeWidth="8" strokeDasharray="17.6 88" strokeDashoffset="-52.8" transform="rotate(-90 20 20)" />
                      <circle cx="20" cy="20" r="14" fill="none" stroke="#7c3aed" strokeWidth="8" strokeDasharray="17.6 88" strokeDashoffset="-70.4" transform="rotate(-90 20 20)" />
                    </svg>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> 现金返点 60% — {cur(program.claimedAmount * 0.6)}</div>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /> MDF基金 20% — {cur(program.claimedAmount * 0.2)}</div>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500" /> 抵扣券 20% — {cur(program.claimedAmount * 0.2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ Section 5: Conclusion ═══ */}
          {activeSection === 'conclusion' && (
            <div className="space-y-6">
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/30">
                <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />成功因子</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-neutral-600">
                    <div className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> 阶梯奖励机制极大刺激了季末冲刺，最后两周报备量增长 40%</div>
                    <div className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> 线上培训会有效激活了沉睡伙伴，会后一周参与度提升 25%</div>
                    <div className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> 新客户占比 35%，证明政策有效拓展了增量市场</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30">
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" />避坑指南</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-neutral-600">
                    <div className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">!</span> 审批流程偏慢(平均5天)，部分伙伴反馈影响积极性，建议下期缩短至3天</div>
                    <div className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">!</span> 华南区参与度低于预期，竞品同期推出类似政策形成分流</div>
                    <div className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">!</span> 铜牌伙伴被排除但占比20%，建议下期增加低门槛参与通道</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <h3 className="text-sm font-bold mb-2">🧠 AI 结案陈词</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    本计划已圆满结束，通过 {pct}% 的预算消耗拉动了 {cur(pipelineValue)} 商机。核心增长点在于「阶梯奖励+季末冲刺」的组合机制，有效激发了伙伴的报备热情。建议下季度复刻该策略，同时优化审批流程（缩短至3天）并增加华南区专项推广预算。推荐评级：<span className="font-bold text-amber-600">S级 · 建议存入金牌模版库</span>。
                  </p>
                </CardContent>
              </Card>
              <div className="flex gap-3">
                <Button variant="brand" onClick={() => alert('PDF报告已生成并下载')}><Download className="w-4 h-4 mr-2" />下载完整PDF报告</Button>
                <Button variant="secondary" onClick={() => alert('Excel明细已导出')}><FileText className="w-4 h-4 mr-2" />导出参与明细Excel</Button>
                <Button variant="outline" onClick={() => alert('已存入高产出模版库，可在模版库中克隆复用')}><Save className="w-4 h-4 mr-2" />存入金牌模版库</Button>
                <Button variant="outline" onClick={() => alert(`已向TOP10伙伴发送感谢信和额外积分`)}><ThumbsUp className="w-4 h-4 mr-2" />感谢Top10</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
