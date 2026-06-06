import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Trophy, TrendingUp, DollarSign, Users, Zap, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

interface KPIIncentivePanelProps { open: boolean; onClose: () => void; }

export const KPIIncentivePanel: React.FC<KPIIncentivePanelProps> = ({ open, onClose }) => {
  const [bets] = useState([
    { id: 'b1', name: '高决策者到场对赌', desc: '到场客户中决策者（总监级+）占比超50%', target: '决策者≥50%', reward: '核销比例从80%提升至100%', progress: 60, status: 'active', extraReward: '+¥10,000 MDF额度' },
    { id: 'b2', name: '线索转化对赌', desc: '活动产生合格线索(MQL)超30条', target: 'MQL≥30条', reward: '额外奖励¥5,000 MDF额度', progress: 28, status: 'active', extraReward: '+¥5,000 MDF额度' },
    { id: 'b3', name: '商机成交对赌', desc: '活动直接转化商机金额超200万', target: '成交金额≥¥200万', reward: '下季度预算额度提升20%', progress: 150, status: 'active', extraReward: '下季+20%预算' },
    { id: 'b4', name: '满员到场对赌', desc: '实际到场率达到85%以上', target: '到场率≥85%', reward: '全额核销 + 优先专家预约权', progress: 72, status: 'active', extraReward: '优先预约专家' },
  ]);

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-3xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><Trophy className="w-5 h-5 text-amber-500" /><h2 className="text-lg font-semibold">对赌式激励规则</h2></div>
            <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6">
            <p className="text-sm text-neutral-500 mb-4">达标即奖——用"钱"和"名"驱动伙伴做高质量、高转化的活动</p>
            <div className="space-y-4">
              {bets.map(bet => {
                const isComplete = bet.progress >= (bet.id === 'b1' ? 50 : bet.id === 'b2' ? 30 : bet.id === 'b3' ? 200 : 85);
                return (
                  <Card key={bet.id}>
                    <CardContent>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold">{bet.name}</h4>
                            <Badge variant={isComplete ? 'success' : 'warning'} size="sm">{isComplete ? '已达标' : '进行中'}</Badge>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">{bet.desc}</p>
                        </div>
                        <Zap className={cn('w-5 h-5', isComplete ? 'text-amber-500 fill-amber-500' : 'text-neutral-300')} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <p className="text-xs text-neutral-500">对赌目标</p>
                          <p className="text-sm font-semibold">{bet.target}</p>
                        </div>
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                          <p className="text-xs text-amber-600">达标奖励</p>
                          <p className="text-sm font-semibold text-amber-700">{bet.reward}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                        <span>当前进度</span>
                        <span className={isComplete ? 'text-emerald-600' : 'text-neutral-500'}>{isComplete ? '✓ 已达标' : `${Math.round(bet.progress / (bet.id === 'b1' ? 50 : bet.id === 'b2' ? 30 : bet.id === 'b3' ? 200 : 85) * 100)}%`}</span>
                      </div>
                      <ProgressBar value={Math.min(bet.progress / (bet.id === 'b1' ? 50 : bet.id === 'b2' ? 30 : bet.id === 'b3' ? 200 : 85) * 100, 100)} max={100} />

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><Trophy className="w-3 h-3" />额外奖励: {bet.extraReward}</span>
                        {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
