/**
 * 激励决策系统
 * AI Incentive Optimization System
 * 
 * 升级自 IncentivePolicyPage
 * 核心功能：
 * 1. Incentive Intelligence - 激励智能洞察
 * 2. Policy ROI Ranking - 政策ROI排行
 * 3. Budget Allocation Engine - 预算分配引擎
 * 4. Behavior Impact Analysis - 行为影响分析
 * 5. Action Center - 行动中心
 */

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target, Zap, 
  BarChart3, PieChart, Activity, AlertCircle, CheckCircle2, 
  Clock, ArrowRight, Play, Pause, Settings, RefreshCw,
  Award, Globe, Layers, Calculator, ChevronDown, ChevronUp,
  Eye, Filter, Sparkles, GitBranch, Timer, Percent
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { 
  EnrichedProgram, 
  EnrichedApplication,
  enrichPrograms, 
  enrichApplications 
} from '../../lib/incentiveMetrics';
import {
  generateROIRanking,
  generateROITrends,
  type ROIRanking,
  type PolicyROIResult,
} from '../../lib/incentiveEngine/policyEngine';
import {
  generateAllocationRecommendation,
  generateDefaultScenarios,
  CATEGORY_LABELS,
  type AllocationRecommendation,
  type PolicyAllocation,
} from '../../lib/incentiveEngine/allocationEngine';
import {
  analyzeBehaviorAttribution,
  generateIncentiveActions,
  BEHAVIOR_LABELS,
  type AttributionSummary,
  type IncentiveAction,
} from '../../lib/incentiveEngine/behaviorEngine';

// ── 类型定义 ──────────────────────────────────────────

type ViewMode = 'executive' | 'allocation' | 'attribution';
type DecisionTab = 'overview' | 'roi' | 'budget' | 'behavior';

interface IncentiveDecisionSystemProps {
  programs?: EnrichedProgram[];
  applications?: EnrichedApplication[];
  totalBudget?: number;
}

// ── 辅助组件 ──────────────────────────────────────────

const DecisionCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}> = ({ title, value, subtitle, trend, trendValue, icon, variant = 'default' }) => {
  const variantStyles = {
    default: 'border-neutral-200 dark:border-neutral-700',
    success: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    danger: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  };
  
  return (
    <div className={cn(
      'p-4 rounded-lg border bg-white dark:bg-neutral-800 transition-all',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
              <span className={cn(
                'text-xs font-medium',
                trend === 'up' && 'text-green-600 dark:text-green-400',
                trend === 'down' && 'text-red-600 dark:text-red-400',
                trend === 'stable' && 'text-neutral-500'
              )}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-2 rounded-lg',
          variant === 'success' && 'bg-green-100 dark:bg-green-900/40 text-green-600',
          variant === 'warning' && 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600',
          variant === 'danger' && 'bg-red-100 dark:bg-red-900/40 text-red-600',
          variant === 'default' && 'bg-brand-100 dark:bg-brand-900/40 text-brand-600'
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const ROIRankCard: React.FC<{ 
  result: PolicyROIResult; 
  rank: number;
}> = ({ result, rank }) => {
  const verdictStyles = {
    outperform: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    meet: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    underperform: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  };
  
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
        rank === 1 && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
        rank === 2 && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        rank === 3 && 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
        rank > 3 && 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
      )}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 dark:text-white truncate">{result.policyName}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {CATEGORY_LABELS[result.category]} • {result.contribution.partners}伙伴
        </p>
      </div>
      <div className="text-right">
        <p className={cn(
          'text-lg font-bold',
          result.roi >= result.baseline ? 'text-green-600' : 'text-red-600'
        )}>
          {result.roi.toFixed(1)}x
        </p>
        <span className={cn('text-xs px-2 py-0.5 rounded-full', verdictStyles[result.verdict])}>
          {result.verdict === 'outperform' ? '超标' : result.verdict === 'underperform' ? '低于' : '达标'}
        </span>
      </div>
    </div>
  );
};

const AllocationCard: React.FC<{
  allocation: PolicyAllocation;
}> = ({ allocation }) => {
  const actionStyles = {
    increase: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    decrease: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    maintain: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    activate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    pause: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  
  const actionLabels = {
    increase: '增投',
    decrease: '减少',
    maintain: '维持',
    activate: '启动',
    pause: '暂停',
  };
  
  return (
    <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-neutral-900 dark:text-white">{allocation.policyName}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {CATEGORY_LABELS[allocation.category]}
          </p>
        </div>
        <span className={cn('text-xs px-2 py-1 rounded-full font-medium', actionStyles[allocation.action])}>
          {actionLabels[allocation.action]}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">当前预算</p>
          <p className="text-sm font-medium">{formatCurrency(allocation.currentBudget)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">建议预算</p>
          <p className="text-sm font-medium text-brand-600">
            {formatCurrency(allocation.suggestedBudget)}
          </p>
        </div>
      </div>
      
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{allocation.reason}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">预估ROI</span>
          <span className={cn(
            'text-sm font-bold',
            allocation.expectedROI >= 1 ? 'text-green-600' : 'text-red-600'
          )}>
            {allocation.expectedROI.toFixed(1)}x
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">优先级</span>
          <div className="w-16 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-500 rounded-full"
              style={{ width: `${allocation.priority}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionCard: React.FC<{
  action: IncentiveAction;
  onExecute?: (id: string) => void;
}> = ({ action, onExecute }) => {
  const typeIcons = {
    approve: <CheckCircle2 className="w-4 h-4" />,
    reject: <AlertCircle className="w-4 h-4" />,
    follow_up: <Clock className="w-4 h-4" />,
    activate: <Zap className="w-4 h-4" />,
    optimize: <Sparkles className="w-4 h-4" />,
  };
  
  const typeStyles = {
    approve: 'border-green-200 dark:border-green-800',
    reject: 'border-red-200 dark:border-red-800',
    follow_up: 'border-yellow-200 dark:border-yellow-800',
    activate: 'border-blue-200 dark:border-blue-800',
    optimize: 'border-purple-200 dark:border-purple-800',
  };
  
  return (
    <div className={cn(
      'p-4 bg-white dark:bg-neutral-800 rounded-lg border-l-4',
      typeStyles[action.type]
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          action.type === 'approve' && 'bg-green-100 text-green-600 dark:bg-green-900/40',
          action.type === 'reject' && 'bg-red-100 text-red-600 dark:bg-red-900/40',
          action.type === 'follow_up' && 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40',
          action.type === 'activate' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/40',
          action.type === 'optimize' && 'bg-purple-100 text-purple-600 dark:bg-purple-900/40',
        )}>
          {typeIcons[action.type]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-neutral-900 dark:text-white">{action.label}</span>
            <Badge variant={action.priority >= 80 ? 'success' : action.priority >= 60 ? 'warning' : 'default'} size="sm">
              P{action.priority}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{action.reason}</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-500">
              预估收益: <span className="font-medium text-green-600">{formatCurrency(action.estimatedRevenue)}</span>
            </span>
            {action.cost > 0 && (
              <span className="text-xs text-neutral-500">
                成本: <span className="font-medium">{formatCurrency(action.cost)}</span>
              </span>
            )}
          </div>
        </div>
        {onExecute && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onExecute(action.id)}
            className="text-brand-600"
          >
            执行
          </Button>
        )}
      </div>
    </div>
  );
};

// ── 主组件 ──────────────────────────────────────────

export const IncentiveDecisionSystem: React.FC<IncentiveDecisionSystemProps> = ({
  programs: propPrograms,
  applications: propApplications,
  totalBudget: propTotalBudget = 1000000,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('executive');
  const [activeTab, setActiveTab] = useState<DecisionTab>('overview');
  
  // 如果没有传入数据，使用模拟数据
  const mockPrograms: EnrichedProgram[] = propPrograms || [];
  const mockApplications: EnrichedApplication[] = propApplications || [];
  const totalBudget = propTotalBudget || mockPrograms.reduce((s, p) => s + (p.total_budget || 0), 0) || 1000000;
  
  // 生成决策数据
  const roiRanking = useMemo(() => 
    generateROIRanking(mockPrograms, mockApplications),
  [mockPrograms, mockApplications]);
  
  const allocationRecommendation = useMemo(() =>
    generateAllocationRecommendation(mockPrograms, mockApplications, totalBudget),
  [mockPrograms, mockApplications, totalBudget]);
  
  const attributionSummary = useMemo(() =>
    analyzeBehaviorAttribution(mockApplications),
  [mockApplications]);
  
  const incentiveActions = useMemo(() =>
    generateIncentiveActions(mockApplications, mockPrograms),
  [mockApplications, mockPrograms]);
  
  const budgetScenarios = useMemo(() =>
    generateDefaultScenarios(allocationRecommendation),
  [allocationRecommendation]);
  
  const roiTrends = useMemo(() =>
    generateROITrends(mockPrograms, 6),
  [mockPrograms]);
  
  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('executive')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                viewMode === 'executive'
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              执行视图
            </button>
            <button
              onClick={() => setViewMode('allocation')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                viewMode === 'allocation'
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              <Calculator className="w-4 h-4 inline mr-2" />
              分配引擎
            </button>
            <button
              onClick={() => setViewMode('attribution')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                viewMode === 'attribution'
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              <GitBranch className="w-4 h-4 inline mr-2" />
              归因分析
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="info" size="sm">
            <Sparkles className="w-3 h-3 mr-1" />
            AI驱动决策
          </Badge>
        </div>
      </div>
      
      {/* 执行视图 */}
      {viewMode === 'executive' && (
        <div className="space-y-6">
          {/* KPI概览 */}
          <div className="grid grid-cols-4 gap-4">
            <DecisionCard
              title="总预算"
              value={formatCurrency(totalBudget)}
              subtitle="激励池总额"
              icon={<DollarSign className="w-5 h-5" />}
            />
            <DecisionCard
              title="平均ROI"
              value={`${roiRanking.averageROI.toFixed(1)}x`}
              subtitle={`${roiRanking.activePolicies}个活跃政策`}
              trend={roiRanking.averageROI >= 1.5 ? 'up' : 'down'}
              trendValue={roiRanking.averageROI >= 1.5 ? '高于基线' : '低于基线'}
              icon={<TrendingUp className="w-5 h-5" />}
              variant={roiRanking.averageROI >= 1.5 ? 'success' : 'warning'}
            />
            <DecisionCard
              title="预估收益"
              value={formatCurrency(attributionSummary.totalAttributedRevenue)}
              subtitle="激励归因收入"
              icon={<BarChart3 className="w-5 h-5" />}
              variant="success"
            />
            <DecisionCard
              title="待执行动作"
              value={incentiveActions.length}
              subtitle="优先级动作"
              icon={<Zap className="w-5 h-5" />}
              variant={incentiveActions.length > 5 ? 'warning' : 'default'}
            />
          </div>
          
          {/* 标签页切换 */}
          <div className="border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex gap-4">
              {(['overview', 'roi', 'budget', 'behavior'] as DecisionTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  )}
                >
                  {tab === 'overview' && '总览'}
                  {tab === 'roi' && 'ROI排行'}
                  {tab === 'budget' && '预算分配'}
                  {tab === 'behavior' && '行为归因'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tab 内容 */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 gap-6">
                {/* 政策ROI排行 Top 3 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      政策ROI排行
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {roiRanking.rankings.slice(0, 5).map((result, idx) => (
                        <ROIRankCard key={result.policyId} result={result} rank={idx + 1} />
                      ))}
                      {roiRanking.rankings.length === 0 && (
                        <p className="text-sm text-neutral-500 text-center py-8">
                          暂无政策数据
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* 激励行动队列 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-brand-500" />
                      激励行动队列
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {incentiveActions.slice(0, 5).map(action => (
                        <ActionCard key={action.id} action={action} />
                      ))}
                      {incentiveActions.length === 0 && (
                        <p className="text-sm text-neutral-500 text-center py-8">
                          暂无待执行动作
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'roi' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {roiRanking.topPerformer && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-600 dark:text-green-400 uppercase">最佳表现</p>
                      <p className="font-bold text-green-700 dark:text-green-300 mt-1">
                        {roiRanking.topPerformer.policyName}
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {roiRanking.topPerformer.roi.toFixed(1)}x
                      </p>
                    </div>
                  )}
                  <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                    <p className="text-xs text-brand-600 dark:text-brand-400 uppercase">平均ROI</p>
                    <p className="font-bold text-brand-700 dark:text-brand-300 mt-1">全局平均</p>
                    <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                      {roiRanking.averageROI.toFixed(1)}x
                    </p>
                  </div>
                  {roiRanking.bottomPerformer && roiRanking.bottomPerformer.roi < roiRanking.averageROI * 0.5 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-600 dark:text-red-400 uppercase">需要优化</p>
                      <p className="font-bold text-red-700 dark:text-red-300 mt-1">
                        {roiRanking.bottomPerformer.policyName}
                      </p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {roiRanking.bottomPerformer.roi.toFixed(1)}x
                      </p>
                    </div>
                  )}
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>完整ROI排行</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {roiRanking.rankings.map((result, idx) => (
                        <ROIRankCard key={result.policyId} result={result} rank={idx + 1} />
                      ))}
                      {roiRanking.rankings.length === 0 && (
                        <p className="text-sm text-neutral-500 text-center py-8">
                          暂无政策数据
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'budget' && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <DecisionCard
                    title="总预算"
                    value={formatCurrency(allocationRecommendation.totalBudget)}
                    icon={<DollarSign className="w-5 h-5" />}
                  />
                  <DecisionCard
                    title="已分配"
                    value={formatCurrency(allocationRecommendation.allocatedBudget)}
                    icon={<BarChart3 className="w-5 h-5" />}
                  />
                  <DecisionCard
                    title="预期ROI"
                    value={`${allocationRecommendation.totalExpectedROI.toFixed(1)}x`}
                    icon={<TrendingUp className="w-5 h-5" />}
                    variant={allocationRecommendation.totalExpectedROI >= 1.5 ? 'success' : 'warning'}
                  />
                  <DecisionCard
                    title="优化空间"
                    value={formatCurrency(Math.max(0, allocationRecommendation.optimizationGain))}
                    subtitle="预计增益"
                    icon={<Sparkles className="w-5 h-5" />}
                    variant={allocationRecommendation.optimizationGain > 0 ? 'success' : 'default'}
                  />
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      预算分配建议
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {allocationRecommendation.suggestions.map(allocation => (
                        <AllocationCard key={allocation.policyId} allocation={allocation} />
                      ))}
                      {allocationRecommendation.suggestions.length === 0 && (
                        <p className="text-sm text-neutral-500 text-center py-8 col-span-2">
                          暂无分配建议
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'behavior' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <DecisionCard
                    title="归因总收入"
                    value={formatCurrency(attributionSummary.totalAttributedRevenue)}
                    icon={<DollarSign className="w-5 h-5" />}
                    variant="success"
                  />
                  <DecisionCard
                    title="总激励成本"
                    value={formatCurrency(attributionSummary.totalCost)}
                    icon={<Percent className="w-5 h-5" />}
                  />
                  <DecisionCard
                    title="整体效率"
                    value={`${attributionSummary.overallEfficiency.toFixed(1)}x`}
                    icon={<Target className="w-5 h-5" />}
                    variant={attributionSummary.overallEfficiency >= 1 ? 'success' : 'warning'}
                  />
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>行为归因分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(attributionSummary.attributionByCategory).map(([key, attr]) => (
                        <div key={key} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-neutral-900 dark:text-white">
                              {BEHAVIOR_LABELS[attr.behavior] || attr.behavior}
                            </span>
                            <span className={cn(
                              'text-lg font-bold',
                              attr.efficiency >= 1 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {attr.efficiency.toFixed(1)}x
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-neutral-500">行为次数</p>
                              <p className="font-medium">{attr.count}</p>
                            </div>
                            <div>
                              <p className="text-neutral-500">转化率</p>
                              <p className="font-medium">{attr.conversionRate.toFixed(0)}%</p>
                            </div>
                            <div>
                              <p className="text-neutral-500">归因收入</p>
                              <p className="font-medium">{formatCurrency(attr.attributedRevenue)}</p>
                            </div>
                            <div>
                              <p className="text-neutral-500">归因伙伴</p>
                              <p className="font-medium">{attr.attributedPartners}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 分配引擎视图 */}
      {viewMode === 'allocation' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                预算分配引擎
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
                    当前分配状态
                  </h4>
                  <div className="space-y-3">
                    {allocationRecommendation.suggestions.map(allocation => (
                      <div key={allocation.policyId} className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{allocation.policyName}</p>
                          <ProgressBar 
                            value={(allocation.currentBudget / totalBudget) * 100} 
                            className="h-2 mt-1"
                          />
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          {formatCurrency(allocation.currentBudget)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
                    AI优化建议
                  </h4>
                  <div className="space-y-3">
                    {allocationRecommendation.suggestions
                      .filter(s => s.action !== 'maintain')
                      .slice(0, 5)
                      .map(allocation => (
                        <div key={allocation.policyId} className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{allocation.policyName}</span>
                            <Badge 
                              variant={allocation.action === 'increase' ? 'success' : allocation.action === 'decrease' ? 'danger' : 'info'}
                              size="sm"
                            >
                              {allocation.action === 'increase' ? '+25%' : 
                               allocation.action === 'decrease' ? '-25%' : 
                               allocation.action === 'activate' ? '启动' : '维持'}
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">{allocation.reason}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                模拟场景
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {budgetScenarios.map(scenario => (
                  <div key={scenario.id} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{scenario.name}</span>
                      <Badge 
                        variant={scenario.risk === 'low' ? 'success' : scenario.risk === 'medium' ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {scenario.risk === 'low' ? '低风险' : scenario.risk === 'medium' ? '中风险' : '高风险'}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mb-3">{scenario.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-neutral-500">预估ROI</p>
                        <p className="font-medium">{scenario.predicted.totalROI.toFixed(1)}x</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">预估收入</p>
                        <p className="font-medium">{formatCurrency(scenario.predicted.totalRevenue)}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      应用此场景
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 归因分析视图 */}
      {viewMode === 'attribution' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <DecisionCard
              title="归因总收入"
              value={formatCurrency(attributionSummary.totalAttributedRevenue)}
              subtitle="激励 → 行为 → 收入"
              icon={<DollarSign className="w-5 h-5" />}
              variant="success"
            />
            <DecisionCard
              title="投入产出比"
              value={`${attributionSummary.overallEfficiency.toFixed(1)}x`}
              subtitle="每1元激励带来的收入"
              icon={<TrendingUp className="w-5 h-5" />}
              variant={attributionSummary.overallEfficiency >= 1 ? 'success' : 'warning'}
            />
            <DecisionCard
              title="最佳归因"
              value={attributionSummary.topAttribution?.label || 'N/A'}
              subtitle="效率最高的行为类型"
              icon={<Award className="w-5 h-5" />}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>激励 → 行为 → 收入链路</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(attributionSummary.attributionByCategory).map(([key, attr]) => (
                  <div key={key} className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {BEHAVIOR_LABELS[attr.behavior] || attr.behavior}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        触发: {attr.trigger} • 次数: {attr.count}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                    <div className="text-center px-4">
                      <p className="text-lg font-bold text-brand-600">{attr.conversionRate.toFixed(0)}%</p>
                      <p className="text-xs text-neutral-500">转化率</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                    <div className="text-center px-4">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(attr.attributedRevenue)}</p>
                      <p className="text-xs text-neutral-500">归因收入</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-lg font-bold',
                        attr.efficiency >= 1 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {attr.efficiency.toFixed(1)}x
                      </p>
                      <p className="text-xs text-neutral-500">效率</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI洞察</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attributionSummary.insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-blue-500 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IncentiveDecisionSystem;
