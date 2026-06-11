import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import {
  AlertTriangle, Plus, ChevronRight, QrCode, Share2, Copy, Eye, Save,
  Users, GraduationCap, Zap, Trophy, Target, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface GrowthLabActivityZoneProps {
  activitiesWithROI: any[];
  tierDistribution: { l1: number; l2: number; l3: number; pct1: number; pct2: number; pct3: number };
  q2Plans: any[];
  partners: any[];
  mdfActivities: any[];
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  medianROI: number;
  cur: (v: number) => string;
  onOpenPanel: (panel: string) => void;
  setShowCreate: (v: boolean) => void;
}

const alertOptions = [
  { id: 'all' },
  { id: 'over-budget', color: 'text-red-600' },
  { id: 'no-leads', color: 'text-amber-600' },
  { id: 'not-started', color: 'text-blue-600' },
  { id: 'normal', color: 'text-emerald-600' },
];

const alertConfig: Record<string, { color: string; bg: string; pulse: boolean }> = {
  'over-budget': { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', pulse: true },
  'no-leads': { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', pulse: false },
  'not-started': { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', pulse: false },
  'normal': { color: 'text-emerald-500', bg: '', pulse: false },
};

const alertLabel: Record<string, string> = {};

export const GrowthLabActivityZone = ({
  activitiesWithROI, tierDistribution, q2Plans, partners,
  mdfActivities, statusFilter, setStatusFilter, medianROI,
  cur, onOpenPanel, setShowCreate,
}: GrowthLabActivityZoneProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const filterLabel = (id: string): string => {
    switch (id) {
      case 'all': return t('gl.activityZone.filterAll');
      case 'over-budget': return t('gl.activityZone.filterOverBudget');
      case 'no-leads': return t('gl.activityZone.filterZeroLeads');
      case 'not-started': return t('gl.activityZone.filterNotStarted');
      case 'normal': return t('gl.activityZone.filterNormal');
      default: return id;
    }
  };

  const filtered = activitiesWithROI.filter((a: any) =>
    statusFilter === 'all' || a.alertStatus === statusFilter
  );

  // Top 3 activities by leads
  const topActivities = [...mdfActivities]
    .sort((a: any, b: any) => (b.leadsGenerated || 0) - (a.leadsGenerated || 0))
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Activity List */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">{t('gl.activityZone.title')}</CardTitle>
            <span className="text-xs text-neutral-400">
              {t('gl.activityZone.subtitle', { count: activitiesWithROI.length })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {alertOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  statusFilter === opt.id
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {filterLabel(opt.id)}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-neutral-400 py-8 text-center">{t('gl.activityZone.noMatch')}</p>
            )}
            {filtered.map((act: any) => {
              const alert = alertConfig[act.alertStatus] || alertConfig.normal;
              const pct = act.budget > 0 ? Math.round(((act.actualSpend || 0) / act.budget) * 100) : 0;
              const isHighROI = act.roi > 0 && act.roi >= medianROI;
              return (
                <div
                  key={act.id}
                  className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/marketing/activity/${act.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* Alert indicator */}
                      {act.alertStatus !== 'normal' && (
                        <span className={`w-2 h-2 rounded-full ${alert.color.replace('text', 'bg')} ${alert.pulse ? 'animate-pulse' : ''}`} />
                      )}
                      <Badge variant={act.hostType === 'partner' ? 'warning' : 'default'} size="sm">
                        {act.hostType === 'partner' ? t('gl.activityZone.coHosted') : t('gl.activityZone.vendorHosted')}
                      </Badge>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{act.name}</span>
                      <Badge variant={act.status === 'Completed' ? 'success' : act.status === 'In Progress' ? 'info' : 'default'} size="sm">
                        {act.status === 'Completed' ? t('gl.activityZone.statusCompleted') : act.status === 'In Progress' ? t('gl.activityZone.statusInProgress') : t('gl.activityZone.statusPlanned')}
                      </Badge>
                      {isHighROI && (
                        <Trophy className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {act.alertStatus !== 'normal' && (
                        <span className={`text-[10px] font-medium ${alert.color}`}>{filterLabel(act.alertStatus)}</span>
                      )}
                      <span className="text-sm font-semibold">{cur(act.actualSpend || 0)} / {cur(act.budget)}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  </div>
                  <ProgressBar value={pct} size="sm" variant={pct >= 90 ? 'danger' : 'brand'} />
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-neutral-400">
                    <span>
                      {act.date} · {act.type}
                      {act.partnerName ? ` · ${act.partnerName}` : ''}
                      {act.city ? ` · ${act.city}` : ''}
                    </span>
                    <span className="flex items-center gap-3">
                      <span>{t('gl.activityZone.leadsCount', { count: act.leadsGenerated || 0 })}</span>
                      {isHighROI && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPanel('sop');
                          }}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                          <Save className="w-3 h-3" />{t('gl.activityZone.saveTemplate')}
                        </button>
                      )}
                    </span>
                  </div>
                  {/* Invitation Code Actions */}
                  {act.invitationCode && (
                    <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-[11px] text-neutral-500">{t('gl.activityZone.invitationCode')}</span>
                          <span className="text-[11px] font-mono font-bold text-blue-600">{act.invitationCode}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${window.location.origin}/invitation/${act.invitationCode}`);
                            }}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400"
                            title={t('gl.activityZone.copyLink')}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/invitation/${act.invitationCode}`, '_blank');
                            }}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400"
                            title={t('gl.activityZone.preview')}
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `${window.location.origin}/invitation/${act.invitationCode}`;
                              const text = `${t('gl.activityZone.invitationText', { name: act.name, url })}`;
                              const encodedUrl = `https://service.weixin.qq.com/cgi-bin/subscribe?text=${encodeURIComponent(text)}`;
                              window.open(encodedUrl, '_blank');
                            }}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400"
                            title={t('gl.activityZone.share')}
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Partner Matrix + Top Assets */}
      <div className="space-y-6">
        {/* Partner Capability Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('gl.activityZone.partnerMatrix')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-500">{t('gl.activityZone.l1Basic')}</span>
                  <span className="font-medium">{t('gl.activityZone.tierCount', { count: tierDistribution.l1, pct: tierDistribution.pct1 })}</span>
                </div>
                <ProgressBar value={tierDistribution.pct1} size="sm" variant="default" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-500">{t('gl.activityZone.l2Growth')}</span>
                  <span className="font-medium">{t('gl.activityZone.tierCount', { count: tierDistribution.l2, pct: tierDistribution.pct2 })}</span>
                </div>
                <ProgressBar value={tierDistribution.pct2} size="sm" variant="brand" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-500">{t('gl.activityZone.l3HighPotential')}</span>
                  <span className="font-medium">{t('gl.activityZone.tierCount', { count: tierDistribution.l3, pct: tierDistribution.pct3 })}</span>
                </div>
                <ProgressBar value={tierDistribution.pct3} size="sm" variant="success" />
              </div>
            </div>
            <Button size="sm" variant="secondary" className="w-full" onClick={() => navigate('/enablement')}>
              <Zap className="w-3.5 h-3.5 mr-1" />{t('gl.activityZone.pushTraining')}
            </Button>
          </CardContent>
        </Card>

        {/* Top Performing Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{t('gl.activityZone.topActivities')}</CardTitle>
            <Trophy className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topActivities.map((act: any, i: number) => (
                <div key={act.id} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-50/50 dark:bg-neutral-800/50">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-neutral-400 text-white' : 'bg-amber-700 text-white'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-neutral-900 dark:text-white">{act.name}</p>
                    <p className="text-[10px] text-neutral-500">{t('gl.activityZone.leadsType', { count: act.leadsGenerated || 0, type: act.type })}</p>
                  </div>
                </div>
              ))}
              {topActivities.length === 0 && (
                <p className="text-xs text-neutral-400 py-4 text-center">{t('gl.activityZone.noActivityData')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Activity CTA */}
        <Button variant="brand" className="w-full" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />{t('gl.activityZone.newActivity')}
        </Button>
      </div>
    </div>
  );
};
