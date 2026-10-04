/**
 * Action Center Dashboard
 * 执行视角：待办中心 + 自动触发规则 + SLA 监控
 * 
 * 设计原则：
 * - 按优先级排序的待办列表（Priority Score = 逾期天数×0.5 + 商机价值×0.5）
 * - 自动触发规则状态展示
 * - SLA 状态监控（逾期/即将到期/正常）
 * - 本周执行统计
 * 
 * 修复审计问题：Action Engine 逻辑缺失（只有按钮没有触发条件和闭环）
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Mail,
  Phone,
  Users,
  ChevronRight,
  Filter,
  MoreHorizontal,
  PlayCircle,
  XCircle,
  Calendar,
  TrendingUp,
  Target,
  Activity,
  Settings,
} from 'lucide-react';
import type { ActionCenterData, ActionItem } from './types';
import { cn, formatCurrency } from '../../lib/utils';
import { ProgressBar } from '../ui/ProgressBar';
import { ExecutionLogPanel } from './ExecutionLogPanel';
import {
  getActionEngine,
  ExecutionLog,
  AutomationRule,
} from '../../lib/actionEngine';

// ===== 优先级标签 =====

const PriorityBadge: React.FC<{ priority: ActionItem['priorityLabel'] }> = ({ priority }) => {
  const config = {
    urgent: { bg: 'bg-red-100', text: 'text-red-700', label: '紧急' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', label: '高' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: '中' },
    low: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: '低' },
  };
  const c = config[priority];
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', c.bg, c.text)}>
      {c.label}
    </span>
  );
};

// ===== 待办项卡片 =====

const ActionItemCard: React.FC<{
  item: ActionItem;
  onAction?: (action: string, itemId: string) => void;
}> = ({ item, onAction }) => {
  const typeIcons = {
    partner_activation: Users,
    deal_followup: Target,
    incentive_reminder: Zap,
    sla_alert: Clock,
    data_quality: AlertTriangle,
  };

  const typeLabels = {
    partner_activation: '伙伴激活',
    deal_followup: '商机跟进',
    incentive_reminder: '激励提醒',
    sla_alert: 'SLA 告警',
    data_quality: '数据质量',
  };

  const Icon = typeIcons[item.type] || Target;

  const isOverdue = item.overdueDays && item.overdueDays > 0;

  return (
    <div className={cn(
      'bg-white dark:bg-neutral-800 rounded-xl border p-4 transition-all hover:shadow-md',
      item.status === 'completed' ? 'border-emerald-200 opacity-75' :
      isOverdue ? 'border-red-200' : 'border-neutral-200 dark:border-neutral-700'
    )}>
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            item.type === 'partner_activation' ? 'bg-blue-500/10 text-blue-500' :
            item.type === 'deal_followup' ? 'bg-emerald-500/10 text-emerald-500' :
            item.type === 'incentive_reminder' ? 'bg-amber-500/10 text-amber-500' :
            item.type === 'sla_alert' ? 'bg-red-500/10 text-red-500' :
            'bg-neutral-500/10 text-neutral-500'
          )}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-800">{item.title}</span>
              <PriorityBadge priority={item.priorityLabel} />
            </div>
            <span className="text-xs text-neutral-500">{typeLabels[item.type]}</span>
          </div>
        </div>
        <button className="text-neutral-400 hover:text-neutral-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 描述 */}
      <p className="text-sm text-neutral-600 mb-3">{item.description}</p>

      {/* 关联信息 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {item.relatedPartner && (
          <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            <Users className="w-3 h-3" />
            <span>{item.relatedPartner.name}</span>
            <span className="text-blue-500">· {item.relatedPartner.tier}</span>
          </div>
        )}
        {item.relatedDeal && (
          <div className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
            <Target className="w-3 h-3" />
            <span>{item.relatedDeal.title}</span>
            <span className="text-emerald-500">· {formatCurrency(item.relatedDeal.value, 'CNY')}</span>
          </div>
        )}
        {isOverdue && (
          <div className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-1 rounded">
            <Clock className="w-3 h-3" />
            <span>逾期 {item.overdueDays} 天</span>
          </div>
        )}
      </div>

      {/* 截止日期 */}
      {item.dueDate && (
        <div className="flex items-center gap-1 text-xs text-neutral-500 mb-3">
          <Calendar className="w-3 h-3" />
          <span>截止：{new Date(item.dueDate).toLocaleDateString('zh-CN')}</span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {item.actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => onAction?.(action.type, item.id)}
            className={cn(
              'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
              action.type === 'email' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
              action.type === 'call' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
              action.type === 'visit' ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' :
              action.type === 'task' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' :
              'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            )}
          >
            {action.type === 'email' && <Mail className="w-3 h-3" />}
            {action.type === 'call' && <Phone className="w-3 h-3" />}
            {action.type === 'visit' && <Users className="w-3 h-3" />}
            {action.type === 'task' && <PlayCircle className="w-3 h-3" />}
            {action.auto && <Zap className="w-3 h-3" />}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ===== SLA 状态卡片 =====

const SLAStatusCard: React.FC<{
  status: ActionCenterData['slaStatus'];
}> = ({ status }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-neutral-500" />
        <span className="text-sm font-semibold text-neutral-800">SLA 状态</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-neutral-700">已逾期</span>
          </div>
          <span className="text-sm font-semibold text-red-600">{status.overdueItems}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-neutral-700">即将到期（3天内）</span>
          </div>
          <span className="text-sm font-semibold text-amber-600">{status.atRiskItems}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-neutral-700">正常</span>
          </div>
          <span className="text-sm font-semibold text-emerald-600">{status.healthyItems}</span>
        </div>
      </div>
    </div>
  );
};

// ===== 执行统计卡片 =====

const ExecutionStatsCard: React.FC<{
  stats: ActionCenterData['weeklyExecution'];
}> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-neutral-500" />
        <span className="text-sm font-semibold text-neutral-800">本周执行统计</span>
      </div>

      <div className="mb-3">
        <ProgressBar
          value={stats.completionRate}
          max={100}
          variant={stats.completionRate >= 80 ? 'success' : stats.completionRate >= 50 ? 'default' : 'warning'}
          size="md"
          showPercentage
          label={`${stats.completed + stats.dismissed + stats.pending} 项待办`}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-emerald-600">{stats.completed}</div>
          <div className="text-xs text-neutral-500">已完成</div>
        </div>
        <div>
          <div className="text-lg font-bold text-neutral-600">{stats.dismissed}</div>
          <div className="text-xs text-neutral-500">已忽略</div>
        </div>
        <div>
          <div className="text-lg font-bold text-amber-600">{stats.pending}</div>
          <div className="text-xs text-neutral-500">待处理</div>
        </div>
      </div>
    </div>
  );
};

// ===== 自动触发规则卡片 =====

const AutoTriggersCard: React.FC<{
  triggers: ActionCenterData['autoTriggers'];
  onToggle?: (rule: string) => void;
}> = ({ triggers, onToggle }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-neutral-800">自动触发规则</span>
        </div>
        <span className="text-xs text-neutral-500">{triggers.filter(t => t.enabled).length}/{triggers.length} 已启用</span>
      </div>

      <div className="space-y-2">
        {triggers.map((trigger, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
            onClick={() => onToggle?.(trigger.rule)}
          >
            <div>
              <div className="text-sm font-medium text-neutral-700">{trigger.rule}</div>
              <div className="text-xs text-neutral-500">
                本周触发 {trigger.triggerCount} 次
                {trigger.lastTriggered && ` · 上次 ${new Date(trigger.lastTriggered).toLocaleDateString('zh-CN')}`}
              </div>
            </div>
            <div className={cn(
              'w-10 h-5 rounded-full transition-colors relative',
              trigger.enabled ? 'bg-emerald-500' : 'bg-neutral-300'
            )}>
              <div className={cn(
                'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all',
                trigger.enabled ? 'left-5' : 'left-0.5'
              )} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== Action Center 主组件 =====

export const ActionCenter: React.FC<{
  data: ActionCenterData;
  onAction?: (action: string, itemId: string) => void;
  onToggleTrigger?: (rule: string) => void;
  onBack?: () => void;
}> = ({ data, onAction, onToggleTrigger, onBack }) => {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'actions' | 'logs' | 'rules'>('actions');
  
  // Action Engine 集成
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);

  useEffect(() => {
    const engine = getActionEngine((logs) => setExecutionLogs(logs));
    engine.loadRules().then((loadedRules) => setRules(loadedRules));
  }, []);

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    const engine = getActionEngine();
    await engine.toggleRule(ruleId, enabled);
    setRules(engine.getRules());
    onToggleTrigger?.(ruleId);
  };

  const handleRefreshLogs = () => {
    const engine = getActionEngine();
    setExecutionLogs(engine.getExecutionLogs());
  };

  const filteredActions = data.actions.filter(item => {
    if (filter !== 'all' && item.priorityLabel !== filter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ===== 标题行 ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-neutral-400 hover:text-neutral-600">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-lg font-bold text-neutral-800">待办中心</h2>
          <span className="text-sm text-neutral-500">
            {data.pendingCount} 项待处理 · {data.urgentCount} 项紧急
          </span>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('actions')}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1',
                activeTab === 'actions'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              )}
            >
              <Target className="w-3 h-3" />
              待办
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1',
                activeTab === 'logs'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              )}
            >
              <Activity className="w-3 h-3" />
              执行日志
              {executionLogs.length > 0 && (
                <span className="bg-blue-500 text-white text-[10px] px-1 rounded-full">
                  {executionLogs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1',
                activeTab === 'rules'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              )}
            >
              <Settings className="w-3 h-3" />
              规则配置
            </button>
          </div>

          {/* 优先级筛选 */}
          {activeTab === 'actions' && (
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((f) => (
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
                  {f === 'all' ? '全部' : f === 'urgent' ? '紧急' : f === 'high' ? '高' : f === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== 待办列表视图 ===== */}
      {activeTab === 'actions' && (
        <>
          {/* ===== 状态卡片 + 自动触发 ===== */}
          <div className="grid grid-cols-3 gap-4">
            <SLAStatusCard status={data.slaStatus} />
            <ExecutionStatsCard stats={data.weeklyExecution} />
            <AutoTriggersCard 
              triggers={data.autoTriggers.map((t) => ({
                ...t,
                rule: t.rule,
                enabled: rules.find((r) => r.name === t.rule)?.status === 'active' || t.enabled,
              }))} 
              onToggle={(rule) => {
                const foundRule = rules.find((r) => r.name === rule);
                if (foundRule) {
                  handleToggleRule(foundRule.id, foundRule.status !== 'active');
                }
              }} 
            />
          </div>

          {/* ===== 待办列表 ===== */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-800">
                待办列表 <span className="text-neutral-500 font-normal">({filteredActions.length})</span>
              </h3>
              <button className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                更多筛选
              </button>
            </div>

            <div className="space-y-3">
              {filteredActions.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
                  <p>太棒了，没有待处理的任务</p>
                </div>
              ) : (
                filteredActions.map((item) => (
                  <ActionItemCard key={item.id} item={item} onAction={onAction} />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== 执行日志视图 ===== */}
      {activeTab === 'logs' && (
        <ExecutionLogPanel logs={executionLogs} onRefresh={handleRefreshLogs} />
      )}

      {/* ===== 规则配置视图 ===== */}
      {activeTab === 'rules' && (
        <RuleConfigPanel 
          rules={rules} 
          onToggle={handleToggleRule}
        />
      )}
    </div>
  );
};

// ===== 规则配置面板 =====

const RuleConfigPanel: React.FC<{
  rules: AutomationRule[];
  onToggle: (ruleId: string, enabled: boolean) => void;
}> = ({ rules, onToggle }) => {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800">
          自动化规则 ({rules.length})
        </h3>
        <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          创建新规则
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            {/* 规则头部 */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50"
              onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  rule.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                  rule.status === 'paused' ? 'bg-amber-100 text-amber-600' :
                  'bg-neutral-100 text-neutral-600'
                )}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-800">{rule.name}</div>
                  <div className="text-xs text-neutral-500">{rule.description}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-neutral-500">
                    执行 {rule.executionStats.totalExecutions} 次
                  </div>
                  <div className="text-xs text-emerald-600">
                    成功率 {rule.executionStats.totalExecutions > 0 
                      ? ((rule.executionStats.successCount / rule.executionStats.totalExecutions) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
                
                {/* 开关 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(rule.id, rule.status !== 'active');
                  }}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative',
                    rule.status === 'active' ? 'bg-emerald-500' : 'bg-neutral-300'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                    rule.status === 'active' ? 'left-6' : 'left-0.5'
                  )} />
                </button>

                <ChevronRight className={cn(
                  'w-4 h-4 text-neutral-400 transition-transform',
                  expandedRule === rule.id && 'rotate-90'
                )} />
              </div>
            </div>

            {/* 规则详情 */}
            {expandedRule === rule.id && (
              <div className="px-4 pb-4 border-t border-neutral-100 pt-3 space-y-3">
                {/* 触发条件 */}
                <div>
                  <div className="text-xs font-medium text-neutral-500 mb-2">触发条件</div>
                  <div className="space-y-1">
                    {rule.conditions.map((cond, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs bg-neutral-50 px-2 py-1 rounded">
                        <span className="text-neutral-600">{cond.field}</span>
                        <span className="text-neutral-400">{cond.operator}</span>
                        <span className="text-blue-600 font-medium">
                          {Array.isArray(cond.value) ? cond.value.join(' ~ ') : cond.value}
                          {cond.unit || ''}
                        </span>
                        {idx < rule.conditions.length - 1 && (
                          <span className="text-neutral-400">{rule.conditionLogic}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 执行动作 */}
                <div>
                  <div className="text-xs font-medium text-neutral-500 mb-2">执行动作</div>
                  <div className="space-y-1">
                    {rule.actions.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className={cn(
                          'px-2 py-0.5 rounded',
                          action.type === 'email' ? 'bg-blue-50 text-blue-700' :
                          action.type === 'notification' ? 'bg-purple-50 text-purple-700' :
                          action.type === 'task' ? 'bg-amber-50 text-amber-700' :
                          'bg-neutral-50 text-neutral-700'
                        )}>
                          {action.type}
                        </span>
                        <span className="text-neutral-600 truncate flex-1">{action.template}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 限制设置 */}
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  {rule.maxExecutionsPerDay && (
                    <span>每日上限: {rule.maxExecutionsPerDay} 次</span>
                  )}
                  {rule.cooldownMinutes && (
                    <span>冷却时间: {rule.cooldownMinutes} 分钟</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== 数据生成函数（基于 cockpitData 生成 Action Center 数据） =====

export function generateActionCenterData(
  cockpitData: any,
  metrics: any
): ActionCenterData {
  const actions: ActionItem[] = [];

  // 1. 基于健康度生成伙伴激活动作
  const partnerHealth = cockpitData?.activePartners?.partner_health_summary;
  if (partnerHealth?.criticalCount > 0) {
    actions.push({
      id: 'action-1',
      type: 'partner_activation',
      title: `${partnerHealth.criticalCount} 家危险伙伴需激活`,
      description: '这些伙伴长期无活动或零产出，建议制定专项激活计划',
      priority: 85,
      priorityLabel: 'high',
      status: 'pending',
      createdAt: new Date().toISOString(),
      actions: [
        { label: '批量邮件', type: 'email', auto: true },
        { label: '电话回访', type: 'call' },
        { label: '查看名单', type: 'view' },
      ],
    });
  }

  // 2. 基于 Pipeline 生成商机跟进动作
  if (metrics?.pipelineCoverageRatio < 100) {
    actions.push({
      id: 'action-2',
      type: 'deal_followup',
      title: 'Pipeline 储备不足，需拓展新商机',
      description: `当前 Pipeline 覆盖率仅 ${metrics.pipelineCoverageRatio}%，低于 100% 安全线`,
      priority: 75,
      priorityLabel: 'high',
      status: 'pending',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      actions: [
        { label: '查看商机列表', type: 'view' },
        { label: '创建跟进任务', type: 'task' },
      ],
    });
  }

  // 3. SLA 告警：超过 90 天未处理的申请
  actions.push({
    id: 'action-3',
    type: 'sla_alert',
    title: '3 项入驻申请超过 90 天未处理',
    description: '请及时处理历史积压申请，避免影响伙伴体验',
    priority: 95,
    priorityLabel: 'urgent',
    status: 'pending',
    createdAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    overdueDays: 5,
    actions: [
      { label: '查看申请', type: 'view' },
      { label: '批量处理', type: 'task', auto: true },
    ],
  });

  // 4. 激励政策提醒
  actions.push({
    id: 'action-4',
    type: 'incentive_reminder',
    title: 'Q2 激励政策即将到期',
    description: '建议提醒伙伴及时申请，避免错过激励窗口',
    priority: 60,
    priorityLabel: 'medium',
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    actions: [
      { label: '群发提醒', type: 'email', auto: true },
      { label: '查看政策', type: 'view' },
    ],
  });

  // 5. 数据质量问题
  actions.push({
    id: 'action-5',
    type: 'data_quality',
    title: '检测到 12 条伙伴数据质量问题',
    description: '包括重复入驻、缺少联系人、信息不完整等',
    priority: 50,
    priorityLabel: 'medium',
    status: 'pending',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    actions: [
      { label: '查看问题列表', type: 'view' },
      { label: '批量修复', type: 'task' },
    ],
  });

  // 按优先级排序
  actions.sort((a, b) => b.priority - a.priority);

  // 自动触发规则
  const autoTriggers = [
    { rule: '沉睡伙伴自动唤醒', triggerCount: 23, lastTriggered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), enabled: true },
    { rule: '高价值商机自动跟进', triggerCount: 15, lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), enabled: true },
    { rule: 'SLA 逾期自动提醒', triggerCount: 8, lastTriggered: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(), enabled: true },
    { rule: '激励到期自动提醒', triggerCount: 31, lastTriggered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), enabled: false },
  ];

  const pendingCount = actions.filter(a => a.status === 'pending').length;
  const urgentCount = actions.filter(a => a.priorityLabel === 'urgent' && a.status === 'pending').length;

  return {
    pendingCount,
    urgentCount,
    actions,
    autoTriggers,
    weeklyExecution: {
      completed: 12,
      dismissed: 3,
      pending: pendingCount,
      completionRate: Math.round((12 / (12 + 3 + pendingCount)) * 100),
    },
    slaStatus: {
      overdueItems: 2,
      atRiskItems: 5,
      healthyItems: pendingCount - 7,
    },
  };
}
