import { PackageOpen, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({ icon, title, description, actionLabel, onAction, className }: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center justify-center py-20 px-8 text-center', className)}>
    <div className="w-16 h-16 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-brand/10 dark:to-accent/10 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-brand-100/50 dark:ring-brand/10">
      {icon || <PackageOpen className="w-7 h-7 text-brand-400" />}
    </div>
    <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1.5">{title}</h3>
    {description && <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm leading-relaxed">{description}</p>}
    {actionLabel && onAction && (
      <Button variant="brand" size="sm" onClick={onAction}>
        <Sparkles className="w-3.5 h-3.5" />
        {actionLabel}
      </Button>
    )}
  </div>
);
