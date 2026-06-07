import { cn } from '../../../lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const Sparkline = ({
  data,
  width = 60,
  height = 24,
  color = '#059669',
  className,
}: SparklineProps) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const stepX = w / Math.max(data.length - 1, 1);

  const points = data
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = padding + h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={cn('shrink-0', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.length > 0 && (
        <circle
          cx={padding + (data.length - 1) * stepX}
          cy={padding + h - ((data[data.length - 1] - min) / range) * h}
          r="2"
          fill={color}
        />
      )}
    </svg>
  );
};
