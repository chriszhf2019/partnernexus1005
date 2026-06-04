import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Search, Filter, ChevronRight, CheckCircle2, Clock,
  XCircle, AlertCircle, Calendar, User, MapPin, MoreHorizontal,
  ArrowRight, Zap, TrendingUp, DollarSign, Target, BarChart3,
  Layers, ArrowUpRight, ArrowDownRight, Download, ExternalLink, GitBranch,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Deal, DealRegistrationStats, DealStatus, DealLifecycleStage, DealSource, DealConflict } from '../../types';
import { DEAL_CONFLICTS } from '../../constants';
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

interface DealRegistrationPageProps {
  stats: DealRegistrationStats;
  deals: Deal[];
  onNewDeal: () => void;
  onDealUpdate?: (updatedDeal: Deal) => void;
}

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

export const DealRegistrationPage = ({ stats, deals, onNewDeal, onDealUpdate }: DealRegistrationPageProps) => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'conflicts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<DealConflict | null>(null);
  const [filters, setFilters] = useState({ region: 'All', stage: 'All' as string, productType: 'All' as string, partnerType: 'All' as string, source: 'All' as string });

  const filteredDeals = useMemo(() => deals.filter((deal) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = !s || deal.title.toLowerCase().includes(s) || deal.customerName.toLowerCase().includes(s) || deal.partnerName.toLowerCase().includes(s);
    const matchesTab = activeTab === 'all' || (activeTab === 'pending' && deal.stage === 'UnderReview') || (activeTab === 'conflicts' && deal.hasConflict);
    const matchesRegion = filters.region === 'All' || deal.region === filters.region;
    const matchesStage = filters.stage === 'All' || deal.stage === filters.stage;
    const matchesProduct = filters.productType === 'All' || deal.productType === filters.productType;
    const matchesPartnerType = filters.partnerType === 'All' || deal.partnerType === filters.partnerType;
    const matchesSource = filters.source === 'All' || (deal.sourceInfo && deal.sourceInfo.source === filters.source);
    return matchesSearch && matchesTab && matchesRegion && matchesStage && matchesProduct && matchesPartnerType && matchesSource;
  }), [deals, searchQuery, activeTab, filters]);

  const pipelineValue = useMemo(() => deals.filter(d => !['ClosedWon', 'ClosedLost'].includes(d.stage)).reduce((s, d) => s + d.value, 0), [deals]);
  const wonValue = useMemo(() => deals.filter(d => d.stage === 'ClosedWon').reduce((s, d) => s + d.value, 0), [deals]);
  const conflictDeals = useMemo(() => deals.filter(d => d.hasConflict), [deals]);
  const STATUS_CONFIG = getStatusConfig(t);

  const stageFunnel = useMemo(() => {
    const stages: DealLifecycleStage[] = ['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial', 'ClosedWon'];
    return stages.map(stage => ({
      stage,
      ...STAGE_CONFIG[stage],
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((s, d) => s + d.value, 0),
    }));
  }, [deals]);

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

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: t('deals.yearNew'), value: stats.yearNew, icon: Calendar, color: 'text-neutral-700' },
          { label: t('deals.quarterNew'), value: stats.quarterNew, icon: TrendingUp, color: 'text-blue-600' },
          { label: t('deals.pipelineTotal'), value: formatCurrency(pipelineValue), icon: DollarSign, color: 'text-purple-600' },
          { label: t('deals.wonValue'), value: formatCurrency(wonValue), icon: CheckCircle2, color: 'text-emerald-600' },
          { label: t('deals.conflictDeals'), value: conflictDeals.length, icon: AlertCircle, color: 'text-red-500' },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                <s.icon className={s.color} />
              </div>
              <div>
                <p className="text-xs text-neutral-500">{s.label}</p>
                <p className="text-xl font-semibold text-neutral-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('deals.lifecycleFunnel')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-48">
                {stageFunnel.map((s, i) => (
                  <div key={s.stage} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-36">
                      <div
                        className={cn('w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer', s.bgColor)}
                        style={{ height: `${Math.max(10, (s.count / Math.max(...stageFunnel.map(x => x.count))) * 100)}%` }}
                        title={`${s.label}: ${s.count}个 (${formatCurrency(s.value)})`}
                      >
                        <div className="h-full flex flex-col items-center justify-center text-white">
                          <span className="text-lg font-bold">{s.count}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className={cn('text-xs font-medium', s.color)}>{s.label}</p>
                      <p className="text-[10px] text-neutral-400">{formatCurrency(s.value)}</p>
                    </div>
                    {i < stageFunnel.length - 1 && stageFunnel[i + 1].count > 0 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                        <ArrowRight className="w-3 h-3 text-neutral-300" />
                      </div>
                    )}
                  </div>
                ))}
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
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedDeal(deal); setShowConflictModal(true); }}>
                            {t('common.view')}
                          </Button>
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

        {filteredDeals.length === 0 ? (
          <div className="py-16"><EmptyState title={t('deals.noDeals')} description={t('deals.noDealsDesc')} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colProject')}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colCustomer')}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colPartner')}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">来源</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colValue')}</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colStage')}</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('deals.colPriority')}</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredDeals.map((deal) => {
                  const stageCfg = STAGE_CONFIG[deal.stage];
                  const StageIcon = stageCfg.icon;
                  const sourceCfg = deal.sourceInfo ? SOURCE_CONFIG[deal.sourceInfo.source] : null;
                  return (
                    <tr
                      key={deal.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-brand transition-colors">{deal.title}</p>
                            {deal.hasConflict && <Badge variant="danger" size="sm">{t('deals.conflict')}</Badge>}
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> {deal.region} · {deal.city}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{deal.customerName}</p>
                        <p className="text-xs text-neutral-400">{deal.customerIndustry}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{deal.partnerName}</p>
                        <Badge variant="default" size="sm">{deal.partnerType}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {sourceCfg && (
                          <div className="flex items-center gap-2">
                            <sourceCfg.icon className="w-4 h-4 text-neutral-400" />
                            <span className="text-xs text-neutral-500">{sourceCfg.label}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{formatCurrency(deal.value)}</p>
                        <p className="text-xs text-neutral-400">{deal.expectedCloseDate}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', stageCfg.bgColor, stageCfg.color)}>
                          <StageIcon className="w-3.5 h-3.5" />
                          {stageCfg.label}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {deal.isPriority ? (
                          <Badge variant="warning" size="sm">{t('deals.priority')}</Badge>
                        ) : (
                          <span className="text-xs text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/deals/${deal.id}`); }}
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-brand transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
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
                          onClick={() => onDealUpdate?.({ ...selectedDeal, stage: 'ClosedWon', status: 'Closed Won', actualCloseDate: new Date().toISOString().split('T')[0], lifecycle: [...selectedDeal.lifecycle, { stage: 'ClosedWon', date: new Date().toISOString().split('T')[0], description: '项目赢单', actor: '系统', durationDays: 0 }] })}>
                          <TrendingUp className="w-4 h-4" /> {t('deals.markWon')}
                        </Button>
                        <Button variant="danger" size="sm" className="w-full"
                          onClick={() => onDealUpdate?.({ ...selectedDeal, stage: 'ClosedLost', status: 'Closed Lost', lifecycle: [...selectedDeal.lifecycle, { stage: 'ClosedLost', date: new Date().toISOString().split('T')[0], description: '项目丢单', actor: '系统', durationDays: 0 }] })}>
                          <XCircle className="w-4 h-4" /> {t('deals.markLost')}
                        </Button>
                      </>
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
                          onClick={() => { setSelectedConflict(DEAL_CONFLICTS.find(c => c.id === selectedDeal.conflictId) || null); setShowConflictModal(true); }}>
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

      <Modal open={showConflictModal && !!selectedConflict} onClose={() => { setShowConflictModal(false); setSelectedConflict(null); }} size="lg" title={t('deals.conflictManagement')}>
        {selectedConflict && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  {CONFLICT_TYPE_LABELS[selectedConflict.type] || selectedConflict.type}
                </span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-300">{selectedConflict.description}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">{t('deals.relatedDeals')}</h4>
              <div className="space-y-2">
                {selectedConflict.dealIds.map((dealId) => {
                  const deal = deals.find(d => d.id === dealId);
                  if (!deal) return null;
                  return (
                    <div key={dealId} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{deal.title}</p>
                          <p className="text-xs text-neutral-500">{deal.customerName} · {deal.partnerName}</p>
                        </div>
                        <Badge variant={deal.stage === 'ClosedLost' ? 'danger' : 'success'} size="sm">
                          {STAGE_CONFIG[deal.stage]?.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                <Button variant="brand" size="sm">
                  {t('deals.markResolved')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};