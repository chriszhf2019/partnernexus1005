import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Users, X, Trophy, Target, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface MarketingCalendarPanelProps { open: boolean; onClose: () => void; }

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const TYPE_COLORS: Record<string, string> = { '线下峰会': '#6366f1', '线下沙龙': '#10b981', 'Webinar': '#f59e0b', '制造客户会': '#ec4899', '医疗行业会': '#06b6d4', '金融客户会': '#8b5cf6', '政府客户会': '#ef4444' };

const campaigns = [
  { name: 'Q1 华东医疗峰会', type: '线下峰会', start: 2, span: 1, attendees: 120, region: '华东' },
  { name: 'Q1 制造业数字转型沙龙', type: '制造客户会', start: 2, span: 1, attendees: 45, region: '华南' },
  { name: 'Q2 金融行业Webinar', type: 'Webinar', start: 4, span: 1, attendees: 200, region: '全国' },
  { name: 'Q2 华北政府客户会', type: '政府客户会', start: 5, span: 1, attendees: 60, region: '华北' },
  { name: 'Q3 全国生态伙伴大会', type: '线下峰会', start: 8, span: 1, attendees: 500, region: '全国' },
  { name: 'Q3 医疗AI专场沙龙', type: '医疗行业会', start: 9, span: 1, attendees: 80, region: '华东' },
  { name: 'Q4 制造行业年度峰会', type: '制造客户会', start: 10, span: 1, attendees: 150, region: '华南' },
  { name: 'Q4 年终答谢暨新品发布', type: '线下峰会', start: 11, span: 1, attendees: 300, region: '全国' },
];

const benchmarks = [
  { rank: 1, name: 'Q1 华东医疗峰会', type: '线下峰会', roi: '1:8.5', leads: 42, deals: 5, tier: 'S', badge: '标杆案例' },
  { rank: 2, name: 'Q2 金融行业Webinar', type: 'Webinar', roi: '1:6.2', leads: 35, deals: 4, tier: 'A', badge: '高转化' },
  { rank: 3, name: 'Q1 制造业数字转型沙龙', type: '制造客户会', roi: '1:4.8', leads: 28, deals: 3, tier: 'A', badge: '高到场率' },
];

export const MarketingCalendarPanel: React.FC<MarketingCalendarPanelProps> = ({ open, onClose }) => {
  const [year, setYear] = useState(2026);
  const [showBenchmark, setShowBenchmark] = useState<string | null>(null);

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-6xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-brand" /><h2 className="text-lg font-semibold">年度营销规划蓝图</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setYear(y => y - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm font-semibold">{year}年</span>
              <Button variant="ghost" size="sm" onClick={() => setYear(y => y + 1)}><ChevronRight className="w-4 h-4" /></Button>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Gantt Chart */}
          <div className="p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" />活动甘特图</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-12 gap-1 mb-2">
                  {MONTHS.map(m => <div key={m} className="text-center text-xs font-medium text-neutral-500">{m}</div>)}
                </div>
                <div className="space-y-3">
                  {campaigns.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-40 shrink-0"><p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{c.name}</p></div>
                      <div className="flex-1 grid grid-cols-12 gap-1 relative h-8">
                        <div className="absolute top-0 rounded-full h-7 flex items-center px-2 text-xs text-white font-medium"
                          style={{ backgroundColor: TYPE_COLORS[c.type] || '#6366f1', left: `${(c.start - 1) / 12 * 100}%`, width: `${(c.span / 12 * 100)}%`, minWidth: '80px' }}>
                          <span className="truncate">{c.type} · {c.attendees}人</span>
                        </div>
                      </div>
                      <div className="w-16 text-right shrink-0"><Badge size="sm">{c.region}</Badge></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} /><span className="text-neutral-500">{type}</span></div>
              ))}
            </div>
          </div>

          {/* Benchmark */}
          <div className="px-6 pb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" />效果排行 & 标杆案例</h3>
            <div className="space-y-3">
              {benchmarks.map((b, i) => (
                <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-amber-300 transition-colors cursor-pointer" onClick={() => setShowBenchmark(showBenchmark === b.name ? null : b.name)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-neutral-100 text-neutral-500' : 'bg-neutral-50 text-neutral-400')}>{b.rank}</span>
                      <div>
                        <div className="flex items-center gap-2"><span className="text-sm font-semibold">{b.name}</span><Badge size="sm" variant={b.tier === 'S' ? 'warning' : 'success'}>{b.tier}级 {b.badge}</Badge></div>
                        <p className="text-xs text-neutral-500 mt-0.5">ROI {b.roi} · 线索 {b.leads}个 · 成交 {b.deals}单</p>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-neutral-400" />
                  </div>
                  {showBenchmark === b.name && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
                      <p className="font-medium">📋 标杆复盘总结:</p>
                      <p>✅ 物料准备: 完整H5邀请函 + 行业白皮书 + 产品Demo视频</p>
                      <p>✅ 话术总结: "以行业痛点切入，用数据对比展示ROI"</p>
                      <p>✅ 经验教训: 提前2周发出邀请，到场率提升30%；会后48h内跟进转化率最高</p>
                      <p>📌 建议: 后进伙伴可复用全套物料 + 话术模板，降低活动筹备门槛</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
