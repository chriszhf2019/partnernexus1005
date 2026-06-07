import { useState, useMemo } from 'react';
import { TrendingUp, Star, Users, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';

interface RankedCourse {
  id: string;
  name: string;
  completionRate: number;
  avgRating: number;
  enrollmentCount: number;
  duration?: string;
  isDead?: boolean;
}

interface CourseRankingProps {
  courses: RankedCourse[];
  onRetire?: (courseId: string) => void;
}

type SortKey = 'completionRate' | 'avgRating' | 'enrollmentCount' | 'duration';

const sortOptions: Array<{ key: SortKey; label: string; icon: typeof TrendingUp }> = [
  { key: 'completionRate', label: '完课率', icon: TrendingUp },
  { key: 'avgRating', label: '好评率', icon: Star },
  { key: 'enrollmentCount', label: '选课人数', icon: Users },
  { key: 'duration', label: '课程时长', icon: Clock },
];

export const CourseRanking = ({ courses, onRetire }: CourseRankingProps) => {
  const [sortBy, setSortBy] = useState<SortKey>('completionRate');

  const sorted = useMemo(() => {
    return [...courses].sort((a, b) => {
      if (sortBy === 'duration') return 0;
      return (b[sortBy] as number) - (a[sortBy] as number);
    });
  }, [courses, sortBy]);

  if (courses.length === 0) {
    return <EmptyState title="暂无课程数据" description="创建课程后此处将展示排名" />;
  }

  return (
    <div className="space-y-3">
      {/* Sort chips */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-neutral-500">排序:</span>
        {sortOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={cn(
              'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
              sortBy === opt.key
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
          >
            {opt.label} ↓
          </button>
        ))}
      </div>

      {/* Ranking list */}
      <div className="space-y-1">
        {sorted.map((c, i) => {
          const isTop = i < 3;
          const isBottom = c.completionRate === 0 && c.enrollmentCount === 0;
          return (
            <div
              key={c.id}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg text-[12px]',
                isTop && !isBottom && i === 0 && 'bg-emerald-50 dark:bg-emerald-900/20',
                isTop && !isBottom && i === 1 && 'bg-blue-50 dark:bg-blue-900/10',
                isTop && !isBottom && i === 2 && 'bg-neutral-50 dark:bg-neutral-800',
                isBottom && 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800',
                !isTop && !isBottom && 'bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700'
              )}
            >
              <span className={cn('w-6 font-extrabold', i === 0 ? 'text-emerald-600' : i === 1 ? 'text-blue-600' : isBottom ? 'text-red-500' : 'text-neutral-400')}>
                {isBottom ? '⚠' : i + 1}
              </span>
              <span className="flex-1 font-semibold text-neutral-800 dark:text-white">{c.name}</span>
              <span className="w-16 text-right">{c.completionRate}%</span>
              <span className="w-14 text-right text-neutral-500">⭐{c.avgRating || '-'}</span>
              <span className="w-14 text-right text-neutral-500">{c.enrollmentCount}人</span>
              {isBottom && onRetire && (
                <Button variant="danger" size="sm" className="ml-3" onClick={() => onRetire(c.id)}>
                  <AlertTriangle className="w-3 h-3 mr-1" />下架?
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
