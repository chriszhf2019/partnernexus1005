import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
  secondary: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
  outline: 'bg-transparent border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400',
  success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  primary: 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900',
} as const;

const sizes = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
} as const;

type BadgeVariant = keyof typeof variants;
type BadgeSize = keyof typeof sizes;

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export const Badge = ({ children, variant = 'default', size = 'sm', className }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md font-medium whitespace-nowrap',
      variants[variant],
      sizes[size],
      className,
    )}
  >
    {children}
  </span>
);
