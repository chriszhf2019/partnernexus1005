import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp, Users, UserCheck, DollarSign, Send, QrCode, Copy, Phone, Mail, X, RefreshCw } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CampaignROIPanelProps { open: boolean; onClose: () => void; }

export const CampaignROIPanel: React.FC<CampaignROIPanelProps> = ({ open, onClose }) => {
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'funnel' | 'leads'>('funnel');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (open) loadData(); }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: funnel } = await supabase.from('campaign_funnel').select('*');
      if (funnel) setFunnelData(funnel);
      const { data: leadsData } = await supabase.from('lead_nurturing').select('*').order('created_at', { ascending: false }).limit(20);
      if (leadsData) setLeads(leadsData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const funnelStages = [
    { key: 'registrations', label: '报名', color: '#6366f1' },
    { key: 'attended', label: '到场', color: '#8b5cf6' },
    { key: 'leads_mql', label: '线索MQL', color: '#06b6d4' },
    { key: 'opportunities_sql', label: '商机SQL', color: '#f59e0b' },
    { key: 'deals_closed', label: '成交', color: '#10b981' },
  ];

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">ROI 与商机转化追踪</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                {[{ k: 'funnel', l: '转化漏斗' }, { k: 'leads', l: '线索战报' }].map(tab => (
                  <button key={tab.k} onClick={() => setActiveTab(tab.k as any)} className={cn('px-3 py-1 text-xs font-medium rounded-md', activeTab === tab.k ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-500')}>{tab.l}</button>
                ))}
              </div>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {activeTab === 'funnel' && (
            <div className="p-6 space-y-6">
              <h3 className="text-sm font-semibold">活动全漏斗追踪</h3>
              {funnelData.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader><CardTitle className="text-sm">{campaign.campaign_name}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      {funnelStages.map(stage => (
                        <div key={stage.key} className="text-center">
                          <p className="text-2xl font-bold" style={{ color: stage.color }}>{(campaign as any)[stage.key] || 0}</p>
                          <p className="text-xs text-neutral-500">{stage.label}</p>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={80}>
                      <BarChart data={funnelStages.map(s => ({ name: s.label, value: (campaign as any)[s.key] || 0, fill: s.color }))} layout="vertical">
                        <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {funnelStages.map((s, i) => <Cell key={i} fill={s.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-between mt-3 text-xs text-neutral-500">
                      <span>转化率: {campaign.registrations > 0 ? Math.round(campaign.deals_closed / campaign.registrations * 100) : 0}%</span>
                      <span>成交金额: <span className="font-semibold text-emerald-600">{formatCurrency(campaign.revenue)}</span></span>
                      <span>ROI: 1:{campaign.revenue > 0 ? (campaign.revenue / 50000).toFixed(1) : '0'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">邀请码实时战报</h3>
                <Button variant="secondary" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4 mr-1" />刷新</Button>
              </div>
              {leads.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">暂无线索数据，活动开始后将实时更新</div>
              ) : (
                <div className="space-y-1">
                  {leads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm">
                      <div className="flex-1">
                        <span className="font-medium text-neutral-900 dark:text-white">{lead.lead_name}</span>
                        <span className="text-neutral-400 mx-2">|</span>
                        <span className="text-neutral-500">{lead.company || '-'}</span>
                        <span className="text-neutral-400 mx-2">|</span>
                        <span className="text-neutral-500">{lead.industry || '-'} · {lead.job_level || '-'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={lead.status === 'qualified' ? 'success' : lead.status === 'contacted' ? 'default' : 'warning'} size="sm">
                          {lead.status === 'new' ? '新线索' : lead.status === 'contacted' ? '已联系' : lead.status === 'qualified' ? '已认定' : lead.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" title="一键催促"><Send className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" title="复制邀请码"><Copy className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
