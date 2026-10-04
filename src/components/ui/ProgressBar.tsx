import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  color?: string;
  className?: string;
  animated?: boolean;
}

const sizeClasses = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
const variantClasses = {
  default: 'bg-neutral-900 dark:bg-white',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  brand: 'bg-brand',
};

export const ProgressBar = ({ value, max = 100, label, showPercentage = false, size = 'md', variant = 'default', color, className, animated = true }: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = color || variantClasses[variant];

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs font-medium text-neutral-500">{label}</span>}
          {showPercentage && <span className="text-xs font-semibold text-neutral-900 dark:text-white">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden', sizeClasses[size])}>
        {animated ? (
          <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', barColor)} />
        ) : (
          <div className={cn('h-full rounded-full transition-all duration-300', barColor)} style={{ width: `${percentage}%` }} />
        )}
      </div>
    </div>
  );
};
