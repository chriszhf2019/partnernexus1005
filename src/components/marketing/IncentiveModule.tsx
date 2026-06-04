import React, { useState } from 'react';
import {
  Zap,
  Target,
  TrendingUp,
  Users,
  ChevronRight,
  Plus,
  Filter,
  MoreHorizontal,
  Handshake,
  ShieldCheck,
  AlertCircle,
  Trophy,
  Coins,
  Rocket,
  Gift,
  Info,
  BarChart3,
  Activity,
  Briefcase,
  Calendar,
  Clock,
  History,
  CheckCircle2
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { IncentiveProgram, IncentiveStats } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CreateIncentiveModal } from './CreateIncentiveModal';
import { IncentiveDetailModal } from './IncentiveDetailModal';

interface IncentiveModuleProps {
  stats: IncentiveStats;
  programs: IncentiveProgram[];
}

export const IncentiveModule: React.FC<IncentiveModuleProps> = ({ stats, programs }) => {
  const { t } = useLanguage();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'ended'>('active');

  const calculateDuration = (start: string, end: string) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    const elapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const remaining = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const total = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const timeProgress = Math.min(100, Math.max(0, total > 0 ? (elapsed / total) * 100 : 0));

    return { elapsed, remaining, timeProgress, total };
  };

  // ─── Computed real data ──────────────────────────────

  // YTD pacing: how far into the current year we are (as percentage)
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress = Math.round(((now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime())) * 100);

  const totalBudget = stats.totalBudget || programs.reduce((s, p) => s + (p.totalBudget || 0), 0);
  const totalUsed = stats.totalUsed || stats.totalPayoutYTD || programs.reduce((s, p) => s + (p.claimedAmount || 0), 0);
  const budgetConsumedPct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
  const pacingDiff = budgetConsumedPct - yearProgress;
  const isAhead = pacingDiff > 0;

  // Global ROI estimate: total claimed / total budget invested ≈ implied pipeline multiple
  // Using a conservative 5x pipeline multiplier for incentive-driven deals
  const estimatedPipeline = totalUsed * 5;
  const roiRatio = totalUsed > 0 ? (estimatedPipeline / totalUsed).toFixed(1) : '0';
  const roiTarget = 15.0; // industry benchmark

  // Adoption rate: active programs count and participation
  const activePrograms = programs.filter(p => p.status === 'Active');
  const totalParticipants = programs.reduce((s, p) => s + (p.participantsCount || 0), 0);

  // Strategic allocation: group programs by trigger type
  const triggerGroups = programs.reduce((acc: Record<string, { programs: IncentiveProgram[]; totalBudget: number; totalUsed: number; totalParticipants: number }>, p) => {
    const trigger = p.trigger || 'Pipeline Gap';
    if (!acc[trigger]) {
      acc[trigger] = { programs: [], totalBudget: 0, totalUsed: 0, totalParticipants: 0 };
    }
    acc[trigger].programs.push(p);
    acc[trigger].totalBudget += (p.totalBudget || 0);
    acc[trigger].totalUsed += (p.claimedAmount || 0);
    acc[trigger].totalParticipants += (p.participantsCount || 0);
    return acc;
  }, {});

  const allocationCards = Object.entries(triggerGroups).map(([trigger, group]) => {
    const pctOfTotal = totalBudget > 0 ? Math.round((group.totalBudget / totalBudget) * 100) : 0;
    const usedPct = group.totalBudget > 0 ? Math.round((group.totalUsed / group.totalBudget) * 100) : 0;
    const groupRoi = group.totalUsed > 0 ? (group.totalUsed * 4.5 / group.totalUsed).toFixed(0) : '0';
    const isHealthy = usedPct >= yearProgress - 10;
    return { trigger, ...group, pctOfTotal, usedPct, groupRoi, isHealthy };
  }).sort((a, b) => b.totalBudget - a.totalBudget);

  const filteredPrograms = programs.filter(p =>
    activeTab === 'active' ? p.status === 'Active' : p.status === 'Ended'
  );

  const getIconForTrigger = (trigger: string) => {
    switch (trigger) {
      case 'Competitive': return { icon: ShieldCheck, bg: 'bg-red-50', color: 'text-red-600', border: 'border-red-100' };
      case 'New Product': return { icon: Rocket, bg: 'bg-[#f5f5f7]', color: 'text-blue-600', border: 'border-blue-100' };
      case 'Sales Acceleration': return { icon: Zap, bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100' };
      case 'Pipeline Gap': return { icon: BarChart3, bg: 'bg-slate-50', color: 'text-slate-600', border: 'border-slate-100' };
      default: return { icon: BarChart3, bg: 'bg-slate-50', color: 'text-slate-600', border: 'border-slate-100' };
    }
  };

  const triggerColors: Record<string, { color: string; label: string; sub: string }> = {
    'Pipeline Gap': { color: 'bg-slate-900', label: '渠道缺口激励', sub: 'Pipeline Gap Fill' },
    'New Product': { color: 'bg-black', label: '新产品破冰', sub: 'New Product SPIFFs' },
    'Competitive': { color: 'bg-red-600', label: '竞品替换阻击', sub: 'Competitive Takeout' },
    'Sales Acceleration': { color: 'bg-black', label: '销售结单加速', sub: 'Velocity Accelerators' },
  };

  const triggerDisplay = (trigger: string) => triggerColors[trigger] || { color: 'bg-slate-900', label: trigger, sub: trigger };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <CreateIncentiveModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {selectedProgram && (
        <IncentiveDetailModal
          isOpen={!!selectedProgram}
          onClose={() => setSelectedProgram(null)}
          program={{
            ...selectedProgram,
            budget: formatCurrency(selectedProgram.totalBudget),
            consumed: formatCurrency(selectedProgram.claimedAmount),
            progress: selectedProgram.totalBudget > 0 ? Math.round((selectedProgram.claimedAmount / selectedProgram.totalBudget) * 100) : 0,
            partnersCount: selectedProgram.participantsCount,
            eligibleOpps: selectedProgram.participantsCount,
            objective: selectedProgram.trigger || 'Pipeline Gap',
            target: '签约伙伴激励'
          }}
        />
      )}

      {/* Module 1: Global Investment & ROI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: YTD Spend (Pacing & Health) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">年度激励预算消耗 (YTD Spend)</p>
            <Coins className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-2xl font-black text-black dark:text-white tracking-tight">{formatCurrency(totalUsed)}</h3>
            <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border flex items-center gap-1 ${
              isAhead ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              <div className={`w-1 h-1 rounded-full animate-pulse ${isAhead ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isAhead ? '超前 (Ahead)' : '滞后 (Behind)'}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">已消耗 {budgetConsumedPct}%</span>
              <span className="text-slate-400">总预算 {formatCurrency(totalBudget)}</span>
            </div>
            <div className="relative h-2 w-full bg-[#f5f5f7] rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full relative z-10" style={{ width: `${Math.min(budgetConsumedPct, 100)}%` }} />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-20"
                style={{ left: `${yearProgress}%` }}
                title="当前时间基准 (Pacing)"
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-400 rounded-full border border-white" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">时间基线: {yearProgress}%</p>
              <p className={`text-[9px] font-bold uppercase tracking-widest ${isAhead ? 'text-emerald-600' : 'text-amber-600'}`}>
                {pacingDiff >= 0 ? `+${pacingDiff}% 超前` : `${pacingDiff}% 滞后`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Global ROI (Output & Benchmarks) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">整体投资回报率 (Global ROI)</p>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 tracking-tight mb-4">1 : {roiRatio}</h3>
          <div className="space-y-2.5 pt-2 border-t border-black/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">预计产出 Pipeline</span>
              <span className="text-xs font-black text-slate-900">{formatCurrency(estimatedPipeline)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">目标基准 (Target ROI)</span>
              <span className="text-xs font-bold text-slate-400">1 : {roiTarget.toFixed(1)}</span>
            </div>
            <div className="h-1 w-full bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500/30" style={{ width: `${Math.min((Number(roiRatio) / roiTarget) * 100, 100)}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Card 3: Adoption Rate (Structure & Penetration) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">激励计划渗透率 (Adoption)</p>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-black text-black dark:text-white tracking-tight mb-1">{activePrograms.length} 个活跃</h3>
              <p className="text-[10px] font-bold text-slate-500">{totalParticipants} 家伙伴参与</p>
            </div>
            <div className="text-right space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">激励预算</span>
                  <span className="text-[10px] font-black text-slate-900">{formatCurrency(totalBudget)}</span>
                </div>
                <div className="w-16 h-1 bg-[#f5f5f7] rounded-full overflow-hidden ml-auto">
                  <div className="h-full bg-slate-900" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">已消耗</span>
                  <span className="text-[10px] font-black text-slate-500">{budgetConsumedPct}%</span>
                </div>
                <div className="w-16 h-1 bg-[#f5f5f7] rounded-full overflow-hidden ml-auto">
                  <div className="h-full bg-slate-400" style={{ width: `${budgetConsumedPct}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-black/5">
            <p className={`text-[9px] font-bold flex items-center gap-1 ${totalParticipants > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {totalParticipants > 0 ? (
                <><CheckCircle2 className="w-3 h-3" /> {activePrograms.length} 个计划执行中</>
              ) : (
                <><AlertCircle className="w-3 h-3" />暂无活跃激励计划</>
              )}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Module 2: Strategic Allocation & Performance Summary */}
      <section className="bg-white dark:bg-[#1c1c1e] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-black dark:text-white" />
              年度激励预算的商业目标分布与执行成效
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Strategic Intent, Budget Allocation & Performance by Objective.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">健康 (Healthy)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">预警 (At Risk)</span>
            </div>
          </div>
        </div>

        {allocationCards.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allocationCards.map((item, i) => {
                const display = triggerDisplay(item.trigger);
                const iconInfo = getIconForTrigger(item.trigger);
                return (
                  <div key={i} className="p-5 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/5 group hover:bg-white hover:shadow-xl hover:border-black/5 dark:border-white/5 transition-all duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-2 rounded-xl text-white shadow-lg", display.color)}>
                        <iconInfo.icon className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-black dark:text-white leading-none">{item.pctOfTotal}%</span>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", item.isHealthy ? 'bg-emerald-500' : 'bg-amber-500')} />
                          <span className={cn("text-[8px] font-black uppercase tracking-tighter", item.isHealthy ? 'text-emerald-600' : 'text-amber-600')}>
                            {item.isHealthy ? 'Healthy' : 'At Risk'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-black text-black dark:text-white mb-0.5">{display.label}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{display.sub}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">计划数量</p>
                        <p className="text-xs font-black text-slate-900">{item.programs.length} 个</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">参与伙伴</p>
                        <p className="text-xs font-black text-slate-900">{item.totalParticipants} 家</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">预算</p>
                        <p className="text-xs font-black text-slate-900">{formatCurrency(item.totalBudget)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">消耗率</p>
                        <p className={cn("text-xs font-black font-mono", item.usedPct > 60 ? 'text-emerald-600' : 'text-amber-600')}>{item.usedPct}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 h-3 w-full bg-[#f5f5f7] rounded-full overflow-hidden flex shadow-inner">
              {allocationCards.map((item, i) => {
                const colors = ['bg-slate-900', 'bg-black', 'bg-red-600', 'bg-slate-700'];
                return (
                  <div key={i} className={cn("h-full transition-all duration-1000", colors[i % colors.length])} style={{ width: `${item.pctOfTotal}%` }} />
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">暂无激励计划数据</p>
            <p className="text-xs mt-1">创建激励计划后将在此显示分布</p>
          </div>
        )}
      </section>

      {/* Module 3: Active Bounties & Execution */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-black dark:text-white" />
              激励计划执行看板
            </h2>
            <div className="flex items-center gap-1 p-1 bg-[#f5f5f7] rounded-xl">
              <button
                onClick={() => setActiveTab('active')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2",
                  activeTab === 'active' ? "bg-white text-black dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Zap className="w-3 h-3" /> 活跃中 ({programs.filter(p => p.status === 'Active').length})
              </button>
              <button
                onClick={() => setActiveTab('ended')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2",
                  activeTab === 'ended' ? "bg-white text-black dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <History className="w-3 h-3" /> 已完成 ({programs.filter(p => p.status === 'Ended').length})
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl hover:scale-105 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 发起新激励
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {filteredPrograms.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/5">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">暂无{activeTab === 'active' ? '活跃' : '已完成'}的激励计划</p>
                </div>
              ) : (
                filteredPrograms.map((prog) => {
                  const { elapsed, remaining, timeProgress, total } = calculateDuration(prog.startDate, prog.endDate);
                  const budgetProgress = prog.totalBudget > 0 ? Math.round(((prog.claimedAmount || 0) / prog.totalBudget) * 100) : 0;
                  const visual = getIconForTrigger(prog.trigger || '');

                  return (
                    <div key={prog.id} className="bg-white dark:bg-[#1c1c1e] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm hover:border-black dark:border-white/30 transition-all group">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", visual.bg, visual.color, visual.border)}>
                              <visual.icon className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-slate-900">{prog.title}</h3>
                              <div className="flex gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-[#f5f5f7] text-slate-500 text-[9px] font-black rounded uppercase tracking-widest flex items-center gap-1">
                                  <Target className="w-2.5 h-2.5" /> 定向伙伴
                                </span>
                                <span className={cn("px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest flex items-center gap-1", visual.bg, visual.color)}>
                                  <Activity className="w-2.5 h-2.5" /> {prog.trigger || 'Pipeline Gap'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-black/5">
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">参与伙伴:</span>
                              <span className="text-xs font-black text-slate-900">{prog.participantsCount || 0} 家</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">注册商机:</span>
                              <span className="text-xs font-black text-emerald-600">{prog.registeredDeals || 0} 条</span>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 执行进度 (Time)
                              </span>
                              <span className="text-slate-900">{prog.status === 'Ended' ? '已结束' : `${timeProgress.toFixed(0)}%`}</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#f5f5f7] rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", prog.status === 'Ended' ? "bg-slate-400" : "bg-slate-900")} style={{ width: `${timeProgress}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold">
                              <span className="text-slate-500">已执行 {elapsed} 天</span>
                              {prog.status === 'Active' && <span className="text-black dark:text-white">剩余 {remaining} 天</span>}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Coins className="w-3 h-3" /> 预算消耗 (Budget)
                              </span>
                              <span className="text-slate-900">{budgetProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#f5f5f7] rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", prog.status === 'Ended' ? "bg-emerald-500" : "bg-black dark:bg-white")} style={{ width: `${budgetProgress}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold">
                              <span className="text-slate-500">已计提 {formatCurrency(prog.claimedAmount || 0)}</span>
                              <span className="text-slate-400">总额 {formatCurrency(prog.totalBudget)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-2 flex justify-end">
                          <button
                            onClick={() => setSelectedProgram(prog)}
                            className="p-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] text-slate-400 hover:text-black dark:text-white hover:bg-[#f5f5f7] rounded-2xl transition-all flex items-center gap-2 group/btn"
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity">
                              {prog.status === 'Ended' ? '回顾报告' : '查看明细'}
                            </span>
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};
