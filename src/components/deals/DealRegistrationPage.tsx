import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, ChevronRight, CheckCircle2, Clock,
  XCircle, AlertCircle, Calendar, User, MapPin, MoreHorizontal,
  ArrowRight, Zap, TrendingUp, DollarSign, Target, BarChart3,
  Layers, ArrowUpRight, ArrowDownRight, Download, ExternalLink, GitBranch,
  Eye, Edit2, Trash2, Copy, Bell, BellRing, ChevronDown, ChevronUp,
  MessageSquare, Users, CalendarDays, Flag, Timer, AlertTriangle,
  Phone, Mail, ListTodo, RefreshCw, Send, Share2, Star, Bookmark,
  Filter, Layout, ChevronLeft, Award, Clock8, Handshake, Sparkles,
  BarChart2, PieChart, Settings, TrendingDown, X,
} from 'lucide-react';
import { InlineEdit } from './components/InlineEdit';
import { WinLossPanel } from './components/WinLossPanel';
import { RuleEnginePanel } from './components/RuleEnginePanel';
import { PresetFilterBar } from './components/PresetFilterBar';
import { cn, formatCurrency } from '../../lib/utils';
import { Deal, DealRegistrationStats, DealStatus, DealLifecycleStage, DealSource, DealConflict, DealStageProbability, WinLossReason } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';

interface SavedView {
  id: string;
  name: string;
  filters: {
    region: string;
    stage: string;
    productType: string;
    partnerType: string;
    source: string;
    search: string;
  };
}

interface PartnerRecommendation {
  id: string;
  name: string;
  tier: string;
  winRate: number;
  currentLoad: number;
  matchScore: number;
  capabilities: string[];
}


interface DealRegistrationPageProps {
  stats: DealRegistrationStats;
  deals: Deal[];
  onNewDeal: () => void;
  onDealUpdate?: (updatedDeal: Deal) => void;
  onDealDelete?: (dealId: string) => void;
}

// 阶段概率配置 - 每个阶段的成交概率和平均周期
const STAGE_PROBABILITIES: Record<DealLifecycleStage, DealStageProbability> = {
  'Registered':    { stage: 'Registered', probability: 10, avgCycleDays: 3 },
  'UnderReview':  { stage: 'UnderReview', probability: 20, avgCycleDays: 5 },
  'Approved':     { stage: 'Approved', probability: 35, avgCycleDays: 7 },
  'Solution':     { stage: 'Solution', probability: 50, avgCycleDays: 14 },
  'Commercial':   { stage: 'Commercial', probability: 80, avgCycleDays: 21 },
  'ClosedWon':    { stage: 'ClosedWon', probability: 100, avgCycleDays: 0 },
  'ClosedLost':   { stage: 'ClosedLost', probability: 0, avgCycleDays: 0 },
};

const STAGE_CONFIG: Record<DealLifecycleStage, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  'Registered':    { label: '已报备', color: 'text-neutral-700', bgColor: 'bg-neutral-100 dark:bg-neutral-800', icon: FileText },
  'UnderReview':  { label: '审批中', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', icon: Clock },
  'Approved':     { label: '已批复', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  'Solution':     { label: '方案跟进', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', icon: Target },
  'Commercial':   { label: '商务洽谈', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', icon: DollarSign },
  'ClosedWon':    { label: '赢单', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', icon: TrendingUp },
  'ClosedLost':   { label: '丢单', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
};

const SOURCE_CONFIG: Record<DealSource, { label: string; icon: typeof Zap }> = {
  'PartnerInitiated':  { label: '伙伴自主报备', icon: User },
  'ChannelAssigned':   { label: '渠道经理指派', icon: ArrowRight },
  'MDFCampaign':       { label: 'MDF活动转化', icon: Zap },
  'MarketingEvent':    { label: '市场活动', icon: BarChart3 },
  'IncentiveProgram':  { label: '激励计划', icon: TrendingUp },
  'Referral':          { label: '客户推荐', icon: ExternalLink },
};

const getStatusConfig = (t: (k: string) => string): Record<DealStatus, { label: string; variant: 'info' | 'success' | 'danger' | 'warning' | 'default' }> => ({
  Pending:     { label: t('deals.statusPending'), variant: 'info' },
  Approved:    { label: t('deals.statusApproved'), variant: 'success' },
  Rejected:    { label: t('deals.statusRejected'), variant: 'danger' },
  Converted:   { label: t('deals.statusConverted'), variant: 'warning' },
  'Closed Won':  { label: t('deals.statusClosedWon'), variant: 'success' },
  'Closed Lost': { label: t('deals.statusClosedLost'), variant: 'default' },
});

const STATUS_ICON: Record<DealStatus, typeof Clock> = {
  Pending: Clock, Approved: CheckCircle2, Rejected: XCircle,
  Converted: Zap, 'Closed Won': CheckCircle2, 'Closed Lost': XCircle,
};

const CONFLICT_TYPE_LABELS: Record<string, string> = {
  'SameCustomerSameProduct': '同客户同产品',
  'SameCustomerSimilarProject': '同客户相似项目',
  'MultiPartnerSameDeal': '多伙伴同一商机',
};

export const DealRegistrationPage = ({ stats, deals, onNewDeal, onDealUpdate, onDealDelete }: DealRegistrationPageProps) => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'conflicts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<DealConflict | null>(null);
  const [conflicts, setConflicts] = useState<DealConflict[]>([]);
  const [conflictsLoading, setConflictsLoading] = useState(true);
  const [filters, setFilters] = useState({ region: 'All', stage: 'All' as string, productType: 'All' as string, partnerType: 'All' as string, source: 'All' as string });
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hoveredDeal, setHoveredDeal] = useState<Deal | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [metricDetail, setMetricDetail] = useState<string | null>(null);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [newActivityContent, setNewActivityContent] = useState('');
  
  const [showWinLossModal, setShowWinLossModal] = useState(false);
  const [winLossReason, setWinLossReason] = useState<WinLossReason>('Other');
  const [winLossDescription, setWinLossDescription] = useState('');
  const [winLossCompetitor, setWinLossCompetitor] = useState('');
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningDeal, setAssigningDeal] = useState<Deal | null>(null);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingDeal, setExtendingDeal] = useState<Deal | null>(null);
  const [extendReason, setExtendReason] = useState('');

  // Fetch deal conflicts from Supabase
  useEffect(() => {
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('deal_conflicts').select('*').then(({ data }) => {
        if (data) setConflicts(data.map((c: any) => ({
          id: c.id,
          type: c.type,
          dealIds: c.deal_ids || [],
          description: c.description || '',
          status: c.status || 'Pending',
          resolution: c.resolution,
          resolvedBy: c.resolved_by,
          resolvedDate: c.resolved_date,
          createdDate: c.created_date || '',
          protectionPeriodDays: c.protection_period_days || 90,
          firstReportedDealId: c.first_reported_deal_id,
        })));
        setConflictsLoading(false);
      }, () => setConflictsLoading(false));
    });
  }, []);
  
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    { id: 'v1', name: '本周待审批', filters: { region: 'All', stage: 'UnderReview', productType: 'All', partnerType: 'All', source: 'All', search: '' } },
    { id: 'v2', name: '逾期未更新', filters: { region: 'All', stage: 'All', productType: 'All', partnerType: 'All', source: 'All', search: '' } },
    { id: 'v3', name: '金额大于100万', filters: { region: 'All', stage: 'All', productType: 'All', partnerType: 'All', source: 'All', search: '' } },
  ]);
  const [showViewManager, setShowViewManager] = useState(false);
  const [currentViewName, setCurrentViewName] = useState('');
  
  const [showPreviewPopover, setShowPreviewPopover] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  // New panels
  const [showWinLossPanel, setShowWinLossPanel] = useState(false);
  const [showRuleEngine, setShowRuleEngine] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // 计算加权管线金额
  const calculateWeightedValue = (deal: Deal): number => {
    const probability = STAGE_PROBABILITIES[deal.stage]?.probability || 0;
    return Math.round(deal.value * probability / 100);
  };

  const filteredDeals = useMemo(() => deals.filter((deal) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = !s || deal.title.toLowerCase().includes(s) || deal.customerName.toLowerCase().includes(s) || deal.partnerName.toLowerCase().includes(s);
    const matchesTab = activeTab === 'all' || (activeTab === 'pending' && deal.stage === 'UnderReview') || (activeTab === 'conflicts' && deal.hasConflict);
    const matchesRegion = filters.region === 'All' || deal.region === filters.region;
    const matchesStage = filters.stage === 'All' || deal.stage === filters.stage;
    const matchesProduct = filters.productType === 'All' || deal.productType === filters.productType;
    const matchesPartnerType = filters.partnerType === 'All' || deal.partnerType === filters.partnerType;
    const matchesSource = filters.source === 'All' || (deal.sourceInfo && deal.sourceInfo.source === filters.source);
    const matchesStageFilter = selectedStageFilter === 'All' || deal.stage === selectedStageFilter;
    return matchesSearch && matchesTab && matchesRegion && matchesStage && matchesProduct && matchesPartnerType && matchesSource && matchesStageFilter;
  }), [deals, searchQuery, activeTab, filters, selectedStageFilter]);

  const pipelineValue = useMemo(() => deals.filter(d => !['ClosedWon', 'ClosedLost'].includes(d.stage)).reduce((s, d) => s + d.value, 0), [deals]);
  const weightedPipelineValue = useMemo(() => deals.filter(d => !['ClosedWon', 'ClosedLost'].includes(d.stage)).reduce((s, d) => s + calculateWeightedValue(d), 0), [deals]);
  const wonValue = useMemo(() => deals.filter(d => d.stage === 'ClosedWon').reduce((s, d) => s + d.value, 0), [deals]);
  const conflictDeals = useMemo(() => deals.filter(d => d.hasConflict), [deals]);
  const stagnantDeals = useMemo(() => deals.filter(d => d.isStagnant), [deals]);
  const STATUS_CONFIG = getStatusConfig(t);

  const stageFunnel = useMemo(() => {
    const stages: DealLifecycleStage[] = ['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial', 'ClosedWon'];
    return stages.map(stage => ({
      stage,
      ...STAGE_CONFIG[stage],
      probability: STAGE_PROBABILITIES[stage].probability,
      avgCycleDays: STAGE_PROBABILITIES[stage].avgCycleDays,
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((s, d) => s + d.value, 0),
      weightedValue: deals.filter(d => d.stage === stage).reduce((s, d) => s + calculateWeightedValue(d), 0),
    }));
  }, [deals]);

  // 计算转化率
  const funnelConversionRates = useMemo(() => {
    const rates: number[] = [];
    for (let i = 0; i < stageFunnel.length - 1; i++) {
      const current = stageFunnel[i];
      const next = stageFunnel[i + 1];
      if (current.count > 0) {
        rates.push(Math.round((next.count / current.count) * 100));
      } else {
        rates.push(0);
      }
    }
    return rates;
  }, [stageFunnel]);

  const sourceDistribution = useMemo(() => {
    const dist: Record<string, { count: number; value: number }> = {};
    deals.forEach(d => {
      const src = d.salesTeam || d.sourceInfo?.source || '未分类';
      const label = src === '渠道报备' ? '渠道报备' : src === '销售自建' ? '销售自建' : src === '市场来源' ? '市场来源' : src;
      if (!dist[label]) dist[label] = { count: 0, value: 0 };
      dist[label].count++;
      dist[label].value += d.value;
    });
    return dist;
  }, [deals]);

  // 处理批量选择
  const toggleSelectDeal = (dealId: string) => {
    setSelectedDeals(prev => 
      prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
    );
  };

  const selectAllDeals = () => {
    if (selectedDeals.length === filteredDeals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(filteredDeals.map(d => d.id));
    }
  };

  // 处理快速编辑
  const startQuickEdit = (dealId: string, field: string, currentValue: string | number) => {
    setEditingDealId(dealId);
    setEditField(field);
    setEditValue(String(currentValue));
  };

  const saveQuickEdit = () => {
    if (!editingDealId || !editField || !onDealUpdate) return;
    const deal = deals.find(d => d.id === editingDealId);
    if (deal) {
      const updatedDeal = {
        ...deal,
        [editField]: editField === 'value' ? parseFloat(editValue) || deal.value : editValue
      };
      onDealUpdate(updatedDeal);
    }
    cancelQuickEdit();
  };

  const cancelQuickEdit = () => {
    setEditingDealId(null);
    setEditField(null);
    setEditValue('');
  };

  const cycleMetrics = useMemo(() => {
    const wonDeals = deals.filter(d => d.stage === 'ClosedWon' && d.conversionMetrics);
    if (wonDeals.length === 0) return { avgTotal: 0, avgApproval: 0, avgSolution: 0, avgCommercial: 0 };
    const totals = wonDeals.reduce((acc, d) => ({
      avgTotal: acc.avgTotal + (d.conversionMetrics?.totalCycleDays || 0),
      avgApproval: acc.avgApproval + (d.conversionMetrics?.registrationToApprovalDays || 0),
      avgSolution: acc.avgSolution + (d.conversionMetrics?.approvalToSolutionDays || 0),
      avgCommercial: acc.avgCommercial + (d.conversionMetrics?.solutionToCommercialDays || 0),
    }), { avgTotal: 0, avgApproval: 0, avgSolution: 0, avgCommercial: 0 });
    const count = wonDeals.length;
    return {
      avgTotal: Math.round(totals.avgTotal / count),
      avgApproval: Math.round(totals.avgApproval / count * 10) / 10,
      avgSolution: Math.round(totals.avgSolution / count * 10) / 10,
      avgCommercial: Math.round(totals.avgCommercial / count * 10) / 10,
    };
  }, [deals]);

  const filterOptions = [
    { label: t('deals.filterRegion'), field: 'region' as const, options: ['All', ...config.regions] },
    { label: t('deals.filterProduct'), field: 'productType' as const, options: ['All', '云原生平台', '大数据平台', 'AI 智算平台'] },
    { label: t('deals.filterPartnerType'), field: 'partnerType' as const, options: ['All', 'ISV', 'VAR', 'SI', 'VAD', 'OEM', 'Reseller'] },
    { label: t('deals.filterStage'), field: 'stage' as const, options: ['All', 'Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial', 'ClosedWon', 'ClosedLost'] },
    { label: '商机来源', field: 'source' as const, options: ['All', '销售自建', '渠道报备', '市场来源'] },
  ];

  const WIN_LOSS_REASONS: Record<WinLossReason, string> = {
    Price: '价格因素',
    Product: '产品力',
    Service: '服务差',
    Competitor: '对手强',
    Timing: '时机不合适',
    Budget: '预算问题',
    Relationship: '客户关系',
    Other: '其他',
  };

  const handleMarkWon = () => {
    if (!selectedDeal || !onDealUpdate) return;
    if (selectedDeal.winLossAnalysis) {
      completeDeal('ClosedWon');
    } else {
      setShowWinLossModal(true);
    }
  };

  const handleMarkLost = () => {
    if (!selectedDeal) return;
    setShowWinLossModal(true);
  };

  const completeDeal = (stage: 'ClosedWon' | 'ClosedLost') => {
    if (!selectedDeal || !onDealUpdate) return;
    const winLoss = stage === 'ClosedWon' 
      ? selectedDeal.winLossAnalysis || { reason: 'Product', description: '项目成功签约' }
      : { reason: winLossReason, description: winLossDescription, competitor: winLossCompetitor || undefined };
    
    onDealUpdate({
      ...selectedDeal,
      stage,
      status: stage === 'ClosedWon' ? 'Closed Won' : 'Closed Lost',
      actualCloseDate: new Date().toISOString().split('T')[0],
      lifecycle: [...selectedDeal.lifecycle, { stage, date: new Date().toISOString().split('T')[0], description: stage === 'ClosedWon' ? '项目赢单' : '项目丢单', actor: '系统', durationDays: 0 }],
      winLossAnalysis: winLoss,
    });
    setShowWinLossModal(false);
    setSelectedDeal(null);
    setWinLossReason('Other');
    setWinLossDescription('');
    setWinLossCompetitor('');
  };

  const getPartnerRecommendations = (deal: Deal): PartnerRecommendation[] => {
    const partners: PartnerRecommendation[] = [
      { id: 'p1', name: '华东医卫云科技术有限公司', tier: 'Diamond', winRate: 75, currentLoad: 3, matchScore: 92, capabilities: ['医疗', '云原生', '大数据'] },
      { id: 'p2', name: '上海智医科技', tier: 'Platinum', winRate: 68, currentLoad: 5, matchScore: 85, capabilities: ['医疗', 'AI', '数据'] },
      { id: 'p3', name: '华南智慧科技', tier: 'Gold', winRate: 62, currentLoad: 2, matchScore: 78, capabilities: ['政府', '云平台'] },
    ];
    return partners.sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleAssignDeal = () => {
    if (!assigningDeal || !onDealUpdate) return;
    onDealUpdate({
      ...assigningDeal,
      partnerId: selectedPartners[0] || assigningDeal.partnerId,
    });
    setShowAssignModal(false);
    setAssigningDeal(null);
    setSelectedPartners([]);
  };

  const handleExtendRequest = () => {
    if (!extendingDeal || !onDealUpdate) return;
    onDealUpdate({
      ...extendingDeal,
      expiresInDays: (extendingDeal.expiresInDays || 0) + 30,
    });
    setShowExtendModal(false);
    setExtendingDeal(null);
    setExtendReason('');
  };

  const saveCurrentView = () => {
    const newView: SavedView = {
      id: `v${Date.now()}`,
      name: currentViewName || '未命名视图',
      filters: { ...filters, search: searchQuery },
    };
    setSavedViews([...savedViews, newView]);
    setShowViewManager(false);
    setCurrentViewName('');
  };

  const loadView = (view: SavedView) => {
    setFilters(view.filters);
    setSearchQuery(view.filters.search);
    setShowViewManager(false);
  };

  const deleteView = (viewId: string) => {
    setSavedViews(savedViews.filter(v => v.id !== viewId));
  };

  const handleDealHover = (deal: Deal, event: React.MouseEvent) => {
    setHoveredDeal(deal);
    setPreviewPosition({ x: event.clientX, y: event.clientY });
    setShowPreviewPopover(true);
  };

  const handleDealLeave = () => {
    setShowPreviewPopover(false);
    setHoveredDeal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('deals.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('deals.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm"><Download className="w-4 h-4" /> {t('common.export')}</Button>
          <Button variant="brand" size="sm" onClick={onNewDeal}><Plus className="w-4 h-4" /> {t('deals.add')}</Button>
        </div>
      </div>

      {/* ═══ 4 KPI Cards — 隐含数量/周期/转化率 ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'pipeline', label: '管线覆盖', value: formatCurrency(pipelineValue), sub: `${deals.filter(d => !['ClosedWon','ClosedLost'].includes(d.stage)).length}笔 · 覆盖${(pipelineValue / Math.max(150000000 - wonValue, 1)).toFixed(1)}x`, icon: DollarSign, color: 'text-blue-600 bg-blue-50', tip: '活跃商机管线总额。数值越大说明弹药越充足。低于 ¥100M 表示数量不足，需招募新伙伴或发布激励政策。', trend: `${deals.filter(d => !['ClosedWon','ClosedLost'].includes(d.stage)).length}笔` },
          { key: 'weighted', label: '加权预期', value: formatCurrency(weightedPipelineValue), sub: `阶段概率加权 · ${Math.round(weightedPipelineValue / Math.max(pipelineValue || 1, 1) * 100)}% 转化预期`, icon: Target, color: 'text-amber-600 bg-amber-50', tip: '金额 × 阶段概率的加权总和。反映转化率预期——如果加权值远低于管线值，说明商机多集中在早期阶段，转化效率需提升。', trend: `${Math.round(weightedPipelineValue / Math.max(pipelineValue || 1, 1) * 100)}%` },
          { key: 'won', label: '赢单进展', value: formatCurrency(wonValue), sub: `${Math.round(wonValue / 150000000 * 100)}% 达成 · 目标 ¥150M`, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', tip: '已赢单金额 vs 年度目标。时间过半但业绩未过半说明转化周期偏长或赢单率偏低。', trend: `${Math.round(wonValue / 150000000 * 100)}%` },
          { key: 'cycle', label: '周期健康', value: `21天`, sub: `${stagnantDeals.length}笔停滞 · 行业基准25天`, icon: Clock, color: stagnantDeals.length > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50', tip: '商机从报备到结单的平均周期。超过 30 天表示流程拥堵。停滞笔数反映商机管理秩序。', trend: stagnantDeals.length > 0 ? `⚠${stagnantDeals.length}笔停滞` : '✓正常' },
        ].map((s, i) => (
          <Card key={s.key} hover className="group/tip relative cursor-pointer" onClick={() => setMetricDetail(s.key)}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-neutral-500">{s.label}</p>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.color)}>
                  <s.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] text-neutral-400 mt-1">{s.sub}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                <span className="text-[10px] text-neutral-400">{s.trend}</span>
                <button className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">查看详情 →</button>
              </div>
            </div>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs leading-relaxed rounded-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 max-w-[300px] text-center shadow-lg">
              <p className="mb-1.5">{s.tip}</p>
              <p className="text-blue-400 dark:text-blue-600 font-semibold">点击查看详情 →</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45"></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Metric Detail Modal */}
      {metricDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setMetricDetail(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {metricDetail === 'pipeline' ? '📦 管线覆盖 — 各阶段商机分布' : metricDetail === 'weighted' ? '🎯 加权预期 — 阶段概率×金额' : metricDetail === 'won' ? '💰 赢单进展 — 业绩 vs 目标' : '⏱ 周期健康 — 各阶段耗时分析'}
              </h3>
              <button onClick={() => setMetricDetail(null)} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2 text-sm">
              {metricDetail === 'pipeline' && ['Registered','UnderReview','Approved','Solution','Commercial'].map(stage => {
                const c = deals.filter(d => d.stage === stage).length;
                const v = deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value||0), 0);
                return <div key={stage} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg"><span>{STAGE_CONFIG[stage]?.label||stage}</span><span>{c}笔 · {formatCurrency(v)}</span></div>;
              })}
              {metricDetail === 'weighted' && ['Registered','UnderReview','Approved','Solution','Commercial','ClosedWon'].map(stage => {
                const c = deals.filter(d => d.stage === stage).length;
                const v = deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value||0), 0);
                const prob = {Registered:10,UnderReview:20,Approved:35,Solution:50,Commercial:80,ClosedWon:100}[stage]||0;
                return <div key={stage} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg"><span>{STAGE_CONFIG[stage]?.label||stage} ({prob}%)</span><span>{c}笔 · {formatCurrency(v * prob / 100)}</span></div>;
              })}
              {metricDetail === 'won' && (<><div className="p-3 bg-neutral-50 rounded-lg">已赢单 {formatCurrency(wonValue)} / 年度目标 ¥150M ({Math.round(wonValue/150000000*100)}%)</div><div className="h-3 bg-neutral-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.round(wonValue/150000000*100)}%`}}/></div><p className="text-xs text-neutral-400 mt-1">时间已过 50%，业绩达成 {Math.round(wonValue/150000000*100)}%{wonValue < 75000000 ? '，缺口明显' : ''}</p></>)}
              {metricDetail === 'cycle' && ['报备→审批','审批→批复','批复→方案','方案→商务','商务→结单'].map((t,i) => {
                const d=[3,5,7,10,8][i]; const b=[2,4,6,8,5][i];
                return <div key={t} className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg"><span>{t}</span><span className={d>b?'text-amber-600':'text-emerald-600'}>{d}天 (基准{b}天) {d>b?'⚠':''}</span></div>;
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {t('deals.lifecycleFunnel')}
              </CardTitle>
              <div className="text-xs text-neutral-400">
                点击阶段过滤商机 · 加权概率已计算
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-1 h-64">
                {stageFunnel.map((s, i) => {
                  const maxCount = Math.max(...stageFunnel.map(x => x.count));
                  const widthPercent = 100 - i * 12; // 漏斗宽度递减
                  const heightPercent = Math.max(15, (s.count / maxCount) * 100);
                  const isSelected = selectedStageFilter === s.stage;
                  
                  return (
                    <div key={s.stage} className="flex flex-col items-center relative">
                      {/* 漏斗层级 */}
                      <button
                        onClick={() => setSelectedStageFilter(selectedStageFilter === s.stage ? 'All' : s.stage)}
                        className={cn(
                          'relative transition-all duration-200 rounded-lg overflow-hidden',
                          'hover:scale-105 hover:shadow-lg',
                          isSelected ? 'ring-2 ring-brand ring-offset-2' : ''
                        )}
                        style={{ width: `${widthPercent}%`, minWidth: '60px' }}
                      >
                        <div
                          className={cn('p-3', s.bgColor)}
                          style={{ 
                            height: `${heightPercent}%`,
                            minHeight: '40px',
                            background: `linear-gradient(180deg, ${s.bgColor.replace('bg-', '#').replace('-50', '200').replace('-100', '300')} 0%, ${s.bgColor.replace('bg-', '#').replace('-50', '100').replace('-100', '200')} 100%)`
                          }}
                        >
                          <div className="text-center">
                            <div className="text-xl font-bold" style={{ color: s.color.replace('text-', '') }}>
                              {s.count}
                            </div>
                            <div className="text-xs opacity-70" style={{ color: s.color.replace('text-', '') }}>
                              {formatCurrency(s.weightedValue)}
                            </div>
                            <div className="text-[10px] mt-1" style={{ color: s.color.replace('text-', '') }}>
                              概率: {s.probability}%
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      {/* 阶段标签 */}
                      <div className="mt-2 text-center">
                        <p className={cn('text-xs font-medium', s.color)}>{s.label}</p>
                        <p className="text-[10px] text-neutral-400">{formatCurrency(s.value)}</p>
                      </div>
                      
                      {/* 转化率箭头 */}
                      {i < stageFunnel.length - 1 && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <ArrowDownRight className="w-3 h-3 text-neutral-300" />
                          <span className="text-[10px] font-medium text-emerald-600 mt-0.5">
                            {funnelConversionRates[i]}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* 图例说明 */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-100"></div>
                  <span>加权金额 = 金额 × 阶段概率</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-3 h-3 text-neutral-400" />
                  <span>转化率 = 下一阶段数量 / 当前阶段数量</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>商机来源</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['渠道报备','销售自建','市场来源'].map(source => {
                  const data = sourceDistribution[source] || { count: 0, value: 0 };
                  const icons: Record<string,any> = { '渠道报备': FileText, '销售自建': User, '市场来源': Zap };
                  const colors: Record<string,string> = { '渠道报备': 'text-emerald-600', '销售自建': 'text-blue-600', '市场来源': 'text-purple-600' };
                  const Icon = icons[source] || FileText;
                  return (
                    <div key={source} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${colors[source]}`} />
                        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{source}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-xl font-bold text-neutral-900 dark:text-white">{data.count}</span>
                        <span className="text-xs text-neutral-400">{formatCurrency(data.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('deals.cycleAnalysis')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: t('deals.regToApproval'), days: cycleMetrics.avgApproval, target: 5, key: 'regToApproval' },
                  { label: t('deals.approvalToSolution'), days: cycleMetrics.avgSolution, target: 30, key: 'approvalToSolution' },
                  { label: t('deals.solutionToClose'), days: cycleMetrics.avgCommercial, target: 45, key: 'solutionToClose' },
                  { label: t('deals.fullCycle'), days: cycleMetrics.avgTotal, target: 90, key: 'fullCycle' },
                ].map((c) => {
                  const pct = Math.min(100, (c.days / c.target) * 100);
                  const isOverdue = c.days > c.target;
                  return (
                    <div key={c.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-500">{c.label}</span>
                        <span className={cn('text-xs font-semibold', isOverdue ? 'text-red-500' : 'text-emerald-600')}>
                          {c.days}天 {isOverdue && `(+${c.days - c.target})`}
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', isOverdue ? 'bg-red-400' : 'bg-emerald-500')}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {conflictDeals.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {t('deals.conflictAlert')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conflictDeals.slice(0, 3).map((deal) => {
                    return (
                      <div key={deal.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{deal.title}</p>
                        <p className="text-xs text-neutral-500 mt-1">{deal.customerName} · {deal.partnerName}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="danger" size="sm">商机冲突</Badge>
                          <div className="flex gap-1.5">
                            <Button variant="brand" size="sm" className="text-[10px] h-6" onClick={(e) => { e.stopPropagation(); setSelectedDeal(deal); setShowConflictModal(true); }}>
                              立即裁决
                            </Button>
                            <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => alert('已标记为待协调，将通知双方渠道经理')}>
                              待协调
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card padding={false}>
        {/* 批量操作栏 */}
        {selectedDeals.length > 0 && (
          <div className="px-6 py-3 bg-brand-50 dark:bg-brand-900/20 border-b border-brand-200 dark:border-brand-800">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-brand-700 dark:text-brand-400">
                已选择 {selectedDeals.length} 个商机
              </span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => {
                  // 批量审批
                  selectedDeals.forEach(id => {
                    const deal = deals.find(d => d.id === id);
                    if (deal && deal.stage === 'UnderReview' && onDealUpdate) {
                      onDealUpdate({ ...deal, stage: 'Approved' });
                    }
                  });
                  setSelectedDeals([]);
                }}>
                  <CheckCircle2 className="w-4 h-4" />
                  批量审批通过
                </Button>
                <Button variant="danger" size="sm" onClick={() => {
                  // 批量删除
                  selectedDeals.forEach(id => onDealDelete?.(id));
                  setSelectedDeals([]);
                }}>
                  <Trash2 className="w-4 h-4" />
                  批量删除
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDeals([])}>
                  取消选择
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
              {[
                { id: 'all' as const, label: t('deals.allTab'), count: deals.length },
                { id: 'pending' as const, label: t('deals.pendingTab'), count: deals.filter(d => d.stage === 'UnderReview').length },
                { id: 'conflicts' as const, label: t('deals.conflictsTab'), count: conflictDeals.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2',
                    activeTab === tab.id
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  )}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => setShowWinLossPanel(true)}>
              <TrendingDown className="w-4 h-4 mr-1" />
              赢单/丢单分析
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowRuleEngine(true)}>
              <Settings className="w-4 h-4 mr-1" />
              规则引擎
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowViewManager(true)}>
              <Layout className="w-4 h-4 mr-1" />
              视图管理
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={t('deals.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 h-9 pl-9 pr-3 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 dark:text-white placeholder:text-neutral-400"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-6 bg-neutral-50/50 dark:bg-neutral-800/30 overflow-x-auto">
          {filterOptions.map((f) => (
            <div key={f.field} className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-neutral-400">{f.label}:</span>
              <select
                className="bg-transparent text-xs font-medium text-neutral-600 dark:text-neutral-300 focus:outline-none cursor-pointer"
                value={filters[f.field]}
                onChange={(e) => setFilters({ ...filters, [f.field]: e.target.value })}
              >
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <span className="ml-auto text-xs text-neutral-400 shrink-0">{filteredDeals.length} {t('common.results')}</span>
        </div>

        {/* 快捷预设筛选 */}
        <div className="px-6 py-2 border-b border-neutral-100 dark:border-neutral-800">
          <PresetFilterBar
            deals={deals}
            currentUser={config?.companyName || ''}
            userRegion="华东"
            activePreset={activePreset}
            onSelectPreset={(preset) => {
              if (!preset) {
                setActivePreset(null);
                setSelectedStageFilter('All');
                return;
              }
              setActivePreset(preset.id);
              if (preset.filters.stage) setSelectedStageFilter(preset.filters.stage);
              if (preset.filters.isStagnant !== undefined) {
                // 应用停滞过滤
                setFilters(prev => ({ ...prev, stage: 'All' }));
              }
              if (preset.filters.minValue) {
                // 金额过滤应用到搜索
                setSearchQuery(`value>=${preset.filters.minValue}`);
              }
            }}
          />
        </div>

        {filteredDeals.length === 0 ? (
          <div className="py-16"><EmptyState title={t('deals.noDeals')} description={t('deals.noDealsDesc')} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                  <th className="px-3 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider w-12">
                    <button onClick={selectAllDeals} className="hover:text-neutral-700 transition-colors">
                      <div className="w-4 h-4 rounded border border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
                        {selectedDeals.length === filteredDeals.length && (
                          <CheckCircle2 className="w-3 h-3 text-neutral-700" />
                        )}
                      </div>
                    </button>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colProject')}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colCustomer')}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colPartner')}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">来源</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colValue')}</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">停留天数</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colStage')}</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">健康度</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colPriority')}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">最新动态</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredDeals.map((deal) => {
                  const stageCfg = STAGE_CONFIG[deal.stage];
                  const StageIcon = stageCfg.icon;
                  const sourceCfg = deal.sourceInfo ? SOURCE_CONFIG[deal.sourceInfo.source] : null;
                  const isSelected = selectedDeals.includes(deal.id);
                  const isStagnant = deal.isStagnant;
                  const daysInStage = deal.daysInCurrentStage || 0;
                  const avgDays = STAGE_PROBABILITIES[deal.stage]?.avgCycleDays || 0;
                  const isOverdue = daysInStage > avgDays;
                  
                  return (
                      <tr
                        className={cn(
                          'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer',
                          isStagnant && 'bg-amber-50/50 dark:bg-amber-900/10'
                        )}
                        onClick={() => navigate(`/deals/${deal.id}`)}
                        onMouseEnter={(e) => handleDealHover(deal, e)}
                        onMouseLeave={handleDealLeave}
                      >
                        {/* 多选框 */}
                        <td className="px-3 py-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleSelectDeal(deal.id); }}
                            className="hover:text-neutral-700 transition-colors"
                          >
                            <div className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center',
                              isSelected 
                                ? 'bg-brand border-brand' 
                                : 'border-neutral-300 dark:border-neutral-600'
                            )}>
                              {isSelected && (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </button>
                        </td>
                        
                        {/* 项目名称 */}
                        <td className="px-6 py-4">
                          <div className="relative">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-brand transition-colors">{deal.title}</p>
                              {deal.hasConflict && <Badge variant="danger" size="sm">{t('deals.conflict')}</Badge>}
                              {isStagnant && <Badge variant="warning" size="sm"><AlertTriangle className="w-3 h-3" /> 停滞</Badge>}
                            </div>
                            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                              <MapPin className="w-3 h-3" /> {deal.region} · {deal.city}
                            </p>
                          </div>
                        </td>
                        
                        {/* 客户信息 */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/customer/${encodeURIComponent(deal.customerName)}/analysis`); }}>{deal.customerName}</p>
                          <p className="text-xs text-neutral-400">{deal.customerIndustry}</p>
                        </td>
                        
                        {/* 伙伴信息 */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{deal.partnerName}</p>
                          <Badge variant="default" size="sm">{deal.partnerType}</Badge>
                        </td>
                        
                        {/* 来源 + 关联活动 */}
                        <td className="px-6 py-4">
                          {sourceCfg && (
                            <div className="flex items-center gap-2">
                              <sourceCfg.icon className="w-4 h-4 text-neutral-400" />
                              <span className="text-xs text-neutral-500">{sourceCfg.label}</span>
                            </div>
                          )}
                          {deal.originActivityName && (
                            <button onClick={(e) => { e.stopPropagation(); navigate('/marketing'); }} className="mt-1 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 hover:underline">
                              <Target className="w-3 h-3" />
                              <span className="truncate max-w-[100px]">{deal.originActivityName}</span>
                            </button>
                          )}
                          {deal.leadResponseTime !== undefined && deal.leadResponseTime > 0 && (
                            <p className={cn('text-[10px] mt-0.5', deal.leadResponseTime <= 24 ? 'text-emerald-500' : deal.leadResponseTime <= 48 ? 'text-amber-500' : 'text-red-500')}>
                              响应: {deal.leadResponseTime}h
                              {deal.leadResponseTime <= 24 && ' ⚡速响'}
                            </p>
                          )}
                        </td>
                        
                        {/* 金额 - 支持快速编辑 */}
                        <td className="px-6 py-4 text-right">
                          {editingDealId === deal.id && editField === 'value' ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-24 px-2 py-1 text-sm border border-brand rounded focus:outline-none focus:ring-1 focus:ring-brand"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveQuickEdit();
                                  if (e.key === 'Escape') cancelQuickEdit();
                                }}
                                autoFocus
                              />
                              <button onClick={saveQuickEdit} className="p-1 hover:bg-neutral-100 rounded">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </button>
                              <button onClick={cancelQuickEdit} className="p-1 hover:bg-neutral-100 rounded">
                                <XCircle className="w-4 h-4 text-neutral-500" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p 
                                className="text-sm font-semibold text-neutral-900 dark:text-white cursor-pointer hover:text-brand"
                                onClick={(e) => { e.stopPropagation(); startQuickEdit(deal.id, 'value', deal.value); }}
                              >
                                {formatCurrency(deal.value)}
                                <Edit2 className="w-3 h-3 inline ml-1 opacity-0 hover:opacity-100 transition-opacity" />
                              </p>
                              <p 
                                className="text-xs text-neutral-400 cursor-pointer hover:text-brand"
                                onClick={(e) => { e.stopPropagation(); startQuickEdit(deal.id, 'expectedCloseDate', deal.expectedCloseDate); }}
                              >
                                {deal.expectedCloseDate}
                              </p>
                            </div>
                          )}
                        </td>
                        
                        {/* 停留天数 */}
                        <td className="px-6 py-4 text-center">
                          <div className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            isOverdue 
                              ? isStagnant 
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          )}>
                            <Timer className="w-3 h-3" />
                            {daysInStage}天
                            {isOverdue && (
                              <span className="ml-1">超出{daysInStage - avgDays}天</span>
                            )}
                          </div>
                        </td>
                        
                        {/* 阶段 */}
                        <td className="px-6 py-4 text-center">
                          <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', stageCfg.bgColor, stageCfg.color)}>
                            <StageIcon className="w-3.5 h-3.5" />
                            {stageCfg.label}
                          </div>
                          {deal.protectionRemainingDays && deal.protectionRemainingDays > 0 && (
                            <p className="text-[10px] text-amber-500 mt-0.5">🛡️ 保护 {deal.protectionRemainingDays}天</p>
                          )}
                        </td>

                        {/* 健康度 */}
                        <td className="px-6 py-4 text-center">
                          {deal.healthScore !== undefined ? (
                            <div className="flex items-center justify-center gap-1">
                              <div className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                                deal.healthScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                deal.healthScore >= 50 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              )}>{deal.healthScore}</div>
                            </div>
                          ) : <span className="text-xs text-neutral-400">-</span>}
                        </td>

                        {/* 优先级 */}
                        <td className="px-6 py-4 text-center">
                          {deal.isPriority ? (
                            <Badge variant="warning" size="sm">{t('deals.priority')}</Badge>
                          ) : (
                            <span className="text-xs text-neutral-400">-</span>
                          )}
                        </td>
                        
                        {/* 最新动态 */}
                        <td className="px-6 py-4">
                          {deal.activities && deal.activities.length > 0 ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedDeal(deal); setShowActivityDrawer(true); }}
                              className="flex items-center gap-2 text-left hover:text-brand transition-colors"
                            >
                              <MessageSquare className="w-4 h-4 text-neutral-400" />
                              <div className="max-w-[180px]">
                                <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
                                  {deal.activities[0].content}
                                </p>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                  {deal.activities[0].actor} · {deal.activities[0].createdAt}
                                </p>
                              </div>
                            </button>
                          ) : (
                            <span className="text-xs text-neutral-400 flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              暂无动态
                            </span>
                          )}
                        </td>
                        
                        {/* 操作 */}
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* Always visible quick actions */}
                            {deal.isStagnant && (
                              <button onClick={() => alert(`已向 ${deal.salesName} 发送催办提醒`)}
                                className="px-2 py-1 text-[10px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200">
                                催办
                              </button>
                            )}
                            <button onClick={() => navigate(`/customer/${encodeURIComponent(deal.customerName)}/analysis`)}
                              className="px-2 py-1 text-[10px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200">
                              分析
                            </button>
                            {/* Hover-reveal actions */}
                            <button
                              onClick={() => { setAssigningDeal(deal); setShowAssignModal(true); }}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                              title="智能分配"
                            >
                              <Handshake className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedDeal(deal); setShowActivityDrawer(true); }}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-green-500 transition-colors opacity-0 group-hover:opacity-100"
                              title="跟进动态"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { navigate(`/deals/${deal.id}`); }}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-brand transition-colors opacity-0 group-hover:opacity-100"
                              title="查看详情"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!selectedDeal} onClose={() => setSelectedDeal(null)} size="xl" title={selectedDeal?.title}>
        {selectedDeal && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t('deals.colCustomer'), value: selectedDeal.customerName, icon: User },
                { label: t('deals.colValue'), value: formatCurrency(selectedDeal.value), icon: DollarSign },
                { label: t('deals.colPartner'), value: `${selectedDeal.partnerName} (${selectedDeal.partnerType})`, icon: FileText },
                { label: t('deals.colProduct'), value: selectedDeal.productType, icon: Target },
              ].map((f) => (
                <div key={f.label} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                  <p className="text-xs text-neutral-500 flex items-center gap-1.5"><f.icon className="w-3.5 h-3.5" /> {f.label}</p>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">{f.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {t('deals.lifecycle')}
                </h4>
                <div className="relative before:absolute before:left-5 before:top-0 before:bottom-0 before:w-px before:bg-neutral-200 dark:before:bg-neutral-800">
                  {selectedDeal.lifecycle.map((event, idx) => {
                    const stageCfg = STAGE_CONFIG[event.stage];
                    const EventIcon = stageCfg?.icon || CheckCircle2;
                    return (
                      <div key={idx} className="relative pl-12 pb-5 last:pb-0">
                        <div className={cn(
                          'absolute left-0 w-10 h-10 rounded-xl flex items-center justify-center z-10 border-2',
                          idx === selectedDeal.lifecycle.length - 1
                            ? 'bg-brand border-brand text-white'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
                        )}>
                          <EventIcon className={cn('w-4 h-4', idx === selectedDeal.lifecycle.length - 1 ? 'text-white' : 'text-neutral-400')} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-white">{stageCfg?.label || event.stage}</span>
                            <span className="text-xs text-neutral-400">{event.date}</span>
                            {event.durationDays !== undefined && event.durationDays > 0 && (
                              <Badge variant="default" size="sm">+{event.durationDays}天</Badge>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">{event.description} · {event.actor}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedDeal.sourceInfo && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                      <GitBranch className="w-4 h-4" /> {t('deals.source')}
                    </h4>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        {SOURCE_CONFIG[selectedDeal.sourceInfo.source] && (
                          <>
                            {(SOURCE_CONFIG[selectedDeal.sourceInfo.source].icon) as any}
                            <span className="text-sm font-medium">
                              {SOURCE_CONFIG[selectedDeal.sourceInfo.source].label}
                            </span>
                          </>
                        )}
                        <Badge
                          variant={selectedDeal.sourceInfo.leadQuality === 'Hot' ? 'success' : selectedDeal.sourceInfo.leadQuality === 'Warm' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {selectedDeal.sourceInfo.leadQuality === 'Hot' ? '高意向' : selectedDeal.sourceInfo.leadQuality === 'Warm' ? '中意向' : '低意向'}
                        </Badge>
                      </div>
                      {selectedDeal.sourceInfo.initialContactDate && (
                        <p className="text-xs text-neutral-500">首次接触: {selectedDeal.sourceInfo.initialContactDate}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <h5 className="text-xs font-semibold text-neutral-500 uppercase mb-3">{t('common.actions')}</h5>
                  <div className="space-y-2">
                    {selectedDeal.stage === 'UnderReview' && (
                      <>
                        <Button variant="brand" size="sm" className="w-full"
                          onClick={() => onDealUpdate?.({ ...selectedDeal, stage: 'Approved', lifecycle: [...selectedDeal.lifecycle, { stage: 'Approved', date: new Date().toISOString().split('T')[0], description: '渠道经理审批通过', actor: '系统', durationDays: 0 }] })}>
                          <CheckCircle2 className="w-4 h-4" /> {t('deals.approve')}
                        </Button>
                        <Button variant="danger" size="sm" className="w-full"
                          onClick={() => onDealUpdate?.({ ...selectedDeal, stage: 'ClosedLost', status: 'Closed Lost', lifecycle: [...selectedDeal.lifecycle, { stage: 'ClosedLost', date: new Date().toISOString().split('T')[0], description: '渠道经理拒绝报备', actor: '系统', durationDays: 0 }] })}>
                          <XCircle className="w-4 h-4" /> {t('deals.reject')}
                        </Button>
                      </>
                    )}
                    {selectedDeal.stage === 'Approved' && (
                      <Button variant="brand" size="sm" className="w-full"
                        onClick={() => onDealUpdate?.({ ...selectedDeal, stage: 'Solution', lifecycle: [...selectedDeal.lifecycle, { stage: 'Solution', date: new Date().toISOString().split('T')[0], description: '进入方案跟进阶段', actor: '系统', durationDays: 0 }] })}>
                        <ArrowRight className="w-4 h-4" /> {t('deals.toSolution')}
                      </Button>
                    )}
                    {selectedDeal.stage === 'Solution' && (
                      <Button variant="brand" size="sm" className="w-full"
                        onClick={() => onDealUpdate?.({ ...selectedDeal, stage: 'Commercial', lifecycle: [...selectedDeal.lifecycle, { stage: 'Commercial', date: new Date().toISOString().split('T')[0], description: '进入商务洽谈阶段', actor: '系统', durationDays: 0 }] })}>
                        <ArrowRight className="w-4 h-4" /> {t('deals.toCommercial')}
                      </Button>
                    )}
                    {selectedDeal.stage === 'Commercial' && (
                      <>
                        <Button variant="brand" size="sm" className="w-full"
                          onClick={handleMarkWon}>
                          <TrendingUp className="w-4 h-4" /> {t('deals.markWon')}
                        </Button>
                        <Button variant="danger" size="sm" className="w-full"
                          onClick={handleMarkLost}>
                          <XCircle className="w-4 h-4" /> {t('deals.markLost')}
                        </Button>
                      </>
                    )}
                    {(selectedDeal.stage !== 'ClosedWon' && selectedDeal.stage !== 'ClosedLost') && (
                      <Button variant="outline" size="sm" className="w-full"
                        onClick={() => { setExtendingDeal(selectedDeal); setShowExtendModal(true); }}>
                        <Clock8 className="w-4 h-4" /> 申请延期
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" className="w-full mt-2">{t('deals.editDeal')}</Button>
                  </div>
                </div>

                {selectedDeal.hasConflict && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t('deals.conflictDetected')}</p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">{t('deals.conflictDesc')}</p>
                        <Button variant="danger" size="sm" className="mt-2 w-full"
                          onClick={() => { setSelectedConflict(conflicts.find(c => c.id === selectedDeal.conflictId) || null); setShowConflictModal(true); }}>
                          {t('deals.resolveConflict')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedDeal.conversionMetrics && (
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <h5 className="text-xs font-semibold text-neutral-500 uppercase mb-3">{t('deals.cycleMetrics')}</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">{t('deals.regToApproval')}</span>
                        <span className="font-medium">{selectedDeal.conversionMetrics.registrationToApprovalDays}天</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">{t('deals.approvalToSolution')}</span>
                        <span className="font-medium">{selectedDeal.conversionMetrics.approvalToSolutionDays}天</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500">{t('deals.totalCycle')}</span>
                        <span className={cn('font-medium', selectedDeal.conversionMetrics.isOverdue ? 'text-red-500' : 'text-emerald-600')}>
                          {selectedDeal.conversionMetrics.totalCycleDays}天
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showConflictModal && !!selectedConflict} onClose={() => { setShowConflictModal(false); setSelectedConflict(null); }} size="xl" title={t('deals.conflictManagement')}>
        {selectedConflict && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                    {CONFLICT_TYPE_LABELS[selectedConflict.type] || selectedConflict.type}
                  </span>
                </div>
                <Badge variant={selectedConflict.status === 'Resolved' ? 'success' : selectedConflict.status === 'Escalated' ? 'warning' : 'danger'} size="sm">
                  {selectedConflict.status === 'Resolved' ? '已解决' : selectedConflict.status === 'Escalated' ? '已升级' : '待处理'}
                </Badge>
              </div>
              <p className="text-sm text-red-600 dark:text-red-300">{selectedConflict.description}</p>
              {selectedConflict.protectionPeriodDays && (
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-amber-600">首报保护期: {selectedConflict.protectionPeriodDays}天</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedConflict.dealIds.map((dealId, index) => {
                const deal = deals.find(d => d.id === dealId);
                if (!deal) return null;
                const isFirstReported = selectedConflict.firstReportedDealId === dealId;
                const stageCfg = STAGE_CONFIG[deal.stage];
                const StageIcon = stageCfg.icon;
                
                return (
                  <div key={dealId} className={cn(
                    'p-4 rounded-lg border-2',
                    isFirstReported 
                      ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10' 
                      : 'border-neutral-200 bg-neutral-50 dark:bg-neutral-800/50'
                  )}>
                    {isFirstReported && (
                      <div className="flex items-center gap-1 mb-3">
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                          首报者
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{deal.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{deal.customerName}</p>
                      </div>
                      <div className={cn('px-2 py-1 rounded-lg text-xs font-medium', stageCfg.bgColor, stageCfg.color)}>
                        <StageIcon className="w-3 h-3 inline mr-1" />
                        {stageCfg.label}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">伙伴: {deal.partnerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">{deal.region} · {deal.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">{formatCurrency(deal.value)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">报备: {deal.createdDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">预计结单: {deal.expectedCloseDate}</span>
                      </div>
                    </div>

                    {deal.activities && deal.activities.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-xs font-medium text-neutral-500 mb-2">最近跟进</p>
                        {deal.activities.slice(0, 2).map((activity) => (
                          <div key={activity.id} className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                            {activity.content} · {activity.createdAt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedConflict.status === 'Resolved' && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('deals.resolved')}</span>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-300">{selectedConflict.resolution}</p>
                <p className="text-xs text-neutral-500 mt-2">
                  {t('deals.resolvedBy')}: {selectedConflict.resolvedBy} · {selectedConflict.resolvedDate}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button variant="secondary" size="sm" onClick={() => { setShowConflictModal(false); setSelectedConflict(null); }}>
                {t('common.close')}
              </Button>
              {selectedConflict.status === 'Pending' && (
                <>
                  <Button variant="outline" size="sm">
                    转入公海
                  </Button>
                  <Button variant="brand" size="sm">
                    {t('deals.markResolved')}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 活动动态抽屉 */}
      <AnimatePresence>
        {showActivityDrawer && selectedDeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex justify-end"
            onClick={() => { setShowActivityDrawer(false); setSelectedDeal(null); }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-md bg-white dark:bg-neutral-900 h-full overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{selectedDeal.title}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{selectedDeal.customerName}</p>
                  </div>
                  <button
                    onClick={() => { setShowActivityDrawer(false); setSelectedDeal(null); }}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                  >
                    <XCircle className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* 活动列表 */}
                <div className="space-y-3">
                  {selectedDeal.activities && selectedDeal.activities.length > 0 ? (
                    selectedDeal.activities.map((activity) => (
                      <div key={activity.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                            activity.type === 'meeting' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                            activity.type === 'call' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                            activity.type === 'email' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                            activity.type === 'task' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                            'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                          )}>
                            {activity.type === 'meeting' && <Calendar className="w-4 h-4" />}
                            {activity.type === 'call' && <Phone className="w-4 h-4" />}
                            {activity.type === 'email' && <Mail className="w-4 h-4" />}
                            {activity.type === 'task' && <ListTodo className="w-4 h-4" />}
                            {activity.type === 'note' && <FileText className="w-4 h-4" />}
                            {activity.type === 'update' && <RefreshCw className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-neutral-900 dark:text-white">
                              {activity.content}
                            </p>
                            <p className="text-xs text-neutral-400 mt-1">
                              {activity.actor} · {activity.createdAt}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">暂无跟进记录</p>
                    </div>
                  )}
                </div>

                {/* 评论输入 */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newActivityContent}
                      onChange={(e) => setNewActivityContent(e.target.value)}
                      placeholder="添加评论，支持 @提及"
                      className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newActivityContent.trim()) {
                          // 提交评论
                          setNewActivityContent('');
                        }
                      }}
                    />
                    <Button size="sm" disabled={!newActivityContent.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">支持 @提及功能，输入 @ 后可选择用户</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 赢单/丢单分析模态框 */}
      <Modal 
        open={showWinLossModal} 
        onClose={() => { setShowWinLossModal(false); setWinLossReason('Other'); setWinLossDescription(''); setWinLossCompetitor(''); }} 
        size="lg" 
        title={selectedDeal?.stage === 'Commercial' ? '确认结单' : '丢单原因分析'}
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {selectedDeal?.stage === 'Commercial' ? '请填写赢单分析信息' : '请分析丢单原因，这将帮助我们改进业务'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">主要原因</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(WIN_LOSS_REASONS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setWinLossReason(key as WinLossReason)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    winLossReason === key
                      ? 'bg-brand text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">详细说明</label>
            <textarea
              value={winLossDescription}
              onChange={(e) => setWinLossDescription(e.target.value)}
              placeholder="请描述具体原因和情况..."
              rows={3}
              className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
            />
          </div>

          {winLossReason === 'Competitor' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">竞争厂商</label>
              <input
                type="text"
                value={winLossCompetitor}
                onChange={(e) => setWinLossCompetitor(e.target.value)}
                placeholder="请输入竞争厂商名称"
                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button variant="secondary" size="sm" onClick={() => { setShowWinLossModal(false); setWinLossReason('Other'); setWinLossDescription(''); setWinLossCompetitor(''); }}>
              取消
            </Button>
            <Button 
              variant={selectedDeal?.stage === 'Commercial' ? 'brand' : 'danger'} 
              size="sm" 
              onClick={() => completeDeal(selectedDeal?.stage === 'Commercial' ? 'ClosedWon' : 'ClosedLost')}
              disabled={!winLossDescription.trim()}
            >
              {selectedDeal?.stage === 'Commercial' ? '确认赢单' : '确认丢单'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 公海商机智能分配模态框 */}
      <Modal 
        open={showAssignModal} 
        onClose={() => { setShowAssignModal(false); setAssigningDeal(null); setSelectedPartners([]); }} 
        size="xl" 
        title="智能分配商机"
      >
        {assigningDeal && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">{assigningDeal.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">{assigningDeal.customerName} · {formatCurrency(assigningDeal.value)}</p>
                </div>
                <Sparkles className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">推荐合作伙伴</h4>
                <span className="text-xs text-neutral-500">系统根据能力匹配度排序</span>
              </div>
              <div className="space-y-3">
                {getPartnerRecommendations(assigningDeal).map((partner) => (
                  <div 
                    key={partner.id} 
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all cursor-pointer',
                      selectedPartners.includes(partner.id)
                        ? 'border-brand bg-brand/5'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    )}
                    onClick={() => setSelectedPartners(selectedPartners.includes(partner.id) 
                      ? selectedPartners.filter(id => id !== partner.id)
                      : [...selectedPartners, partner.id])}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{partner.name}</p>
                            <Badge variant={partner.tier === 'Diamond' ? 'brand' : partner.tier === 'Platinum' ? 'success' : 'default'} size="sm">
                              {partner.tier}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {partner.capabilities.map((cap, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-600 dark:text-neutral-400">
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">{partner.matchScore}%</span>
                        </div>
                        <div className="text-xs text-neutral-500">
                          胜率: {partner.winRate}% · 负载: {partner.currentLoad}
                        </div>
                      </div>
                    </div>
                    {selectedPartners.includes(partner.id) && (
                      <div className="mt-3 flex items-center gap-2 text-brand">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-medium">已选择</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button variant="secondary" size="sm" onClick={() => { setShowAssignModal(false); setAssigningDeal(null); setSelectedPartners([]); }}>
                取消
              </Button>
              <Button 
                variant="brand" 
                size="sm" 
                onClick={handleAssignDeal}
                disabled={selectedPartners.length === 0}
              >
                <Handshake className="w-4 h-4 mr-1" />
                分配给选中伙伴
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 报备有效期延期申请模态框 */}
      <Modal 
        open={showExtendModal} 
        onClose={() => { setShowExtendModal(false); setExtendingDeal(null); setExtendReason(''); }} 
        size="lg" 
        title="申请延期"
      >
        {extendingDeal && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <Clock8 className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">商机即将过期</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    当前有效期剩余 {extendingDeal.expiresInDays} 天，申请延期将延长30天
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">延期原因</label>
              <textarea
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                placeholder="请说明需要延期的原因，例如：客户预算审批延迟、技术方案需要调整等..."
                rows={3}
                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
              />
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">当前有效期</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{extendingDeal.expiresInDays} 天</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-neutral-500">延期后有效期</span>
                <span className="font-medium text-emerald-600">{extendingDeal.expiresInDays + 30} 天</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button variant="secondary" size="sm" onClick={() => { setShowExtendModal(false); setExtendingDeal(null); setExtendReason(''); }}>
                取消
              </Button>
              <Button 
                variant="brand" 
                size="sm" 
                onClick={handleExtendRequest}
                disabled={!extendReason.trim()}
              >
                <Send className="w-4 h-4 mr-1" />
                提交申请
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 自定义视图管理模态框 */}
      <Modal 
        open={showViewManager} 
        onClose={() => { setShowViewManager(false); setCurrentViewName(''); }} 
        size="lg" 
        title="视图管理"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={currentViewName}
              onChange={(e) => setCurrentViewName(e.target.value)}
              placeholder="输入视图名称"
              className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <Button variant="brand" size="sm" onClick={saveCurrentView}>
              <Plus className="w-4 h-4" />
              保存视图
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">已保存的视图</h4>
            <div className="space-y-2">
              {savedViews.map((view) => (
                <div 
                  key={view.id} 
                  className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                >
                  <button 
                    onClick={() => loadView(view)}
                    className="flex items-center gap-2 text-left hover:text-brand transition-colors"
                  >
                    <Layout className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{view.name}</span>
                  </button>
                  <button 
                    onClick={() => deleteView(view.id)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                  >
                    <XCircle className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* 侧边预览浮窗 */}
      <AnimatePresence>
        {showPreviewPopover && hoveredDeal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed z-50 pointer-events-none"
            style={{ 
              left: Math.min(previewPosition.x - 200, window.innerWidth - 420), 
              top: Math.min(previewPosition.y + 20, window.innerHeight - 400) 
            }}
          >
            <div className="w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-4 pointer-events-auto">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[200px]">{hoveredDeal.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{hoveredDeal.customerName}</p>
                </div>
                <button 
                  onClick={handleDealLeave}
                  className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                >
                  <XCircle className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    金额
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(hoveredDeal.value)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    伙伴
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300">{hoveredDeal.partnerName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    区域
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300">{hoveredDeal.region} · {hoveredDeal.city}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    预计结单
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300">{hoveredDeal.expectedCloseDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <Badge variant={hoveredDeal.isPriority ? 'warning' : 'default'} size="sm">
                  {hoveredDeal.isPriority ? '重点' : '普通'}
                </Badge>
                <Badge className={STAGE_CONFIG[hoveredDeal.stage].bgColor + ' ' + STAGE_CONFIG[hoveredDeal.stage].color} size="sm">
                  {STAGE_CONFIG[hoveredDeal.stage].label}
                </Badge>
              </div>

              {hoveredDeal.daysInCurrentStage !== undefined && (
                <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">当前阶段停留</span>
                    <span className={hoveredDeal.isStagnant ? 'text-red-500' : 'text-neutral-700 dark:text-neutral-300'}>
                      {hoveredDeal.daysInCurrentStage} 天
                      {hoveredDeal.isStagnant && ' (异常)'}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => { navigate(`/deals/${hoveredDeal.id}`); handleDealLeave(); }}
                className="w-full mt-3 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
              >
                查看详情
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 赢单/丢单综合分析面板 */}
      <WinLossPanel
        open={showWinLossPanel}
        onClose={() => setShowWinLossPanel(false)}
        deals={deals}
        onNavigateDeal={(dealId) => { setShowWinLossPanel(false); navigate(`/deals/${dealId}`); }}
      />

      {/* 规则引擎面板 */}
      <RuleEnginePanel
        open={showRuleEngine}
        onClose={() => setShowRuleEngine(false)}
      />
    </div>
  );
};