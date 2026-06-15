// ══════════════════════════════════════════════════════════════════════════
// Partner Health Radar Chart — 伙伴健康雷达图
// 显示覆盖/活跃/能力/商机力/增长力 五维评分
// ══════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts';
import { cn } from '../../lib/utils';

interface Props {
  data: number[];           // [覆盖, 活跃, 能力, 商机力, 增长力]
  size?: number;
  showLegend?: boolean;
  className?: string;
}

const LABELS = ['覆盖健康', '活跃健康', '能力健康', '商机力', '增长力'];
const COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#0891b2'];

export const PartnerHealthRadar = ({ data, size = 200, showLegend = true, className }: Props) => {
  const chartData = useMemo(() =>
    LABELS.map((label, i) => ({
      subject: label,
      value: Math.min(100, Math.max(0, data[i] || 0)),
      fullMark: 100,
    })),
  [data]);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <ResponsiveContainer width={size} height={size}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="健康评分"
            dataKey="value"
            stroke={COLORS[0]}
            fill={COLORS[0]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Tooltip
            formatter={(value: number) => [`${value}分`, '评分']}
            labelFormatter={(label: string) => label}
          />
        </RadarChart>
      </ResponsiveContainer>
      {showLegend && (
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2">
          {LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-neutral-500">{label}</span>
              <span className="font-semibold text-neutral-700">{data[i]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
