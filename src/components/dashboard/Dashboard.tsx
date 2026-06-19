import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Verified, PlusCircle, Sparkles, Zap, BookOpen, Handshake, Globe, FileText, Users, CheckCircle2, RefreshCw } from 'lucide-react';
import { Deal } from '../../types';
import { KanbanBoard } from '../deals/KanbanBoard';
import { lifecycleService } from '../../services/lifecycle-service';

interface DashboardProps {
  deals: Deal[];
  onNewDeal: () => void;
  partners?: { id: string; name: string; tier?: string; maturityStage?: string; status?: string; }[];
}

export const Dashboard: React.FC<DashboardProps> = ({ deals, onNewDeal, partners }) => {
  const [maturityDistribution, setMaturityDistribution] = useState<Record<string, number>>({
    Transactional: 0, Transitional: 0, Relational: 0, Symbiotic: 0,
  });
  const [dealMaturityDistribution, setDealMaturityDistribution] = useState<Record<string, number>>({
    Registration: 0, Collaboration: 0, Closing: 0, Expansion: 0,
  });
  const [distributionLoading, setDistributionLoading] = useState(false);

  useEffect(() => {
    if (partners && partners.length > 0) {
      const dist: Record<string, number> = {
        Transactional: 0, Transitional: 0, Relational: 0, Symbiotic: 0,
      };
      partners.forEach(p => {
        const stage = p.maturityStage || 'Transactional';
        if (dist[stage] !== undefined) dist[stage]++;
      });
      setMaturityDistribution(dist);
    }
  }, [partners]);

  useEffect(() => {
    if (deals && deals.length > 0) {
      // 7个操作阶段 -> 4个关系阶段的映射
      const opToMaturity: Record<string, string> = {
        Registered: 'Registration', UnderReview: 'Registration', Approved: 'Registration',
        Solution: 'Collaboration', Commercial: 'Collaboration',
        Negotiation: 'Closing', ClosedLost: 'Closing',
        ClosedWon: 'Expansion', Migrated: 'Expansion',
      };
      const dist: Record<string, number> = { Registration: 0, Collaboration: 0, Closing: 0, Expansion: 0 };
      deals.forEach(d => {
        const opStage = d.stage as string;
        const mStage = opToMaturity[opStage] || 'Registration';
        if (dist[mStage] !== undefined) dist[mStage]++;
      });
      setDealMaturityDistribution(dist);
    }
  }, [deals]);

  const totalPartners = Object.values(maturityDistribution).reduce((sum, n) => sum + n, 0);
  const strategicCount = (maturityDistribution.Relational || 0) + (maturityDistribution.Symbiotic || 0);
  const strategicPct = totalPartners > 0 ? Math.round((strategicCount / totalPartners) * 100) : 0;

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-label uppercase tracking-[0.2em] text-on-surface-variant font-semibold text-[10px] mb-2">Transaction Hub</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-black dark:text-white">Deal Registration</h1>
        </div>
        <button 
          onClick={onNewDeal}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-black to-[#333] dark:from-white dark:to-[#e8e8ed] text-white rounded-xl shadow-lg hover:shadow-black/10 dark:shadow-white/10 transition-all active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="font-bold tracking-tight">Register New Deal</span>
        </button>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-black dark:bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-medium mb-1">Total Pipeline Value</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-black dark:text-white">$14.2M</span>
              <span className="text-xs font-bold text-secondary flex items-center gap-1">+12% <TrendingUp className="w-3 h-3" /></span>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-medium mb-1">Win Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-black dark:text-white">64.5%</span>
              <span className="text-xs font-bold text-tertiary flex items-center gap-1">-2% <TrendingDown className="w-3 h-3" /></span>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-medium mb-1">Average Deal Cycle</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-black dark:text-white">82 Days</span>
              <span className="text-xs font-bold text-secondary flex items-center gap-1">Best <Verified className="w-3 h-3" /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Relationship Maturity Distribution */}
      <div className="bg-surface-container-low rounded-2xl p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-[0.2em] mb-2">Partner Ecosystem</p>
            <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">关系深度分布</h2>
            <p className="text-sm text-on-surface-variant mt-1">4 阶段关系深度演进总览 · 战略层占比 {strategicPct}%</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-black dark:text-white">{totalPartners}</div>
            <div className="text-xs text-on-surface-variant">活跃伙伴</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex h-10 rounded-xl overflow-hidden mb-6 shadow-inner bg-neutral-100/50 dark:bg-neutral-800/50">
          {[
            { key: 'Transactional', label: '准入期', icon: Zap, color: 'bg-sky-500', hoverColor: 'hover:bg-sky-400', textColor: 'text-sky-700' },
            { key: 'Transitional', label: '赋能期', icon: BookOpen, color: 'bg-indigo-500', hoverColor: 'hover:bg-indigo-400', textColor: 'text-indigo-700' },
            { key: 'Relational', label: '协同期', icon: Handshake, color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-400', textColor: 'text-emerald-700' },
            { key: 'Symbiotic', label: '共生期', icon: Globe, color: 'bg-amber-500', hoverColor: 'hover:bg-amber-400', textColor: 'text-amber-700' },
          ].map((stage) => {
            const count = maturityDistribution[stage.key] || 0;
            const pct = totalPartners > 0 ? (count / totalPartners) * 100 : 0;
            return (
              <div
                key={stage.key}
                className={`${stage.color} ${stage.hoverColor} transition-all duration-500 flex items-center justify-center cursor-pointer group relative overflow-hidden`}
                style={{ width: `${Math.max(pct, 5)}%` }}
                title={`${stage.label}: ${count} 家 (${pct.toFixed(0)}%)`}
              >
                {pct > 10 && (
                  <span className="text-white text-sm font-bold">{count}</span>
                )}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
              </div>
            );
          })}
        </div>

        {/* Stage Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'Transactional', label: '准入期', short: '交易驱动', icon: Zap, color: 'bg-sky-500/10', textColor: 'text-sky-700', border: 'border-sky-200' },
            { key: 'Transitional', label: '赋能期', short: '能力过渡', icon: BookOpen, color: 'bg-indigo-500/10', textColor: 'text-indigo-700', border: 'border-indigo-200' },
            { key: 'Relational', label: '协同期', short: '关系驱动', icon: Handshake, color: 'bg-emerald-500/10', textColor: 'text-emerald-700', border: 'border-emerald-200' },
            { key: 'Symbiotic', label: '共生期', short: '战略驱动', icon: Globe, color: 'bg-amber-500/10', textColor: 'text-amber-700', border: 'border-amber-200' },
          ].map((stage) => {
            const count = maturityDistribution[stage.key] || 0;
            const pct = totalPartners > 0 ? (count / totalPartners) * 100 : 0;
            return (
              <div key={stage.key} className={`p-4 rounded-xl border-2 ${stage.border} ${stage.color} transition-all hover:shadow-md hover:-translate-y-0.5`}>
                <div className="flex items-center justify-between mb-3">
                  <stage.icon className={`w-5 h-5 ${stage.textColor}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${stage.textColor}`}>{pct.toFixed(0)}%</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-extrabold text-black dark:text-white">{count}</span>
                  <span className="text-xs text-on-surface-variant">家</span>
                </div>
                <div className={`text-sm font-semibold ${stage.textColor}`}>{stage.label}</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">{stage.short}</div>
              </div>
            );
          })}
        </div>

        {/* Tier Note */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50/50 to-emerald-50/50 border border-amber-200/50 dark:from-amber-900/20 dark:to-emerald-900/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-black dark:text-white mb-1">分级管理策略</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                <span className="text-emerald-700 font-semibold">战略层 {strategicCount} 家</span>（{strategicPct}%）：协同期 + 共生期，重点通过联合方案共创、QBR 对齐战略、深度赋能保持关系粘性；
                <span className="ml-1 text-sky-700 font-semibold">规模层 {totalPartners - strategicCount} 家</span>：准入期 + 赋能期，通过自动化流程、标准化培训和商机推送快速激活。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Lifecycle Maturity Distribution */}
      <div className="bg-surface-container-low rounded-2xl p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-[0.2em] mb-2">Opportunity Ecosystem</p>
            <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">商机生命周期分布</h2>
            <p className="text-sm text-on-surface-variant mt-1">4 阶段商机关系深度总览 · 已赢单 + 成交期占比 {(() => {
              const total = (dealMaturityDistribution.Registration || 0) + (dealMaturityDistribution.Collaboration || 0) + (dealMaturityDistribution.Closing || 0) + (dealMaturityDistribution.Expansion || 0);
              const advanced = (dealMaturityDistribution.Closing || 0) + (dealMaturityDistribution.Expansion || 0);
              return total > 0 ? Math.round((advanced / total) * 100) : 0;
            })()}%</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-black dark:text-white">{Object.values(dealMaturityDistribution).reduce((a, b) => a + b, 0)}</div>
            <div className="text-xs text-on-surface-variant">活跃商机</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex h-10 rounded-xl overflow-hidden mb-6 shadow-inner bg-neutral-100/50 dark:bg-neutral-800/50">
          {[
            { key: 'Registration', label: '报备期', icon: FileText, color: 'bg-sky-500', hoverColor: 'hover:bg-sky-400' },
            { key: 'Collaboration', label: '协同期', icon: Users, color: 'bg-indigo-500', hoverColor: 'hover:bg-indigo-400' },
            { key: 'Closing', label: '成交期', icon: CheckCircle2, color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-400' },
            { key: 'Expansion', label: '循环期', icon: RefreshCw, color: 'bg-amber-500', hoverColor: 'hover:bg-amber-400' },
          ].map((stage) => {
            const count = dealMaturityDistribution[stage.key as keyof typeof dealMaturityDistribution] || 0;
            const total = Object.values(dealMaturityDistribution).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div
                key={stage.key}
                className={`${stage.color} ${stage.hoverColor} transition-all duration-500 flex items-center justify-center cursor-pointer group relative overflow-hidden`}
                style={{ width: `${Math.max(pct, 5)}%` }}
                title={`${stage.label}: ${count} 个 (${pct.toFixed(0)}%)`}
              >
                {pct > 10 && <span className="text-white text-sm font-bold">{count}</span>}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
              </div>
            );
          })}
        </div>

        {/* Stage Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'Registration', label: '报备期', short: '确权保护', icon: FileText, color: 'bg-sky-500/10', textColor: 'text-sky-700', border: 'border-sky-200' },
            { key: 'Collaboration', label: '协同期', short: '联合方案', icon: Users, color: 'bg-indigo-500/10', textColor: 'text-indigo-700', border: 'border-indigo-200' },
            { key: 'Closing', label: '成交期', short: '利益博弈', icon: CheckCircle2, color: 'bg-emerald-500/10', textColor: 'text-emerald-700', border: 'border-emerald-200' },
            { key: 'Expansion', label: '循环期', short: '生态循环', icon: RefreshCw, color: 'bg-amber-500/10', textColor: 'text-amber-700', border: 'border-amber-200' },
          ].map((stage) => {
            const count = dealMaturityDistribution[stage.key as keyof typeof dealMaturityDistribution] || 0;
            const total = Object.values(dealMaturityDistribution).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={stage.key} className={`p-4 rounded-xl border-2 ${stage.border} ${stage.color} transition-all hover:shadow-md hover:-translate-y-0.5`}>
                <div className="flex items-center justify-between mb-3">
                  <stage.icon className={`w-5 h-5 ${stage.textColor}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${stage.textColor}`}>{pct.toFixed(0)}%</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-extrabold text-black dark:text-white">{count}</span>
                  <span className="text-xs text-on-surface-variant">个</span>
                </div>
                <div className={`text-sm font-semibold ${stage.textColor}`}>{stage.label}</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">{stage.short}</div>
              </div>
            );
          })}
        </div>

        {/* Tier Note */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-sky-50/50 to-indigo-50/50 border border-sky-200/50 dark:from-sky-900/20 dark:to-indigo-900/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
              <TrendingDown className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-black dark:text-white mb-1">商机演进漏斗策略</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                <span className="text-sky-700 font-semibold">报备期 {(dealMaturityDistribution.Registration || 0)} 个</span>：
                审核时效 ≤ 3 天，冲突快速裁决，建立信任基础；
                <span className="ml-1 text-indigo-700 font-semibold">协同期 {(dealMaturityDistribution.Collaboration || 0)} 个</span>：
                分配售前资源、联合拜访、PoC 支持，推动方案落地；
                <span className="ml-1 text-emerald-700 font-semibold">成交期 {(dealMaturityDistribution.Closing || 0)} 个</span>：
                价格审批、合同条款、交付周期的商务控制；
                <span className="ml-1 text-amber-700 font-semibold">循环期 {(dealMaturityDistribution.Expansion || 0)} 个</span>：
                客户成功回访、续约管理、二次销售，形成长期生态循环。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard deals={deals} />

      {/* Floating Insights Panel (Glassmorphism) */}
      <div className="fixed bottom-8 right-8 w-80 bg-white/40 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 z-30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold tracking-tight text-black dark:text-white">Curated Insights</h3>
          <Sparkles className="w-4 h-4 text-black dark:text-white" />
        </div>
        <div className="space-y-4">
          <div className="p-3 bg-black dark:bg-white/5 rounded-lg border border-black dark:border-white/10">
            <p className="text-[11px] font-medium leading-relaxed">
              <span className="font-bold text-black dark:text-white">Negotiation Phase:</span> 3 deals have been stationary for &gt;15 days. Suggest following up with <span className="underline">Prime Partners</span>.
            </p>
          </div>
          <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/10">
            <p className="text-[11px] font-medium leading-relaxed">
              <span className="font-bold text-secondary">Conflict Detected:</span> BioHealth Research matches an existing direct enterprise target. Review required.
            </p>
          </div>
        </div>
        <button className="w-full mt-4 py-2 text-xs font-bold text-black dark:text-white-container bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
          View Full Intelligence Report
        </button>
      </div>
    </div>
  );
};
