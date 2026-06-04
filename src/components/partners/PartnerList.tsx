import { useState, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
import { TIER_STYLES, STATUS_CONFIG } from '../../lib/partner-labels';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, Pencil, Trash2, MapPin, Phone, CheckCircle2, XCircle, X, CheckSquare, RefreshCw, Users, UserCheck, Clock, Star } from 'lucide-react';
import { Partner, PartnerStatus, PartnerTier } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../ui/Toast';
import { ImportModal } from './ImportModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { partnerService } from '../../services/partner-service';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface PartnerListProps {
  partners: Partner[];
  onSelectPartner: (partnerId: string) => void;
  onImport?: (partners: Partner[], mode: 'replace' | 'merge') => void;
}

const ITEMS_PER_PAGE = 10;

export const PartnerList = ({ partners, onSelectPartner, onImport }: PartnerListProps) => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const { user } = useAuth();
  const { partners: partnerPermissions } = usePermission();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | 'All'>('All');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const [approvePartner, setApprovePartner] = useState<Partner | null>(null);
  const [approvalForm, setApprovalForm] = useState({ tier: 'Gold' as PartnerTier, status: 'Cooperating' as PartnerStatus, tags: '', manager: '' });
  // Load internal users from settings for manager selection
  const [internalUsers, setInternalUsers] = useState<{name:string}[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('internal_users') || '[]');
      setInternalUsers(saved.filter((u: any) => u.status === 'active'));
    } catch {}
  }, []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const canEdit = partnerPermissions.edit();
  const canImport = partnerPermissions.import();
  const canManageStaff = partnerPermissions.staff();

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await partnerService.list();
      if (onImport) onImport(result.items, 'replace');
    } catch { /* keep current state */ }
    setRefreshing(false);
  }, [onImport]);

  const pendingCount = partners.filter((p) => p.status === 'Prospective').length;

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleAll = () => {
    if (selected.size === pagedPartners.length) setSelected(new Set());
    else setSelected(new Set(pagedPartners.map((p) => p.id)));
  };

  const filteredPartners = useMemo(() => {
    let result = partners;
    if (tab === 'pending') { result = result.filter((p) => p.status === 'Prospective'); }
    else {
      if (deferredSearch.trim()) {
        const s = deferredSearch.toLowerCase();
        result = result.filter((p) => p.name.toLowerCase().includes(s) || (p.manager || '').toLowerCase().includes(s) || (p.tags || []).some((t) => t.toLowerCase().includes(s)));
      }
      if (statusFilter !== 'All') result = result.filter((p) => p.status === statusFilter);
      if (tierFilter !== 'All') result = result.filter((p) => p.tier === tierFilter);
      if (typeFilter !== 'All') result = result.filter((p) => p.type === typeFilter);
    }
    return result;
  }, [partners, deferredSearch, statusFilter, tierFilter, typeFilter, tab]);

  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / ITEMS_PER_PAGE));
  const pagedPartners = filteredPartners.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const partnerTypes = useMemo(() => [...new Set(partners.map((p) => p.type))], [partners]);
  const startRecord = filteredPartners.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endRecord = Math.min(page * ITEMS_PER_PAGE, filteredPartners.length);

  const filterBtn = (active: boolean, onClick: () => void, label: string) => (
    <button onClick={onClick} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', active ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800')}>{label}</button>
  );

  // ── Approve / Reject / Delete handlers ─────────────────
  const handleApprove = async () => {
    if (!approvePartner) return;
    try {
      await partnerService.approve(approvePartner.id, {
        tier: approvalForm.tier, status: approvalForm.status,
        manager: approvalForm.manager,
        tags: approvalForm.tags.split(',').map((s: string) => s.trim()).filter(Boolean),
      }, user?.email || 'admin');

      // Auto-generate milestone events
      const now = new Date().toISOString().split('T')[0];
      const milestones: any[] = [];
      // Always add approved event
      milestones.push({ id: crypto.randomUUID(), stage: 'approved', title: '合作伙伴批复通过', description: `正式成为${approvalForm.tier}级合作伙伴，渠道经理：${approvalForm.manager || '未指定'}`, date: now, year: now.split('-')[0], operator: user?.email || 'admin' });
      // Add tier change event if tier changed from original
      if (approvePartner.tier !== approvalForm.tier) {
        const isUpgrade = ['Registered','Silver','Gold','Platinum','Diamond'].indexOf(approvalForm.tier) < ['Registered','Silver','Gold','Platinum','Diamond'].indexOf(approvalForm.tier);
        milestones.push({ id: crypto.randomUUID(), stage: isUpgrade ? 'tier_upgrade' : 'tier_downgrade', title: `等级${isUpgrade?'提升':'调整'}：${approvePartner.tier} → ${approvalForm.tier}`, description: `合作伙伴等级从${approvePartner.tier}${isUpgrade?'晋升':'调整'}为${approvalForm.tier}`, date: now, year: now.split('-')[0], operator: user?.email || 'admin' });
      }
      await supabase.from('partners').update({ milestones }).eq('id', approvePartner.id);

      toast('success', `「${approvePartner.name}」已批复`);
      setApprovePartner(null);
      await refresh();
    } catch (err: any) { toast('error', `批复失败: ${err.message}`); }
  };
  const handleReject = async (partner: Partner) => {
    try {
      await partnerService.reject(partner.id, user?.email || 'admin');
      toast('success', `「${partner.name}」已驳回`);
      await refresh();
    } catch (err: any) { toast('error', `驳回失败: ${err.message}`); }
  };
  const handleDeletePartner = async () => {
    if (!deleteId) return;
    try {
      await partnerService.delete(deleteId, user?.email || 'admin');
      toast('success', '已删除');
      setDeleteId(null);
      await refresh();
    } catch (err: any) { toast('error', `删除失败: ${err.message}`); }
  };
  const handleBatchApprove = async () => {
    try {
      await partnerService.batchApprove([...selected], {
        tier: 'Gold', status: 'Cooperating', manager: '', tags: [],
      }, user?.email || 'admin');
      toast('success', t('partners.batchApproved', { count: selected.size }));
      setSelected(new Set());
      await refresh();
    } catch (err: any) { toast('error', `批量批复失败: ${err.message}`); }
  };
  const handleBatchReject = async () => {
    try {
      await partnerService.batchReject([...selected], user?.email || 'admin');
      toast('success', t('partners.batchRejected', { count: selected.size }));
      setSelected(new Set());
      await refresh();
    } catch (err: any) { toast('error', `批量驳回失败: ${err.message}`); }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('partners.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('partners.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" placeholder={t('partners.search')} value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-72 h-9 pl-9 pr-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand dark:text-white transition-all" />
          </div>
          {onImport && (
            <Button variant="secondary" size="md" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4" /> 导入
            </Button>
          )}
          <Button variant="brand" size="md" onClick={() => navigate('/partners/new')}>
            {t('partners.add')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: t('partners.all'), value: partners.length, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { icon: UserCheck, label: t('partners.active'), value: partners.filter(p => p.status === 'Cooperating').length, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          { icon: Clock, label: t('partners.pending'), value: pendingCount, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
          { icon: Star, label: t('partners.goldPlus'), value: partners.filter(p => ['Gold','Platinum','Diamond'].includes(p.tier)).length, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-neutral-500">{s.label}</p><p className="text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</p></div>
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}><s.icon className="w-5 h-5" /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
          <button onClick={() => setTab('all')} className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all', tab === 'all' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500')}>{t('partners.allTab')}</button>
          <button onClick={() => setTab('pending')} className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all', tab === 'pending' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500')}>{t('partners.pending')} {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px]">{pendingCount}</span>}</button>
        </div>
        <button onClick={refresh} disabled={refreshing} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50">
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />刷新
        </button>
      </div>

      {/* Batch Actions */}
      {selected.size > 0 && canEdit && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">{t('common.selected')} {selected.size} {t('common.items')}</span>
          {tab === 'pending' && (
            <>
              <Button variant="brand" size="sm" onClick={handleBatchApprove}><CheckCircle2 className="w-3.5 h-3.5" />{t('partners.batchApprove')}</Button>
              <Button variant="danger" size="sm" onClick={handleBatchReject}><XCircle className="w-3.5 h-3.5" />{t('partners.batchReject')}</Button>
            </>
          )}
          <button className="ml-auto text-xs text-neutral-400 hover:text-neutral-600" onClick={() => setSelected(new Set())}>{t('common.cancelSelection')}</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{t('common.status')}</span>
          <select className="h-8 px-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as PartnerStatus | 'All'); setPage(1); }}>
            <option value="All">{t('common.all')}</option>
            {(config.partnerStatuses || ['Cooperating','Inactive','Prospective']).map((s: string) => <option key={s} value={s}>{STATUS_CONFIG[s as PartnerStatus]?.label || s}</option>)}
          </select>
        </div>
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{t('common.tier')}</span>
          <select className="h-8 px-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand" value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}>
            <option value="All">{t('common.all')}</option>
            {config.partnerTiers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{t('common.type')}</span>
          <select className="h-8 px-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="All">{t('common.all')}</option>
            {[...new Set([...(config.partnerTypes || ['Reseller','ISV','SI','Service','VAD','VAR','OEM']), ...partnerTypes])].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {(statusFilter !== 'All' || tierFilter !== 'All' || typeFilter !== 'All') && (
          <button onClick={() => { setStatusFilter('All'); setTierFilter('All'); setTypeFilter('All'); setPage(1); }} className="text-[10px] text-blue-500 hover:underline ml-1">{t('common.clearFilters')}</button>
        )}
        <span className="ml-auto text-xs text-neutral-400">{filteredPartners.length} {t('common.results')}</span>
      </div>

      {/* Table */}
      {pagedPartners.length === 0 ? (
        <EmptyState title={t('partners.noResults')} description={t('partners.noResultsDesc')} />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                  {canEdit && tab === 'pending' && <th className="px-4 py-3.5 w-10"><input type="checkbox" checked={selected.size === pagedPartners.length && pagedPartners.length > 0} onChange={toggleAll} className="rounded" /></th>}
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">名称</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">类型</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">等级</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">加入日期</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">联系人</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {pagedPartners.map((partner) => {
                  const primary = (partner.contacts || []).find((c) => c.isPrimary) || (partner.contacts || [])[0];
                  const tierStyle = TIER_STYLES[partner.tier] || TIER_STYLES.Registered;
                  const statusCfg = STATUS_CONFIG[partner.status];
                  return (
                    <tr key={partner.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                      {canEdit && tab === 'pending' && <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.has(partner.id)} onChange={() => toggleSelect(partner.id)} className="rounded" /></td>}
                      <td className="px-6 py-4 cursor-pointer" onClick={() => onSelectPartner(partner.id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-50 to-blue-100 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center shrink-0 text-xs font-semibold text-brand-600 dark:text-brand-300">
                            {(partner.name || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-brand dark:group-hover:text-brand-light transition-colors">{partner.name}</p>
                            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{partner.location || partner.region}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{partner.type}</td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium border', tierStyle)}>{partner.tier}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{partner.startDate || '-'}</td>
                      <td className="px-6 py-4"><Badge variant={statusCfg?.variant || 'default'} size="md">{statusCfg?.label || partner.status}</Badge></td>
                      <td className="px-6 py-4">
                        {primary ? (
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{primary.lastName}{primary.firstName}</p>
                            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{primary.phone || primary.mobile || '-'}</p>
                          </div>
                        ) : <span className="text-sm text-neutral-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {tab === 'pending' && canEdit ? (
                            <>
                              <Button variant="brand" size="sm" onClick={() => { setApprovePartner(partner); setApprovalForm({ tier: 'Gold' as PartnerTier, status: 'Cooperating' as PartnerStatus, tags: '', manager: '' }); }}>
                                <CheckCircle2 className="w-3.5 h-3.5" />批复
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleReject(partner)}>
                                <XCircle className="w-3.5 h-3.5" />驳回
                              </Button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => onSelectPartner(partner.id)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-brand transition-colors" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                              {canEdit && <button onClick={() => setDeleteId(partner.id)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
            <span className="text-xs text-neutral-500">显示第 {startRecord} 到 {endRecord} 条，总共 {filteredPartners.length} 条记录</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="h-8 px-3 rounded-md text-xs font-medium border border-neutral-200 dark:border-neutral-700 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">上一页</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) { pageNum = i + 1; }
                else if (page <= 4) { pageNum = i + 1; }
                else if (page >= totalPages - 3) { pageNum = totalPages - 6 + i; }
                else { pageNum = page - 3 + i; }
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={cn('w-8 h-8 rounded-md text-xs font-medium transition-all', page === pageNum ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400')}>{pageNum}</button>
                );
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="h-8 px-3 rounded-md text-xs font-medium border border-neutral-200 dark:border-neutral-700 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">下一页</button>
            </div>
          </div>
        </div>
      )}

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)}
        onImport={(imported, mode) => { onImport?.(imported, mode); setShowImport(false); }} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDeletePartner}
        title={t('partners.deleteConfirm')} description={t('partners.deleteDesc')} confirmLabel={t('common.delete')} variant="danger" />

      {/* ── Approval Modal ─────────────────── */}
      {approvePartner && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setApprovePartner(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('partners.approvePartner')}</h3>
              <button onClick={() => setApprovePartner(null)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-neutral-500 mb-4">{t('partners.approveDesc')}「{approvePartner.name}」</p>
            <div className="space-y-3">
              <Select label={t('partners.tier')} options={(config?.partnerTiers || ['Platinum','Gold','Silver','Registered']).map(v=>({value:v,label:v}))} value={approvalForm.tier} onChange={(e) => setApprovalForm({...approvalForm, tier: e.target.value as PartnerTier})} />
              <Select label={t('partners.status')} options={(config?.partnerStatuses || ['Cooperating','Inactive','Prospective']).map(v=>({value:v,label:STATUS_CONFIG[v as PartnerStatus]?.label || v}))} value={approvalForm.status} onChange={(e) => setApprovalForm({...approvalForm, status: e.target.value as PartnerStatus})} />
              <Select label={t('partners.manager')} options={[...internalUsers.map((u: any) => ({ value: u.name, label: `${u.name} · ${u.department || ''}` })), { value: '__custom', label: '其他（手动输入）' }]} value={approvalForm.manager} onChange={(e) => { if (e.target.value === '__custom') { const name = prompt('请输入渠道经理姓名:'); if (name) setApprovalForm({...approvalForm, manager: name}); } else { setApprovalForm({...approvalForm, manager: e.target.value}); } }} />
              <Input label={t('partners.tags')} value={approvalForm.tags} onChange={(e) => setApprovalForm({...approvalForm, tags: e.target.value})} placeholder={t('partners.tagsPlaceholder')} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setApprovePartner(null)}>{t('common.cancel')}</Button>
              <Button variant="danger" size="sm" onClick={() => { setApprovePartner(null); handleReject(approvePartner); }}><XCircle className="w-4 h-4" />{t('partners.reject')}</Button>
              <Button variant="brand" size="sm" onClick={handleApprove}><CheckCircle2 className="w-4 h-4" />{t('partners.approve')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
