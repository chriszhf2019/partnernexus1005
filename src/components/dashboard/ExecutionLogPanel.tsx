/**
 * Execution Log Panel - 执行日志与效果分析
 * 
 * 功能：
 * 1. 执行日志列表（实时更新）
 * 2. 效果分析（成功率、转化漏斗、ROI）
 * 3. 趋势图表
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SkipForward,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
  Phone,
  Bell,
  Zap,
  FileText,
  Globe,
  Filter,
  ChevronDown,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  getActionEngine,
  ExecutionLog,
  RuleEffectiveness,
  calculateRuleEffectiveness,
  ActionType,
} from '../../lib/actionEngine';
import { cn, formatCurrency } from '../../lib/utils';

// ===== 日志状态图标 =====

const StatusIcon: React.FC<{ status: ExecutionLog['status'] }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'skipped':
      return <SkipForward className="w-4 h-4 text-amber-500" />;
    case 'running':
      return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-neutral-400" />;
    default:
      return null;
  }
};

const StatusBadge: React.FC<{ status: ExecutionLog['status'] }> = ({ status }) => {
  const config = {
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '成功' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', label: '失败' },
    skipped: { bg: 'bg-amber-50', text: 'text-amber-700', label: '跳过' },
    running: { bg: 'bg-blue-50', text: 'text-blue-700', label: '执行中' },
    pending: { bg: 'bg-neutral-50', text: 'text-neutral-600', label: '等待' },
  };
  const c = config[status];
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', c.bg, c.text)}>
      {c.label}
    </span>
  );
};

// ===== 动作类型图标 =====

const ActionIcon: React.FC<{ type: ActionType }> = ({ type }) => {
  switch (type) {
    case 'email':
      return <Mail className="w-3 h-3" />;
    case 'sms':
      return <Phone className="w-3 h-3" />;
    case 'call':
      return <Phone className="w-3 h-3" />;
    case 'notification':
      return <Bell className="w-3 h-3" />;
    case 'task':
      return <FileText className="w-3 h-3" />;
    case 'webhook':
      return <Globe className="w-3 h-3" />;
    default:
      return <Zap className="w-3 h-3" />;
  }
};

// ===== 单条日志卡片 =====

const LogItem: React.FC<{ log: ExecutionLog }> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      {/* 头部 */}
      <div
        className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <StatusIcon status={log.status} />
          <div>
            <div className="text-sm font-medium text-neutral-800">{log.ruleName}</div>
            <div className="text-xs text-neutral-500">
              {new Date(log.startedAt).toLocaleString('zh-CN')}
              {log.durationMs && ` · ${log.durationMs}ms`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={log.status} />
          <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform', expanded && 'rotate-180')} />
        </div>
      </div>

      {/* 详情 */}
      {expanded && (
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
          {/* 触发数据 */}
          {log.triggerData.partnerName && (
            <div>
              <div className="text-xs font-medium text-neutral-500 mb-1">触发对象</div>
              <div className="text-sm text-neutral-700">
                {log.triggerData.partnerName}
                {log.triggerData.dealValue && ` · ${formatCurrency(log.triggerData.dealValue, 'CNY')}`}
              </div>
            </div>
          )}

          {/* 条件结果 */}
          {Object.keys(log.triggerData.conditionResults).length > 0 && (
            <div>
              <div className="text-xs font-medium text-neutral-500 mb-1">条件评估</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(log.triggerData.conditionResults).map(([field, satisfied]) => (
                  <span
                    key={field}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      satisfied
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    )}
                  >
                    {field}: {satisfied ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 动作结果 */}
          <div>
            <div className="text-xs font-medium text-neutral-500 mb-1">动作执行</div>
            <div className="space-y-1">
              {log.actionResults.map((result, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <ActionIcon type={result.type} />
                  <span className="text-neutral-600">{result.type}</span>
                  <span className={cn(
                    result.status === 'sent' ? 'text-emerald-600' :
                    result.status === 'failed' ? 'text-red-600' : 'text-amber-600'
                  )}>
                    {result.status === 'sent' ? '已发送' : result.status === 'failed' ? '失败' : '跳过'}
                  </span>
                  {result.errorMessage && (
                    <span className="text-red-500">({result.errorMessage})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 反馈 */}
          {log.feedback && (
            <div>
              <div className="text-xs font-medium text-neutral-500 mb-1">用户反馈</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {log.feedback.opened && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">已打开</span>
                )}
                {log.feedback.clicked && (
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">已点击</span>
                )}
                {log.feedback.replied && (
                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">已回复</span>
                )}
                {log.feedback.converted && (
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                    已转化 · {formatCurrency(log.feedback.conversionValue || 0, 'CNY')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== 效果分析卡片 =====

const EffectivenessCard: React.FC<{ data: RuleEffectiveness }> = ({ data }) => {
  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
  const trendColor = data.trend === 'up' ? 'text-emerald-500' : data.trend === 'down' ? 'text-red-500' : 'text-neutral-400';

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-neutral-800">{data.ruleName}</h4>
        <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(data.trendPercent).toFixed(1)}%</span>
        </div>
      </div>

      {/* 基础统计 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-neutral-500">执行次数</div>
          <div className="text-lg font-bold text-neutral-800">{data.totalExecutions}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">成功率</div>
          <div className="text-lg font-bold text-emerald-600">{(data.successRate * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* 转化漏斗 */}
      <div className="space-y-1">
        {[
          { label: '发送', value: data.sentCount, color: 'bg-blue-500' },
          { label: '打开', value: data.openedCount, color: 'bg-purple-500' },
          { label: '点击', value: data.clickedCount, color: 'bg-amber-500' },
          { label: '转化', value: data.convertedCount, color: 'bg-emerald-500' },
        ].map((stage) => (
          <div key={stage.label} className="flex items-center gap-2">
            <div className="w-12 text-xs text-neutral-500">{stage.label}</div>
            <div className="flex-1 h-4 bg-neutral-100 rounded overflow-hidden">
              <div
                className={cn('h-full rounded transition-all', stage.color)}
                style={{
                  width: `${data.sentCount > 0 ? (stage.value / data.sentCount) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="w-8 text-xs text-neutral-600 text-right">{stage.value}</div>
          </div>
        ))}
      </div>

      {/* ROI */}
      <div className="mt-3 pt-3 border-t border-neutral-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">ROI</span>
          <span className={cn(
            'text-sm font-bold',
            data.roi > 0 ? 'text-emerald-600' : data.roi < 0 ? 'text-red-600' : 'text-neutral-600'
          )}>
            {data.roi > 0 ? '+' : ''}{data.roi.toFixed(1)}%
          </span>
        </div>
        <div className="text-xs text-neutral-500 text-right">
          价值 {formatCurrency(data.totalValue, 'CNY')}
        </div>
      </div>
    </div>
  );
};

// ===== 执行日志面板主组件 =====

export const ExecutionLogPanel: React.FC<{
  logs: ExecutionLog[];
  onRefresh?: () => void;
}> = ({ logs, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'effectiveness'>('logs');
  const [statusFilter, setStatusFilter] = useState<ExecutionLog['status'] | 'all'>('all');
  const [ruleFilter, setRuleFilter] = useState<string>('all');

  // 获取唯一规则列表
  const rules = useMemo(() => {
    const ruleSet = new Set(logs.map((l) => l.ruleName));
    return ['all', ...Array.from(ruleSet)];
  }, [logs]);

  // 过滤日志
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (ruleFilter !== 'all' && log.ruleName !== ruleFilter) return false;
      return true;
    });
  }, [logs, statusFilter, ruleFilter]);

  // 计算效果分析
  const effectivenessData = useMemo(() => {
    return calculateRuleEffectiveness(logs);
  }, [logs]);

  // 统计摘要
  const summary = useMemo(() => {
    const total = logs.length;
    const completed = logs.filter((l) => l.status === 'completed').length;
    const failed = logs.filter((l) => l.status === 'failed').length;
    const skipped = logs.filter((l) => l.status === 'skipped').length;
    const converted = logs.filter((l) => l.feedback?.converted).length;
    const totalValue = logs.reduce(
      (sum, l) => sum + (l.feedback?.conversionValue || 0),
      0
    );

    return {
      total,
      completed,
      failed,
      skipped,
      successRate: total > 0 ? completed / total : 0,
      converted,
      totalValue,
    };
  }, [logs]);

  return (
    <div className="space-y-4">
      {/* 统计摘要 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 p-3">
          <div className="text-xs text-neutral-500">总执行次数</div>
          <div className="text-xl font-bold text-neutral-800">{summary.total}</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-emerald-200 p-3">
          <div className="text-xs text-neutral-500">成功率</div>
          <div className="text-xl font-bold text-emerald-600">
            {(summary.successRate * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 p-3">
          <div className="text-xs text-neutral-500">转化数</div>
          <div className="text-xl font-bold text-purple-600">{summary.converted}</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 p-3">
          <div className="text-xs text-neutral-500">创造价值</div>
          <div className="text-xl font-bold text-amber-600">
            {formatCurrency(summary.totalValue, 'CNY')}
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('logs')}
            className={cn(
              'text-xs px-3 py-1.5 rounded-md font-medium transition-colors',
              activeTab === 'logs'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            )}
          >
            <Clock className="w-3 h-3 inline mr-1" />
            执行日志
          </button>
          <button
            onClick={() => setActiveTab('effectiveness')}
            className={cn(
              'text-xs px-3 py-1.5 rounded-md font-medium transition-colors',
              activeTab === 'effectiveness'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            )}
          >
            <BarChart3 className="w-3 h-3 inline mr-1" />
            效果分析
          </button>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            刷新
          </button>
        )}
      </div>

      {/* 执行日志列表 */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          {/* 过滤器 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs border border-neutral-200 rounded px-2 py-1 bg-white"
              >
                <option value="all">全部状态</option>
                <option value="completed">成功</option>
                <option value="failed">失败</option>
                <option value="skipped">跳过</option>
                <option value="running">执行中</option>
              </select>
            </div>
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              className="text-xs border border-neutral-200 rounded px-2 py-1 bg-white"
            >
              {rules.map((rule) => (
                <option key={rule} value={rule}>
                  {rule === 'all' ? '全部规则' : rule}
                </option>
              ))}
            </select>
          </div>

          {/* 日志列表 */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Activity className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
              <p>暂无执行日志</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLogs.slice(0, 50).map((log) => (
                <LogItem key={log.id} log={log} />
              ))}
              {filteredLogs.length > 50 && (
                <div className="text-center py-2 text-xs text-neutral-500">
                  还有 {filteredLogs.length - 50} 条日志...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 效果分析 */}
      {activeTab === 'effectiveness' && (
        <div className="grid grid-cols-2 gap-4">
          {effectivenessData.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-neutral-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
              <p>暂无效果数据</p>
              <p className="text-xs">执行自动化规则后，将显示效果分析</p>
            </div>
          ) : (
            effectivenessData.map((data) => (
              <EffectivenessCard key={data.ruleId} data={data} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
