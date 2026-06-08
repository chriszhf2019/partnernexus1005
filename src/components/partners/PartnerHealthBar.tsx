import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { ChevronRight, X, Bell, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';

interface PartnerHealthBarProps {
  partners: any[];
  pendingCount: number;
  coopCount: number;
  totalPipeline: number;
  wonCount: number;
  onFilterStatus?: (status: string) => void;
  onTabChange?: (tab: string) => void;
}

export const PartnerHealthBar = ({
  partners, pendingCount, coopCount, totalPipeline, wonCount,
  onFilterStatus, onTabChange,
}: PartnerHealthBarProps) => {
  const navigate = useNavigate();
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      {/* Three Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-neutral-900 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onFilterStatus?.('All')}>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-700">🌐 覆盖健康</span>
              <span className="text-lg font-extrabold text-blue-600">78</span>
            </div>
            <div className="h-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-neutral-500">
              <span>新签+2</span><span>5区覆盖</span><span>白地2区</span>
              <ChevronRight className="w-3 h-3 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-neutral-900 border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onFilterStatus?.('Cooperating')}>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-700">⚡ 活跃健康</span>
              <span className="text-lg font-extrabold text-emerald-600">72</span>
            </div>
            <div className="h-1.5 bg-emerald-100 dark:bg-emerald-900/20 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '72%' }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-neutral-500">
              <span>活跃{coopCount}家</span>
              <span>L1→L2 {Math.round(coopCount * 0.45)}家</span>
              <ChevronRight className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-neutral-900 border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/analytics')}>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-700">📊 能效健康</span>
              <span className="text-lg font-extrabold text-purple-600">65</span>
            </div>
            <div className="h-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '65%' }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-neutral-500">
              <span>ARPP ¥{(totalPipeline / Math.max(partners.length, 1) / 10000).toFixed(0)}万</span>
              <span>赢单率{Math.round(wonCount / Math.max(partners.length, 1))}%</span>
              <ChevronRight className="w-3 h-3 text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Right-side Smart Task Drawer Trigger */}
      <button
        onClick={() => setShowDrawer(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-amber-500 hover:bg-amber-600 text-white rounded-l-xl shadow-lg px-2 py-4 flex flex-col items-center gap-1 transition-all group"
        title="智能待办">
        <Bell className="w-5 h-5" />
        <span className="text-[10px] font-bold writing-vertical">{pendingCount + partners.filter(p => !p.winRate).length}</span>
        <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute -left-16">待办</span>
      </button>

      {/* Smart Task Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowDrawer(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[380px] bg-white dark:bg-neutral-900 shadow-2xl overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <h3 className="text-sm font-bold">智能待办中心</h3>
                </div>
                <button onClick={() => setShowDrawer(false)} className="p-1 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Urgent: Pending Approvals */}
                {pendingCount > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold text-red-700 dark:text-red-400">待批复 ({pendingCount})</span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                      以下伙伴已提交注册申请超过3天，请尽快审核批复
                    </p>
                    {partners.filter(p => p.status === 'Prospective').slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg mb-1.5">
                        <div>
                          <p className="text-xs font-semibold">{p.name}</p>
                          <p className="text-[10px] text-neutral-400">{p.tier} · {p.region} · {p.startDate?.slice(0,10)}</p>
                        </div>
                        <button onClick={() => { setShowDrawer(false); onTabChange?.('pending'); }}
                          className="text-[10px] text-red-600 hover:underline shrink-0">批复 →</button>
                      </div>
                    ))}
                    <button onClick={() => { setShowDrawer(false); onTabChange?.('pending'); }}
                      className="w-full text-center text-[11px] text-red-600 hover:underline mt-2">
                      查看全部 {pendingCount} 条待批复
                    </button>
                  </div>
                )}

                {/* No win rate partners */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">无赢单伙伴 ({partners.filter(p => !p.winRate).length})</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">以下活跃伙伴尚未产生赢单，建议进行业务诊断</p>
                  {partners.filter(p => p.status === 'Cooperating' && !p.winRate).slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg mb-1.5">
                      <div>
                        <p className="text-xs font-semibold">{p.name}</p>
                        <p className="text-[10px] text-neutral-400">{p.region} · 经理: {p.manager || '—'}</p>
                      </div>
                      <a href={`/partners/${p.id}`} target="_blank" rel="noreferrer"
                        className="text-[10px] text-blue-600 hover:underline shrink-0">诊断 →</a>
                    </div>
                  ))}
                </div>

                {/* JBP Initiative */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">建议发起 JBP</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">以下伙伴合作深度有待提升，建议发起联合业务规划</p>
                  {partners.filter(p => p.status === 'Cooperating' && p.winRate === 0).slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg mb-1.5">
                      <p className="text-xs font-semibold">{p.name}</p>
                      <button onClick={() => { setShowDrawer(false); navigate(`/partners/${p.id}`); }}
                        className="text-[10px] text-blue-600 hover:underline shrink-0">发起 →</button>
                    </div>
                  ))}
                </div>

                {/* Quick health summary */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <h4 className="text-xs font-semibold text-neutral-500 mb-2">生态健康摘要</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white dark:bg-neutral-700 rounded-lg">
                      <p className="text-lg font-extrabold text-blue-600">{coopCount}</p>
                      <p className="text-[9px] text-neutral-400">活跃伙伴</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-neutral-700 rounded-lg">
                      <p className="text-lg font-extrabold text-amber-600">{pendingCount}</p>
                      <p className="text-[9px] text-neutral-400">待批复</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-neutral-700 rounded-lg">
                      <p className="text-lg font-extrabold text-purple-600">{partners.filter(p => (p.winRate || 0) > 0).length}</p>
                      <p className="text-[9px] text-neutral-400">有赢单</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
