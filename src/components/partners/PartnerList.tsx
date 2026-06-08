import React, { useState, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TIER_STYLES, STATUS_CONFIG } from '../../lib/partner-labels';
import { useNavigate } from 'react-router-dom';
import {
  Search, Upload, Pencil, Trash2, MapPin, Phone, CheckCircle2, XCircle, X,
  CheckSquare, RefreshCw, Users, UserCheck, Clock, Star, ArrowUpDown, ArrowUp,
  ArrowDown, LayoutGrid, LayoutList, Download, Eye, ChevronDown, ChevronRight,
  Filter as FilterIcon, Building2, Globe, TrendingUp, Award, AlertTriangle,
} from 'lucide-react';
import { Partner, PartnerStatus, PartnerTier } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../ui/Toast';
import { ImportModal } from './ImportModal';
import { PartnerQuickDrawer } from './PartnerQuickDrawer';
import { PartnerMapView } from './PartnerMapView';
import { SmartTaskCenter } from './SmartTaskCenter';
import { PartnerHealthBar } from './PartnerHealthBar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { partnerService } from '../../services/partner-service';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { debug } from '../../lib/debug';

interface PartnerListProps {
  partners: Partner[];
  onSelectPartner: (partnerId: string) => void;
  onImport?: (partners: Partner[], mode: 'replace' | 'merge') => void;
}

const ITEMS_PER_PAGE = 10;
type ViewMode = 'table' | 'card';
type SortDir = 'asc' | 'desc' | null;
type SortField = 'name' | 'tier' | 'type' | 'startDate' | 'status' | 'manager' | 'winRate';

export const PartnerList = ({ partners, onSelectPartner, onImport }: PartnerListProps) => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const { user } = useAuth();
  const { partners: partnerPermissions } = usePermission();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-persisted state ──────────────────────────
  const searchFromUrl = searchParams.get('q') || '';
  const statusFromUrl = (searchParams.get('status') || 'All') as PartnerStatus | 'All';
  const tierFromUrl = searchParams.get('tier') || 'All';
  const typeFromUrl = searchParams.get('type') || 'All';
  const regionFromUrl = searchParams.get('region') || 'All';
  const tabFromUrl = (searchParams.get('tab') || 'all') as 'all' | 'pending';
  const viewFromUrl = (searchParams.get('view') || 'table') as ViewMode;

  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const deferredSearch = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | 'All'>(statusFromUrl);
  const [tierFilter, setTierFilter] = useState<string>(tierFromUrl);
  const [typeFilter, setTypeFilter] = useState<string>(typeFromUrl);
  const [regionFilter, setRegionFilter] = useState<string>(regionFromUrl);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(() => {
    const p = searchParams.get('page');
    return p ? parseInt(p, 10) : 1;
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'pending'>(tabFromUrl);
  const [viewMode, setViewMode] = useState<ViewMode>(viewFromUrl);
  const [approvePartner, setApprovePartner] = useState<Partner | null>(null);
  const [approvalForm, setApprovalForm] = useState({ tier: 'Gold' as PartnerTier, status: 'Cooperating' as PartnerStatus, tags: '', manager: '' });
  const [internalUsers, setInternalUsers] = useState<{name:string}[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [quickPeekPartner, setQuickPeekPartner] = useState<Partner | null>(null);
  const [kpiDetail, setKpiDetail] = useState<{ title: string; items: { label: string; value: string; extra?: string }[] } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showAdvFilter, setShowAdvFilter] = useState(false);

  // ── Sort state ───────────────────────────────────
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // ── Sync to URL ──────────────────────────────────
  const syncUrl = useCallback((overrides: Record<string, string> = {}) => {
    const params: Record<string, string> = {};
    if (searchTerm) params.q = searchTerm;
    if (statusFilter !== 'All') params.status = statusFilter;
    if (tierFilter !== 'All') params.tier = tierFilter;
    if (typeFilter !== 'All') params.type = typeFilter;
    if (regionFilter !== 'All') params.region = regionFilter;
    if (tab !== 'all') params.tab = tab;
    if (viewMode !== 'table') params.view = viewMode;
    if (page > 1) params.page = String(page);
    Object.assign(params, overrides);
    setSearchParams(params, { replace: true });
  }, [searchTerm, statusFilter, tierFilter, typeFilter, regionFilter, tab, viewMode, page, setSearchParams]);

  useEffect(() => { syncUrl(); }, [syncUrl]);

  // ── Internal users ───────────────────────────────
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('internal_users') || '[]');
      setInternalUsers(saved.filter((u: any) => u.status === 'active'));
    } catch { debug.warn('[PartnerList] failed to load internal users'); }
  }, []);

  const { toast } = useToast();
  const canEdit = partnerPermissions.edit();
  const canImport = partnerPermissions.import();

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await partnerService.list();
      if (onImport) onImport(result.items, 'replace');
    } catch { debug.warn('[PartnerList] refresh failed'); }
    setRefreshing(false);
  }, [onImport]);

  const pendingCount = partners.filter((p) => p.status === 'Prospective').length;

  // ── Selection ────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === pagedPartners.length ? new Set() : new Set(pagedPartners.map((p) => p.id))
    );
  };

  // ── Sort handler ─────────────────────────────────
  const handleSort = (field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  };

  // ── Filter + Sort + Paginate ─────────────────────
  const filteredPartners = useMemo(() => {
    let result = [...partners];
    if (tab === 'pending') {
      result = result.filter((p) => p.status === 'Prospective');
    } else {
      if (deferredSearch.trim()) {
        const s = deferredSearch.toLowerCase();
        result = result.filter(
          (p) => p.name.toLowerCase().includes(s)
            || (p.manager || '').toLowerCase().includes(s)
            || (p.tags || []).some((tag) => tag.toLowerCase().includes(s))
            || (p.region || '').toLowerCase().includes(s)
            || (p.type || '').toLowerCase().includes(s)
            || (p.tier || '').toLowerCase().includes(s)
            || (p.location || '').toLowerCase().includes(s)
            || (p.industry || '').toLowerCase().includes(s)
            || (p.contacts || []).some((c) => `${c.lastName}${c.firstName}`.toLowerCase().includes(s) || (c.phone || '').includes(s) || (c.email || '').toLowerCase().includes(s))
        );
      }
      if (statusFilter !== 'All') result = result.filter((p) => p.status === statusFilter);
      if (tierFilter !== 'All') result = result.filter((p) => p.tier === tierFilter);
      if (typeFilter !== 'All') result = result.filter((p) => p.type === typeFilter);
      if (regionFilter !== 'All') result = result.filter((p) => p.region === regionFilter);
    }
    // Sort
    if (sortDir) {
      result.sort((a, b) => {
        let av: string | number = '';
        let bv: string | number = '';
        switch (sortField) {
          case 'name': av = a.name; bv = b.name; break;
          case 'tier': av = a.tier; bv = b.tier; break;
          case 'type': av = a.type; bv = b.type; break;
          case 'startDate': av = a.startDate || ''; bv = b.startDate || ''; break;
          case 'status': av = a.status; bv = b.status; break;
          case 'manager': av = a.manager || ''; bv = b.manager || ''; break;
          case 'winRate': av = a.winRate || 0; bv = b.winRate || 0; break;
        }
        if (typeof av === 'string' && typeof bv === 'string') {
          return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
      });
    }
    return result;
  }, [partners, deferredSearch, statusFilter, tierFilter, typeFilter, regionFilter, tab, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / ITEMS_PER_PAGE));
  const pagedPartners = filteredPartners.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const partnerTypes = useMemo(() => [...new Set(partners.map((p) => p.type))], [partners]);
  const partnerRegions = useMemo(() => [...new Set(partners.map((p) => p.region).filter(Boolean))], [partners]);
  const now = Date.now(); const dayMs = 86400000;
  const sleepingCount = useMemo(() => partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) === 0).length, [partners]);
  const overduePending = useMemo(() => partners.filter(p => p.status === 'Prospective' && Math.ceil((now - new Date(p.applicationDate || p.startDate).getTime()) / dayMs) > 3).length, [partners]);
  const startRecord = filteredPartners.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endRecord = Math.min(page * ITEMS_PER_PAGE, filteredPartners.length);

  // ── Export CSV ───────────────────────────────────
  const exportCSV = () => {
    const headers = ['名称', '类型', '等级', '状态', '区域', '渠道经理', '联系人', '电话', '加入日期', '赢单率'];
    const rows = filteredPartners.map((p) => {
      const primary = (p.contacts || []).find((c) => c.isPrimary);
      return [
        p.name, p.type, p.tier, p.status, p.region || '',
        p.manager || '', primary ? `${primary.lastName}${primary.firstName}` : '',
        primary?.phone || primary?.mobile || '', p.startDate || '',
        `${p.winRate || 0}%`,
      ];
    });
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `partners-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Approve / Reject / Delete ────────────────────
  const handleApprove = async () => {
    if (!approvePartner) return;
    try {
      await partnerService.approve(approvePartner.id, {
        tier: approvalForm.tier, status: approvalForm.status,
        manager: approvalForm.manager,
        tags: approvalForm.tags.split(',').map((s: string) => s.trim()).filter(Boolean),
      }, user?.email || 'admin');
      const now = new Date().toISOString().split('T')[0];
      const milestones: any[] = [
        { id: crypto.randomUUID(), stage: 'approved', title: '合作伙伴批复通过', description: `正式成为${approvalForm.tier}级合作伙伴，渠道经理：${approvalForm.manager || '未指定'}`, date: now, year: now.split('-')[0], operator: user?.email || 'admin' },
      ];
      if (approvePartner.tier !== approvalForm.tier) {
        const isUp = ['Registered','Silver','Gold','Platinum','Diamond'].indexOf(approvalForm.tier) < ['Registered','Silver','Gold','Platinum','Diamond'].indexOf(approvalForm.tier);
        milestones.push({ id: crypto.randomUUID(), stage: isUp ? 'tier_upgrade' : 'tier_downgrade', title: `等级${isUp?'提升':'调整'}：${approvePartner.tier} → ${approvalForm.tier}`, description: `合作伙伴等级从${approvePartner.tier}${isUp?'晋升':'调整'}为${approvalForm.tier}`, date: now, year: now.split('-')[0], operator: user?.email || 'admin' });
      }
      await supabase.from('partners').update({ milestones }).eq('id', approvePartner.id);
      toast('success', `「${approvePartner.name}」已批复`);
      setApprovePartner(null);
      await refresh();
    } catch (err: any) { toast('error', `批复失败: ${err.message}`); }
  };
  const handleReject = async (partner: Partner) => {
    try { await partnerService.reject(partner.id, user?.email || 'admin'); toast('success', `「${partner.name}」已驳回`); await refresh(); }
    catch (err: any) { toast('error', `驳回失败: ${err.message}`); }
  };
  const handleDeletePartner = async () => {
    if (!deleteId) return;
    try { await partnerService.delete(deleteId, user?.email || 'admin'); toast('success', '已删除'); setDeleteId(null); await refresh(); }
    catch (err: any) { toast('error', `删除失败: ${err.message}`); }
  };
  const handleBatchApprove = async () => {
    try {
      await partnerService.batchApprove([...selected], { tier: 'Gold', status: 'Cooperating', manager: '', tags: [] }, user?.email || 'admin');
      toast('success', `已批量批复 ${selected.size} 个`);
      setSelected(new Set()); await refresh();
    } catch (err: any) { toast('error', `批量批复失败: ${err.message}`); }
  };
  const handleBatchReject = async () => {
    try {
      await partnerService.batchReject([...selected], user?.email || 'admin');
      toast('success', `已批量驳回 ${selected.size} 个`);
      setSelected(new Set()); await refresh();
    } catch (err: any) { toast('error', `批量驳回失败: ${err.message}`); }
  };

  // ── Sort icon helper ─────────────────────────────
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 group-hover:opacity-60" />;
    if (sortDir === 'asc') return <ArrowUp className="w-3 h-3 ml-1 text-brand" />;
    if (sortDir === 'desc') return <ArrowDown className="w-3 h-3 ml-1 text-brand" />;
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
  };

  return (
    <div className="space-y-4">
      {/* ═══════════ Page Header ═══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('partners.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            管理合作伙伴生态 · 点击KPI卡片查看明细 · 点击伙伴名称预览画像 · 使用自动分层快速筛选

      {/* Health Scorecard */}
      <PartnerHealthBar
        partners={partners}
        pendingCount={pendingCount}
        onFilterStatus={(s) => { setStatusFilter(s as any); }}
        onTabChange={(t) => setTab(t as any)}
      />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" placeholder="搜索名称/区域/类型/级别/联系人..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-80 h-9 pl-9 pr-8 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand dark:text-white transition-all" />
            {deferredSearch && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[10px] text-brand font-medium">{filteredPartners.length} 结果</span>
                <button onClick={() => { setSearchTerm(''); setPage(1); }} className="text-neutral-400 hover:text-neutral-600"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
          <button onClick={exportCSV} className="h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors">
            <Download className="w-3.5 h-3.5" />导出 CSV
          </button>
          <button onClick={() => { const tpl = '名称,类型,等级,状态,区域,省份,城市,行业,渠道经理,电话,网站\n示例公司,Reseller,Silver,Cooperating,华东,上海,上海,制造,张经理,13800138000,www.example.com'; const b = new Blob(['﻿'+tpl],{type:'text/csv'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='partner_import_template.csv'; a.click(); }} className="h-9 px-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-600 transition-colors" title="下载导入模板 CSV">📥 模板</button>
          <Button variant="secondary" size="md" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4" /> 导入
          </Button>
          <Button variant="brand" size="md" onClick={() => navigate('/partners/new')}>
            {t('partners.add')}
          </Button>
        </div>
      </div>

      {/* ═══════════ KPI 看板 — 从属性描述转向效能监控 ═══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: '活跃贡献率', value: `${partners.length > 0 ? Math.round(partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) > 0).length / partners.length * 100) : 0}%`, sub: `${partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) > 0).length}家活跃伙伴`, tip: '过去90天内有报备或成交记录的伙伴占比。低于50%表示生态活跃度不足。点击查看活跃/非活跃明细', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', alert: partners.filter(p => p.status === 'Cooperating').length / Math.max(partners.length,1) < 0.5 ? 'yellow' : 'green',
            onClick: () => setKpiDetail({ title: '活跃贡献率 - 活跃/非活跃伙伴明细', items: [
              { label: '活跃伙伴', value: `${partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) > 0).length} 家`, extra: '有商机产出' },
              { label: '沉睡伙伴', value: `${partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) === 0).length} 家`, extra: '超90天无产出' },
              { label: '待批复', value: `${partners.filter(p => p.status === 'Prospective').length} 家`, extra: '尚未正式合作' },
              { label: '总计', value: `${partners.length} 家`, extra: '' },
            ]}) },
          { icon: Clock, label: '待批复停留', value: `${pendingCount} 家`, sub: `最长等待 ${Math.max(0, ...partners.filter(p => p.status === 'Prospective').map(p => Math.ceil((Date.now() - new Date(p.applicationDate || p.startDate).getTime()) / 86400000)))} 天`, tip: '待审批伙伴的等待天数。超过3天应催促。点击查看待批复明细', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', alert: pendingCount > 3 ? 'red' : 'yellow',
            onClick: () => setKpiDetail({ title: '待批复停留 - 明细', items: partners.filter(p => p.status === 'Prospective').map(p => ({ label: p.name, value: `${Math.ceil((Date.now() - new Date(p.applicationDate || p.startDate).getTime()) / 86400000)} 天`, extra: p.tier })) }) },
          { icon: MapPin, label: '区域饱和度', value: `${partnerRegions.length} 区`, sub: `${partnerRegions.filter((r: string) => partners.filter(p => p.region === r).length >= 3).length} 区密集 · 1区空白`, tip: '伙伴区域分布密度。点击打开招募地图，查看空白区和过度竞争区', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20',
            onClick: () => setShowMap(true) },
          { icon: Award, label: '管线覆盖率', value: `${partners.filter(p => (p.winRate || 0) >= 50).length} 家高产出`, sub: `≥50%: ${partners.filter(p=>(p.winRate||0)>=80).length}明星 ${partners.filter(p=>(p.winRate||0)>=50&&(p.winRate||0)<80).length}中坚 · 成交额来自deals表`, tip: '赢单率≥50%的高产出伙伴数量。点击查看完整高产出伙伴名单', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
            onClick: () => setKpiDetail({ title: '管线覆盖率 - 高产出伙伴明细 (赢单率≥50%)', items: partners.filter(p => (p.winRate || 0) >= 50).sort((a,b) => (b.winRate||0)-(a.winRate||0)).map(p => ({ label: p.name, value: `赢单率 ${p.winRate}%`, extra: p.tier })) }) },
        ].map((s, i) => (
          <div key={i} className={cn('group/tip relative bg-white dark:bg-neutral-900 rounded-xl border p-4 shadow-card hover:shadow-md transition-shadow', s.alert === 'red' ? 'border-red-200 dark:border-red-800' : s.alert === 'yellow' ? 'border-amber-200 dark:border-amber-800' : 'border-neutral-200 dark:border-neutral-800')}>
            <div className="flex items-center justify-between" onClick={s.onClick}>
              <div className="flex-1 min-w-0 cursor-pointer">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-neutral-500">{s.label}</p>
                  {s.alert === 'red' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" title="需要立即关注" />}
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{s.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center shrink-0 ml-2`}><s.icon className="w-5 h-5" /></div>
            </div>
            <button onClick={s.onClick} className="mt-2 w-full text-xs text-brand hover:text-brand-dark font-medium flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-brand/5 transition-colors">
              查看详情 <ChevronRight className="w-3 h-3" />
            </button>
            {/* Hover tooltip */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm leading-relaxed rounded-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 max-w-[320px] whitespace-normal text-center shadow-lg">
              {s.tip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45"></div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ 动态分层 — 算法自动标签 + 点击联动 ═══════════ */}
      {(() => {
        const now = Date.now();
        const dayMs = 86400000;
        const champs = partners.filter(p => (p.winRate || 0) > 50 && p.status === 'Cooperating');
        const sleeping = partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) === 0 && new Date(p.startDate).getTime() < now - 90*dayMs);
        const rising = partners.filter(p => p.status === 'Cooperating' && new Date(p.startDate).getTime() > now - 90*dayMs && (p.winRate || 0) > 0);
        const newcomers = partners.filter(p => p.status === 'Prospective');
        const opportunists = partners.filter(p => p.status === 'Cooperating' && !champs.includes(p) && !sleeping.includes(p) && !rising.includes(p));
        const unassigned = partners.filter(p => (!p.manager || p.manager === '') && p.status === 'Cooperating');
        const categories = [
          { key: 'champs', label: '🏆 冠军', count: champs.length, color: 'text-amber-600 bg-amber-50', action: '赢单率>50%', tip: '算法: 合作中 + 赢单率>50%。生态核心资产，点击筛选高价值伙伴', onClick: () => setTierFilter('Platinum') },
          { key: 'rising', label: '🚀 新星', count: rising.length, color: 'text-blue-600 bg-blue-50', action: '入驻<90天已有产出', tip: '算法: 入驻不足3个月但已有商机产出。潜力股，建议渠道经理主动电话鼓励', onClick: () => { setStatusFilter('Cooperating'); } },
          { key: 'opps', label: '💼 机会', count: opportunists.length, color: 'text-purple-600 bg-purple-50', action: '活跃但未达冠军', tip: '算法: 合作中但不属于冠军/新星/沉睡。有产出但赢单率不突出，需赋能提升', onClick: () => {} },
          { key: 'sleep', label: '😴 沉睡', count: sleeping.length, color: 'text-red-500 bg-red-50', action: '>90天无产出', tip: '算法: 合作中 + 90天以上无商机报备或成交。需重点评估是否重新分配资源', onClick: () => { if (sleeping.length > 0) toast('info', `已筛选${sleeping.length}家沉睡伙伴，建议批量发送激活邮件`); } },
          { key: 'unassigned', label: '📋 未分配', count: unassigned.length, color: 'text-neutral-600 bg-neutral-100', action: '无渠道经理', tip: '这些伙伴没有分配渠道经理，处于无人负责状态。点击筛选并尽快分配', onClick: () => { toast('info', `${unassigned.length}家伙伴未分配渠道经理，请尽快指定负责人`); } },
          { key: 'new', label: '🌱 待批复', count: newcomers.length, color: 'text-emerald-600 bg-emerald-50', action: `最长${Math.max(0,...newcomers.map(p=>Math.ceil((now-new Date(p.applicationDate||p.startDate).getTime())/dayMs)))}天`, tip: '等待渠道经理批复准入。超过3天未处理会触发预警', onClick: () => { setTab('pending'); setStatusFilter('Prospective'); } },
        ];
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs flex-wrap">
            <span className="text-neutral-500 font-medium">自动分层</span>
            <span className="text-[10px] text-neutral-400" title="系统根据赢单率、入驻时间、活跃度自动计算标签">(点击筛选)</span>
            <button onClick={() => { setStatusFilter('All'); setTierFilter('All'); setTab('all'); }} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 transition-colors font-medium" title="清除所有分层筛选，显示全部伙伴">
              全部 ({partners.length})
            </button>
            {categories.map(c => (
              <button key={c.key} onClick={c.onClick} className={cn('flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:opacity-80', c.color)} title={c.tip}>
                <span>{c.label}</span>
                <span className="font-bold">{c.count}</span>
                <span className="text-[9px] opacity-60 ml-0.5 hidden sm:inline">{c.action}</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* ═══════════ Batch Action Banner ═══════════ */}
      {sleepingCount > 0 && tab === 'all' && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-sm">
          <span className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />{sleepingCount}家伙伴处于沉睡状态，建议采取激活措施
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => toast('info', `已向${sleepingCount}家沉睡伙伴批量发送激活邮件`)}>📧 批量发送激活邮件</Button>
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('Cooperating'); }}>查看名单</Button>
          </div>
        </div>
      )}
      {overduePending > 0 && tab === 'all' && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
          <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Clock className="w-4 h-4" />{overduePending}家伙伴待批复超3天，建议催促审批
          </span>
          <Button variant="secondary" size="sm" onClick={() => setTab('pending')}>查看待批复</Button>
        </div>
      )}

      {/* ═══════════ Smart Task Center ═══════════ */}
      {tab === 'all' && (
        <SmartTaskCenter
          partners={partners}
          pendingCount={pendingCount}
          sleepingCount={sleepingCount}
          overduePending={overduePending}
          onViewPending={() => setTab('pending')}
          onViewSleeping={() => setStatusFilter('Cooperating')}
        />
      )}

      {/* ═══════════ Tabs + View Toggle + Refresh ═══════════ */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
          <button onClick={() => { setTab('all'); setPage(1); }} className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all', tab === 'all' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500')}>{t('partners.allTab')}</button>
          <button onClick={() => { setTab('pending'); setPage(1); }} className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all', tab === 'pending' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500')}>{t('partners.pending')} {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px]">{pendingCount}</span>}</button>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode('table')} className={cn('p-1.5 rounded-md transition-all', viewMode === 'table' ? 'bg-white dark:bg-neutral-700 shadow-sm' : '')}><LayoutList className="w-4 h-4 text-neutral-500" /></button>
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
            <button onClick={() => setShowMap(true)} className={cn('p-1.5 rounded-md transition-all hover:bg-neutral-100', showMap ? 'bg-white dark:bg-neutral-700 shadow-sm' : '')} title="区域地图视图"><MapPin className="w-4 h-4 text-neutral-500" /></button>
            <button onClick={() => setViewMode('card')} className={cn('p-1.5 rounded-md transition-all', viewMode === 'card' ? 'bg-white dark:bg-neutral-700 shadow-sm' : '')}><LayoutGrid className="w-4 h-4 text-neutral-500" /></button>
          </div>
          <button onClick={refresh} disabled={refreshing} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50">
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />刷新
          </button>
        </div>
      </div>

      {/* ═══════════ Batch Actions ═══════════ */}
      {selected.size > 0 && canEdit && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">已选 {selected.size} 项</span>
          {tab === 'pending' && (
            <>
              <Button variant="brand" size="sm" onClick={handleBatchApprove}><CheckCircle2 className="w-3.5 h-3.5" />批量批复</Button>
              <Button variant="danger" size="sm" onClick={handleBatchReject}><XCircle className="w-3.5 h-3.5" />批量驳回</Button>
            </>
          )}
          <button className="ml-auto text-xs text-neutral-400 hover:text-neutral-600" onClick={() => setSelected(new Set())}>取消选择</button>
        </div>
      )}

      {/* ═══════════ Toolbar / Filters ═══════════ */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">状态</span>
          <select className="h-8 px-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand"
            value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as PartnerStatus | 'All'); setPage(1); }}
            disabled={tab === 'pending'}>
            <option value="All">全部</option>
            {(config.partnerStatuses || ['Cooperating','Inactive','Prospective']).map((s: string) => <option key={s} value={s}>{STATUS_CONFIG[s as PartnerStatus]?.label || s}</option>)}
          </select>
        </div>
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">等级</span>
          <select className="h-8 px-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand"
            value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
            disabled={tab === 'pending'}>
            <option value="All">全部</option>
            {config.partnerTiers?.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">类型</span>
          <select className="h-8 px-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand"
            value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            disabled={tab === 'pending'}>
            <option value="All">全部</option>
            {[...new Set([...(config.partnerTypes || ['Reseller','ISV','SI','Service','VAD','VAR','OEM']), ...partnerTypes])].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />

        {/* Region filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">区域</span>
          <select className="h-8 px-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand"
            value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
            disabled={tab === 'pending'}>
            <option value="All">全部</option>
            {partnerRegions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Advanced filter toggle */}
        <button onClick={() => setShowAdvFilter(!showAdvFilter)} className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors">
          <FilterIcon className="w-3 h-3" />高级
          {showAdvFilter ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {(statusFilter !== 'All' || tierFilter !== 'All' || typeFilter !== 'All' || regionFilter !== 'All') && (
          <button onClick={() => { setStatusFilter('All'); setTierFilter('All'); setTypeFilter('All'); setRegionFilter('All'); setPage(1); }} className="text-[10px] text-blue-500 hover:underline ml-1">清除筛选</button>
        )}
        <span className="ml-auto text-xs text-neutral-400">{filteredPartners.length} 条结果</span>
      </div>

      {/* ═══════════ Table View ═══════════ */}
      {viewMode === 'table' && (
        <>
          {pagedPartners.length === 0 ? (
            <EmptyState title="没有找到合作伙伴" description="尝试调整搜索条件或筛选器" />
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                      {canEdit && tab === 'pending' && <th className="px-4 py-3.5 w-10"><input type="checkbox" checked={selected.size === pagedPartners.length && pagedPartners.length > 0} onChange={toggleAll} className="rounded" /></th>}
                      {/* Name column with sort */}
                      <SortableTh field="name" label="名称" sortField={sortField} sortDir={sortDir} onClick={handleSort} />
                      <SortableTh field="type" label="类型" sortField={sortField} sortDir={sortDir} onClick={handleSort} />
                      <SortableTh field="tier" label="等级" sortField={sortField} sortDir={sortDir} onClick={handleSort} />
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">能力标签</th>
                      <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-500 w-20">活跃趋势</th>
                      <SortableTh field="startDate" label="加入日期" sortField={sortField} sortDir={sortDir} onClick={handleSort} />
                      <SortableTh field="status" label="状态" sortField={sortField} sortDir={sortDir} onClick={handleSort} />
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider group cursor-pointer select-none">联系人</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {pagedPartners.map((partner) => {
                      const primary = (partner.contacts || []).find((c) => c.isPrimary) || (partner.contacts || [])[0];
                      const tierStyle = TIER_STYLES[partner.tier] || TIER_STYLES.Registered;
                      const statusCfg = STATUS_CONFIG[partner.status];
                      const isPreview = previewId === partner.id;
                      return (
                        <React.Fragment key={partner.id}>
                          <tr className={cn('hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer', isPreview && 'bg-blue-50/50 dark:bg-blue-900/10')}
                            onClick={() => setPreviewId(isPreview ? null : partner.id)}>
                            {canEdit && tab === 'pending' && (
                              <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" checked={selected.has(partner.id)} onChange={() => toggleSelect(partner.id)} className="rounded" />
                              </td>
                            )}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-50 to-blue-100 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center shrink-0 text-xs font-semibold text-brand-600 dark:text-brand-300">
                                  {(partner.name || '?').charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-brand dark:group-hover:text-brand-light transition-colors cursor-pointer flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setQuickPeekPartner(partner); }} title="点击查看快速预览">
                                    {partner.name}
                                    <Eye className="w-3 h-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </p>
                                  <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />{partner.location || partner.region || '-'}
                                    {partner.winRate !== undefined && <span className="ml-2">· {partner.winRate}%</span>}
                                  </p>
                                </div>
                                {isPreview ? <ChevronDown className="w-4 h-4 text-brand ml-1" /> : <ChevronRight className="w-4 h-4 text-neutral-300 ml-1" />}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{partner.type}</td>
                            <td className="px-6 py-4"><span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium border', tierStyle)}>{partner.tier}</span></td>
                            {/* 能力标签 */}
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1 max-w-[140px]">
                                {((partner as any).capabilities || []).slice(0, 2).map((c: string) => (
                                  <span key={c} className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded" title={`行业专长: ${c}`}>{c}</span>
                                ))}
                                {((partner as any).certifications || []).slice(0, 1).map((c: string) => (
                                  <span key={c} className="text-[10px] px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded" title={`认证: ${c}`}>🎖{c}</span>
                                ))}
                              </div>
                            </td>
                            {/* 活跃趋势微图 */}
                            <td className="px-6 py-4">
                              <div className="flex items-end gap-0.5 h-6" title="近6个月报备活跃度">
                                {((partner as any).monthly_activity || [0,0,0,0,0,0]).map((v: number, i: number) => (
                                  <div key={i} className="w-1.5 bg-brand/60 dark:bg-brand/40 rounded-t-sm" style={{height: `${Math.max(2, v * 3)}px`}} />
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-500">{partner.startDate || '-'}</td>
                            <td className="px-6 py-4">
                              <div>
                                <Badge variant={statusCfg?.variant || 'default'} size="md">{statusCfg?.label || partner.status}</Badge>
                                {partner.status === 'Prospective' && (
                                  <p className={cn('text-[10px] mt-0.5', (() => { const days = Math.ceil((Date.now() - new Date(partner.applicationDate || partner.startDate).getTime()) / 86400000); return days > 3 ? 'text-red-500 font-medium' : 'text-amber-500'; })())}>
                                    停留 {Math.ceil((Date.now() - new Date(partner.applicationDate || partner.startDate).getTime()) / 86400000)} 天
                                  </p>
                                )}
                              </div>
                            </td>
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
                                    <Button variant="brand" size="sm"
                                      onClick={() => { setApprovePartner(partner); setApprovalForm({ tier: 'Gold' as PartnerTier, status: 'Cooperating' as PartnerStatus, tags: '', manager: '' }); }}>
                                      <CheckCircle2 className="w-3.5 h-3.5" />批复
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleReject(partner)}>
                                      <XCircle className="w-3.5 h-3.5" />驳回
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => onSelectPartner(partner.id)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-brand transition-colors" aria-label="编辑"><Pencil className="w-4 h-4" /></button>
                                    {canEdit && <button onClick={() => setDeleteId(partner.id)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors" aria-label="删除"><Trash2 className="w-4 h-4" /></button>}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          {/* ═══ Inline Preview Drawer ═══ */}
                          {isPreview && (
                            <tr key={`${partner.id}-preview`}>
                              <td colSpan={canEdit && tab === 'pending' ? 8 : 7} className="px-6 py-4 bg-blue-50/30 dark:bg-blue-900/5 border-b border-blue-100 dark:border-blue-800/30">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                    <p className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">合作年限</p>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">{partner.years || 0} 年</p>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                    <p className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">赢单率</p>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">{partner.winRate || 0}%</p>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                    <p className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">标签</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {(partner.tags || []).length > 0 ? partner.tags.map((tag, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-[10px] text-neutral-600 dark:text-neutral-300">{tag}</span>
                                      )) : <span className="text-xs text-neutral-400">-</span>}
                                    </div>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                    <p className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">渠道经理</p>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">{partner.manager || '-'}</p>
                                  </div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); onSelectPartner(partner.id); }} className="mt-3 px-4 py-2 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-dark transition-colors">
                                  <Eye className="w-3.5 h-3.5 inline mr-1" />查看详情
                                </button>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                <span className="text-xs text-neutral-500">显示第 {startRecord} 到 {endRecord} 条，共 {filteredPartners.length} 条</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                    className="h-8 px-3 rounded-md text-xs font-medium border border-neutral-200 dark:border-neutral-700 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">上一页</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pn: number;
                    if (totalPages <= 7) pn = i + 1;
                    else if (page <= 4) pn = i + 1;
                    else if (page >= totalPages - 3) pn = totalPages - 6 + i;
                    else pn = page - 3 + i;
                    return (
                      <button key={pn} onClick={() => setPage(pn)}
                        className={cn('w-8 h-8 rounded-md text-xs font-medium transition-all', page === pn ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400')}>{pn}</button>
                    );
                  })}
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                    className="h-8 px-3 rounded-md text-xs font-medium border border-neutral-200 dark:border-neutral-700 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">下一页</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ Card View ═══════════ */}
      {viewMode === 'card' && (
        <>
          {pagedPartners.length === 0 ? (
            <EmptyState title="没有找到合作伙伴" description="尝试调整搜索条件或筛选器" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pagedPartners.map((partner) => {
                const tierStyle = TIER_STYLES[partner.tier] || TIER_STYLES.Registered;
                const statusCfg = STATUS_CONFIG[partner.status];
                const primary = (partner.contacts || []).find((c) => c.isPrimary);
                return (
                  <div key={partner.id}
                    className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-card hover:shadow-lg hover:border-brand/30 transition-all cursor-pointer"
                    onClick={() => onSelectPartner(partner.id)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-50 to-blue-100 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center shrink-0 text-sm font-semibold text-brand-600 dark:text-brand-300">
                        {(partner.name || '?').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{partner.name}</p>
                        <p className="text-xs text-neutral-400 truncate">{partner.region} · {partner.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn('inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border', tierStyle)}>{partner.tier}</span>
                      <Badge variant={statusCfg?.variant || 'default'} size="sm">{statusCfg?.label || partner.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span><Clock className="w-3 h-3 inline mr-1" />{partner.years || 0}年</span>
                      {partner.winRate !== undefined && <span>赢单率 <strong className="text-neutral-700 dark:text-neutral-200">{partner.winRate}%</strong></span>}
                      {primary && <span><Phone className="w-3 h-3 inline mr-0.5" />{primary.phone || primary.mobile || '-'}</span>}
                    </div>
                    {(partner.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        {partner.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-[10px] text-neutral-500">{tag}</span>
                        ))}
                        {partner.tags.length > 3 && <span className="text-[10px] text-neutral-400">+{partner.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs text-neutral-500">显示第 {startRecord} 到 {endRecord} 条，共 {filteredPartners.length} 条</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="h-8 px-3 rounded-md text-xs font-medium border border-neutral-200 dark:border-neutral-700 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">上一页</button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="h-8 px-3 rounded-md text-xs font-medium border border-neutral-200 dark:border-neutral-700 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">下一页</button>
            </div>
          </div>
        </>
      )}

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)}
        onImport={(imported, mode) => { onImport?.(imported, mode); setShowImport(false); }} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDeletePartner}
        title="确认删除" description="删除后不可恢复，确定要删除该合作伙伴吗？" confirmLabel="删除" variant="danger" />

      {/* ── Approval Modal ── */}
      {approvePartner && (
        <Modal open={!!approvePartner} onClose={() => setApprovePartner(null)} title="批复合作伙伴" size="md">
          <p className="text-sm text-neutral-500 mb-4">请设置批复参数「{approvePartner.name}」</p>
          <div className="space-y-3">
            <Select label="等级" options={(config?.partnerTiers || ['Platinum','Gold','Silver','Registered']).map(v=>({value:v,label:v}))} value={approvalForm.tier} onChange={(e) => setApprovalForm({...approvalForm, tier: e.target.value as PartnerTier})} />
            <Select label="状态" options={(config?.partnerStatuses || ['Cooperating','Inactive','Prospective']).map(v=>({value:v,label:STATUS_CONFIG[v as PartnerStatus]?.label || v}))} value={approvalForm.status} onChange={(e) => setApprovalForm({...approvalForm, status: e.target.value as PartnerStatus})} />
            <Select label="渠道经理" options={[...internalUsers.map((u: any) => ({ value: u.name, label: `${u.name} · ${u.department || ''}` })), { value: '__custom', label: '其他（手动输入）' }]} value={approvalForm.manager} onChange={(e) => { if (e.target.value === '__custom') { const name = prompt('请输入渠道经理姓名:'); if (name) setApprovalForm({...approvalForm, manager: name}); } else setApprovalForm({...approvalForm, manager: e.target.value}); }} />
            <Input label="标签" value={approvalForm.tags} onChange={(e) => setApprovalForm({...approvalForm, tags: e.target.value})} placeholder="逗号分隔，如：医疗,ISV,信创" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setApprovePartner(null)}>取消</Button>
            <Button variant="danger" size="sm" onClick={() => { setApprovePartner(null); handleReject(approvePartner); }}><XCircle className="w-4 h-4" />驳回</Button>
            <Button variant="brand" size="sm" onClick={handleApprove}><CheckCircle2 className="w-4 h-4" />批复</Button>
          </div>
        </Modal>
      )}

      {/* Quick Peek Drawer */}
      <PartnerQuickDrawer open={!!quickPeekPartner} onClose={() => setQuickPeekPartner(null)} partner={quickPeekPartner} />

      {/* Map View */}
      <PartnerMapView open={showMap} onClose={() => setShowMap(false)} partners={partners} />

      {/* KPI Detail Modal */}
      {kpiDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setKpiDetail(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[480px] max-w-[90vw] max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">{kpiDetail.title}</h3>
              <button onClick={() => setKpiDetail(null)} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-1">
              {kpiDetail.items.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">暂无数据</p>
              ) : (
                kpiDetail.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm">
                    <span className="font-medium text-neutral-900 dark:text-white">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500">{item.extra}</span>
                      <span className="font-semibold text-neutral-900 dark:text-white">{item.value}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Sortable Table Header Component ──────────────────
const SortableTh = ({ field, label, sortField, sortDir, onClick }: {
  field: SortField; label: string; sortField: SortField; sortDir: SortDir; onClick: (f: SortField) => void;
}) => {
  const isActive = sortField === field;
  return (
    <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider group cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
      onClick={() => onClick(field)}>
      <div className="flex items-center">
        {label}
        {isActive && sortDir === 'asc' && <ArrowUp className="w-3 h-3 ml-1 text-brand" />}
        {isActive && sortDir === 'desc' && <ArrowDown className="w-3 h-3 ml-1 text-brand" />}
        {!isActive && <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />}
      </div>
    </th>
  );
};
