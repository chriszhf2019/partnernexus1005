import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileText, Star, Save, ThumbsUp, Search, TrendingUp, Users, Target, Award } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';

interface ProgramReportDrawerProps {
  open: boolean;
  onClose: () => void;
  program: {
    title: string;
    trigger_type: string;
    payout_type: string;
    totalBudget: number;
    claimedAmount: number;
    participantsCount: number;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  cur: (v: number) => string;
  roi: string;
  pipelineValue: number;
}

// Simulated partner detail data
const TOP_PARTNERS = [
  { name: '神州数码', tier: '钻石', color: 'text-purple-600', deals: 12, incentive: 280000, conversion: 58 },
  { name: '东软集团', tier: '金牌', color: 'text-amber-600', deals: 8, incentive: 180000, conversion: 45 },
  { name: '浪潮集团', tier: '金牌', color: 'text-amber-600', deals: 6, incentive: 120000, conversion: 33 },
  { name: '中科软', tier: '银牌', color: 'text-neutral-500', deals: 5, incentive: 85000, conversion: 40 },
  { name: '华为云', tier: '钻石', color: 'text-purple-600', deals: 4, incentive: 72000, conversion: 50 },
  { name: '上海宝信', tier: '银牌', color: 'text-neutral-500', deals: 3, incentive: 45000, conversion: 28 },
  { name: '北京华胜', tier: '铜牌', color: 'text-orange-600', deals: 2, incentive: 20000, conversion: 20 },
];

const TIER_DISTRIBUTION = [
  { tier: '钻石', pct: 10, color: '#7c3aed' },
  { tier: '金牌', pct: 50, color: '#f59e0b' },
  { tier: '银牌', pct: 20, color: '#94a3b8' },
  { tier: '铜牌', pct: 20, color: '#d97706' },
];

export const ProgramReportDrawer = ({ open, onClose, program, cur, roi, pipelineValue }: ProgramReportDrawerProps) => {
  const [search, setSearch] = useState('');

  if (!program) return null;

  const pct = program.totalBudget > 0 ? Math.round((program.claimedAmount / program.totalBudget) * 100) : 0;
  const targetAchievement = Math.round((pipelineValue / Math.max(program.totalBudget * 2, 1)) * 100);
  const remaining = program.totalBudget - program.claimedAmount;

  const filteredPartners = TOP_PARTNERS.filter(p =>
    !search || p.name.includes(search)
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-[600px] bg-white dark:bg-neutral-900 h-full overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-700 px-5 py-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">{program.title}</h2>
                  <Badge variant={program.status === 'Ended' ? 'default' : 'success'}>{program.status === 'Ended' ? '已结束' : '进行中'}</Badge>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {program.trigger_type} · {program.payout_type} · {program.start_date?.slice(0, 10)} ~ {program.end_date?.slice(0, 10)}
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg shrink-0">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Section 1: KPI Tiles */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '预算使用', value: `${pct}%`, sub: `${cur(program.claimedAmount)} / ${cur(program.totalBudget)}`, color: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700' },
                  { label: '商机拉动', value: cur(pipelineValue), sub: `达标率 ${targetAchievement}%`, color: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700' },
                  { label: 'ROI', value: `${roi}x`, sub: '高于行业平均 15%', color: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700' },
                  { label: '参与伙伴', value: String(program.participantsCount), sub: `活跃率 ${Math.round(program.participantsCount / Math.max(program.participantsCount + 12, 1) * 100)}%`, color: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700' },
                ].map((k, i) => (
                  <div key={i} className={cn('p-3 rounded-xl text-center', k.color)}>
                    <p className="text-[9px] text-neutral-500">{k.label}</p>
                    <p className={cn('text-lg font-extrabold mt-0.5', k.text)}>{k.value}</p>
                    <p className="text-[8px] text-neutral-400 mt-0.5">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px]">
                <span className="font-semibold text-blue-700 dark:text-blue-300">🧠 AI总结：</span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  本计划{pct >= 90 ? '已圆满结束' : '进行中'}，{pct}%预算消耗{pipelineValue > 0 ? `拉动${cur(pipelineValue)}商机` : ''}。
                  {program.participantsCount > 30 ? '伙伴参与踊跃，' : '伙伴参与度尚可，'}
                  建议下季度{pipelineValue > program.totalBudget * 2 ? '复刻该策略并追加投入' : '优化激励门槛以提升转化'}。
                </span>
              </div>

              {/* Section 2: Charts */}
              <div className="grid grid-cols-2 gap-4">
                {/* Top Partners */}
                <Card>
                  <CardContent>
                    <h4 className="text-[11px] font-semibold mb-3">🏆 伙伴贡献排行</h4>
                    <div className="space-y-1.5">
                      {TOP_PARTNERS.slice(0, 5).map((p, i) => {
                        const maxAmount = TOP_PARTNERS[0].incentive;
                        const barW = Math.round((p.incentive / maxAmount) * 100);
                        return (
                          <div key={i} className="flex items-center gap-2 text-[10px]">
                            <span className="w-4 font-semibold text-neutral-400">{i + 1}</span>
                            <span className="w-16 font-medium truncate">{p.name}</span>
                            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${barW}%` }} />
                            </div>
                            <span className="w-14 text-right text-neutral-500">{cur(p.incentive)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Tier Distribution */}
                <Card>
                  <CardContent>
                    <h4 className="text-[11px] font-semibold mb-3">🥧 伙伴等级分布</h4>
                    <div className="flex items-center justify-center gap-4">
                      <svg width="80" height="80" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="14" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                        {TIER_DISTRIBUTION.reduce((acc, t) => {
                          const circumference = 2 * Math.PI * 14;
                          const dash = (t.pct / 100) * circumference;
                          const result = [...acc, { ...t, dash, offset: acc.reduce((s, a) => s + a.dash, 0) }];
                          return result;
                        }, [] as any[]).map((t: any, i: number) => (
                          <circle key={i} cx="20" cy="20" r="14" fill="none" stroke={t.color} strokeWidth="8"
                            strokeDasharray={`${t.dash} ${2 * Math.PI * 14 - t.dash}`}
                            strokeDashoffset={-t.offset}
                            transform="rotate(-90 20 20)"
                          />
                        ))}
                      </svg>
                      <div className="space-y-1 text-[10px]">
                        {TIER_DISTRIBUTION.map((t, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                            {t.tier} {t.pct}%
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 3: Detail Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-semibold">📋 参与明细</h4>
                  <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg px-2 py-1">
                    <Search className="w-3 h-3 text-neutral-400" />
                    <input
                      placeholder="搜索伙伴..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="bg-transparent text-[10px] outline-none w-24 text-neutral-600 dark:text-neutral-300"
                    />
                  </div>
                </div>
                <div className="border border-neutral-100 dark:border-neutral-700 rounded-lg overflow-hidden">
                  <div className="flex items-center px-3 py-2 bg-neutral-50 dark:bg-neutral-800 text-[10px] font-semibold text-neutral-500 border-b border-neutral-100 dark:border-neutral-700">
                    <span className="w-20">伙伴</span><span className="w-14">等级</span><span className="w-16">报备数</span><span className="w-20">激励金额</span><span className="w-14">转化率</span>
                  </div>
                  {filteredPartners.map((p, i) => (
                    <div key={i} className="flex items-center px-3 py-2 text-[10px] border-b border-neutral-50 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                      onClick={() => alert(`穿透查看 ${p.name} 的全部报备订单\n\n商机数: ${p.deals}个\n激励金额: ${cur(p.incentive)}\n转化率: ${p.conversion}%\n等级: ${p.tier}`)}>
                      <span className="w-20 font-semibold text-neutral-800 dark:text-white">{p.name}</span>
                      <span className={cn('w-14 font-medium', p.color)}>{p.tier}</span>
                      <span className="w-16 text-neutral-600 dark:text-neutral-400">{p.deals}个</span>
                      <span className="w-20 text-neutral-600 dark:text-neutral-400">{cur(p.incentive)}</span>
                      <span className={cn('w-14 font-semibold', p.conversion >= 40 ? 'text-emerald-600' : 'text-amber-600')}>{p.conversion}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-blue-600 text-right mt-1 cursor-pointer hover:underline">点击伙伴行查看其所有报备订单 →</p>
              </div>

              {/* Section 4: Timeline */}
              <Card>
                <CardContent>
                  <h4 className="text-[11px] font-semibold mb-3">📈 消耗与商机趋势</h4>
                  <svg width="100%" height="50" viewBox="0 0 280 50" className="mb-2">
                    {/* Grid lines */}
                    {[0, 25, 50].map(y => <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="#f0f0f0" strokeWidth="0.5" />)}
                    {/* Budget line */}
                    <polyline points="0,40 60,35 120,32 160,28 200,18 240,12 260,10 280,8" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                    {/* Pipeline line */}
                    <polyline points="0,45 60,42 120,40 160,38 200,30 240,20 260,12 280,6" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
                    {/* Event marker */}
                    <circle cx="200" cy="30" r="3" fill="#dc2626" />
                    <text x="200" y="24" textAnchor="middle" fontSize="6" fill="#dc2626">5/20培训</text>
                    {/* Legend */}
                    <text x="2" y="10" fontSize="6" fill="#2563eb">预算消耗</text>
                    <text x="2" y="16" fontSize="6" fill="#059669">商机产生</text>
                  </svg>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-neutral-500">5/20 线上培训后报备量陡增 <b className="text-neutral-700 dark:text-neutral-300">40%</b></span>
                  </div>
                </CardContent>
              </Card>

              {/* Section 5: Actions */}
              <div className="flex flex-wrap gap-2 pb-6">
                <Button variant="brand" size="sm" onClick={() => alert('PDF报告生成中，将自动下载...')}>
                  <Download className="w-3 h-3 mr-1" />下载PDF报告
                </Button>
                <Button variant="secondary" size="sm" onClick={() => alert('Excel明细已导出')}>
                  <FileText className="w-3 h-3 mr-1" />导出Excel明细
                </Button>
                <Button variant="secondary" size="sm" onClick={() => alert('已保存为成功模版，可在模版库中查看')}>
                  <Save className="w-3 h-3 mr-1" />保存为模版
                </Button>
                <Button variant="outline" size="sm" onClick={() => alert(`已向 ${TOP_PARTNERS.slice(0, 10).map(p => p.name).join('、')} 发送感谢信和积分奖励`)}>
                  <ThumbsUp className="w-3 h-3 mr-1" />感谢Top10伙伴
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
