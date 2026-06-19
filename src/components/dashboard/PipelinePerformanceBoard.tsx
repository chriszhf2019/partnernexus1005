import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Target,
  Zap,
  PieChart,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

type DealRow = {
  stage: string | null;
  value: number | null;
  status: string | null;
  created_at: string | null;
};

type FunnelStage = {
  name: string;
  amount: string;
  inflow: string;
  outflow: string;
};

const STAGE_LABELS: Record<string, string> = {
  Registered: '发现与报备',
  UnderReview: '方案与报价',
  Approved: 'POC测试',
  Solution: '商务谈判',
  Commercial: '商务推进',
  ClosedWon: '成功赢单',
  ClosedLost: '已流失',
};

const FUNNEL_STAGE_KEYS = [
  'Registered',
  'UnderReview',
  'Approved',
  'Solution',
  'Commercial',
  'ClosedWon',
];

const TARGET = 100000000;

function formatMillions(value: number): string {
  return `¥${Math.round((value / 1000000) * 10) / 10}M`;
}

export const PipelinePerformanceBoard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [openPipeline, setOpenPipeline] = useState(0);
  const [monthNew, setMonthNew] = useState(0);
  const [stageMap, setStageMap] = useState<Record<string, number>>({});
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([
    { name: STAGE_LABELS.Registered, amount: '¥0M', inflow: '+0M', outflow: '-0M' },
    { name: STAGE_LABELS.UnderReview, amount: '¥0M', inflow: '+0M', outflow: '-0M' },
    { name: STAGE_LABELS.Approved, amount: '¥0M', inflow: '+0M', outflow: '-0M' },
    { name: STAGE_LABELS.Solution, amount: '¥0M', inflow: '+0M', outflow: '-0M' },
    { name: STAGE_LABELS.ClosedWon, amount: '¥0M', inflow: '+0M', outflow: '-0M' },
  ]);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const { data, error } = await supabase
          .from('deals')
          .select('stage, value, status, created_at')
          .limit(500);

        if (error) {
          console.error('Failed to fetch deals:', error);
          return;
        }

        const rows = (data as DealRow[]) || [];

        const newStageMap: Record<string, number> = {};
        let openTotal = 0;
        let monthTotal = 0;

        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        for (const row of rows) {
          const value = Number(row.value) || 0;
          const stage = row.stage || '';
          const createdAt = row.created_at ? new Date(row.created_at) : null;

          newStageMap[stage] = (newStageMap[stage] || 0) + value;

          if (stage !== 'ClosedWon' && stage !== 'ClosedLost') {
            openTotal += value;
          }

          if (createdAt && createdAt >= currentMonthStart) {
            monthTotal += value;
          }
        }

        const stages: FunnelStage[] = FUNNEL_STAGE_KEYS.filter(
          (key) => key !== 'Commercial' && key !== 'ClosedLost'
        ).map((key) => ({
          name: STAGE_LABELS[key] || key,
          amount: formatMillions(newStageMap[key] || 0),
          inflow: `+${Math.round(((newStageMap[key] || 0) / 1000000) * 10) / 10}M`,
          outflow: `-0M`,
        }));

        setStageMap(newStageMap);
        setOpenPipeline(openTotal);
        setMonthNew(monthTotal);
        setFunnelStages(stages);
      } catch (err) {
        console.error('Unexpected error fetching deals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const achievementRate = Math.min(100, Math.round((openPipeline / TARGET) * 100));

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
      {/* Left Section: Open Pipeline & Sources */}
      <div className="w-full md:w-1/4 p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">本季度 Open Pipeline</h4>
          </div>
          <h3 className="text-3xl font-black text-blue-900 tracking-tight">
            {formatMillions(openPipeline)}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] font-bold text-slate-400">本月新增商机</span>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +{formatMillions(monthNew).replace('¥', '')}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-black/5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase">商机来源分布</span>
            <PieChart className="w-3 h-3 text-slate-300" />
          </div>
          <div className="h-2 w-full flex rounded-full overflow-hidden mb-4">
            <div className="h-full bg-black w-[65%]" title="Deal Reg: 65%"></div>
            <div className="h-full bg-blue-300 w-[35%]" title="Vendor Assigned: 35%"></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-black"></div>
                <span className="text-[10px] font-bold text-slate-600">伙伴自主报备 (Deal Reg)</span>
              </div>
              <span className="text-[10px] font-black text-slate-900">65%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                <span className="text-[10px] font-bold text-slate-600">原厂线索分配 (Vendor Assigned)</span>
              </div>
              <span className="text-[10px] font-black text-slate-900">35%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: 5-Stage Funnel */}
      <div className="w-full md:w-2/4 p-6 bg-slate-50/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">本季度各销售阶段流转动态</h4>
          </div>
          <button onClick={() => navigate('/deals')} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {funnelStages.map((stage, idx) => (
            <React.Fragment key={stage.name}>
              <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-all group relative">
                <p className="text-[9px] font-bold text-slate-400 mb-2 truncate" title={stage.name}>{idx + 1}. {stage.name}</p>
                <p className="text-sm font-black text-slate-900 mb-2">{stage.amount}</p>
                <div className="flex gap-1.5">
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded border border-emerald-100">
                    {stage.inflow}
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#f5f5f7] text-slate-400 text-[8px] font-bold rounded border border-slate-200">
                    {stage.outflow}
                  </span>
                </div>
                {/* Visual indicator for stage */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#f5f5f7] rounded-b-lg overflow-hidden">
                  <div className={cn("h-full bg-[#f5f5f7]0", idx === funnelStages.length - 1 ? "bg-green-500" : "")} style={{ width: `${100 - idx * 15}%` }}></div>
                </div>
              </div>
              {idx < funnelStages.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right Section: Performance & Marketing */}
      <div className="w-full md:w-1/4 p-6 flex flex-col divide-y divide-slate-100">
        {/* Top: Revenue Achievement */}
        <div className="pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">本季度营收达成率</h4>
            </div>
            <Info className="w-3 h-3 text-slate-300 cursor-help" />
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-xl font-black text-slate-900">
              {formatMillions(openPipeline)} <span className="text-slate-300 font-medium">/ {formatMillions(TARGET)}</span>
            </h3>
            <span className="text-xs font-black text-orange-600">{achievementRate}%</span>
          </div>
          <div className="w-full bg-[#f5f5f7] h-1.5 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full shadow-sm" style={{ width: `${achievementRate}%` }}></div>
          </div>
        </div>

        {/* Bottom: Marketing Conversion */}
        <div className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-emerald-500" />
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">联合营销线索转化率</h4>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">24.8%</h3>
            <div className="text-right">
              <p className="text-[10px] font-bold text-red-500 flex items-center justify-end">
                <TrendingDown className="w-3 h-3 mr-0.5" /> -2.4%
              </p>
              <p className="text-[8px] font-bold text-slate-300 uppercase">较上月</p>
            </div>
          </div>
          <p className="text-[9px] font-medium text-slate-400 mt-2 leading-relaxed">
            Campaign to Pipeline: 基于本季度 12 场联合活动产生的 420 条线索统计。
          </p>
        </div>
      </div>
    </div>
  );
};
