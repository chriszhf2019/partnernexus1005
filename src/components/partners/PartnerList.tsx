import React, { useState, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TIER_STYLES, STATUS_CONFIG } from '../../lib/partner-labels';
import { useNavigate } from 'react-router-dom';
import {
  Search, Upload, Pencil, Trash2, MapPin, Phone, CheckCircle2, XCircle, X,
  CheckSquare, RefreshCw, Users, UserCheck, Clock, Star, ArrowUpDown, ArrowUp,
  ArrowDown, LayoutGrid, LayoutList, Download, Eye, ChevronDown, ChevronRight,
  Filter as FilterIcon, Building2, Globe, TrendingUp, Award, AlertTriangle,
  Activity, Target, Shield, PieChart, BarChart3, Zap, BookOpen, Rocket,
  Lightbulb, FileText, Calendar, Bell, Info, HelpCircle, Sparkles,
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
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { partnerService } from '../../services/partner-service';
import { partnerScoring } from '../../services/partner-scoring-service';
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
type ActivePillar = 'coverage' | 'vitality' | 'capability' | 'summary';

// ── 辅助函数：安全数值格式化 ───────────────────────────────────
const safeNum = (val: number | undefined | null, fallback = 0): number => {
  if (val === undefined || val === null || isNaN(val)) return fallback;
  return val;
};

const safePercent = (val: number | undefined | null, fallback = '--'): string => {
  if (val === undefined || val === null || isNaN(val)) return fallback;
  return `${Math.round(val)}%`;
};

const safeStr = (val: number | undefined | null, fallback = '--'): string => {
  if (val === undefined || val === null || isNaN(val)) return fallback;
  return String(Math.round(val));
};

export const PartnerList = ({ partners, onSelectPartner, onImport }: PartnerListProps) => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const { user } = useAuth();
  const { partners: partnerPermissions } = usePermission();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-persisted state ──────────────────────────
  const searchFromUrl = searchParams.get('q') || searchParams.get('search') || '';
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
  const [showMap, setShowMap] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showAdvFilter, setShowAdvFilter] = useState(false); // 默认收起
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [activePillar, setActivePillar] = useState<ActivePillar>('summary');

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

  // ── 计算三大支柱指标 ───────────────────────────────
  const totalPartners = safeNum(partners.length);
  const coopCount = partners.filter(p => p.status === 'Cooperating').length;
  const wonCount = partners.filter(p => safeNum(p.winRate) > 0).length;
  const activeCount = partners.filter(p => p.status === 'Cooperating' && safeNum(p.winRate) > 0).length;
  const sleepingCount = partners.filter(p => p.status === 'Cooperating' && safeNum(p.winRate) === 0).length;
  
  // 区域分布
  const partnerRegions = useMemo(() => [...new Set(partners.map((p) => p.region).filter(Boolean))], [partners]);
  const REGION_COLORS: Record<string, string> = {
    '华东': 'bg-blue-500', '华南': 'bg-emerald-500', '华北': 'bg-purple-500',
    '华中': 'bg-orange-500', '西南': 'bg-red-500', '西北': 'bg-cyan-500', '东北': 'bg-pink-500',
  };
  const regionDistribution = useMemo(() => {
    return partnerRegions.map(r => ({
      region: r,
      count: partners.filter(p => p.region === r).length,
      color: REGION_COLORS[r] || 'bg-gray-500'
    }));
  }, [partners, partnerRegions]);
  
  // 行业分布
  const industryDistribution = useMemo(() => {
    const industries = [...new Set(partners.map(p => p.industry).filter(Boolean))];
    return industries.slice(0, 5).map(ind => ({
      industry: ind,
      count: partners.filter(p => p.industry === ind).length,
      percent: safeNum(partners.filter(p => p.industry === ind).length / totalPartners * 100)
    }));
  }, [partners, totalPartners]);
  
  // 结构比例（等级分布）
  const tierDistribution = useMemo(() => {
    const tiers = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Registered'];
    return tiers.map(t => ({
      tier: t,
      count: partners.filter(p => p.tier === t).length,
      percent: safeNum(partners.filter(p => p.tier === t).length / totalPartners * 100)
    }));
  }, [partners, totalPartners]);

  // ──────────────────────────────────────────────
  // 聚合指标（使用 partner-scoring-service 统一计算）
  // ──────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    // 从集中式评分服务获取同比/环比/激励执行率（预估）
    const growth = partnerScoring.calculateMonthlyGrowth(partners);
    // 能力达标率：基于平均赢单率（真实数据）
    const avgWinRate = partners.reduce((s, p) => s + (p.winRate || 0), 0) / Math.max(1, partners.length);
    // 认证深度：基于高等级伙伴占比（真实数据）
    const highTierCount = partners.filter(p => p.tier === 'Diamond' || p.tier === 'Platinum').length;
    return {
      monthNew: growth.monthNew,
      monthLost: growth.monthLost,
      yoyGrowth: growth.yoyGrowth,
      qoqGrowth: growth.qoqGrowth,
      incentiveExecution: growth.incentiveExecution,
      capabilityRate: Math.round(avgWinRate),
      certDepth: Math.round((highTierCount / partners.length) * 100),
    };
  }, [partners]);
  const { monthNew, monthLost } = monthlyData;
  const yoyGrowth = monthlyData.yoyGrowth !== null ? monthlyData.yoyGrowth : null;
  const qoqGrowth = monthlyData.qoqGrowth !== null ? monthlyData.qoqGrowth : null;

  // 活跃率计算
  const vitalityRate = safeNum(activeCount / Math.max(coopCount, 1) * 100);
  const marketParticipation = safeNum(partners.filter(p => p.status === 'Cooperating').length / totalPartners * 100);
  const incentiveExecution = monthlyData.incentiveExecution !== null ? monthlyData.incentiveExecution : null;
  const businessInteraction = safeNum(wonCount / Math.max(coopCount, 1) * 100);

  // 能力达标率
  const capabilityRate = monthlyData.capabilityRate !== null ? monthlyData.capabilityRate : null;
  const practiceResult = safeNum(wonCount);
  const expansionAbility = safeNum(partners.filter(p => safeNum(p.winRate) > 30).length);
  const certDepth = monthlyData.certDepth !== null ? monthlyData.certDepth : null;

  // 等级平均赢单率（基于实际数据）
  const tierWinRates = useMemo(() => {
    const tiers = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Registered'];
    return tiers.map(t => {
      const pool = partners.filter(p => p.tier === t);
      return {
        tier: t,
        avgWinRate: pool.length > 0 ? Math.round(pool.reduce((s, p) => s + safeNum(p.winRate), 0) / pool.length) : 0,
        count: pool.length,
      };
    });
  }, [partners]);
  const radarScores = useMemo(() => [
    { label: '技术能力', score: safeNum(partners.length > 0 ? Math.round(partners.reduce((s, p) => s + safeNum(p.winRate), 0) / partners.length) : 0), color: 'bg-purple-500' },
    { label: '销售能力', score: safeNum(partners.length > 0 ? Math.round(partners.filter(p => safeNum(p.winRate) > 30).length / partners.length * 100) : 0), color: 'bg-blue-500' },
    { label: '服务能力', score: safeNum(partners.length > 0 ? Math.round(partners.filter(p => p.status === 'Cooperating').length / partners.length * 100) : 0), color: 'bg-emerald-500' },
    { label: '市场能力', score: safeNum(partners.length > 0 ? Math.round(partners.filter(p => p.tier === 'Diamond' || p.tier === 'Platinum').length / partners.length * 100) : 0), color: 'bg-amber-500' },
  ], [partners]);

  // 区域需求（基于实际伙伴数量计算）
  const regionDemand = useMemo(() => Object.fromEntries(
    partnerRegions.map(r => [r, partners.filter(p => p.region === r).length])
  ), [partnerRegions, partners]);
  const coverageScore = safeNum(Math.min(100, Math.round((partnerRegions.length / Math.max(1, Object.keys(REGION_COLORS).length)) * 100)));
  const vitalityScore = safeNum(vitalityRate);
  const capabilityScore = safeNum(Math.min(100, Math.round(partners.reduce((acc, p) => acc + safeNum(p.winRate), 0) / Math.max(1, partners.length))));
  const overallHealth = safeNum(Math.round((coverageScore + vitalityScore + capabilityScore) / 3));

  // 待批复停留天数
  const now = Date.now();
  const dayMs = 86400000;
  const overduePending = useMemo(() => partners.filter(p => p.status === 'Prospective' && Math.ceil((now - new Date(p.applicationDate || p.startDate).getTime()) / dayMs) > 3).length, [partners]);

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
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
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
      if (segmentFilter === 'champion') result = result.filter(p => safeNum(p.winRate) > 50 && p.status === 'Cooperating');
      if (segmentFilter === 'dormant') result = result.filter(p => p.status === 'Cooperating' && safeNum(p.winRate) === 0);
      if (segmentFilter === 'newcomer') result = result.filter(p => p.status === 'Prospective');
      if (segmentFilter === 'rising') result = result.filter(p => p.status === 'Cooperating' && new Date(p.startDate).getTime() > Date.now() - 90*86400000);
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
          case 'winRate': av = safeNum(a.winRate); bv = safeNum(b.winRate); break;
        }
        if (typeof av === 'string' && typeof bv === 'string') {
          return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
      });
    }
    return result;
  }, [partners, deferredSearch, statusFilter, tierFilter, typeFilter, regionFilter, tab, segmentFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / ITEMS_PER_PAGE));
  const pagedPartners = filteredPartners.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const partnerTypes = useMemo(() => [...new Set(partners.map((p) => p.type))], [partners]);
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
        `${safeNum(p.winRate)}%`,
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
        const isUp = ['Registered','Silver','Gold','Platinum','Diamond'].indexOf(approvalForm.tier) > ['Registered','Silver','Gold','Platinum','Diamond'].indexOf(approvePartner.tier);
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

  // ── Tooltip 组件 ───────────────────────────────────
  const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div className="group/tip relative inline-flex">
      {children}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-3 bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-50 text-white dark:text-neutral-900 text-xs rounded-xl opacity-0 group-hover/tip:opacity-100 transition-all duration-200 ease-out transform group-hover/tip:-translate-y-1 pointer-events-none z-50 max-w-[280px] text-center shadow-2xl shadow-black/30 dark:shadow-neutral-200/50 whitespace-pre-wrap border border-neutral-700/50 dark:border-neutral-200/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-semibold text-[11px] tracking-wide uppercase opacity-80">提示</span>
        </div>
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-3 h-3 bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-50 rotate-45 border-r border-b border-neutral-700/50 dark:border-neutral-200/50"></div>
      </div>
    </div>
  );

  // ── 状态颜色语义 ───────────────────────────────────
  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'; // 绿色达标
    if (score >= 60) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'; // 橙色预警
    return 'text-red-600 bg-red-50 dark:bg-red-900/20'; // 红色严重偏离
  };

  const getTrendIcon = (value: number) => {
    if (value > 5) return <ArrowUp className="w-3 h-3 text-emerald-500" />;
    if (value < -5) return <ArrowDown className="w-3 h-3 text-red-500" />;
    return <span className="w-3 h-3 text-blue-500">—</span>; // 蓝色稳定
  };

  return (
    <div className="space-y-6">
      {/* ═════════════════════════════════════════════════════════════════════════════════════════════════ */}
      {/* 第一部分：展示层（战略看板 - 三大支柱） */}
      {/* ═════════════════════════════════════════════════════════════════════════════════════════════════ */}
      
      {/* ── 顶部：综合健康度状态条 ───────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-white">生态健康度</span>
            </div>
            <div className="flex items-center gap-6">
              <Tooltip content="覆盖决定了生意的上限。诊断区域分布、行业渗透和空白市场，指导招商策略。">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePillar('coverage')}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(coverageScore)}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">覆盖</p>
                    <p className="text-lg font-bold text-white">{safeStr(coverageScore)}</p>
                  </div>
                </div>
              </Tooltip>
              <Tooltip content="活跃决定了过程。诊断伙伴的参与深度，识别「僵尸伙伴」和「超级贡献者」。">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePillar('vitality')}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(vitalityScore)}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">活跃</p>
                    <p className="text-lg font-bold text-white">{safeStr(vitalityScore)}</p>
                  </div>
                </div>
              </Tooltip>
              <Tooltip content="能效决定了利润。诊断投入产出比，识别「高投入低产出」和「低资源高成长」伙伴。">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePillar('capability')}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(capabilityScore)}`}>
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">能力</p>
                    <p className="text-lg font-bold text-white">{safeStr(capabilityScore)}</p>
                  </div>
                </div>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-neutral-400">综合评分</p>
              <p className="text-2xl font-extrabold text-amber-400">{safeStr(overallHealth)}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(overallHealth)}`}>
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
        {/* 进度条 */}
        <div className="mt-3 h-2 bg-neutral-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500 rounded-full transition-all" style={{ width: `${overallHealth}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-neutral-400">
          <span>覆盖 {safeStr(coverageScore)} · 活跃 {safeStr(vitalityScore)} · 能力 {safeStr(capabilityScore)}</span>
          <span>{totalPartners} 家伙伴 · {pendingCount} 待批复 · {sleepingCount} 沉睡</span>
        </div>
      </div>

      {/* ── 三大支柱大卡片 ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* 覆盖大卡片 (Coverage Card) */}
        <div 
          className={cn(
            "bg-white dark:bg-neutral-900 rounded-2xl border-2 p-5 shadow-card hover:shadow-lg transition-all cursor-pointer",
            activePillar === 'coverage' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-neutral-200 dark:border-neutral-700'
          )}
          onClick={() => setActivePillar('coverage')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">覆盖健康</p>
                <p className="text-xs text-neutral-500">伙伴总数与分布</p>
              </div>
            </div>
            <Tooltip content="覆盖决定了生意的上限。诊断区域分布、行业渗透和空白市场，指导招商策略。">
              <Info className="w-4 h-4 text-neutral-400" />
            </Tooltip>
          </div>
          
          {/* 核心数字 */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <p className="text-3xl font-extrabold text-blue-600">{safeStr(totalPartners)}</p>
              <div className="flex flex-col text-xs">
                <span className="text-emerald-600 flex items-center gap-1">
                  {getTrendIcon(monthNew)}
                  +{monthNew} 本月
                </span>
                <span className="text-red-600 flex items-center gap-1">
                  {getTrendIcon(-monthLost)}
                  -{monthLost} 本月
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                同比(预估) {yoyGrowth !== null ? getTrendIcon(yoyGrowth) : <span className="w-3 h-3 text-blue-500">—</span>}
                <span className={yoyGrowth !== null && yoyGrowth > 0 ? 'text-emerald-600' : yoyGrowth !== null && yoyGrowth < 0 ? 'text-red-600' : 'text-neutral-400'}>
                  {yoyGrowth !== null ? `${yoyGrowth > 0 ? '+' : ''}${safeStr(yoyGrowth)}%` : '--'}
                </span>
              </span>
              <span className="flex items-center gap-1">
                环比(预估) {qoqGrowth !== null ? getTrendIcon(qoqGrowth) : <span className="w-3 h-3 text-blue-500">—</span>}
                <span className={qoqGrowth !== null && qoqGrowth > 0 ? 'text-emerald-600' : qoqGrowth !== null && qoqGrowth < 0 ? 'text-red-600' : 'text-neutral-400'}>
                  {qoqGrowth !== null ? `${qoqGrowth > 0 ? '+' : ''}${safeStr(qoqGrowth)}%` : '--'}
                </span>
              </span>
            </div>
          </div>

          {/* 子维度图表 */}
          <div className="space-y-3">
            {/* 区域分布（5大区对比条形图） */}
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">区域分布</p>
              <div className="space-y-1.5">
                {regionDistribution.map(r => (
                  <div key={r.region} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 w-8">{r.region}</span>
                    <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                      <div className={`h-full ${r.color} rounded transition-all`} style={{ width: `${safeNum(r.count / Math.max(totalPartners, 1) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 w-6 text-right">{safeStr(r.count)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 行业分布（环形图模拟） */}
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">行业分布</p>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-neutral-200 dark:border-neutral-700" />
                  {industryDistribution.slice(0, 3).map((ind, i) => (
                    <div 
                      key={ind.industry}
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: `4px solid ${i === 0 ? '#3b82f6' : i === 1 ? '#10b981' : '#f59e0b'}`,
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + (ind.percent || 0) / 2}% 0%, ${50 + (ind.percent || 0) / 2}% 100%, 50% 100%)`,
                        transform: `rotate(${i * 60}deg)`
                      }}
                    />
                  ))}
                </div>
                <div className="flex-1 space-y-1">
                  {industryDistribution.slice(0, 4).map(ind => (
                    <div key={ind.industry} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600 dark:text-neutral-400 truncate">{ind.industry}</span>
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">{safePercent(ind.percent)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 结构比例（堆叠进度条） */}
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">等级结构</p>
              <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden flex">
                {tierDistribution.filter(t => t.count > 0).map((t, i) => (
                  <div 
                    key={t.tier}
                    className={cn(
                      "h-full flex items-center justify-center text-xs font-medium text-white",
                      i === 0 ? 'bg-purple-600' : i === 1 ? 'bg-indigo-500' : i === 2 ? 'bg-blue-500' : i === 3 ? 'bg-cyan-500' : 'bg-neutral-400'
                    )}
                    style={{ width: `${safeNum(t.percent)}%` }}
                  >
                    {t.percent > 10 ? t.tier : ''}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1 text-xs text-neutral-400">
                {tierDistribution.filter(t => t.count > 0).map(t => (
                  <span key={t.tier}>{t.tier}: {safeStr(t.count)}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 详情按钮 */}
          <button 
            onClick={(e) => { e.stopPropagation(); navigate('/detail/partners-coverage'); }}
            className="mt-4 w-full py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1"
          >
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* 活跃度大卡片 (Vitality Card) */}
        <div 
          className={cn(
            "bg-white dark:bg-neutral-900 rounded-2xl border-2 p-5 shadow-card hover:shadow-lg transition-all cursor-pointer",
            activePillar === 'vitality' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-neutral-200 dark:border-neutral-700'
          )}
          onClick={() => setActivePillar('vitality')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">活跃健康</p>
                <p className="text-xs text-neutral-500">近30天活跃率</p>
              </div>
            </div>
            <Tooltip content="活跃决定了过程。诊断伙伴的参与深度，识别「僵尸伙伴」和「超级贡献者」。">
              <Info className="w-4 h-4 text-neutral-400" />
            </Tooltip>
          </div>
          
          {/* 核心数字 */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <p className="text-3xl font-extrabold text-emerald-600">{safePercent(vitalityRate)}</p>
              <div className="flex flex-col text-xs">
                <span className="text-emerald-600">{activeCount} 家活跃</span>
                <span className="text-amber-600">{sleepingCount} 家沉睡</span>
              </div>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${vitalityRate}%` }} />
            </div>
          </div>

          {/* 子维度指标 */}
          <div className="grid grid-cols-3 gap-3">
            <Tooltip content="市场参与度：参与市场活动、报备商机的伙伴比例">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
                <BarChart3 className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-neutral-500">市场参与</p>
                <p className="text-lg font-bold text-blue-600">{safePercent(marketParticipation)}</p>
              </div>
            </Tooltip>
            <Tooltip content="激励执行率(预估)：基于MDF使用率、认证工程师占比和市场活动参与度综合推算">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg text-center">
                <Award className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-neutral-500">激励执行(预估)</p>
                <p className="text-lg font-bold text-purple-600">{incentiveExecution !== null ? `${incentiveExecution}%` : '--'}</p>
              </div>
            </Tooltip>
            <Tooltip content="业务互动率：有商机报备或成交记录的伙伴比例">
              <div className="p-3 bg-cyan-50 dark:bg-cyan-900/10 rounded-lg text-center">
                <TrendingUp className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
                <p className="text-xs text-neutral-500">业务互动</p>
                <p className="text-lg font-bold text-cyan-600">{safePercent(businessInteraction)}</p>
              </div>
            </Tooltip>
          </div>

          {/* 活跃度漏斗 */}
          <div className="mt-4">
            <p className="text-xs font-medium text-neutral-500 mb-2">参与度漏斗</p>
            <div className="space-y-1">
              {[
                { label: '注册伙伴', count: totalPartners, color: 'bg-neutral-300' },
                { label: '合作中', count: coopCount, color: 'bg-blue-400' },
                { label: '有商机', count: wonCount, color: 'bg-emerald-500' },
                { label: '高产出(≥50%)', count: partners.filter(p => safeNum(p.winRate) >= 50).length, color: 'bg-purple-600' },
              ].map((stage, i) => (
                <div key={stage.label} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 w-16">{stage.label}</span>
                  <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} rounded`}
                      style={{ width: `${safeNum(stage.count / Math.max(totalPartners, 1) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 w-6 text-right">{safeStr(stage.count)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 详情按钮 */}
          <button 
            onClick={(e) => { e.stopPropagation(); navigate('/detail/partners-active'); }}
            className="mt-4 w-full py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-1"
          >
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* 能力大卡片 (Capability Card) */}
        <div 
          className={cn(
            "bg-white dark:bg-neutral-900 rounded-2xl border-2 p-5 shadow-card hover:shadow-lg transition-all cursor-pointer",
            activePillar === 'capability' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-neutral-200 dark:border-neutral-700'
          )}
          onClick={() => setActivePillar('capability')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">能力健康</p>
                <p className="text-xs text-neutral-500">能力达标率</p>
              </div>
            </div>
            <Tooltip content="能效决定了利润。诊断投入产出比，识别「高投入低产出」和「低资源高成长」伙伴。">
              <Info className="w-4 h-4 text-neutral-400" />
            </Tooltip>
          </div>
          
          {/* 核心数字 */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <p className="text-3xl font-extrabold text-purple-600">{safePercent(capabilityRate)}</p>
              <div className="flex flex-col text-xs">
                <span className="text-emerald-600">{practiceResult} 家实战成果</span>
                <span className="text-blue-600">{certDepth !== null ? `${certDepth}%` : '--'} 认证深度</span>
              </div>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${capabilityRate !== null ? capabilityRate : 0}%` }} />
            </div>
          </div>

          {/* 子维度指标 */}
          <div className="grid grid-cols-3 gap-3">
            <Tooltip content="实战成果：有成功交付项目经验的伙伴数量">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg text-center">
                <Star className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs text-neutral-500">实战成果</p>
                <p className="text-lg font-bold text-emerald-600">{safeStr(practiceResult)}</p>
              </div>
            </Tooltip>
            <Tooltip content="拓新能力：赢单率超过30%的伙伴数量">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
                <Rocket className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-neutral-500">拓新能力</p>
                <p className="text-lg font-bold text-blue-600">{safeStr(expansionAbility)}</p>
              </div>
            </Tooltip>
            <Tooltip content="认证深度：技术人员认证覆盖率">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-center">
                <BookOpen className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <p className="text-xs text-neutral-500">认证深度</p>
                <p className="text-lg font-bold text-amber-600">{safePercent(certDepth)}</p>
              </div>
            </Tooltip>
          </div>

          {/* 能力雷达图模拟 */}
          <div className="mt-4">
            <p className="text-xs font-medium text-neutral-500 mb-2">能力雷达</p>
            <div className="grid grid-cols-2 gap-2">
              {radarScores.map(cap => (
                <div key={cap.label} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 w-16">{cap.label}</span>
                  <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                    <div className={`h-full ${cap.color} rounded`} style={{ width: `${cap.score}%` }} />
                  </div>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{safeStr(cap.score)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 详情按钮 */}
          <button 
            onClick={(e) => { e.stopPropagation(); navigate('/detail/partners-efficiency'); }}
            className="mt-4 w-full py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-1"
          >
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════════════════════════════ */}
      {/* 第二部分：诊断层（智能分析区） */}
      {/* ═════════════════════════════════════════════════════════════════════════════════════════════════ */}
      
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">智能诊断区</h3>
            <Badge variant={activePillar === 'summary' ? 'brand' : 'default'} size="sm">
              {activePillar === 'coverage' ? '覆盖诊断' : activePillar === 'vitality' ? '活跃诊断' : activePillar === 'capability' ? '能力诊断' : '综合预警'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {(['summary', 'coverage', 'vitality', 'capability'] as ActivePillar[]).map(p => (
              <button
                key={p}
                onClick={() => setActivePillar(p)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  activePillar === p ? 'bg-brand text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {p === 'summary' ? '综合' : p === 'coverage' ? '覆盖' : p === 'vitality' ? '活跃' : '能力'}
              </button>
            ))}
          </div>
        </div>

        {/* 动态诊断内容 */}
        <div className="min-h-[200px]">
          {activePillar === 'summary' && (
            <div className="space-y-4">
              {/* 综合预警报告 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    type: 'warning', 
                    icon: AlertTriangle, 
                    title: '待批复超时预警', 
                    desc: `${overduePending} 家伙伴超过3天未批复，影响入驻体验`,
                    action: '立即处理',
                    onClick: () => setTab('pending'),
                    color: 'border-amber-300 bg-amber-50 dark:bg-amber-900/10'
                  },
                  { 
                    type: 'danger', 
                    icon: XCircle, 
                    title: '沉睡伙伴预警', 
                    desc: `${sleepingCount} 家合作中伙伴无商机产出，存在流失风险`,
                    action: '制定唤醒计划',
                    onClick: () => { setStatusFilter('Cooperating'); setSegmentFilter('dormant'); },
                    color: 'border-red-300 bg-red-50 dark:bg-red-900/10'
                  },
                  { 
                    type: 'success', 
                    icon: CheckCircle2, 
                    title: '高产出伙伴', 
                    desc: `${partners.filter(p => safeNum(p.winRate) >= 50).length} 家伙伴赢单率≥50%，建议重点扶持`,
                    action: '查看名单',
                    onClick: () => setSegmentFilter('champion'),
                    color: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10'
                  },
                ].map(alert => (
                  <div key={alert.title} className={`p-4 rounded-xl border-2 ${alert.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <alert.icon className={cn('w-4 h-4', alert.type === 'warning' ? 'text-amber-600' : alert.type === 'danger' ? 'text-red-600' : 'text-emerald-600')} />
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white">{alert.title}</span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">{alert.desc}</p>
                    <button 
                      onClick={alert.onClick}
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      {alert.action} →
                    </button>
                  </div>
                ))}
              </div>
              
              {/* 生态摘要 */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <h4 className="text-xs font-semibold text-neutral-500 mb-3">📋 生态健康摘要</h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-extrabold text-blue-600">{safeStr(totalPartners)}</p>
                    <p className="text-xs text-neutral-400">伙伴总数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-emerald-600">{safeStr(coopCount)}</p>
                    <p className="text-xs text-neutral-400">合作中</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-amber-600">{safeStr(pendingCount)}</p>
                    <p className="text-xs text-neutral-400">待批复</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-purple-600">{safeStr(wonCount)}</p>
                    <p className="text-xs text-neutral-400">有赢单</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePillar === 'coverage' && (
            <div className="space-y-4">
              {/* 供需错配图 */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  区域供需错配分析
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  {regionDistribution.map(rd => {
                    const count = rd.count;
                    const demand = regionDemand[rd.region]; // 模拟需求
                    const gap = demand - count;
                    return (
                      <Tooltip key={rd.region} content={`${rd.region}: 现有${count}家，需求${demand}家，缺口${Math.max(0, gap)}家`}>
                        <div className="text-center p-2 bg-white dark:bg-neutral-800 rounded-lg">
                          <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{rd.region}</p>
                          <p className="text-lg font-bold text-blue-600">{safeStr(count)}</p>
                          <p className="text-xs text-neutral-400">需求 {demand}</p>
                          <div className={cn('mt-1 text-xs font-medium', gap > 5 ? 'text-red-600' : gap > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                            {gap > 0 ? `缺口 ${gap}` : '满足'}
                          </div>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
              
              {/* 空白市场 */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <h4 className="text-xs font-semibold text-neutral-500 mb-2">空白市场机会</h4>
                <div className="flex flex-wrap gap-2">
                  {REGION_COLORS && Object.keys(REGION_COLORS).filter(r => !partnerRegions.includes(r)).slice(0, 3).map(r => (
                    <span key={r} className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                      {r} 未覆盖
                    </span>
                  ))}
                  {Object.keys(REGION_COLORS).every(r => partnerRegions.includes(r)) && (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
                      主要区域全覆盖 ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activePillar === 'vitality' && (
            <div className="space-y-4">
              {/* 参与度漏斗 */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <h4 className="text-xs font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  参与度漏斗分析
                </h4>
                <div className="relative h-48">
                  {/* 漏斗可视化 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {[
                      { label: '全部伙伴', count: totalPartners, width: 100, color: 'bg-neutral-300' },
                      { label: '合作中', count: coopCount, width: 80, color: 'bg-blue-400' },
                      { label: '有商机报备', count: wonCount, width: 60, color: 'bg-emerald-500' },
                      { label: '高产出(≥50%)', count: partners.filter(p => safeNum(p.winRate) >= 50).length, width: 40, color: 'bg-purple-600' },
                    ].map((stage, i) => (
                      <div 
                        key={stage.label}
                        className={cn('h-10 rounded-lg flex items-center justify-center text-xs font-medium text-white mb-1', stage.color)}
                        style={{ width: `${stage.width}%` }}
                      >
                        {stage.label}: {safeStr(stage.count)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 text-xs text-neutral-600 dark:text-neutral-400">
                  转化率: 合作中 → 有商机 {safePercent(wonCount / Math.max(coopCount, 1) * 100)} | 有商机 → 高产出 {safePercent(partners.filter(p => safeNum(p.winRate) >= 50).length / Math.max(wonCount, 1) * 100)}
                </div>
              </div>
            </div>
          )}

          {activePillar === 'capability' && (
            <div className="space-y-4">
              {/* 案例与产出相关性 */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
                <h4 className="text-xs font-semibold text-purple-700 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  能力与产出相关性
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tierWinRates.filter(t => t.count > 0).map(t => (
                    <Tooltip key={t.tier} content={`${t.tier}级伙伴平均赢单率${t.avgWinRate}%，共${t.count}家`}>
                      <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg text-center">
                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{t.tier}</p>
                        <p className="text-lg font-bold text-purple-600">{safeStr(t.avgWinRate)}%</p>
                        <p className="text-xs text-neutral-400">{safeStr(t.count)} 家</p>
                      </div>
                    </Tooltip>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-white dark:bg-neutral-800 rounded-lg">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    💡 发现: 高等级伙伴平均赢单率更高，建议加强低等级伙伴的能力赋能。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════════════════════════════ */}
      {/* 第三部分：执行层（任务化行动中心） */}
      {/* ═════════════════════════════════════════════════════════════════════════════════════════════════ */}
      
      <div className="bg-gradient-to-r from-brand-50 via-blue-50 to-purple-50 dark:from-brand-900/10 dark:via-blue-900/10 dark:to-purple-900/10 rounded-2xl border border-brand-200 dark:border-brand-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-brand" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">行动中心</h3>
            <Badge variant="brand" size="sm">{pendingCount + sleepingCount} 项待办</Badge>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} disabled={refreshing} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-700 hover:bg-white/50 transition-colors disabled:opacity-50">
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />刷新
            </button>
          </div>
        </div>

        {/* 任务卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 招募任务 */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">招募任务</p>
                <p className="text-xs text-neutral-500">新伙伴入驻</p>
              </div>
              {pendingCount > 0 && (
                <Badge variant="warning" size="sm" className="ml-auto">{pendingCount} 待批</Badge>
              )}
            </div>
            <div className="space-y-2 mb-3">
              {pendingCount > 0 ? (
                partners.filter(p => p.status === 'Prospective').slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-neutral-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-neutral-400">{p.tier} · 等待{Math.ceil((now - new Date(p.applicationDate || p.startDate).getTime()) / dayMs)}天</p>
                    </div>
                    <button 
                      onClick={() => { setApprovePartner(p); setApprovalForm({ tier: 'Gold' as PartnerTier, status: 'Cooperating' as PartnerStatus, tags: '', manager: '' }); }}
                      className="text-xs text-brand hover:underline"
                    >
                      批复 →
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 text-center py-2">暂无待批复申请</p>
              )}
            </div>
            <button 
              onClick={() => setTab('pending')}
              className="w-full py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              {pendingCount > 0 ? `处理全部 ${pendingCount} 条` : '查看招募状态'}
            </button>
          </div>

          {/* 激励任务 */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">激励任务</p>
                <p className="text-xs text-neutral-500">唤醒沉睡伙伴</p>
              </div>
              {sleepingCount > 0 && (
                <Badge variant="danger" size="sm" className="ml-auto">{sleepingCount} 沉睡</Badge>
              )}
            </div>
            <div className="space-y-2 mb-3">
              {sleepingCount > 0 ? (
                partners.filter(p => p.status === 'Cooperating' && safeNum(p.winRate) === 0).slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-neutral-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-neutral-400">{p.region} · {p.manager || '无经理'}</p>
                    </div>
                    <button 
                      onClick={() => onSelectPartner(p.id)}
                      className="text-xs text-purple-600 hover:underline"
                    >
                      诊断 →
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 text-center py-2">所有伙伴均有产出 ✓</p>
              )}
            </div>
            <button 
              onClick={() => { setStatusFilter('Cooperating'); setSegmentFilter('dormant'); }}
              className="w-full py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-xs font-medium hover:bg-purple-100 transition-colors"
            >
              {sleepingCount > 0 ? `制定唤醒计划` : '查看激励状态'}
            </button>
          </div>

          {/* 赋能任务 */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">赋能任务</p>
                <p className="text-xs text-neutral-500">能力提升计划</p>
              </div>
              <Badge variant="success" size="sm" className="ml-auto">{partners.filter(p => safeNum(p.winRate) >= 50).length} 高产出</Badge>
            </div>
            <div className="space-y-2 mb-3">
              {partners.filter(p => safeNum(p.winRate) >= 50).slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-neutral-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-neutral-400">{p.tier} · 赢单率{safeNum(p.winRate)}%</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/partners/${p.id}`)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    详情 →
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setSegmentFilter('champion')}
              className="w-full py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition-colors"
            >
              查看高产出名单
            </button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════════════════════════════ */}
      {/* 页面头部工具栏 */}
      {/* ═════════════════════════════════════════════════════════════════════════════════════════════════ */}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" placeholder="搜索名称/区域/类型/级别/联系人..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-64 h-9 pl-9 pr-8 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand dark:text-white transition-all" />
            {deferredSearch && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[10px] text-brand font-medium">{filteredPartners.length} 结果</span>
                <button onClick={() => { setSearchTerm(''); setPage(1); }} className="text-neutral-400 hover:text-neutral-600"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
          
          {/* 分段筛选 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'all', label: '全部', count: partners.length },
              { key: 'champion', label: '🏆 高产出', count: partners.filter(p=>safeNum(p.winRate)>50&&p.status==='Cooperating').length },
              { key: 'dormant', label: '💤 沉睡', count: sleepingCount },
              { key: 'newcomer', label: '🆕 新进', count: pendingCount },
              { key: 'rising', label: '📈 上升', count: partners.filter(p=>p.status==='Cooperating'&&new Date(p.startDate).getTime()>Date.now()-90*86400000).length },
            ].map(seg => (
              <Tooltip key={seg.key} content={
                seg.key === 'all' ? '显示全部合作伙伴' :
                seg.key === 'champion' ? '赢单率超过 50% 的活跃伙伴' :
                seg.key === 'dormant' ? '合作中但无商机产出的伙伴' :
                seg.key === 'newcomer' ? '待审核的新伙伴' :
                '近 90 天内新加入的伙伴'
              }>
                <button 
                  onClick={() => { setSegmentFilter(seg.key); setPage(1); }}
                  className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                    segmentFilter === seg.key ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900' : 'bg-white dark:bg-neutral-800 text-neutral-500 border-neutral-200 hover:border-neutral-400')}
                >
                  {seg.label} <span className="ml-0.5 opacity-60">{seg.count}</span>
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 高级筛选按钮 */}
          <button 
            onClick={() => setShowAdvFilter(!showAdvFilter)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <FilterIcon className="w-3.5 h-3.5" />
            高级筛选
            {showAdvFilter ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          
          <button onClick={exportCSV} className="h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors">
            <Download className="w-3.5 h-3.5" />导出
          </button>
          <Button variant="secondary" size="md" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4" /> 导入
          </Button>
          <Button variant="brand" size="md" onClick={() => navigate('/partners/new')}>
            {t('partners.add')}
          </Button>
        </div>
      </div>

      {/* 高级筛选工具栏（默认收起） */}
      {showAdvFilter && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-top-2 duration-200">
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
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">区域</span>
            <select className="h-8 px-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand"
              value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
              disabled={tab === 'pending'}>
              <option value="All">全部</option>
              {partnerRegions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {(statusFilter !== 'All' || tierFilter !== 'All' || typeFilter !== 'All' || regionFilter !== 'All') && (
            <button onClick={() => { setStatusFilter('All'); setTierFilter('All'); setTypeFilter('All'); setRegionFilter('All'); setPage(1); }} className="text-[10px] text-blue-500 hover:underline ml-1">清除筛选</button>
          )}
          <span className="ml-auto text-xs text-neutral-400">{filteredPartners.length} 条结果</span>
        </div>
      )}

      {/* ═══════════ Tabs + View Toggle ═══════════ */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
          <button onClick={() => { setTab('all'); setPage(1); }} className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all', tab === 'all' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500')}>{t('partners.allTab')}</button>
          <button onClick={() => { setTab('pending'); setPage(1); }} className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all', tab === 'pending' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500')}>{t('partners.pending')} {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px]">{pendingCount}</span>}</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode('table')} className={cn('p-1.5 rounded-md transition-all', viewMode === 'table' ? 'bg-white dark:bg-neutral-700 shadow-sm' : '')}><LayoutList className="w-4 h-4 text-neutral-500" /></button>
            <button onClick={() => setShowMap(true)} className={cn('p-1.5 rounded-md transition-all hover:bg-neutral-100', showMap ? 'bg-white dark:bg-neutral-700 shadow-sm' : '')} title="区域地图视图"><MapPin className="w-4 h-4 text-neutral-500" /></button>
            <button onClick={() => setViewMode('card')} className={cn('p-1.5 rounded-md transition-all', viewMode === 'card' ? 'bg-white dark:bg-neutral-700 shadow-sm' : '')}><LayoutGrid className="w-4 h-4 text-neutral-500" /></button>
          </div>
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
                                    {partner.winRate !== undefined && <span className="ml-2">· {safeNum(partner.winRate)}%</span>}
                                  </p>
                                </div>
                                {isPreview ? <ChevronDown className="w-4 h-4 text-brand ml-1" /> : <ChevronRight className="w-4 h-4 text-neutral-300 ml-1" />}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{partner.type}</td>
                            <td className="px-6 py-4"><span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium border', tierStyle)}>{partner.tier}</span></td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1 max-w-[140px]">
                                {partner.industry ? (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded" title={`行业: ${partner.industry}`}>{partner.industry}</span>
                                ) : (
                                  <span className="text-xs text-neutral-400">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-neutral-400">暂无数据</span>
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
                          {isPreview && (
                            <tr key={`${partner.id}-preview`}>
                              <td colSpan={canEdit && tab === 'pending' ? 8 : 7} className="px-6 py-4 bg-blue-50/30 dark:bg-blue-900/5 border-b border-blue-100 dark:border-blue-800/30">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                    <p className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">合作年限</p>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">{safeNum(partner.years)} 年</p>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                    <p className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">赢单率</p>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">{safeNum(partner.winRate)}%</p>
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
                    className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-card hover:shadow-lg hover:border-brand/30 transition-all">
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
                      <span><Clock className="w-3 h-3 inline mr-1" />{safeNum(partner.years)}年</span>
                      {partner.winRate !== undefined && <span>赢单率 <strong className="text-neutral-700 dark:text-neutral-200">{safeNum(partner.winRate)}%</strong></span>}
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
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <button
                        onClick={() => onSelectPartner(partner.id)}
                        className="flex-1 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        快速操作
                      </button>
                      <button
                        onClick={() => window.open(`/partners/${partner.id}`, '_blank')}
                        className="flex-1 text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
                        查看详情
                      </button>
                    </div>
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