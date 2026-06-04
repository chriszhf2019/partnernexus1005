import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { 
  Info, 
  AlertTriangle, 
  Target, 
  Flame, 
  X, 
  UserPlus, 
  ShieldCheck, 
  ExternalLink,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';

import { useConfig } from '../../contexts/ConfigContext';

interface MatrixCellData {
  industry: string;
  region: string;
  count: number;
  pipeline: number;
  mdf: number; // Resource Investment
  corePartners: number;
}

type MetricType = 'Headcount' | 'Pipeline' | 'MDF';

export const StrategicMatrix: React.FC = () => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const INDUSTRIES = config.industries;
  const REGIONS = config.regions;

  const [metric, setMetric] = useState<MetricType>('Headcount');
  const [selectedCell, setSelectedCell] = useState<{ industry: string; region: string } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Seed-based deterministic pseudo-random for stable heatmap data
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // Generate dynamic heatmap data based on configured industries and regions
  const HEATMAP_DATA = useMemo(() => {
    const data: MatrixCellData[] = [];
    INDUSTRIES.forEach((industry, iIdx) => {
      REGIONS.forEach((region, rIdx) => {
        const seed = (iIdx + 1) * 10 + (rIdx + 1);
        const baseValue = (iIdx + 1) * (rIdx + 1);
        data.push({
          industry,
          region,
          count: Math.floor(baseValue * 5 + pseudoRandom(seed) * 20),
          pipeline: Math.floor(baseValue * 100 + pseudoRandom(seed + 31) * 300),
          mdf: Math.floor(baseValue * 20 + pseudoRandom(seed + 67) * 50),
          corePartners: Math.floor(baseValue * 2 + pseudoRandom(seed + 13) * 3)
        });
      });
    });
    return data;
  }, [INDUSTRIES, REGIONS]);

  const totals = useMemo(() => {
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    
    INDUSTRIES.forEach(ind => {
      rowTotals[ind] = HEATMAP_DATA
        .filter(d => d.industry === ind)
        .reduce((sum, d) => sum + (metric === 'Headcount' ? d.count : metric === 'Pipeline' ? d.pipeline : d.mdf), 0);
    });

    REGIONS.forEach(reg => {
      colTotals[reg] = HEATMAP_DATA
        .filter(d => d.region === reg)
        .reduce((sum, d) => sum + (metric === 'Headcount' ? d.count : metric === 'Pipeline' ? d.pipeline : d.mdf), 0);
    });

    return { rowTotals, colTotals };
  }, [metric, INDUSTRIES, REGIONS, HEATMAP_DATA]);

  const currencySymbol = config.currency === 'CNY' ? '¥' : '$';
  const currencyUnit = config.currency === 'CNY' ? 'k' : 'k'; // Just as an example adjustment

  const getCellColor = (value: number) => {
    const thresholds = {
      Headcount: [10, 30, 50, 70],
      Pipeline: [100, 400, 800, 1200],
      MDF: [20, 80, 150, 250]
    };
    const t = thresholds[metric];
    if (value < t[0]) return 'bg-slate-50 text-slate-400';
    if (value < t[1]) return 'bg-[#f5f5f7] text-blue-600';
    if (value < t[2]) return 'bg-blue-200 text-blue-800';
    if (value < t[3]) return 'bg-blue-400 text-white';
    return 'bg-black text-white';
  };

  const handleCellClick = (industry: string, region: string) => {
    setSelectedCell({ industry, region });
    setIsDrawerOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <h4 className="font-headline font-black text-sm text-slate-900">{t('matrix.title')}</h4>
          <Info className="w-3.5 h-3.5 text-slate-300 cursor-help" />
        </div>

        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          {(['Headcount', 'Pipeline', 'MDF'] as MetricType[]).map((tMetric) => (
            <button
              key={tMetric}
              onClick={() => setMetric(tMetric)}
              className={cn(
                "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                metric === tMetric ? "bg-black text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {tMetric === 'Headcount' ? t('matrix.headcount') : tMetric === 'Pipeline' ? t('matrix.pipeline') : t('matrix.mdf')}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="p-4 flex-1 overflow-auto">
        <div 
          className="grid gap-1 bg-[#f5f5f7] border border-slate-200 rounded-lg overflow-hidden min-w-[500px]"
          style={{ gridTemplateColumns: `70px repeat(${REGIONS.length}, 1fr) 70px` }}
        >
          {/* Header Row */}
          <div className="bg-white p-2"></div>
          {REGIONS.map(region => (
            <div key={region} className="bg-white p-2 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{region}</span>
            </div>
          ))}
          <div className="bg-slate-50 p-2 text-center border-l border-slate-200">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Total</span>
          </div>

          {/* Data Rows */}
          {INDUSTRIES.map(industry => (
            <React.Fragment key={industry}>
              <div className="bg-white p-2 flex items-center justify-end">
                <span className="text-[9px] font-bold text-slate-500 uppercase">{industry}</span>
              </div>
              {REGIONS.map(region => {
                const cellData = HEATMAP_DATA.find(d => d.industry === industry && d.region === region)!;
                if (!cellData) return <div key={region} className="bg-white p-2"></div>;
                const value = metric === 'Headcount' ? cellData.count : metric === 'Pipeline' ? cellData.pipeline : cellData.mdf;
                
                // Logic for badges
                const isTarget = cellData.count < 3;
                const isCrowded = cellData.count > 60 && cellData.pipeline < 500;

                return (
                  <div
                    key={region}
                    onClick={() => handleCellClick(industry, region)}
                    className={cn(
                      "relative h-14 flex items-center justify-center text-[11px] font-black transition-all cursor-pointer hover:ring-2 hover:ring-blue-400 hover:z-10 group",
                      getCellColor(value)
                    )}
                  >
                    <span>{metric === 'Pipeline' || metric === 'MDF' ? `${currencySymbol}${value}${currencyUnit}` : value}</span>
                    
                    {/* Status Badges */}
                    {isTarget && (
                      <div className="absolute top-1 right-1 p-0.5 bg-white rounded shadow-sm border border-slate-100" title="白地招募">
                        <Target className="w-2.5 h-2.5 text-blue-500" />
                      </div>
                    )}
                    {isCrowded && (
                      <div className="absolute top-1 right-1 p-0.5 bg-red-500 rounded shadow-sm" title="拥挤/内卷">
                        <Flame className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Row Total */}
              <div className="bg-slate-50 p-2 flex items-center justify-center border-l border-slate-200">
                <span className="text-[10px] font-black text-slate-600">
                  {metric === 'Headcount' ? totals.rowTotals[industry] : `${currencySymbol}${totals.rowTotals[industry]}${currencyUnit}`}
                </span>
              </div>
            </React.Fragment>
          ))}

          {/* Footer Row */}
          <div className="bg-slate-50 p-2 flex items-center justify-end">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Total</span>
          </div>
          {REGIONS.map(region => (
            <div key={region} className="bg-slate-50 p-2 flex items-center justify-center">
              <span className="text-[10px] font-black text-slate-600">
                {metric === 'Headcount' ? totals.colTotals[region] : `${currencySymbol}${totals.colTotals[region]}${currencyUnit}`}
              </span>
            </div>
          ))}
          <div className="bg-[#f5f5f7] p-2 border-l border-slate-200"></div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-slate-100 flex items-center gap-4 bg-slate-50/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-white border border-slate-200 rounded flex items-center justify-center">
            <Target className="w-1.5 h-1.5 text-blue-500" />
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase">🎯 {t('matrix.target')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-red-500 rounded flex items-center justify-center">
            <Flame className="w-1.5 h-1.5 text-white" />
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase">🔥 {t('matrix.crowded')}</span>
        </div>
      </div>

      {/* Slide-out Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-[320px] bg-white shadow-2xl z-[101] border-l border-slate-200 flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h5 className="text-xs font-black text-slate-900">{t('matrix.recommendation')}</h5>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {selectedCell?.region} · {selectedCell?.industry}
                  </p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-4">
                {[
                  { name: '中软国际 (Chinasoft)', tier: 'Platinum', cert: '高级实施资质', score: 98 },
                  { name: '神州数码 (Digital China)', tier: 'Gold', cert: '云迁移专项认证', score: 92 },
                  { name: '软通动力 (iSoftStone)', tier: 'Gold', cert: '行业解决方案专家', score: 89 },
                ].map((partner, idx) => (
                  <div key={partner.name} className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-blue-200 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#f5f5f7] flex items-center justify-center text-[10px] font-black text-slate-400">
                          {partner.name[0]}
                        </div>
                        <div>
                          <h6 className="text-[11px] font-black text-slate-900">{partner.name}</h6>
                          <span className="text-[9px] font-bold text-blue-600 bg-[#f5f5f7] px-1.5 py-0.5 rounded">
                            {partner.tier}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">匹配度</p>
                        <p className="text-xs font-black text-emerald-600">{partner.score}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mb-3">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-medium text-slate-600">{partner.cert}</span>
                    </div>

                    <button className="w-full py-2 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5">
                      <UserPlus className="w-3 h-3" /> {t('matrix.assignLead')}
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button className="w-full py-2 text-slate-500 text-[10px] font-bold flex items-center justify-center gap-1 hover:text-slate-900 transition-colors">
                  {t('matrix.viewAll')} <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
