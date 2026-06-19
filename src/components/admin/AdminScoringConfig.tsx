// ─────────────────────────────────────────────────────────────────────────────
// 评分配置管理页面
// ─────────────────────────────────────────────────────────────────────────────
// 管理员可在此页面动态调整评分权重和阈值
// 访问路径：/admin/scoring
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import { scoringConfigService } from '../../services/config-service';
import { monthlySnapshotService } from '../../services/monthly-snapshot-service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import type { ScoringConfigItem } from '../../types/config';

const CATEGORY_LABELS: Record<string, string> = {
  tier: '等级配置',
  weight: '权重配置',
  penalty: '扣分规则',
  churn: '流失风险',
  system: '系统配置',
};

const CATEGORY_COLORS: Record<string, string> = {
  tier: 'bg-purple-100 text-purple-800',
  weight: 'bg-blue-100 text-blue-800',
  penalty: 'bg-red-100 text-red-800',
  churn: 'bg-amber-100 text-amber-800',
  system: 'bg-neutral-100 text-neutral-800',
};

interface WeightEditorProps {
  title: string;
  description?: string;
  weights: Record<string, number>;
  onSave: (weights: Record<string, number>) => void;
  onCancel: () => void;
}

function WeightEditor({ title, description, weights, onSave, onCancel }: WeightEditorProps) {
  const [localWeights, setLocalWeights] = useState<Record<string, number>>(weights);
  const sum = Object.values(localWeights).reduce((acc, v) => acc + v, 0);
  const isValid = Math.abs(sum - 1) < 0.01;

  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  const handleChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalWeights({ ...localWeights, [key]: Math.max(0, Math.min(1, numValue)) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
        </div>

        <div className="p-4 space-y-4">
          {Object.entries(localWeights).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <label className="w-24 text-sm">{key}</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={value}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-neutral-500">{Math.round(value * 100)}%</span>
            </div>
          ))}

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm font-medium">权重总和</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isValid ? 'text-emerald-600' : 'text-red-500'}`}>
                {Math.round(sum * 100)}%
              </span>
              {!isValid && <Badge variant="warning">应为 100%</Badge>}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button onClick={() => isValid && onSave(localWeights)} disabled={!isValid}>保存</Button>
        </div>
      </div>
    </div>
  );
}

export function AdminScoringConfig() {
  const [configs, setConfigs] = useState<ScoringConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<ScoringConfigItem | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<{ year: number; month: number; timestamp: string } | null>(null);
  const [runningSnapshot, setRunningSnapshot] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('weight');

  useEffect(() => {
    loadConfigs();
    loadLastSnapshot();
  }, []);

  // 按分类分组
  const groupedConfigs = useMemo(() => {
    return configs.reduce((acc, config) => {
      const category = config.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(config);
      return acc;
    }, {} as Record<string, ScoringConfigItem[]>);
  }, [configs]);

  const categories = useMemo(() => Object.keys(groupedConfigs).sort(), [groupedConfigs]);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const loadConfigs = async () => {
    setLoading(true);
    const data = await scoringConfigService.getAllConfigItems();
    setConfigs(data);
    setLoading(false);
  };

  const loadLastSnapshot = async () => {
    const last = await monthlySnapshotService.getLastSnapshotTime();
    setLastSnapshot(last);
  };

  const handleUpdateConfig = async (configKey: string, value: Record<string, any>) => {
    setSaving(configKey);
    const success = await scoringConfigService.updateConfig(configKey, value);
    setSaving(null);

    if (success) {
      await loadConfigs();
    } else {
      alert('配置更新失败');
    }
  };

  const handleRunSnapshot = async () => {
    setRunningSnapshot(true);
    const result = await monthlySnapshotService.runMonthlySnapshot();
    setRunningSnapshot(false);

    if (result.success) {
      alert(`月度快照执行成功，共处理 ${result.count} 个伙伴`);
      await loadLastSnapshot();
    } else {
      alert(`月度快照执行失败: ${result.error}`);
    }
  };

  const firstCategory = categories[0] || 'weight';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">评分配置管理</h1>
          <p className="text-sm text-neutral-500 mt-1">
            动态调整评分权重和阈值，修改后约5分钟生效
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">配置项: {configs.length}</Badge>
        </div>
      </div>

      {/* 月度快照管理 */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">月度数据快照</h2>
        <p className="text-sm text-neutral-500 mb-4">
          采集伙伴月度统计数据，支持同比/环比增长的历史对比
        </p>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm">
              最近快照时间:{' '}
              {lastSnapshot ? (
                <span className="font-medium">
                  {lastSnapshot.year}年{lastSnapshot.month}月 ({new Date(lastSnapshot.timestamp).toLocaleString()})
                </span>
              ) : (
                <span className="text-neutral-400">暂无数据</span>
              )}
            </p>
            <p className="text-xs text-neutral-500">
              建议每月1日凌晨2点自动执行，采集上月数据
            </p>
          </div>
          <Button onClick={handleRunSnapshot} disabled={runningSnapshot}>
            {runningSnapshot ? '执行中...' : '立即执行快照'}
          </Button>
        </div>
      </div>

      {/* 配置分组 */}
      <div className="space-y-4">
        {/* 分类切换 */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
              }`}
            >
              <Badge className={CATEGORY_COLORS[cat] || 'bg-neutral-100'} size="sm">
                {CATEGORY_LABELS[cat] || cat}
              </Badge>
              <span className="ml-2">{groupedConfigs[cat].length}</span>
            </button>
          ))}
        </div>

        {/* 配置表格 */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="text-left p-3 text-sm font-medium">配置项</th>
                <th className="text-left p-3 text-sm font-medium">说明</th>
                <th className="text-left p-3 text-sm font-medium">当前值</th>
                <th className="text-right p-3 text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(groupedConfigs[activeCategory] || []).map((config) => (
                <tr key={config.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="p-3 font-mono text-sm">{config.configKey}</td>
                  <td className="p-3 text-sm text-neutral-500">{config.description || '-'}</td>
                  <td className="p-3">
                    <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded max-w-xs truncate block">
                      {JSON.stringify(config.configValue).slice(0, 60)}
                      {JSON.stringify(config.configValue).length > 60 ? '...' : ''}
                    </code>
                  </td>
                  <td className="p-3 text-right">
                    {saving === config.configKey ? (
                      <Badge variant="outline" size="sm">保存中...</Badge>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingConfig(config)}
                        >
                          编辑
                        </Button>
                        <Badge variant={config.isActive ? 'success' : 'secondary'} size="sm">
                          {config.isActive ? '启用' : '禁用'}
                        </Badge>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 权重编辑器弹窗 */}
      {editingConfig && (
        <WeightEditor
          title={editingConfig.description || editingConfig.configKey}
          description="权重值应在 0-1 之间，各项之和应为 100%"
          weights={editingConfig.configValue as Record<string, number>}
          onSave={(w) => {
            handleUpdateConfig(editingConfig.configKey, w);
            setEditingConfig(null);
          }}
          onCancel={() => setEditingConfig(null)}
        />
      )}

      {/* 提示信息 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>提示：</strong>修改权重配置后，评分服务会在5分钟后自动刷新配置（缓存过期）。如需立即生效，可联系开发人员在控制台执行 <code className="bg-amber-100 px-1 rounded">scoringConfigService.clearCache()</code>。
        </p>
      </div>
    </div>
  );
}

export default AdminScoringConfig;
