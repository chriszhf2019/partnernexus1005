import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Partner } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface PartnerMapViewProps {
  open: boolean;
  onClose: () => void;
  partners: Partner[];
}

const REGIONS = ['华北', '华东', '华南', '华中', '西部', '东北'];
const REGION_COORDS: Record<string, { x: number; y: number }> = {
  '华北': { x: 65, y: 18 }, '华东': { x: 78, y: 42 }, '华南': { x: 72, y: 72 },
  '华中': { x: 58, y: 48 }, '西部': { x: 25, y: 38 }, '东北': { x: 82, y: 12 },
};

export const PartnerMapView: React.FC<PartnerMapViewProps> = ({ open, onClose, partners }) => {
  const regionData = useMemo(() => {
    return REGIONS.map(region => {
      const regionPartners = partners.filter(p => p.region === region);
      const activeCount = regionPartners.filter(p => p.status === 'Cooperating').length;
      const avgWinRate = regionPartners.length > 0 ? Math.round(regionPartners.reduce((s,p) => s + (p.winRate || 0), 0) / regionPartners.length) : 0;
      return {
        region,
        count: regionPartners.length,
        activeCount,
        avgWinRate,
        status: count => count >= 5 ? '充足' : count >= 2 ? '一般' : '空白',
        color: activeCount >= 5 ? 'bg-emerald-500' : activeCount >= 2 ? 'bg-amber-500' : 'bg-red-500',
      };
    });
  }, [partners]);

  if (!open) return null;

  const maxCount = Math.max(...regionData.map(r => r.count), 1);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-brand" /><h2 className="text-lg font-semibold">区域伙伴分布地图</h2></div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span>≥5家</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span>2-4家</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span>&lt;2家</span>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Map Area */}
          <div className="relative w-full bg-neutral-50 dark:bg-neutral-800/50" style={{ minHeight: '380px' }}>
            {/* Simple map background - China outline approximation */}
            <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 opacity-30">
              <rect x="20" y="10" width="60" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="0.3" />
              <rect x="55" y="15" width="20" height="15" rx="3" fill="currentColor" opacity="0.05" />
              <rect x="50" y="35" width="25" height="35" rx="4" fill="currentColor" opacity="0.05" />
              <rect x="35" y="25" width="20" height="20" rx="4" fill="currentColor" opacity="0.05" />
              <rect x="18" y="30" width="22" height="25" rx="3" fill="currentColor" opacity="0.05" />
            </svg>

            {regionData.map(r => {
              const coord = REGION_COORDS[r.region] || { x: 50, y: 50 };
              const size = 24 + (r.count / maxCount) * 40;
              return (
                <div key={r.region} className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{ left: `${coord.x}%`, top: `${coord.y}%` }}>
                  <div className={cn('rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-transform hover:scale-110', r.color)}
                    style={{ width: `${size}px`, height: `${size}px` }} title={`${r.region}: ${r.count}家伙伴 · 活跃${r.activeCount}家 · 赢单率${r.avgWinRate}%`}>
                    {r.count}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 text-center font-medium">{r.region}</p>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    <p className="font-semibold">{r.region}</p>
                    <p>{r.count}家伙伴 · 活跃{r.activeCount}家</p>
                    <p>平均赢单率 {r.avgWinRate}%</p>
                    {r.count < 2 && <p className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />市场大但人少—需招募</p>}
                    {r.count >= 5 && r.activeCount < 3 && <p className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />人多但不出单—需淘汰</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Region Table */}
          <div className="p-6">
            <h3 className="text-sm font-semibold mb-3">区域明细</h3>
            <div className="grid grid-cols-3 gap-3">
              {regionData.map(r => (
                <Card key={r.region}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{r.region}</span>
                      <Badge variant={r.count >= 5 ? 'success' : r.count >= 2 ? 'warning' : 'danger'} size="sm">{r.count}家</Badge>
                    </div>
                    <div className="space-y-1 text-xs text-neutral-500">
                      <div className="flex justify-between"><span>活跃伙伴</span><span className="font-medium text-neutral-700 dark:text-neutral-300">{r.activeCount}家</span></div>
                      <div className="flex justify-between"><span>平均赢单率</span><span className="font-medium text-neutral-700 dark:text-neutral-300">{r.avgWinRate}%</span></div>
                      {r.count < 2 && <p className="text-red-500 text-[10px] mt-1">⚠️ 建议重点招募</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
