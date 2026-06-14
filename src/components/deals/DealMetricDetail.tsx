import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DollarSign, Target, CheckCircle2, Clock, ChevronLeft,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Deal, DealLifecycleStage } from '../../types';
import { dealService } from '../../services/deal-service';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PageLoader } from '../ui/PageLoader';
import { computeRealStageProbabilities } from '../../lib/dealStageCalc';

const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  'Registered':    { label: '已报备', color: 'text-neutral-700', bgColor: 'bg-neutral-100' },
  'UnderReview':  { label: '审批中', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Approved':     { label: '已批复', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Solution':     { label: '方案跟进', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Commercial':   { label: '商务洽谈', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'ClosedWon':    { label: '赢单', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'ClosedLost':   { label: '丢单', color: 'text-red-500', bgColor: 'bg-red-50' },
};

const METRIC_META: Record<string, { title: string; icon: any; color: string; description: string }> = {
  pipeline: { title: '管线覆盖详情', icon: DollarSign, color: 'text-blue-600', description: '活跃商机管线总额，按阶段分布' },
  weighted: { title: '加权预期详情', icon: Target, color: 'text-amber-600', description: '金额 × 真实赢单率，反映转化预期' },
  won: { title: '赢单进展详情', icon: CheckCircle2, color: 'text-emerald-600', description: '已赢单笔数、金额和赢单率分析' },
  cycle: { title: '周期健康详情', icon: Clock, color: 'text-amber-600', description: '各阶段平均周期天数，从生命周期事件计算' },
};

const STAGE_ORDER: Record<string, DealLifecycleStage[]> = {
  pipeline: ['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial'],
  weighted: ['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial', 'ClosedWon'],
  won: ['ClosedWon'],
  cycle: ['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial'],
};

export const DealMetricDetail = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { config } = useConfig();
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    dealService.list().then(r => { setDeals(r.items); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const meta = METRIC_META[type || ''] || null;

  const stageProbs = useMemo(() => computeRealStageProbabilities(deals), [deals]);

  const pipelineValue = useMemo(() => deals.filter(d => !['ClosedWon', 'ClosedLost'].includes(d.stage)).reduce((s, d) => s + d.value, 0), [deals]);
  const wonValue = useMemo(() => deals.filter(d => d.stage === 'ClosedWon').reduce((s, d) => s + d.value, 0), [deals]);
  const stagnantDeals = useMemo(() => deals.filter(d => d.isStagnant), [deals]);

  if (loading) return <PageLoader />;
  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-lg font-semibold text-neutral-400">未找到该指标</p>
        <button onClick={() => navigate('/deals')} className="text-sm text-brand hover:underline">返回商机列表</button>
      </div>
    );
  }

  const MetaIcon = meta.icon;
  const stages = STAGE_ORDER[type || ''] || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/deals')} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.color} bg-opacity-10`}>
          <MetaIcon className={`w-5 h-5 ${meta.color}`} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{meta.title}</h1>
          <p className="text-sm text-neutral-500">{meta.description}</p>
        </div>
      </div>

      {type === 'pipeline' && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <span className="text-2xl font-bold">{formatCurrency(pipelineValue)}</span>
              <span className="text-sm text-neutral-400 ml-2">共 {deals.filter(d => !['ClosedWon','ClosedLost'].includes(d.stage)).length} 笔</span>
            </div>
            {stages.map(stage => {
              const count = deals.filter(d => d.stage === stage).length;
              const value = deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value||0), 0);
              const cfg = STAGE_CONFIG[stage] || { label: stage, color: '', bgColor: '' };
              return (
                <div key={stage} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                    <span className="text-sm">{cfg.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{count} 笔</p>
                    <p className="text-xs text-neutral-400">{formatCurrency(value)}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {type === 'weighted' && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <span className="text-2xl font-bold">{formatCurrency(deals.filter(d => !['ClosedWon','ClosedLost'].includes(d.stage)).reduce((s, d) => s + Math.round((d.value||0) * ((stageProbs[d.stage]?.probability||0)/100)), 0))}</span>
              <span className="text-sm text-neutral-400 ml-2">加权预期</span>
            </div>
            {stages.map(stage => {
              const count = deals.filter(d => d.stage === stage).length;
              const value = deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value||0), 0);
              const prob = stageProbs[stage]?.probability || 0;
              const cfg = STAGE_CONFIG[stage] || { label: stage, color: '', bgColor: '' };
              return (
                <div key={stage} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                    <span className="text-sm">{cfg.label}</span>
                    <Badge variant="outline" size="sm">{prob}%</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{count} 笔</p>
                    <p className="text-xs text-neutral-400">原始 {formatCurrency(value)} · 加权 {formatCurrency(Math.round(value * prob / 100))}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {type === 'won' && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-emerald-600">{formatCurrency(wonValue)}</span>
                <span className="text-sm text-neutral-400">赢单金额</span>
              </div>
              <div className="flex gap-6 mt-3">
                <div>
                  <p className="text-xs text-neutral-400">赢单笔数</p>
                  <p className="text-lg font-semibold">{deals.filter(d => d.stage === 'ClosedWon').length}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">赢单率</p>
                  <p className="text-lg font-semibold">{deals.length > 0 ? Math.round(deals.filter(d => d.stage === 'ClosedWon').length / deals.length * 100) : 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">总商机</p>
                  <p className="text-lg font-semibold">{deals.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {type === 'cycle' && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <span className="text-sm text-neutral-400">从生命周期事件计算各阶段实际平均天数</span>
            </div>
            {stages.map(stage => {
              const cfg = STAGE_CONFIG[stage] || { label: stage, color: '', bgColor: '' };
              const avgDays = stageProbs[stage]?.avgCycleDays || 0;
              // Calculate real avg from events
              const days: number[] = [];
              deals.forEach(d => {
                const events = d.lifecycle || [];
                const stageEvents = events.filter(e => e.stage === stage);
                if (stageEvents.length > 0 && stageEvents[0].durationDays) {
                  days.push(stageEvents[0].durationDays);
                }
              });
              const realAvg = days.length > 0 ? Math.round(days.reduce((a,b) => a+b, 0) / days.length) : 0;
              return (
                <div key={stage} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                    <span className="text-sm">{cfg.label}</span>
                  </div>
                  <span className={cn('text-sm font-medium', realAvg > 0 && realAvg > (stageProbs[stage]?.avgCycleDays || 0) * 1.5 ? 'text-amber-600' : '')}>
                    {realAvg > 0 ? `${realAvg}天` : '暂无数据'}
                    {avgDays > 0 && realAvg > 0 && <span className="text-xs text-neutral-400 ml-1">(基准 {avgDays}天)</span>}
                  </span>
                </div>
              );
            })}
            <div className="p-4 border-t text-xs text-neutral-400">
              停滞商机: {stagnantDeals.length} 笔 · 共 {deals.length} 笔
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
