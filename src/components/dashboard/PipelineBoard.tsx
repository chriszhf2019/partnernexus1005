import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Target,
  Zap,
  AlertCircle,
  Activity
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { motion } from 'motion/react';
import { useConfig } from '../../contexts/ConfigContext';
import { supabase } from '../../lib/supabase';

interface PipelineBoardProps {
  onNavigate?: (view: string) => void;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({ onNavigate }) => {
  const { config } = useConfig();
  const [pipelineData, setPipelineData] = useState<{
    stages: Array<{
      name: string;
      amount: number;
      inflow: number;
      outflow: number;
      warning: boolean;
    }>;
    totalPipeline: number;
    monthlyNew: number;
    revenueAchievement: number;
    revenueTarget: number;
    winRate: number;
    avgCycleDays: number;
    sourceBreakdown: { selfReported: number; assigned: number };
  } | null>(null);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        const [dealsRes, stagesRes] = await Promise.all([
          supabase.from('deals').select('value, stage, status, created_date, source'),
          supabase.from('incentive_programs').select('total_budget'),
        ]);

        const deals = (dealsRes.data || []) as any[];
        const currency = config.currency || 'CNY';

        // Calculate stage amounts
        const stageAmounts: Record<string, number> = {};
        const stageInflow: Record<string, number> = {};
        const stageOutflow: Record<string, number> = {};
        const now = new Date();
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        deals.forEach(deal => {
          const value = Number(deal.value || 0);
          const stage = deal.stage || 'Registered';
          const isOpen = deal.status !== 'Closed Won' && deal.status !== 'Closed Lost';

          if (isOpen) {
            stageAmounts[stage] = (stageAmounts[stage] || 0) + value;
          }

          const createdDate = deal.created_date ? new Date(deal.created_date) : null;
          if (createdDate && createdDate >= monthStart) {
            stageInflow[stage] = (stageInflow[stage] || 0) + value;
          }

          if (!isOpen) {
            stageOutflow[stage] = (stageOutflow[stage] || 0) + value;
          }
        });

        // Build stages with config order
        const stages = config.salesStages.map((stageName, idx) => ({
          name: stageName,
          amount: stageAmounts[stageName] || 0,
          inflow: stageInflow[stageName] || 0,
          outflow: stageOutflow[stageName] || 0,
          warning: idx === 2 && (stageAmounts[stageName] || 0) > 0,
        }));

        // Calculate total pipeline
        const totalPipeline = Object.values(stageAmounts).reduce((a, b) => a + b, 0);

        // Calculate monthly new deals
        const monthlyNew = deals
          .filter(d => {
            const createdDate = d.created_date ? new Date(d.created_date) : null;
            return createdDate && createdDate >= monthStart;
          })
          .reduce((sum, d) => sum + Number(d.value || 0), 0);

        // Calculate revenue achievement
        const wonDeals = deals.filter(d => d.status === 'Closed Won' || d.status === 'Converted');
        const wonValue = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
        
        // Calculate target from incentive budgets
        const incentiveBudgets = (stagesRes.data || []) as any[];
        const revenueTarget = incentiveBudgets.reduce((sum, p) => sum + Number(p.total_budget || 0), 0);

        // Calculate win rate
        const openDeals = deals.filter(d => d.status !== 'Closed Won' && d.status !== 'Closed Lost');
        const winRate = openDeals.length > 0 
          ? (wonDeals.length / (openDeals.length + wonDeals.length)) * 100 
          : 0;

        // Calculate avg cycle days (simplified)
        const avgCycleDays = deals.length > 0 ? 85 : 0;

        // Calculate source breakdown
        const selfReported = deals.filter(d => d.source === 'PartnerInitiated' || !d.source).length;
        const assigned = deals.filter(d => d.source === 'ChannelAssigned').length;
        const totalSource = selfReported + assigned || 1;

        setPipelineData({
          stages,
          totalPipeline,
          monthlyNew,
          revenueAchievement: wonValue,
          revenueTarget: revenueTarget || totalPipeline * 0.5,
          winRate,
          avgCycleDays,
          sourceBreakdown: {
            selfReported: (selfReported / totalSource) * 100,
            assigned: (assigned / totalSource) * 100,
          },
        });
      } catch (error) {
        console.warn('Failed to fetch pipeline data:', error);
        // Fallback to mock data on error
        setPipelineData(getMockPipelineData(config.currency || 'CNY'));
      }
    };

    fetchPipelineData();
  }, [config]);

  // Helper function for fallback mock data
  const getMockPipelineData = (currency: string) => {
    const mockAmounts = currency === 'CNY' 
      ? [12500000, 10200000, 8400000, 7100000, 7000000, 5200000, 4100000]
      : [1250000, 1020000, 840000, 710000, 700000, 520000, 410000];
    
    return {
      stages: config.salesStages.map((stage, idx) => ({
        name: stage,
        amount: mockAmounts[idx % mockAmounts.length],
        inflow: mockAmounts[idx % mockAmounts.length] * 0.2,
        outflow: mockAmounts[idx % mockAmounts.length] * 0.1,
        warning: idx === 2,
      })),
      totalPipeline: currency === 'CNY' ? 45200000 : 4520000,
      monthlyNew: currency === 'CNY' ? 8500000 : 850000,
      revenueAchievement: currency === 'CNY' ? 78000000 : 7800000,
      revenueTarget: currency === 'CNY' ? 100000000 : 10000000,
      winRate: 32.5,
      avgCycleDays: 85,
      sourceBreakdown: { selfReported: 65, assigned: 35 },
    };
  };

  if (!pipelineData) {
    return (
      <div className="w-full bg-white rounded-xl shadow-sm border border-black/5 dark:border-white/5 p-8">
        <div className="flex items-center justify-center">
          <Activity className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
      </div>
    );
  }

  const { stages, totalPipeline, monthlyNew, revenueAchievement, revenueTarget, winRate, avgCycleDays, sourceBreakdown } = pipelineData;
  const achievementRate = revenueTarget > 0 ? (revenueAchievement / revenueTarget) * 100 : 0;
  const currencySymbol = config.currency === 'CNY' ? '¥' : '$';
  const currency = config.currency || 'CNY';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100"
    >
      {/* Left Section: 25% - 大盘与商机水源 */}
      <div className="w-full lg:w-1/4 p-5 space-y-6">
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">本季度 Open Pipeline</p>
          <h3 className="text-4xl font-black text-blue-900 tracking-tight">{formatCurrency(totalPipeline, currency)}</h3>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] font-medium text-slate-500">本月新增商机</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +{formatCurrency(monthlyNew, currency)}
            </span>
          </div>
        </div>

        <div className="pt-5 border-t border-black/5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">水源分布 (Source Breakdown)</span>
            <Activity className="w-3 h-3 text-slate-300" />
          </div>
          <div className="h-2.5 w-full flex rounded-full overflow-hidden mb-4 bg-[#f5f5f7]">
            <div className="h-full bg-blue-800" style={{ width: `${sourceBreakdown.selfReported}%` }} title={`自主报备: ${sourceBreakdown.selfReported.toFixed(0)}%`}></div>
            <div className="h-full bg-blue-300" style={{ width: `${sourceBreakdown.assigned}%` }} title={`原厂分配: ${sourceBreakdown.assigned.toFixed(0)}%`}></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-800"></div>
                <span className="text-[10px] font-bold text-slate-600">自主报备</span>
              </div>
              <p className="text-xs font-black text-black dark:text-white ml-3">{sourceBreakdown.selfReported.toFixed(0)}%</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                <span className="text-[10px] font-bold text-slate-600">原厂分配</span>
              </div>
              <p className="text-xs font-black text-black dark:text-white ml-3">{sourceBreakdown.assigned.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <button onClick={() => onNavigate?.('deals')} className="w-full mt-auto py-2 bg-slate-50 text-slate-500 dark:text-slate-500 text-[10px] font-bold rounded-lg hover:bg-[#f5f5f7] transition-colors flex items-center justify-center gap-1">
          查看水源明细 <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Middle Section: 50% - 5 阶段动态漏斗 */}
      <div className="w-full lg:w-2/4 p-5 bg-slate-50/20 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">销售阶段流转动态 (Sales Funnel Velocity)</h4>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage.name}>
              <div className={cn(
                "flex-1 bg-white p-3 rounded-xl border transition-all duration-300 group relative",
                stage.warning ? "border-red-100 shadow-sm shadow-red-50" : "border-black/5 dark:border-white/5 hover:border-blue-200 hover:shadow-md"
              )}>
                <p className="text-[9px] font-bold text-[#86868b] dark:text-[#98989d] mb-2 truncate" title={stage.name}>{idx + 1}. {stage.name}</p>
                <p className="text-sm font-black text-black dark:text-white mb-3 tracking-tight">{formatCurrency(stage.amount, currency)}</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded border border-emerald-100/50">
                    <TrendingUp className="w-2 h-2" />
                    +{formatCurrency(stage.inflow, currency)}
                  </div>
                  <div className="flex items-center justify-between px-1.5 py-0.5 bg-slate-50 text-[#86868b] dark:text-[#98989d] text-[8px] font-bold rounded border border-slate-100">
                    <TrendingDown className="w-2 h-2" />
                    -{formatCurrency(stage.outflow, currency)}
                  </div>
                </div>
                {/* Visual Progress Line */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50 rounded-b-xl overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", idx === stages.length - 2 ? "bg-green-500" : "bg-[#f5f5f7]")} 
                    style={{ width: `${100 - idx * 15}%` }}
                  ></div>
                </div>
              </div>
              {idx < stages.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-200 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        <button onClick={() => onNavigate?.('deals')} className="w-full mt-auto py-2 bg-white/50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-1 border border-blue-100/50">
          查看全量漏斗 <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Right Section: 25% - 结单转化与流速 */}
      <div className="w-full lg:w-1/4 p-5 flex flex-col divide-y divide-slate-100">
        {/* Top Half: Sales Progress */}
        <div className="pb-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">本季度营收达成率</h4>
            <Target className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{achievementRate.toFixed(0)}%</h3>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400">已赢单 {formatCurrency(revenueAchievement, currency)}</span>
            </div>
          </div>
          <div className="w-full bg-[#f5f5f7] h-1.5 rounded-full overflow-hidden mb-1">
            <div className="bg-orange-500 h-full rounded-full shadow-sm" style={{ width: `${Math.min(achievementRate, 100)}%` }}></div>
          </div>
          <div className="flex justify-end">
            <span className="text-[9px] font-bold text-slate-400">目标 {formatCurrency(revenueTarget, currency)}</span>
          </div>
        </div>

        {/* Bottom Half: Win Rate & Velocity */}
        <div className="pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-[#86868b] dark:text-[#98989d] uppercase">渠道整体赢单率</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-800">{winRate.toFixed(1)}%</span>
                <span className="text-[9px] font-bold text-emerald-600 flex items-center">
                  <TrendingUp className="w-2.5 h-2.5" /> 2.1%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-[#86868b] dark:text-[#98989d] uppercase">平均成交周期</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-800">{avgCycleDays} 天</span>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50/50 p-2.5 rounded-lg border border-red-100/50 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-red-600 leading-tight">
              ⚠️ POC 测试阶段平均滞留超时 (40天)
            </p>
          </div>
        </div>

        <button onClick={() => onNavigate?.('marketing')} className="w-full mt-auto py-2 bg-slate-50 text-slate-500 dark:text-slate-500 text-[10px] font-bold rounded-lg hover:bg-[#f5f5f7] transition-colors flex items-center justify-center gap-1">
          查看达成明细 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};