import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt, Upload, CheckCircle2, XCircle, Clock, AlertTriangle,
  DollarSign, FileText, Image, TrendingDown, TrendingUp, X, Plus,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface MDFClaimsPanelProps { open: boolean; onClose: () => void; }

export const MDFClaimsPanel: React.FC<MDFClaimsPanelProps> = ({ open, onClose }) => {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [newClaim, setNewClaim] = useState({ partner_name: '', amount: '', description: '', activity_name: '' });
  const [budgetStats, setBudgetStats] = useState({ total: 500000, used: 185000, pending: 80000, available: 235000 });

  useEffect(() => { if (open) loadClaims(); }, [open]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('mdf_claims').select('*').order('created_at', { ascending: false });
      if (data) setClaims(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newClaim.partner_name || !newClaim.amount) return;
    await supabase.from('mdf_claims').insert({
      partner_name: newClaim.partner_name, amount: Number(newClaim.amount),
      description: newClaim.description, activity_name: newClaim.activity_name,
      status: 'pending', budget_used: Number(newClaim.amount),
    });
    setShowNewClaim(false);
    setNewClaim({ partner_name: '', amount: '', description: '', activity_name: '' });
    loadClaims();
  };

  const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default'; icon: any }> = {
    pending: { label: '待审核', variant: 'warning', icon: Clock },
    reviewing: { label: '审核中', variant: 'default', icon: FileText },
    approved: { label: '已批复', variant: 'success', icon: CheckCircle2 },
    rejected: { label: '已驳回', variant: 'danger', icon: XCircle },
    paid: { label: '已打款', variant: 'success', icon: DollarSign },
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">MDF 费用核销管理</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="brand" size="sm" onClick={() => setShowNewClaim(true)}><Plus className="w-4 h-4" />新建核销申请</Button>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Budget Summary */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b">
            {[
              { label: '年度总预算', value: formatCurrency(budgetStats.total), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: '已批复使用', value: formatCurrency(budgetStats.used), icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: '审批中', value: formatCurrency(budgetStats.pending), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: '可用余额', value: formatCurrency(budgetStats.available), icon: TrendingUp, color: budgetStats.available < 100000 ? 'text-red-500' : 'text-emerald-500', bg: budgetStats.available < 100000 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
            ].map(s => (
              <div key={s.label} className={cn('p-3 rounded-xl', s.bg)}>
                <div className="flex items-center gap-2"><s.icon className={cn('w-4 h-4', s.color)} /><span className="text-xs text-neutral-500">{s.label}</span></div>
                <p className={cn('text-lg font-semibold mt-1', s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {budgetStats.available < 100000 && (
            <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400">可用余额不足 ¥100,000，请谨慎批复新的核销申请，避免后期重点活动无钱可用</span>
            </div>
          )}

          {/* Claims List */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">核销记录</h3>
            {loading ? <div className="text-center py-8 text-neutral-400">加载中...</div> : claims.length === 0 ? <div className="text-center py-8 text-neutral-400">暂无核销记录</div> : (
              <div className="space-y-3">
                {claims.map((claim) => {
                  const sc = statusConfig[claim.status] || statusConfig.pending;
                  return (
                    <div key={claim.id} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">{claim.partner_name}</h4>
                            <Badge variant={sc.variant} size="sm"><sc.icon className="w-3 h-3 mr-1" />{sc.label}</Badge>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">{claim.description || '无描述'}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                            <span>核销金额: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatCurrency(claim.amount)}</span></span>
                            <span>提交: {new Date(claim.created_at).toLocaleDateString('zh-CN')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {claim.invoice_url && <Button variant="ghost" size="sm"><FileText className="w-4 h-4" />发票</Button>}
                          {claim.status === 'pending' && (
                            <>
                              <Button variant="secondary" size="sm" onClick={async () => { await supabase.from('mdf_claims').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', claim.id); loadClaims(); }}><CheckCircle2 className="w-4 h-4" />通过</Button>
                              <Button variant="danger" size="sm" onClick={async () => { await supabase.from('mdf_claims').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', claim.id); loadClaims(); }}><XCircle className="w-4 h-4" />驳回</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <Modal open={showNewClaim} onClose={() => setShowNewClaim(false)} size="md" title="新建 MDF 核销申请">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">合作伙伴名称</label>
            <input type="text" value={newClaim.partner_name} onChange={e => setNewClaim({ ...newClaim, partner_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="输入合作伙伴名称" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">关联活动</label>
            <input type="text" value={newClaim.activity_name} onChange={e => setNewClaim({ ...newClaim, activity_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="输入关联活动名称" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">核销金额</label>
            <input type="number" value={newClaim.amount} onChange={e => setNewClaim({ ...newClaim, amount: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">费用说明</label>
            <textarea value={newClaim.description} onChange={e => setNewClaim({ ...newClaim, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2} placeholder="简要说明费用用途" />
          </div>
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-xs text-neutral-500">
            <p className="font-medium mb-1">📎 需上传材料:</p>
            <ul className="space-y-1 list-disc pl-4"><li>活动发票 (必需)</li><li>现场照片 (至少3张)</li><li>签到表扫描件</li></ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowNewClaim(false)}>取消</Button>
            <Button variant="brand" size="sm" onClick={handleSubmit}>提交申请</Button>
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  );
};
