import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';

interface PartnerHealthBarProps {
  partners: any[];
  pendingCount: number;
  coopCount: number;
  totalPipeline: number;
  wonCount: number;
  onFilterStatus?: (status: string) => void;
  onTabChange?: (tab: string) => void;
}

export const PartnerHealthBar = ({
  partners, pendingCount, coopCount, totalPipeline, wonCount,
  onFilterStatus, onTabChange,
}: PartnerHealthBarProps) => {
  const navigate = useNavigate();
  const [showTasks, setShowTasks] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {/* 覆盖健康 */}
      <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-neutral-900 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onFilterStatus?.('All')}>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-700">🌐 覆盖健康</span>
            <span className="text-lg font-extrabold text-blue-600">78</span>
          </div>
          <div className="h-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-neutral-500">
            <span>新签 +2 本季</span><span>5区覆盖</span><span>白地 2区</span>
            <ChevronRight className="w-3 h-3 text-blue-400" />
          </div>
        </div>
      </Card>

      {/* 活跃健康 */}
      <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-neutral-900 border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onFilterStatus?.('Cooperating')}>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700">⚡ 活跃健康</span>
            <span className="text-lg font-extrabold text-emerald-600">72</span>
          </div>
          <div className="h-1.5 bg-emerald-100 dark:bg-emerald-900/20 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '72%' }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-neutral-500">
            <span>活跃 {coopCount}家</span>
            <span>L1→L2 {Math.round(coopCount * 0.45)}家</span>
            <span>沉睡 {Math.max(0, partners.length - coopCount)}家</span>
            <ChevronRight className="w-3 h-3 text-emerald-400" />
          </div>
        </div>
      </Card>

      {/* 能效健康 */}
      <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-neutral-900 border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/analytics')}>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-700">📊 能效健康</span>
            <span className="text-lg font-extrabold text-purple-600">65</span>
          </div>
          <div className="h-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '65%' }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-neutral-500">
            <span>ARPP ¥{(totalPipeline / Math.max(partners.length, 1) / 10000).toFixed(0)}万</span>
            <span>赢单率 {Math.round(wonCount / Math.max(partners.length, 1))}%</span>
            <ChevronRight className="w-3 h-3 text-purple-400" />
          </div>
        </div>
      </Card>

      {/* 智能待办 */}
      <Card className={cn('bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-neutral-900 border-amber-200 dark:border-amber-800 transition-all',
        showTasks && 'md:col-span-1')}>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700">📋 智能待办</span>
            <button onClick={(e) => { e.stopPropagation(); setShowTasks(!showTasks); }}
              className="text-[10px] text-amber-600 hover:underline">
              {showTasks ? '收起 ▲' : '展开 ▼'}
            </button>
          </div>
          <p className="text-[10px] text-neutral-500">
            {pendingCount > 0 && `${pendingCount} 待批复 · `}
            {partners.filter(p => !p.winRate).length} 无赢单 · 建议发起JBP
          </p>
          {showTasks && (
            <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-800 space-y-2">
              {pendingCount > 0 && (
                <button onClick={(e) => { e.stopPropagation(); onTabChange?.('pending'); }}
                  className="w-full flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-left">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="text-[10px] text-red-700 dark:text-red-400">{pendingCount} 家待批复 — 点击立即处理</span>
                  <ChevronRight className="w-3 h-3 text-red-400 ml-auto shrink-0" />
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); onFilterStatus?.('Cooperating'); }}
                className="w-full flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors text-left">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[10px] text-amber-700 dark:text-amber-400">{partners.filter(p => !p.winRate).length} 家无赢单 — 诊断原因</span>
                <ChevronRight className="w-3 h-3 text-amber-400 ml-auto shrink-0" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); navigate(`/partners/${partners.find(p=>p.status==='Cooperating')?.id || partners[0]?.id}`); }}
                className="w-full flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors text-left">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span className="text-[10px] text-blue-700 dark:text-blue-400">发起 JBP 联合业务规划</span>
                <ChevronRight className="w-3 h-3 text-blue-400 ml-auto shrink-0" />
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
