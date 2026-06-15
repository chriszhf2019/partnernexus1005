// ══════════════════════════════════════════════════════════════════════════
// Action Center v2 — 匹配蓝图 JSON 结构
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Users, GraduationCap, Gift, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import type { ActionTask } from '../../lib/partnerHealthEngine';

interface Props {
  tasks: ActionTask[];
  onTaskResolve?: (type: string) => void;
}

const TASK_META: Record<string, { icon: any; label: string; color: string }> = {
  RECRUIT: { icon: Target, label: '招募任务', color: 'text-blue-600 bg-blue-50' },
  ACTIVATE: { icon: Users, label: '激活任务', color: 'text-amber-600 bg-amber-50' },
  TRAIN: { icon: GraduationCap, label: '培训任务', color: 'text-purple-600 bg-purple-50' },
  REVIEW: { icon: Gift, label: '激励任务', color: 'text-emerald-600 bg-emerald-50' },
};

export const ActionCenter = ({ tasks, onTaskResolve }: Props) => {
  const navigate = useNavigate();
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const actionable = tasks.filter(t => !resolved.has(t.type));

  if (actionable.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-neutral-400">
        🎉 所有待办任务已完成
      </div>
    );
  }

  const grouped = actionable.reduce((acc, t) => {
    if (!acc[t.type]) acc[t.type] = [];
    acc[t.type].push(t);
    return acc;
  }, {} as Record<string, ActionTask[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(TASK_META).map(([type, meta]) => {
        const items = grouped[type] || [];
        const Icon = meta.icon;
        return (
          <Card key={type} className={cn(items.length === 0 && 'opacity-50')}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', meta.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm">{meta.label}</CardTitle>
                {items.length > 0 && <Badge variant="danger" size="sm">{items.length}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-xs text-neutral-400 py-2 text-center">暂无待办</p>
              ) : (
                <div className="space-y-1.5">
                  {items.slice(0, 3).map(item => (
                    <div
                      key={item.type + item.title}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer group"
                      onClick={() => navigate(item.link)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.title}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setResolved(prev => new Set(prev).add(item.type));
                            onTaskResolve?.(item.type);
                          }}
                          className="p-1 rounded hover:bg-green-50 text-neutral-300 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="标记已完成"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-3 h-3 text-neutral-300" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
