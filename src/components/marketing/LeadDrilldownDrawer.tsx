import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Building2, TrendingUp, Target, AlertTriangle, CheckCircle2, Clock, Phone, Mail, ChevronRight, MessageCircle } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

interface Lead {
  id?: string;
  name: string;
  company: string;
  title: string;
  stage: string;
  value: number;
  followupStatus: string;
  lastContact: string;
}

interface LeadDrilldownDrawerProps {
  open: boolean;
  onClose: () => void;
  activityId: string;
  activityName: string;
  plannedLeads: string;
  actualLeads: number;
  actualOpps: number;
}

const stageConfig: Record<string, { label: string; color: string; bg: string }> = {
  'ClosedWon': { label: '赢单', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Commercial': { label: '商务', color: 'text-blue-600', bg: 'bg-blue-50' },
  'Solution': { label: '方案', color: 'text-purple-600', bg: 'bg-purple-50' },
  'Approved': { label: '已批复', color: 'text-amber-600', bg: 'bg-amber-50' },
  'Registered': { label: '报备', color: 'text-neutral-600', bg: 'bg-neutral-50' },
};

export const LeadDrilldownDrawer: React.FC<LeadDrilldownDrawerProps> = ({ open, onClose, activityId, activityName }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) {
      setLeads([]);
      setLoading(true);
      return;
    }

    const fetchLeads = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('leads')
          .select('id, lead_name, company_name, title, stage, value, followup_status, last_contact_date')
          .eq('origin_activity_id', activityId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[LeadDrilldownDrawer] fetch error:', error);
          setLeads([]);
        } else {
          setLeads((data || []).map(row => ({
            id: row.id,
            name: row.lead_name || '未知',
            company: row.company_name || '未知公司',
            title: row.title || '-',
            stage: row.stage || '',
            value: Number(row.value || 0),
            followupStatus: row.followup_status || '未跟进',
            lastContact: row.last_contact_date || '-',
          })));
        }
      } catch (e) {
        console.error('[LeadDrilldownDrawer] fetch failed:', e);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [open, activityId]);

  if (!open) return null;

  const convertedLeads = leads.filter(l => l.stage && l.stage !== '');
  const unconvertedLeads = leads.filter(l => !l.stage);
  const totalValue = leads.reduce((s, l) => s + (l.value || 0), 0);

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
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="text-center p-2">
                  <Skeleton className="h-5 w-12 mx-auto" />
                  <Skeleton className="h-3 w-10 mx-auto mt-1" />
                </div>
              ))
            ) : (
              [
                { label: '总线索', value: leads.length, color: 'text-blue-600' },
                { label: '已转化', value: convertedLeads.length, color: 'text-emerald-600' },
                { label: '未跟进', value: unconvertedLeads.length, color: unconvertedLeads.length > 0 ? 'text-red-500' : 'text-neutral-400' },
                { label: '商机总额', value: formatCurrency(totalValue), color: 'text-purple-600' },
              ].map(s => (
                <div key={s.label} className="text-center p-2">
                  <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
                  <p className="text-[10px] text-neutral-500">{s.label}</p>
                </div>
              ))
            )}
          </div>

          {!loading && unconvertedLeads.length > 0 && (
            <div className="mx-5 mt-3 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs text-red-700">{unconvertedLeads.length} 条线索未跟进 — 可能是"水单"，建议核实质量</span>
            </div>
          )}

          {/* Lead List */}
          <div className="p-5 space-y-1">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32 mt-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-neutral-500">暂无关联线索数据</p>
              </div>
            ) : (
              leads.map((lead, i) => {
                const sc = stageConfig[lead.stage];
                return (
                  <div key={lead.id || i} className={cn('flex items-center justify-between px-3 py-2.5 rounded-lg text-sm', !lead.stage ? 'bg-red-50/30 dark:bg-red-900/5' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800')}>
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
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
