// ══════════════════════════════════════════════════════════════════════════
// Diagnosis Panel v2 — 匹配蓝图 JSON 结构
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, TrendingDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import type { DiagnosisAlert } from '../../lib/partnerHealthEngine';

interface Props {
  alerts: DiagnosisAlert[];
}

const LEVEL_CONFIG: Record<string, { label: string; icon: any; variant: 'danger' | 'warning' | 'info'; color: string }> = {
  danger: { label: '紧急', icon: AlertTriangle, variant: 'danger', color: 'text-red-600 bg-red-50' },
  warning: { label: '关注', icon: MapPin, variant: 'warning', color: 'text-amber-600 bg-amber-50' },
  info: { label: '提示', icon: TrendingDown, variant: 'info', color: 'text-blue-600 bg-blue-50' },
};

export const DiagnosisPanel = ({ alerts }: Props) => {
  const navigate = useNavigate();
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const filtered = filterLevel === 'all'
    ? alerts
    : alerts.filter(a => a.level === filterLevel);

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-neutral-400">
        ✅ 所有区域覆盖正常，暂无诊断预警
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', label: `全部(${alerts.length})` },
          { key: 'danger', label: `紧急(${alerts.filter(a => a.level === 'danger').length})` },
          { key: 'warning', label: `关注(${alerts.filter(a => a.level === 'warning').length})` },
          { key: 'info', label: `提示(${alerts.filter(a => a.level === 'info').length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterLevel(tab.key)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all',
              filterLevel === tab.key
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.slice(0, 8).map(alert => {
          const cfg = LEVEL_CONFIG[alert.level] || LEVEL_CONFIG.info;
          const Icon = cfg.icon;
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:shadow-sm transition-shadow"
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{alert.title}</p>
                  <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                </div>
                <p className="text-xs text-neutral-500">{alert.content}</p>
                {alert.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {alert.tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
