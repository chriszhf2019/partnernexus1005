import { useState } from 'react';
import {
  CheckCircle2, TrendingUp, TrendingDown, FileText, ShoppingCart, User,
  Award, Calendar, Gift, Star, Plus, X, Save, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { PartnerTimelineEvent, PartnerTier, PartnerTimelineEvent as TimelineEvent } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const TIER_LABELS: Record<PartnerTier, string> = {
  Platinum: '白金', Gold: '金牌', Silver: '银牌', Registered: '注册',
  Diamond: '钻石', Premier: '高级', Standard: '标准'
};

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  approved: { label: '合作伙伴批复', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/20' },
  tier_upgrade: { label: '级别提升', icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
  tier_downgrade: { label: '级别降级', icon: TrendingDown, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/20' },
  first_deal: { label: '首个商机报备', icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/20' },
  first_order: { label: '首个订单', icon: ShoppingCart, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/20' },
  manager_change: { label: '负责人变更', icon: User, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/20' },
  milestone: { label: '合作里程碑', icon: Award, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/20' },
  contract_renewal: { label: '合同续签', icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' },
  contract_expiry: { label: '合同到期', icon: Clock, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/20' },
  certification: { label: '获得认证', icon: Award, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
  mdf_approved: { label: 'MDF审批通过', icon: Gift, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/20' },
  award: { label: '获得奖项', icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/20' },
  custom: { label: '自定义事件', icon: Plus, color: 'text-neutral-600', bgColor: 'bg-neutral-100 dark:bg-neutral-800' },
};

const NEW_EVENT_TYPES = [
  { value: 'approved', label: '合作伙伴批复' },
  { value: 'tier_upgrade', label: '级别提升' },
  { value: 'tier_downgrade', label: '级别降级' },
  { value: 'first_deal', label: '首个商机报备' },
  { value: 'first_order', label: '首个订单' },
  { value: 'manager_change', label: '负责人变更' },
  { value: 'milestone', label: '合作里程碑' },
  { value: 'contract_renewal', label: '合同续签' },
  { value: 'contract_expiry', label: '合同到期' },
  { value: 'certification', label: '获得认证' },
  { value: 'mdf_approved', label: 'MDF审批通过' },
  { value: 'award', label: '获得奖项' },
  { value: 'custom', label: '自定义事件' },
];

interface PartnerTimelineProps {
  events: TimelineEvent[];
  partnerName: string;
  onUpdateEvents?: (events: TimelineEvent[]) => void;
}


export const PartnerTimeline = ({ events: initialEvents, partnerName, onUpdateEvents }: PartnerTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    type: 'custom' as TimelineEvent['type'],
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    operator: '',
    metadata: {} as TimelineEvent['metadata'],
  });

  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const groupedByYear = sortedEvents.reduce((acc, event) => {
    const year = event.date.split('-')[0];
    if (!acc[year]) acc[year] = [];
    acc[year].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const handleAddEvent = () => {
    const event: TimelineEvent = {
      ...newEvent,
      id: 'event-' + Date.now(),
    };
    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    onUpdateEvents?.(updatedEvents);
    setShowAddForm(false);
    setNewEvent({
      type: 'custom',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      operator: '',
      metadata: {},
    });
  };

  const handleUpdateEvent = (id: string, updates: Partial<TimelineEvent>) => {
    const updatedEvents = events.map(e => e.id === id ? { ...e, ...updates } : e);
    setEvents(updatedEvents);
    onUpdateEvents?.(updatedEvents);
    setEditingId(null);
  };

  const handleDeleteEvent = (id: string) => {
    const updatedEvents = events.filter(e => e.id !== id);
    setEvents(updatedEvents);
    onUpdateEvents?.(updatedEvents);
  };

  const renderEventContent = (event: TimelineEvent, isEditing: boolean) => {
    const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.custom;
    const Icon = config.icon;

    if (isEditing) {
      return (
        <div className="space-y-3">
          <Input
            label="事件标题"
            value={event.title}
            onChange={(e) => handleUpdateEvent(event.id, { title: e.target.value })}
          />
          <Input
            label="日期"
            type="date"
            value={event.date}
            onChange={(e) => handleUpdateEvent(event.id, { date: e.target.value })}
          />
          <textarea
            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20"
            rows={2}
            placeholder="事件描述"
            value={event.description || ''}
            onChange={(e) => handleUpdateEvent(event.id, { description: e.target.value })}
          />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>取消</Button>
            <Button variant="brand" size="sm">保存</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">{event.title || config.label}</span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full', config.bgColor, config.color)}>
            {config.label}
          </span>
        </div>
        {event.description && (
          <p className="text-xs text-neutral-500 mt-1">{event.description}</p>
        )}
        {event.metadata && (
          <div className="mt-2 flex flex-wrap gap-2">
            {event.metadata.fromTier && event.metadata.toTier && (
              <span className="text-xs text-neutral-500">
                {TIER_LABELS[event.metadata.fromTier]} → {TIER_LABELS[event.metadata.toTier]}
              </span>
            )}
            {event.metadata.dealTitle && (
              <span className="text-xs text-neutral-500">商机: {event.metadata.dealTitle}</span>
            )}
            {event.metadata.amount && (
              <span className="text-xs text-emerald-600">{formatCurrency(event.metadata.amount)}</span>
            )}
            {event.metadata.fromManager && event.metadata.toManager && (
              <span className="text-xs text-neutral-500">
                {event.metadata.fromManager} → {event.metadata.toManager}
              </span>
            )}
            {event.metadata.certificationName && (
              <span className="text-xs text-blue-600">认证: {event.metadata.certificationName}</span>
            )}
          </div>
        )}
        {event.operator && (
          <p className="text-xs text-neutral-400 mt-1">操作人: {event.operator}</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>合作时间线</CardTitle>
          <p className="text-xs text-neutral-500 mt-1">记录合作伙伴的重要里程碑事件</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          添加记录
        </Button>
      </CardHeader>
      <CardContent>
        {/* Add Event Form */}
        {showAddForm && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl mb-6 space-y-3">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">添加新记录</h4>
            <Select
              label="事件类型"
              options={NEW_EVENT_TYPES}
              value={newEvent.type}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as TimelineEvent['type'] })}
            />
            <Input
              label="事件标题"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <Input
              label="日期"
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />
            <textarea
              className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20"
              rows={2}
              placeholder="事件描述（可选）"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
            <Input
              label="操作人（可选）"
              value={newEvent.operator}
              onChange={(e) => setNewEvent({ ...newEvent, operator: e.target.value })}
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>取消</Button>
              <Button variant="brand" size="sm" onClick={handleAddEvent}>添加</Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无时间线记录</p>
            <p className="text-xs mt-1">点击上方按钮添加合作伙伴的重要事件</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByYear).map(([year, yearEvents]) => (
              <div key={year}>
                <button
                  className="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white mb-3"
                  onClick={() => setExpandedYear(expandedYear === year ? null : year)}
                >
                  {expandedYear === year ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  {year}年
                  <span className="text-sm font-normal text-neutral-500">({yearEvents.length}件)</span>
                </button>
                {expandedYear === year && (
                  <div className="relative ml-4">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700" />
                    <div className="space-y-4">
                      {yearEvents.map((event) => {
                        const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.custom;
                        const Icon = config.icon;
                        const isEditing = editingId === event.id;

                        return (
                          <div
                            key={event.id}
                            className={cn('relative flex gap-4 p-3 rounded-xl border', isEditing ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-50/50 dark:bg-neutral-800/30 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700')}
                          >
                            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10', config.bgColor)}>
                              <Icon className={cn('w-3.5 h-3.5', config.color)} />
                            </div>
                            {renderEventContent(event, isEditing)}
                            <div className="flex items-center gap-1 shrink-0">
                              {!isEditing && (
                                <>
                                  <button
                                    onClick={() => setEditingId(event.id)}
                                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 transition-colors"
                                    title="编辑"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                                    title="删除"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 shrink-0 whitespace-nowrap ml-2">
                              {event.date.split('-').slice(1).join('-')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
