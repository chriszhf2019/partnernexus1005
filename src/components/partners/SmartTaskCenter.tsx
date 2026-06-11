import React from 'react';
import { AlertTriangle, Clock, FileText, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Partner } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SmartTaskCenterProps {
  partners: Partner[];
  pendingCount: number;
  sleepingCount: number;
  overduePending: number;
  onViewPending: () => void;
  onViewSleeping: () => void;
}

export const SmartTaskCenter: React.FC<SmartTaskCenterProps> = ({
  partners, pendingCount, sleepingCount, overduePending, onViewPending, onViewSleeping,
}) => {
  // Risk: high-tier but 0 win rate
  const atRiskPartners = partners.filter(p =>
    p.status === 'Cooperating' && ['Gold','Platinum','Diamond'].includes(p.tier) && (p.winRate || 0) === 0
  );

  // Smart tasks
  const tasks = [
    {
      id: 'risk', icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
      title: `${atRiskPartners.length} 家高等级伙伴存在流失风险`,
      sub: atRiskPartners.map(p => `${p.name}(${p.tier})`).join(' · ') + ' — 等级高但零商机产出',
      urgent: atRiskPartners.length > 0,
      action: { label: '制定挽回计划', onClick: onViewSleeping },
    },
    {
      id: 'pending', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
      title: `${pendingCount} 个待审批入驻申请`,
      sub: overduePending > 0 ? `${overduePending} 个已超48小时 · 需尽快处理` : '全部在时效内',
      urgent: overduePending > 0,
      action: { label: '立即审批', onClick: onViewPending },
    },
    {
      id: 'jbp', icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      title: 'JBP 复盘提醒',
      sub: '暂无待复盘计划',
      urgent: false,
      action: { label: '安排复盘', onClick: () => {} },
    },
  ];

  const urgentCount = tasks.filter(t => t.urgent).length;
  const topTask = tasks.find(t => (t as any).isTop) || tasks[0];

  return (
    <div className="flex items-center gap-2 text-xs group relative">
      <div className="flex items-center gap-1.5 cursor-pointer" title={`${urgentCount}项紧急待办`}>
        <AlertTriangle className={cn('w-4 h-4', urgentCount > 0 ? 'text-red-500 animate-pulse' : 'text-neutral-400')} />
        <span className="font-medium text-neutral-600 dark:text-neutral-400">待办</span>
        {urgentCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{urgentCount}</span>}
      </div>
      {/* Hover dropdown */}
      <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-2 space-y-0.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {tasks.slice(0, 3).map(task => (
          <div key={task.id} onClick={task.action.onClick} className={cn(
            'flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800',
            task.urgent && 'bg-red-50/50 dark:bg-red-900/5'
          )}>
            <div className="flex items-center gap-2 min-w-0">
              <task.icon className={cn('w-3.5 h-3.5 shrink-0', task.urgent ? 'text-red-500' : 'text-neutral-400')} />
              <span className="truncate">{task.title}</span>
            </div>
            <Button variant="ghost" size="sm" className="text-[10px] shrink-0">{task.action.label}</Button>
          </div>
        ))}
        {tasks.length > 3 && <p className="text-[10px] text-neutral-400 text-center py-1">还有 {tasks.length - 3} 项...</p>}
      </div>
    </div>
  );
};
