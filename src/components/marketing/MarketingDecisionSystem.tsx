/**
 * Marketing Decision System - 营销决策系统
 * 
 * 三层架构：
 * 1. Executive View（老板视角）：ROI、收入预测、预算效率
 * 2. Growth Control（运营视角）：活动优化、区域覆盖、线索转化
 * 3. Execution（执行视角）：催办线索、推送SOP、分配预算
 * 
 * 解决的问题："钱应该投哪里？先做什么？未来会怎样？"
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  Zap,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  Settings,
  RefreshCw,
  Eye,
  Layers,
  MapPin,
  Filter,
  Sliders,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Calculator,
  Bell,
  Globe,
  Building2,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

// 引擎导入
import {
  // Budget Engine
  calculateActivityMetrics,
  optimizeBudgetAllocation,
  simulateBudgetScenario,
  generateROIHeatmap,
  BudgetOptimizationResult,
  BudgetAllocation,
  ActivityBudget,
  ROIHeatmapData,
  
  // Growth Engine
  createGrowthTask,
  GrowthQueue,
  generateGrowthInsights,
  GrowthTask,
  GrowthTaskPriority,
  GrowthAction,
  
  // Forecast Engine
  generateRevenueForecast,
  generateMonthlyForecast,
  RevenueForecast,
} from '../../lib/marketingEngine';

// ===== 类型定义 =====

type ViewMode = 'executive' | 'growth' | 'execution';
type DecisionTab = 'priority' | 'budget' | 'forecast' | 'heatmap';

export interface MarketingDecisionData {
  // 基础数据
  totalBudget: number;
  budgetUsed: number;
  totalRevenue: number;
  totalLeads: number;
  conversionRate: number;
  pipeline: number;
  
  // 活动数据
  activities: Array<{
    id: string;
    name: string;
    type: string;
    region: string;
    budget: number;
    spent: number;
    revenue: number;
    leads: number;
    conversions: number;
  }>;
  
  // 线索数据
  pendingLeads: number;
  leadsAtRisk: number;
  
  // 区域数据
  regions: string[];
  activeRegions: string[];
  coverageByRegion: Record<string, number>;
  
  // 时间数据
  daysRemaining: number;
  targetRevenue: number;
}

// ===== 模拟数据生成 =====

function generateMockData(): MarketingDecisionData {
  const activities = [
    { id: '1', name: '线上获客活动', type: '线上', region: '华东', budget: 120000, spent: 98000, revenue: 165000, leads: 850, conversions: 45 },
    { id: '2', name: '线下峰会', type: '线下', region: '华南', budget: 80000, spent: 75000, revenue: 48000, leads: 120, conversions: 8 },
    { id: '3', name: '行业沙龙', type: '线下', region: '华北', budget: 50000, spent: 48000, revenue: 92000, leads: 180, conversions: 22 },
    { id: '4', name: '数字营销', type: '线上', region: '华中', budget: 60000, spent: 52000, revenue: 78000, leads: 420, conversions: 18 },
    { id: '5', name: '渠道合作', type: '合作', region: '西南', budget: 90000, spent: 85000, revenue: 135000, leads: 320, conversions: 35 },
    { id: '6', name: '新品发布', type: '线下', region: '华东', budget: 100000, spent: 92000, revenue: 68000, leads: 200, conversions: 12 },
    { id: '7', name: '定向邀约', type: '线下', region: '华南', budget: 40000, spent: 35000, revenue: 28000, leads: 80, conversions: 6 },
    { id: '8', name: 'SEM投放', type: '线上', region: '全国', budget: 70000, spent: 68000, revenue: 182000, leads: 960, conversions: 52 },
  ];
  
  return {
    totalBudget: 610000,
    budgetUsed: activities.reduce((sum, a) => sum + a.spent, 0),
    totalRevenue: activities.reduce((sum, a) => sum + a.revenue, 0),
    totalLeads: activities.reduce((sum, a) => sum + a.leads, 0),
    conversionRate: 18.5,
    pipeline: 4200000,
    activities,
    pendingLeads: 48,
    leadsAtRisk: 23,
    regions: ['华东', '华南', '华北', '华中', '西南', '西北', '东北'],
    activeRegions: ['华东', '华南', '华北', '华中', '西南'],
    coverageByRegion: {
      '华东': 85,
      '华南': 72,
      '华北': 68,
      '华中': 55,
      '西南': 48,
      '西北': 15,
      '东北': 8,
    },
    daysRemaining: 45,
    targetRevenue: 1800000,
  };
}

// ===== 颜色系统 =====

const priorityColors: Record<GrowthTaskPriority, { bg: string; text: string; border: string; badge: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
};

const actionColors = {
  auto: 'text-emerald-600 bg-emerald-100',
  suggested: 'text-purple-600 bg-purple-100',
  manual: 'text-blue-600 bg-blue-100',
};

// ===== 组件：决策卡片（KPI → 决策型）=====

const DecisionKPI: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  target?: number;
  actual?: number;
  trend?: number;
  suggestion?: string;
  impact?: string;
  color: string;
}> = ({ label, value, unit, target, actual, trend, suggestion, impact, color }) => {
  const achievement = target && actual ? Math.round((actual / target) * 100) : undefined;
  const trendIcon = trend !== undefined
    ? trend > 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
    : trend < 0 ? <ArrowDownRight className="w-4 h-4 text-red-500" />
    : <Minus className="w-4 h-4 text-neutral-400" />
    : null;

  return (
    <Card className="border border-neutral-200 dark:border-neutral-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-neutral-500">{label}</div>
            </div>
          </div>
          {trendIcon}
        </div>

        <div className="text-2xl font-bold text-neutral-800 mb-1">
          {value}
          {unit && <span className="text-sm font-normal text-neutral-400 ml-1">{unit}</span>}
        </div>

        {achievement !== undefined && (
          <div className="mb-2">
            <ProgressBar
              value={Math.min(achievement, 100)}
              variant={achievement >= 100 ? 'success' : achievement >= 80 ? 'warning' : 'danger'}
              showPercentage
              size="sm"
            />
            <div className="text-[10px] text-neutral-500 mt-1">
              目标: {formatCurrency(target || 0, 'CNY')}
            </div>
          </div>
        )}

        {suggestion && (
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-amber-600 mt-0.5" />
              <div>
                <div className="text-[10px] text-amber-600 font-medium">建议</div>
                <div className="text-xs text-amber-700">{suggestion}</div>
              </div>
            </div>
          </div>
        )}

        {impact && (
          <div className="mt-2 text-xs text-neutral-500">
            影响: <span className="text-emerald-600 font-medium">{impact}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ===== 组件：增长优先级卡片 =====

const GrowthPriorityCard: React.FC<{
  task: GrowthTask;
  rank: number;
  onAction?: (action: GrowthAction) => void;
}> = ({ task, rank, onAction }) => {
  const colors = priorityColors[task.priority];
  const [expanded, setExpanded] = useState(false);
  const bestAction = task.suggestedActions[0];

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all',
      colors.border,
      task.priority === 'critical' && 'ring-2 ring-red-500/20'
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm',
              task.priority === 'critical' ? 'bg-red-500' :
              task.priority === 'high' ? 'bg-orange-500' :
              task.priority === 'medium' ? 'bg-blue-500' : 'bg-emerald-500'
            )}>
              {rank}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">{task.title}</h3>
              <p className="text-xs text-neutral-500">{task.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-xl font-bold', colors.text)}>{task.priorityScore}</div>
            <div className="text-[10px] text-neutral-500">优先级分</div>
          </div>
        </div>

        {/* 四维评分 */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <ScoreDim label="ROI" value={task.roiScore} color="bg-amber-500" />
          <ScoreDim label="Pipeline" value={task.pipelineImpactScore} color="bg-blue-500" />
          <ScoreDim label="覆盖" value={task.coverageGapScore} color="bg-purple-500" />
          <ScoreDim label="紧迫" value={task.urgencyScore} color="bg-red-500" />
        </div>

        {/* 影响数据 */}
        {task.impact.revenuePotential && (
          <div className="flex items-center gap-4 text-xs mb-3">
            {task.impact.revenuePotential && (
              <span className="text-emerald-600">
                💰 {formatCurrency(task.impact.revenuePotential, 'CNY')}
              </span>
            )}
            {task.impact.leadsAffected && (
              <span className="text-blue-600">
                👥 {task.impact.leadsAffected} 线索
              </span>
            )}
            <span className="text-neutral-500">
              ⏱ {task.estimatedEffort}h · {task.estimatedCost > 0 ? formatCurrency(task.estimatedCost, 'CNY') : '免费'}
            </span>
          </div>
        )}

        {/* 建议动作 */}
        {bestAction && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAction?.(bestAction)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90',
                bestAction.type === 'auto' ? 'bg-emerald-500' :
                bestAction.type === 'suggested' ? 'bg-purple-500' : 'bg-blue-500'
              )}
            >
              <Play className="w-4 h-4" />
              执行: {bestAction.label}
              {bestAction.expectedROI && (
                <span className="ml-1 text-xs opacity-80">
                  (ROI +{bestAction.expectedROI}%)
                </span>
              )}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* 展开详情 */}
        {expanded && task.suggestedActions.length > 1 && (
          <div className="mt-3 pt-3 border-t border-neutral-200 space-y-2">
            {task.suggestedActions.slice(1).map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
                onClick={() => onAction?.(action)}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('px-1.5 py-0.5 rounded text-xs', actionColors[action.type])}>
                    {action.type === 'auto' ? '自动' : action.type === 'suggested' ? '建议' : '人工'}
                  </span>
                  <span className="text-sm text-neutral-700">{action.label}</span>
                </div>
                <div className="text-xs text-neutral-500">
                  {action.expectedROI && `+${action.expectedROI}%`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ScoreDim: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
      <span>{label}</span>
    </div>
    <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full', color)} style={{ width: `${value}%` }} />
    </div>
  </div>
);

// ===== 组件：预算分配卡片 =====

const BudgetAllocationCard: React.FC<{
  allocation: BudgetAllocation;
}> = ({ allocation }) => {
  const actionConfig = {
    increase: { color: 'text-emerald-600 bg-emerald-100', icon: ArrowUpRight, label: '增投' },
    decrease: { color: 'text-red-600 bg-red-100', icon: ArrowDownRight, label: '削减' },
    maintain: { color: 'text-blue-600 bg-blue-100', icon: Minus, label: '保持' },
    experiment: { color: 'text-purple-600 bg-purple-100', icon: Sparkles, label: '实验' },
  };
  const config = actionConfig[allocation.action];
  const ActionIcon = config.icon;

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200">
      <div className="flex items-center gap-3">
        <ActionIcon className={cn('w-5 h-5', config.color.replace('bg-', 'text-').replace('-100', '-600'))} />
        <div>
          <div className="text-sm font-medium text-neutral-800">{allocation.activityName}</div>
          <div className="text-xs text-neutral-500">{allocation.reason}</div>
        </div>
      </div>

      <div className="text-right">
        <div className={cn('text-sm font-bold', config.color)}>
          {allocation.adjustment > 0 ? '+' : ''}{formatCurrency(allocation.adjustment, 'CNY')}
        </div>
        <div className="text-xs text-neutral-500">
          {formatCurrency(allocation.currentBudget, 'CNY')} → {formatCurrency(allocation.suggestedBudget, 'CNY')}
        </div>
      </div>
    </div>
  );
};

// ===== 组件：预测概览 =====

const ForecastOverview: React.FC<{
  forecast: RevenueForecast;
}> = ({ forecast }) => {
  const gapColor = forecast.gap.revenue > 0 ? 'text-red-600' : 'text-emerald-600';
  const achievementRate = Math.round((forecast.predicted.revenue / forecast.target.revenue) * 100);

  return (
    <div className="space-y-4">
      {/* 预测 vs 目标 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
          <div className="text-xs text-emerald-600 mb-1">预测营收</div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(forecast.predicted.revenue, 'CNY')}
          </div>
          <div className="text-xs text-emerald-600 mt-1">
            置信区间: {formatCurrency(forecast.confidence.low, 'CNY')} ~ {formatCurrency(forecast.confidence.high, 'CNY')}
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
          <div className="text-xs text-amber-600 mb-1">目标营收</div>
          <div className="text-2xl font-bold text-amber-700">
            {formatCurrency(forecast.target.revenue, 'CNY')}
          </div>
          <div className="text-xs text-amber-600 mt-1">
            达成率 {achievementRate}%
          </div>
        </div>
      </div>

      {/* 差距 */}
      <div className={cn('p-3 rounded-lg', forecast.gap.revenue > 0 ? 'bg-red-50' : 'bg-emerald-50')}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-700">
            {forecast.gap.revenue > 0 ? '⚠️ 存在缺口' : '✅ 超额完成'}
          </span>
          <span className={cn('text-lg font-bold', gapColor)}>
            {forecast.gap.revenue > 0 ? '-' : '+'}{formatCurrency(Math.abs(forecast.gap.revenue), 'CNY')}
          </span>
        </div>
      </div>

      {/* 风险 */}
      {forecast.risks.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-neutral-700">风险预警</div>
          {forecast.risks.map((risk, idx) => (
            <div key={idx} className={cn(
              'p-2 rounded-lg text-xs',
              risk.severity === 'critical' ? 'bg-red-50 text-red-700' :
              risk.severity === 'high' ? 'bg-orange-50 text-orange-700' :
              'bg-amber-50 text-amber-700'
            )}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5" />
                <div>
                  <div className="font-medium">{risk.description}</div>
                  {risk.mitigation && (
                    <div className="text-neutral-600 mt-0.5">{risk.mitigation}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== 组件：ROI 热力图 =====

const ROIHeatmap: React.FC<{
  data: ROIHeatmapData;
}> = ({ data }) => {
  const getHeatColor = (roi: number) => {
    if (roi >= 50) return 'bg-emerald-500';
    if (roi >= 20) return 'bg-emerald-300';
    if (roi >= 0) return 'bg-amber-200';
    if (roi >= -20) return 'bg-orange-300';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-4">
      {/* 热力图表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-neutral-500 font-medium">区域/类型</th>
              {data.cols.map(col => (
                <th key={col} className="p-2 text-center text-neutral-500 font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIdx) => (
              <tr key={row}>
                <td className="p-2 text-left text-neutral-700 font-medium">{row}</td>
                {data.cells[rowIdx]?.map((cell, colIdx) => (
                  <td key={colIdx} className="p-1">
                    <div className={cn(
                      'p-2 rounded-lg text-center text-white font-medium',
                      getHeatColor(cell.roi),
                      cell.count === 0 && 'bg-neutral-200 text-neutral-400'
                    )}>
                      {cell.count > 0 ? (
                        <>
                          <div>{cell.roi.toFixed(0)}%</div>
                          <div className="text-[10px] opacity-80">{cell.count}活动</div>
                        </>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 洞察 */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-neutral-700">洞察</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <div className="text-xs text-emerald-600">最佳组合</div>
            <div className="text-sm font-medium text-emerald-700">
              {data.insights.bestCombination.row} + {data.insights.bestCombination.col}
            </div>
            <div className="text-xs text-emerald-600">
              ROI {data.insights.bestCombination.roi.toFixed(0)}%
            </div>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <div className="text-xs text-red-600">待优化组合</div>
            <div className="text-sm font-medium text-red-700">
              {data.insights.worstCombination.row} + {data.insights.worstCombination.col}
            </div>
            <div className="text-xs text-red-600">
              ROI {data.insights.worstCombination.roi.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== 主组件 =====

export const MarketingDecisionSystem: React.FC<{
  data?: MarketingDecisionData;
}> = ({ data: propData }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('executive');
  const [decisionTab, setDecisionTab] = useState<DecisionTab>('priority');
  
  const data = propData || generateMockData();

  // 处理数据生成引擎结果
  const activityBudgets = useMemo(() => 
    data.activities.map(a => calculateActivityMetrics({
      id: a.id,
      name: a.name,
      type: a.type,
      budget: a.budget,
      spent: a.spent,
      revenue: a.revenue,
      leads: a.leads,
      conversions: a.conversions,
    }))
  , [data.activities]);

  // 预算优化
  const budgetOptimization = useMemo(() =>
    optimizeBudgetAllocation(activityBudgets, data.totalBudget)
  , [activityBudgets, data.totalBudget]);

  // 增长任务队列
  const growthQueue = useMemo(() => {
    const queue = new GrowthQueue();
    
    // 根据数据生成任务
    if (data.pendingLeads > 20) {
      queue.add(createGrowthTask('leads_nurture', {
        leads: data.pendingLeads,
        revenue: data.pendingLeads * 50000 * 0.2,
        urgencyScore: 80,
      }));
    }
    
    // 区域覆盖
    const lowCoverage = Object.entries(data.coverageByRegion)
      .filter(([_, rate]) => rate < 60)
      .map(([region]) => region);
    
    if (lowCoverage.length > 0) {
      queue.add(createGrowthTask('region_expand', {
        revenue: lowCoverage.length * 200000,
        coverage: lowCoverage.length * 20,
      }));
    }
    
    // 预算重分配
    queue.add(createGrowthTask('budget_realloc', {
      revenue: data.totalBudget * 0.1,
    }));
    
    // 转化提升
    if (data.conversionRate < 25) {
      queue.add(createGrowthTask('conversion_boost', {
        leads: data.totalLeads,
        revenue: data.totalLeads * 50000 * 0.15,
      }));
    }
    
    // SOP复制
    queue.add(createGrowthTask('sop_replicate', {
      leads: data.totalLeads * 0.3,
      revenue: data.totalRevenue * 0.2,
    }));
    
    // 活动优化
    const lowROI = activityBudgets.filter(a => a.roi < 20);
    if (lowROI.length > 0) {
      queue.add(createGrowthTask('activity_optimize', {
        revenue: lowROI.reduce((sum, a) => sum + a.revenue, 0) * 0.2,
      }));
    }
    
    return queue;
  }, [data, activityBudgets]);

  // 预测
  const forecast = useMemo(() =>
    generateRevenueForecast({
      currentRevenue: data.totalRevenue,
      targetRevenue: data.targetRevenue,
      currentLeads: data.totalLeads,
      pipelineValue: data.pipeline,
      conversionRate: data.conversionRate,
      daysRemaining: data.daysRemaining,
      coverageByRegion: data.coverageByRegion,
    })
  , [data]);

  // ROI 热力图
  const heatmapData = useMemo(() => {
    const activitiesWithRegion = data.activities.map(a => ({
      ...a,
      region: a.region,
    }));
    return generateROIHeatmap(activitiesWithRegion.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      region: a.region,
      budget: a.budget,
      spent: a.spent,
      revenue: a.revenue,
      leads: a.leads,
      conversions: a.conversions,
      roi: a.spent > 0 ? ((a.revenue - a.spent) / a.spent) * 100 : 0,
      trend: 'stable' as const,
      trendValue: 0,
    })));
  }, [data]);

  // 增长洞察
  const insights = useMemo(() =>
    generateGrowthInsights({
      pendingLeads: data.pendingLeads,
      regions: data.regions,
      activeRegions: data.activeRegions,
      activities: data.activities.map(a => ({ type: a.type, roi: a.spent > 0 ? ((a.revenue - a.spent) / a.spent) * 100 : 0 })),
      coverage: data.coverageByRegion,
    })
  , [data]);

  const viewModes = [
    { id: 'executive' as const, label: 'Executive', icon: BarChart3, desc: '老板视角' },
    { id: 'growth' as const, label: 'Growth', icon: TrendingUp, desc: '运营视角' },
    { id: 'execution' as const, label: 'Execution', icon: Play, desc: '执行视角' },
  ];

  const decisionTabs = [
    { id: 'priority' as const, label: '优先级', count: growthQueue.getTasks().length },
    { id: 'budget' as const, label: '预算优化', count: budgetOptimization.increaseActivities.length + budgetOptimization.decreaseActivities.length },
    { id: 'forecast' as const, label: '预测' },
    { id: 'heatmap' as const, label: 'ROI热力图' },
  ];

  const handleExecuteAction = (action: GrowthAction) => {
    console.log('执行动作:', action);
    // TODO: 实际执行动作
  };

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              营销决策系统
            </h1>
            <p className="text-xs text-neutral-500">
              预算分配 · 增长优先级 · 效果预测
            </p>
          </div>
        </div>

        {/* 视图切换 */}
        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  viewMode === mode.id
                    ? 'bg-white text-neutral-800 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-800'
                )}
              >
                <Icon className="w-3 h-3" />
                {mode.desc}
              </button>
            );
          })}
        </div>
      </div>

      {/* Executive View：老板视角 */}
      {viewMode === 'executive' && (
        <div className="space-y-6">
          {/* KPI 决策卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <DecisionKPI
              label="营销 ROI"
              value={Math.round((data.totalRevenue / data.totalBudget - 1) * 100)}
              unit="%"
              trend={12}
              suggestion="提高至 32%"
              impact="+¥1.2M"
              color="bg-emerald-500"
            />
            <DecisionKPI
              label="预测营收"
              value={formatCurrency(forecast.predicted.revenue, 'CNY')}
              target={data.targetRevenue}
              actual={forecast.predicted.revenue}
              trend={forecast.gap.revenue > 0 ? -8 : 5}
              suggestion={forecast.gap.revenue > 0 ? "加速高ROI活动" : "保持当前节奏"}
              impact={forecast.gap.revenue > 0 ? `-¥${(forecast.gap.revenue / 10000).toFixed(0)}万` : `+¥${(-forecast.gap.revenue / 10000).toFixed(0)}万`}
              color="bg-amber-500"
            />
            <DecisionKPI
              label="预算效率"
              value={Math.round((data.budgetUsed / data.totalBudget) * 100)}
              unit="%"
              trend={5}
              suggestion="优化低效活动"
              impact="节省 ¥8万"
              color="bg-blue-500"
            />
            <DecisionKPI
              label="覆盖区域"
              value={data.activeRegions.length}
              unit={`/ ${data.regions.length}`}
              trend={0}
              suggestion="拓展西北、东北"
              impact="+2 区域"
              color="bg-purple-500"
            />
          </div>

          {/* 预测概览 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  营收预测
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ForecastOverview forecast={forecast} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  关键洞察
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.slice(0, 4).map((insight) => (
                    <div
                      key={insight.id}
                      className={cn(
                        'p-2 rounded-lg text-xs',
                        insight.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                        insight.severity === 'high' ? 'bg-orange-50 border border-orange-200' :
                        'bg-amber-50 border border-amber-200'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {insight.severity === 'critical' ? (
                          <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5" />
                        ) : (
                          <Bell className="w-3 h-3 text-amber-600 mt-0.5" />
                        )}
                        <div>
                          <div className="font-medium text-neutral-800">{insight.title}</div>
                          <div className="text-neutral-600 mt-0.5">{insight.recommendation}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Growth View：运营视角 */}
      {viewMode === 'growth' && (
        <div className="space-y-6">
          {/* Tab 切换 */}
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            {decisionTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDecisionTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  decisionTab === tab.id
                    ? 'bg-white text-neutral-800 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-800'
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px]',
                    tab.count > 0 ? 'bg-blue-100 text-blue-600' : 'bg-neutral-200 text-neutral-500'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 优先级队列 */}
          {decisionTab === 'priority' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-800">
                  Growth Priority Queue
                </h3>
                <span className="text-xs text-neutral-500">
                  共 {growthQueue.getTasks().length} 项任务
                </span>
              </div>

              <div className="space-y-3">
                {growthQueue.getTasks().slice(0, 6).map((task, idx) => (
                  <GrowthPriorityCard
                    key={task.id}
                    task={task}
                    rank={idx + 1}
                    onAction={handleExecuteAction}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 预算优化 */}
          {decisionTab === 'budget' && (
            <div className="space-y-4">
              {/* 优化摘要 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-emerald-600">
                    {budgetOptimization.increaseActivities.length}
                  </div>
                  <div className="text-xs text-emerald-600">建议增投</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-red-600">
                    {budgetOptimization.decreaseActivities.length}
                  </div>
                  <div className="text-xs text-red-600">建议削减</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">
                    +{budgetOptimization.roiImprovement.toFixed(1)}%
                  </div>
                  <div className="text-xs text-blue-600">ROI提升</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600">
                    {formatCurrency(budgetOptimization.projectedRevenue - budgetOptimization.totalBudget, 'CNY')}
                  </div>
                  <div className="text-xs text-purple-600">预计利润</div>
                </div>
              </div>

              {/* 增投活动 */}
              {budgetOptimization.increaseActivities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    建议增投 ({budgetOptimization.increaseActivities.length})
                  </h4>
                  {budgetOptimization.increaseActivities.map((allocation) => (
                    <BudgetAllocationCard key={allocation.activityId} allocation={allocation} />
                  ))}
                </div>
              )}

              {/* 削减活动 */}
              {budgetOptimization.decreaseActivities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4" />
                    建议削减 ({budgetOptimization.decreaseActivities.length})
                  </h4>
                  {budgetOptimization.decreaseActivities.map((allocation) => (
                    <BudgetAllocationCard key={allocation.activityId} allocation={allocation} />
                  ))}
                </div>
              )}

              {/* 警告 */}
              {budgetOptimization.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-xs text-amber-700">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {budgetOptimization.warnings.join('; ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 预测 */}
          {decisionTab === 'forecast' && (
            <div className="space-y-4">
              <ForecastOverview forecast={forecast} />
            </div>
          )}

          {/* ROI 热力图 */}
          {decisionTab === 'heatmap' && (
            <div className="space-y-4">
              <ROIHeatmap data={heatmapData} />
            </div>
          )}
        </div>
      )}

      {/* Execution View：执行视角 */}
      {viewMode === 'execution' && (
        <div className="space-y-6">
          {/* 待执行任务 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-800">
              待执行任务
            </h3>

            <div className="space-y-3">
              {growthQueue.getTasks().slice(0, 4).map((task) => {
                const action = task.suggestedActions.find(a => a.type === 'auto' || a.type === 'suggested');
                return (
                  <div key={task.id} className="bg-white rounded-xl border border-neutral-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center text-white',
                          task.priority === 'critical' ? 'bg-red-500' :
                          task.priority === 'high' ? 'bg-orange-500' :
                          task.priority === 'medium' ? 'bg-blue-500' : 'bg-emerald-500'
                        )}>
                          {task.priority === 'critical' ? <AlertTriangle className="w-5 h-5" /> :
                           task.priority === 'high' ? <Bell className="w-5 h-5" /> :
                           <Target className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-800">{task.title}</div>
                          <div className="text-xs text-neutral-500">
                            {task.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {action && (
                          <button
                            onClick={() => handleExecuteAction(action)}
                            className={cn(
                              'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90',
                              action.type === 'auto' ? 'bg-emerald-500' : 'bg-purple-500'
                            )}
                          >
                            <Play className="w-4 h-4" />
                            {action.type === 'auto' ? '自动执行' : '确认执行'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 效果预估 */}
                    <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-6 text-xs">
                      {task.impact.revenuePotential && (
                        <span className="text-emerald-600">
                          💰 预计 +{formatCurrency(task.impact.revenuePotential, 'CNY')}
                        </span>
                      )}
                      {task.impact.leadsAffected && (
                        <span className="text-blue-600">
                          👥 影响 {task.impact.leadsAffected} 条线索
                        </span>
                      )}
                      <span className="text-neutral-500">
                        ⏱ {task.estimatedEffort}h · 成功率 {task.successProbability}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
