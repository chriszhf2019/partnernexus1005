// ─────────────────────────────────────────────────────────────────────────────
// 置信度展示组件
// ─────────────────────────────────────────────────────────────────────────────
// 显示数据的置信度等级，帮助用户理解预估数据的可靠性
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'secondary';
  description: string;
}> = {
  high: {
    label: '高置信',
    variant: 'success' as const,
    description: '基于24个月以上的历史数据',
  },
  medium: {
    label: '中置信',
    variant: 'warning' as const,
    description: '基于12-24个月的历史数据',
  },
  low: {
    label: '低置信',
    variant: 'danger' as const,
    description: '基于6-12个月的历史数据',
  },
  insufficient: {
    label: '数据不足',
    variant: 'secondary' as const,
    description: '历史数据不足6个月，仅供参考',
  },
};

/**
 * 置信度徽章
 */
export function ConfidenceBadge({ confidence, showLabel = true, size = 'sm', className }: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[confidence];

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={cn('cursor-help', className)}
    >
      {showLabel ? config.label : '?'}
    </Badge>
  );
}

interface ConfidenceIndicatorProps {
  confidence: ConfidenceLevel;
  dataMonths?: number;
  dataHistoryYears?: number;
  showDetails?: boolean;
  className?: string;
}

const CONFIDENCE_BAR_COLORS: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-500',
  low: 'bg-red-500',
  insufficient: 'bg-neutral-400',
};

const CONFIDENCE_BAR_WIDTHS: Record<ConfidenceLevel, number> = {
  high: 100,
  medium: 66,
  low: 33,
  insufficient: 15,
};

/**
 * 置信度指示器（带进度条）
 */
export function ConfidenceIndicator({
  confidence,
  dataMonths,
  dataHistoryYears,
  showDetails = false,
  className,
}: ConfidenceIndicatorProps) {
  const config = CONFIDENCE_CONFIG[confidence];

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          数据置信度
        </span>
        <ConfidenceBadge confidence={confidence} />
      </div>

      {/* 置信度进度条 */}
      <div className="relative h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', CONFIDENCE_BAR_COLORS[confidence])}
          style={{ width: `${CONFIDENCE_BAR_WIDTHS[confidence]}%` }}
        />
      </div>

      {/* 详细信息 */}
      {showDetails && (
        <div className="text-xs text-neutral-400 space-y-0.5">
          {dataMonths !== undefined && (
            <p>历史数据: {dataMonths} 个月</p>
          )}
          {dataHistoryYears !== undefined && (
            <p>覆盖年限: {dataHistoryYears} 年</p>
          )}
          <p className="text-neutral-500">{config.description}</p>
        </div>
      )}
    </div>
  );
}

interface GrowthWithConfidenceProps {
  label: string;
  value: number | null;
  confidence: ConfidenceLevel;
  suffix?: string;
  className?: string;
}

/**
 * 带置信度标注的增长数值
 */
export function GrowthWithConfidence({
  label,
  value,
  confidence,
  suffix = '%',
  className,
}: GrowthWithConfidenceProps) {
  if (value === null) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-sm text-neutral-500">{label}</span>
        <span className="text-sm text-neutral-400">--</span>
        <ConfidenceBadge confidence={confidence} size="sm" />
      </div>
    );
  }

  const isPositive = value >= 0;
  const valueColor = isPositive ? 'text-emerald-600' : 'text-red-500';
  const arrow = isPositive ? '↑' : '↓';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-neutral-500">{label}</span>
      <span className={cn('text-sm font-semibold', valueColor)}>
        {arrow} {Math.abs(value)}{suffix}
      </span>
      <ConfidenceBadge confidence={confidence} size="sm" />
    </div>
  );
}

interface DataSourceIndicatorProps {
  hasRealData: boolean;
  isEstimate: boolean;
  lastUpdated?: string;
  className?: string;
}

/**
 * 数据来源指示器
 */
export function DataSourceIndicator({
  hasRealData,
  isEstimate,
  lastUpdated,
  className,
}: DataSourceIndicatorProps) {
  if (!isEstimate) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-emerald-600">真实数据</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="w-2 h-2 rounded-full bg-amber-500" />
      <span className="text-xs text-amber-600">
        {hasRealData ? '基于历史数据推算' : '预估数据'}
      </span>
      {lastUpdated && (
        <span className="text-xs text-neutral-400">
          (更新于 {lastUpdated})
        </span>
      )}
    </div>
  );
}
