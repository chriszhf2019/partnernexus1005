import { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Users, ArrowRight, UserCheck, Target, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GrowthLabFunnelProps {
  totalParticipants: number;
  totalLeads: number;
  qActivities: any[];
  cur: (v: number) => string;
}

export const GrowthLabFunnel = ({ totalParticipants, totalLeads, qActivities, cur }: GrowthLabFunnelProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const funnelStages = useMemo(() => {
    const reg = totalParticipants || 1;
    const leads = totalLeads;
    const mql = Math.round(leads * 0.6);
    const won = qActivities.reduce((s: number, a: any) => s + (a.leadsGenerated || 0), 0) > 0
      ? Math.round(leads * 0.15) : 0;

    const stages = [
      { label: t('gl.funnel.registration'), value: reg, color: 'bg-blue-500', icon: Users },
      { label: t('gl.funnel.leads'), value: leads, color: 'bg-cyan-500', icon: UserCheck },
      { label: t('gl.funnel.mql'), value: mql, color: 'bg-amber-500', icon: Target },
      { label: t('gl.funnel.won'), value: won, color: 'bg-emerald-500', icon: Award },
    ];
    const maxVal = Math.max(...stages.map(s => s.value), 1);
    return stages.map(s => ({ ...s, pct: Math.round((s.value / maxVal) * 100) }));
  }, [totalParticipants, totalLeads, qActivities]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t('gl.funnel.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelStages.map((stage, i) => {
            const Icon = stage.icon;
            const dropoff = i === 0 ? null : Math.round(100 - (stage.value / funnelStages[0].value) * 100);
            return (
              <div key={stage.label}>
                <div className="flex items-center gap-3 mb-1">
                  <Icon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="text-xs text-neutral-500 w-16">{stage.label}</span>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white w-16 text-right">{stage.value}</span>
                  {dropoff !== null && (
                    <span className="text-[10px] text-red-400">-{dropoff}%</span>
                  )}
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-5 relative overflow-hidden">
                  <div className={`h-full ${stage.color} rounded-full transition-all duration-500 flex items-center justify-end pr-1`}
                    style={{ width: `${stage.pct}%` }}>
                    <span className="text-[9px] text-white font-medium leading-none">{stage.pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter>
        <button
          onClick={() => navigate('/detail/funnel-analysis')}
          className="w-full flex items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          查看详情 <ArrowRight className="w-3 h-3" />
        </button>
      </CardFooter>
    </Card>
  );
};
