import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { TrendingUp, Activity, Target, AlertTriangle, ArrowRight, Building2, GraduationCap, DollarSign, BarChart3, Users } from 'lucide-react';

interface GrowthLabCockpitsProps {
  mdfStats: any;
  incentiveStats: any;
  totalBudget: number;
  totalSpend: number;
  totalLeads: number;
  activeCount: number;
  completedCount: number;
  qActivities: any[];
  partners: any[];
  currentQuarter: string;
  cur: (v: number) => string;
  onOpenPanel: (panel: string) => void;
}

export const GrowthLabCockpits = ({
  mdfStats, totalBudget, totalSpend, totalLeads,
  activeCount, completedCount, qActivities, partners,
  currentQuarter, cur, incentiveStats, onOpenPanel,
}: GrowthLabCockpitsProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Execution Cockpit derived data
  const execRate = totalBudget > 0 ? Math.round((totalSpend / totalBudget) * 100) : 0;
  const now = new Date();
  const monthIndex = now.getMonth(); // 0-based
  const quarterNum = parseInt(currentQuarter.replace('Q', ''));
  const quarterStartMonth = (quarterNum - 1) * 3;
  const monthsIntoQuarter = Math.max(0, Math.min(3, monthIndex - quarterStartMonth + 1));
  const timeProgress = Math.round((monthsIntoQuarter / 3) * 100);
  const isLagging = execRate < timeProgress - 10;

  // Activity type distribution for mini-list
  const activityTypes: Record<string, number> = {};
  qActivities.forEach((a: any) => { activityTypes[a.type || '其他'] = (activityTypes[a.type || '其他'] || 0) + 1; });

  // Alignment Cockpit derived data
  const tierDistribution = useMemo(() => {
    const tiers: { l1: number; l2: number; l3: number } = { l1: 0, l2: 0, l3: 0 };
    partners.forEach((p: any) => {
      if (['Platinum', 'Diamond'].includes(p.tier)) tiers.l3++;
      else if (['Gold', 'Premier'].includes(p.tier)) tiers.l2++;
      else tiers.l1++;
    });
    const total = tiers.l1 + tiers.l2 + tiers.l3 || 1;
    return { l1: tiers.l1, l2: tiers.l2, l3: tiers.l3, pct1: Math.round((tiers.l1 / total) * 100), pct2: Math.round((tiers.l2 / total) * 100), pct3: Math.round((tiers.l3 / total) * 100) };
  }, [partners]);

  const industryCoverage = new Set(qActivities.map((a: any) => a.type)).size;
  const partnerMaturityScore = Math.round((tierDistribution.l3 * 100 + tierDistribution.l2 * 60) / (tierDistribution.l1 + tierDistribution.l2 + tierDistribution.l3 || 1));

  // Conversion Cockpit derived data
  const roiRatio = totalBudget > 0 ? ((totalLeads * 50000) / totalBudget).toFixed(1) : '0.0';
  const totalParticipants = qActivities.reduce((s: number, a: any) => s + (a.expected_attendees || 0), 0);

  // CPL by type
  const cplByType = useMemo(() => {
    const grouped: Record<string, { budget: number; leads: number }> = {};
    qActivities.forEach((a: any) => {
      const t = a.type || '其他';
      if (!grouped[t]) grouped[t] = { budget: 0, leads: 0 };
      grouped[t].budget += a.budget || 0;
      grouped[t].leads += a.leadsGenerated || 0;
    });
    return Object.entries(grouped)
      .map(([type, v]) => ({ type, cpl: v.leads > 0 ? v.budget / v.leads : 0, leads: v.leads }))
      .sort((a, b) => a.cpl - b.cpl);
  }, [qActivities]);

  const bestChannel = cplByType.length > 0 ? cplByType[0] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 执行舱 */}
      <Card className="relative overflow-hidden border-t-4 border-t-blue-500">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-neutral-500">{t('gl.cockpit.exec')}</span>
          </div>
          <Badge variant={isLagging ? 'warning' : 'success'} size="sm">
            {t(isLagging ? 'gl.cockpit.lagging' : 'gl.cockpit.onTrack')}
          </Badge>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{execRate}%</span>
          <span className="text-sm text-neutral-500 ml-2">{t('gl.cockpit.budgetRate')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3">
          <span>{t('gl.cockpit.timeProgress')} {timeProgress}%</span>
          <span>·</span>
          <span>{t('gl.cockpit.activityCount', { count: qActivities.length })}</span>
        </div>
        <ProgressBar value={execRate} max={100} size="sm" variant={isLagging ? 'warning' : 'success'} className="mb-3" />
        {isLagging && (
          <div className="text-xs rounded-lg p-2 mb-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {t('gl.cockpit.laggingWarning')}
          </div>
        )}
        {/* Activity type mini-distribution */}
        <div className="space-y-1 mb-3">
          {Object.entries(activityTypes).slice(0, 3).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">{type}</span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{t('gl.cockpit.activityUnit', { count })}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => onOpenPanel('mdf')}>
            {t('gl.cockpit.mdfClaims')} <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => navigate('/marketing/plan')}>
            {t('gl.cockpit.viewPlan')} <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </Card>

      {/* 对齐舱 */}
      <Card className="relative overflow-hidden border-t-4 border-t-emerald-500">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-neutral-500">{t('gl.cockpit.align')}</span>
          </div>
          <Badge variant={partnerMaturityScore < 40 ? 'warning' : 'success'} size="sm">
            {t(partnerMaturityScore < 40 ? 'gl.cockpit.lowMaturity' : 'gl.cockpit.healthy')}
          </Badge>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{partners.length}</span>
          <span className="text-sm text-neutral-500 ml-2">{t('gl.cockpit.partnerCount', { count: partners.length })}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3">
          <span>{t('gl.cockpit.coverage', { count: industryCoverage })}</span>
          <span>·</span>
          <span>{t('gl.cockpit.maturity', { score: partnerMaturityScore })}</span>
        </div>
        {/* Tier distribution bars */}
        <div className="space-y-1.5 mb-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-neutral-500">{t('gl.cockpit.l1Basic')}</span>
              <span className="text-neutral-400">{t('gl.cockpit.partnerUnit', { count: tierDistribution.l1 })}</span>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
              <div className="bg-neutral-300 dark:bg-neutral-600 h-full rounded-full" style={{ width: `${tierDistribution.pct1}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-neutral-500">{t('gl.cockpit.l2Growing')}</span>
              <span className="text-neutral-400">{t('gl.cockpit.partnerUnit', { count: tierDistribution.l2 })}</span>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${tierDistribution.pct2}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-neutral-500">{t('gl.cockpit.l3HighPotential')}</span>
              <span className="text-neutral-400">{t('gl.cockpit.partnerUnit', { count: tierDistribution.l3 })}</span>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${tierDistribution.pct3}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => navigate('/partners')}>
            <Building2 className="w-3 h-3 mr-1" />{t('gl.cockpit.partnersLabel')} <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => navigate('/enablement')}>
            <GraduationCap className="w-3 h-3 mr-1" />{t('gl.cockpit.enablement')} <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </Card>

      {/* 转化舱 */}
      <Card className="relative overflow-hidden border-t-4 border-t-purple-500">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-neutral-500">{t('gl.cockpit.convert')}</span>
          </div>
          <Badge variant={bestChannel && bestChannel.cpl > 0 ? 'success' : 'default'} size="sm">
            {bestChannel ? t('gl.cockpit.highestEfficiency', { type: bestChannel.type }) : t('gl.cockpit.collectingData')}
          </Badge>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">1:{roiRatio}</span>
          <span className="text-sm text-neutral-500 ml-2">{t('gl.cockpit.estRoi')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3">
          <span>{t('gl.cockpit.leads', { count: totalLeads })}</span>
          <span>·</span>
          <span>{t('gl.cockpit.participants', { count: totalParticipants })}</span>
        </div>
        {/* CPL ranking mini-list */}
        <div className="space-y-1 mb-3">
          {cplByType.slice(0, 3).map((item) => (
            <div key={item.type} className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">{item.type}</span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {item.cpl > 0 ? t('gl.cockpit.cplValue', { amount: Math.round(item.cpl) }) : t('gl.cockpit.leadsOnly', { count: item.leads })}
              </span>
            </div>
          ))}
          {cplByType.length === 0 && (
            <p className="text-xs text-neutral-400">{t('gl.cockpit.noData')}</p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => navigate('/deals')}>
            <DollarSign className="w-3 h-3 mr-1" />{t('gl.cockpit.deals')} <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => navigate('/incentives')}>
            <BarChart3 className="w-3 h-3 mr-1" />{t('gl.cockpit.incentives')} <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
