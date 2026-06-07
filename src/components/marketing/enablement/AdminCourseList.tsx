import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { LearnerChip } from './LearnerChip';
import { cn } from '../../../lib/utils';

interface LearnerData {
  name: string;
  company: string;
  status: 'completed' | 'learning' | 'overdue' | 'stagnant';
  score?: number;
  progress?: number;
  hireDate?: string;
  passRate?: number;
  manager?: string;
  lastActivity?: string;
}

interface CourseItem {
  id: string;
  name: string;
  isRequired: boolean;
  enrollmentCount: number;
  completedCount: number;
  avgRating: number;
  healthDot: 'green' | 'yellow' | 'red' | 'gray';
  learners: LearnerData[];
}

interface AdminCourseListProps {
  courses: CourseItem[];
  onNudge?: (courseId: string) => void;
  onInvite?: (courseId: string) => void;
  onExport?: () => void;
  emptyMessage?: string;
}

const PAGE_SIZE = 5;

export const AdminCourseList = ({ courses, onNudge, onInvite, onExport, emptyMessage }: AdminCourseListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return courses.filter(c => {
      if (typeFilter === 'required' && !c.isRequired) return false;
      if (typeFilter === 'elective' && c.isRequired) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!c.name.toLowerCase().includes(s) && !c.learners.some(l => l.name.includes(s) || l.company.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [courses, search, statusFilter, typeFilter]);

  const toggleExpand = (id: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (courses.length === 0) {
    return <EmptyState title="暂无课程数据" description={emptyMessage || '创建课程后将在此处展示'} />;
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center gap-3 p-2 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center gap-1.5 flex-1 bg-neutral-50 dark:bg-neutral-900 rounded-lg px-3 py-2">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input
            placeholder="搜索学员姓名或公司..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[11px] outline-none text-neutral-700 dark:text-neutral-300 placeholder-neutral-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-8 px-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300"
        >
          <option value="all">全部状态</option>
          <option value="learning">进行中</option>
          <option value="completed">已完成</option>
          <option value="overdue">已滞后</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="h-8 px-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300"
        >
          <option value="all">全部课程</option>
          <option value="required">必修</option>
          <option value="elective">选修</option>
        </select>
        <Button variant="secondary" size="sm" onClick={onExport}>
          📥 导出
        </Button>
      </div>

      {/* Course cards */}
      {filtered.map(course => {
        const isExpanded = expandedCourses.has(course.id);
        const visibleLearners = isExpanded ? course.learners : course.learners.slice(0, PAGE_SIZE);
        const healthColors = { green: 'bg-emerald-500', yellow: 'bg-amber-500', red: 'bg-red-500', gray: 'bg-neutral-300' };

        return (
          <Card key={course.id} className={cn(course.healthDot === 'red' && 'border-red-200 dark:border-red-800')}>
            <CardContent>
              {/* Course header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', healthColors[course.healthDot])} />
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">{course.name}</span>
                  <Badge variant={course.isRequired ? 'danger' : 'info'} size="sm">
                    {course.isRequired ? '必修' : '选修'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-500">
                    👥{course.enrollmentCount}人 · ✅{course.completedCount}完成 · ⭐{course.avgRating || '-'}
                  </span>
                  {course.enrollmentCount > 0 && onNudge && (
                    <Button variant="outline" size="sm" onClick={() => onNudge(course.id)}>
                      ⚡ 一键催办
                    </Button>
                  )}
                  {course.enrollmentCount === 0 && onInvite && (
                    <Button variant="brand" size="sm" onClick={() => onInvite(course.id)}>
                      📨 邀请学员
                    </Button>
                  )}
                </div>
              </div>

              {/* Learners */}
              {course.learners.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {visibleLearners.map((l, i) => (
                    <LearnerChip
                      key={i}
                      name={l.name}
                      company={l.company}
                      status={l.status}
                      score={l.score}
                      progress={l.progress}
                      tooltip={{
                        name: l.name,
                        company: l.company,
                        hireDate: l.hireDate,
                        passRate: l.passRate,
                        manager: l.manager,
                        enrolledCount: 4,
                        completedCount: l.status === 'completed' ? 2 : 0,
                        lastActivity: l.lastActivity,
                      }}
                    />
                  ))}
                  {course.learners.length > PAGE_SIZE && (
                    <button
                      onClick={() => toggleExpand(course.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                    >
                      {isExpanded ? (
                        <><ChevronDown className="w-3 h-3" />收起</>
                      ) : (
                        <><ChevronRight className="w-3 h-3" />展开 {course.learners.length - PAGE_SIZE} 人</>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-neutral-400 text-center py-4 mt-2">尚无学员报名</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
