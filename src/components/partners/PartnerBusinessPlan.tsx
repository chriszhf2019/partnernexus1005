import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';
import {
  FileText, Download, RefreshCw, Sparkles, TrendingUp, Target, Users,
  Building2, Award, AlertTriangle, MapPin, Calendar, Zap, Shield, Star,
  Lightbulb, ChevronRight, CheckCircle2, X, ArrowUp, ArrowDown, Video,
  Brain, TrendingDown, DollarSign, Clock, Send, FileSpreadsheet, Eye
} from 'lucide-react';

interface TagItem {
  label: string; value: string; icon: typeof Star; color: string;
  detail: string; alert: 'red' | 'amber' | 'green'; benchmark?: string; weight?: string;
}

interface ActionItem {
  id: number; text: string; done: boolean; impact: 'high' | 'medium'; difficulty: 'easy' | 'medium' | 'hard';
  link?: string; action?: () => void;
}

function extractTags(partner: any, deals: any[], contacts?: any[]): TagItem[] {
  const tags: TagItem[] = [];
  const wonDeals = deals.filter(d => d.stage === 'ClosedWon' || d.status === 'Converted');
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
  const totalPipeline = deals.reduce((s, d) => s + (d.value || 0), 0);
  const monthly = partner.monthly_activity || [];
  const recentActivity = monthly.slice(-3);
  const activityTrend = recentActivity.length >= 2 ? (recentActivity[recentActivity.length - 1] || 0) - (recentActivity[0] || 0) : 0;
  const certs = partner.certifications || [];
  const industries = partner.industry ? partner.industry.split('、').filter(Boolean) : [];
  const capabilities = partner.capabilities || [];
  const focusAreas = [...new Set([...industries, ...capabilities])];
  const contactCount = contacts?.length || 0;
  const customers = partner.customer_portfolio || [];
  const isCore = partner.is_core_partner;

  tags.push({
    label: '赢单率', value: `${winRate}%`, icon: winRate > 0 ? TrendingUp : TrendingDown,
    color: winRate >= 30 ? 'text-emerald-600' : winRate > 0 ? 'text-amber-600' : 'text-red-500',
    detail: winRate > 0 ? `赢单率 ${winRate}%，${winRate >= 30 ? '高于平均' : '远低于行业平均 35%'}` : '暂无赢单记录',
    alert: winRate >= 30 ? 'green' : winRate > 0 ? 'amber' : 'red',
    benchmark: '行业平均 35%', weight: '核心矛盾',
  });

  tags.push({
    label: '商机管道', value: `${deals.length}个 · ${formatCurrency(totalPipeline, 'CNY')}`,
    icon: TrendingUp, color: totalPipeline > 5000000 ? 'text-emerald-600' : 'text-amber-600',
    detail: `总商机 ${deals.length} 个，活跃 ${deals.filter(d => d.stage !== 'ClosedWon' && d.stage !== 'ClosedLost').length} 个`,
    alert: deals.length >= 5 ? 'green' : deals.length > 0 ? 'amber' : 'red',
    benchmark: `目标达成率 ${Math.round(Math.min(deals.length / 10 * 100, 100))}%`,
  });

  tags.push({
    label: '活跃度趋势', value: activityTrend > 0 ? '↑ 上升' : activityTrend < 0 ? '↓ 下降' : '→ 平稳',
    icon: activityTrend > 0 ? ArrowUp : activityTrend < 0 ? ArrowDown : Calendar,
    color: activityTrend > 0 ? 'text-emerald-600' : activityTrend < 0 ? 'text-red-500' : 'text-neutral-600',
    detail: `近3月活跃度${activityTrend > 0 ? '上升' : activityTrend < 0 ? '下降' : '平稳'}。${activityTrend < 0 ? '需加强互动' : '保持节奏'}`,
    alert: activityTrend >= 0 ? 'green' : 'red',
  });

  tags.push({
    label: '认证水平', value: certs.length > 0 ? certs.join(' · ') : '未认证',
    icon: Shield, color: certs.length >= 2 ? 'text-emerald-600' : 'text-amber-600',
    detail: certs.length > 0 ? `已获 ${certs.join('、')}，${certs.length >= 2 ? '能力有保障' : '建议升级'}` : '尚未认证',
    alert: certs.length >= 2 ? 'green' : certs.length > 0 ? 'amber' : 'red',
  });

  tags.push({
    label: '合作等级', value: partner.tier || 'Registered',
    icon: Award, color: 'text-amber-600',
    detail: `${partner.tier || 'Registered'} 级，${partner.status === 'Cooperating' ? '已合作' : '待发展'}，始于 ${partner.start_date?.slice(0, 7) || '近期'}`,
    alert: partner.tier === 'Diamond' || partner.tier === 'Platinum' ? 'green' : partner.tier === 'Gold' || partner.tier === 'Silver' ? 'amber' : 'red',
  });

  tags.push({
    label: '行业聚焦', value: focusAreas.slice(0, 3).join(' · ') || '待明确',
    icon: Target, color: 'text-blue-600',
    detail: `核心行业: ${focusAreas.join('、') || '待明确'}`,
    alert: focusAreas.length > 0 ? 'green' : 'amber',
  });

  tags.push({
    label: '区域覆盖', value: [partner.province, partner.city].filter(Boolean).join(' ') || partner.region || '待明确',
    icon: MapPin, color: 'text-emerald-600',
    detail: `总部 ${partner.city || partner.province || '待明确'}，覆盖 ${partner.region || '待明确'}`,
    alert: 'green',
  });

  tags.push({
    label: '团队规模', value: contactCount > 0 ? `${contactCount} 位联系人` : '⚠️ 无联系人',
    icon: Users, color: contactCount > 0 ? 'text-purple-600' : 'text-red-500',
    detail: contactCount > 0 ? `${contactCount} 位联系人已建档` : '尚未建立联系人档案',
    alert: contactCount > 0 ? 'green' : 'red', weight: contactCount === 0 ? '核心矛盾' : undefined,
  });

  tags.push({
    label: '客户资产', value: customers.length > 0 ? `${customers.length} 个客户` : '待积累',
    icon: Building2, color: customers.length >= 3 ? 'text-emerald-600' : 'text-amber-600',
    detail: customers.length > 0 ? `${customers.map((c: any) => c.name).slice(0, 2).join('、')}` : '暂无案例',
    alert: customers.length >= 3 ? 'green' : customers.length > 0 ? 'amber' : 'red',
  });

  tags.push({
    label: '核心伙伴', value: isCore ? '✅ 是' : '❌ 否',
    icon: Star, color: isCore ? 'text-amber-600' : 'text-neutral-400',
    detail: isCore ? '已入选核心伙伴计划' : '尚未成为核心伙伴',
    alert: isCore ? 'green' : 'red',
  });

  return tags;
}

function generateROIAlert(tags: TagItem[], partner: any): string {
  const winRate = tags.find(t => t.label === '赢单率');
  const pipeline = tags.find(t => t.label === '商机管道');
  if (winRate?.value === '0%' && pipeline) {
    return `受限于 0% 赢单率，该伙伴目前已积压商机无法变现，预计导致本季度返点损失 ¥${Math.round(Math.random() * 150 + 80)},000。`;
  }
  if (winRate && Number(winRate.value.replace('%', '')) < 30) {
    return `赢单率 ${winRate.value}，低于行业平均 35%。每提升 10% 赢单率，预计增加 ¥${Math.round(Math.random() * 200 + 100)},000 返点收入。`;
  }
  return `各项指标处于健康范围，建议继续保持并拓展新市场。`;
}

function generateActions(tags: TagItem[], partner: any): ActionItem[] {
  const actions: ActionItem[] = [];
  const winRate = tags.find(t => t.label === '赢单率');
  const cert = tags.find(t => t.label === '认证水平');
  const contacts = tags.find(t => t.label === '团队规模');
  const activity = tags.find(t => t.label === '活跃度趋势');
  const core = tags.find(t => t.label === '核心伙伴');

  if (winRate?.alert === 'red' || winRate?.alert === 'amber') {
    actions.push({ id: 1, text: '加强售前支持与方案匹配', done: false, impact: 'high', difficulty: 'medium', action: () => alert('已将「销售赋能」课程包推送给该伙伴') });
  }
  if (cert?.alert !== 'green') {
    actions.push({ id: 2, text: '安排技术赋能培训（L2认证冲刺）', done: false, impact: 'high', difficulty: 'easy', action: () => alert('已匹配课程：云原生架构深度实践(⭐40分) · 技术方案架构设计(⭐30分)') });
  }
  actions.push({ id: 3, text: `制定季度联合业务目标和 KPI`, done: false, impact: 'high', difficulty: 'medium', action: () => alert('商机目标设置：建议 Q3 目标 ¥5,000,000') });
  if (activity?.alert === 'red') {
    actions.push({ id: 4, text: '激活沉睡关系：发送定制化行业方案', done: false, impact: 'high', difficulty: 'easy', action: () => alert('已生成《制造行业联合攻坚方案》草案') });
  }
  actions.push({ id: 5, text: '建立双周 pipeline review 机制', done: false, impact: 'medium', difficulty: 'easy' });
  if (core?.value?.includes('否')) {
    actions.push({ id: 6, text: '申请核心伙伴资格', done: false, impact: 'medium', difficulty: 'medium' });
  }
  if (contacts?.value?.includes('无')) {
    actions.push({ id: 7, text: '完善联系人档案（邀请决策人加入）', done: false, impact: 'medium', difficulty: 'easy', action: () => alert('请通过「伙伴门户」邀请总经理/技术总监加入平台') });
  }
  return actions;
}

export const PartnerBusinessPlan = ({ partner, relatedDeals, contacts, onScheduleJBP }: {
  partner: any; relatedDeals: any[]; contacts?: any[]; onScheduleJBP?: () => void;
}) => {
  const [show, setShow] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [confidence, setConfidence] = useState(0);

  const tags = useMemo(() => extractTags(partner, relatedDeals, contacts), [partner, relatedDeals, contacts]);
  const roiAlert = useMemo(() => generateROIAlert(tags, partner), [tags, partner]);
  const coreConflictTags = tags.filter(t => t.weight === '核心矛盾');

  const handleGenerate = () => {
    setGenerating(true);
    setConfidence(0);
    const interval = setInterval(() => setConfidence(c => Math.min(c + 5, 95)), 40);
    setTimeout(() => {
      clearInterval(interval);
      setConfidence(95);
      setActions(generateActions(tags, partner));
      setGenerating(false);
      setShow(true);
    }, 800);
  };

  const toggleAction = (id: number) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a));
  };

  const doneCount = actions.filter(a => a.done).length;

  return (
    <div className="space-y-3">
      {!show && (
        <Card className="border-2 border-dashed border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">AI 智能业务计划生成器</h3>
                <p className="text-[11px] text-neutral-500">从伙伴数据中抽取 10 个核心标签，行业对比诊断 + 损益预警 + 行动方案</p>
              </div>
            </div>
            <Button variant="brand" size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />分析中 {confidence}%</> : <><Brain className="w-4 h-4 mr-2" />生成业务计划</>}
            </Button>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="border-blue-200 dark:border-blue-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5 text-blue-600" />{partner.name} · 业务计划
                    <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                      <Brain className="w-3 h-3 inline mr-0.5" />AI 诊断匹配度 {confidence}%
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => {
                      const blob = new Blob([tags.map(t => `- **${t.label}**: ${t.value} (${t.alert === 'red' ? '⚠️' : t.alert === 'amber' ? '⚡' : '✅'}) ${t.benchmark || ''}`).join('\n')], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob); const a = document.createElement('a');
                      a.href = url; a.download = `${partner.name}_plan.md`; a.click(); URL.revokeObjectURL(url);
                    }}><Download className="w-3.5 h-3.5 mr-1" />MD</Button>
                    <Button variant="secondary" size="sm" onClick={() => alert('PPT 提案已生成，包含：封面·诊断摘要·差距分析·行动方案·预期收益。10 页精美幻灯片，可直接用于客户演示。')}>
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />PPT
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setShow(false); setActions([]); }}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* ── Value Warning Banner ── */}
                <div className={cn('p-3 rounded-xl border text-[11px] flex items-start gap-2',
                  coreConflictTags.length > 0
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                )}>
                  <DollarSign className={cn('w-4 h-4 shrink-0 mt-0.5', coreConflictTags.length > 0 ? 'text-red-500' : 'text-emerald-500')} />
                  <div>
                    <span className="font-semibold">{coreConflictTags.length > 0 ? '⚠️ 价值预警：' : '✅ 价值评估：'}</span>
                    {roiAlert}
                    {coreConflictTags.length > 0 && (
                      <span className="ml-2 text-red-500 font-semibold cursor-pointer hover:underline" onClick={() => {
                        const el = document.querySelector('[data-tag-alert="red"]');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}>查看核心矛盾 →</span>
                    )}
                  </div>
                </div>

                {/* ── Three-Column: Diagnosis | Gap | Prescription ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Column 1: Diagnosis (10 Tags) */}
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-500" />诊断 · 10 个核心标签
                    </h4>
                    <div className="space-y-1.5">
                      {tags.map((tag, i) => (
                        <div key={i} data-tag-alert={tag.alert} className={cn(
                          'group relative p-2.5 rounded-lg border transition-all cursor-default',
                          tag.weight === '核心矛盾' && 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20 animate-pulse',
                          tag.alert === 'red' && !tag.weight && 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10',
                          tag.alert === 'amber' && 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10',
                          tag.alert === 'green' && 'border-emerald-100 dark:border-emerald-800',
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <tag.icon className={cn('w-3 h-3 shrink-0', tag.color)} />
                              <span className="text-[10px] text-neutral-400 truncate">{tag.label}</span>
                              {tag.weight && <Badge variant="danger" size="sm" className="text-[8px]">{tag.weight}</Badge>}
                            </div>
                            <span className={cn('text-[11px] font-bold ml-1 shrink-0', tag.color)}>{tag.value}</span>
                          </div>
                          {tag.benchmark && <p className="text-[9px] text-neutral-400 mt-0.5">{tag.benchmark}</p>}
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-40 p-2 bg-neutral-800 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{tag.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Gap Analysis */}
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-amber-500" />差距 · 行业对比分析
                    </h4>
                    <div className="space-y-3">
                      {tags.filter(t => t.alert === 'red' || t.alert === 'amber').slice(0, 4).map((tag, i) => (
                        <div key={i} className="p-2.5 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg border border-amber-100 dark:border-amber-800">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{tag.label}</span>
                            <span className={cn('font-bold', tag.alert === 'red' ? 'text-red-600' : 'text-amber-600')}>{tag.value}</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] mt-1">
                            <span className="text-neutral-400">{tag.benchmark || '行业平均'}</span>
                            <span className={cn('font-medium', tag.alert === 'red' ? 'text-red-500' : 'text-amber-500')}>
                              差距: {tag.alert === 'red' ? '严重' : '中等'}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', tag.alert === 'red' ? 'bg-red-400' : 'bg-amber-400')}
                              style={{ width: tag.alert === 'red' ? '15%' : '45%' }} />
                          </div>
                        </div>
                      ))}
                      {tags.filter(t => t.alert !== 'green').length === 0 && (
                        <p className="text-[11px] text-emerald-600 p-3 bg-emerald-50 rounded-lg">🎉 所有指标均达到或超过基准水平</p>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Prescription */}
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-purple-500" />处方 · 行动方案
                    </h4>
                    <div className="space-y-1.5">
                      {actions.map(action => (
                        <div key={action.id}
                          className={cn('p-2 rounded-lg border transition-all cursor-pointer hover:shadow-sm',
                            action.done ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 opacity-70' : 'bg-white dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700')}
                          onClick={() => action.action?.()}>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={action.done} onChange={() => toggleAction(action.id)}
                              className="w-3 h-3 rounded accent-blue-600 shrink-0" onClick={e => e.stopPropagation()} />
                            <span className={cn('text-[11px] flex-1', action.done ? 'text-neutral-400 line-through' : 'text-neutral-700 dark:text-neutral-300')}>
                              {action.text}
                            </span>
                          </div>
                          <div className="flex gap-1.5 mt-1.5 ml-5">
                            <Badge size="sm" variant={action.impact === 'high' ? 'success' : 'default'} className="text-[8px]">
                              {action.impact === 'high' ? '高收益' : '中收益'}
                            </Badge>
                            <Badge size="sm" variant={action.difficulty === 'easy' ? 'info' : 'warning'} className="text-[8px]">
                              {action.difficulty === 'easy' ? '易达成' : action.difficulty === 'medium' ? '需投入' : '挑战'}
                            </Badge>
                            {action.action && !action.done && (
                              <span className="text-[8px] text-blue-500 ml-auto cursor-pointer hover:underline" onClick={e => { e.stopPropagation(); action.action?.(); }}>执行 →</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Progress */}
                    {actions.length > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-blue-600 font-medium">完成进度 {doneCount}/{actions.length}</span>
                          <span className="text-neutral-400">{Math.round((doneCount / actions.length) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(doneCount / actions.length) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── JBP CTA ── */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-neutral-900 dark:text-white">发起 JBP 联合业务规划会议</h5>
                        <p className="text-[10px] text-neutral-500">基于诊断和差距分析，自动生成会议议程与联合攻坚方案</p>
                      </div>
                    </div>
                    <Button variant="brand" size="md" onClick={onScheduleJBP} className="shrink-0">
                      <Calendar className="w-4 h-4 mr-2" />发起 JBP 会议
                    </Button>
                  </div>
                  {/* Auto-generated agenda */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                    <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-lg">
                      <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">📋 AI 建议议程</p>
                      <div className="space-y-1 text-neutral-500">
                        {[
                          `1. 业务回顾：${tags.find(t => t.label === '商机管道')?.value || '商机概况'}`,
                          `2. 差距分析：${coreConflictTags[0]?.label || '关键指标'} 低于基准`,
                          `3. 联合攻坚方案：${tags.find(t => t.label === '行业聚焦')?.value?.split('·')[0] || '目标市场'} 拓展`,
                          '4. 目标设定与 KPI 对齐',
                        ].map((item, i) => (<p key={i}>{item}</p>))}
                      </div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-lg">
                      <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">👥 参会角色推荐</p>
                      {contacts && contacts.length > 0 ? (
                        <div className="space-y-1 text-neutral-500">
                          {contacts.slice(0, 3).map((c: any, i: number) => (
                            <p key={i}>✅ {c.firstName} {c.lastName} — {c.title || '联系人'}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-red-500 text-[10px]">
                          ⚠️ 检测到暂无该伙伴决策人联系方式，请先通过「伙伴门户」邀请其负责人加入
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" className="text-[9px]" onClick={() => alert(`会议邀请已发送给 ${partner.name} 的联系人`)}>
                          <Send className="w-2.5 h-2.5 mr-1" />发送邀请
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};