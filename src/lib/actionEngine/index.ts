/**
 * Action Engine - 自动化规则引擎
 * 
 * 核心功能：
 * 1. 规则定义（触发条件 + 执行动作）
 * 2. 规则评估（检查条件是否满足）
 * 3. 规则执行（执行动作并记录日志）
 * 4. 规则管理（启用/禁用/编辑规则）
 * 
 * 解决的问题：Action Center 只有按钮没有闭环
 */

import { supabase } from '../supabase';
import { formatCurrency } from '../utils';

// ===== 触发条件类型 =====

export type ConditionOperator = '>' | '<' | '>=' | '<=' | '==' | '!=' | 'between';

export type ConditionField = 
  | 'partner_health_score'      // 伙伴健康度
  | 'deal_value'                // 商机价值
  | 'deal_age_days'              // 商机天数
  | 'pipeline_coverage'          // Pipeline 覆盖率
  | 'revenue_achievement_rate'   // 营收完成率
  | 'partner_activity_days'      // 伙伴活跃天数
  | 'sla_overdue_days'           // SLA 逾期天数
  | 'application_amount'         // 申请金额
  | 'partner_count'              // 伙伴数量
  | 'time_progress';            // 时间进度

export interface RuleCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value: number | [number, number]; // 单值或区间
  unit?: string;                    // 单位：%, days, CNY
}

export type ActionType = 
  | 'email'           // 发送邮件
  | 'sms'             // 发送短信
  | 'call'            // 自动外呼
  | 'task'            // 创建待办任务
  | 'notification'    // 应用内通知
  | 'webhook';        // 触发 Webhook

export interface RuleAction {
  type: ActionType;
  template: string;                        // 消息模板
  recipients?: { type: 'partner' | 'user'; id: string }[]; // 接收者
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// ===== 规则定义 =====

export type RuleStatus = 'active' | 'paused' | 'draft';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  status: RuleStatus;
  
  // 触发条件
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';            // 条件逻辑：全部满足/任一满足
  
  // 执行动作
  actions: RuleAction[];
  
  // 限制
  maxExecutionsPerDay?: number;            // 每日最大执行次数
  cooldownMinutes?: number;                 // 冷却时间（分钟）
  targetScope?: { type: 'all' | 'tier'; tier?: string }; // 目标范围
  
  // 统计
  executionStats: {
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    lastExecutedAt?: string;
  };
  
  // 元数据
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ===== 执行日志 =====

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  
  // 执行上下文
  triggerData: {
    partnerId?: string;
    partnerName?: string;
    dealId?: string;
    dealValue?: number;
    conditionResults: Record<string, boolean>;
  };
  
  // 执行结果
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  
  // 动作结果
  actionResults: Array<{
    type: ActionType;
    status: 'sent' | 'failed' | 'skipped';
    recipientCount: number;
    errorMessage?: string;
  }>;
  
  // 反馈
  feedback?: {
    opened?: boolean;
    clicked?: boolean;
    replied?: boolean;
    converted?: boolean;
    conversionValue?: number;
  };
}

// ===== 预置规则 =====

export const PRESET_RULES: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '沉睡伙伴自动唤醒',
    description: '当伙伴超过 30 天无活动时，自动发送激活邮件',
    status: 'active',
    conditions: [
      { field: 'partner_activity_days', operator: '>', value: 30, unit: 'days' },
      { field: 'partner_health_score', operator: '<', value: 40, unit: '%' },
    ],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'email',
        template: '【重要】您的 PartnerNexus 伙伴账户已沉睡 {{days}} 天，我们想念您！',
        priority: 'medium',
      },
      {
        type: 'task',
        template: '跟进沉睡伙伴 {{partner_name}}',
        priority: 'high',
      },
    ],
    maxExecutionsPerDay: 50,
    cooldownMinutes: 1440, // 24 小时
    executionStats: { totalExecutions: 0, successCount: 0, failureCount: 0 },
    createdBy: 'system',
  },
  {
    name: '高价值商机自动跟进',
    description: '当 Pipeline 中出现超过 50 万的商机时，自动创建高优先级跟进任务',
    status: 'active',
    conditions: [
      { field: 'deal_value', operator: '>=', value: 500000, unit: 'CNY' },
      { field: 'deal_age_days', operator: '>', value: 7, unit: 'days' },
    ],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'notification',
        template: '🎯 高价值商机预警：{{deal_name}} (¥{{deal_value}}) 超过 7 天未跟进',
        priority: 'urgent',
      },
      {
        type: 'task',
        template: '优先跟进 {{deal_name}} - 价值 ¥{{deal_value}}',
        priority: 'high',
      },
    ],
    cooldownMinutes: 60,
    executionStats: { totalExecutions: 0, successCount: 0, failureCount: 0 },
    createdBy: 'system',
  },
  {
    name: 'SLA 逾期自动提醒',
    description: '当申请超过 SLA 阈值时，自动发送提醒给负责人',
    status: 'active',
    conditions: [
      { field: 'sla_overdue_days', operator: '>', value: 0, unit: 'days' },
    ],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'notification',
        template: '⚠️ SLA 告警：{{application_type}} 已逾期 {{days}} 天',
        priority: 'urgent',
      },
      {
        type: 'email',
        template: '您有待处理申请已超过 SLA，请尽快处理',
        priority: 'high',
      },
    ],
    maxExecutionsPerDay: 100,
    cooldownMinutes: 480, // 8 小时
    executionStats: { totalExecutions: 0, successCount: 0, failureCount: 0 },
    createdBy: 'system',
  },
  {
    name: 'Pipeline 储备预警',
    description: '当 Pipeline 覆盖率低于 100% 时，每周自动发送预警',
    status: 'paused',
    conditions: [
      { field: 'pipeline_coverage', operator: '<', value: 100, unit: '%' },
    ],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'email',
        template: '📊 Pipeline 预警：当前覆盖率 {{coverage}}%，低于安全线 100%，建议拓展新商机',
        priority: 'medium',
      },
    ],
    cooldownMinutes: 10080, // 7 天
    executionStats: { totalExecutions: 0, successCount: 0, failureCount: 0 },
    createdBy: 'system',
  },
  {
    name: '激励政策到期提醒',
    description: '当伙伴的激励申请即将到期（7天内）时，自动发送提醒',
    status: 'active',
    conditions: [
      { field: 'application_amount', operator: '>', value: 0, unit: 'CNY' },
    ],
    conditionLogic: 'AND',
    actions: [
      {
        type: 'email',
        template: '💰 您的激励申请 ¥{{amount}} 还有 7 天到期，请及时处理',
        priority: 'medium',
      },
    ],
    cooldownMinutes: 43200, // 30 天
    executionStats: { totalExecutions: 0, successCount: 0, failureCount: 0 },
    createdBy: 'system',
  },
];

// ===== 规则引擎核心逻辑 =====

export class ActionEngine {
  private rules: AutomationRule[] = [];
  private executionLogs: ExecutionLog[] = [];
  private onLogUpdate?: (logs: ExecutionLog[]) => void;

  constructor(onLogUpdate?: (logs: ExecutionLog[]) => void) {
    this.onLogUpdate = onLogUpdate;
  }

  /**
   * 加载规则
   */
  async loadRules(): Promise<AutomationRule[]> {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        this.rules = data;
      } else {
        // 初始化预置规则
        await this.initializePresetRules();
      }

      return this.rules;
    } catch (e) {
      console.warn('[ActionEngine] 加载规则失败，使用预置规则:', e);
      this.rules = PRESET_RULES.map((r, i) => ({
        ...r,
        id: `preset-${i + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      return this.rules;
    }
  }

  /**
   * 初始化预置规则到数据库
   */
  private async initializePresetRules(): Promise<void> {
    try {
      const rulesToInsert = PRESET_RULES.map((r) => ({
        ...r,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('automation_rules')
        .insert(rulesToInsert);

      if (error) throw error;

      // 重新加载
      const { data } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        this.rules = data;
      }
    } catch (e) {
      console.warn('[ActionEngine] 初始化预置规则失败:', e);
      this.rules = PRESET_RULES.map((r, i) => ({
        ...r,
        id: `preset-${i + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
  }

  /**
   * 获取所有规则
   */
  getRules(): AutomationRule[] {
    return this.rules;
  }

  /**
   * 获取活跃规则
   */
  getActiveRules(): AutomationRule[] {
    return this.rules.filter((r) => r.status === 'active');
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(condition: RuleCondition, context: Record<string, number>): boolean {
    const value = context[condition.field];
    if (value === undefined) return false;

    const { operator, value: threshold } = condition;

    switch (operator) {
      case '>':
        return value > (threshold as number);
      case '<':
        return value < (threshold as number);
      case '>=':
        return value >= (threshold as number);
      case '<=':
        return value <= (threshold as number);
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      case 'between':
        const [min, max] = threshold as [number, number];
        return value >= min && value <= max;
      default:
        return false;
    }
  }

  /**
   * 评估规则是否满足条件
   */
  evaluateRule(rule: AutomationRule, context: Record<string, number>): {
    satisfied: boolean;
    results: Record<string, boolean>;
  } {
    const results: Record<string, boolean> = {};
    
    for (const condition of rule.conditions) {
      results[condition.field] = this.evaluateCondition(condition, context);
    }

    const satisfied = rule.conditionLogic === 'AND'
      ? Object.values(results).every(Boolean)
      : Object.values(results).some(Boolean);

    return { satisfied, results };
  }

  /**
   * 评估所有规则
   */
  evaluateAllRules(context: Record<string, number>): Array<{
    rule: AutomationRule;
    satisfied: boolean;
    results: Record<string, boolean>;
  }> {
    return this.getActiveRules().map((rule) => ({
      rule,
      ...this.evaluateRule(rule, context),
    }));
  }

  /**
   * 检查冷却时间
   */
  private isInCooldown(rule: AutomationRule): boolean {
    if (!rule.executionStats.lastExecutedAt || !rule.cooldownMinutes) return false;

    const lastExecution = new Date(rule.executionStats.lastExecutedAt).getTime();
    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    const now = Date.now();

    return now - lastExecution < cooldownMs;
  }

  /**
   * 检查每日执行次数限制
   */
  private isOverDailyLimit(rule: AutomationRule): boolean {
    if (!rule.maxExecutionsPerDay) return false;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayExecutions = this.executionLogs.filter(
      (log) =>
        log.ruleId === rule.id &&
        new Date(log.startedAt).getTime() >= todayStart.getTime()
    ).length;

    return todayExecutions >= rule.maxExecutionsPerDay;
  }

  /**
   * 执行单个动作
   */
  private async executeAction(
    action: RuleAction,
    context: Record<string, any>
  ): Promise<{ status: 'sent' | 'failed' | 'skipped'; errorMessage?: string }> {
    try {
      // 模拟动作执行（实际项目中会调用真实 API）
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 替换模板变量
      const message = this.interpolateTemplate(action.template, context);

      console.log(`[ActionEngine] 执行动作 ${action.type}: ${message}`);

      // 根据动作类型执行
      switch (action.type) {
        case 'email':
          await this.sendEmail(action, message, context);
          break;
        case 'sms':
          await this.sendSms(action, message, context);
          break;
        case 'call':
          await this.initiateCall(action, message, context);
          break;
        case 'task':
          await this.createTask(action, message, context);
          break;
        case 'notification':
          await this.sendNotification(action, message, context);
          break;
        case 'webhook':
          await this.triggerWebhook(action, message, context);
          break;
      }

      return { status: 'sent' };
    } catch (e: any) {
      console.error(`[ActionEngine] 动作执行失败:`, e);
      return { status: 'failed', errorMessage: e.message };
    }
  }

  /**
   * 替换模板变量
   */
  private interpolateTemplate(template: string, context: Record<string, any>): string {
    return template
      .replace(/\{\{partner_name\}\}/g, context.partnerName || '未知伙伴')
      .replace(/\{\{deal_name\}\}/g, context.dealName || '未知商机')
      .replace(/\{\{deal_value\}\}/g, formatCurrency(context.dealValue || 0, 'CNY'))
      .replace(/\{\{days\}\}/g, String(context.days || 0))
      .replace(/\{\{coverage\}\}/g, `${context.coverage || 0}%`)
      .replace(/\{\{amount\}\}/g, formatCurrency(context.amount || 0, 'CNY'))
      .replace(/\{\{application_type\}\}/g, context.applicationType || '申请');
  }

  /**
   * 发送邮件
   */
  private async sendEmail(action: RuleAction, message: string, context: any): Promise<void> {
    // 实际项目中调用邮件服务 API
    console.log(`[ActionEngine] 发送邮件: ${message}`);
  }

  /**
   * 发送短信
   */
  private async sendSms(action: RuleAction, message: string, context: any): Promise<void> {
    console.log(`[ActionEngine] 发送短信: ${message}`);
  }

  /**
   * 自动外呼
   */
  private async initiateCall(action: RuleAction, message: string, context: any): Promise<void> {
    console.log(`[ActionEngine] 自动外呼: ${message}`);
  }

  /**
   * 创建任务
   */
  private async createTask(action: RuleAction, message: string, context: any): Promise<void> {
    console.log(`[ActionEngine] 创建任务: ${message}`);
  }

  /**
   * 发送通知
   */
  private async sendNotification(action: RuleAction, message: string, context: any): Promise<void> {
    console.log(`[ActionEngine] 发送通知: ${message}`);
  }

  /**
   * 触发 Webhook
   */
  private async triggerWebhook(action: RuleAction, message: string, context: any): Promise<void> {
    console.log(`[ActionEngine] 触发 Webhook: ${message}`);
  }

  /**
   * 执行规则
   */
  async executeRule(
    rule: AutomationRule,
    context: Record<string, any>
  ): Promise<ExecutionLog> {
    const startTime = Date.now();

    const log: ExecutionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      triggerData: {
        partnerId: context.partnerId,
        partnerName: context.partnerName,
        dealId: context.dealId,
        dealValue: context.dealValue,
        conditionResults: {},
      },
      status: 'running',
      startedAt: new Date().toISOString(),
      actionResults: [],
    };

    try {
      // 检查冷却时间
      if (this.isInCooldown(rule)) {
        log.status = 'skipped';
        log.actionResults = [{
          type: rule.actions[0]?.type || 'notification',
          status: 'skipped',
          recipientCount: 0,
          errorMessage: '冷却时间内，跳过执行',
        }];
        this.addExecutionLog(log);
        return log;
      }

      // 检查每日限制
      if (this.isOverDailyLimit(rule)) {
        log.status = 'skipped';
        log.actionResults = [{
          type: rule.actions[0]?.type || 'notification',
          status: 'skipped',
          recipientCount: 0,
          errorMessage: '已达每日执行上限',
        }];
        this.addExecutionLog(log);
        return log;
      }

      // 执行所有动作
      for (const action of rule.actions) {
        const result = await this.executeAction(action, context);
        log.actionResults.push({
          type: action.type,
          ...result,
          recipientCount: action.recipients?.length || 1,
        });
      }

      log.status = 'completed';
      log.completedAt = new Date().toISOString();
      log.durationMs = Date.now() - startTime;

      // 更新规则统计
      rule.executionStats.totalExecutions++;
      rule.executionStats.successCount++;
      rule.executionStats.lastExecutedAt = log.startedAt;

      await this.saveRuleStats(rule);
    } catch (e: any) {
      log.status = 'failed';
      log.completedAt = new Date().toISOString();
      log.durationMs = Date.now() - startTime;
      rule.executionStats.totalExecutions++;
      rule.executionStats.failureCount++;
    }

    this.addExecutionLog(log);
    return log;
  }

  /**
   * 添加执行日志
   */
  private addExecutionLog(log: ExecutionLog): void {
    this.executionLogs.unshift(log);
    // 保留最近 1000 条日志
    if (this.executionLogs.length > 1000) {
      this.executionLogs = this.executionLogs.slice(0, 1000);
    }
    this.onLogUpdate?.(this.executionLogs);
  }

  /**
   * 获取执行日志
   */
  getExecutionLogs(): ExecutionLog[] {
    return this.executionLogs;
  }

  /**
   * 保存规则统计到数据库
   */
  private async saveRuleStats(rule: AutomationRule): Promise<void> {
    try {
      await supabase
        .from('automation_rules')
        .update({
          execution_stats: rule.executionStats,
          last_executed_at: rule.executionStats.lastExecutedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rule.id);
    } catch (e) {
      console.warn('[ActionEngine] 保存规则统计失败:', e);
    }
  }

  /**
   * 切换规则状态
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({
          status: enabled ? 'active' : 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId);

      if (error) throw error;

      const rule = this.rules.find((r) => r.id === ruleId);
      if (rule) {
        rule.status = enabled ? 'active' : 'paused';
        rule.updatedAt = new Date().toISOString();
      }

      return true;
    } catch (e) {
      console.error('[ActionEngine] 切换规则状态失败:', e);
      return false;
    }
  }

  /**
   * 创建新规则
   */
  async createRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionStats'>): Promise<AutomationRule | null> {
    try {
      const newRule: AutomationRule = {
        ...rule,
        id: `rule-${Date.now()}`,
        executionStats: { totalExecutions: 0, successCount: 0, failureCount: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('automation_rules')
        .insert(newRule);

      if (error) throw error;

      this.rules.unshift(newRule);
      return newRule;
    } catch (e) {
      console.error('[ActionEngine] 创建规则失败:', e);
      return null;
    }
  }

  /**
   * 删除规则
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      this.rules = this.rules.filter((r) => r.id !== ruleId);
      return true;
    } catch (e) {
      console.error('[ActionEngine] 删除规则失败:', e);
      return false;
    }
  }
}

// ===== 效果分析 =====

export interface RuleEffectiveness {
  ruleId: string;
  ruleName: string;
  
  // 基础统计
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
  
  // 转化漏斗
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  repliedCount: number;
  convertedCount: number;
  
  // ROI
  totalValue: number;
  roi: number;
  
  // 趋势
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export function calculateRuleEffectiveness(logs: ExecutionLog[]): RuleEffectiveness[] {
  const ruleMap = new Map<string, ExecutionLog[]>();

  // 按规则分组
  for (const log of logs) {
    if (!ruleMap.has(log.ruleId)) {
      ruleMap.set(log.ruleId, []);
    }
    ruleMap.get(log.ruleId)!.push(log);
  }

  const results: RuleEffectiveness[] = [];

  for (const [ruleId, ruleLogs] of ruleMap) {
    const totalExecutions = ruleLogs.length;
    const completedLogs = ruleLogs.filter((l) => l.status === 'completed');
    const successRate = totalExecutions > 0 ? completedLogs.length / totalExecutions : 0;

    // 计算平均响应时间
    const durations = completedLogs
      .filter((l) => l.durationMs)
      .map((l) => l.durationMs!);
    const avgResponseTime = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    // 转化漏斗
    let sentCount = 0, openedCount = 0, clickedCount = 0, repliedCount = 0, convertedCount = 0;
    let totalValue = 0;

    for (const log of completedLogs) {
      sentCount += log.actionResults.filter((a) => a.status === 'sent').length;
      
      if (log.feedback) {
        if (log.feedback.opened) openedCount++;
        if (log.feedback.clicked) clickedCount++;
        if (log.feedback.replied) repliedCount++;
        if (log.feedback.converted) {
          convertedCount++;
          totalValue += log.feedback.conversionValue || 0;
        }
      }
    }

    // ROI 计算（假设每次执行成本 10 元）
    const cost = totalExecutions * 10;
    const roi = cost > 0 ? ((totalValue - cost) / cost) * 100 : 0;

    // 趋势分析（最近 7 天 vs 前 7 天）
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const recentLogs = ruleLogs.filter((l) => now - new Date(l.startedAt).getTime() < weekMs);
    const olderLogs = ruleLogs.filter(
      (l) =>
        now - new Date(l.startedAt).getTime() >= weekMs &&
        now - new Date(l.startedAt).getTime() < 2 * weekMs
    );

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercent = 0;

    if (olderLogs.length > 0 && recentLogs.length > 0) {
      const recentRate = recentLogs.filter((l) => l.status === 'completed').length / recentLogs.length;
      const olderRate = olderLogs.filter((l) => l.status === 'completed').length / olderLogs.length;
      trendPercent = ((recentRate - olderRate) / (olderRate || 1)) * 100;
      trend = trendPercent > 10 ? 'up' : trendPercent < -10 ? 'down' : 'stable';
    }

    results.push({
      ruleId,
      ruleName: ruleLogs[0]?.ruleName || '未知规则',
      totalExecutions,
      successRate,
      avgResponseTime,
      sentCount,
      openedCount,
      clickedCount,
      repliedCount,
      convertedCount,
      totalValue,
      roi,
      trend,
      trendPercent,
    });
  }

  return results.sort((a, b) => b.totalExecutions - a.totalExecutions);
}

// ===== 单例导出 =====

let actionEngineInstance: ActionEngine | null = null;

export function getActionEngine(
  onLogUpdate?: (logs: ExecutionLog[]) => void
): ActionEngine {
  if (!actionEngineInstance) {
    actionEngineInstance = new ActionEngine(onLogUpdate);
  }
  return actionEngineInstance;
}
