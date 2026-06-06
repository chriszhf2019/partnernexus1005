import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Building2, TrendingUp, Target, AlertTriangle, CheckCircle2, Clock, Phone, Mail, ChevronRight, MessageCircle } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface LeadDrilldownDrawerProps {
  open: boolean;
  onClose: () => void;
  activityId: string;
  activityName: string;
  plannedLeads: string;
  actualLeads: number;
  actualOpps: number;
}

const mockLeads = [
  { name: '张建国', company: '浙江省立医院', title: '信息中心主任', stage: 'ClosedWon', value: 2800000, followupStatus: '已签约', lastContact: '2026-03-20' },
  { name: '李明华', company: '苏州市卫健委', title: '副主任', stage: 'Commercial', value: 1500000, followupStatus: '商务谈判中', lastContact: '2026-03-18' },
  { name: '王芳', company: '上海瑞金医院', title: 'IT总监', stage: 'Solution', value: 890000, followupStatus: '方案评估中', lastContact: '2026-03-15' },
  { name: '赵强', company: '深圳市人民医院', title: '副院长', stage: 'Approved', value: 650000, followupStatus: '已批复', lastContact: '2026-03-12' },
  { name: '陈晓东', company: '北京协和医院', title: '信息科科长', stage: 'Registered', value: 420000, followupStatus: '初步接触', lastContact: '2026-03-10' },
  { name: '刘伟', company: '广州市医保局', title: '处长', stage: '', value: 0, followupStatus: '未跟进', lastContact: '-' },
  { name: '孙丽', company: '武汉同济医院', title: '护理部主任', stage: '', value: 0, followupStatus: '未跟进', lastContact: '-' },
  { name: '周涛', company: '成都市第一人民医院', title: '信息中心主任', stage: 'Solution', value: 350000, followupStatus: '方案设计中', lastContact: '2026-03-08' },
];

const stageConfig: Record<string, { label: string; color: string; bg: string }> = {
  'ClosedWon': { label: '赢单', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Commercial': { label: '商务', color: 'text-blue-600', bg: 'bg-blue-50' },
  'Solution': { label: '方案', color: 'text-purple-600', bg: 'bg-purple-50' },
  'Approved': { label: '已批复', color: 'text-amber-600', bg: 'bg-amber-50' },
  'Registered': { label: '报备', color: 'text-neutral-600', bg: 'bg-neutral-50' },
};

export const LeadDrilldownDrawer: React.FC<LeadDrilldownDrawerProps> = ({ open, onClose, activityId, activityName, plannedLeads, actualLeads, actualOpps }) => {
  if (!open) return null;
  const convertedLeads = mockLeads.filter(l => l.stage && l.stage !== '');
  const unconvertedLeads = mockLeads.filter(l => !l.stage);
  const totalValue = mockLeads.reduce((s, l) => s + (l.value || 0), 0);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
        <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 30 }} className="w-[480px] max-w-[90vw] bg-white dark:bg-neutral-900 h-full overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">线索生命周期看板</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{activityName}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"><X className="w-5 h-5" /></button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b">
            {[
              { label: '总线索', value: mockLeads.length, color: 'text-blue-600' },
              { label: '已转化', value: convertedLeads.length, color: 'text-emerald-600' },
              { label: '未跟进', value: unconvertedLeads.length, color: unconvertedLeads.length > 0 ? 'text-red-500' : 'text-neutral-400' },
              { label: '商机总额', value: formatCurrency(totalValue), color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="text-center p-2">
                <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-neutral-500">{s.label}</p>
              </div>
            ))}
          </div>

          {unconvertedLeads.length > 0 && (
            <div className="mx-5 mt-3 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs text-red-700">{unconvertedLeads.length} 条线索未跟进 — 可能是"水单"，建议核实质量</span>
            </div>
          )}

          {/* Lead List */}
          <div className="p-5 space-y-1">
            {mockLeads.map((lead, i) => {
              const sc = stageConfig[lead.stage];
              return (
                <div key={i} className={cn('flex items-center justify-between px-3 py-2.5 rounded-lg text-sm', !lead.stage ? 'bg-red-50/30 dark:bg-red-900/5' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800')}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-medium text-neutral-900 dark:text-white">{lead.name}</span>
                      <span className="text-neutral-300">|</span>
                      <span className="text-xs text-neutral-500 truncate">{lead.company} · {lead.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sc ? (
                      <Badge size="sm" className={cn(sc.bg, sc.color)}>{sc.label}</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">未跟进</Badge>
                    )}
                    {lead.value > 0 && <span className="text-xs text-neutral-500">{formatCurrency(lead.value)}</span>}
                    {!lead.stage && <Button variant="ghost" size="sm" title="催促跟进"><MessageCircle className="w-3 h-3" /></Button>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
