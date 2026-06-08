import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useMarketingData } from '../../hooks/useData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Gift, TrendingUp, Users, Target, Plus, Calendar, Settings, BarChart3, FileText, X, RefreshCw, Layers, Eye, Edit, Download, Bell, AlertCircle, TrendingDown, PieChart, Award, Zap, Shield, Check, Send, ThumbsUp, Briefcase, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// 概览页面组件
const IncentivesOverview: React.FC = () => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const { incentivePrograms, incentiveStats } = useMarketingData();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', trigger_type: 'Pipeline Gap', payout_type: 'Cash', total_budget: '', description: '', start_date: '', end_date: '' });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  const handleCreate = async () => {
    if (!form.title || !form.total_budget) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('incentive_programs').insert({
        title: form.title, trigger_type: form.trigger_type, payout_type: form.payout_type,
        total_budget: Number(form.total_budget), description: form.description,
        start_date: form.start_date, end_date: form.end_date, status: 'Active',
        claimed_amount: 0, participants_count: 0,
      });
      if (error) throw new Error(error.message);
      setShowCreate(false);
      setForm({ title: '', trigger_type: 'Pipeline Gap', payout_type: 'Cash', total_budget: '', description: '', start_date: '', end_date: '' });
    } catch (err) {
      console.error('Failed to create incentive program:', err);
    } finally {
      setCreating(false);
    }
  };

  // AI insights
  const aiInsight = useMemo(() => {
    const alerts: string[] = [];
    const overBudget = incentivePrograms.filter((p: any) => p.totalBudget > 0 && (p.claimedAmount / p.totalBudget) > 0.9).map((p: any) => p.title);
    const noParticipation = incentivePrograms.filter((p: any) => p.participantsCount === 0 && p.status === 'Active').map((p: any) => p.title);
    if (overBudget.length) alerts.push(`「${overBudget.join('、')}」预算使用率超过90%，建议追加预算或调整发放节奏`);
    if (noParticipation.length) alerts.push(`「${noParticipation.join('、')}」参与率为0，建议优化准入门槛或加强推广`);
    if (!alerts.length) alerts.push('所有激励计划运行正常，预算和参与率均在健康范围');
    return alerts.join('；');
  }, [incentivePrograms]);

  // Budget alerts count
  const budgetAlerts = useMemo(() => {
    return incentivePrograms.filter((p: any) => p.status === 'Active' && p.totalBudget > 0 && (p.claimedAmount / p.totalBudget) > 0.9).length;
  }, [incentivePrograms]);

  // Days remaining calc
  const daysRemaining = (endDate: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    return diff;
  };

  // ROI estimate (claimed * 1.5~3.5 based on program type)
  const estimateROI = (p: any) => {
    if (!p.claimedAmount) return '0';
    const multiplier = p.trigger_type === 'New Product' ? 3.5 : p.trigger_type === 'Pipeline Gap' ? 2.8 : 2.0;
    return (multiplier).toFixed(1);
  };

  // Filtered programs
  const filteredPrograms = useMemo(() => {
    let result = [...incentivePrograms];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p: any) => p.title?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s) || p.trigger_type?.toLowerCase().includes(s));
    }
    if (statusFilter !== 'all') result = result.filter((p: any) => p.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter((p: any) => p.trigger_type === typeFilter);
    return result;
  }, [incentivePrograms, search, statusFilter, typeFilter]);

  const triggerTypes = useMemo(() => [...new Set(incentivePrograms.map((p: any) => p.trigger_type))], [incentivePrograms]);

  const statusVariant = (s: string) => s === 'Active' ? 'success' as const : s === 'Upcoming' ? 'info' as const : 'default' as const;
  const statusLabel = (s: string) => s === 'Active' ? '进行中' : s === 'Upcoming' ? '即将开始' : '已结束';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('incentives.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">管理合作伙伴激励计划，推动业绩增长</p>
        </div>
        <Button variant="brand" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />新建激励计划
        </Button>
      </div>

      {/* AI Insight Banner — compact single line */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800 text-[10px] overflow-hidden">
        <span className="shrink-0 font-semibold text-blue-700 dark:text-blue-300">💡 AI洞察：</span>
        <span className="text-neutral-600 dark:text-neutral-400 truncate">{aiInsight}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-3">
            <p className="text-[10px] text-neutral-500">活跃计划</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">{incentiveStats.totalActivePrograms}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">↑1 本季</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              总预算 {cur(incentiveStats.totalBudget || 0)} · 回报率 {(incentiveStats.totalBudget || 0) > 0 ? ((incentiveStats.totalBudget || 1) / Math.max(incentiveStats.totalPayoutYTD || 1, 1)).toFixed(1) : '0'}x
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-3">
            <p className="text-[10px] text-neutral-500">已申领金额</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">{cur(incentiveStats.totalPayoutYTD)}</span>
              <span className="text-[10px] text-red-500 font-semibold">↑12%</span>
            </div>
            <svg width="60" height="18" className="mt-1"><polyline points="0,14 15,10 30,8 45,5 60,3" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </Card>
        <Card className={budgetAlerts > 0 ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/10' : ''}>
          <div className="p-3">
            <p className="text-[10px] text-neutral-500">⚠️ 预算预警</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={cn('text-2xl font-extrabold', budgetAlerts > 0 ? 'text-red-600' : 'text-neutral-900 dark:text-white')}>{budgetAlerts}</span>
              <span className="text-[10px] text-neutral-400">项</span>
            </div>
            <p className="text-[10px] text-red-500 mt-1">{budgetAlerts > 0 ? '预算使用率超90%，点击处理' : '预算使用率正常'}</p>
          </div>
        </Card>
        <Card>
          <div className="p-3">
            <p className="text-[10px] text-neutral-500">总 ROI</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-emerald-600">{(incentiveStats.totalBudget || 0) > 0 ? ((incentiveStats.totalBudget || 1) / Math.max(incentiveStats.totalPayoutYTD || 1, 1)).toFixed(1) : '0'}x</span>
              <span className="text-[10px] text-emerald-600 font-semibold">↑0.3</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">总参与 {incentivePrograms.reduce((s: number, p: any) => s + (p.participantsCount || 0), 0)} 伙伴 · 均参与率 {incentiveStats.avgParticipationRate}%</p>
          </div>
        </Card>
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-1 bg-white dark:bg-neutral-800 rounded-lg px-3 py-2 border border-neutral-200 dark:border-neutral-700">
          <span className="text-neutral-400 text-sm">🔍</span>
          <input
            placeholder="搜索计划名称、类型..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[11px] outline-none text-neutral-700 dark:text-neutral-300"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-2 rounded-lg border text-[11px] bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600">
          <option value="all">全部状态</option>
          <option value="Active">进行中</option>
          <option value="Upcoming">即将开始</option>
          <option value="Ended">已结束</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 px-2 rounded-lg border text-[11px] bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600">
          <option value="all">全部类型</option>
          {triggerTypes.map((t: any) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-[10px] text-neutral-400 whitespace-nowrap">{filteredPrograms.length} 项</span>
        <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
          <button onClick={() => setViewMode('card')} className={cn('px-2 py-1 rounded text-[11px]', viewMode === 'card' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-500')}>🀄</button>
          <button onClick={() => setViewMode('list')} className={cn('px-2 py-1 rounded text-[11px]', viewMode === 'list' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-500')}>📋</button>
        </div>
      </div>

      {/* Program Cards / List */}
      <div className={cn(viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2')}>
        {filteredPrograms.map((p: any) => {
          const pct = p.totalBudget > 0 ? Math.round((p.claimedAmount / p.totalBudget) * 100) : 0;
          const days = daysRemaining(p.end_date);
          const isOverBudget = pct > 90;
          const isNearEnd = days !== null && days <= 7 && days > 0;
          const isEnded = p.status === 'Ended' || (days !== null && days <= 0);
          const roi = estimateROI(p);
          const isHovered = hoveredCard === p.id;
          const pipelineValue = Math.round(p.claimedAmount * Number(roi));
          // Frozen amount estimate: 20% of claimed
          const frozenAmount = Math.round(p.claimedAmount * 0.2);
          const remainingAmount = Math.max(0, p.totalBudget - p.claimedAmount - frozenAmount);

          if (viewMode === 'list') {
            return (
              <div key={p.id} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] bg-white dark:bg-neutral-800 border transition-colors', isOverBudget ? 'border-red-300 dark:border-red-700 bg-red-50/30' : 'border-neutral-100 dark:border-neutral-700')}>
                <span className={cn('w-2 h-2 rounded-full shrink-0', isEnded ? 'bg-neutral-400' : isOverBudget ? 'bg-red-500 animate-pulse' : 'bg-emerald-500')} />
                <span className="font-semibold flex-1 truncate">{p.title}</span>
                <Badge variant={isEnded ? 'default' : isOverBudget ? 'danger' : 'success'} size="sm">{isEnded ? '已结束' : isOverBudget ? '⚠超支' : '进行中'}</Badge>
                <span className="w-16 text-right">{pct}%</span>
                <span className="w-20 text-right text-neutral-500">{cur(p.totalBudget)}</span>
                <span className="w-16 text-right text-neutral-500">{p.participantsCount}伙伴</span>
                <span className="w-16 text-right text-emerald-600 font-medium">ROI {roi}x</span>
                <span className="w-12 text-right text-neutral-400">{days !== null && days > 0 ? `${days}天` : '-'}</span>
              </div>
            );
          }

          return (
            <div key={p.id} onMouseEnter={() => setHoveredCard(p.id)} onMouseLeave={() => setHoveredCard(null)}>
            <Card
              hover
              className={cn(isOverBudget && 'border-red-300 dark:border-red-700 bg-gradient-to-br from-red-50/30 dark:from-red-950/10')}
            >
              <div className="space-y-2.5">
                {/* Header with breathing dot */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', isEnded ? 'bg-neutral-400' : isOverBudget ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse')} />
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-bold text-neutral-900 dark:text-white truncate">{p.title}</h3>
                      <p className="text-[10px] text-neutral-500">{p.trigger_type} · {p.payout_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isEnded ? (
                      <Badge variant="default">已结束</Badge>
                    ) : isOverBudget ? (
                      <Badge variant="danger">⚠️ 超支预警</Badge>
                    ) : (
                      <Badge variant="success">进行中</Badge>
                    )}
                    {days !== null && days > 0 && !isEnded && (
                      <span className={cn('text-[10px] font-medium', isNearEnd ? 'text-red-500' : 'text-neutral-400')}>
                        {isNearEnd ? `仅剩${days}天` : `剩${days}天`}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-neutral-500 line-clamp-1">{p.description}</p>

                {/* Three-segment progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-neutral-400">预算使用</span>
                    <span className={cn('font-semibold', isOverBudget ? 'text-red-500' : 'text-neutral-600')}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden flex gap-px">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(pct - Math.round((frozenAmount / Math.max(p.totalBudget, 1)) * 100), pct)}%` }} />
                    <div className="h-full bg-blue-300 transition-all" style={{ width: `${Math.round((frozenAmount / Math.max(p.totalBudget, 1)) * 100)}%` }} />
                    <div className="h-full bg-neutral-200 dark:bg-neutral-600 flex-1" />
                  </div>
                  <div className="flex justify-between text-[8px] text-neutral-400">
                    <span>已结算 {cur(p.claimedAmount - frozenAmount)}</span>
                    <span>冻结 {cur(frozenAmount)}</span>
                    <span className={remainingAmount < p.totalBudget * 0.1 ? 'text-red-500' : ''}>余额 {cur(remainingAmount)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-neutral-100 dark:border-neutral-700">
                  <div>
                    <p className="text-[9px] text-neutral-400">总预算</p>
                    <p className="text-[11px] font-semibold">{cur(p.totalBudget)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-neutral-400">带动商机</p>
                    <p className="text-[11px] font-semibold text-emerald-600">{cur(pipelineValue)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-neutral-400">参与伙伴</p>
                    <p className="text-[11px] font-semibold">{p.participantsCount} 家</p>
                  </div>
                </div>

                {/* Hover: Top 3 partners + forecast */}
                {isHovered && !isEnded && (
                  <div className="px-2 py-1.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-700 text-[9px] text-neutral-500 space-y-1">
                    <div>🏆 Top3 贡献伙伴：<b className="text-neutral-700 dark:text-neutral-300">神州数码</b>(¥{(p.claimedAmount * 0.25).toFixed(0)}万) · <b className="text-neutral-700 dark:text-neutral-300">东软</b>(¥{(p.claimedAmount * 0.18).toFixed(0)}万) · <b className="text-neutral-700 dark:text-neutral-300">浪潮</b>(¥{(p.claimedAmount * 0.12).toFixed(0)}万)</div>
                    {pct > 70 && (
                      <div className="text-amber-600">⚠ 预测：按当前消耗速度，{Math.round(remainingAmount / Math.max((p.claimedAmount / Math.max(daysRemaining(p.start_date) || 30, 1)), 1))} 天后达到预算上限</div>
                    )}
                  </div>
                )}

                {/* ROI + Actions */}
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-neutral-100 dark:border-neutral-700">
                  <span>💰 ROI <b className={Number(roi) >= 2 ? 'text-emerald-600' : 'text-amber-600'}>{roi}x</b> · {p.start_date?.slice(0, 10)}~{p.end_date?.slice(0, 10)}</span>
                  <div className="flex items-center gap-1.5">
                    {isEnded ? (
                      <Button variant="brand" size="sm" className="text-[9px] h-6" onClick={() => alert(`正在生成「${p.title}」效果报告...\n\n总预算: ${cur(p.totalBudget)}\n已申领: ${cur(p.claimedAmount)}\n参与伙伴: ${p.participantsCount}家\nROI: ${roi}x\n带动商机: ${cur(pipelineValue)}`)}>
                        <FileText className="w-3 h-3 mr-1" />效果报告
                      </Button>
                    ) : isOverBudget ? (
                      <>
                        <Button variant="danger" size="sm" className="text-[9px] h-6" onClick={() => alert(`追加预算: ${p.title}\n当前预算: ${cur(p.totalBudget)}\n建议追加: ${cur(Math.round(p.totalBudget * 0.5))}`)}>
                          +追加预算
                        </Button>
                        <Button variant="ghost" size="sm" className="text-[9px] h-6" onClick={() => alert(`已归档: ${p.title}`)}>归档</Button>
                      </>
                    ) : null}
                    <span className="text-neutral-400 cursor-pointer" title="更多操作">···</span>
                  </div>
                </div>
              </div>
            </Card>
            </div>
          );
        })}
      </div>

      {/* 创建激励计划模态框 */}
      {showCreate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">新建激励计划</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500">计划名称 *</label>
                <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500">触发类型</label>
                  <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={form.trigger_type} onChange={e => setForm({...form, trigger_type: e.target.value})}>
                    {['Pipeline Gap','New Product','Competitive','Sales Acceleration'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">发放类型</label>
                  <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={form.payout_type} onChange={e => setForm({...form, payout_type: e.target.value})}>
                    {['Cash','Rebate','Points'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500">总预算 *</label>
                  <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="number" value={form.total_budget} onChange={e => setForm({...form, total_budget: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">开始</label>
                  <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">结束</label>
                  <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500">描述</label>
                <textarea className="w-full px-3 py-2 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm resize-none" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
              <Button variant="brand" onClick={handleCreate} disabled={creating}>{creating ? '创建中...' : '创建计划'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 政策管理页面组件 - 完整优化版
const IncentivePolicyManagement: React.FC = () => {
  const { config } = useConfig();
  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<any[]>([]);
  const [roiData, setRoiData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'templates' | 'applications' | 'analytics'>('plans');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [showTargetingModal, setShowTargetingModal] = useState(false);

  // Form states
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    trigger_type: 'Pipeline Gap',
    payout_type: 'Cash',
    total_budget: '',
    start_date: '',
    end_date: '',
    // 定向设置
    scope: 'all',
    target_levels: [] as string[],
    target_regions: [] as string[],
    target_industries: [] as string[],
    // 阶梯设置
    tier_enabled: false,
    tiers: [] as any[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: programsData } = await supabase.from('incentive_programs').select('*').order('created_at', { ascending: false });
      if (programsData) setPrograms(programsData);

      const { data: templatesData } = await supabase.from('incentive_templates').select('*').eq('is_active', true).order('usage_count', { ascending: false });
      if (templatesData) setTemplates(templatesData);

      const { data: appsData } = await supabase.from('incentive_applications').select('*').order('submitted_at', { ascending: false }).limit(20);
      if (appsData) setApplications(appsData);

      const { data: alertsData } = await supabase.from('incentive_budget_alerts').select('*').order('created_at', { ascending: false });
      if (alertsData) setBudgetAlerts(alertsData);

      // 计算ROI数据
      const totalClaimed = programsData?.reduce((sum, p) => sum + (p.claimed_amount || 0), 0) || 0;
      const totalBudget = programsData?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0;
      const activePrograms = programsData?.filter(p => p.status === 'Active').length || 0;
      const avgParticipation = programsData?.length ? Math.round(programsData.reduce((sum, p) => sum + (p.participants_count || 0), 0) / programsData.length) : 0;
      
      setRoiData({
        totalInvestment: totalClaimed,
        totalBudget: totalBudget,
        activePrograms: activePrograms,
        avgParticipation: avgParticipation,
        estimatedROI: totalClaimed > 0 ? (totalBudget / totalClaimed).toFixed(2) : '0.00',
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.title || !newPlan.total_budget) return;
    try {
      const { error } = await supabase.from('incentive_programs').insert({
        title: newPlan.title,
        description: newPlan.description,
        trigger_type: newPlan.trigger_type,
        payout_type: newPlan.payout_type,
        total_budget: Number(newPlan.total_budget),
        start_date: newPlan.start_date,
        end_date: newPlan.end_date,
        status: 'Upcoming',
        claimed_amount: 0,
        participants_count: 0,
      });
      if (error) throw new Error(error.message);
      setShowCreateModal(false);
      setNewPlan({ title: '', description: '', trigger_type: 'Pipeline Gap', payout_type: 'Cash', total_budget: '', start_date: '', end_date: '', scope: 'all', target_levels: [], target_regions: [], target_industries: [], tier_enabled: false, tiers: [] });
      loadData();
    } catch (err) {
      console.error('Failed to create plan:', err);
    }
  };

  const handleApprove = async (appId: string) => {
    try {
      await supabase.from('incentive_applications').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', appId);
      loadData();
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await supabase.from('incentive_applications').update({ status: 'rejected' }).eq('id', appId);
      loadData();
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const statusVariant = (s: string) => {
    if (s === 'Active') return 'success';
    if (s === 'Upcoming') return 'info';
    if (s === 'Completed') return 'default';
    return 'default';
  };

  const statusLabel = (s: string) => {
    if (s === 'Active') return '进行中';
    if (s === 'Upcoming') return '即将开始';
    if (s === 'Completed') return '已结束';
    return s;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">激励政策管理</h1>
          <p className="text-sm text-neutral-500 mt-1">看、管、算全场景管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTierModal(true)}>
            <Zap className="w-4 h-4" />阶梯规则
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTargetingModal(true)}>
            <Target className="w-4 h-4" />定向规则
          </Button>
          <Button variant="brand" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />新建计划
          </Button>
        </div>
      </div>

      {/* 预算预警提示 */}
      {budgetAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                预算预警: {budgetAlerts.length} 个计划接近或超出预算阈值
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              <Bell className="w-4 h-4" />查看详情
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab切换 */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        {[
          { id: 'plans', label: '激励计划', icon: Gift },
          { id: 'templates', label: '模板库', icon: Layers },
          { id: 'applications', label: '申请审批', icon: FileText },
          { id: 'analytics', label: '效果分析', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2',
              activeTab === tab.id
                ? 'text-brand-600 border-brand-600'
                : 'text-neutral-600 border-transparent hover:text-neutral-900'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      {activeTab === 'plans' && (
        <>
          {/* 策略配置层提示 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200">策略配置层</h3>
                <p className="text-xs text-purple-600 dark:text-purple-400">多维度定向 · 阶梯激励 · 智能模板</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/60 dark:bg-neutral-800/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium">对象定向</span>
                </div>
                <p className="text-xs text-neutral-500">按等级/地域/行业定向发布激励政策</p>
              </div>
              <div className="bg-white/60 dark:bg-neutral-800/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium">阶梯奖励</span>
                </div>
                <p className="text-xs text-neutral-500">设置业绩阈值，对应不同奖励标准</p>
              </div>
              <div className="bg-white/60 dark:bg-neutral-800/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium">模板库</span>
                </div>
                <p className="text-xs text-neutral-500">15+预设模板，点击即用</p>
              </div>
            </div>
          </div>

          {/* 激励计划列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((p) => {
              const pct = p.total_budget > 0 ? Math.round((p.claimed_amount / p.total_budget) * 100) : 0;
              const isOverBudget = pct >= 90;
              return (
                <Card key={p.id} hover onClick={() => { setSelectedPlan(p); setShowDetailModal(true); }}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{p.title}</h3>
                      <div className="flex items-center gap-1">
                        {isOverBudget && <Badge variant="danger" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />超支</Badge>}
                        <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.start_date}</span>
                      <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" />{p.end_date}</span>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <div className="flex justify-between text-xs">
                        <span>预算使用</span>
                        <span className={cn(isOverBudget ? 'text-red-600 font-medium' : 'text-neutral-600')}>{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className={cn('h-full rounded-full transition-all', isOverBudget ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-brand-500')}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-neutral-400">总预算</p>
                        <p className="text-xs font-semibold">{cur(p.total_budget)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400">已申领</p>
                        <p className="text-xs font-semibold">{cur(p.claimed_amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400">参与伙伴</p>
                        <p className="text-xs font-semibold">{p.participants_count || 0}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {programs.length === 0 && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无激励计划</p>
                <p className="text-xs mt-1">点击上方"新建计划"创建第一个激励政策</p>
                <Button variant="brand" size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4" />创建第一个计划
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'templates' && (
        <>
          {/* 过程管理层提示 */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">激励模板库</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400">15+预设行业模板，快速创建激励计划</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <Card key={t.id} hover className="cursor-pointer" onClick={() => {
                setNewPlan({ ...newPlan, title: t.name, description: t.description });
                setShowCreateModal(true);
              }}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t.name}</h3>
                    <Badge variant="default">{t.category}</Badge>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-2">{t.description}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Users className="w-3 h-3" />
                    已使用 {t.usage_count || 0} 次
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Zap className="w-4 h-4" />使用此模板
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'applications' && (
        <>
          {/* 审批工作流提示 */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">审批与核销工作流</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">自动生成待核销记录，管理员在线审批，确保激励发放合规性</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>激励申请审批</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>暂无待审批申请</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{a.partner_name || '未知伙伴'}</p>
                          <p className="text-xs text-neutral-500">{a.metric} - 申请金额: {cur(a.claimed_value || 0)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'info' : 'default'}>
                          {a.status === 'approved' ? '已批准' : a.status === 'pending' ? '待审批' : a.status}
                        </Badge>
                        {a.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleApprove(a.id)}>
                              <ThumbsUp className="w-4 h-4 text-emerald-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleReject(a.id)}>
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* AI Diagnosis Banner */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800 text-[10px] overflow-hidden">
            <span className="shrink-0 font-semibold text-blue-700 dark:text-blue-300">🧠 AI诊断：</span>
            <span className="text-neutral-600 dark:text-neutral-400 truncate">
              {(() => {
                const lowROI = programs.filter((p: any) => (p.claimed_amount || 0) > (p.total_budget || 1) * 0.5 && (p.participants_count || 0) < 10).map((p: any) => p.title);
                const highEfficiency = programs.filter((p: any) => (p.claimed_amount || 0) < (p.total_budget || 1) * 0.5 && (p.participants_count || 0) > 0 && (p.claimed_amount || 0) > 0).map((p: any) => p.title);
                const parts: string[] = [];
                if (lowROI.length) parts.push(`「${lowROI.join('、')}」参与率偏低但预算消耗过半，建议优化准入门槛`);
                if (highEfficiency.length) parts.push(`「${highEfficiency.join('、')}」预算利用效率高，建议追加投入放大效果`);
                if (!parts.length) parts.push('所有激励计划运行正常，投入产出比健康');
                return parts.join('；');
              })()}
            </span>
          </div>

          {/* KPI Row with Sparklines */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '累计ROI', value: `${(roiData?.estimatedROI || '0')}x`, trend: '↑15%', color: '#059669', spark: [0,12,10,25,6,38,4,50,2] },
              { label: '商机转化率', value: `${Math.round((programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) / Math.max(programs.reduce((s: number, p: any) => s + (p.total_budget || 0), 0) / 100000, 1)) * 10)}%`, trend: '↑8%', color: '#059669', spark: [0,10,15,12,30,8,50,4] },
              { label: '活跃伙伴', value: String(programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0)), trend: '↑5', color: '#2563eb', spark: [0,3,15,5,30,8,50,10] },
              { label: '成交周期', value: `${Math.round(14 + Math.random() * 10)}天`, trend: '↓3天', color: '#059669', spark: [0,3,15,5,30,9,50,14] },
            ].map((k, i) => (
              <Card key={i}>
                <div className="p-3">
                  <p className="text-[10px] text-neutral-500">{k.label}</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-extrabold text-neutral-900 dark:text-white">{k.value}</span>
                    <span className={cn('text-[10px] font-semibold', k.trend.startsWith('↑') || k.trend.startsWith('↓') && k.trend.includes('天') ? 'text-emerald-600' : 'text-emerald-600')}>{k.trend}</span>
                  </div>
                  <svg width="60" height="18" className="mt-1">
                    <polyline points={k.spark.map((v, i) => `${(i/4)*60},${18-(v/12)*18}`).join(' ')} fill="none" stroke={k.color} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </Card>
            ))}
          </div>

          {/* Middle: Funnel + Pie + Quadrant */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Funnel */}
            <Card>
              <CardContent>
                <h4 className="text-xs font-semibold mb-3">📊 转化漏斗</h4>
                {[
                  { label: '触达伙伴', count: programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) * 2, color: 'bg-blue-500', w: 100 },
                  { label: '报备商机', count: programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0), color: 'bg-blue-400', w: 65 },
                  { label: '赢单成交', count: Math.round(programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) * 0.35), color: 'bg-emerald-500', w: 35 },
                ].map((f, i) => (
                  <div key={i} className="flex flex-col items-center mb-1">
                    <div className={cn('text-white text-center py-1.5 rounded text-[11px] font-semibold', f.color)} style={{ width: `${f.w}%`, minWidth: '60px' }}>{f.label} {f.count}</div>
                    {i < 2 && <span className="text-[9px] text-neutral-400 my-0.5">↓ {i === 0 ? '50%' : '35%'}</span>}
                  </div>
                ))}
                <div className="text-center text-[10px] text-neutral-500 mt-2">
                  转化率 {(programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) > 0 ? Math.round((programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) * 0.35) / programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) * 100) : 0)}% · 平均周期 18 天
                </div>
              </CardContent>
            </Card>

            {/* Spending Pie */}
            <Card>
              <CardContent>
                <h4 className="text-xs font-semibold mb-3">🥧 支出构成</h4>
                <div className="flex items-center justify-center gap-4">
                  <svg width="90" height="90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="14" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                    <circle cx="20" cy="20" r="14" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray="52.8 88" strokeDashoffset="0" transform="rotate(-90 20 20)"/>
                    <circle cx="20" cy="20" r="14" fill="none" stroke="#059669" strokeWidth="8" strokeDasharray="17.6 88" strokeDashoffset="-52.8" transform="rotate(-90 20 20)"/>
                    <circle cx="20" cy="20" r="14" fill="none" stroke="#7c3aed" strokeWidth="8" strokeDasharray="17.6 88" strokeDashoffset="-70.4" transform="rotate(-90 20 20)"/>
                  </svg>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />返点 60%</div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />补贴 20%</div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" />服务 20%</div>
                    <div className="text-neutral-400 mt-1">总支出 {cur(roiData?.totalInvestment || 0)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Efficiency Matrix */}
            <Card>
              <CardContent>
                <h4 className="text-xs font-semibold mb-2">🎯 效率矩阵</h4>
                <div className="relative h-[110px] border-l-2 border-b-2 border-neutral-200 dark:border-neutral-700 ml-6 mb-4">
                  <span className="absolute -left-5 top-0 text-[8px] text-neutral-400 -rotate-90 origin-center">商机额</span>
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-neutral-400">消耗率 →</span>
                  {programs.slice(0, 5).map((p: any, i: number) => {
                    const pct = p.total_budget > 0 ? Math.min((p.claimed_amount / p.total_budget) * 100, 100) : 0;
                    const pipeline = (p.participants_count || 1) * 3;
                    const x = Math.min(pct, 95);
                    const y = Math.max(100 - Math.min(pipeline, 100), 5);
                    const color = pct < 50 && pipeline > 20 ? '#059669' : pct > 80 ? '#dc2626' : '#d97706';
                    return <div key={i} className="absolute w-2 h-2 rounded-full -ml-1 -mb-1" style={{ left: `${x}%`, bottom: `${y}%`, background: color }} title={`${p.title}: 消耗${Math.round(pct)}% 商机${pipeline}`} />;
                  })}
                  <span className="absolute left-1 top-2 text-[7px] text-emerald-600">高效区</span>
                  <span className="absolute right-1 bottom-10 text-[7px] text-red-500">低效区</span>
                </div>
                <div className="flex gap-3 text-[9px] justify-center">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />高效</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />中等</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />预警</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Partner Quadrant */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '🦾 铁杆伙伴', count: 48, sub: '高活跃·高贡献', color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200', text: 'text-emerald-700', btn: '表彰', btnColor: 'bg-emerald-500' },
              { label: '🚀 高潜伙伴', count: 67, sub: '高活跃·待转化', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200', text: 'text-blue-700', btn: '激活', btnColor: 'bg-blue-500' },
              { label: '😴 沉睡伙伴', count: 82, sub: '低活跃·低贡献', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200', text: 'text-amber-700', btn: '推送', btnColor: 'bg-amber-500' },
              { label: '📉 边缘伙伴', count: 28, sub: '低活跃·高流失风险', color: 'bg-red-50 dark:bg-red-900/20 border-red-200', text: 'text-red-700', btn: '干预', btnColor: 'bg-red-500' },
            ].map((q, i) => (
              <div key={i} className={cn('p-3 rounded-xl border text-center', q.color)}>
                <p className={cn('text-[11px] font-semibold', q.text)}>{q.label}</p>
                <p className="text-2xl font-extrabold mt-1 text-neutral-900 dark:text-white">{q.count}</p>
                <p className="text-[9px] text-neutral-500">{q.sub}</p>
                <Button size="sm" className={cn('mt-2 text-[10px] text-white', q.btnColor)} onClick={() => alert(`${q.label}：已发送${q.btn}通知`)}>
                  {q.btn}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 创建计划模态框 */}
      {showCreateModal && (
        <Modal title="新建激励计划" onClose={() => setShowCreateModal(false)} open={showCreateModal}>
          <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-xs font-semibold text-neutral-500">计划名称 *</label>
              <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={newPlan.title} onChange={e => setNewPlan({...newPlan, title: e.target.value})} placeholder="输入计划名称" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500">描述</label>
              <textarea className="w-full px-3 py-2 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm resize-none" rows={3} value={newPlan.description} onChange={e => setNewPlan({...newPlan, description: e.target.value})} placeholder="输入计划描述" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500">触发类型</label>
                <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={newPlan.trigger_type} onChange={e => setNewPlan({...newPlan, trigger_type: e.target.value})}>
                  <option value="Pipeline Gap">Pipeline Gap</option>
                  <option value="New Product">New Product</option>
                  <option value="Competitive">Competitive</option>
                  <option value="Sales Acceleration">Sales Acceleration</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500">发放类型</label>
                <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={newPlan.payout_type} onChange={e => setNewPlan({...newPlan, payout_type: e.target.value})}>
                  <option value="Cash">Cash</option>
                  <option value="Rebate">Rebate</option>
                  <option value="Points">Points</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500">总预算 *</label>
              <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="number" value={newPlan.total_budget} onChange={e => setNewPlan({...newPlan, total_budget: e.target.value})} placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500">开始日期</label>
                <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" value={newPlan.start_date} onChange={e => setNewPlan({...newPlan, start_date: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500">结束日期</label>
                <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" value={newPlan.end_date} onChange={e => setNewPlan({...newPlan, end_date: e.target.value})} />
              </div>
            </div>
            {/* 定向设置 */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-semibold text-neutral-500">对象定向</label>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={newPlan.scope === 'all'} onChange={() => setNewPlan({...newPlan, scope: 'all'})} />
                  全员激励
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={newPlan.scope === 'targeted'} onChange={() => setNewPlan({...newPlan, scope: 'targeted'})} />
                  定向激励
                </label>
                {newPlan.scope === 'targeted' && (
                  <div className="ml-6 space-y-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">合作伙伴等级</p>
                      <div className="flex gap-2">
                        {['金牌', '银牌', '铜牌'].map(level => (
                          <label key={level} className="flex items-center gap-1 text-xs">
                            <input type="checkbox" /> {level}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* 阶梯设置 */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-emerald-600" />
                <label className="text-xs font-semibold text-neutral-500">阶梯奖励</label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={newPlan.tier_enabled} onChange={e => setNewPlan({...newPlan, tier_enabled: e.target.checked})} />
                  启用阶梯
                </label>
              </div>
              {newPlan.tier_enabled && (
                <div className="space-y-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="grid grid-cols-3 gap-2 text-xs text-neutral-500">
                    <span>业绩阈值</span>
                    <span>奖励比例</span>
                    <span>奖励金额</span>
                  </div>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <input className="h-8 px-2 bg-white dark:bg-neutral-800 border rounded text-sm" placeholder={`${i * 5}个商机`} />
                      <input className="h-8 px-2 bg-white dark:bg-neutral-800 border rounded text-sm" placeholder={`${i * 10}%`} />
                      <input className="h-8 px-2 bg-white dark:bg-neutral-800 border rounded text-sm" placeholder="金额" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
              <Button variant="brand" onClick={handleCreatePlan}>创建计划</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 阶梯规则模态框 */}
      {showTierModal && (
        <Modal title="阶梯奖励规则配置" onClose={() => setShowTierModal(false)} open={showTierModal}>
          <div className="space-y-4 p-4">
            <p className="text-sm text-neutral-500">设置阶梯阈值，让伙伴"跳一跳"够到更高的业绩。</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold">1</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">1-5个商机</p>
                  <p className="text-xs text-neutral-500">奖励标准: 100元/个</p>
                </div>
                <Badge variant="default">基础档</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold">2</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">6-10个商机</p>
                  <p className="text-xs text-neutral-500">奖励标准: 150元/个 (+50%)</p>
                </div>
                <Badge variant="info">进阶档</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold">3</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">11+个商机</p>
                  <p className="text-xs text-neutral-500">奖励标准: 200元/个 (+100%)</p>
                </div>
                <Badge variant="warning">高阶档</Badge>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowTierModal(false)}>关闭</Button>
              <Button variant="brand"><Check className="w-4 h-4" />保存规则</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 定向规则模态框 */}
      {showTargetingModal && (
        <Modal title="多维度定向规则" onClose={() => setShowTargetingModal(false)} open={showTargetingModal}>
          <div className="space-y-4 p-4">
            <p className="text-sm text-neutral-500">支持按合作伙伴等级、地域、行业定向发布激励政策。</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 mb-2 block">合作伙伴等级</label>
                <div className="flex gap-2">
                  {['金牌', '银牌', '铜牌', '普通'].map(level => (
                    <Badge key={level} variant="outline" className="cursor-pointer hover:bg-neutral-100">{level}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 mb-2 block">地域定向</label>
                <div className="flex gap-2 flex-wrap">
                  {['华东区', '华南区', '华北区', '西北区', '西南区', '东北区'].map(region => (
                    <Badge key={region} variant="outline" className="cursor-pointer hover:bg-neutral-100">{region}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 mb-2 block">行业定向</label>
                <div className="flex gap-2 flex-wrap">
                  {['医疗', '教育', '政府', '企业', '制造', '金融'].map((industry) => (
                    <Badge key={industry} variant="outline" className="cursor-pointer hover:bg-neutral-100">{industry}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-xs text-blue-600">💡 提示: 勾选多个维度时，满足任一条件的伙伴都将收到激励通知。</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowTargetingModal(false)}>关闭</Button>
              <Button variant="brand"><Check className="w-4 h-4" />保存规则</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 详情模态框 */}
      {showDetailModal && selectedPlan && (
        <Modal title={selectedPlan.title} onClose={() => { setShowDetailModal(false); setSelectedPlan(null); }} open={showDetailModal}>
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(selectedPlan.status)}>{statusLabel(selectedPlan.status)}</Badge>
              <Badge variant="outline">{selectedPlan.trigger_type}</Badge>
              <Badge variant="outline">{selectedPlan.payout_type}</Badge>
            </div>
            <p className="text-sm text-neutral-600">{selectedPlan.description}</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-neutral-500">总预算</p>
                <p className="text-lg font-semibold">{cur(selectedPlan.total_budget)}</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-neutral-500">已申领</p>
                <p className="text-lg font-semibold">{cur(selectedPlan.claimed_amount)}</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-neutral-500">参与伙伴</p>
                <p className="text-lg font-semibold">{selectedPlan.participants_count || 0}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs text-neutral-500 mb-2">有效期</p>
              <p className="text-sm">{selectedPlan.start_date} ~ {selectedPlan.end_date}</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline"><Edit className="w-4 h-4" />编辑</Button>
              <Button variant="brand"><Download className="w-4 h-4" />导出报表</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// 整合后的激励管理页面
export const IncentivesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'policy'>('overview');

  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart3, description: '激励计划统计与快速管理' },
    { id: 'policy', label: '政策管理', icon: Settings, description: '看、管、算全场景管理' },
  ];

  return (
    <div className="space-y-6">
      {/* 主Tab切换 */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-1">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'policy')}
              className={cn(
                'flex-1 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={cn('text-xs', activeTab === tab.id ? 'text-brand-500' : 'text-neutral-400')}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 根据Tab显示不同内容 */}
      {activeTab === 'overview' ? (
        <IncentivesOverview />
      ) : (
        <IncentivePolicyManagement />
      )}
    </div>
  );
};
