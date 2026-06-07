import { cn } from '../../../lib/utils';
import { LearnerTooltip, type TooltipData } from './LearnerTooltip';

type ChipStatus = 'completed' | 'learning' | 'overdue' | 'stagnant';

interface LearnerChipProps {
  name: string;
  company: string;
  status: ChipStatus;
  score?: number;
  progress?: number;
  tooltip: TooltipData;
  onSendReminder?: () => void;
  onViewDetail?: () => void;
  className?: string;
}

const statusStyles: Record<ChipStatus, string> = {
  completed: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  learning: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  overdue: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 border-dashed',
  stagnant: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
};

const statusLabelStyles: Record<ChipStatus, string> = {
  completed: 'bg-emerald-500 text-white',
  learning: 'bg-blue-500 text-white',
  overdue: 'bg-red-500 text-white',
  stagnant: 'bg-amber-500 text-white',
};

export const LearnerChip = ({
  name, company, status, score, progress, tooltip, onSendReminder, onViewDetail, className,
}: LearnerChipProps) => {
  const label = status === 'completed' && score
    ? `${score}分`
    : status === 'learning' && progress !== undefined
      ? `${progress}%`
      : status === 'overdue' ? '逾期' : '滞后';

  return (
    <LearnerTooltip data={tooltip} onSendReminder={onSendReminder} onViewDetail={onViewDetail}>
      <div className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border cursor-default transition-colors',
        statusStyles[status],
        className
      )}>
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{name}</span>
        <span className="text-neutral-400 dark:text-neutral-500 text-[10px]">{company}</span>
        <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-bold', statusLabelStyles[status])}>
          {label}
        </span>
      </div>
    </LearnerTooltip>
  );
};
