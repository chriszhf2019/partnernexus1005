import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Plus, Trash2, Save, X, Settings, Clock,
  AlertTriangle, CheckCircle2, History, RefreshCw,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ProtectionRule, RuleExecutionLog } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';

interface RuleEnginePanelProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_RULE: Omit<ProtectionRule, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  protectionDays: 90,
  requireRecentActivity: true,
  recentActivityDays: 30,
  expireAction: 'notify_only',
  notifyBeforeDays: 7,
  enabled: true,
};

export const RuleEnginePanel: React.FC<RuleEnginePanelProps> = ({ open, onClose }) => {
  const [rules, setRules] = useState<ProtectionRule[]>([]);
  const [logs, setLogs] = useState<RuleExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<Partial<ProtectionRule> | null>(null);
  const [showNewRule, setShowNewRule] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) loadData();
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: rulesData } = await supabase.from('protection_rules').select('*').order('created_at', { ascending: true });
      if (rulesData) setRules(rulesData.map(normalizeRule));

      const { data: logsData } = await supabase.from('rule_execution_logs').select('*').order('executed_at', { ascending: false }).limit(30);
      if (logsData) setLogs(logsData.map(normalizeLog));
    } catch (e) {
      console.error('Failed to load rules:', e);
    } finally {
      setLoading(false);
    }
  };

  const normalizeRule = (row: any): ProtectionRule => ({
    id: row.id,
    name: row.name,
    protectionDays: row.protection_days,
    requireRecentActivity: row.require_recent_activity,
    recentActivityDays: row.recent_activity_days,
    expireAction: row.expire_action,
    notifyBeforeDays: row.notify_before_days,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const normalizeLog = (row: any): RuleExecutionLog => ({
    id: row.id,
    ruleId: row.rule_id,
    dealId: row.deal_id,
    action: row.action,
    details: row.details,
    executedAt: row.executed_at,
  });

  const handleSaveRule = async () => {
    if (!editingRule) return;
    setSaving(true);
    try {
      const snake: Record<string, any> = {
        name: editingRule.name,
        protection_days: editingRule.protectionDays,
        require_recent_activity: editingRule.requireRecentActivity,
        recent_activity_days: editingRule.recentActivityDays,
        expire_action: editingRule.expireAction,
        notify_before_days: editingRule.notifyBeforeDays,
        enabled: editingRule.enabled,
        updated_at: new Date().toISOString(),
      };

      if (editingRule.id) {
        await supabase.from('protection_rules').update(snake).eq('id', editingRule.id);
      } else {
        await supabase.from('protection_rules').insert(snake);
      }
      setEditingRule(null);
      setShowNewRule(false);
      await loadData();
    } catch (e) {
      console.error('Failed to save rule:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await supabase.from('protection_rules').delete().eq('id', id);
      await loadData();
    } catch (e) {
      console.error('Failed to delete rule:', e);
    }
  };

  const handleToggleRule = async (rule: ProtectionRule) => {
    try {
      await supabase.from('protection_rules').update({ enabled: !rule.enabled, updated_at: new Date().toISOString() }).eq('id', rule.id);
      await loadData();
    } catch (e) {
      console.error('Failed to toggle rule:', e);
    }
  };

  const actionLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
    notified: { label: '已通知', variant: 'success' },
    released: { label: '已释放', variant: 'danger' },
    warned: { label: '已预警', variant: 'warning' },
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] overflow-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">冲突裁决规则引擎</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={loadData}>
                <RefreshCw className="w-4 h-4" /> 刷新
              </Button>
              <Button variant="brand" size="sm" onClick={() => { setEditingRule({ ...DEFAULT_RULE }); setShowNewRule(true); }}>
                <Plus className="w-4 h-4" /> 添加规则
              </Button>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Rules List */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                保护规则配置
              </h3>
              {loading ? (
                <div className="text-center py-8 text-neutral-400">加载中...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">暂无规则，点击"添加规则"开始配置</div>
              ) : (
                <div className="space-y-3">
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-colors',
                        rule.enabled
                          ? 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                          : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 opacity-60'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            rule.enabled ? 'bg-brand/10' : 'bg-neutral-100 dark:bg-neutral-800'
                          )}>
                            <Shield className={cn('w-4 h-4', rule.enabled ? 'text-brand' : 'text-neutral-400')} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">{rule.name}</h4>
                              <Badge variant={rule.enabled ? 'success' : 'default'} size="sm">
                                {rule.enabled ? '启用' : '禁用'}
                              </Badge>
                              <Badge variant={rule.expireAction === 'auto_release' ? 'danger' : 'warning'} size="sm">
                                {rule.expireAction === 'auto_release' ? '自动释放' : '仅通知'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                              <span>保护期: {rule.protectionDays}天</span>
                              {rule.requireRecentActivity && <span>需近{rule.recentActivityDays}天有跟进</span>}
                              <span>提前{rule.notifyBeforeDays}天通知</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleRule(rule)}
                            className={cn(
                              'px-2 py-1 text-xs rounded-md transition-colors',
                              rule.enabled
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 hover:text-neutral-900'
                                : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 hover:text-emerald-700'
                            )}
                            title={rule.enabled ? '禁用' : '启用'}
                          >
                            {rule.enabled ? '禁用' : '启用'}
                          </button>
                          <button
                            onClick={() => setEditingRule(rule)}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-400 hover:text-brand"
                            title="编辑"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-neutral-400 hover:text-red-500"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Execution Logs */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                规则执行历史
              </h3>
              {logs.length === 0 ? (
                <div className="text-center py-6 text-neutral-400">暂无执行记录</div>
              ) : (
                <div className="space-y-1 max-h-[300px] overflow-auto">
                  {logs.map(log => {
                    const a = actionLabels[log.action] || { label: log.action, variant: 'default' as const };
                    return (
                      <div key={log.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-400">{new Date(log.executedAt).toLocaleString('zh-CN')}</span>
                          <span className="text-neutral-300">|</span>
                          <span className="text-neutral-600 dark:text-neutral-400 font-mono">{log.dealId}</span>
                          <Badge variant={a.variant} size="sm">{a.label}</Badge>
                        </div>
                        <span className="text-neutral-400">{log.details || '-'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Edit/Create Rule Modal */}
      <Modal
        open={!!editingRule || showNewRule}
        onClose={() => { setEditingRule(null); setShowNewRule(false); }}
        size="md"
        title={editingRule?.id ? '编辑规则' : '新建规则'}
      >
        {editingRule && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">规则名称</label>
              <input
                type="text"
                value={editingRule.name || ''}
                onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                placeholder="例如：首报保护期自动释放"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">保护期天数</label>
                <input
                  type="number"
                  value={editingRule.protectionDays || 90}
                  onChange={e => setEditingRule({ ...editingRule, protectionDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">提前通知天数</label>
                <input
                  type="number"
                  value={editingRule.notifyBeforeDays || 7}
                  onChange={e => setEditingRule({ ...editingRule, notifyBeforeDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                  min={0}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingRule.requireRecentActivity || false}
                  onChange={e => setEditingRule({ ...editingRule, requireRecentActivity: e.target.checked })}
                  className="rounded"
                />
                到期需有近期跟进记录
              </label>
              {editingRule.requireRecentActivity && (
                <div className="mt-2 ml-6">
                  <label className="text-xs text-neutral-500">近期天数阈值</label>
                  <input
                    type="number"
                    value={editingRule.recentActivityDays || 30}
                    onChange={e => setEditingRule({ ...editingRule, recentActivityDays: Number(e.target.value) })}
                    className="w-20 ml-2 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                    min={1}
                  />
                  <span className="text-xs text-neutral-400 ml-1">天</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">到期动作</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="expireAction"
                    checked={editingRule.expireAction === 'notify_only'}
                    onChange={() => setEditingRule({ ...editingRule, expireAction: 'notify_only' })}
                  />
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  仅提醒
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="expireAction"
                    checked={editingRule.expireAction === 'auto_release'}
                    onChange={() => setEditingRule({ ...editingRule, expireAction: 'auto_release' })}
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  自动释放到公海
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingRule.enabled ?? true}
                  onChange={e => setEditingRule({ ...editingRule, enabled: e.target.checked })}
                  className="rounded"
                />
                启用此规则
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => { setEditingRule(null); setShowNewRule(false); }}>
                取消
              </Button>
              <Button variant="brand" size="sm" onClick={handleSaveRule} disabled={saving || !editingRule.name}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AnimatePresence>
  );
};

export default RuleEnginePanel;
