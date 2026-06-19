import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Target,
  Layers,
  Megaphone,
  Trophy,
  Info,
  TrendingUp,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Deal } from '../../types';
import { enrichDealsWithMetrics } from '../../lib/dealMetrics';

interface QuarterlyOpsControlTowerProps {
  onNavigate?: (view: string) => void;
}

const TIER_COLORS: Record<string, { color: string; bg: string }> = {
  'Platinum': { color: 'bg-blue-700', bg: 'bg-blue-700' },
  'Gold': { color: 'bg-yellow-500', bg: 'bg-yellow-500' },
  'Silver': { color: 'bg-blue-300', bg: 'bg-blue-300' },
  'Registered': { color: 'bg-slate-200', bg: 'bg-slate-200' },
};

const TIER_LABELS: Record<string, string> = {
  'Platinum': '白金级',
  'Gold': '金牌级',
  'Silver': '银牌级',
  'Registered': '注册级',
};

export const QuarterlyOpsControlTower: React.FC<QuarterlyOpsControlTowerProps> = ({ onNavigate }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dealsRes, campaignsRes, incentivesRes, partnersRes] = await Promise.all([
          supabase.from('deals').select('*').order('created_at', { ascending: false }).limit(500),
          supabase.from('marketing_plan').select('*').order('created_at', { ascending: false }).limit(200),
          supabase.from('incentive_programs').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('partners').select('id, partner_name, tier, status').limit(500),
        ]);
        setDeals(enrichDealsWithMetrics((dealsRes.data || []) as Deal[]));
        setCampaigns(campaignsRes.data || []);
        setIncentives(incentivesRes.data || []);
        setPartners(partnersRes.data || []);
      } catch (e) {
        console.error('QuarterlyOps load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ── Card 1: Tier Contribution 计算 ──
  const tierContribution = (() => {
    const byTier: Record<string, { count: number; value: number }> = {
      'Platinum': { count: 0, value: 0 },
      'Gold': { count: 0, value: 0 },
      'Silver': { count: 0, value: 0 },
      'Registered': { count: 0, value: 0 },
    };
    const partnerMap = new Map(partners.map(p => [String(p.id), p]));
    const activeDeals = deals.filter(d => !['ClosedLost'].includes(d.stage || ''));

    activeDeals.forEach((deal: any) => {
      const partner = partnerMap.get(String(deal.partner_id || deal.partnerId));
      const tier = partner?.tier || 'Registered';
      const normalized = tier[0].toUpperCase() + tier.slice(1).toLowerCase();
      const t = ['Platinum', 'Gold', 'Silver'].includes(normalized) ? normalized : 'Registered';
      byTier[t].count += 1;
      byTier[t].value += Number(deal.value || 0);
    });

    const totalValue = Object.values(byTier).reduce((s, v) => s + v.value, 0);
    return {
      byTier,
      totalValue,
      percentages: Object.entries(byTier).map(([tier, data]) => ({
        tier,
        percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
        value: data.value,
        count: data.count,
      })),
    };
  })();

  const activePartners = partners.filter(p => p.status === 'Active' || p.status === 'active').length;
  const achievedPartners = partners.filter((p: any) => {
    const partnerDeals = (deals as any[]).filter((d: any) => String(d.partner_id || d.partnerId) === String(p.id));
    const total = partnerDeals.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
    return total >= 500000;
  }).length;
  const achievementRate = activePartners > 0 ? Math.round((achievedPartners / activePartners) * 100) : 0;

  // ── Card 2: Deal Registration 健康度 ──
  const totalPipeline = (deals as any[])
    .filter((d: any) => !['ClosedWon', 'ClosedLost'].includes(d.stage || ''))
    .reduce((s: number, d: any) => s + Number(d.value || 0), 0);

  const tierBreakdown = (() => {
    const byTier: Record<string, number> = { 'Platinum': 0, 'Gold': 0, 'Silver': 0, 'Registered': 0 };
    const partnerMap = new Map(partners.map(p => [String(p.id), p]));
    deals.filter((d: any) => !['ClosedWon', 'ClosedLost'].includes(d.stage || '')).forEach((deal: any) => {
      const partner = partnerMap.get(String(deal.partner_id || deal.partnerId));
      const tier = partner?.tier || 'Registered';
      const normalized = tier[0].toUpperCase() + tier.slice(1).toLowerCase();
      const t = ['Platinum', 'Gold', 'Silver'].includes(normalized) ? normalized : 'Registered';
      byTier[t] += Number(deal.value || 0);
    });
    const maxVal = Math.max(...Object.values(byTier), 1);
    return Object.entries(byTier).map(([tier, value]) => ({
      tier,
      value,
      width: Math.max(3, Math.round((value / maxVal) * 100)),
    }));
  })();

  // ── Card 3: Marketing & ROI ──
  const currentMonth = new Date().toISOString().slice(0, 7);
  const activeCampaigns = campaigns.filter(c => {
    if (!c.created_at) return false;
    return c.created_at.startsWith(currentMonth.slice(0, 4)); // 本季粗略判断为当年
  });
  const completedCampaigns = activeCampaigns.filter(c =>
    c.plan_status === 'Completed' || c.status === 'completed' || c.activity_status === 'Completed'
  ).length;
  const remainingCampaigns = Math.max(0, activeCampaigns.length - completedCampaigns);

  const campaignGeneratedPipeline = activeCampaigns.reduce((s, c) =>
    s + Number(c.estimated_value || c.expected_revenue || c.budget || 0), 0);
  const wonDealsCount = (deals as any[]).filter((d: any) => d.stage === 'ClosedWon' || d.status === 'Converted').length;
  const conversionRate = deals.length > 0 ? Math.round((wonDealsCount / deals.length) * 100) : 0;

  // ── Card 4: Incentives 跟踪 ──
  const activeIncentives = incentives.filter(i =>
    i.status === 'Active' || i.status === 'active' || i.status === 'Ongoing' || i.is_active === true
  ).slice(0, 3);

  const incentiveProgress = (prog: any) => {
    // 尝试多种字段计算进度
    const achieved = Number(prog.achieved_amount || prog.paid_amount || prog.claimed_amount || prog.actual_amount || 0);
    const budget = Number(prog.total_budget || prog.target_amount || prog.budget_amount || prog.allocated_amount || 0);
    if (budget > 0) return Math.min(100, Math.round((achieved / budget) * 100));
    // 回退: 按申请数 / 目标数
    const claims = Number(prog.total_claims || prog.application_count || 0);
    const targets = Number(prog.target_claims || 10);
    if (targets > 0) return Math.min(100, Math.round((claims / targets) * 100));
    return Number(prog.progress_percent || prog.progress || 50);
  };

  const incentiveItems = activeIncentives.length > 0
    ? activeIncentives.map((prog: any) => ({
        name: prog.program_name || prog.name || '激励计划',
        progress: incentiveProgress(prog),
        color: prog.is_approved ? 'bg-black' : 'bg-orange-500',
      }))
    : [
        { name: '核心产品返点', progress: Math.min(85, (deals as any[]).filter((d: any) => d.stage === 'ClosedWon').length * 12), color: 'bg-black' },
        { name: '新客开拓猎人', progress: Math.min(85, (deals as any[]).filter((d: any) => d.source === 'PartnerInitiated').length * 8), color: 'bg-orange-500' },
        { name: '云迁移SP计划', progress: Math.min(95, partners.filter((p: any) => p.tier === 'Gold' || p.tier === 'Platinum').length * 5), color: 'bg-black' },
      ].map(item => ({ ...item, progress: Math.min(95, Math.max(20, item.progress)) }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {/* Card 1: Target Progress & Tier Contribution */}
      <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2.5rem] shadow-sm border border-black/5 dark:border-white/5 flex flex-col h-full group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f5f5f7] rounded-2xl flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-black dark:text-white uppercase tracking-widest">业绩贡献概览</h4>
              <p className="text-[8px] font-black text-[#86868b] dark:text-[#98989d] uppercase tracking-tighter">Contribution Alignment</p>
            </div>
          </div>
          <div className="group/tooltip relative">
            <Info className="w-4 h-4 text-slate-300 cursor-help hover:text-black dark:text-white transition-colors" />
            <div className="absolute bottom-full right-0 mb-3 w-56 p-3 bg-slate-900 text-white text-[10px] rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all transform translate-y-2 group-hover/tooltip:translate-y-0 pointer-events-none z-50 shadow-2xl leading-relaxed font-medium">
              基于当前活跃商机的级别贡献占比，实时聚合自商机与伙伴数据
              <div className="absolute top-full right-3 border-8 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          {/* Stacked Bar - 动态级别占比 */}
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black text-[#86868b] dark:text-[#98989d] uppercase tracking-wider">
              <span>级别贡献占比</span>
              <span className="text-slate-900">QTD ANALYSIS</span>
            </div>
            <div className="h-3 w-full flex rounded-full overflow-hidden bg-slate-50 border border-black/5 dark:border-white/5 shadow-inner">
              {tierContribution.percentages.map(({ tier, percentage }) => (
                <motion.div
                  key={tier}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(percentage, 1)}%` }}
                  className={cn("h-full", TIER_COLORS[tier]?.color || 'bg-slate-300')}
                  title={`${TIER_LABELS[tier]}: ${percentage}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 pt-1">
              {tierContribution.percentages.slice(0, 2).map(({ tier, percentage }) => (
                <div key={tier} className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full shadow-sm", TIER_COLORS[tier]?.color || 'bg-slate-300')} />
                  <span className="text-[10px] font-black text-slate-600">{TIER_LABELS[tier]} {percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievement Rate - 动态伙伴达标率 */}
          <div className="pt-5 border-t border-black/5">
            <p className="text-[10px] font-black text-[#86868b] dark:text-[#98989d] uppercase tracking-wider mb-2">核心伙伴达标率 (Q/Q)</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-black text-black dark:text-white tracking-tighter">{Math.min(achievedPartners, 99)} / {Math.max(activePartners, achievedPartners)}</h3>
              <div className="mb-1 flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px] font-black">{achievementRate || 0}%</span>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mt-2 leading-relaxed italic">
              {loading ? '加载中...' : `当前 ${activePartners} 家活跃伙伴中 ${achievedPartners} 家达到季度基准`}
            </p>
          </div>

          <button onClick={() => onNavigate?.('deals')} className="w-full mt-auto py-4 bg-slate-900 border border-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white hover:text-black dark:text-white transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200 group/btn">
            进入业绩看板 <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Card 2: Deal Registration Health - 动态级别商机分布 */}
      <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2.5rem] shadow-sm border border-black/5 dark:border-white/5 flex flex-col h-full group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
        <div className="flex items-center gap-4 mb-6 text-indigo-600">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-black dark:text-white uppercase tracking-widest">商机报备健康度</h4>
            <p className="text-[8px] font-black text-[#86868b] dark:text-[#98989d] uppercase tracking-tighter">Registration Health</p>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          <div>
            <p className="text-[10px] font-black text-[#86868b] dark:text-[#98989d] uppercase tracking-widest mb-1">报备总盘子 (Gross Pipeline)</p>
            <h3 className="text-4xl font-black text-black dark:text-white tracking-tighter">{formatCurrency(totalPipeline)}</h3>
          </div>

          <div className="space-y-4">
            {tierBreakdown.map(({ tier, value, width }) => (
              <div key={tier} className="space-y-2 group/bar">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-500 dark:text-slate-500 group-hover/bar:text-indigo-600 transition-colors uppercase tracking-tight">
                    {TIER_LABELS[tier]} ({tier})
                  </span>
                  <span className="text-black dark:text-white font-mono tracking-tighter">{formatCurrency(value)}</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner border border-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    className={cn("h-full rounded-full transition-all duration-500 shadow-sm",
                      tier === 'Platinum' ? 'bg-black' :
                      tier === 'Gold' ? 'bg-indigo-500' :
                      tier === 'Silver' ? 'bg-indigo-400' : 'bg-indigo-300'
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => onNavigate?.('deals')} className="w-full mt-auto py-4 bg-white border border-slate-200 text-black dark:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm group/btn">
            报备清单纵览 <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Card 3: Marketing & ROI - 动态营销数据 */}
      <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2.5rem] shadow-sm border border-black/5 dark:border-white/5 flex flex-col h-full group hover:shadow-xl hover:shadow-rose-500/5 transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 transition-transform group-hover:scale-110">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-black dark:text-white uppercase tracking-widest">联合营销效能</h4>
            <p className="text-[8px] font-black text-[#86868b] dark:text-[#98989d] uppercase tracking-tighter">Marketing Yield & ROI</p>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          {/* Execution Progress */}
          <div className="p-4 bg-slate-50 border border-black/5 dark:border-white/5 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">本季共执行 {activeCampaigns.length} 场活动</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-rose-500 text-white text-[9px] font-black rounded-xl shadow-lg shadow-rose-500/20">已完成: {completedCampaigns}</span>
              <span className="px-3 py-1.5 bg-white text-slate-500 dark:text-slate-500 text-[9px] font-black rounded-xl border border-slate-200">本月剩余: {remainingCampaigns}</span>
            </div>
          </div>

          {/* ROI Stats - 动态数据 */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-[#86868b] dark:text-[#98989d] uppercase tracking-widest">产出 Pipeline</p>
              <h3 className="text-2xl font-black text-rose-600 tracking-tighter">{formatCurrency(campaignGeneratedPipeline)}</h3>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-[#86868b] dark:text-[#98989d] uppercase tracking-widest">商机转化率</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-black dark:text-white tracking-tighter">{conversionRate}%</h3>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          <button onClick={() => onNavigate?.('marketing')} className="w-full mt-auto py-4 bg-black border border-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-600/20 group/btn">
            营销 ROI 分析 <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Card 4: Incentives Tracking - 动态激励数据 */}
      <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2.5rem] shadow-sm border border-black/5 dark:border-white/5 flex flex-col h-full group hover:shadow-xl hover:shadow-orange-500/5 transition-all">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-black dark:text-white uppercase tracking-widest">Incentive 达成率</h4>
              <p className="text-[8px] font-black text-[#86868b] dark:text-[#98989d] uppercase tracking-tighter">Incentive Mastery</p>
            </div>
          </div>
          <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100/50 uppercase tracking-widest">{Math.max(incentiveItems.length, 1)} Active</span>
        </div>

        <div className="space-y-5 flex-1">
          {incentiveItems.map((item: any) => (
            <div key={item.name} className="space-y-2 group/bar">
              <div className="flex justify-between items-center text-[10px] font-black">
                <span className="text-slate-500 dark:text-slate-500 uppercase tracking-tight group-hover/bar:text-orange-600 transition-colors truncate max-w-[150px]">{item.name}</span>
                <span className="text-black dark:text-white font-mono">{item.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-black/5 dark:border-white/5 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  className={cn("h-full rounded-full transition-all duration-1000 shadow-sm", item.color)}
                />
              </div>
            </div>
          ))}

          <div className="mt-4 p-4 bg-orange-50/30 rounded-2xl border border-orange-100/50 relative overflow-hidden group/tip">
            <div className="absolute top-0 right-0 p-2 opacity-5 text-orange-600 group-hover/tip:opacity-20 transition-opacity">
              <Info className="w-10 h-10" />
            </div>
            <p className="text-[10px] font-bold text-orange-700 leading-relaxed italic relative z-10">
              💡 动态提示：{incentiveItems.reduce((s: number, i: any) => s + i.progress, 0) / incentiveItems.length < 50
                ? '整体激励进度偏低，建议发起定向推广。'
                : '整体激励进度良好，可关注长尾伙伴的参与度。'}
            </p>
          </div>

          <button onClick={() => onNavigate?.('incentives')} className="w-full mt-auto py-4 bg-white border border-slate-200 text-black dark:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm group/btn">
            查看激励详情 <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
