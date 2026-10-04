/**
 * Action Center v2 - 决策驱动的运营控制台
 * 
 * 架构：
 * 🧠 Decision Engine  →  统一优先级评分
 * ⚙️ Action Engine    →  自动/建议/手动三级执行
 * 📊 Impact Engine    →  闭环效果追踪
 * 
 * 设计原则：
 * - 用"决策卡片"替代"列表聚合器"
 * - 每个决策项有明确的优先级、影响、推荐动作
 * - 每个动作有预估效果和实际反馈
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Shield,
  Target,
  Zap,
  Play,
  Settings,
  Clock,
  CheckCircle2,
  ArrowRight,
  Users,
  DollarSign,
  Activity,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BarChart3,
  TrendingDown,
  Minus,
  Gauge,
  TimerReset,
  RefreshCw,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { ProgressBar } from '../ui/ProgressBar';
import {
  DecisionItem,
  DecisionSeverity,
  DecisionAction,
  ExecutionMode,
  DecisionCategory,
} from '../../lib/priorityEngine';
import {
  WeeklyImpactSummary,
  ActionImpactRecord,
} from '../../lib/impactEngine';

// ===== 颜色系统 =====

const severityColors: Record<DecisionSeverity, {
  bg: string;
  border: string;
  text: string;
  badge: string;
  badgeText: string;
  gradient: string;
  iconBg: string;
}> = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-900/50',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 dark:bg-red-900/50',
    badgeText: 'text-red-700 dark:text-red-300',
    gradient: 'from-red-500 to-red-600',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-900/50',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 dark:bg-orange-900/50',
    badgeText: 'text-orange-700 dark:text-orange-300',
    gradient: 'from-orange-500 to-orange-600',
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
  },
  medium: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-900/50',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/50',
    badgeText: 'text-blue-700 dark:text-blue-300',
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  },
  low: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    gradient: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
  },
};

const categoryIcons: Record<DecisionCategory, React.ReactNode> = {
  sla_risk: <AlertTriangle className="w-5 h-5" />,
  revenue_risk: <TrendingDown className="w-5 h-5" />,
  partner_activation: <Users className="w-5 h-5" />,
  pipeline_opportunity: <TrendingUp className="w-5 h-5" />,
  incentive_reminder: <DollarSign className="w-5 h-5" />,
  data_quality: <Shield className="w-5 h-5" />,
  strategic_initiative: <Target className="w-5 h-5" />,
  compliance_risk: <Gauge className="w-5 h-5" />,
};

const executionModeLabels: Record<ExecutionMode, { label: string; icon: React.ReactNode; color: string }> = {
  auto: {
    label: '自动执行',
    icon: <Zap className="w-3 h-3" />,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400',
  },
  suggested: {
    label: '建议执行',
    icon: <Sparkles className="w-3 h-3" />,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-400',
  },
  manual: {
    label: '人工执行',
    icon: <Users className="w-3 h-3" />,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400',
  },
};

// ===== 优先级决策卡片 =====

const PriorityCard: React.FC<{
  item: DecisionItem;
  rank: number;
  onAction: (action: DecisionAction) => void;
  expanded?: boolean;
  onToggle?: () => void;
}> = ({ item, rank, onAction, expanded, onToggle }) => {
  const colors = severityColors[item.severity];
  const modeInfo = executionModeLabels[item.executionMode];
  const [showActions, setShowActions] = useState(expanded || item.severity === 'critical');

  const recommendedAction = item.actions[0];

  return (
    <div
      className={cn(
        'relative rounded-xl border overflow-hidden transition-all hover:shadow-lg',
        colors.border,
        item.severity === 'critical' ? 'ring-2 ring-red-500/20' : ''
      )}
    >
      {/* 优先级排名标识 */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b',
          colors.gradient
        )}
      />

      <div className="p-4 pl-6">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg', colors.iconBg)}>
              {categoryIcons[item.category]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-800">{item.title}</h3>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colors.badge, colors.badgeText)}>
                  #{rank} 优先级
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{item.description}</p>
            </div>
          </div>

          {/* 优先级分数 */}
          <div className="text-right">
            <div className={cn('text-2xl font-bold', colors.text)}>
              {item.priorityScore}
            </div>
            <div className="text-xs text-neutral-500">/ 100 分</div>
          </div>
        </div>

        {/* 四维评分条 */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <ScoreBar label="营收风险" value={item.revenueRisk} color="bg-red-500" />
          <ScoreBar label="时间紧迫" value={item.timeUrgency} color="bg-orange-500" />
          <ScoreBar label="战略价值" value={item.strategicValue} color="bg-purple-500" />
          <ScoreBar label="执行难度" value={100 - item.effortWeight} color="bg-blue-500" reverseLabel />
        </div>

        {/* 影响数据 */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          {item.impact.affectedPartners !== undefined && (
            <span className="flex items-center gap-1 text-neutral-600">
              <Users className="w-3 h-3" />
              {item.impact.affectedPartners} 家伙伴
            </span>
          )}
          {item.impact.revenueAtRisk !== undefined && (
            <span className="flex items-center gap-1 text-red-600">
              <DollarSign className="w-3 h-3" />
              风险 {formatCurrency(item.impact.revenueAtRisk, 'CNY')}
            </span>
          )}
          {item.impact.potentialRevenue !== undefined && (
            <span className="flex items-center gap-1 text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              潜力 {formatCurrency(item.impact.potentialRevenue, 'CNY')}
            </span>
          )}
          <span className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded', modeInfo.color)}>
            {modeInfo.icon}
            {modeInfo.label}
          </span>
        </div>

        {/* 推荐动作 */}
        {recommendedAction && (
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                推荐动作
              </span>
              <span className="text-xs text-purple-600 font-medium">
                {recommendedAction.label}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-2">{recommendedAction.description}</p>
            
            {/* 效果预估 */}
            <div className="flex items-center gap-3 text-xs">
              {recommendedAction.estimatedImpact.revenueRecovered !== undefined && (
                <span className="text-emerald-600">
                  💰 +{formatCurrency(recommendedAction.estimatedImpact.revenueRecovered, 'CNY')}
                </span>
              )}
              {recommendedAction.estimatedImpact.partnersActivated !== undefined && (
                <span className="text-blue-600">
                  👥 +{recommendedAction.estimatedImpact.partnersActivated} 激活
                </span>
              )}
              {recommendedAction.estimatedImpact.riskReduction !== undefined && (
                <span className="text-amber-600">
                  ⬇ 风险 -{recommendedAction.estimatedImpact.riskReduction}%
                </span>
              )}
              <span className="text-neutral-500">
                ⏱ {recommendedAction.estimatedEffort.minutes} 分钟
              </span>
              <span className="text-neutral-500">
                🎯 成功率 {recommendedAction.successRate}%
              </span>
            </div>
          </div>
        )}

        {/* 动作按钮区 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction(recommendedAction)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90',
              `bg-gradient-to-r ${colors.gradient}`
            )}
          >
            <Play className="w-4 h-4" />
            执行：{recommendedAction?.label || '立即处理'}
          </button>
          
          {item.actions.length > 1 && (
            <button
              onClick={() => setShowActions(!showActions)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center gap-1"
            >
              更多动作
              {showActions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* 更多动作展开 */}
        {showActions && item.actions.length > 1 && (
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
            {item.actions.slice(1).map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                onClick={() => onAction(action)}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('p-1 rounded', executionModeLabels[action.type].color)}>
                    {executionModeLabels[action.type].icon}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-neutral-700">{action.label}</div>
                    <div className="text-xs text-neutral-500">{action.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  {action.estimatedImpact.revenueRecovered !== undefined && (
                    <div className="text-xs text-emerald-600 font-medium">
                      +{formatCurrency(action.estimatedImpact.revenueRecovered, 'CNY')}
                    </div>
                  )}
                  <div className="text-xs text-neutral-500">
                    {action.estimatedEffort.minutes} 分钟 · {action.successRate}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ScoreBar: React.FC<{
  label: string;
  value: number;
  color: string;
  reverseLabel?: boolean;
}> = ({ label, value, color, reverseLabel }) => (
  <div>
    <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
      <span>{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', color)}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

// ===== 运营影响概览 =====

const ImpactOverview: React.FC<{
  summary: WeeklyImpactSummary;
}> = ({ summary }) => {
  const metrics = [
    {
      label: '激活伙伴',
      value: summary.partnersActivated,
      unit: '家',
      icon: <Users className="w-4 h-4" />,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400',
      trend: summary.weekOverWeek.partnersActivated,
    },
    {
      label: '恢复收入',
      value: formatCurrency(summary.totalRevenueRecovered, 'CNY'),
      unit: '',
      icon: <DollarSign className="w-4 h-4" />,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400',
      trend: summary.weekOverWeek.revenueRecovered,
    },
    {
      label: 'SLA 改善',
      value: summary.slaImprovements,
      unit: '项',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400',
      trend: summary.weekOverWeek.slaImprovements,
    },
    {
      label: '风险下降',
      value: summary.riskReduced,
      unit: '%',
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-400',
      trend: summary.weekOverWeek.riskReduced,
    },
  ];

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-500" />
          本周运营影响
        </h3>
        <span className="text-xs text-neutral-500">
          过去 7 天
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="text-center">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2', metric.color)}>
              {metric.icon}
            </div>
            <div className="text-lg font-bold text-neutral-800">
              {metric.value}
              <span className="text-xs font-normal text-neutral-500 ml-0.5">{metric.unit}</span>
            </div>
            <div className={cn(
              'text-xs flex items-center justify-center gap-0.5',
              metric.trend > 0 ? 'text-emerald-600' : metric.trend < 0 ? 'text-red-600' : 'text-neutral-500'
            )}>
              {metric.trend > 0 ? <TrendingUp className="w-3 h-3" /> : metric.trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {Math.abs(metric.trend)}% 环比
            </div>
          </div>
        ))}
      </div>

      {/* ROI 展示 */}
      <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">整体 ROI</span>
          <span className={cn(
            'text-sm font-bold',
            summary.overallRoi > 0 ? 'text-emerald-600' : summary.overallRoi < 0 ? 'text-red-600' : 'text-neutral-600'
          )}>
            {summary.overallRoi > 0 ? '+' : ''}{summary.overallRoi}%
          </span>
        </div>
        <ProgressBar
          value={Math.min(Math.max(summary.overallRoi, 0), 200)}
          max={200}
          color="bg-gradient-to-r from-emerald-400 to-emerald-600"
          size="md"
          showPercentage={false}
        />
        <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
          <span>投入 ¥{formatCurrency(summary.totalCost, 'CNY')}</span>
          <span>产出 ¥{formatCurrency(summary.totalValue, 'CNY')}</span>
        </div>
      </div>
    </div>
  );
};

// ===== 执行时间轴 =====

const ExecutionTimeline: React.FC<{
  records: ActionImpactRecord[];
}> = ({ records }) => {
  const todayRecords = records.slice(0, 8);

  if (todayRecords.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
        <Clock className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
        <p className="text-sm text-neutral-500">暂无执行记录</p>
        <p className="text-xs text-neutral-400">执行动作后将显示在这里</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2 mb-4">
        <TimerReset className="w-4 h-4 text-blue-500" />
        执行时间线
      </h3>

      <div className="space-y-3">
        {todayRecords.map((record, idx) => {
          const isCompleted = record.status === 'completed';
          const time = new Date(record.executedAt);
          const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

          return (
            <div key={record.id} className="flex gap-3">
              {/* 时间线节点 */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
                  isCompleted ? 'bg-emerald-500' :
                  record.status === 'failed' ? 'bg-red-500' :
                  record.status === 'measuring' ? 'bg-blue-500' : 'bg-neutral-400'
                )}>
                  {isCompleted ? '✓' : record.status === 'failed' ? '✕' : '...'}
                </div>
                {idx < todayRecords.length - 1 && (
                  <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700 mt-1" />
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">{record.actionName}</span>
                  <span className="text-xs text-neutral-400">{timeStr}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className={cn(
                    'px-1.5 py-0.5 rounded',
                    executionModeLabels[record.executionMode].color
                  )}>
                    {executionModeLabels[record.executionMode].label}
                  </span>
                  <span className="text-neutral-500">{record.targetCount} 个目标</span>
                  {record.actual.revenueRecovered !== undefined && (
                    <span className="text-emerald-600">+{formatCurrency(record.actual.revenueRecovered, 'CNY')}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== 优先级队列总览 =====

const PriorityOverview: React.FC<{
  items: DecisionItem[];
  overallRisk: number;
}> = ({ items, overallRisk }) => {
  const bySeverity = useMemo(() => {
    const result: Record<DecisionSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const item of items) {
      result[item.severity]++;
    }
    return result;
  }, [items]);

  const riskLevel = overallRisk >= 70 ? 'high' : overallRisk >= 40 ? 'medium' : 'low';
  const riskColor = riskLevel === 'high' ? 'text-red-600' : riskLevel === 'medium' ? 'text-amber-600' : 'text-emerald-600';
  const riskLabel = riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中等风险' : '低风险';

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-red-500" />
        决策队列总览
      </h3>

      {/* 整体风险 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-neutral-500">整体风险指数</span>
          <span className={cn('text-sm font-bold', riskColor)}>{overallRisk} · {riskLabel}</span>
        </div>
        <ProgressBar
          value={overallRisk}
          max={100}
          color={overallRisk >= 70 ? 'bg-red-500' : overallRisk >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}
          size="md"
          showPercentage={false}
        />
      </div>

      {/* 严重等级分布 */}
      <div className="grid grid-cols-4 gap-2">
        {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
          const colors = severityColors[sev];
          const labels: Record<DecisionSeverity, string> = {
            critical: '紧急',
            high: '高优',
            medium: '中等',
            low: '低优',
          };
          return (
            <div key={sev} className={cn('rounded-lg p-2 text-center', colors.bg)}>
              <div className={cn('text-xl font-bold', colors.text)}>{bySeverity[sev]}</div>
              <div className={cn('text-[10px]', colors.badgeText)}>{labels[sev]}</div>
            </div>
          );
        })}
      </div>

      {/* 待决策总数 */}
      <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700 text-center">
        <div className="text-2xl font-bold text-neutral-800">{items.length}</div>
        <div className="text-xs text-neutral-500">项待决策</div>
      </div>
    </div>
  );
};

// ===== Action Center 主组件 =====

export interface ActionCenterV2Props {
  decisionItems: DecisionItem[];
  impactSummary: WeeklyImpactSummary;
  impactRecords: ActionImpactRecord[];
  overallRiskScore: number;
  onExecuteAction?: (decisionId: string, action: DecisionAction) => void;
  onBack?: () => void;
}

export const ActionCenterV2: React.FC<ActionCenterV2Props> = ({
  decisionItems,
  impactSummary,
  impactRecords,
  overallRiskScore,
  onExecuteAction,
  onBack,
}) => {
  const [filter, setFilter] = useState<'all' | DecisionSeverity>('all');
  const [viewMode, setViewMode] = useState<'priority' | 'timeline' | 'impact'>('priority');

  const filteredItems = useMemo(() => {
    if (filter === 'all') return decisionItems;
    return decisionItems.filter((item) => item.severity === filter);
  }, [decisionItems, filter]);

  const handleAction = (action: DecisionAction) => {
    onExecuteAction?.('', action);
  };

  return (
    <div className="space-y-6">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-neutral-400 hover:text-neutral-600">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              运营决策中心
            </h2>
            <p className="text-xs text-neutral-500">
              统一优先级评分 · 智能推荐动作 · 闭环效果追踪
            </p>
          </div>
        </div>

        {/* 视图切换 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('priority')}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1',
                viewMode === 'priority'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              )}
            >
              <Target className="w-3 h-3" />
              决策队列
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1',
                viewMode === 'timeline'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              )}
            >
              <Clock className="w-3 h-3" />
              执行时间线
            </button>
            <button
              onClick={() => setViewMode('impact')}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1',
                viewMode === 'impact'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              )}
            >
              <BarChart3 className="w-3 h-3" />
              运营影响
            </button>
          </div>

          {/* 严重等级筛选 */}
          {viewMode === 'priority' && (
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => {
                const labels: Record<string, string> = {
                  all: '全部',
                  critical: '紧急',
                  high: '高优',
                  medium: '中',
                  low: '低',
                };
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-md font-medium transition-colors',
                      filter === f
                        ? 'bg-white text-neutral-800 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-800'
                    )}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 决策队列视图 */}
      {viewMode === 'priority' && (
        <div className="grid grid-cols-12 gap-4">
          {/* 左侧：决策卡片 */}
          <div className="col-span-8 space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
                <p className="text-neutral-600">太棒了，没有待处理的决策</p>
                <p className="text-xs text-neutral-400 mt-1">所有运营事项都已处理完毕</p>
              </div>
            ) : (
              filteredItems.map((item, idx) => (
                <PriorityCard
                  key={item.id}
                  item={item}
                  rank={idx + 1}
                  onAction={handleAction}
                  expanded={idx === 0}
                />
              ))
            )}
          </div>

          {/* 右侧：总览 + 影响 */}
          <div className="col-span-4 space-y-4">
            <PriorityOverview items={decisionItems} overallRisk={overallRiskScore} />
            <ImpactOverview summary={impactSummary} />
          </div>
        </div>
      )}

      {/* 执行时间线视图 */}
      {viewMode === 'timeline' && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <ExecutionTimeline records={impactRecords} />
          </div>
          <div className="col-span-4 space-y-4">
            <ImpactOverview summary={impactSummary} />
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <h3 className="text-sm font-bold text-neutral-800 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-neutral-500" />
                执行统计
              </h3>
              <div className="space-y-2 text-sm">
                <StatRow label="总执行次数" value={impactRecords.length.toString()} />
                <StatRow
                  label="自动执行"
                  value={impactRecords.filter((r) => r.executionMode === 'auto').length.toString()}
                  color="text-emerald-600"
                />
                <StatRow
                  label="建议执行"
                  value={impactRecords.filter((r) => r.executionMode === 'suggested').length.toString()}
                  color="text-purple-600"
                />
                <StatRow
                  label="人工执行"
                  value={impactRecords.filter((r) => r.executionMode === 'manual').length.toString()}
                  color="text-blue-600"
                />
                <StatRow
                  label="成功率"
                  value={`${impactSummary.successRate}%`}
                  color="text-amber-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 运营影响视图 */}
      {viewMode === 'impact' && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <ImpactOverview summary={impactSummary} />
          </div>
          <div className="col-span-4 space-y-4">
            <PriorityOverview items={decisionItems} overallRisk={overallRiskScore} />
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <h3 className="text-sm font-bold text-neutral-800 mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-neutral-500" />
                执行模式占比
              </h3>
              <div className="space-y-3">
                {(['auto', 'suggested', 'manual'] as const).map((mode) => {
                  const count = impactRecords.filter((r) => r.executionMode === mode).length;
                  const pct = impactRecords.length > 0 ? (count / impactRecords.length) * 100 : 0;
                  const info = executionModeLabels[mode];
                  return (
                    <div key={mode}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-neutral-600">
                          <span className={cn('p-0.5 rounded', info.color)}>{info.icon}</span>
                          {info.label}
                        </span>
                        <span className="text-neutral-500">{count} 次 · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-neutral-500">{label}</span>
    <span className={cn('text-sm font-medium', color || 'text-neutral-700')}>{value}</span>
  </div>
);
