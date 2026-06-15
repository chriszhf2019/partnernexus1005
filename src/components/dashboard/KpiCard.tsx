import React, { useState, memo, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Clock, Target, Calendar, ChevronRight } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { TimeSeriesMetric, AchievementData } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface KpiCardProps {
  data: TimeSeriesMetric;
  unit?: string;
  isCurrency?: boolean;
}

type TimePerspective = 'monthly' | 'quarterly' | 'yearly';

export const KpiCard: React.FC<KpiCardProps> = memo(({ data, unit = '', isCurrency = false }) => {
  const [perspective, setPerspective] = useState<TimePerspective>('quarterly');
  const [showTooltip, setShowTooltip] = useState(false);

  const currentAchievement: AchievementData = data.achievements[perspective];

  const formatValue = (val: number) => {
    if (isCurrency) return formatCurrency(val);
    return `${val.toLocaleString()}${unit}`;
  };

  const getMetricContext = (name: string) => {
    switch (name) {
      case '营收完成度': return {
        desc: '衡量已签约订单总额与选定时间目标的达成情况。',
        sig: '反映业务成果产出，决策季末绩效。',
        tip: '落后时需核查 Pipeline 转化效率。'
      };
      case '活跃伙伴数': return {
        desc: '最近30天内有关键业务行为（下单/报备/激励）的伙伴。',
        sig: '预测未来商机存量，是生态健康度的“先行指标”。',
        tip: '下单率低表示伙伴“空转”，需加强商机撮合。'
      };
      case 'Open Pipeline': return {
        desc: '当前处于活跃状态、预计在规定时间内结案的商机池。',
        sig: '决定未来业绩的确定性，区分存量与新增动能。',
        tip: '需关注“历史积存”占比，防止死单堆积。'
      };
      case '线索转化率': return {
        desc: '从 MQL 到正式签约的漏斗全过程转化效率。',
        sig: '反映伙伴素质与方案能力，是“四力”中能力的体现。',
        tip: '转化周期拉长往往意味着方案适配度下降。'
      };
      default: return { desc: '', sig: '', tip: '' };
    }
  };

  const context = getMetricContext(data.metric_name);

  const AchievementTag = ({ label, value }: { label: string; value: number }) => {
    const isPositive = value > 0;
    const Icon = value === 0 ? Minus : isPositive ? TrendingUp : TrendingDown;
    
    return (
      <div className="flex items-center gap-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
        <div className={cn(
          "flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black",
          value === 0 ? "bg-[#f5f5f7] text-slate-500" :
          isPositive ? "bg-emerald-50/80 text-emerald-600" : "bg-red-50/80 text-red-600"
        )}>
          <Icon className="w-2.5 h-2.5 mr-0.5" />
          {Math.abs(value).toFixed(1)}%
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-black dark:border-white/20 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden flex flex-col min-h-[380px]">
      <div className="relative space-y-4 flex-1">
        {/* Header: Name & Perspective Switcher */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.metric_name}</p>
            <div className="relative">
              <Info 
                className="w-3 h-3 text-slate-300 cursor-help hover:text-black dark:text-white transition-colors" 
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              />
              <AnimatePresence>
                {showTooltip && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900 text-white rounded-xl shadow-2xl z-50 pointer-events-none"
                  >
                    <div className="space-y-2 text-[9px] leading-relaxed">
                      <p><span className="text-black dark:text-white font-black uppercase tracking-widest block mb-0.5">定义:</span> {context.desc}</p>
                      <p><span className="text-amber-400 font-black uppercase tracking-widest block mb-0.5">意义:</span> {context.sig}</p>
                      <div className="h-px bg-white/10 my-1" />
                      <p className="text-emerald-400 font-bold italic">建议: {context.tip}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            {(['monthly', 'quarterly', 'yearly'] as TimePerspective[]).map((p) => (
              <button
                key={p}
                onClick={() => setPerspective(p)}
                className={cn(
                  "px-2 py-0.5 text-[8px] font-black uppercase transition-all rounded",
                  perspective === p ? "bg-white text-black dark:text-white shadow-sm ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {p.charAt(0)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Value & Target */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {formatValue(currentAchievement.current)}
            </h3>
          </div>
          <p className="text-[10px] font-bold text-slate-400">
            Target ({perspective}): {formatValue(currentAchievement.target)}
          </p>
        </div>

        {/* Growth Stats */}
        <div className="flex items-center gap-4 py-3 border-y border-black/5">
          <AchievementTag label="YoY (同比)" value={data.yoy} />
          <AchievementTag label="QoQ (环比)" value={data.qoq} />
        </div>

        {/* Dynamic Detail Content */}
        <div className="py-2">
          {data.metric_name === '活跃伙伴数' && data.active_split && (
            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">活跃构成 (按优先级)</p>
              <div className="space-y-2">
                {[
                  { label: '下单伙伴', val: data.active_split.order_placing, color: 'bg-black dark:bg-white' },
                  { label: '报备伙伴', val: data.active_split.leads_reporting, color: 'bg-blue-400' },
                  { label: '其他参与', val: data.active_split.incentive_participants, color: 'bg-slate-300' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between group/item">
                    <span className="text-[10px] font-bold text-slate-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-900">{item.val.value}</span>
                      <div className="w-16 h-1 bg-[#f5f5f7] rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-700", item.color)} style={{ width: `${(item.val.value / data.current_value) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.metric_name === 'Open Pipeline' && data.pipeline_batch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="w-2.5 h-2.5 text-black dark:text-white" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">当季预期结单</span>
                  </div>
                  <p className="text-xs font-black text-slate-800">{formatValue(data.pipeline_batch.current_q_target)}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-2.5 h-2.5 text-blue-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">下季储备件数</span>
                  </div>
                  <p className="text-xs font-black text-slate-800">{data.pipeline_batch.next_q_count} 件</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-black text-slate-400">
                  <span>当季新增: {data.pipeline_batch.new_in_q_ratio}%</span>
                  <span>历史积存: {data.pipeline_batch.historical_ratio}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#f5f5f7] rounded-full overflow-hidden flex">
                  <div className="h-full bg-black dark:bg-white" style={{ width: `${data.pipeline_batch.new_in_q_ratio}%` }} />
                  <div className="h-full bg-slate-300" style={{ width: `${data.pipeline_batch.historical_ratio}%` }} />
                </div>
              </div>
            </div>
          )}

          {data.metric_name === '线索转化率' && data.conversion_details && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <Clock className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">平均转化周期</p>
                  <p className="text-sm font-black text-emerald-700">{data.conversion_details.cycle_days} 天</p>
                </div>
              </div>
              <div className="flex items-end gap-1 h-12 pt-2">
                {data.conversion_details.funnel_stages.map((stage, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={cn("w-full bg-black dark:bg-white/20 hover:bg-black dark:bg-white transition-colors rounded-t-sm relative group/bar")} style={{ height: `${(stage.count / 1500) * 100}%` }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/bar:block bg-slate-900 text-white text-[8px] px-1 rounded shadow-xl z-10">{stage.count}</div>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400">{stage.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.metric_name === '营收完成度' && (
            <div className="space-y-4 pt-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">年度业绩总目标锁定</p>
                 <p className="text-xl font-black text-black dark:text-white">¥ 32,000,000</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Achievement Rate (Fixed at bottom) */}
      <div className="pt-4 mt-auto">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {perspective.charAt(0).toUpperCase() + perspective.slice(1)} Progress
          </span>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            currentAchievement.rate < 60 ? "text-amber-500" : "text-black dark:text-white"
          )}>
             {Math.round(currentAchievement.rate)}%
          </span>
        </div>
        <div className="h-2 w-full bg-[#f5f5f7] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, currentAchievement.rate)}%` }}
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              currentAchievement.rate < 60 ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "bg-black dark:bg-white shadow-[0_0_10px_rgba(0,102,255,0.3)]"
            )}
          />
        </div>
        <button
          onClick={() => window.open(`/detail/${data.metric_name || data.metric_name.toLowerCase().replace(/\s+/g, '-')}`, '_blank')}
          className="mt-3 w-full py-2 bg-slate-50 border border-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-1">
          查看详情 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});
