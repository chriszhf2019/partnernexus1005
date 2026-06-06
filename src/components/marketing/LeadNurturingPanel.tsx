import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, Clock, Send, Mail, Phone, AlertTriangle, X, RefreshCw, BarChart3, ArrowRight } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface LeadNurturingPanelProps { open: boolean; onClose: () => void; }

export const LeadNurturingPanel: React.FC<LeadNurturingPanelProps> = ({ open, onClose }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'routing' | 'nurture'>('routing');

  useEffect(() => { if (open) loadLeads(); }, [open]);

  const loadLeads = async () => {
    setLoading(true);
    const { data } = await supabase.from('lead_nurturing').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  const handle48hReminder = async (leadId: string) => {
    await supabase.from('lead_nurturing').update({ followup_deadline: new Date(Date.now() + 48 * 3600000).toISOString(), status: 'contacted' }).eq('id', leadId);
    loadLeads();
  };

  const handleStartNurture = async (leadId: string, sequence: string) => {
    await supabase.from('lead_nurturing').update({ nurture_sequence: sequence, status: 'contacted' }).eq('id', leadId);
    loadLeads();
  };

  const overdueLeads = leads.filter(l => l.followup_deadline && new Date(l.followup_deadline) < new Date() && l.status === 'new');
  const activeLeads = leads.filter(l => l.status === 'contacted' || l.status === 'qualified');
  const newLeads = leads.filter(l => l.status === 'new');

  const nurtureSequences = [
    { id: 'default', name: '标准跟进', desc: '感谢信 → 3天后产品白皮书 → 7天后活动预告', steps: 3 },
    { id: 'aggressive', name: '加速转化', desc: '感谢信 → 次日电话 → 3天后方案演示邀约', steps: 3 },
    { id: 'nurture', name: '长期培育', desc: '月度Newsletter → 季度活动邀请 → 年度客户大会', steps: 3 },
  ];

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><UserCheck className="w-5 h-5 text-brand" /><h2 className="text-lg font-semibold">线索培育中心</h2></div>
            <div className="flex items-center gap-2">
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                {[{ k: 'routing', l: '线索分配' }, { k: 'nurture', l: '自动化培育' }].map(tab => (
                  <button key={tab.k} onClick={() => setActiveTab(tab.k as any)} className={cn('px-3 py-1 text-xs font-medium rounded-md', activeTab === tab.k ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-500')}>{tab.l}</button>
                ))}
              </div>
              <Button variant="secondary" size="sm" onClick={loadLeads}><RefreshCw className="w-4 h-4" /></Button>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b">
            {[
              { label: '新线索', value: newLeads.length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: '跟进中', value: activeLeads.length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: '超时未跟进', value: overdueLeads.length, color: overdueLeads.length > 0 ? 'text-red-500' : 'text-neutral-400', bg: 'bg-red-50 dark:bg-red-900/20', alert: overdueLeads.length > 0 },
              { label: '已转化商机', value: leads.filter(l => l.status === 'opportunity').length, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            ].map(s => (
              <div key={s.label} className={cn('p-3 rounded-xl', s.bg, s.alert && 'border border-red-200')}><p className="text-xs text-neutral-500">{s.label}</p><p className={cn('text-xl font-semibold', s.color)}>{s.value}</p></div>
            ))}
          </div>

          {overdueLeads.length > 0 && (
            <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{overdueLeads.length} 条线索超过48小时未跟进，系统已自动发送短信提醒销售经理</span>
            </div>
          )}

          {activeTab === 'routing' && (
            <div className="p-6 space-y-2">
              <h3 className="text-sm font-semibold mb-2">线索去向追踪</h3>
              {leads.slice(0, 15).map(lead => (
                <div key={lead.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-neutral-100 dark:border-neutral-800 text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{lead.lead_name}</span>
                    <span className="text-neutral-400 mx-2">|</span>
                    <span className="text-neutral-500">{lead.company || '-'} · {lead.source_campaign_name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={lead.status === 'new' ? 'warning' : lead.status === 'qualified' ? 'success' : 'default'} size="sm">
                      {lead.status === 'new' ? '待分配' : lead.status === 'contacted' ? '已联系' : lead.status === 'qualified' ? '已认定' : lead.status}
                    </Badge>
                    {lead.assigned_to && <span className="text-xs text-neutral-400">→ {lead.assigned_to}</span>}
                    {lead.status === 'new' && (
                      <Button variant="ghost" size="sm" onClick={() => handle48hReminder(lead.id)} title="设置48小时提醒"><Clock className="w-3.5 h-3.5" /> 48h提醒</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'nurture' && (
            <div className="p-6 space-y-6">
              <h3 className="text-sm font-semibold">自动化培育序列</h3>
              <div className="grid grid-cols-3 gap-4">
                {nurtureSequences.map(seq => (
                  <Card key={seq.id}>
                    <CardContent>
                      <h4 className="text-sm font-semibold mb-1">{seq.name}</h4>
                      <p className="text-xs text-neutral-500 mb-3">{seq.desc}</p>
                      <div className="flex items-center gap-1 text-xs text-neutral-400 mb-3">
                        {Array.from({ length: seq.steps }).map((_, i) => (<React.Fragment key={i}><div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center text-brand font-medium">{i + 1}</div>{i < seq.steps - 1 && <ArrowRight className="w-3 h-3" />}</React.Fragment>))}
                      </div>
                      <Button variant="secondary" size="sm" className="w-full" onClick={() => leads.filter(l => l.status === 'new').slice(0, 3).forEach(l => handleStartNurture(l.id, seq.id))}>
                        <Send className="w-3.5 h-3.5 mr-1" />一键启动
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <h3 className="text-sm font-semibold mt-4">培育中的线索</h3>
              {leads.filter(l => l.nurture_sequence && l.nurture_sequence !== 'none').length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">暂无线索正在培育中</p>
              ) : (
                leads.filter(l => l.nurture_sequence !== 'none').slice(0, 10).map(lead => (
                  <div key={lead.id} className="flex items-center justify-between px-4 py-2 rounded-lg text-sm">
                    <span className="font-medium">{lead.lead_name}</span>
                    <div className="flex items-center gap-2">
                      <Badge size="sm">{nurtureSequences.find(s => s.id === lead.nurture_sequence)?.name || lead.nurture_sequence}</Badge>
                      <span className="text-xs text-neutral-400">开始: {new Date(lead.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
