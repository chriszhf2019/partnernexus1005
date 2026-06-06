import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className, hover = false, padding = true, onClick }: CardProps) => (
  <div
    className={cn(
      'card shadow-card',
      hover && 'hover:shadow-card-hover hover:border-neutral-300 dark:hover:border-neutral-600 transition-shadow duration-200',
      onClick && 'cursor-pointer',
      padding && 'p-6',
      className,
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={cn('flex items-center justify-between mb-5', onClick && 'cursor-pointer', className)} onClick={onClick}>{children}</div>
);

export const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={cn('text-sm font-semibold text-neutral-900 dark:text-white', className)}>{children}</h3>
);

export const CardDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn('text-xs text-neutral-500 dark:text-neutral-400 mt-1', className)}>{children}</p>
);

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('space-y-4', className)}>{children}</div>
);

export const CardFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800', className)}>{children}</div>
);
