/**
 * Executive Summary Dashboard v4 - Autonomous Revenue System
 * 
 * 从"Copilot System" → "Autonomous Revenue System"
 * 
 * 核心升级：
 * - SystemStatusBar → Autonomous Status
 * - ExecutiveDecisionBanner → Decision Autopilot
 * - Action Center → Execution Stream
 * - 新增 Closed-Loop Learning
 * - 增强 Revenue Simulation → Digital Twin
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Target,
  Layers,
  BarChart3,
  Bell,
  Sparkles,
  Brain,
  Rocket,
  TrendingDown as TrendingDownIcon,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Cpu,
  Zap as ZapIcon,
  GitBranch,
  Bot,
  Cog,
  Activity,
  Clock,
  CheckCheck,
  AlertCircle,
  XCircle,
  Mail,
  MessageSquare,
  Users,
  Lightbulb,
  ArrowRight,
  Circle,
  CheckCircle2,
  Loader2,
  Pause,
  SkipForward,
  TrendingUp as TrendingUpIcon,
} from 'lucide-react';
import type { 
  ExecutiveSummaryData, 
  ExecutiveKPI,
  ExecutionTask,
  ExecutionStatus,
  DecisionAutopilot,
  LearningFeedback,
  DigitalTwinPrediction,
} from './types';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';

// ========== 工具函数 ==========

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
};

// ========== Autonomous Status Bar ==========

const AutonomousStatusBar: React.FC<{
  mode: 'autonomous' | 'supervised' | 'manual';
  uptime: string;
  tasksProcessed: number;
  successRate: number;
}> = ({ mode, uptime, tasksProcessed, successRate }) => {
  const modeConfig = {
    autonomous: { color: 'emerald', label: '自动驾驶', icon: <Bot className="w-3 h-3" /> },
    supervised: { color: 'blue', label: '监督模式', icon: <Eye className="w-3 h-3" /> },
    manual: { color: 'neutral', label: '手动模式', icon: <Cog className="w-3 h-3" /> },
  };
  
  const cfg = modeConfig[mode];
  
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white rounded-xl">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            mode === 'autonomous' ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50' :
            mode === 'supervised' ? 'bg-blue-400 animate-pulse' :
            'bg-neutral-400'
          }`} />
          <span className="text-sm font-medium">{cfg.label}中</span>
          {cfg.icon}
        </div>
        
        <div className="h-5 w-px bg-neutral-700" />
        
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs">已处理 <span className="font-semibold text-white">{tasksProcessed}</span> 个任务</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs">成功率 <span className="font-semibold text-emerald-400">{successRate}%</span></span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-xs text-neutral-500">运行时长: {uptime}</span>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors text-xs">
          <RefreshCw className="w-3 h-3" />
          刷新系统
        </button>
      </div>
    </div>
  );
};

// ========== Execution Stream（自动执行流） ==========

const ExecutionStream: React.FC<{
  completed: ExecutionTask[];
  inProgress: ExecutionTask[];
  pending: ExecutionTask[];
  needsHuman: ExecutionTask[];
}> = ({ completed, inProgress, pending, needsHuman }) => {
  const [expanded, setExpanded] = useState(true);
  
  const statusConfig: Record<ExecutionStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    completed: { color: 'text-emerald-600', bg: 'bg-emerald-500', icon: <CheckCircle2 className="w-4 h-4" />, label: '已完成' },
    in_progress: { color: 'text-blue-600', bg: 'bg-blue-500', icon: <Loader2 className="w-4 h-4 animate-spin" />, label: '执行中' },
    pending: { color: 'text-amber-600', bg: 'bg-amber-500', icon: <Clock className="w-4 h-4" />, label: '待执行' },
    needs_human: { color: 'text-red-600', bg: 'bg-red-500', icon: <AlertCircle className="w-4 h-4" />, label: '需人工' },
    failed: { color: 'text-red-600', bg: 'bg-red-500', icon: <XCircle className="w-4 h-4" />, label: '失败' },
  };
  
  const totalCount = completed.length + inProgress.length + pending.length + needsHuman.length;
  const completionRate = totalCount > 0 ? Math.round((completed.length / totalCount) * 100) : 0;
  
  const renderTask = (task: ExecutionTask) => {
    const cfg = statusConfig[task.status];
    return (
      <div key={task.id} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors">
        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center text-white shrink-0`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{task.title}</span>
            <span className={`text-[10px] font-semibold ${cfg.color} bg-opacity-10 px-2 py-0.5 rounded-full`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">{task.description}</p>
          
          {task.feedback && (
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600">
              {task.feedback.openRate && (
                <span className="text-[10px] text-emerald-600">打开率 {task.feedback.openRate}%</span>
              )}
              {task.feedback.conversionRate && (
                <span className="text-[10px] text-blue-600">转化率 {task.feedback.conversionRate}%</span>
              )}
              {task.feedback.revenueImpact && (
                <span className="text-[10px] text-purple-600">收入 +{formatCurrency(task.feedback.revenueImpact, 'CNY')}</span>
              )}
            </div>
          )}
          
          {task.status === 'in_progress' && task.progress > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <ZapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Execution Stream</h3>
            <p className="text-xs text-neutral-400">自动执行流 · {completed.length}/{totalCount} 已完成</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-neutral-500">{completed.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs text-neutral-500">{inProgress.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-neutral-500">{pending.length}</span>
            </div>
            {needsHuman.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-red-500 font-medium">{needsHuman.length}</span>
              </div>
            )}
          </div>
          
          <div className="text-sm font-semibold text-emerald-600">
            {completionRate}%
          </div>
          
          {expanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 pt-0 space-y-4 max-h-96 overflow-y-auto">
          {needsHuman.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                需要人工介入 ({needsHuman.length})
              </div>
              <div className="space-y-2">
                {needsHuman.map(renderTask)}
              </div>
            </div>
          )}
          
          {inProgress.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                正在执行 ({inProgress.length})
              </div>
              <div className="space-y-2">
                {inProgress.map(renderTask)}
              </div>
            </div>
          )}
          
          {pending.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                待执行 ({pending.length})
              </div>
              <div className="space-y-2">
                {pending.map(renderTask)}
              </div>
            </div>
          )}
          
          {completed.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                已完成 ({completed.length})
              </div>
              <div className="space-y-2">
                {completed.slice(0, 3).map(renderTask)}
                {completed.length > 3 && (
                  <button className="w-full py-2 text-xs text-blue-500 hover:text-blue-600 font-medium">
                    查看更多 {completed.length - 3} 项
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ========== Decision Autopilot Banner ==========

const DecisionAutopilotBanner: React.FC<{
  autopilot: DecisionAutopilot;
}> = ({ autopilot }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-5 text-white shadow-xl shadow-purple-500/20">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wide">Decision Autopilot</span>
              {autopilot.active && (
                <span className="text-xs font-medium bg-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  已启用
                </span>
              )}
            </div>
            
            <h2 className="text-lg font-bold mb-2">
              系统已自动选择：{autopilot.selectedStrategyName}
            </h2>
            
            <div className="grid grid-cols-3 gap-3">
              {autopilot.reasoning.slice(0, 3).map((r, idx) => (
                <div key={idx} className="bg-white/10 rounded-lg p-2.5">
                  <div className="text-[10px] text-white/60 mb-1">{r.factor}</div>
                  <div className="text-sm font-semibold">{r.value}</div>
                  <div className="text-[10px] text-white/50 mt-0.5">权重 {r.weight}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '收起详情' : '查看详情'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-indigo-600 border-transparent hover:bg-white/90"
            onClick={() => {}}
          >
            <Cog className="w-3 h-3" />
            调整策略
          </Button>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs text-white/70 mb-2">替代方案对比</div>
          <div className="grid grid-cols-2 gap-3">
            {autopilot.alternatives.map((alt, idx) => (
              <div key={idx} className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-medium mb-1">{alt.strategyName}</div>
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <span>ROI差: {alt.roiDiff > 0 ? '+' : ''}{alt.roiDiff}%</span>
                  <span>时间差: {alt.timeDiff}</span>
                  <span>风险差: {alt.riskDiff}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ========== KPI Card（动态系统值版） ==========

const KPICardV4: React.FC<{
  kpi: ExecutiveKPI & {
    subtitle?: string;
    explanation?: string;
    aiPrediction?: number;
    riskIfNoAction?: number;
  };
  icon: React.ReactNode;
  accentColor: string;
}> = ({ kpi, icon, accentColor }) => {
  const statusColors = {
    excellent: { text: 'text-emerald-600', bg: 'bg-emerald-50' },
    good: { text: 'text-blue-600', bg: 'bg-blue-50' },
    warning: { text: 'text-amber-600', bg: 'bg-amber-50' },
    danger: { text: 'text-red-600', bg: 'bg-red-50' },
  };
  
  const colors = statusColors[kpi.status];
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const trendColor = kpi.trend === 'up' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-neutral-400';
  
  const displayValue = typeof kpi.value === 'number' && (kpi.label.includes('营收') || kpi.label.includes('收入'))
    ? formatCurrency(kpi.value as number, 'CNY')
    : kpi.value;
  
  const displayTarget = kpi.target && typeof kpi.target === 'number' && (kpi.label.includes('营收') || kpi.label.includes('收入'))
    ? formatCurrency(kpi.target as number, 'CNY')
    : kpi.target;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`} style={{ color: accentColor }}>
            {icon}
          </div>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{kpi.label}</span>
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          {kpi.trendValue !== undefined && (
            <span className="text-xs font-semibold">{kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue}%</span>
          )}
        </div>
      </div>
      
      <div className="mb-1">
        <span className={`text-3xl font-bold ${colors.text}`}>{displayValue}</span>
        {displayTarget && (
          <span className="text-sm text-neutral-400 ml-2">/ {displayTarget}</span>
        )}
      </div>
      
      {kpi.achievement !== undefined && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(kpi.achievement, 100)}%`, backgroundColor: accentColor }}
            />
          </div>
          <span className={`text-xs font-semibold ${colors.text}`}>{Math.min(kpi.achievement, 999)}%</span>
        </div>
      )}
      
      <div className="space-y-1.5 pt-3 border-t border-neutral-100 dark:border-neutral-700">
        {kpi.aiPrediction && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-600 flex items-center gap-1">
              <TrendingUpIcon className="w-3 h-3" />
              AI预测
            </span>
            <span className="font-semibold text-purple-600">
              {formatCurrency(kpi.aiPrediction, 'CNY')}
            </span>
          </div>
        )}
        {kpi.riskIfNoAction && kpi.riskIfNoAction > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-red-500 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" />
              风险（未干预）
            </span>
            <span className="font-semibold text-red-600">
              -{formatCurrency(kpi.riskIfNoAction, 'CNY')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ========== Closed-Loop Learning Panel ==========

const ClosedLoopLearningPanel: React.FC<{
  learnings: LearningFeedback[];
}> = ({ learnings }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Closed-Loop Learning</h3>
            <p className="text-xs text-neutral-400">系统持续学习优化中</p>
          </div>
        </div>
        
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5"
        >
          {expanded ? '收起' : '查看详情'}
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-emerald-600">62%</div>
          <div className="text-[10px] text-emerald-500">邮件平均打开率</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-blue-600">28%</div>
          <div className="text-[10px] text-blue-500">平均响应率</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-purple-600">+15%</div>
          <div className="text-[10px] text-purple-500">收入提升</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-amber-600">89%</div>
          <div className="text-[10px] text-amber-500">预测准确率</div>
        </div>
      </div>
      
      {expanded && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-neutral-500 mb-2">学习洞察</div>
          
          {learnings.map((learning, idx) => (
            <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                  {learning.actionType === 'email' && <Mail className="w-3 h-3 text-cyan-600" />}
                  {learning.actionType === 'call' && <Phone className="w-3 h-3 text-cyan-600" />}
                  {learning.actionType === 'visit' && <Users className="w-3 h-3 text-cyan-600" />}
                </div>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200 capitalize">
                  {learning.actionType} 策略
                </span>
              </div>
              
              {learning.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <Lightbulb className={`w-3 h-3 mt-0.5 shrink-0 ${
                    insight.type === 'success' ? 'text-emerald-500' :
                    insight.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                  }`} />
                  <span className="text-xs text-neutral-600 dark:text-neutral-300">{insight.title}</span>
                </div>
              ))}
            </div>
          ))}
          
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-600">
            <div className="text-xs font-semibold text-neutral-500 mb-2">优化建议</div>
            <div className="space-y-1.5">
              {learnings[0]?.optimizationTips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-300">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== Digital Twin Simulation ==========

const DigitalTwinSimulation: React.FC<{
  current: DigitalTwinPrediction;
  simulations: DigitalTwinPrediction[];
  whatIfScenarios: Array<{ condition: string; result: DigitalTwinPrediction }>;
}> = ({ current, simulations, whatIfScenarios }) => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Revenue Digital Twin</h3>
            <p className="text-xs text-neutral-400">渠道生态数字孪生预测</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{current.predicted.achievementRate}%</div>
          <div className="text-[10px] text-neutral-500">当前达成率</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(current.predicted.revenue, 'CNY')}</div>
          <div className="text-[10px] text-purple-500">预测收入</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{current.confidenceInterval.low}%</div>
          <div className="text-[10px] text-emerald-500">置信区间低</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{current.confidenceInterval.high}%</div>
          <div className="text-[10px] text-emerald-500">置信区间高</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="text-xs font-semibold text-neutral-500">What-If 情景模拟</div>
        
        {whatIfScenarios.map((scenario, idx) => {
          const isSelected = selectedScenario === scenario.condition;
          const diff = scenario.result.predicted.achievementRate - current.predicted.achievementRate;
          
          return (
            <div 
              key={idx}
              onClick={() => setSelectedScenario(isSelected ? null : scenario.condition)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected 
                  ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    diff > 0 ? 'bg-emerald-100' : diff < 0 ? 'bg-red-100' : 'bg-neutral-100'
                  }`}>
                    {diff > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : diff < 0 ? (
                      <TrendingDownIcon className="w-4 h-4 text-red-600" />
                    ) : (
                      <Minus className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{scenario.condition}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-neutral-500'}`}>
                    {diff > 0 ? '+' : ''}{diff}%
                  </span>
                  {isSelected ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-neutral-400 mb-0.5">预测收入</div>
                      <div className="font-semibold text-neutral-700 dark:text-neutral-200">
                        {formatCurrency(scenario.result.predicted.revenue, 'CNY')}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 mb-0.5">达成率</div>
                      <div className="font-semibold text-neutral-700 dark:text-neutral-200">
                        {scenario.result.predicted.achievementRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 mb-0.5">伙伴健康</div>
                      <div className="font-semibold text-neutral-700 dark:text-neutral-200">
                        {scenario.result.predicted.partnerHealth}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 mb-0.5">Pipeline</div>
                      <div className="font-semibold text-neutral-700 dark:text-neutral-200">
                        {scenario.result.predicted.pipelineHealth}
                      </div>
                    </div>
                  </div>
                  
                  {scenario.result.triggers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                      <div className="text-xs text-neutral-500 mb-1">触发条件</div>
                      {scenario.result.triggers.map((trigger, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-neutral-600 dark:text-neutral-300">{trigger.action}</span>
                          <span className="text-purple-600">{trigger.probability}% · +{formatCurrency(trigger.expectedImpact, 'CNY')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========== Executive Summary 主组件 (v4 - Autonomous Revenue System) ==========

export const ExecutiveSummary: React.FC<{
  data: ExecutiveSummaryData;
  onViewChange?: (view: 'operations' | 'action_center') => void;
}> = ({ data, onViewChange }) => {
  const { revenue, pipeline, partners, partnerPortfolioHealth, diagnosisSummary, timeProgress } = data;
  
  const quarter = new Date().getMonth() <= 2 ? 1 : new Date().getMonth() <= 5 ? 2 : new Date().getMonth() <= 8 ? 3 : 4;
  const year = new Date().getFullYear();
  
  // Mock 数据
  const executionTasks: ExecutionTask[] = [
    {
      id: 't1',
      title: '12家伙伴激活邮件已发送',
      description: '批量发送伙伴激活提醒邮件，已完成12家中的9家',
      status: 'in_progress',
      progress: 75,
      autoExecution: { enabled: true, channel: 'email', lastAction: '9:30 发送成功', nextAction: '剩余3家正在发送' },
      feedback: { executedAt: new Date().toISOString(), openRate: 62, responseRate: 28, revenueImpact: 420000 },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 't2',
      title: '3个大客户商机跟进提醒',
      description: '创建CRM任务并分配给对应客户经理',
      status: 'completed',
      progress: 100,
      autoExecution: { enabled: true, channel: 'crm', lastAction: '14:00 任务创建完成' },
      feedback: { executedAt: new Date(Date.now() - 7200000).toISOString(), revenueImpact: 2800000 },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 't3',
      title: '5家高风险伙伴待电话触达',
      description: '系统识别需要人工电话跟进的高风险伙伴',
      status: 'needs_human',
      progress: 0,
      autoExecution: { enabled: false, channel: 'internal', lastAction: '需要人工介入' },
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 't4',
      title: 'Pipeline更新提醒',
      description: '提醒12家伙伴更新商机进展',
      status: 'completed',
      progress: 100,
      autoExecution: { enabled: true, channel: 'wecom', lastAction: '昨日已发送' },
      feedback: { executedAt: new Date(Date.now() - 86400000).toISOString(), responseRate: 45 },
      createdAt: new Date(Date.now() - 90000000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
  
  const autopilot: DecisionAutopilot = {
    active: true,
    selectedStrategyId: 's1',
    selectedStrategyName: '快速止血方案',
    reasoning: [
      { factor: 'ROI', weight: 40, value: '56x（最高）' },
      { factor: '生效时间', weight: 35, value: '7天（最快）' },
      { factor: '风险等级', weight: 25, value: '低风险' },
    ],
    alternatives: [
      { strategyId: 's2', strategyName: '结构优化方案', roiDiff: -26, timeDiff: '+23天', riskDiff: '+5%' },
      { strategyId: 's3', strategyName: '长期生态建设', roiDiff: -40, timeDiff: '+83天', riskDiff: '+10%' },
    ],
    autoExecutionEnabled: true,
  };
  
  const learnings: LearningFeedback[] = [
    {
      id: 'l1',
      actionType: 'email',
      sampleSize: 156,
      effectiveness: { avgOpenRate: 62, avgResponseRate: 28, avgConversionRate: 15, avgRevenueLift: 450000 },
      insights: [
        { type: 'success', title: '周三发送打开率最高（68%）', description: '数据支持', confidence: 92 },
        { type: 'learning', title: '个性化主题行提升23%', description: '持续优化中', confidence: 85 },
      ],
      optimizationTips: [
        '建议在周三10:00-11:00发送激活邮件',
        '使用伙伴名称个性化邮件主题',
        '加入最近成交案例提升紧迫感',
      ],
      lastUpdated: new Date().toISOString(),
    },
  ];
  
  const digitalTwinCurrent: DigitalTwinPrediction = {
    scenario: '当前状态',
    timeline: 'Q2 2026',
    predicted: { revenue: 10800000, achievementRate: 72, partnerHealth: 62, pipelineHealth: 58 },
    confidenceInterval: { low: 68, high: 76, confidence: 89 },
    triggers: [],
  };
  
  const whatIfScenarios = [
    {
      condition: '执行快速止血方案',
      result: { scenario: '方案A', timeline: 'Q2', predicted: { revenue: 11300000, achievementRate: 75, partnerHealth: 68, pipelineHealth: 62 }, confidenceInterval: { low: 70, high: 80, confidence: 85 }, triggers: [{ action: '商机推进', probability: 75, expectedImpact: 500000 }] },
    },
    {
      condition: '延迟2周执行',
      result: { scenario: '延迟', timeline: 'Q2', predicted: { revenue: 9500000, achievementRate: 63, partnerHealth: 55, pipelineHealth: 52 }, confidenceInterval: { low: 58, high: 68, confidence: 82 }, triggers: [] },
    },
    {
      condition: '同时激活90家风险伙伴',
      result: { scenario: '全面激活', timeline: 'Q2', predicted: { revenue: 12500000, achievementRate: 83, partnerHealth: 75, pipelineHealth: 70 }, confidenceInterval: { low: 78, high: 88, confidence: 78 }, triggers: [{ action: '伙伴激活', probability: 65, expectedImpact: 1700000 }] },
    },
  ];
  
  const completedTasks = executionTasks.filter(t => t.status === 'completed');
  const inProgressTasks = executionTasks.filter(t => t.status === 'in_progress');
  const pendingTasks = executionTasks.filter(t => t.status === 'pending');
  const needsHumanTasks = executionTasks.filter(t => t.status === 'needs_human');
  
  const executiveDecisionLevel = diagnosisSummary.level === 'critical' ? 'critical'
    : diagnosisSummary.level === 'attention' ? 'warning'
    : 'healthy';
  
  const headlineMap = {
    critical: '渠道体系进入高风险失衡状态',
    warning: '渠道增长动能放缓，需优化运营效率',
    healthy: '渠道生态健康稳定运行',
  };
  
  return (
    <div className="space-y-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
            <Cpu className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Autonomous Revenue System</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-neutral-500">Q{quarter} {year}</span>
              <span className="text-neutral-300">·</span>
              <span className="text-sm text-neutral-500">
                季度进度 {timeProgress.timeProgress}% · 剩余 {timeProgress.daysRemaining} 天
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewChange?.('operations')}
            className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            详细指标
          </button>
          <button
            onClick={() => onViewChange?.('action_center')}
            className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            传统视图
          </button>
        </div>
      </div>

      {/* Autonomous Status Bar */}
      <AutonomousStatusBar
        mode="autonomous"
        uptime="连续运行 23h 45m"
        tasksProcessed={156}
        successRate={94}
      />

      {/* Decision Autopilot Banner */}
      <DecisionAutopilotBanner autopilot={autopilot} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICardV4
          kpi={{
            ...revenue,
            subtitle: '本季度实际营收 vs 目标',
            aiPrediction: 10800000,
            riskIfNoAction: 6500000,
          }}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="#10b981"
        />
        <KPICardV4
          kpi={{
            ...pipeline,
            label: 'Pipeline 覆盖率',
            subtitle: '活跃商机总值 / 剩余缺口',
          }}
          icon={<Layers className="w-5 h-5" />}
          accentColor="#3b82f6"
        />
        <KPICardV4
          kpi={{
            ...partners,
            label: 'Partner 健康指数',
            value: partnerPortfolioHealth.overallAvg || 0,
            target: 100,
            achievement: (partnerPortfolioHealth.overallAvg || 0) as number,
            subtitle: '加权平均：活跃度+收入+Pipeline+层级',
          }}
          icon={<Shield className="w-5 h-5" />}
          accentColor="#8b5cf6"
        />
      </div>

      {/* Execution Stream */}
      <ExecutionStream
        completed={completedTasks}
        inProgress={inProgressTasks}
        pending={pendingTasks}
        needsHuman={needsHumanTasks}
      />

      {/* Bottom Grid: Learning + Digital Twin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClosedLoopLearningPanel learnings={learnings} />
        <DigitalTwinSimulation
          current={digitalTwinCurrent}
          simulations={[]}
          whatIfScenarios={whatIfScenarios}
        />
      </div>
    </div>
  );
};

export function transformToExecutiveSummary(
  cockpitData: any,
  metrics: any
): ExecutiveSummaryData {
  const { revenue, activePartners, pipeline, insights } = cockpitData;

  const timeHealth = revenue?.time_health || metrics?.timeHealth;
  const healthStatus = timeHealth?.healthStatus || 'on_track';
  const healthScore = timeHealth?.healthScore || metrics?.healthScore || 50;

  const partnerHealthSummary = activePartners?.partner_health_summary || {
    overallAvg: 62,
    criticalCount: 7,
    excellentCount: 0,
    avgRevenueScore: 50,
    avgPipelineScore: 50,
    avgActivityScore: 50,
    avgTierScore: 50,
    distribution: { excellent: 0, good: 0, average: 0, at_risk: 0, critical: 0 },
  };

  const revenueKPI: ExecutiveKPI = {
    id: 'revenue',
    label: '季度营收',
    value: revenue?.achievements?.quarterly?.current || metrics?.quarter?.value || 8500000,
    target: revenue?.achievements?.quarterly?.target || metrics?.quarterlyTarget || 15000000,
    achievement: Math.min(revenue?.achievements?.quarterly?.rate || metrics?.quarterRate || 57, 999),
    trend: revenue?.qoq >= 0 ? 'up' : 'down',
    trendValue: revenue?.qoq || -12,
    status: healthStatus === 'ahead' ? 'excellent' : healthStatus === 'on_track' ? 'good' : healthStatus === 'at_risk' ? 'warning' : 'danger',
    sparkline: revenue?.monthly_data?.map((d: any) => d.value / 100000) || [85, 82, 78, 75, 72, 70, 68],
  };

  const pipelineKPI: ExecutiveKPI = {
    id: 'pipeline',
    label: 'Pipeline 覆盖率',
    value: pipeline?.current_value || metrics?.pipelineValue || 99400000,
    target: pipeline?.achievements?.quarterly?.target || metrics?.quarterlyTarget * 2 || 30000000,
    achievement: Math.min(pipeline?.achievements?.quarterly?.rate || metrics?.pipelineCoverageRatio || 331, 999),
    trend: pipeline?.qoq >= 0 ? 'up' : 'down',
    trendValue: pipeline?.qoq || 0,
    status: metrics?.pipelineCoverageRatio >= 150 ? 'excellent' : metrics?.pipelineCoverageRatio >= 100 ? 'good' : metrics?.pipelineCoverageRatio >= 50 ? 'warning' : 'danger',
    sparkline: pipeline?.monthly_data?.map((d: any) => d.value / 100000) || [],
  };

  const partnersKPI: ExecutiveKPI = {
    id: 'partners',
    label: '活跃伙伴数',
    value: activePartners?.current_value || metrics?.quarter?.partners || 82,
    target: activePartners?.total_partners || metrics?.quarter?.partners || 91,
    achievement: Math.min(activePartners?.achievements?.quarterly?.rate || 90, 999),
    trend: activePartners?.qoq >= 0 ? 'up' : 'down',
    trendValue: activePartners?.qoq || 0,
    status: partnerHealthSummary.criticalCount <= 5 ? 'good' : partnerHealthSummary.criticalCount <= 15 ? 'warning' : 'danger',
    sparkline: activePartners?.monthly_data?.map((d: any) => d.value) || [],
  };

  const diagnosisLevel = healthStatus === 'danger' || partnerHealthSummary.criticalCount > 15 ? 'critical' :
    healthStatus === 'at_risk' || partnerHealthSummary.criticalCount > 5 ? 'attention' : 'healthy';

  const quickInsights = (insights || []).slice(0, 3).map((i: any) => ({
    type: i.type as 'trend' | 'risk' | 'opportunity',
    title: i.title,
    priority: i.priority === 'high' ? 'high' : i.priority === 'medium' ? 'medium' : 'low',
  }));

  return {
    revenue: revenueKPI,
    pipeline: pipelineKPI,
    partners: partnersKPI,
    overallHealth: {
      score: healthScore,
      status: healthStatus,
      label: '业绩健康度',
      color: healthStatus === 'ahead' ? 'emerald' : healthStatus === 'on_track' ? 'blue' : healthStatus === 'at_risk' ? 'amber' : 'red',
    },
    partnerPortfolioHealth: partnerHealthSummary,
    diagnosisSummary: {
      level: diagnosisLevel,
      message: diagnosisLevel === 'critical'
        ? '渠道体系进入高风险失衡状态'
        : diagnosisLevel === 'attention'
        ? '渠道增长动能放缓，需优化运营效率'
        : '渠道生态健康稳定运行',
      actionCount: insights?.filter((i: any) => i.priority === 'high').length || 4,
    },
    timeProgress: timeHealth || {
      timeProgress: metrics?.quarterTimeProgress || 92,
      healthScore: healthScore,
      healthStatus: healthStatus,
      expectedRevenue: 0,
      gap: 0,
      gapPercent: 0,
      isCompleted: false,
      daysRemaining: 18,
      daysTotal: 90,
    },
    quickInsights,
  };
}
