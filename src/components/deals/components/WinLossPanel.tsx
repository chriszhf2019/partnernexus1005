import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
// Inline SVG grid to work around Recharts CartesianGrid v3 bundler issue
const GridLines = () => (
  <g>
    {[0, 1, 2, 3, 4].map(i => (
      <line key={i} x1="0" y1={`${i * 25}%`} x2="100%" y2={`${i * 25}%`}
        stroke="#e5e7eb" strokeDasharray="3 3" strokeWidth={0.5} />
    ))}
  </g>
);
import {
  X, TrendingDown, TrendingUp, Target, DollarSign, Download,
  ChevronRight, AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import { Deal, WinLossReason } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface WinLossPanelProps {
  open: boolean;
  onClose: () => void;
  deals: Deal[];
  onNavigateDeal?: (dealId: string) => void;
}

const WIN_LOSS_COLORS: Record<string, string> = {
  Price: '#f59e0b',
  Product: '#6366f1',
  Service: '#ec4899',
  Competitor: '#ef4444',
  Timing: '#8b5cf6',
  Budget: '#06b6d4',
  Relationship: '#10b981',
  Other: '#6b7280',
  '技术方案': '#6366f1',
  '服务能力': '#10b981',
  '价格竞争力': '#f59e0b',
  '客户关系': '#ec4899',
  '品牌影响力': '#8b5cf6',
  '产品功能': '#ef4444',
};

const WIN_LOSS_LABELS: Record<WinLossReason, string> = {
  Price: '价格因素',
  Product: '产品力',
  Service: '服务差',
  Competitor: '对手强',
  Timing: '时机不合适',
  Budget: '预算问题',
  Relationship: '客户关系',
  Other: '其他',
};

type TimeRange = 'all' | 'quarter' | 'year';

export const WinLossPanel: React.FC<WinLossPanelProps> = ({ open, onClose, deals, onNavigateDeal }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedLossReason, setSelectedLossReason] = useState<string | null>(null);

  const filteredDeals = useMemo(() => {
    const now = new Date();
    return deals.filter(d => {
      if (d.stage !== 'ClosedWon' && d.stage !== 'ClosedLost') return false;
      if (timeRange === 'quarter') {
        const closeDate = d.actualCloseDate || d.lastActivityDate;
        if (!closeDate) return false;
        const d3m = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return new Date(closeDate) >= d3m;
      }
      if (timeRange === 'year') {
        const closeDate = d.actualCloseDate || d.lastActivityDate;
        if (!closeDate) return false;
        const d1y = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        return new Date(closeDate) >= d1y;
      }
      return true;
    });
  }, [deals, timeRange]);

  const lostDeals = useMemo(() => filteredDeals.filter(d => d.stage === 'ClosedLost'), [filteredDeals]);
  const wonDeals = useMemo(() => filteredDeals.filter(d => d.stage === 'ClosedWon'), [filteredDeals]);

  // 丢单原因分布
  const lossReasonData = useMemo(() => {
    const dist: Record<string, number> = {};
    lostDeals.forEach(d => {
      if (d.winLossAnalysis?.reason) {
        const label = WIN_LOSS_LABELS[d.winLossAnalysis.reason] || d.winLossAnalysis.reason;
        dist[label] = (dist[label] || 0) + 1;
      }
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [lostDeals]);

  // 丢单金额分布
  const lossAmountData = useMemo(() => {
    const dist: Record<string, number> = {};
    lostDeals.forEach(d => {
      if (d.winLossAnalysis?.reason) {
        const label = WIN_LOSS_LABELS[d.winLossAnalysis.reason] || d.winLossAnalysis.reason;
        dist[label] = (dist[label] || 0) + d.value;
      }
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [lostDeals]);

  // 赢单关键因素分布
  const winFactorData = useMemo(() => {
    const dist: Record<string, number> = {};
    wonDeals.forEach(d => {
      d.winLossAnalysis?.keyFactors?.forEach(f => {
        dist[f] = (dist[f] || 0) + 1;
      });
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [wonDeals]);

  // 各阶段丢单率
  const stageLossData = useMemo(() => {
    const stages = ['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial'];
    const stageLabels: Record<string, string> = {
      Registered: '报备', UnderReview: '审批', Approved: '批复', Solution: '方案', Commercial: '商务',
    };
    return stages.map(stage => {
      const total = deals.filter(d => d.lifecycle?.some(e => e.stage === stage)).length || 1;
      const lost = lostDeals.filter(d => d.lifecycle?.some(e => e.stage === stage)).length;
      return { name: stageLabels[stage], rate: Math.round((lost / total) * 100), count: lost };
    });
  }, [deals, lostDeals]);

  // 竞品分布 TOP5
  const competitorData = useMemo(() => {
    const dist: Record<string, number> = {};
    lostDeals.forEach(d => {
      if (d.winLossAnalysis?.competitor) {
        dist[d.winLossAnalysis.competitor] = (dist[d.winLossAnalysis.competitor] || 0) + 1;
      }
    });
    return Object.entries(dist)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [lostDeals]);

  const totalLostValue = lostDeals.reduce((s, d) => s + d.value, 0);
  const totalWonValue = wonDeals.reduce((s, d) => s + d.value, 0);
  const winRate = filteredDeals.length > 0 ? Math.round((wonDeals.length / filteredDeals.length) * 100) : 0;

  const displayedLossDeals = useMemo(() => {
    if (!selectedLossReason) return lostDeals.slice(0, 10);
    return lostDeals.filter(d => {
      const label = d.winLossAnalysis?.reason ? WIN_LOSS_LABELS[d.winLossAnalysis.reason] : '';
      return label === selectedLossReason;
    }).slice(0, 10);
  }, [lostDeals, selectedLossReason]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-6xl max-h-[90vh] overflow-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">赢单/丢单综合分析</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                {(['all', 'quarter', 'year'] as TimeRange[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                      timeRange === r ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'
                    )}
                  >
                    {r === 'all' ? '全部' : r === 'quarter' ? '本季' : '本年'}
                  </button>
                ))}
              </div>
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4" /> 导出CSV
              </Button>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Summary Bar */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            {[
              { label: '总丢单金额', value: formatCurrency(totalLostValue), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: '总赢单金额', value: formatCurrency(totalWonValue), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: '丢单数', value: `${lostDeals.length} 个`, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: '赢单率', value: `${winRate}%`, icon: Target, color: 'text-brand', bg: 'bg-brand/5' },
            ].map(s => (
              <div key={s.label} className={cn('flex items-center gap-3 p-3 rounded-xl', s.bg)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
                <div>
                  <p className="text-xs text-neutral-500">{s.label}</p>
                  <p className={cn('text-lg font-semibold', s.color === 'text-brand' ? 'text-brand' : 'text-neutral-900 dark:text-white')}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6 px-6 py-4">
            {/* 丢单原因饼图 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">丢单原因分布</CardTitle>
              </CardHeader>
              <CardContent>
                {lossReasonData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={220}>
                      <PieChart>
                        <Pie
                          data={lossReasonData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          onClick={(_, index) => setSelectedLossReason(
                            selectedLossReason === lossReasonData[index].name ? null : lossReasonData[index].name
                          )}
                          style={{ cursor: 'pointer' }}
                        >
                          {lossReasonData.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={WIN_LOSS_COLORS[entry.name] || `hsl(${index * 45}, 60%, 55%)`}
                              opacity={selectedLossReason ? (selectedLossReason === entry.name ? 1 : 0.4) : 1}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} 个`, '丢单数']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 flex-1">
                      {lossReasonData.map((entry, i) => (
                        <button
                          key={entry.name}
                          onClick={() => setSelectedLossReason(selectedLossReason === entry.name ? null : entry.name)}
                          className={cn(
                            'w-full flex items-center justify-between text-xs px-2 py-1 rounded transition-colors',
                            selectedLossReason === entry.name ? 'bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: WIN_LOSS_COLORS[entry.name] || `hsl(${i * 45}, 60%, 55%)` }} />
                            <span className="text-neutral-600 dark:text-neutral-400">{entry.name}</span>
                          </div>
                          <span className="font-medium text-neutral-900 dark:text-white">{entry.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 text-center py-8">暂无丢单数据</p>
                )}
              </CardContent>
            </Card>

            {/* 赢单因素 + 各阶段丢单率 */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">赢单关键因素</CardTitle>
                </CardHeader>
                <CardContent>
                  {winFactorData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={winFactorData} layout="vertical">
                        <GridLines />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: number) => [`${value} 个`, '赢单数']} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {winFactorData.map((_, index) => (
                            <Cell key={index} fill={Object.values(WIN_LOSS_COLORS)[index % Object.values(WIN_LOSS_COLORS).length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-neutral-400 text-center py-8">暂无赢单数据</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">各阶段丢单率</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={stageLossData}>
                      <GridLines />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip formatter={(value: number) => [`${value}%`, '丢单率']} />
                      <Bar dataKey="rate" radius={[4, 4, 0, 0]} fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-5 gap-6 px-6 py-4">
            {/* 竞品分布 */}
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">竞品丢单 TOP5</CardTitle>
                </CardHeader>
                <CardContent>
                  {competitorData.length > 0 ? (
                    <div className="space-y-2">
                      {competitorData.map((c, i) => (
                        <div key={c.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                              i === 0 ? 'bg-red-100 text-red-600' :
                              i === 1 ? 'bg-amber-100 text-amber-600' :
                              'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                            )}>
                              {i + 1}
                            </span>
                            <span className="text-neutral-700 dark:text-neutral-300">{c.name}</span>
                          </div>
                          <span className="text-xs text-neutral-500">{c.count} 个丢单</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400 text-center py-4">暂无竞品数据</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 近期丢单清单 */}
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    近期丢单清单
                    {selectedLossReason && (
                      <Badge variant="warning" size="sm" className="ml-2">
                        {selectedLossReason}
                        <button onClick={() => setSelectedLossReason(null)} className="ml-1"><X className="w-3 h-3" /></button>
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {displayedLossDeals.length > 0 ? (
                    <div className="space-y-1 max-h-[300px] overflow-auto">
                      {displayedLossDeals.map(deal => {
                        const reasonLabel = deal.winLossAnalysis?.reason
                          ? WIN_LOSS_LABELS[deal.winLossAnalysis.reason]
                          : '未知';
                        return (
                          <button
                            key={deal.id}
                            onClick={() => onNavigateDeal?.(deal.id)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-neutral-900 dark:text-white truncate">{deal.title}</p>
                              <p className="text-xs text-neutral-500">{deal.customerName} · {deal.partnerName}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                                backgroundColor: WIN_LOSS_COLORS[reasonLabel] + '20',
                                color: WIN_LOSS_COLORS[reasonLabel],
                              }}>
                                {reasonLabel}
                              </span>
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {formatCurrency(deal.value)}
                              </span>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400 text-center py-4">暂无丢单记录</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Loss amount chart */}
          <div className="px-6 pb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-red-400" />
                  丢单金额按原因分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lossAmountData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={lossAmountData}>
                      <GridLines />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '丢单金额']} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {lossAmountData.map((_, index) => (
                          <Cell key={index} fill={Object.values(WIN_LOSS_COLORS)[index % Object.values(WIN_LOSS_COLORS).length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-neutral-400 text-center py-8">暂无数据</p>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WinLossPanel;
