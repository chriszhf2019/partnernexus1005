import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  ChevronRight,
  ChevronDown,
  Clock,
  PieChart,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Users,
  Plus,
  MoreHorizontal,
  FileText,
  BarChart3,
  Download,
  Share2,
  Package,
  LayoutDashboard,
  ArrowDownRight,
  BarChart,
  Repeat,
  Trophy,
  Briefcase,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { TimeSeriesMetric, AchievementData } from '../../types';

const DataStatusIndicator = ({ updated }: { updated: boolean }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full shadow-2xl border border-slate-800 transition-all hover:scale-105 select-none">
    <div className="relative flex items-center justify-center">
      <div className={cn("w-2 h-2 rounded-full absolute animate-ping opacity-75", updated ? "bg-emerald-400" : "bg-rose-400")} />
      <div className={cn("w-2 h-2 rounded-full relative", updated ? "bg-emerald-500" : "bg-rose-500")} />
    </div>
    <span className="text-[9px] font-black text-white uppercase tracking-widest">{updated ? 'Live Sync Active' : 'Stale Data Warning'}</span>
  </div>
);

const ActionDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 hover:bg-[#f5f5f7] rounded-lg transition-colors text-slate-400 hover:text-slate-600"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden"
            >
              <div className="p-1.5">
                {[
                  { label: '下钻分析', icon: BarChart3, color: 'text-black dark:text-white' },
                  { label: '生成报告', icon: FileText, color: 'text-slate-600' },
                  { label: '导出数据', icon: Download, color: 'text-slate-600' },
                  { label: '分享看板', icon: Share2, color: 'text-slate-600' },
                ].map((action, idx) => (
                  <button 
                    key={idx}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-[10px] font-black uppercase tracking-tight hover:bg-slate-50 transition-colors rounded-xl"
                    onClick={() => setIsOpen(false)}
                  >
                    <action.icon className={cn("w-3.5 h-3.5", action.color)} />
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};




interface MetricItemData {
  name: string;
  current: number;
  target: number;
  rate: number;
  yoy?: number;
  qoq?: number;
  contribution_percent?: number;
  activity_rate?: number;
  new_recruits?: number;
  segment_tag?: string;
  health_status?: string;
  analysis?: string;
  suggestion?: string;
}

const MetricIndicatorGrid = ({ item, linearity, index, isCurrency = true }: { item: MetricItemData; linearity: number; index: number; isCurrency?: boolean }) => {
  const formatVal = (val: number) => {
    if (!isCurrency) return val.toLocaleString();
    if (val >= 1000000) return `¥${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `¥${(val / 1000).toFixed(0)}K`;
    return `¥${val}`;
  };

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
      <div className="space-y-1">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">当季目标</p>
        <p className="text-[11px] font-black text-slate-700">{formatVal(item.target || (item.current / (item.rate / 100 || 1)))}</p>
      </div>
      <div className="space-y-1">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">实际完成</p>
        <p className="text-[11px] font-black text-black dark:text-white">{formatVal(item.current)}</p>
      </div>
      <div className="space-y-1">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">同比/月环比</p>
        <div className="flex items-center gap-1">
          <span className={cn("text-[9px] font-black", (item.yoy ?? 0) >= 0 ? "text-emerald-600" : "text-rose-500")}>
            {(item.yoy ?? (index % 2 === 0 ? 14.2 : -14.2)) >= 0 ? '↑' : '↓'}{Math.abs(Math.round(item.yoy ?? 14.2))}%
          </span>
          <span className="text-slate-300 text-[8px]">/</span>
          <span className={cn("text-[9px] font-black", (item.qoq ?? 0) >= 0 ? "text-emerald-600" : "text-rose-500")}>
            {(item.qoq ?? (index % 2 === 0 ? 8 : -8)) >= 0 ? '↑' : '↓'}{Math.abs(Math.round(item.qoq ?? 8))}%
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">进度线性度</p>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            linearity >= 100 ? "bg-emerald-500" : 
            linearity >= 85 ? "bg-amber-500" : "bg-rose-500"
          )} />
          <span className="text-[10px] font-black text-slate-700">{Math.round(linearity)}%</span>
        </div>
      </div>
    </div>
  );
};

const SemiCircleGauge = ({ rate, actual, target }: { rate: number, actual: string | number, target: string | number }) => {
  const radius = 68;
  const strokeWidth = 14;
  const circumference = radius * Math.PI;
  
  // The gauge represents 0% to 150%
  const maxScale = 150;
  const visualRate = Math.min(rate, maxScale);
  const strokeDashoffset = circumference - (Math.min(visualRate, 150) / 150) * circumference;
  
  const getPointOnArc = (percent: number, r: number) => {
    const cappedPercent = Math.min(percent, maxScale);
    // 0% is at PI (180 deg), 150% is at -45 deg or similar
    // We want 150% to spread across the constant PI arc
    const rad = Math.PI - (cappedPercent / maxScale) * Math.PI;
    return {
      x: 100 + r * Math.cos(rad),
      y: 95 - r * Math.sin(rad),
      angle: rad
    };
  };

  const targetPoint = getPointOnArc(100, radius);
  const actualPoint = getPointOnArc(rate, radius);
  
  // Helper for label offset
  const getLabelOffset = (point: { x: number, y: number, angle: number }, distance: number) => {
    return {
      x: 100 + (radius + distance) * Math.cos(point.angle),
      y: 95 - (radius + distance) * Math.sin(point.angle)
    };
  };

  const targetLabelPos = getLabelOffset(targetPoint, 15);
  const actualLabelPos = getLabelOffset(actualPoint, rate > 105 || rate < 95 ? 15 : 30); // Simple collision avoidance

  return (
    <div className="relative flex flex-col items-center justify-center -mt-2">
      <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
        {/* Shadow Drop Effect */}
        <defs>
          <filter id="dotShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Gray Background Arc */}
        <path
          d={`M ${100 - radius} 95 A ${radius} ${radius} 0 0 1 ${100 + radius} 95`}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Secondary Progress (Target Mark) */}
        <path
          d={`M ${100 - radius} 95 A ${radius} ${radius} 0 0 1 ${targetPoint.x} ${targetPoint.y}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Main Progress Arc */}
        <motion.path
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "circOut" }}
          d={`M ${100 - radius} 95 A ${radius} ${radius} 0 0 1 ${100 + radius} 95`}
          fill="none"
          stroke={rate >= 100 ? "#10b981" : "#3b82f6"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
        
        {/* Target Marker Dot */}
        <g>
          <circle 
            cx={targetPoint.x} 
            cy={targetPoint.y} 
            r="4" 
            fill="white" 
            stroke="#64748b" 
            strokeWidth="2"
            filter="url(#dotShadow)"
          />
          <text 
            x={targetLabelPos.x} 
            y={targetLabelPos.y} 
            textAnchor="middle" 
            className="text-[7px] font-black fill-slate-400 uppercase tracking-tighter"
          >
            目标 {target}
          </text>
        </g>

        {/* Actual Marker Dot */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <circle 
            cx={actualPoint.x} 
            cy={actualPoint.y} 
            r="6" 
            fill={rate >= 100 ? "#10b981" : "#3b82f6"} 
            stroke="white"
            strokeWidth="2"
            filter="url(#dotShadow)"
          />
          <text 
            x={actualLabelPos.x} 
            y={actualLabelPos.y} 
            textAnchor="middle" 
            className={cn(
              "text-[8px] font-black uppercase tracking-tighter",
              rate >= 100 ? "fill-emerald-600" : "fill-blue-600"
            )}
          >
            实际 {actual}
          </text>
        </motion.g>

        {/* Start/End scale indicators */}
        <text x={100 - radius} y={110} textAnchor="middle" className="text-[6px] font-black fill-slate-300">0%</text>
        <text x={100 + radius} y={110} textAnchor="middle" className="text-[6px] font-black fill-slate-300">150%</text>
      </svg>
      
      <div className="text-center -mt-2">
        <span className={cn(
          "text-3xl font-black tracking-tighter tabular-nums leading-none",
          rate >= 100 ? "text-emerald-500" : "text-blue-500"
        )}>
          {Math.round(rate)}<span className="text-sm ml-0.5">%</span>
        </span>
        <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">达成率</div>
      </div>
    </div>
  );
};

interface IntegratedMetricSectionProps {
  data: TimeSeriesMetric;
  isCurrency?: boolean;
}

type TimePerspective = 'monthly' | 'quarterly' | 'yearly';

export const IntegratedMetricSection: React.FC<IntegratedMetricSectionProps> = ({ data, isCurrency }) => {
  const [perspective, setPerspective] = useState<TimePerspective>('quarterly');
  const [activeDimension, setActiveDimension] = useState<'region' | 'channel_type' | 'team' | 'channel' | 'industry' | 'order_size' | 'product' | 'geo_coverage' | 'industry_vertical' | 'tier_role' | 'product_breadth' | 'customer_segment' | 'activity_health' | 'partner_type' | 'partner_tier' | 'product_expertise' | 'campaigns' | 'incentive_tracker' | 'certification_hub' | 'regional_roi' | 'deals_tracking' | 'conversion_velocity' | 'source_efficiency' | 'win_loss_analysis'>('region');

  const isRevenue = data.metric_name === '营收完成度';
  const isPartners = data.metric_name === '活跃伙伴数';
  const isPipeline = data.metric_name === 'Open Pipeline' || data.metric_name === '商机报备与流转';
  const isConversion = data.metric_name === '线索转化率';
  const isMarketing = data.metric_name === '营销与激励';
  const isReporting = data.metric_name === '商机报备与流转' || data.metric_name === 'Open Pipeline';

  // Set default dimensions for specialized views
  React.useEffect(() => {
    if (isMarketing) setActiveDimension('campaigns');
    if (isReporting) setActiveDimension('deals_tracking');
  }, [isMarketing, isReporting]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['region-0', 'geo_coverage-0', 'partner_tier-0'])); // Expand first by default

  const toggleExpand = (dim: string, index: number) => {
    const key = `${dim}-${index}`;
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  // Time progress calculation for target line (QTD)
  const timeProgress = 43; 

  const currentAch = data.achievements[perspective];
  
  // Calculate current quarter
  const currentMonth = new Date().getMonth(); // 0-indexed
  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  // Set default partner dimension if needed
  React.useEffect(() => {
    if (isPartners && !['region', 'industry', 'partner_type', 'partner_tier', 'product_expertise'].includes(activeDimension)) {
      setActiveDimension('region');
    }
  }, [isPartners]);

  const [activeSubItem, setActiveSubItem] = useState<string | null>(null);

  const currentDimData = data.dimensional_achievements?.find(d => d.type === activeDimension)?.data || [];

  const formatValue = (val: number) => {
    if (isCurrency) return formatCurrency(val);
    const rounded = Math.round(val);
    return `${rounded.toLocaleString()}${isPartners ? '' : (isConversion || isMarketing) ? '' : ''}`;
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all relative group/metric">
      <div className="absolute top-6 right-6 z-30 opacity-0 group-hover/metric:opacity-100 transition-opacity">
        <DataStatusIndicator updated={true} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
        
        {/* LEFT: Strategic Overview (25% width) */}
        <div className="lg:col-span-3 p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 relative overflow-hidden bg-slate-50/30">
          <div className="relative h-full flex flex-col gap-8">
            {isPartners && data.partner_ecosystem_details ? (
              <>
                {/* 1. 生态全景总览 (Funnel) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-[#f5f5f7] flex items-center justify-center">
                        <LayoutDashboard className="w-3.5 h-3.5 text-black dark:text-white" />
                     </div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">生态全景总览</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-black text-slate-900 tracking-tighter">{data.partner_ecosystem_details.coverage.total.toLocaleString()}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase">伙伴总量</span>
                       <div className="flex items-center gap-1 ml-auto">
                          <span className="text-[10px] font-black text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full flex items-center gap-0.5">
                            <TrendingUp className="w-2.5 h-2.5" />
                            {data.partner_ecosystem_details.coverage.yoy_quarter}%
                          </span>
                       </div>
                    </div>
                    {/* Simplified Funnel */}
                    <div className="space-y-2">
                      {data.partner_ecosystem_details.tier_funnel.map((tier, idx) => (
                        <div key={idx} className="flex items-center gap-3 group/tier">
                          <div 
                            className={cn(
                              "h-6 rounded-lg flex items-center px-3 transition-all shadow-sm border border-transparent",
                              idx === 0 ? "bg-slate-900 text-white" : 
                              idx === 1 ? "bg-slate-700 text-slate-100" :
                              idx === 2 ? "bg-slate-500 text-white" : "bg-[#f5f5f7] text-slate-500 border-slate-200"
                            )}
                            style={{ width: `${100 - idx * 12}%` }}
                          >
                            <span className="text-[8px] font-black uppercase truncate tracking-tight">{tier.tier.split(' ')[1] || tier.tier}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 tabular-nums font-mono group-hover/tier:text-slate-900 transition-colors">{tier.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 2. 渠道流动性 (Ecosystem Flux) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Repeat className="w-3.5 h-3.5 text-emerald-500" />
                     </div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">渠道流动性</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-emerald-500/20 transition-all group/flux">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">本季新招募</p>
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-black text-slate-900">{data.partner_ecosystem_details.coverage.new_quarter}</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-rose-500/20 transition-all group/flux2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">本季流失</p>
                      <div className="flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-black text-slate-900">{data.partner_ecosystem_details.coverage.churn_quarter}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. 业绩贡献占比 (Contribution Mix) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <Trophy className="w-3.5 h-3.5 text-amber-500" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">业绩贡献占比</h3>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-3xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                       <PieChart className="w-12 h-12 text-white" />
                     </div>
                     <div className="relative z-10 space-y-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-white">{data.partner_ecosystem_details.contribution_mix.revenue_percent}%</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-tight">
                          Top {data.partner_ecosystem_details.contribution_mix.top_percent}% 的伙伴贡献了以上业绩
                        </p>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-3">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${data.partner_ecosystem_details.contribution_mix.revenue_percent}%` }}
                             className="h-full bg-black dark:bg-white"
                           />
                        </div>
                     </div>
                  </div>
                </section>

                {/* 4. 生态健康快照 (Health Radar) */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2">
                     <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">生态健康快照</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '覆盖', val: data.partner_ecosystem_details.health_radar.coverage },
                      { label: '活跃', val: data.partner_ecosystem_details.health_radar.activity },
                      { label: '能力', val: data.partner_ecosystem_details.health_radar.capability },
                      { label: '意愿', val: data.partner_ecosystem_details.health_radar.will },
                    ].map((f, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-100" />
                            <motion.circle 
                              cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" 
                              className={cn(f.val > 80 ? "text-emerald-500" : f.val > 60 ? "text-black dark:text-white" : "text-rose-500")}
                              strokeDasharray={88}
                              initial={{ strokeDashoffset: 88 }}
                              animate={{ strokeDashoffset: 88 - (88 * f.val) / 100 }}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black">{f.val}</span>
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase">{f.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : isMarketing && data.marketing_overview ? (
              <>
                {/* 1. 市场活动引擎 (Marketing Engine) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                     </div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">一、市场活动引擎</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-black text-slate-900 tracking-tighter">{data.marketing_overview.activities.completed}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase">场 / {data.marketing_overview.activities.planned} 计划</span>
                       <div className="flex items-center gap-1 ml-auto">
                          <span className={cn("text-[10px] font-black flex items-center gap-0.5", data.marketing_overview.activities.yoy >= 0 ? "text-emerald-600" : "text-rose-500")}>
                            {data.marketing_overview.activities.yoy >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {Math.abs(data.marketing_overview.activities.yoy)}%
                          </span>
                       </div>
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div className="text-[8px] font-black text-slate-400 uppercase">执行进度 (Campaign Pipeline)</div>
                        <div className="text-right">
                          <span className="text-[8px] font-black text-rose-600 inline-block py-1 px-2 uppercase rounded-full bg-rose-50">
                            {Math.round((data.marketing_overview.activities.completed / data.marketing_overview.activities.planned) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-[#f5f5f7]">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${(data.marketing_overview.activities.completed / data.marketing_overview.activities.planned) * 100}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. 活动产出效能 (Activity Yield) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-[#f5f5f7] flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-black dark:text-white" />
                     </div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">二、活动产出效能</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group/yield hover:border-black dark:border-white/20 transition-all">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">线索总数 (PLs)</p>
                        <p className="text-xl font-black text-slate-900">{data.marketing_overview.yield.leads}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/yield:bg-black dark:bg-white/10 group-hover/yield:text-black dark:text-white transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group/yield2 hover:border-black dark:border-white/20 transition-all">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">转化商机额 (Pipelines)</p>
                        <p className="text-xl font-black text-black dark:text-white">¥{(data.marketing_overview.yield.pipeline_gen / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/yield2:bg-black dark:bg-white/10 group-hover/yield2:text-black dark:text-white transition-colors">
                        <Layers className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. 激励政策驱动 (Incentives) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <Trophy className="w-3.5 h-3.5 text-amber-500" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">三、激励政策驱动</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 p-3 rounded-2xl flex flex-col gap-1">
                      <span className="text-white text-lg font-black">{data.marketing_overview.incentives.active_programs}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">运行中计划</span>
                    </div>
                    <div className="bg-[#f5f5f7] p-3 rounded-2xl flex flex-col gap-1">
                      <span className="text-slate-900 text-lg font-black">{data.marketing_overview.incentives.payout_rate}%</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">兑现进度</span>
                    </div>
                  </div>
                </section>

                {/* 4. 渠道认证情况 (Certification) */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2">
                     <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">四、渠道认证情况</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-slate-600">本季新增认证</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-emerald-600">{data.marketing_overview.certification.new_experts}</span>
                        <span className="text-[9px] font-black text-slate-400">/ {data.marketing_overview.certification.target_experts}</span>
                      </div>
                    </div>
                    {data.marketing_overview.certification.expiry_warning_count > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[9px] font-black text-amber-900 uppercase">
                          {data.marketing_overview.certification.expiry_warning_count} 认证即将到期 (防流失)
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              </>
            ) : isReporting && data.reporting_overview ? (
              <>
                {/* 1. 报备大盘 (Pipeline Volume) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-[#f5f5f7] flex items-center justify-center">
                        <Layers className="w-3.5 h-3.5 text-black dark:text-white" />
                     </div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">一、报备质量与大盘</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-black text-slate-900 tracking-tighter">¥{(data.reporting_overview.pipeline.total_amount / 100000000).toFixed(1)}B</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase">报备总额</span>
                       <div className="flex items-center gap-1 ml-auto">
                          <span className={cn("text-[10px] font-black flex items-center gap-0.5", data.reporting_overview.pipeline.yoy >= 0 ? "text-emerald-600" : "text-rose-500")}>
                            {data.reporting_overview.pipeline.yoy >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {Math.abs(data.reporting_overview.pipeline.yoy)}%
                          </span>
                       </div>
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div className="text-[8px] font-black text-slate-400 uppercase">年度目标达成率 (Pipeline Target)</div>
                        <div className="text-right">
                          <span className="text-[8px] font-black text-black dark:text-white inline-block py-1 px-2 uppercase rounded-full bg-[#f5f5f7]">
                            {data.reporting_overview.pipeline.target_achievement}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-[#f5f5f7]">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${data.reporting_overview.pipeline.target_achievement}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black dark:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. 合规与开口 (Approval Dynamics) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">合规与漏斗开口</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase text-center">报备通过率</p>
                      <p className="text-xl font-black text-slate-900 text-center">{data.reporting_overview.approval.approval_rate}%</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase text-center">拒绝数量</p>
                      <p className="text-xl font-black text-rose-500 text-center">{data.reporting_overview.approval.rejected}</p>
                    </div>
                  </div>
                </section>

                {/* 3. 动力来源 (Source) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <Zap className="w-3.5 h-3.5 text-amber-500" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">动力来源溯源</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: '销售建单', val: data.reporting_overview.attribution.sales_driven, color: 'bg-slate-900' },
                      { label: 'PMDF 转化', val: data.reporting_overview.attribution.pmdf_driven, color: 'bg-black dark:bg-white' },
                      { label: '激励驱动', val: data.reporting_overview.attribution.incentive_driven, color: 'bg-amber-400' },
                    ].map((s, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-6 rounded-full", s.color)} />
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[9px] font-black text-slate-600 uppercase">{s.label}</span>
                            <span className="text-[10px] font-black text-slate-900">{s.val}%</span>
                          </div>
                          <div className="h-1 w-full bg-[#f5f5f7] rounded-full mt-1">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${s.val}%` }} className={cn("h-full rounded-full", s.color)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. 主体分级 (Partner Tier) */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2">
                     <Users className="w-3.5 h-3.5 text-blue-500" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">四、报备主体分级</h3>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-900">{data.reporting_overview.tier_contribution.platinum}</p>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-tighter">白金级</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-900">{data.reporting_overview.tier_contribution.gold}</p>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-tighter">金牌级</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-900">{data.reporting_overview.tier_contribution.silver}</p>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-tighter">银牌级</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-900">{data.reporting_overview.tier_contribution.registered}</p>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-tighter">注册级</p>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <>
                {/* 1. 业绩进度看板 (Achievement Rate) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-lg bg-[#f5f5f7] flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-black dark:text-white" />
                     </div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">一、业绩进度看板</h3>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-4">
                      <div className="flex flex-col">
                        <span className="text-[7.5px] font-black text-slate-400 uppercase mb-1 tracking-wider">本周新增订单</span>
                        <span className="text-sm font-black text-slate-900 tabular-nums leading-none">12 <span className="text-[8px] font-medium text-slate-400 ml-0.5">个</span></span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[7.5px] font-black text-slate-400 uppercase mb-1 tracking-wider">本周新增业绩</span>
                        <span className="text-sm font-black text-blue-600 tabular-nums leading-none">¥842k</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[7.5px] font-black text-slate-400 uppercase mb-1 tracking-wider text-right">本周新增商机</span>
                        <span className="text-sm font-black text-slate-900 tabular-nums leading-none">28 <span className="text-[8px] font-medium text-slate-400 ml-0.5">个</span></span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {currentAch.rate > 100 && (
                        <div className="flex justify-end">
                          <div className="bg-emerald-50 px-2 py-1 rounded-lg">
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">超额达成</span>
                          </div>
                        </div>
                      )}

                      <SemiCircleGauge 
                        rate={currentAch.rate} 
                        actual={formatValue(currentAch.current)}
                        target={formatValue(currentAch.target)}
                      />
                    </div>
                  </div>
                </section>

                {/* 2. 数据增长雷达 (Growth Pulse) */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                     <Activity className="w-3.5 h-3.5 text-emerald-500" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">二、数据增长雷达</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 flex flex-col gap-1.5">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">营收 YoY/QoQ</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-emerald-600">↑{Math.abs(Math.round(data.yoy))}%</span>
                        <span className="text-slate-200">/</span>
                        <span className="text-[10px] font-black text-emerald-600">↑{Math.abs(Math.round(data.mom))}%</span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 flex flex-col gap-1.5">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">订单 YoY/QoQ</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-black dark:text-white">↑15%</span>
                        <span className="text-slate-200">/</span>
                        <span className="text-[10px] font-black text-black dark:text-white">↑8%</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. 确定性预测 (Forecast & Land) */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2">
                     <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">三、确定性预测 (FORECAST)</h3>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 transition-all hover:border-blue-100 group">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">预期期末达成 (EST.)</p>
                        <p className="text-lg font-black text-slate-900 tracking-tight tabular-nums leading-none">
                          {formatValue(data.strategic_revenue?.forecast_landing || 0)}
                        </p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">商机覆盖率</p>
                        <p className="text-lg font-black text-blue-600 tabular-nums leading-none">
                          {data.strategic_revenue?.pipeline_multiplier || 0}x
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-black/5">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[7.5px] font-black text-slate-400 uppercase">年底预期达成率</span>
                        <span className="text-[9px] font-black text-blue-600">98%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#f5f5f7] rounded-full overflow-hidden flex relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '85%' }}
                          className="h-full bg-[#f5f5f7]0"
                        />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '10%' }}
                          className="h-full bg-blue-200"
                        />
                        {/* Gap indicator */}
                        <div className="absolute right-0 top-0 bottom-0 w-[5%] bg-rose-50 border-l border-rose-100" />
                      </div>
                      <p className="text-[7px] font-medium text-slate-400 mt-2 leading-relaxed italic">
                        * 基于当前 {data.strategic_revenue?.pipeline_multiplier} 倍商机覆盖，年底预期可达成目标的 98%，缺口约 ¥200k。
                      </p>
                    </div>
                  </div>
                </section>

                {/* 4. 线性度趋势 (Linearity) */}
                <section className="space-y-4 text-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">四、线性度趋势 (LINEARITY)</h3>
                    </div>
                    <div className="flex gap-2 text-[6px] font-black text-slate-400 uppercase">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" /> 实际
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#f5f5f7]" /> 目标
                      </div>
                    </div>
                  </div>
                  <div className="h-24 flex items-end justify-between px-2 pt-4">
                    {[
                      { month: 'Apr', plan: 70, act: 85, rate: '121%' },
                      { month: 'May', plan: 80, act: 92, rate: '115%' },
                      { month: 'Jun', plan: 90, act: 45, rate: '50%' },
                    ].map((m, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2 group relative">
                        {/* Tooltip value */}
                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[6px] px-1 py-0.5 rounded pointer-events-none z-10">
                          达成 {m.rate}
                        </div>
                        
                        <div className="flex items-end gap-1 h-16">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${m.plan}%` }}
                            className="w-2.5 bg-[#f5f5f7] rounded-t-sm"
                          />
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${m.act}%` }}
                            className={cn(
                              "w-3 rounded-t-sm transition-colors",
                              m.act >= m.plan ? "bg-black dark:bg-white" : "bg-rose-500"
                            )}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase">{m.month}</span>
                          <span className={cn(
                            "text-[7px] font-black mt-0.5",
                            m.act >= m.plan ? "text-black dark:text-white" : "text-rose-500"
                          )}>
                            {m.rate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 5. 健康诊断 (Health Check) */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2">
                     <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">五、健康诊断</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '覆盖', status: data.strategic_revenue?.forces.coverage === 'healthy' },
                      { label: '活跃', status: data.strategic_revenue?.forces.activity === 'healthy' },
                      { label: '能力', status: data.strategic_revenue?.forces.capability === 'healthy' },
                      { label: '意愿', status: data.strategic_revenue?.forces.will === 'healthy' },
                    ].map((f, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center p-1 border",
                          f.status ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100"
                        )}>
                          <div className={cn("w-full h-full rounded-full bg-current shadow-[0_0_8px_currentColor]", f.status && "animate-pulse")} />
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase">{f.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Dimensional Analysis (75% width) */}
        <div className="lg:col-span-9 bg-white flex flex-col relative">
          {/* Dimension Selector Tabs */}
          <div className="flex border-b border-slate-100 items-center justify-between bg-white sticky top-0 z-20 pr-6">
            <div className="flex overflow-x-auto no-scrollbar">
              {isRevenue && [
              { id: 'region', label: '按区域' },
              { id: 'team', label: '按销售团队' },
              { id: 'industry', label: '按行业' },
              { id: 'product', label: '按产品线' },
              { id: 'order_size', label: '按订单大小' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDimension(tab.id as any)}
                className={cn(
                  "px-8 py-4 text-[10px] font-black uppercase transition-all whitespace-nowrap tracking-widest border-r border-slate-100 last:border-r-0",
                  activeDimension === tab.id 
                    ? "bg-slate-50 text-black dark:text-white shadow-[inset_0_-2px_0_currentColor]" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                )}
              >
                {tab.label}
              </button>
            ))}

            {isPartners && [
              { id: 'region', label: '按区域' },
              { id: 'industry', label: '按行业' },
              { id: 'partner_type', label: '按类型' },
              { id: 'partner_tier', label: '按等级' },
              { id: 'product_expertise', label: '产品能力' },
              { id: 'activity_health', label: '活跃健康' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDimension(tab.id as any)}
                className={cn(
                  "px-8 py-4 text-[10px] font-black uppercase transition-all whitespace-nowrap tracking-widest border-r border-slate-100 last:border-r-0",
                  activeDimension === tab.id 
                    ? "bg-slate-50 text-black dark:text-white shadow-[inset_0_-2px_0_currentColor]" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                )}
              >
                {tab.label}
              </button>
            ))}
            
            {/* For other metrics, show a simplified or generic tab if needed, or leave empty if header is gone */}
            {!isRevenue && !isPartners && !isMarketing && !isReporting && (
              <div className="px-8 py-4 text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">
                {data.metric_name}
              </div>
            )}

            {isMarketing && [
              { id: 'campaigns', label: '活动引擎' },
              { id: 'incentive_tracker', label: '激励追踪' },
              { id: 'certification_hub', label: '能力图谱' },
              { id: 'regional_roi', label: 'ROI 穿透' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDimension(tab.id as any)}
                className={cn(
                  "relative px-8 py-4 text-[10px] font-black uppercase transition-all whitespace-nowrap tracking-widest border-r border-slate-100 last:border-r-0 group",
                  activeDimension === tab.id 
                    ? "text-rose-500 bg-rose-50/30" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                )}
              >
                <span className="relative z-10">{tab.label}</span>
                {activeDimension === tab.id && (
                  <motion.div 
                    layoutId="activeSubTabMarketing"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-rose-500 z-20"
                  />
                )}
              </button>
            ))}

            {isReporting && [
              { id: 'deals_tracking', label: '报备穿透' },
              { id: 'conversion_velocity', label: '转化流转' },
              { id: 'source_efficiency', label: '归因分析' },
              { id: 'win_loss_analysis', label: '丢标回溯' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDimension(tab.id as any)}
                className={cn(
                  "relative px-8 py-4 text-[10px] font-black uppercase transition-all whitespace-nowrap tracking-widest border-r border-slate-100 last:border-r-0 group",
                  activeDimension === tab.id 
                    ? "text-black dark:text-white bg-black dark:bg-white/5" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                )}
              >
                <span className="relative z-10">{tab.label}</span>
                {activeDimension === tab.id && (
                  <motion.div 
                    layoutId="activeSubTabReporting"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-black dark:bg-white z-20"
                  />
                )}
              </button>
            ))}
            </div>
          </div>

          <div className="flex-1 p-8 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {isRevenue && (
              <motion.div key="revenue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full gap-6">
                    {/* Dimension List (Top, Scrollable) */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-1 gap-4">
                        {activeDimension === 'order_size' ? (
                          <div className="space-y-8">
                            {[
                              { group: 'High Value (核心大单)', items: currentDimData.filter(d => d.name.includes('大单') || d.name.includes('500万')), color: 'bg-black dark:bg-white' },
                              { group: 'Mid Range (中端项目)', items: currentDimData.filter(d => d.name.includes('中单')), color: 'bg-[#f5f5f7]0' },
                              { group: 'Volume Business (小额底量)', items: currentDimData.filter(d => d.name.includes('小单')), color: 'bg-slate-400' }
                            ].map((group, gIdx) => (
                              <div key={gIdx} className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                  <div className={cn("w-1.5 h-4 rounded-full", group.color)} />
                                  <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">{group.group}</h5>
                                </div>
                                <div className="space-y-4">
                                  {group.items.map((item, i) => {
                                    const uniqueIdx = 100 + gIdx * 10 + i;
                                    const isExpanded = expandedItems.has(`order_size-${uniqueIdx}`);
                                    const linearity = (item.rate / timeProgress) * 100;
                                    return (
                                      <div key={i} className={cn(
                                        "relative p-5 bg-white rounded-3xl border border-slate-100 group/dim hover:border-black dark:border-white/20 transition-all flex flex-col shadow-sm",
                                        isExpanded ? "space-y-5" : "space-y-3"
                                      )}>
                                        <div 
                                          className="flex justify-between items-start cursor-pointer group/header"
                                          onClick={() => toggleExpand('order_size', uniqueIdx)}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={cn(
                                              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border",
                                              isExpanded ? "bg-black dark:bg-white text-white border-black dark:border-white" : "bg-slate-50 text-black dark:text-white border-slate-100 group-hover/header:bg-[#f5f5f7]"
                                            )}>
                                              <Target className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-0.5">{item.name}</p>
                                              <div className="flex items-center gap-2">
                                                <p className="text-lg font-black text-slate-800 tracking-tight">{formatValue(item.current)}</p>
                                                <ChevronDown className={cn("w-3 h-3 text-slate-300 transition-transform duration-300", isExpanded && "rotate-180 text-black dark:text-white")} />
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-end gap-1">
                                            <div className={cn(
                                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight",
                                              item.rate >= 100 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                            )}>
                                              达成率 {Math.round(item.rate)}%
                                            </div>
                                            <ActionDropdown />
                                          </div>
                                        </div>
                                        <AnimatePresence>
                                          {isExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden space-y-6"
                                            >
                                              <MetricIndicatorGrid item={item} linearity={linearity} index={i} isCurrency={isCurrency} />
                                              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-1 flex-shrink-0 animate-pulse" />
                                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic uppercase">
                                                  “该笔订单已进入商务谈判终期。建议在本月 25 日前完成合同终审，防止营收漏项。”
                                                </p>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          currentDimData.map((item, i) => {
                            const linearity = (item.rate / timeProgress) * 100;
                            const contributionToTotal = (item.current / currentAch.current) * 100;
                            const isExpanded = expandedItems.has(`${activeDimension}-${i}`);

                            return (
                              <div key={i} className={cn(
                                "relative p-5 bg-white rounded-3xl border border-slate-100 group/dim hover:border-black dark:border-white/20 transition-all flex flex-col shadow-sm",
                                isExpanded ? "space-y-5" : "space-y-3"
                              )}>
                                <div 
                                  className="flex justify-between items-start cursor-pointer group/header"
                                  onClick={() => toggleExpand(activeDimension, i)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border",
                                      isExpanded ? "bg-black dark:bg-white text-white border-black dark:border-white" : "bg-slate-50 text-black dark:text-white border-slate-100 group-hover/header:bg-[#f5f5f7]"
                                    )}>
                                      {activeDimension === 'team' ? <Users className="w-4 h-4" /> : 
                                       activeDimension === 'industry' ? <Activity className="w-4 h-4" /> : 
                                       activeDimension === 'channel' ? <Layers className="w-4 h-4" /> : 
                                       activeDimension === 'channel_type' ? <ShieldCheck className="w-4 h-4" /> : 
                                       activeDimension === 'product' ? <Package className="w-4 h-4" /> : 
                                       <div className="w-full h-full flex items-center justify-center font-black text-[10px]">{item.name.substring(0, 2)}</div>}
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-0.5">{item.name}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-lg font-black text-slate-800 tracking-tight">{formatValue(item.current)}</p>
                                        <ChevronDown className={cn("w-3 h-3 text-slate-300 transition-transform duration-300", isExpanded && "rotate-180 text-black dark:text-white")} />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <div className={cn(
                                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight",
                                      item.rate >= 100 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                    )}>
                                      达成率 {Math.round(item.rate)}%
                                    </div>
                                    <ActionDropdown />
                                  </div>
                                </div>

                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                      className="overflow-hidden space-y-6"
                                    >
                                      <MetricIndicatorGrid item={item} linearity={linearity} index={i} isCurrency={isCurrency} />

                                      {activeDimension === 'region' && (
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between px-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Top 3 城市核心业绩 (当季)</p>
                                            <button className="text-[8px] font-black text-black dark:text-white hover:underline uppercase">查看全部城市</button>
                                          </div>
                                          <div className="grid grid-cols-3 gap-3">
                                            {[
                                              { city: item.name === '华东区' ? '上海' : item.name === '华北区' ? '北京' : item.name === '华南区' ? '深圳' : item.name === '西部区' ? '成都' : '武汉', current: item.current * 0.45, rate: 102, trend: 'up' },
                                              { city: item.name === '华东区' ? '杭州' : item.name === '华北区' ? '天津' : item.name === '华南区' ? '广州' : item.name === '西部区' ? '西安' : '长沙', current: item.current * 0.25, rate: 94, trend: 'up' },
                                              { city: item.name === '华东区' ? '南京' : item.name === '华北区' ? '济南' : item.name === '华南区' ? '东莞' : item.name === '西部区' ? '重庆' : '郑州', current: item.current * 0.15, rate: 88, trend: 'down' }
                                            ].map((city, cIdx) => (
                                              <div key={cIdx} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2 hover:border-black dark:border-white/20 transition-all">
                                                <div className="flex justify-between items-center">
                                                  <span className="text-[10px] font-black text-slate-800">{city.city}</span>
                                                  {city.trend === 'up' ? <TrendingUp className="w-2.5 h-2.5 text-emerald-500" /> : <TrendingDown className="w-2.5 h-2.5 text-rose-500" />}
                                                </div>
                                                <div>
                                                  <p className="text-[11px] font-black text-slate-900 tracking-tight">{formatValue(city.current)}</p>
                                                  <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[7px] font-bold text-slate-400">达成: {city.rate}%</span>
                                                    <div className="w-12 h-0.5 bg-slate-50 rounded-full overflow-hidden">
                                                      <div className={cn("h-full", city.rate >= 100 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${Math.min(100, city.rate)}%` }} />
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {['team', 'industry', 'channel', 'channel_type'].includes(activeDimension) && (
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between px-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-black dark:text-white">AI 识别 - 核心贡献单元 (当季)</p>
                                          </div>
                                          <div className="grid grid-cols-3 gap-3">
                                            {[
                                              { name: activeDimension === 'team' ? '关键项目组' : activeDimension === 'industry' ? '头部标杆客户' : activeDimension === 'channel_type' ? '核心渠道伙伴' : '重点贡献单元', val: '45.2', status: '超预期' },
                                              { name: activeDimension === 'team' ? '华东支撑团队' : activeDimension === 'industry' ? '新兴细分领域' : activeDimension === 'channel_type' ? '成长型渠道' : '深耕成长单元', val: '28.8', status: '正常' },
                                              { name: activeDimension === 'team' ? '新业务开拓组' : activeDimension === 'industry' ? '存量扩容大户' : activeDimension === 'channel_type' ? '生态广域单元' : '基础底量来源', val: '15.4', status: '需关注' }
                                            ].map((sub, sIdx) => (
                                              <div key={sIdx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between min-h-[70px]">
                                                <p className="text-[9px] font-black text-slate-500 uppercase leading-tight line-clamp-1">{sub.name}</p>
                                                <div className="flex items-end justify-between">
                                                  <p className="text-sm font-black text-slate-900">{sub.val}%</p>
                                                  <span className={cn(
                                                    "text-[7px] font-black uppercase px-1 rounded-sm",
                                                    sub.status === '超预期' ? "text-emerald-600 bg-emerald-50" :
                                                    sub.status === '正常' ? "text-blue-600 bg-[#f5f5f7]" : "text-amber-600 bg-amber-50"
                                                  )}>{sub.status}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase">
                                          <span>当前业绩贡献占比 (较总体完成额)</span>
                                          <span className="text-slate-900">{contributionToTotal.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-[#f5f5f7] rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${contributionToTotal}%` }}
                                            className="h-full bg-black dark:bg-white rounded-full transition-all"
                                          />
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })
                        )
                      }
                    </div>
                  </div>

                  {/* AI Strategic Diagnosis (Bottom Static) */}
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-black dark:bg-white/5 blur-[80px] -translate-y-1/2 translate-x-1/2" />
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-black dark:text-white" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">战略建议 · AI 诊断</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REAL-TIME ANALYSIS</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] font-bold leading-relaxed text-slate-500 max-w-2xl">
                          {isPartners ? '渠道覆盖稳步扩张，华东与华南仍是核心增量区。其中 ISV 伙伴本月新增活跃度显著提升，建议针对 Reseller 渠道启动专项“促活包”，进一步挖掘存量价值。' :
                           activeDimension === 'region' ? '华东区仍是增长核心，中西部地区渗透率低于行业基准，需重点对该区域代理商进行赋能。同时华南区受竞品策略影响，份额有小幅波动，建议启动专项回访计划。' :
                           activeDimension === 'channel_type' ? 'Reseller 与 SI 贡献了 60% 以上的流水，针对不同类型的渠道需采取差异化赋能。建议针对头部 20 家 ISV 伙伴分配专项 PMDF 以拉动联合方案订单。' :
                           activeDimension === 'team' ? '战略大客户部表现优异，新业务部增长迅速，但通用行业部受市场竞争影响较显著。建议对通用行业部团队进行产品组合二次培训，提升多产品件单价。' :
                           activeDimension === 'channel' ? 'VAD 渠道贡献稳定，核心代理活跃度略有下降，ISV 的联合方案拉动了高毛利订单。建议三季度重点考核核心代理商的有效商机提报率。' :
                           activeDimension === 'industry' ? '金融与互联网行业增势明显，高端制造受到宏观因素扰动，建议重点激活存量大项目。零售行业呈现复苏迹象，可作为下半年的潜力增长极。' :
                           '超大项目订单贡献了 60% 以上的营收，虽达成目标 but 利润结构单一。建议通过自动化激励平台（Incentive Portal）提升 20万以下小额订单的处理效率。'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <button className="flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl hover:bg-slate-50 transition-all text-xs font-black uppercase tracking-widest shadow-sm">
                          <FileText className="w-5 h-5 text-slate-400" />
                          查看业绩详情 (明细表)
                        </button>
                        <button 
                          onClick={() => {
                            const contextName = currentDimData[0]?.name || '业绩总体';
                            alert(`启动 [${contextName}] 4维度深度诊断...\n\n结论示例：${contextName} 业务虽然达标，但结构性指标存在偏移。建议加强 [能力维度] 赋能，重点关注大客户攻坚。`);
                          }}
                          className="flex items-center justify-center gap-3 bg-black dark:bg-white text-white px-6 py-4 rounded-2xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-black/10 dark:shadow-white/10"
                        >
                          <BarChart3 className="w-5 h-5" />
                          四维度深度诊断
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {(isMarketing || isReporting) && (
                  <motion.div 
                    key={isMarketing ? 'marketing' : 'reporting'} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex flex-col h-full gap-6"
                  >
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <motion.div 
                        initial="hidden"
                        animate="show"
                        variants={{
                          hidden: { opacity: 0 },
                          show: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.1
                            }
                          }
                        }}
                        className="grid grid-cols-1 gap-4"
                      >
                        {currentDimData.map((item, i) => {
                          const isExpanded = expandedItems.has(`${activeDimension}-${i}`);
                          const linearity = (item.rate / timeProgress) * 100;

                          return (
                            <motion.div 
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                show: { opacity: 1, y: 0 }
                              }}
                              key={i} 
                              className={cn(
                                "relative p-5 bg-white rounded-3xl border border-slate-100 group/dim hover:border-black dark:border-white/20 transition-all flex flex-col shadow-sm",
                                isExpanded ? "ring-2 ring-primary/5 border-black dark:border-white/20 space-y-5" : "space-y-3"
                              )}
                            >
                              <div 
                                className="flex justify-between items-start cursor-pointer group/header"
                                onClick={() => toggleExpand(activeDimension, i)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border shadow-sm relative overflow-hidden",
                                    isExpanded ? (isMarketing ? "bg-rose-500 text-white border-rose-500 shadow-rose-200" : "bg-black dark:bg-white text-white border-black dark:border-white shadow-blue-200") : "bg-slate-50 text-slate-400 border-slate-100 group-hover/header:bg-[#f5f5f7] group-hover/header:text-slate-600"
                                  )}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity" />
                                    {activeDimension === 'campaigns' ? <Activity className="w-5 h-5" /> : 
                                     activeDimension === 'incentive_tracker' ? <Trophy className="w-5 h-5" /> : 
                                     activeDimension === 'certification_hub' ? <ShieldCheck className="w-5 h-5" /> : 
                                     activeDimension === 'regional_roi' ? <ArrowUpRight className="w-5 h-5" /> : 
                                     activeDimension === 'deals_tracking' ? <Layers className="w-5 h-5" /> : 
                                     activeDimension === 'conversion_velocity' ? <Zap className="w-5 h-5" /> : 
                                     activeDimension === 'source_efficiency' ? <TrendingUp className="w-5 h-5" /> :
                                     <BarChart className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-tight">{item.name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <p className="text-xl font-black text-slate-800 tracking-tighter">{isReporting && activeDimension === 'deals_tracking' ? formatValue(item.current) : (item.current > 1000 ? formatValue(item.current) : item.current)}</p>
                                      <div className="h-4 w-px bg-slate-200" />
                                      <div className="flex items-center gap-1.5">
                                        <span className={cn("text-[10px] font-black", item.rate >= 100 ? "text-emerald-600" : "text-amber-500")}>{Math.round(item.rate)}%</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase">达成</span>
                                      </div>
                                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                                        <ChevronDown className={cn("w-3 h-3 text-slate-300 transition-colors", isExpanded && "text-black dark:text-white")} />
                                      </motion.div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    {(item.yoy !== undefined) && (
                                      <span className={cn("text-[9px] font-black flex items-center gap-0.5 px-2 py-0.5 rounded-full capitalize", item.yoy >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500")}>
                                        {item.yoy >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                        {Math.abs(item.yoy)}% 
                                      </span>
                                    )}
                                  </div>
                                  <ActionDropdown />
                                </div>
                              </div>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden space-y-6 pt-2"
                                  >
                                    {/* Sub Metrics Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {(item.sub_metrics || [
                                        { label: '重要性', value: 'High', status: 'success' },
                                        { label: '资源投入', value: '¥150k', status: 'warning' },
                                        { label: '产出预期', value: 'High' },
                                        { label: '执行窗口', value: 'Q4' }
                                      ]).map((sub, sIdx) => (
                                        <div key={sIdx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 group-hover/dim:bg-white transition-colors">
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{sub.label}</p>
                                          <div className="flex items-center gap-2">
                                            <p className="text-[11px] font-black text-slate-800">{sub.value}</p>
                                            {sub.status && (
                                              <div className={cn("w-1.5 h-1.5 rounded-full", sub.status === 'success' ? "bg-emerald-500" : sub.status === 'warning' ? "bg-amber-500" : "bg-rose-500")} />
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Diagnostic Insight */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                      <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2 relative overflow-hidden group/insight">
                                        <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover/insight:opacity-[0.08] transition-opacity">
                                          <Activity className="w-12 h-12" />
                                        </div>
                                        <div className="flex items-center gap-2 relative z-10">
                                          <TrendingUp className="w-3.5 h-3.5 text-black dark:text-white" />
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">维度分析与诊断</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic relative z-10">
                                          “{item.analysis || (isMarketing ? '当前活动覆盖度良好，但商机转化质量仍需进一步穿透诊断。' : '商机储备充足，但转化的时间周期存在溢出风险，需加强中台协调。')}”
                                        </p>
                                      </div>
                                      <div className={cn("p-4 rounded-2xl space-y-2 relative overflow-hidden group/action", isMarketing ? "bg-rose-950" : "bg-slate-900")}>
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/action:opacity-20 transition-opacity">
                                          <Zap className="w-12 h-12 text-white" />
                                        </div>
                                        <div className="flex items-center gap-2 relative z-10">
                                          <Zap className="w-3.5 h-3.5 text-black dark:text-white" />
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-white/50">ECO 管理抓手</span>
                                        </div>
                                        <p className="text-[10px] font-black leading-relaxed tracking-tight text-white/90 relative z-10">
                                          {item.suggestion || (isMarketing ? '建议在本月底前针对非活跃伙伴启动专项激励（Fast-Track），并联动当地售前提供资源倾斜。' : '建议缩短审批链条，对金额超过 1000万的报备项目启动“绿色通道”审核流程。')}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </div>

                    {/* Footer AI Section for Marketing/Reporting */}
                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 relative overflow-hidden group shadow-inner">
                      <div className={cn("absolute inset-0 blur-[100px] opacity-[0.03] transition-opacity group-hover:opacity-[0.07]", isMarketing ? "bg-rose-500" : "bg-black dark:bg-white")} />
                      <div className="flex items-start justify-between relative z-10 gap-8">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105", isMarketing ? "bg-rose-500 text-white shadow-rose-200" : "bg-black dark:bg-white text-white shadow-blue-200")}>
                            <Zap className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-1">{isMarketing ? '营销战役 · AI 决策建议' : '商机漏斗 · 提效分析报告'}</h4>
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1">
                                {[1,2,3].map(i => <div key={i} className="w-4 h-4 rounded-full border-2 border-black/5 bg-slate-200" />)}
                              </div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 border-l border-slate-200">ECOSYSTEM AI AGENT ACTIVE</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 max-w-xl">
                          <p className="text-xs font-bold leading-relaxed text-slate-600 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/80 shadow-sm italic">
                            “{isMarketing ? '本季市场资源投入集中在“金融”与“制造”行业，产出的线索质量同比提升 12%。建议在接下来的两周内关注“中西部”地区的合作伙伴参会度，补齐覆盖盲区。' :
                             '商机报备通过率维持在 68%，主要拒绝原因为信息缺失与区域冲突。建议对伙伴提报系统增加强制性的“冲突自查”环节，减少管理浪费并提升审批效率。'}”
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                        <button className="flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-3xl hover:bg-slate-50 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm hover:shadow-md">
                          <FileText className="w-5 h-5 text-slate-400" />
                          查看{isMarketing ? '营销战役' : '商机转化'}全景明细 (Full List)
                        </button>
                        <button className={cn("flex items-center justify-center gap-3 text-white px-6 py-4 rounded-3xl transition-all text-[11px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98]", isMarketing ? "bg-black hover:bg-rose-700 shadow-rose-600/20" : "bg-black dark:bg-white hover:bg-slate-800 shadow-black/10 dark:shadow-white/10")}>
                          <BarChart3 className="w-5 h-5" />
                          {isMarketing ? '启动 ROI 多维归因穿透' : '开启 4维度流转提效诊断'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {isPartners && (
                  <motion.div key="partners" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full gap-6">
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-1 gap-4">
                        {currentDimData.map((item, i) => {
                          const isExpanded = expandedItems.has(`${activeDimension}-${i}`);
                          const linearity = (item.rate / timeProgress) * 100;

                          return (
                            <div key={i} className={cn(
                              "relative p-5 bg-white rounded-3xl border border-slate-100 group/dim hover:border-black dark:border-white/20 transition-all flex flex-col shadow-sm",
                              isExpanded ? "space-y-5" : "space-y-3"
                            )}>
                              <div 
                                className="flex justify-between items-start cursor-pointer group/header"
                                onClick={() => toggleExpand(activeDimension, i)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border shadow-sm relative overflow-hidden",
                                    isExpanded ? "bg-black dark:bg-white text-white border-black dark:border-white" : "bg-white text-black dark:text-white border-slate-100 group-hover/header:bg-slate-50"
                                  )}>
                                    {activeDimension === 'region' ? <LayoutDashboard className="w-5 h-5" /> : 
                                     activeDimension === 'industry' ? <Briefcase className="w-5 h-5" /> : 
                                     activeDimension === 'partner_type' ? <Users className="w-5 h-5" /> : 
                                     activeDimension === 'partner_tier' ? <Trophy className="w-5 h-5" /> : 
                                     activeDimension === 'product_expertise' ? <Package className="w-5 h-5" /> : 
                                     <Activity className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-tight">{item.name}</p>
                                      {item.segment_tag && (
                                        <span className={cn(
                                          "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                                          item.segment_tag === 'Growth' ? "bg-emerald-100 text-emerald-600" :
                                          item.segment_tag === 'Harvesting' ? "bg-amber-100 text-amber-600" :
                                          item.segment_tag === 'Risk' ? "bg-rose-100 text-rose-600" : "bg-[#f5f5f7] text-slate-600"
                                        )}>
                                          {item.segment_tag}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <p className="text-xl font-black text-slate-800 tracking-tighter">{item.current}<span className="text-[10px] ml-0.5 text-slate-400">家</span></p>
                                      <div className="h-4 w-px bg-slate-200" />
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">达成</span>
                                        <span className={cn("text-[10px] font-black", item.rate >= 100 ? "text-emerald-600" : "text-amber-500")}>{Math.round(item.rate)}%</span>
                                      </div>
                                      <ChevronDown className={cn("w-3 h-3 text-slate-300 transition-transform duration-300", isExpanded && "rotate-180 text-black dark:text-white")} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    {(item.yoy !== undefined || item.qoq !== undefined) && (
                                      <>
                                        <span className={cn("text-[9px] font-black", (item.yoy || 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                          同比 {(item.yoy || 0) >= 0 ? '↑' : '↓'}{Math.abs(item.yoy || 0)}%
                                        </span>
                                        <span className="text-slate-200 text-[8px]">|</span>
                                        <span className={cn("text-[9px] font-black", (item.qoq || 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                          环比 {(item.qoq || 0) >= 0 ? '↑' : '↓'}{Math.abs(item.qoq || 0)}%
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <ActionDropdown />
                                </div>
                              </div>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden space-y-6 pt-2"
                                  >
                                    {/* Sub Metrics Grid */}
                                    <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 shadow-inner">
                                       <div className="space-y-1">
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">贡献业绩占比</p>
                                          <p className="text-sm font-black text-slate-800">{item.contribution_percent || 0}%</p>
                                          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-900" style={{ width: `${item.contribution_percent}%` }} />
                                          </div>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">活跃度评分</p>
                                          <p className="text-sm font-black text-black dark:text-white">{item.activity_rate || 0}/100</p>
                                          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div className={cn("h-full", (item.activity_rate || 0) > 80 ? "bg-emerald-500" : "bg-black dark:bg-white")} style={{ width: `${item.activity_rate}%` }} />
                                          </div>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">本季新招募</p>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-black text-slate-800">{item.new_recruits || 0}</span>
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">New Entry</span>
                                          </div>
                                       </div>
                                       <div className="space-y-1">
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">预测达成概率</p>
                                          <div className="flex items-center gap-1.5">
                                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", linearity >= 100 ? "bg-emerald-500" : "bg-amber-500")} />
                                            <span className="text-sm font-black text-slate-800">{Math.round(linearity)}%</span>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Actionable Insight */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                      <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2 group/card hover:border-black dark:border-white/30 transition-all">
                                        <div className="flex items-center gap-2">
                                          <BarChart className="w-3.5 h-3.5 text-black dark:text-white" />
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">维度诊断</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic pr-4">
                                          “{item.analysis || '该维度分布稳定，当前聚焦于核心大客户的存量挖掘与二三线市场的覆盖博弈。'}”
                                        </p>
                                      </div>
                                      <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 group/card hover:bg-slate-800 transition-all">
                                        <div className="flex items-center gap-2">
                                          <Zap className="w-3.5 h-3.5 text-black dark:text-white" />
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">行动建议</span>
                                        </div>
                                        <p className="text-[10px] font-black leading-relaxed tracking-tight text-slate-300">
                                          {item.suggestion || '建议启动针对该维度的专项伙伴激励计划（Incentive 2.0），并配置差异化售前支持。'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Sub Metrics (Specific for activity_health) */}
                                    {activeDimension === 'activity_health' && item.sub_metrics && (
                                       <div className="grid grid-cols-2 gap-4">
                                          {item.sub_metrics.map((sub, sIdx) => (
                                            <div key={sIdx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                              <span className="text-[9px] font-black text-slate-400 uppercase">{sub.label}</span>
                                              <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black text-slate-900">{sub.value}</span>
                                                {sub.trend === 'up' && <ArrowUpRight className="w-2.5 h-2.5 text-emerald-500" />}
                                                {sub.trend === 'down' && <ArrowDownRight className="w-2.5 h-2.5 text-rose-500" />}
                                              </div>
                                            </div>
                                          ))}
                                       </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* AI Strategic Diagnosis (Bottom Static) */}
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 relative overflow-hidden group mt-6">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-black dark:bg-white/5 blur-[80px] -translate-y-1/2 translate-x-1/2" />
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-black dark:text-white" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">生态战略 · AI 诊断</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ECOSYSTEM REAL-TIME ANALYSIS</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] font-bold leading-relaxed text-slate-500 max-w-2xl text-right">
                          {activeDimension === 'region' ? '华东与华南区贡献了 70% 的活跃伙伴，中西部渗透率显著低于大盘。建议启动“盲区激活”计划，引入 5-10 家具备二级深耕能力的 VAD。' :
                           activeDimension === 'industry' ? '金融、医疗行业伙伴能力极强，但在高端制造领域虽然伙伴数量多，但实际下单率仅 45%，存在“纸面能力”虚高。' :
                           activeDimension === 'partner_type' ? 'ISV 伙伴本月报备数环比增长 22%，已成为云原生业务的主引擎。建议加大对 ISV 的联合方案 (Co-Sell) 资源包投入。' :
                           activeDimension === 'partner_tier' ? '金牌以上伙伴忠诚度极高，但银牌伙伴流失率达 5.5%。需关注银牌伙伴对新版本激励政策的消极反馈。' :
                           activeDimension === 'product_expertise' ? '备份存储仍是伙伴的舒适区，云安全与 SaaS 的能力迁移进度缓慢。建议开展“种子伙伴”专项认证。' :
                           '交易活跃（L1）伙伴保持稳健，但项目报备（L2）向成交（L1）的转化周期拉长了 12 天。建议启动大单攻坚专项补贴。'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <button className="flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl hover:bg-slate-50 transition-all text-xs font-black uppercase tracking-widest shadow-sm">
                          <FileText className="w-5 h-5 text-slate-400" />
                          生成生态全景明细表
                        </button>
                        <button 
                          onClick={() => {
                            const contextName = currentDimData[0]?.name || '生态总体';
                            alert(`启动 [${contextName}] 4维度渠道健康诊断...\n\n结论：${contextName} 区域覆盖充沛，但 [能力维度] 与 [意愿维度] 出现背离。建议通过 PMDF 加强赋能。`);
                          }}
                          className="flex items-center justify-center gap-3 bg-black dark:bg-white text-white px-6 py-4 rounded-2xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-black/10 dark:shadow-white/10"
                        >
                          <BarChart3 className="w-5 h-5" />
                          四维度渠道健康诊断
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {isPipeline && data.pipeline_batch && (
                  <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className="flex gap-4">
                           <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <div className="flex items-center justify-between mb-1">
                               <p className="text-[9px] font-black text-slate-400 uppercase">本季预期结单</p>
                             </div>
                             <p className="text-lg font-black text-slate-900">{formatValue(data.pipeline_batch.current_q_target)}</p>
                           </div>
                           <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <div className="flex items-center justify-between mb-1">
                               <p className="text-[9px] font-black text-slate-400 uppercase">下季储备数量</p>
                             </div>
                             <p className="text-lg font-black text-slate-900">{data.pipeline_batch.next_q_count} 件</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                              <span>当季新增 vs 历史积存额</span>
                           </div>
                           <div className="h-6 w-full bg-[#f5f5f7] rounded-xl flex overflow-hidden p-1">
                              <div className="h-full bg-slate-900 rounded-lg flex items-center justify-center text-[8px] text-white font-black" style={{ width: `${data.pipeline_batch.new_in_q_ratio}%` }}>
                                NEW {data.pipeline_batch.new_in_q_ratio}%
                              </div>
                              <div className="h-full bg-slate-200 rounded-lg ml-1 flex items-center justify-center text-[8px] text-slate-500 font-black" style={{ width: `${data.pipeline_batch.historical_ratio}%` }}>
                                HIST {data.pipeline_batch.historical_ratio}%
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">金额构成分析</p>
                        <div className="space-y-2">
                           {[
                             { label: '新单金额', val: data.pipeline_batch.new_amount, color: 'bg-black dark:bg-white' },
                             { label: '历史积存', val: data.pipeline_batch.historical_amount, color: 'bg-slate-300' }
                           ].map((item, i) => (
                             <div key={i} className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <div className={cn("w-2 h-2 rounded-full", item.color)} />
                                 <span className="text-xs font-bold text-slate-600">{item.label}</span>
                               </div>
                               <span className="text-xs font-black text-slate-900">{formatCurrency(item.val)}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </motion.div>
                )}

                {isConversion && data.conversion_details && (
                  <motion.div key="conversion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                    <div className="flex items-center gap-6 mb-8">
                       <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-50 rounded-2xl">
                             <Clock className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase">平均转化周期 (MQL {'->'} Won)</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{data.conversion_details.cycle_days} Days</p>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-1 items-end gap-2 pr-12">
                       {data.conversion_details.funnel_stages.map((stage, i) => (
                         <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                            <div className="w-full relative flex flex-col items-center">
                               <div className="w-full bg-slate-900 rounded-t-2xl transition-all group-hover/bar:bg-black dark:bg-white" 
                                    style={{ height: `${(stage.count / 1300) * 120}px` }}>
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 text-[10px] font-black text-slate-900 opacity-0 group-hover/bar:opacity-100 transition-all">{stage.count}</div>
                               </div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter text-center h-4">{stage.stage}</span>
                         </div>
                       ))}
                    </div>
                    <div className="mt-8 flex justify-end">
                       <button className="text-[10px] font-black text-black dark:text-white uppercase flex items-center gap-1 hover:gap-2 transition-all">
                         下钻各阶段损耗分析 <ChevronRight className="w-3 h-3" />
                       </button>
                    </div>
                  </motion.div>
                )}

                {isMarketing && data.marketing_details && (
                  <motion.div key="marketing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                           <div className="flex items-center justify-between mb-1">
                             <p className="text-[9px] font-black text-rose-600 uppercase">PMDF 使用率</p>
                           </div>
                           <p className="text-2xl font-black text-rose-700">{data.marketing_details.pmdf_utilization}%</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                           <div className="flex items-center justify-between mb-1">
                             <p className="text-[9px] font-black text-amber-600 uppercase">营销 ROI 指数</p>
                           </div>
                           <p className="text-2xl font-black text-amber-700">{data.marketing_details.roi_index}x</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-3">激励计划覆盖度</p>
                         <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12">
                               <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                  <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                  <circle cx="18" cy="18" r="16" fill="none" stroke="#f43f5e" strokeWidth="4" strokeDasharray={`${data.marketing_details.incentive_participation}, 100`} />
                               </svg>
                               <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-rose-600">
                                  {data.marketing_details.incentive_participation.toFixed(1)}%
                                </div>
                            </div>
                            <p className="text-[11px] font-medium text-slate-600">
                               当前已有 {data.marketing_details.incentive_participation}% 的核心伙伴完成本季激励目标解锁。
                            </p>
                         </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">当前活跃活动 (Campaigns)</p>
                       <div className="space-y-2">
                          {data.marketing_details.campaigns.map((camp, i) => (
                            <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between group/camp hover:border-rose-200 transition-all">
                               <div>
                                  <p className="text-[11px] font-bold text-slate-900">{camp.name}</p>
                                  <p className="text-[8px] font-black uppercase text-slate-400">{camp.status}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-[11px] font-black text-rose-500">{formatCurrency(camp.budget)}</p>
                                  <ChevronRight className="w-3 h-3 text-slate-300 ml-auto group-hover/camp:translate-x-1" />
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Time Perspective Selector (at the bottom, horizontal bar) */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex bg-[#f5f5f7] p-1 rounded-xl">
                 {[
                   { id: 'monthly', label: '月度视图' },
                   { id: 'quarterly', label: '季度聚焦' },
                   { id: 'yearly', label: '年度概览' }
                 ].map((p) => (
                   <button
                     key={p.id}
                     onClick={() => setPerspective(p.id as any)}
                     className={cn(
                       "px-6 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                       perspective === p.id 
                         ? "bg-white text-slate-900 shadow-sm" 
                         : "text-slate-400 hover:text-slate-600"
                     )}
                   >
                     {p.label}
                   </button>
                 ))}
              </div>
              <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  REAL-TIME SYNC
                </span>
                <span className="text-slate-200">|</span>
                <span>VER: 2026.Q2.V4</span>
              </div>
              {/* 查看详情按钮 */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  onClick={() => window.open('/detail/ecosystem-metrics', '_blank')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  查看完整详情报告
                </button>
                <button
                  onClick={() => window.open('/analytics', '_blank')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  前往数据分析
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
