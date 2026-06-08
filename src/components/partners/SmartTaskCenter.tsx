import React from 'react';
import { AlertTriangle, Clock, Users, Award, Shield, FileText, ChevronRight, X } from 'lucide-react';
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

  // Cert stats - computed from real partner data
  const l1Count = partners.reduce((s, p) => s + (((p as any).certifications || []).includes('L1认证') ? 1 : 0), 0);
  const l2Count = partners.reduce((s, p) => s + (((p as any).certifications || []).includes('L2认证') ? 1 : 0), 0);

  // Contract expiry - top priority
  const expiringPartners = partners.filter(p => {
    const d = (p as any).contract_expiry;
    if (!d) return false;
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return days > 0 && days <= 30;
  });

  // Smart tasks
  const tasks = [
    // 🔴 TOP: Contract expiry (most urgent)
    ...(expiringPartners.length > 0 ? [{
      id: 'contract', icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
      title: `⚠️ ${expiringPartners.length} 家伙伴代理协议即将到期`,
      sub: expiringPartners.map(p => `${p.name}(${(p as any).tier}) ${Math.ceil((new Date((p as any).contract_expiry).getTime() - Date.now()) / 86400000)}天后到期`).join(' · '),
      urgent: true, isTop: true,
      action: { label: '续约处理', onClick: () => {} },
    }] : []),
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
      id: 'conflict', icon: Shield, color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
      title: '2 个商机冲突需要裁决',
      sub: '涉及 4 家伙伴的客户归属冲突',
      urgent: true,
      action: { label: '裁决', onClick: () => {} },
    },
    {
      id: 'cert', icon: Award, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
      title: `生态认证工程师: ${l1Count + l2Count} 人`,
      sub: `L1: ${l1Count}人 · L2: ${l2Count}人 · 培训完成率 78%`,
      urgent: false,
      action: { label: '人才池', onClick: () => {} },
    },
    {
      id: 'jbp', icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      title: '2 个 JBP 联合业务计划需本月复盘',
      sub: '神州数码 · 东软集团 Q2 复盘到期',
      urgent: false,
      action: { label: '安排复盘', onClick: () => {} },
    },
  ];

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand" />智能待办中心
          </h3>
          <Badge variant="warning" size="sm">{tasks.filter(t => t.urgent).length} 项紧急</Badge>
        </div>
        <div className="space-y-1">
          {tasks.map(task => (
            <div key={task.id} className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors',
              (task as any).isTop ? 'bg-red-100 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 animate-pulse' :
              task.urgent ? 'bg-red-50/50 dark:bg-red-900/5 border border-red-100 dark:border-red-900' :
              'hover:bg-neutral-50 dark:hover:bg-neutral-800'
            )}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', task.color)}>
                  <task.icon className={cn('w-4 h-4', (task as any).isTop && 'animate-bounce')} />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold truncate', (task as any).isTop ? 'text-red-800 dark:text-red-200' : 'text-neutral-900 dark:text-white')}>{task.title}</p>
                  <p className={cn('text-xs truncate', (task as any).isTop ? 'text-red-600 dark:text-red-400 font-medium' : 'text-neutral-400')}>{task.sub}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {task.urgent && <span className={cn('w-2 h-2 rounded-full', (task as any).isTop ? 'bg-red-600 animate-ping' : 'bg-red-500 animate-pulse')} />}
                <Button variant={(task as any).isTop ? 'danger' : 'ghost'} size="sm" onClick={task.action.onClick} className="text-xs">
                  {task.action.label} <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
