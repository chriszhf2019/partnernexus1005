import { Users, TrendingUp, AlertTriangle, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Sparkline } from './Sparkline';
import { useNavigate } from 'react-router-dom';

interface AdminKpi {
  label: string;
  value: string;
  sub: string;
  trend?: { direction: 'up' | 'down'; percent: number };
  sparklineData?: number[];
  sparklineColor?: string;
  icon: typeof Users;
  iconGradient: string;
  alert?: boolean;
  onClick?: () => void;
}

interface AdminKpiCardsProps {
  activeRate: number;
  activeTrend: number[];
  completionRate: number;
  completionTrend: number[];
  stagnantCount: number;
  lowScoreCount: number;
  avgRating: number;
  totalFeedback: number;
  lowFeedbackCount: number;
  onStagnantClick?: () => void;
  onFeedbackClick?: () => void;
}

export const AdminKpiCards = ({
  activeRate,
  activeTrend,
  completionRate,
  completionTrend,
  stagnantCount,
  lowScoreCount,
  avgRating,
  totalFeedback,
  lowFeedbackCount,
  onStagnantClick,
  onFeedbackClick,
}: AdminKpiCardsProps) => {
  const navigate = useNavigate();
  const cards: AdminKpi[] = [
    {
      label: '活跃学员占比',
      value: `${activeRate}%`,
      sub: `${Math.round(activeRate * 7 / 100)}/7 人本周有学习行为`,
      trend: { direction: 'up', percent: 5 },
      sparklineData: activeTrend,
      sparklineColor: '#059669',
      icon: Users,
      iconGradient: 'bg-gradient-to-br from-blue-600 to-blue-400',
    },
    {
      label: '完课率',
      value: `${completionRate}%`,
      sub: '已完成评估课程占比',
      trend: { direction: 'up', percent: 8 },
      sparklineData: completionTrend,
      sparklineColor: '#059669',
      icon: TrendingUp,
      iconGradient: 'bg-gradient-to-br from-emerald-600 to-emerald-400',
    },
    {
      label: '预警中心',
      value: `${stagnantCount}`,
      sub: `${stagnantCount} 人滞后 · ${lowScoreCount} 课程低分`,
      icon: AlertTriangle,
      iconGradient: 'bg-gradient-to-br from-red-600 to-red-400',
      alert: true,
      onClick: onStagnantClick,
    },
    {
      label: '学员反馈',
      value: `${avgRating}`,
      sub: `${totalFeedback} 条评价 · ${lowFeedbackCount > 0 ? lowFeedbackCount + '条低分' : '无低分'}`,
      icon: MessageSquare,
      iconGradient: 'bg-gradient-to-br from-violet-600 to-violet-400',
      onClick: onFeedbackClick,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          onClick={card.onClick}
          className={cn(
            'relative overflow-hidden rounded-xl p-3 transition-all',
            card.alert
              ? 'bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-neutral-900 border-2 border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg'
              : 'bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 shadow-sm hover:shadow-md',
            card.onClick && 'cursor-pointer'
          )}
        >
          <div className={cn(
            'absolute -top-2 -right-2 w-10 h-10 rounded-full opacity-20',
            card.alert ? 'bg-red-200' : 'bg-neutral-100 dark:bg-neutral-700'
          )} />
          <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">{card.label}</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={cn('text-xl font-extrabold', card.alert && 'text-red-600 dark:text-red-400')}>
                    {card.value}
                  </span>
                  {card.trend && (
                    <span className={cn(
                      'text-[10px] font-semibold',
                      card.trend.direction === 'up' ? 'text-emerald-600' : 'text-red-500'
                    )}>
                      ↑{card.trend.percent}%
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5">{card.sub}</p>
              </div>
              {card.sparklineData && card.sparklineColor && (
                <Sparkline data={card.sparklineData} color={card.sparklineColor} width={56} height={22} />
              )}
            </div>
            <button
              onClick={() => navigate('/detail/enablement')}
              className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 w-full flex items-center justify-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              查看详情 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
};
