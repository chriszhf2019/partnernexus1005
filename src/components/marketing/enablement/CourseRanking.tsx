import { useState, useMemo } from 'react';
import { TrendingUp, Star, Users, Clock, Search, Plus, Download, Edit3, BarChart3, MoreHorizontal, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { EmptyState } from '../../ui/EmptyState';

interface RankedCourse {
  id: string;
  name: string;
  completionRate: number;
  avgRating: number;
  enrollmentCount: number;
  duration?: string;
  isDead?: boolean;
  isRequired?: boolean;
  category?: string;
  updatedAt?: string;
  warningReason?: string;
}

interface CourseRankingProps {
  courses: RankedCourse[];
  onRetire?: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
  onAnalyze?: (courseId: string) => void;
  onNewCourse?: () => void;
  onExport?: () => void;
  onBatchRetire?: (ids: string[]) => void;
  onBatchExport?: (ids: string[]) => void;
}

type SortKey = 'completionRate' | 'avgRating' | 'enrollmentCount' | 'duration';

const sortOptions: Array<{ key: SortKey; label: string; icon: typeof TrendingUp }> = [
  { key: 'completionRate', label: '完课率', icon: TrendingUp },
  { key: 'avgRating', label: '好评率', icon: Star },
  { key: 'enrollmentCount', label: '选课人数', icon: Users },
  { key: 'duration', label: '课程时长', icon: Clock },
];

const CATEGORIES = ['全部', '技术认证', '销售赋能', '市场营销'];

const MEDALS = ['🥇', '🥈', '🥉'];

export const CourseRanking = ({ courses, onRetire, onEdit, onAnalyze, onNewCourse, onExport, onBatchRetire, onBatchExport }: CourseRankingProps) => {
  const [sortBy, setSortBy] = useState<SortKey>('completionRate');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hoveredWarning, setHoveredWarning] = useState<string | null>(null);

  const sorted = useMemo(() => {
    let result = [...courses];
    // Search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(s));
    }
    // Category
    if (categoryFilter !== '全部') {
      result = result.filter(c => c.category === categoryFilter);
    }
    // Sort
    if (sortBy !== 'duration') {
      result.sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
    }
    return result;
  }, [courses, sortBy, search, categoryFilter]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map(c => c.id)));
    }
  };

  // AI suggestion
  const suggestion = useMemo(() => {
    const dead = courses.filter(c => c.isDead).map(c => c.name);
    const lowRated = courses.filter(c => c.avgRating > 0 && c.avgRating < 3 && c.enrollmentCount > 0).map(c => c.name);
    const parts: string[] = [];
    if (dead.length > 0) parts.push(`「${dead.join('、')}」选课人数为0，建议推送至相关职能部门`);
    if (lowRated.length > 0) parts.push(`「${lowRated.join('、')}」评分偏低，建议检查内容质量`);
    return parts.join('；');
  }, [courses]);

  if (courses.length === 0) {
    return <EmptyState title="暂无课程数据" description="点击「发布新课程」创建第一门课程" actionLabel="+ 发布新课程" onAction={onNewCourse} />;
  }

  return (
    <div className="space-y-3">
      {/* ═══ AI Suggestion Banner ═══ */}
      {suggestion && (
        <div className="flex items-start gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px]">
          <span className="shrink-0 mt-0.5">💡</span>
          <div>
            <span className="font-semibold text-blue-700 dark:text-blue-300">系统建议：</span>
            <span className="text-neutral-600 dark:text-neutral-400">{suggestion}</span>
          </div>
        </div>
      )}

      {/* ═══ Action Bar ═══ */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg px-3 py-2 flex-1 min-w-[150px]">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input
            placeholder="搜索课程名称..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[11px] outline-none text-neutral-700 dark:text-neutral-300"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-8 px-2 rounded-lg border text-[11px] bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c === '全部' ? '全部分类' : c}</option>)}
        </select>
        {/* Sort chips */}
        <div className="flex items-center gap-1.5">
          {sortOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors',
                sortBy === opt.key
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="secondary" size="sm" onClick={onExport}><Download className="w-3 h-3 mr-1" />导出</Button>
          <Button variant="brand" size="sm" onClick={onNewCourse}><Plus className="w-3 h-3 mr-1" />发布课程</Button>
        </div>
      </div>

      {/* ═══ Table ═══ */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-700 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
          <span className="w-6"><input type="checkbox" className="w-3 h-3" checked={selected.size === sorted.length && sorted.length > 0} onChange={toggleAll} /></span>
          <span className="w-8">#</span>
          <span className="flex-1">课程名称</span>
          <span className="w-[90px]">完课率</span>
          <span className="w-[60px] text-right">评分</span>
          <span className="w-[50px] text-right">人数</span>
          <span className="w-[60px]">更新时间</span>
          <span className="w-[110px] text-right">操作</span>
        </div>

        {/* Rows */}
        {sorted.length === 0 && (
          <div className="text-center py-10 text-[11px] text-neutral-400">未找到匹配的课程</div>
        )}
        {sorted.map((c, i) => {
          const isTop = i < 3 && !c.isDead;
          const isBottom = c.isDead || (c.completionRate === 0 && c.enrollmentCount === 0);
          const isSelected = selected.has(c.id);
          const progressColor = c.completionRate >= 60 ? 'bg-emerald-500' : c.completionRate >= 30 ? 'bg-amber-500' : 'bg-red-500';
          const textColor = c.completionRate >= 60 ? 'text-emerald-600' : c.completionRate >= 30 ? 'text-amber-600' : 'text-red-500';

          return (
            <div
              key={c.id}
              className={cn(
                'flex items-center px-3 py-2.5 text-[12px] border-b border-neutral-50 dark:border-neutral-700/50 transition-colors cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-750',
                isTop && i === 0 && 'bg-amber-50/50 dark:bg-amber-950/10',
                isTop && i === 1 && 'bg-neutral-50/50 dark:bg-neutral-800/50',
                isTop && i === 2 && 'bg-neutral-50/30 dark:bg-neutral-800/30',
                isBottom && 'bg-red-50/50 dark:bg-red-950/10 border-l-2 border-red-400',
                isSelected && 'bg-blue-50/50 dark:bg-blue-950/10'
              )}
              onClick={() => onAnalyze?.(c.id)}
            >
              {/* Checkbox */}
              <span className="w-6" onClick={e => e.stopPropagation()}>
                <input type="checkbox" className="w-3 h-3" checked={isSelected} onChange={() => toggleSelect(c.id)} />
              </span>

              {/* Rank */}
              <span className="w-8">
                {isBottom ? (
                  <span
                    className="relative inline-block font-extrabold text-red-500 cursor-help"
                    onMouseEnter={() => setHoveredWarning(c.id)}
                    onMouseLeave={() => setHoveredWarning(null)}
                  >
                    ⚠
                    {hoveredWarning === c.id && c.warningReason && (
                      <span className="absolute bottom-full left-0 mb-1 w-36 p-2 bg-neutral-800 text-white text-[10px] rounded-lg shadow-lg z-10">
                        {c.warningReason}
                      </span>
                    )}
                  </span>
                ) : isTop ? (
                  <span className="text-base">{MEDALS[i]}</span>
                ) : (
                  <span className="font-semibold text-neutral-400">{i + 1}</span>
                )}
              </span>

              {/* Name + Badges */}
              <span className="flex-1 flex items-center gap-2 min-w-0">
                <span className="font-semibold text-neutral-800 dark:text-white truncate">{c.name}</span>
                {c.isRequired !== undefined && (
                  <Badge variant={c.isRequired ? 'danger' : 'info'} size="sm">
                    {c.isRequired ? '必修' : '选修'}
                  </Badge>
                )}
                {c.category && (
                  <span className="text-[10px] text-neutral-400 hidden sm:inline">{c.category}</span>
                )}
              </span>

              {/* Progress bar */}
              <span className="w-[90px] flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden max-w-[60px]">
                  <div className={cn('h-full rounded-full transition-all', progressColor)} style={{ width: `${Math.min(c.completionRate, 100)}%` }} />
                </div>
                <span className={cn('text-[10px] font-semibold', textColor)}>{c.completionRate}%</span>
              </span>

              {/* Rating */}
              <span
                className="w-[60px] text-right font-medium text-neutral-600 dark:text-neutral-300 cursor-pointer hover:text-blue-600"
                onClick={e => { e.stopPropagation(); }}
                title="点击查看评价详情"
              >
                {c.avgRating > 0 ? `⭐${c.avgRating}` : '-'}
              </span>

              {/* Enrollment */}
              <span className="w-[50px] text-right text-neutral-500">{c.enrollmentCount}人</span>

              {/* Updated */}
              <span className="w-[60px] text-[10px] text-neutral-400">{c.updatedAt || '-'}</span>

              {/* Actions */}
              <span className="w-[110px] flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => onEdit?.(c.id)} title="编辑课程">
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onAnalyze?.(c.id)} title="数据分析">
                  <BarChart3 className="w-3 h-3" />
                </Button>
                {isBottom ? (
                  <Button variant="danger" size="sm" onClick={() => onRetire?.(c.id)}>
                    调整
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => onRetire?.(c.id)} title="更多操作">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* ═══ Batch Action Bar ═══ */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[11px]">
          <span className="text-blue-700 dark:text-blue-300 font-medium">已选 {selected.size} 项</span>
          <Button variant="outline" size="sm" onClick={() => onBatchRetire?.(Array.from(selected))}>批量下架</Button>
          <Button variant="outline" size="sm" onClick={() => onBatchExport?.(Array.from(selected))}>批量导出</Button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-neutral-400 hover:text-neutral-600 text-[11px]">取消选择</button>
        </div>
      )}
    </div>
  );
};
