import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, MapPin, TrendingUp, DollarSign, Target, Calendar, Award, AlertTriangle, Clock, Building2, ChevronRight, ExternalLink } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Partner } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PartnerQuickDrawerProps {
  open: boolean;
  onClose: () => void;
  partner: Partner | null;
}

export const PartnerQuickDrawer: React.FC<PartnerQuickDrawerProps> = ({ open, onClose, partner }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && partner) {
      setLoading(true);
      Promise.all([
        supabase.from('deals').select('value,stage').eq('partner_id', partner.id),
        supabase.from('mdf_allocations').select('amount,status').eq('partner_id', partner.id),
      ]).then(([dealsRes, mdfRes]) => {
        const deals = dealsRes.data || [];
        const pipeline = deals.filter((d:any) => !['ClosedWon','ClosedLost'].includes(d.stage)).reduce((s:number,d:any) => s + Number(d.value||0), 0);
        const won = deals.filter((d:any) => d.stage === 'ClosedWon').reduce((s:number,d:any) => s + Number(d.value||0), 0);
        const mdfData = mdfRes.data || [];
        const mdfTotal = mdfData.reduce((s:number,m:any) => s + Number(m.amount||0), 0);
        const mdfUsed = mdfData.filter((m:any) => m.status === 'used').reduce((s:number,m:any) => s + Number(m.amount||0), 0);
        setMetrics({ pipeline, won, dealCount: deals.length, mdfTotal, mdfUsed, mdfRemaining: mdfTotal - mdfUsed });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [open, partner]);

  if (!open || !partner) return null;

  const primaryContact = partner.contacts?.find(c => c.isPrimary) || partner.contacts?.[0];
  const daysSinceJoin = Math.ceil((Date.now() - new Date(partner.startDate).getTime()) / 86400000);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }} className="w-full max-w-2xl bg-white dark:bg-neutral-900 max-h-[70vh] overflow-auto shadow-2xl rounded-t-2xl" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-5 py-4">
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto -mt-1 mb-2" />
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold truncate">{partner.name}</h3>
                  <Badge variant={partner.status === 'Cooperating' ? 'success' : 'warning'} size="sm">{partner.status === 'Cooperating' ? '合作中' : '待批复'}</Badge>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{partner.type} · {partner.tier} · 加入 {daysSinceJoin}天</p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded shrink-0"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Performance Brief — clickable */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { onClose(); navigate(`/partners/${partner.id}`); }}>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">业绩简报</h4>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '今年成交', value: formatCurrency(metrics.won || 0), icon: DollarSign, color: 'text-emerald-600' },
                    { label: 'Pipeline', value: formatCurrency(metrics.pipeline || 0), icon: TrendingUp, color: 'text-blue-600' },
                    { label: '商机数', value: `${metrics.dealCount || 0}个`, icon: Target, color: 'text-purple-600' },
                    { label: '赢单率', value: `${partner.winRate || 0}%`, icon: Award, color: 'text-amber-600' },
                  ].map(m => (
                    <div key={m.label} className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <p className="text-xs text-neutral-500">{m.label}</p>
                      <p className={cn('text-sm font-semibold', m.color)}>{m.value}</p>
                    </div>
                  ))}
                </div>
                {metrics.dealCount > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/deals?partner=${partner.id}`); }} className="w-full text-[11px] text-blue-500 hover:text-blue-700 text-center mt-1">
                    查看全部 {metrics.dealCount} 笔商机 →
                  </button>
                )}
              </div>
            </Card>

            {/* Tier Progression — clickable */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { onClose(); navigate(`/partners/${partner.id}`); }}>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">等级晋升进度</h4>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </div>
                {(() => {
                  const tierOrder = ['Registered','Silver','Gold','Platinum','Diamond'];
                  const currentIdx = tierOrder.indexOf(partner.tier);
                  const nextTier = currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null;
                  const progress = partner.winRate !== undefined ? Math.min(100, Math.round((partner.winRate || 0) / 50 * 100)) : 0;
                  if (!nextTier) return <p className="text-xs text-emerald-600">🏆 已达最高等级 Diamond</p>;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">{partner.tier}</span>
                        <span className="font-medium text-brand">→ {nextTier}</span>
                      </div>
                      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand to-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>升级条件: 赢单率≥50%</span>
                        <span>{progress}%</span>
                      </div>
                      {progress < 50 && <p className="text-[10px] text-amber-600">💡 再提升 {50 - (partner.winRate || 0)}% 赢单率即可晋升 {nextTier}</p>}
                    </div>
                  );
                })()}
              </div>
            </Card>

            {/* MDF & Marketing — clickable */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { onClose(); navigate(`/marketing?partner=${partner.id}`); }}>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">营销表现</h4>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'MDF总额', value: formatCurrency(metrics.mdfTotal || 0), tip: '市场发展基金累计分配金额' },
                    { label: '已使用', value: formatCurrency(metrics.mdfUsed || 0), tip: '已核销/报销的MDF金额' },
                    { label: '剩余', value: formatCurrency(metrics.mdfRemaining || 0), tip: '仍可申请使用的MDF余额' },
                  ].map(m => (
                    <div key={m.label} className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg" title={m.tip}>
                      <p className="text-[10px] text-neutral-500">{m.label}</p>
                      <p className="text-xs font-semibold">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Contact — clickable */}
            {primaryContact && (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { onClose(); navigate(`/partners/${partner.id}`); }}>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">关键联系人</h4>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium">{primaryContact.lastName}{primaryContact.firstName}</span>
                      <span className="text-neutral-400">·</span>
                      <span className="text-neutral-500">{primaryContact.title}</span>
                    </div>
                    <a href={`tel:${primaryContact.phone || primaryContact.mobile}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-sm hover:bg-blue-50 rounded px-1 py-0.5 transition-colors">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      <span className="text-blue-600">{primaryContact.phone || primaryContact.mobile || '—'}</span>
                    </a>
                    {primaryContact.email && (
                      <a href={`mailto:${primaryContact.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-sm hover:bg-blue-50 rounded px-1 py-0.5 transition-colors">
                        <Mail className="w-4 h-4 text-neutral-400" />
                        <span className="text-blue-600">{primaryContact.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Alerts */}
            <Card>
              <div className="p-4 space-y-2">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">待办提醒</h4>
                {partner.status === 'Prospective' && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-amber-700">待批复 · 已停留 {Math.ceil((Date.now() - new Date(partner.applicationDate || partner.startDate).getTime()) / 86400000)}天</span>
                    <Button variant="secondary" size="sm" className="ml-auto">立即批复</Button>
                  </div>
                )}
                {partner.status === 'Cooperating' && !metrics.dealCount && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-700">尚无商机报备 · 建议进行二次访谈</span>
                  </div>
                )}
                <div className="p-3 bg-brand/5 rounded-xl border border-brand/20 mt-2">
                  <p className="text-xs text-neutral-500 mb-2">💡 点击下方按钮跳转到伙伴的完整详情页，可查看商机列表、联系人、合作记录等</p>
                  <Button variant="brand" size="sm" className="w-full justify-between" onClick={() => { onClose(); navigate(`/partners/${partner.id}`); }}>
                    <span className="flex items-center gap-1"><ExternalLink className="w-4 h-4" />查看完整档案</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
