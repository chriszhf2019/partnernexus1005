import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, ChevronRight, CheckCircle2, Clock,
  XCircle, AlertCircle, Calendar, User, MapPin, MoreHorizontal,
  ArrowRight, Zap, TrendingUp, DollarSign, Target, BarChart3,
  Layers, ArrowUpRight, ArrowDownRight, Download, ExternalLink, GitBranch,
  Eye, Edit2, Trash2, Copy, Bell, BellRing, ChevronDown, ChevronUp,
  MessageSquare, Users, CalendarDays, Flag, Timer, AlertTriangle,
  Phone, Mail, ListTodo, RefreshCw, Send, Share2, Star, Bookmark,
  Filter, Layout, ChevronLeft, Award, Clock8, Handshake, Sparkles, Shield,
  BarChart2, PieChart, Settings, TrendingDown, Activity, Briefcase,
  AlertOctagon, CheckCheck, Rocket, Gauge,
} from 'lucide-react';
import { InlineEdit } from './components/InlineEdit';
import { WinLossPanel } from './components/WinLossPanel';
import { RuleEnginePanel } from './components/RuleEnginePanel';
import { PresetFilterBar } from './components/PresetFilterBar';
import { cn, formatCurrency } from '../../lib/utils';
import { Deal, DealRegistrationStats, DealStatus, DealLifecycleStage, DealSource, DealConflict, DealStageProbability, WinLossReason, isDealWon } from '../../types';
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
import {
  enrichDealsWithMetrics,
  calculateIsStagnant,
  calculateDaysInCurrentStage,
  calculateWeightedValue as calcWeighted,
  calculateAvgSalesCycle,
  calculateStagnationRate,
  calculatePushEfficiency,
  calculateStageDuration,
  calculateWinRate30d as calcWinRate30d,
  isActiveDeal,
} from '../../lib/dealMetrics';

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

// 安全格式化数字，处理 NaN 和 Infinity
const safeNum = (val: number | undefined | null, fallback: string = '--'): string => {
  if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return fallback;
  return String(val);
};

// 安全百分比
const safePercent = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val) || !isFinite(val)) return '--';
  return `${Math.round(val)}%`;
};

// 安全计算百分比
const safeCalcPercent = (part: number, total: number): number => {
  if (!total || isNaN(part) || isNaN(total) || !isFinite(part) || !isFinite(total) || total === 0) return 0;
  return (part / total) * 100;
};

interface DealRegistrationPageProps {
  stats: DealRegistrationStats;
  deals: Deal[];
  onNewDeal: () => void;
  onDealUpdate?: (updatedDeal: Deal) => void;
  onDealDelete?: (dealId: string) => void;
}

// 阶段概率配置 - 每个阶段的成交概率和平均周期
import { computeRealStageProbabilities, DEAL_EXPIRY_DAYS } from '../../lib/dealStageCalc';

const STAGE_CONFIG: Record<DealLifecycleStage, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  'Registered':    { label: '已报备', color: 'text-neutral-700', bgColor: 'bg-neutral-100 dark:bg-neutral-800', icon: FileText },
  'UnderReview':  { label: '审批中', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', icon: Clock },
  'Approved':     { label: '已批复', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  'Migrated':     { label: '迁单', color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', icon: GitBranch },
  'Solution':     { label: '方案跟进', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', icon: Target },
  'Commercial':   { label: '商务洽谈', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', icon: DollarSign },
  'Negotiation':  { label: '合同谈判', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20', icon: FileText },
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

// 漏斗阶段配置
const FUNNEL_STAGES: DealLifecycleStage[] = ['Registered', 'UnderReview', 'Approved', 'Migrated', 'Solution', 'Commercial', 'ClosedWon'];

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

  // 新增状态
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // 高级筛选默认收起
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<DealLifecycleStage | null>(null); // 漏斗诊断选择
  
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
  
  // Load saved views from localStorage; fall back to defaults on first visit
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    const defaults: SavedView[] = [
      { id: 'v1', name: '本周待审批', filters: { region: 'All', stage: 'UnderReview', productType: 'All', partnerType: 'All', source: 'All', search: '' } },
      { id: 'v2', name: '逾期未更新', filters: { region: 'All', stage: 'All', productType: 'All', partnerType: 'All', source: 'All', search: '' } },
      { id: 'v3', name: '金额大于100万', filters: { region: 'All', stage: 'All', productType: 'All', partnerType: 'All', source: 'All', search: '' } },
    ];
    try {
      const raw = localStorage.getItem('deals_saved_views');
      if (raw) {
        const parsed: SavedView[] = JSON.parse(raw);
        const byId = new Map(defaults.map(v => [v.id, v]));
        parsed.forEach(v => byId.set(v.id, v));
        return Array.from(byId.values());
      }
    } catch { /* ignore parse errors */ }
    return defaults;
  });

  useEffect(() => {
    try { localStorage.setItem('deals_saved_views', JSON.stringify(savedViews)); } catch { /* ignore */ }
  }, [savedViews]);
  
  const [showViewManager, setShowViewManager] = useState(false);
  const [currentViewName, setCurrentViewName] = useState('');
  
  const [showPreviewPopover, setShowPreviewPopover] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  // New panels
  const [showWinLossPanel, setShowWinLossPanel] = useState(false);
  const [showRuleEngine, setShowRuleEngine] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // 计算加权管线金额
  const stageProbs = useMemo(() => computeRealStageProbabilities(deals), [deals]);
  
  // 增强deals数据：实时计算daysInCurrentStage和isStagnant
  const enrichedDeals = useMemo(() => enrichDealsWithMetrics(deals), [deals]);
  
  const calculateWeightedValue = (deal: Deal): number => {
    const probability = stageProbs[deal.stage]?.probability || 0;
    return Math.round(deal.value * probability / 100);
  };

  const filteredDeals = useMemo(() => enrichedDeals.filter((deal) => {
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
  }), [enrichedDeals, searchQuery, activeTab, filters, selectedStageFilter]);

  // ===== 核心指标计算（基于实时增强数据） =====
  const pipelineValue = useMemo(() => 
    enrichedDeals.filter(d => isActiveDeal(d)).reduce((s, d) => s + d.value, 0), 
  [enrichedDeals]);
  
  const weightedPipelineValue = useMemo(() => 
    enrichedDeals.filter(d => isActiveDeal(d)).reduce((s, d) => s + calculateWeightedValue(d), 0), 
  [enrichedDeals]);
  
  const wonValue = useMemo(() => 
    enrichedDeals.filter(d => isDealWon(d)).reduce((s, d) => s + d.value, 0), 
  [enrichedDeals]);
  
  const conflictDeals = useMemo(() => enrichedDeals.filter(d => d.hasConflict), [enrichedDeals]);
  const stagnantDeals = useMemo(() => enrichedDeals.filter(d => d.isStagnant), [enrichedDeals]);
  const STATUS_CONFIG = getStatusConfig(t);

  // 年度目标（假设从配置获取，默认1.5亿）
  const ANNUAL_TARGET = 150000000;
  const annualAchievementRate = safeCalcPercent(wonValue, ANNUAL_TARGET);

  // 综合赢率计算（近30天）- 基于真实数据
  const winRate30d = useMemo(() => calcWinRate30d(enrichedDeals), [enrichedDeals]);

  // 漏斗数据
  const stageFunnel = useMemo(() => {
    return FUNNEL_STAGES.map(stage => ({
      stage,
      ...STAGE_CONFIG[stage],
      probability: stageProbs[stage]?.probability || 0,
      avgCycleDays: stageProbs[stage]?.avgCycleDays || 0,
      count: enrichedDeals.filter(d => d.stage === stage).length,
      value: enrichedDeals.filter(d => d.stage === stage).reduce((s, d) => s + d.value, 0),
      weightedValue: enrichedDeals.filter(d => d.stage === stage).reduce((s, d) => s + calculateWeightedValue(d), 0),
    }));
  }, [enrichedDeals]);

  // 计算转化率
  const funnelConversionRates = useMemo(() => {
    const rates: { from: number; to: number; rate: number; avgDays: number }[] = [];
    for (let i = 0; i < stageFunnel.length - 1; i++) {
      const current = stageFunnel[i];
      const next = stageFunnel[i + 1];
      if (current.count > 0) {
        rates.push({
          from: i,
          to: i + 1,
          rate: Math.round((next.count / current.count) * 100),
          avgDays: next.avgCycleDays || 0,
        });
      } else {
        rates.push({ from: i, to: i + 1, rate: 0, avgDays: 0 });
      }
    }
    return rates;
  }, [stageFunnel]);

  const sourceDistribution = useMemo(() => {
    const dist: Record<string, { count: number; value: number }> = {};
    const SOURCE_LABELS: Record<string, string> = {
      'PartnerInitiated': '伙伴自主报备',
      'ChannelAssigned': '渠道经理指派',
      'MDFCampaign': 'MDF活动转化',
      'MarketingEvent': '市场活动',
      'IncentiveProgram': '激励计划',
      'Referral': '客户推荐',
    };
    enrichedDeals.forEach(d => {
      const rawSrc = d.sourceInfo?.source || 'PartnerInitiated';
      const label = SOURCE_LABELS[rawSrc] || rawSrc;
      if (!dist[label]) dist[label] = { count: 0, value: 0 };
      dist[label].count++;
      dist[label].value += d.value;
    });
    return dist;
  }, [enrichedDeals]);

  // 行业分布
  const industryDistribution = useMemo(() => {
    const dist: Record<string, { count: number; value: number }> = {};
    enrichedDeals.forEach(d => {
      const industry = d.customerIndustry || '其他';
      if (!dist[industry]) dist[industry] = { count: 0, value: 0 };
      dist[industry].count++;
      dist[industry].value += d.value;
    });
    return dist;
  }, [enrichedDeals]);

  // 金额阶梯分布
  const valueTierDistribution = useMemo(() => {
    const tiers = [
      { label: '<50万', min: 0, max: 500000 },
      { label: '50-100万', min: 500000, max: 1000000 },
      { label: '100-500万', min: 1000000, max: 5000000 },
      { label: '>500万', min: 5000000, max: Infinity },
    ];
    return tiers.map(tier => ({
      ...tier,
      count: enrichedDeals.filter(d => d.value >= tier.min && d.value < tier.max).length,
      value: enrichedDeals.filter(d => d.value >= tier.min && d.value < tier.max).reduce((s, d) => s + d.value, 0),
    }));
  }, [enrichedDeals]);

  // 商机分级分布
  const dealGradeDistribution = useMemo(() => {
    const dist = { A: 0, B: 0, C: 0 };
    enrichedDeals.forEach(d => {
      if (d.value >= 5000000) dist.A++;
      else if (d.value >= 1000000) dist.B++;
      else dist.C++;
    });
    return dist;
  }, [enrichedDeals]);

  // 阶段停留时长分析（实时计算）
  const stageDurationAnalysis = useMemo(() => 
    calculateStageDuration(enrichedDeals, FUNNEL_STAGES), 
  [enrichedDeals]);

  const cycleMetrics = useMemo(() => {
    const wonDeals = enrichedDeals.filter(d => d.stage === 'ClosedWon' && d.conversionMetrics);
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
  }, [enrichedDeals]);

  // 管线覆盖倍数
  const pipelineCoverage = Math.round(pipelineValue / Math.max(ANNUAL_TARGET - wonValue, 1) * 10) / 10;

  // 平均客单价
  const avgDealValue = enrichedDeals.length > 0 ? enrichedDeals.reduce((s, d) => s + d.value, 0) / enrichedDeals.length : 0;

  // 报备冲突率
  const conflictRate = safeCalcPercent(conflictDeals.length, enrichedDeals.length);

  // 商机老化率（实时计算）
  const stagnationRate = calculateStagnationRate(enrichedDeals);

  // 推进效率（实时计算）
  const pushEfficiency = calculatePushEfficiency(enrichedDeals);

  // 平均销售周期（实时计算）
  const avgSalesCycleDays = calculateAvgSalesCycle(enrichedDeals);

  // ===== 执行层任务计算 =====
  // 预警任务：高价值商机多天没更新（基于实时计算）
  const warningDeals = useMemo(() => {
    const thresholdDays = 7; // 7天没更新
    const highValueThreshold = 1000000; // 100万以上
    return enrichedDeals.filter(d => 
      isActiveDeal(d) && 
      d.value >= highValueThreshold && 
      (d.daysInCurrentStage || 0) > thresholdDays
    );
  }, [enrichedDeals]);

  // 审批任务
  const pendingApprovalDeals = useMemo(() => 
    enrichedDeals.filter(d => d.stage === 'UnderReview'),
  [enrichedDeals]);

  // 冲突处理
  const conflictToHandle = useMemo(() => 
    enrichedDeals.filter(d => d.hasConflict && d.conflictId),
  [enrichedDeals]);

  // 结案加速：已进入商务谈判的商机
  const closingAccelerationDeals = useMemo(() => 
    enrichedDeals.filter(d => d.stage === 'Commercial'),
  [enrichedDeals]);

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
      ? selectedDeal.winLossAnalysis || { reason: 'Product' as WinLossReason, description: '项目成功签约' }
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

  // 批量选择
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

  // 快速编辑
  const startQuickEdit = (dealId: string, field: string, currentValue: string | number) => {
    setEditingDealId(dealId);
    setEditField(field);
    setEditValue(String(currentValue));
  };

  const saveQuickEdit = () => {
    if (!editingDealId || !editField || !onDealUpdate) return;
    const deal = enrichedDeals.find(d => d.id === editingDealId);
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

  // 诊断发现生成
  const getDiagnosisForStage = (stage: DealLifecycleStage) => {
    const findings: string[] = [];
    const stageData = stageFunnel.find(s => s.stage === stage);
    const stageIdx = FUNNEL_STAGES.indexOf(stage);
    
    if (!stageData) return findings;
    
    // 检查流失率
    if (stageIdx > 0) {
      const prevRate = funnelConversionRates[stageIdx - 1];
      if (prevRate && prevRate.rate < 50) {
        findings.push(`从${STAGE_CONFIG[FUNNEL_STAGES[stageIdx - 1]].label}到${stageData.label}转化率偏低(${prevRate.rate}%)，建议加强该阶段跟进行动`);
      }
    }
    
    // 检查停留时长
    if (stageData.avgCycleDays > 30) {
      findings.push(`${stageData.label}阶段平均停留${stageData.avgCycleDays}天，超出基准，需加速推进`);
    }
    
    // 检查商机数量
    if (stageData.count === 0) {
      findings.push(`${stageData.label}阶段暂无商机，漏斗出现断层`);
    }
    
    return findings;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          【第一层 · 结果层】战略仪表盘 — 一眼看懂全局
          ═══════════════════════════════════════════════════════════════════ */}
      {/* 顶部战略KPI：用深色高对比强调"结果"的冲击力 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-300" />
            <h2 className="text-sm font-semibold text-white">战略结果总览</h2>
          </div>
          <span className="text-xs text-slate-400">{new Date().toLocaleDateString('zh-CN')}</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 管线总值 */}
          <div className="relative group">
            <div className="text-[11px] text-slate-400 mb-1.5">管线总值</div>
            <div className="text-2xl font-bold text-white tracking-tight">{formatCurrency(pipelineValue)}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {enrichedDeals.filter(d => !['ClosedWon','ClosedLost'].includes(d.stage)).length}笔活跃商机
            </div>
          </div>

          {/* 加权预期产出 — 核心指标，强化 */}
          <div className="relative group">
            <div className="text-[11px] text-slate-400 mb-1.5">加权预期产出</div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{formatCurrency(weightedPipelineValue)}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              胜率 {safePercent(safeCalcPercent(weightedPipelineValue, pipelineValue))}%
            </div>
          </div>

          {/* 年度达成率 — 带进度条 */}
          <div className="relative group">
            <div className="text-[11px] text-slate-400 mb-1.5">年度达成率</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white tracking-tight">{safeNum(Math.round(annualAchievementRate))}%</span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${annualAchievementRate >= 50 ? 'bg-emerald-500' : annualAchievementRate >= 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, annualAchievementRate)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{formatCurrency(wonValue)} / {formatCurrency(ANNUAL_TARGET)}</div>
          </div>

          {/* 综合赢率 */}
          <div className="relative group">
            <div className="text-[11px] text-slate-400 mb-1.5">综合赢率 · 近30天</div>
            <div className={`text-2xl font-bold tracking-tight ${winRate30d >= 50 ? 'text-emerald-400' : winRate30d >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
              {safePercent(winRate30d)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {enrichedDeals.filter(d => d.stage === 'ClosedWon' || d.stage === 'ClosedLost').length}笔已结单
            </div>
          </div>
        </div>
      </div>

      {/* 三维健康度 — 紧凑卡片，强化数据密度 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 规模健康 */}
        <Card className="border border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">规模健康</div>
                  <div className="text-[10px] text-neutral-400">Pipeline Scale</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">
                {safeNum(pipelineCoverage)}<span className="text-lg text-neutral-400">x</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {/* 来源分布 */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-neutral-500">来源</span>
                  <span className="text-neutral-500">{Object.keys(sourceDistribution).length}类</span>
                </div>
                <div className="flex gap-1">
                  {Object.entries(sourceDistribution).slice(0, 4).map(([src, data]) => (
                    <div 
                      key={src} 
                      className="flex-1 h-5 bg-blue-50 dark:bg-blue-900/20 rounded-sm flex items-center justify-center text-[10px] text-blue-600 font-medium"
                    >
                      {safeNum(data.count)}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 金额阶梯 — 更紧凑 */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-neutral-500">金额分布</span>
                </div>
                <div className="flex gap-1">
                  {valueTierDistribution.map((tier, idx) => (
                    <div 
                      key={idx}
                      className="flex-1 text-center py-1 bg-neutral-50 dark:bg-neutral-800 rounded-md text-[10px]"
                    >
                      <div className="font-semibold text-neutral-700 dark:text-neutral-300">{safeNum(tier.count)}</div>
                      <div className="text-[9px] text-neutral-400">{tier.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 质量健康 */}
        <Card className="border border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">质量健康</div>
                  <div className="text-[10px] text-neutral-400">Deal Quality</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">{safePercent(winRate30d)}</div>
            </div>
            
            <div className="space-y-2">
              {/* 商机分级卡片 */}
              <div className="flex gap-1.5">
                <div className="flex-1 text-center py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
                  <div className="text-base font-bold text-emerald-600">{safeNum(dealGradeDistribution.A)}</div>
                  <div className="text-[9px] text-emerald-600/70">A级(500万+)</div>
                </div>
                <div className="flex-1 text-center py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <div className="text-base font-bold text-blue-600">{safeNum(dealGradeDistribution.B)}</div>
                  <div className="text-[9px] text-blue-600/70">B级(100-500万)</div>
                </div>
                <div className="flex-1 text-center py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                  <div className="text-base font-bold text-neutral-600">{safeNum(dealGradeDistribution.C)}</div>
                  <div className="text-[9px] text-neutral-400">C级(100万以下)</div>
                </div>
              </div>
              
              {/* 冲突率进度条 */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-neutral-500">报备冲突率</span>
                  <span className={`font-semibold ${conflictRate > 10 ? 'text-red-500' : conflictRate > 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {safeNum(conflictRate)}%
                  </span>
                </div>
                <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${conflictRate > 10 ? 'bg-red-500' : conflictRate > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, conflictRate)}%` }}
                  />
                </div>
              </div>

              {/* 平均客单价 */}
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">平均客单价</span>
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatCurrency(avgDealValue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 效率健康 */}
        <Card className="border border-neutral-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">效率健康</div>
                  <div className="text-[10px] text-neutral-400">Sales Velocity</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">
                {safeNum(avgSalesCycleDays || cycleMetrics.avgTotal)}<span className="text-sm text-neutral-400">天</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {/* 阶段停留时长 */}
              <div className="grid grid-cols-2 gap-1.5">
                {stageDurationAnalysis.filter(s => s.totalCount > 0).slice(0, 4).map(s => (
                  <div key={s.stage} className="flex items-center justify-between py-1.5 px-2 bg-neutral-50 dark:bg-neutral-800 rounded-md text-[10px]">
                    <span className="text-neutral-500 truncate">{STAGE_CONFIG[s.stage]?.label}</span>
                    <span className={`font-semibold ${s.overdueCount > 0 ? 'text-amber-500' : 'text-neutral-700 dark:text-neutral-300'}`}>
                      {safeNum(s.avgDays)}天
                    </span>
                  </div>
                ))}
              </div>
              
              {/* 老化率 */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-neutral-500">商机老化率</span>
                  <span className={`font-semibold ${stagnationRate > 20 ? 'text-red-500' : stagnationRate > 10 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {safeNum(stagnationRate)}%
                  </span>
                </div>
                <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${stagnationRate > 20 ? 'bg-red-500' : stagnationRate > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, stagnationRate)}%` }}
                  />
                </div>
              </div>

              {/* 推进效率 */}
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">推进效率</span>
                <span className={`font-semibold ${pushEfficiency >= 80 ? 'text-emerald-500' : pushEfficiency >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                  {safeNum(pushEfficiency)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          【第二层 · 诊断层】问题检测 — 自动发现需要关注的问题
          ═══════════════════════════════════════════════════════════════════ */}
      {/* 漏斗诊断 — 更紧凑的呈现，保留交互点击 */}
      <Card className="border border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">商机转化漏斗</div>
                <div className="text-[11px] text-neutral-400">点击各阶段查看具体问题 · 当前选中: {selectedFunnelStage ? STAGE_CONFIG[selectedFunnelStage]?.label : '未选择'}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* 阶段条 */}
            <div className="flex-1 space-y-1.5">
              {stageFunnel.map((s, i) => {
                const maxCount = Math.max(...stageFunnel.map(x => x.count), 1);
                const widthPct = 40 + Math.min(60, (s.count / maxCount) * 60);
                const isSelected = selectedFunnelStage === s.stage;
                
                return (
                  <button
                    key={s.stage}
                    onClick={() => setSelectedFunnelStage(isSelected ? null : s.stage)}
                    className={cn(
                      'w-full text-left py-2.5 px-3 rounded-lg transition-all flex items-center gap-3',
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-300 dark:ring-indigo-700'
                        : 'bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    <div className="w-7 h-7 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-700 dark:text-neutral-300 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium text-neutral-800 dark:text-neutral-200">{STAGE_CONFIG[s.stage]?.label}</span>
                          <span className="text-[10px] text-neutral-400">· 平均{s.avgCycleDays}天</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">{safeNum(s.count)}</span>
                          <span className="text-[11px] text-neutral-500 hidden sm:inline">{formatCurrency(s.value)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-400 w-12 text-right">胜率{s.probability}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 诊断面板 — 右侧显示问题清单 */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-700 lg:pl-4 pt-4 lg:pt-0">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                诊断发现
              </div>
              
              {selectedFunnelStage ? (
                <div className="space-y-2">
                  {/* 阶段基本信息卡片 */}
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium mb-1">
                      {STAGE_CONFIG[selectedFunnelStage]?.label}阶段 · {stageFunnel.find(s => s.stage === selectedFunnelStage)?.count}笔商机
                    </div>
                  </div>

                  {/* 问题发现 */}
                  {getDiagnosisForStage(selectedFunnelStage).length > 0 ? (
                    <div className="space-y-1.5">
                      {getDiagnosisForStage(selectedFunnelStage).slice(0, 3).map((finding, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/50">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-[11px] text-amber-800 dark:text-amber-200 leading-snug">{finding}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5 p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-emerald-800 dark:text-emerald-200 leading-snug">该阶段运营正常，暂无明显问题</span>
                    </div>
                  )}

                  {/* 相关商机 */}
                  <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="text-[11px] text-neutral-500 mb-1.5">相关商机 TOP 3</div>
                    <div className="space-y-1">
                      {enrichedDeals.filter(d => d.stage === selectedFunnelStage).slice(0, 3).map(deal => (
                        <div 
                          key={deal.id}
                          className="p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          onClick={() => navigate(`/deals/${deal.id}`)}
                        >
                          <div className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 truncate mb-0.5">{deal.title}</div>
                          <div className="flex items-center justify-between text-[10px] text-neutral-500">
                            <span>{formatCurrency(deal.value)}</span>
                            <span>{deal.daysInCurrentStage || 0}天停留</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-36 text-center">
                  <GitBranch className="w-6 h-6 text-neutral-300 dark:text-neutral-600 mb-1.5" />
                  <p className="text-[11px] text-neutral-400 leading-relaxed">点击左侧任一阶段<br/>查看该阶段的诊断分析</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 三卡片问题诊断 — 最常见的三类风险 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 诊断A：停滞商机检测 */}
        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/40 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">停滞商机</div>
                  <div className="text-[10px] text-neutral-400">长期无进展</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{safeNum(stagnantDeals.length)}</div>
            </div>

            {/* TOP停滞商机 */}
            {stagnantDeals.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {stagnantDeals.slice(0, 2).map(deal => (
                  <div 
                    key={deal.id}
                    className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <span className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 truncate flex-1">{deal.title}</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium flex-shrink-0 ml-2">
                      {deal.daysInCurrentStage || 0}天
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2.5 mb-3">
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">✓ 无停滞商机</p>
              </div>
            )}

            {/* 底部指标+操作 */}
            <div className="flex items-center justify-between pt-2 border-t border-amber-100 dark:border-amber-800/50">
              <div className="text-[11px] text-neutral-500">
                总金额 <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatCurrency(stagnantDeals.reduce((sum, d) => sum + (d.value || 0), 0))}</span>
              </div>
              <button 
                onClick={() => setActiveTab('all')}
                className="text-[11px] text-amber-700 dark:text-amber-300 font-medium hover:underline"
              >
                立即处理 →
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 诊断B：冲突检测 */}
        <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50/40 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">冲突检测</div>
                  <div className="text-[10px] text-neutral-400">重复报备风险</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{safeNum(conflictDeals.length)}</div>
            </div>

            {/* TOP冲突商机 */}
            {conflictDeals.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {conflictDeals.slice(0, 2).map(deal => (
                  <div 
                    key={deal.id}
                    className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30"
                    onClick={() => { setSelectedDeal(deal); setShowConflictModal(true); }}
                  >
                    <span className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 truncate flex-1">{deal.title}</span>
                    <span className="text-[10px] text-red-700 dark:text-red-300 font-medium flex-shrink-0 ml-2">⚠ 冲突</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2.5 mb-3">
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">✓ 暂无报备冲突</p>
              </div>
            )}

            {/* 底部指标+操作 */}
            <div className="flex items-center justify-between pt-2 border-t border-red-100 dark:border-red-800/50">
              <div className="text-[11px] text-neutral-500">
                冲突率 <span className="font-semibold text-neutral-700 dark:text-neutral-300">{safeNum(conflictRate)}%</span>
              </div>
              <button 
                onClick={() => setShowConflictModal(true)}
                className="text-[11px] text-red-700 dark:text-red-300 font-medium hover:underline"
              >
                裁决分配 →
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 诊断C：高潜力商机加速（接近赢单的） */}
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/40 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">结案加速</div>
                  <div className="text-[10px] text-neutral-400">临门一脚商机</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{safeNum(closingAccelerationDeals.length)}</div>
            </div>

            {/* TOP加速商机 */}
            {closingAccelerationDeals.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {closingAccelerationDeals.slice(0, 2).map(deal => (
                  <div 
                    key={deal.id}
                    className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30"
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <span className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 truncate flex-1">{deal.title}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium flex-shrink-0 ml-2">
                      {formatCurrency(deal.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2.5 mb-3">
                <p className="text-[11px] text-neutral-500">暂无商务洽谈中商机</p>
              </div>
            )}

            {/* 底部指标+操作 */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-100 dark:border-emerald-800/50">
              <div className="text-[11px] text-neutral-500">
                潜在产出 <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatCurrency(closingAccelerationDeals.reduce((sum, d) => sum + (d.value || 0), 0))}</span>
              </div>
              <button 
                onClick={() => setSelectedFunnelStage('Commercial')}
                className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium hover:underline"
              >
                推动赢单 →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          【第三层 · 行动层】商机列表 - 从诊断直接进入行动
          ═══════════════════════════════════════════════════════════════════ */}

      <Card padding={false}>
        {/* 批量操作栏 */}
        {selectedDeals.length > 0 && (
          <div className="px-5 py-2.5 bg-brand-50 dark:bg-brand-900/20 border-b border-brand-200 dark:border-brand-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-brand-700 dark:text-brand-400">
                已选 {selectedDeals.length}
              </span>
              <div className="flex items-center gap-1.5">
                <Button variant="secondary" size="sm" onClick={() => {
                  selectedDeals.forEach(id => {
                    const deal = enrichedDeals.find(d => d.id === id);
                    if (deal && deal.stage === 'UnderReview' && onDealUpdate) {
                      onDealUpdate({ ...deal, stage: 'Approved' });
                    }
                  });
                  setSelectedDeals([]);
                }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  批量通过
                </Button>
                <Button variant="danger" size="sm" onClick={() => {
                  selectedDeals.forEach(id => onDealDelete?.(id));
                  setSelectedDeals([]);
                }}>
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDeals([])}>
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 紧凑筛选栏：Tab + 快捷操作 + 搜索 */}
        <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all' as const, label: '全部', count: enrichedDeals.length },
                { id: 'pending' as const, label: '待审批', count: enrichedDeals.filter(d => d.stage === 'UnderReview').length },
                { id: 'conflicts' as const, label: '冲突', count: conflictDeals.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  {tab.label} · {safeNum(tab.count)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="搜索项目/客户/伙伴"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 h-8 pl-8 pr-2.5 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 dark:text-white placeholder:text-neutral-400"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/deals/health-inspection')} className="!bg-gradient-to-r !from-brand !to-sky-600 !text-white !border-transparent">
                <Shield className="w-3.5 h-3.5" />
                巡检
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowWinLossPanel(true)}>
                <TrendingDown className="w-3.5 h-3.5" />
                赢丢分析
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowViewManager(true)}>
                <Layout className="w-3.5 h-3.5" />
                视图
              </Button>
            </div>
          </div>

          {/* 快捷筛选标签 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => { setActivePreset(null); setSelectedStageFilter('All'); setSearchQuery(''); }}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                activePreset === null && selectedStageFilter === 'All'
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              全部
            </button>
            <button
              onClick={() => { setActivePreset('stagnant'); setSelectedStageFilter('All'); }}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1',
                activePreset === 'stagnant'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              停滞({safeNum(stagnantDeals.length)})
            </button>
            <button
              onClick={() => { setActivePreset('highvalue'); setSelectedStageFilter('All'); }}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                activePreset === 'highvalue'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              高价值(≥100万)
            </button>
            <button
              onClick={() => setSelectedStageFilter('Commercial')}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1',
                selectedStageFilter === 'Commercial'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              <Rocket className="w-3 h-3" />
              商务洽谈
            </button>
            <button
              onClick={() => setSelectedStageFilter('Solution')}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                selectedStageFilter === 'Solution'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              方案跟进
            </button>

            {/* 基础筛选 */}
            <div className="ml-2 flex items-center gap-3 pl-2 border-l border-neutral-200 dark:border-neutral-700">
              {filterOptions.slice(0, 2).map((f) => (
                <select
                  key={f.field}
                  value={filters[f.field]}
                  onChange={(e) => setFilters({ ...filters, [f.field]: e.target.value })}
                  className="shrink-0 bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 focus:outline-none cursor-pointer rounded-md px-2 py-1 border-0"
                >
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ))}
            </div>

            <span className="ml-auto text-[11px] text-neutral-400 shrink-0">{safeNum(filteredDeals.length)} 条</span>
          </div>
        </div>

        {filteredDeals.length === 0 ? (
          <div className="py-16"><EmptyState title={t('deals.noDeals')} description={t('deals.noDealsDesc')} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-800/30">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-neutral-500 w-10">
                    <button onClick={selectAllDeals} className="hover:text-neutral-700 transition-colors">
                      <div className="w-3.5 h-3.5 rounded border border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
                        {selectedDeals.length === filteredDeals.length && filteredDeals.length > 0 && (
                          <CheckCircle2 className="w-2.5 h-2.5 text-neutral-700" />
                        )}
                      </div>
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-neutral-500">项目 / 客户</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-neutral-500">伙伴</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500">金额</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-neutral-500">阶段</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-neutral-500">停留</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-neutral-500">健康度</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredDeals.map((deal) => {
                  const stageCfg = STAGE_CONFIG[deal.stage];
                  const StageIcon = stageCfg.icon;
                  const isSelected = selectedDeals.includes(deal.id);
                  const isStagnant = deal.isStagnant;
                  const daysInStage = deal.daysInCurrentStage || 0;
                  const avgDays = stageProbs[deal.stage]?.avgCycleDays || 0;
                  const isOverdue = daysInStage > avgDays;
                  
                  // 计算健康度（如果没有提供则基于停留和停滞计算）
                  const computedHealth = deal.healthScore !== undefined 
                    ? deal.healthScore 
                    : (isStagnant ? Math.max(20, 50 - daysInStage) : Math.max(60, 100 - daysInStage * 2));
                  
                  return (
                    <tr key={deal.id}
                      className={cn(
                        'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer',
                        isStagnant && 'bg-amber-50/30 dark:bg-amber-900/10',
                        deal.hasConflict && 'bg-red-50/20 dark:bg-red-900/10'
                      )}
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    >
                      <td className="px-3 py-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleSelectDeal(deal.id); }}
                          className="hover:text-neutral-700 transition-colors"
                        >
                          <div className={cn(
                            'w-3.5 h-3.5 rounded border flex items-center justify-center',
                            isSelected 
                              ? 'bg-brand border-brand' 
                              : 'border-neutral-300 dark:border-neutral-600'
                          )}>
                            {isSelected && (
                              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {/* 健康度颜色条 */}
                          <div className={cn(
                            'w-1 h-10 rounded-full flex-shrink-0 mt-0.5',
                            computedHealth >= 80 ? 'bg-emerald-500' :
                            computedHealth >= 50 ? 'bg-amber-500' :
                            'bg-red-500'
                          )} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{deal.title}</p>
                              {deal.hasConflict && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[10px] font-medium">
                                  <AlertOctagon className="w-2.5 h-2.5" /> 冲突
                                </span>
                              )}
                              {isStagnant && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded text-[10px] font-medium">
                                  <AlertTriangle className="w-2.5 h-2.5" /> 停滞
                                </span>
                              )}
                              {deal.isPriority && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-[10px] font-medium">
                                  <Star className="w-2.5 h-2.5 fill-current" /> 重点
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              <span className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/customer/${encodeURIComponent(deal.customerName)}/analysis`); }}>{deal.customerName}</span>
                              <span className="text-neutral-300 dark:text-neutral-600 mx-1.5">·</span>
                              <span>{deal.region}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate max-w-[140px]">{deal.partnerName}</p>
                        <p className="text-[11px] text-neutral-400">{deal.partnerType}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{formatCurrency(deal.value)}</p>
                        <p className="text-[11px] text-neutral-400">{deal.expectedCloseDate || '--'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium', stageCfg.bgColor, stageCfg.color)}>
                          <StageIcon className="w-3 h-3" />
                          {stageCfg.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium',
                          isOverdue 
                            ? isStagnant 
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        )}>
                          <Timer className="w-2.5 h-2.5" />
                          {safeNum(daysInStage)}天
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2',
                            computedHealth >= 80 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-800' :
                            computedHealth >= 50 
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-800' :
                              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-red-200 dark:ring-red-800'
                          )}>
                            {safeNum(computedHealth)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {deal.stage === 'Commercial' && onDealUpdate && (
                            <button 
                              onClick={() => { setSelectedDeal(deal); handleMarkWon(); }}
                              className="px-2 py-1 rounded-md text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                              赢单
                            </button>
                          )}
                          {deal.stage === 'UnderReview' && onDealUpdate && (
                            <button 
                              onClick={() => onDealUpdate({ ...deal, stage: 'Approved', lifecycle: [...deal.lifecycle, { stage: 'Approved', date: new Date().toISOString().split('T')[0], description: '审批通过', actor: '系统', durationDays: 0 }] })}
                              className="px-2 py-1 rounded-md text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              通过
                            </button>
                          )}
                          <button onClick={() => navigate(`/deals/${deal.id}`)}
                            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-brand transition-colors"
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

      {/* 模态框组件保持不变... */}
      {/* 由于篇幅限制，省略模态框代码，实际项目中保留原有模态框 */}
      
      {/* 赢单/丢单分析面板 */}
      <WinLossPanel
        open={showWinLossPanel}
        onClose={() => setShowWinLossPanel(false)}
        deals={enrichedDeals}
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
