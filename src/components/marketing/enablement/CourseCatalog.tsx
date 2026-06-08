import { BookOpen, Star, Clock, Users } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { cn } from '../../../lib/utils';

interface CatalogCourse {
  id: string;
  name: string;
  category: string;
  level: string;
  points: number;
  duration: string;
  isRequired: boolean;
  description: string;
  enrollmentCount: number;
  avgRating: number;
  isEnrolled?: boolean;
  enrollmentProgress?: number;
  enrollmentStatus?: string;
}

interface CourseCatalogProps {
  courses: CatalogCourse[];
  onSelectCourse?: (id: string) => void;
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  '技术认证': { icon: '💻', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', label: '技术认证' },
  '销售赋能': { icon: '🤝', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: '销售赋能' },
  '市场营销': { icon: '📢', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', label: '市场营销' },
};

const LEVEL_COLORS: Record<string, string> = {
  '初级': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  '中级': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  '高级': 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  '专家级': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
};

export const CourseCatalog = ({ courses, onSelectCourse }: CourseCatalogProps) => {
  if (courses.length === 0) {
    return <EmptyState title="暂无课程" description="课程正在筹备中，敬请期待" icon={<BookOpen className="w-7 h-7 text-neutral-400" />} />;
  }

  const grouped = courses.reduce((acc, c) => {
    const cat = c.category || '其他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {} as Record<string, CatalogCourse[]>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => {
        const cfg = CATEGORY_CONFIG[category] || { icon: '📚', color: 'text-neutral-600', bg: 'bg-neutral-50', label: category };
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{cfg.icon}</span>
              <h3 className={cn('text-sm font-bold', cfg.color)}>{cfg.label}</h3>
              <span className="text-[11px] text-neutral-400">{items.length} 门课程</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map(c => (
                <div
                  key={c.id}
                  onClick={() => onSelectCourse?.(c.id)}
                  className="group p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{c.name}</h4>
                        <Badge variant={c.isRequired ? 'danger' : 'info'} size="sm">
                          {c.isRequired ? '必修' : '选修'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">{c.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 mb-3">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', LEVEL_COLORS[c.level] || 'bg-neutral-100 text-neutral-600')}>
                      {c.level}
                    </span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration}h</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{c.points}积分</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.enrollmentCount}人</span>
                    {c.avgRating > 0 && <span>⭐{c.avgRating}</span>}
                  </div>
                  {c.isEnrolled ? (
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                        <span>学习进度</span>
                        <span>{c.enrollmentProgress || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', (c.enrollmentProgress || 0) >= 100 ? 'bg-emerald-500' : 'bg-blue-500')}
                          style={{ width: `${Math.min(c.enrollmentProgress || 0, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] mt-1 text-right text-neutral-400">
                        {c.enrollmentStatus === 'completed' ? '✅ 已获证' : '进行中'}
                      </p>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm" className="w-full text-[11px]" onClick={(e) => { e.stopPropagation(); onSelectCourse?.(c.id); }}>
                      查看详情
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
