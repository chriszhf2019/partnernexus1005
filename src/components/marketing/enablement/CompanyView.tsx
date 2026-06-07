import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { RadarCompare } from './RadarCompare';
import { cn } from '../../../lib/utils';

interface CompanyRow {
  name: string;
  firstChar: string;
  gradient: string;
  userCount: number;
  completedTotal: string;
  avgScore: number;
  activity: 'high' | 'medium' | 'low';
  scores: { tech: number; sales: number; marketing: number };
}

interface CompanyViewProps {
  companies: CompanyRow[];
  platformAvg: { tech: number; sales: number; marketing: number };
  onCompare?: (companyName: string) => void;
  onIntervene?: (companyName: string) => void;
  comparingCompany?: string | null;
  onCloseCompare?: () => void;
}

const activityLabels = { high: '🥇 最活跃', medium: '', low: '⚠️ 需关注' };
const activityTextColors = { high: 'text-emerald-600', medium: '', low: 'text-red-600' };

export const CompanyView = ({ companies, platformAvg, onCompare, onIntervene, comparingCompany, onCloseCompare }: CompanyViewProps) => (
  <div className="space-y-3">
    {companies.map((c, i) => (
      <div key={i}>
        <Card className={cn(c.activity === 'low' && 'border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50/30 dark:from-red-950/10')}>
          <CardContent>
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-extrabold shrink-0', c.gradient)}>
                {c.firstChar}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[13px] text-neutral-900 dark:text-white">{c.name}</span>
                  {c.activity !== 'medium' && (
                    <span className={cn('text-[10px] font-semibold', activityTextColors[c.activity])}>
                      {activityLabels[c.activity]}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {c.userCount}人 · {c.completedTotal} · 平均分{c.avgScore} · 活跃度{c.activity === 'high' ? '高' : c.activity === 'medium' ? '中' : '低'}
                </p>
              </div>
              {/* Score tags */}
              <div className="hidden sm:flex gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">技术 {c.scores.tech}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">销售 {c.scores.sales}</span>
                <span className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">市场 {c.scores.marketing}</span>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => onCompare?.(c.name)}>
                  对比
                </Button>
                {c.activity === 'low' && (
                  <Button variant="danger" size="sm" onClick={() => onIntervene?.(c.name)}>
                    干预
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Radar compare panel */}
        {comparingCompany === c.name && (
          <div className="mt-2 p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
            <div className="flex justify-end mb-2">
              <button onClick={onCloseCompare} className="text-[11px] text-neutral-400 hover:text-neutral-600">✕ 关闭</button>
            </div>
            <RadarCompare company={c.scores} platform={platformAvg} companyName={c.name} />
          </div>
        )}
      </div>
    ))}
  </div>
);
