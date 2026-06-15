import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, Clock8, Star, User, MapPin,
  Plus, Sparkles, Filter, X,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { PresetFilter, Deal, isDealWon, isDealLost } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface PresetFilterBarProps {
  deals: Deal[];
  currentUser?: string;
  userRegion?: string;
  activePreset: string | null;
  onSelectPreset: (preset: PresetFilter | null) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  clock: Clock,
  'clock8': Clock8,
  'alert-triangle': AlertTriangle,
  star: Star,
  user: User,
  'map-pin': MapPin,
  filter: Filter,
};

const SYSTEM_PRESETS: PresetFilter[] = [
  {
    id: 'preset-pending',
    name: '本周待审批',
    icon: 'clock',
    filters: { stage: 'UnderReview' },
    isSystem: true,
    isAIRecommended: false,
    sortOrder: 1,
    badge: 'count',
  },
  {
    id: 'preset-stagnant',
    name: '异常停滞',
    icon: 'alert-triangle',
    filters: { isStagnant: true },
    isSystem: true,
    isAIRecommended: false,
    sortOrder: 2,
    badge: 'count',
  },
  {
    id: 'preset-expiring',
    name: '即将到期',
    icon: 'clock8',
    filters: { expiresInDaysMax: 7 },
    isSystem: true,
    isAIRecommended: false,
    sortOrder: 3,
    badge: 'count',
  },
  {
    id: 'preset-big-deals',
    name: '重点项目(>100万)',
    icon: 'star',
    filters: { minValue: 1000000 },
    isSystem: true,
    isAIRecommended: false,
    sortOrder: 4,
    badge: 'value',
  },
  {
    id: 'preset-mine',
    name: '我的商机',
    icon: 'user',
    filters: { assignedTo: 'me' },
    isSystem: true,
    isAIRecommended: false,
    sortOrder: 5,
    badge: 'count',
  },
  {
    id: 'preset-region',
    name: '区域视野',
    icon: 'map-pin',
    filters: {},
    isSystem: true,
    isAIRecommended: false,
    sortOrder: 6,
    badge: 'count',
  },
];

export const PresetFilterBar: React.FC<PresetFilterBarProps> = ({
  deals,
  currentUser = '',
  userRegion = '',
  activePreset,
  onSelectPreset,
}) => {
  const [aiRecommendations, setAiRecommendations] = useState<PresetFilter[]>([]);

  // 解析所有预设（系统 + AI推荐）
  const allPresets = useMemo(() => [...SYSTEM_PRESETS, ...aiRecommendations], [aiRecommendations]);

  // 计算每个预设匹配的商机数量
  const getPresetCount = (preset: PresetFilter): number => {
    return deals.filter(d => {
      if (preset.filters.stage && d.stage !== preset.filters.stage) return false;
      if (preset.filters.isStagnant && !d.isStagnant) return false;
      if (preset.filters.expiresInDaysMax && (d.expiresInDays ?? 999) > preset.filters.expiresInDaysMax) return false;
      if (preset.filters.minValue && d.value < preset.filters.minValue) return false;
      if (preset.filters.assignedTo === 'me' && currentUser && d.salesName !== currentUser) return false;
      if (preset.filters.region?.length && !preset.filters.region.includes(d.region)) return false;
      return true;
    }).length;
  };

  const getPresetValue = (preset: PresetFilter): number => {
    return deals.filter(d => {
      const f = preset.filters;
      if (f.stage && d.stage !== f.stage) return false;
      if (f.isStagnant && !d.isStagnant) return false;
      if (f.expiresInDaysMax && (d.expiresInDays ?? 999) > f.expiresInDaysMax) return false;
      if (f.minValue && d.value < f.minValue) return false;
      if (f.assignedTo === 'me' && currentUser && d.salesName !== currentUser) return false;
      return true;
    }).reduce((s, d) => s + d.value, 0);
  };

  // AI 推荐：分析商机集中度
  useEffect(() => {
    const generateRecommendations = () => {
      const recommendations: PresetFilter[] = [];

      // 1. 区域集中度分析
      if (userRegion) {
        const regionDeals = deals.filter(d => d.region === userRegion && d.stage !== 'ClosedWon' && d.stage !== 'ClosedLost');
        if (regionDeals.length >= 5) {
          recommendations.push({
            id: 'ai-region-big',
            name: `${userRegion}区重点项目`,
            icon: 'map-pin',
            filters: { region: [userRegion], minValue: 500000 },
            isSystem: false,
            isAIRecommended: true,
            sortOrder: 100,
            badge: 'value',
          });
        }
      }

      // 2. 大项目风险检测
      const bigPendingDeals = deals.filter(d =>
        d.value >= 5000000 && d.stage !== 'ClosedWon' && d.stage !== 'ClosedLost'
      );
      if (bigPendingDeals.length >= 3) {
        recommendations.push({
          id: 'ai-big-risk',
          name: '大项目风险追踪',
          icon: 'alert-triangle',
          filters: { minValue: 5000000 },
          isSystem: false,
          isAIRecommended: true,
          sortOrder: 101,
          badge: 'value',
        });
      }

      // 3. 阶段停滞检测
      const stuckDeals = deals.filter(d => d.isStagnant && (d.expiresInDays ?? 999) <= 30);
      if (stuckDeals.length >= 2) {
        recommendations.push({
          id: 'ai-stuck-expiring',
          name: '停滞且即将到期',
          icon: 'clock8',
          filters: { isStagnant: true, expiresInDaysMax: 30 },
          isSystem: false,
          isAIRecommended: true,
          sortOrder: 102,
          badge: 'count',
        });
      }

      // 4. 过期商机检测
      const expiredDeals = deals.filter(d => !isDealWon(d) && !isDealLost(d) && (d.expiresInDays ?? 999) < 0);
      if (expiredDeals.length > 0) {
        recommendations.push({
          id: 'ai-expired',
          name: '已过期商机',
          icon: 'alerttriangle',
          filters: { expiresInDaysMax: -1 },
          isSystem: false,
          isAIRecommended: true,
          sortOrder: 103,
          badge: 'count',
        });
      }

      setAiRecommendations(recommendations);
    };

    generateRecommendations();
  }, [deals, userRegion]);

  const handlePresetClick = (preset: PresetFilter) => {
    if (activePreset === preset.id) {
      onSelectPreset(null);
    } else {
      // 记录筛选历史
      if (currentUser) {
        void supabase.from('filter_history').insert({
          user_id: currentUser,
          filters: preset.filters,
          result_count: getPresetCount(preset),
        });
      }
      onSelectPreset(preset);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Filter className="w-4 h-4 text-neutral-400" />
        <span className="text-xs font-medium text-neutral-500">快捷筛选</span>
      </div>
      <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

      {allPresets.map(preset => {
        const IconComp = ICON_MAP[preset.icon] || Filter;
        const count = getPresetCount(preset);
        const value = getPresetValue(preset);
        const isActive = activePreset === preset.id;

        return (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
              isActive
                ? 'bg-brand/10 border-brand text-brand shadow-sm'
                : preset.isAIRecommended
                  ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/20'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-neutral-900 dark:hover:text-white',
            )}
          >
            <IconComp className="w-3 h-3" />
            <span>{preset.name}</span>
            {preset.badge === 'count' && count > 0 && (
              <span className={cn(
                'px-1 py-0.5 rounded text-[10px] font-bold',
                isActive ? 'bg-brand text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
              )}>
                {count}
              </span>
            )}
            {preset.badge === 'value' && value > 0 && (
              <span className={cn(
                'px-1 py-0.5 rounded text-[10px] font-bold',
                isActive ? 'bg-brand text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
              )}>
                ¥{(value / 10000).toFixed(0)}万
              </span>
            )}
            {preset.isAIRecommended && (
              <Sparkles className="w-3 h-3 text-purple-400" />
            )}
            {isActive && (
              <X className="w-3 h-3" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PresetFilterBar;
