import { motion } from 'motion/react';
import { AlertCircle, Sparkles, ArrowRight, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { TimeSeriesMetric, AIInsight } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface StrategicGoalBoardProps {
  revenue: TimeSeriesMetric;
  insights: AIInsight[];
  onNavigate?: (view: string) => void;
}

export const StrategicGoalBoard = ({ revenue, insights, onNavigate }: StrategicGoalBoardProps) => {
  const achievementRate = revenue?.achievements?.quarterly?.rate ?? 0;
  const isAtRisk = achievementRate < 60;

  const conclusion = achievementRate >= 80
    ? '进度健康，Q3 结单势头强劲，建议保持当前投放节奏。'
    : achievementRate >= 60
    ? '进度基本符合预期，但需关注大单转化率的波动。'
    : '进度落后时间轴 5%，且环比上月下降，需紧急关注执行效率。';

  const insightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'risk': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'opportunity': return <Zap className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">AI 诊断</span>
          <Badge variant="info" size="sm">实时</Badge>
        </div>
      </div>

      {/* Progress Ring + Stats */}
      <div className="flex items-center gap-6 mb-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e4e4e7" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="40" fill="none"
              stroke={isAtRisk ? '#d97706' : '#059669'} strokeWidth="8" strokeLinecap="round"
              strokeDasharray="251.2"
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ strokeDashoffset: 251.2 - (achievementRate / 100) * 251.2 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">{Math.round(achievementRate)}%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            <p className="text-[10px] text-neutral-500">YTD</p>
            <p className="text-sm font-semibold">42.5%</p>
          </div>
          <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            <p className="text-[10px] text-neutral-500">GAP</p>
            <p className={cn('text-sm font-semibold', isAtRisk ? 'text-amber-600' : 'text-neutral-900 dark:text-white')}>
              {formatCurrency(revenue.achievements.quarterly.target - revenue.achievements.quarterly.current)}
            </p>
          </div>
        </div>
      </div>

      {/* Conclusion */}
      <div className={cn('p-3 rounded-lg text-xs font-medium flex items-start gap-2 mb-4',
        isAtRisk ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800')}>
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        {conclusion}
      </div>

      {/* Insight Cards */}
      <div className="space-y-2">
        {insights.map((insight, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
            className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer group"
            onClick={() => {
              if (insight.actionId === 'trends') onNavigate?.('analytics');
              else if (insight.actionId === 'training') onNavigate?.('enablement');
              else if (insight.actionId === 'pmdf') onNavigate?.('marketing');
            }}>
            <div className="flex items-center gap-2 mb-1">
              {insightIcon(insight.type)}
              <span className="text-xs font-semibold text-neutral-900 dark:text-white">{insight.title}</span>
              <ArrowRight className="w-3 h-3 text-neutral-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-xs text-neutral-500">{insight.content}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button variant="primary" size="sm" onClick={() => onNavigate?.('deals')}>查看区域明细</Button>
        <Button variant="secondary" size="sm" onClick={() => onNavigate?.('enablement')}>赋能计划</Button>
      </div>
    </Card>
  );
};
