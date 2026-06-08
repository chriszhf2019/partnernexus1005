import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { MapPin, TrendingUp, Award, Activity, ChevronRight, X, Bell, AlertTriangle, Calendar, Target, DollarSign, Users, Shield } from 'lucide-react';

interface PartnerHealthBarProps {
  partners: any[];
  pendingCount: number;
  onFilterStatus?: (status: string) => void;
  onTabChange?: (tab: string) => void;
}

// Detail modal component
const HealthDetail = ({ title, items, onClose }: { title: string; items: { label: string; value: string; extra?: string; tip?: string }[]; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
      <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b px-5 py-4 flex items-center justify-between">
        <h3 className="text-sm font-bold">{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-4 space-y-1">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">暂无数据</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                {item.tip && <p className="text-[10px] text-neutral-400 mt-0.5">{item.tip}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{item.value}</p>
                {item.extra && <p className="text-[10px] text-neutral-400">{item.extra}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  </div>
);

export const PartnerHealthBar = ({
  partners, pendingCount, onFilterStatus, onTabChange,
}: PartnerHealthBarProps) => {
  const navigate = useNavigate();
  const [showDrawer, setShowDrawer] = useState(false);
  const [healthDetail, setHealthDetail] = useState<{ title: string; items: { label: string; value: string; extra?: string; tip?: string }[] } | null>(null);

  const coopCount = partners.filter(p => p.status === 'Cooperating').length;
  const wonCount = partners.filter(p => (p.winRate || 0) > 0).length;
  const regions = [...new Set(partners.map(p => p.region).filter(Boolean))];
  const newThisQ = 2; // hardcoded
  const whiteSpaces = ['西北', '西南'].filter(r => !regions.includes(r));

  return (
    <>
      {/* Three Health Cards — matching KPI card style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 覆盖健康 */}
        <div className="group/tip relative bg-white dark:bg-neutral-900 rounded-xl border border-blue-200 dark:border-blue-800 p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setHealthDetail({
            title: '覆盖健康 — 区域/行业饱和度分析',
            items: [
              { label: '覆盖区域', value: `${regions.length} 个`, extra: regions.join(' · '), tip: '已建立合作伙伴的区域数量' },
              { label: '空白市场', value: `${whiteSpaces.length} 个`, extra: whiteSpaces.join(' · ') || '无', tip: '尚未覆盖的区域，建议优先招募' },
              { label: '新签伙伴(本季)', value: `${newThisQ} 家`, extra: '较上季持平', tip: '本季度新注册并已激活的伙伴' },
              { label: '行业覆盖', value: '4 个行业', extra: '制造 · 医疗 · 金融 · 政务', tip: '伙伴覆盖的行业维度' },
              { label: '区域密度', value: `${(coopCount / Math.max(regions.length, 1)).toFixed(0)} 家/区`, tip: '每区域平均伙伴数，低于3家表示覆盖不足' },
              { label: '待招募区域', value: whiteSpaces.length > 0 ? '需关注' : '饱和', extra: whiteSpaces.length > 0 ? `建议在${whiteSpaces.join('、')}招募` : '', tip: '' },
            ],
          })}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs text-neutral-500">🌐 覆盖健康</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">78</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">5区覆盖 · 新签+2 · 白地{whiteSpaces.length}区</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 ml-2"><MapPin className="w-5 h-5 text-blue-600" /></div>
          </div>
          <div className="h-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }} />
          </div>
          <button className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-blue-50 transition-colors">
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm rounded-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 max-w-[300px] text-center shadow-lg">
            覆盖决定了生意的上限。诊断区域分布、行业渗透和空白市场，指导招商策略。
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45"></div>
          </div>
        </div>

        {/* 活跃健康 */}
        <div className="group/tip relative bg-white dark:bg-neutral-900 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setHealthDetail({
            title: '活跃健康 — 生态脉搏诊断',
            items: [
              { label: '活跃伙伴(Cooperating)', value: `${coopCount} 家`, extra: `占总数 ${Math.round(coopCount/partners.length*100)}%`, tip: '状态为 Cooperating 的伙伴' },
              { label: 'L1 交易活跃(有赢单)', value: `${wonCount} 家`, extra: '有赢单记录的伙伴', tip: '已有成交记录的高价值伙伴' },
              { label: 'L2 报备活跃(90天内有商机)', value: `${partners.filter(p => (p.pipeline_registered||0)+(p.pipeline_solution||0)+(p.pipeline_commercial||0)>0).length || Math.round(coopCount*0.45)} 家`, extra: '有在手pipeline', tip: '近期有商机报备行为的伙伴' },
              { label: 'L3 沉睡伙伴(>90天无活动)', value: `${Math.max(0, coopCount - wonCount - Math.round(coopCount*0.45))} 家`, extra: '需激活', tip: '超过90天无任何商机活动的伙伴' },
              { label: '待批复', value: `${pendingCount} 家`, extra: '尚未正式激活', tip: '已注册但未批复的伙伴' },
            ],
          })}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs text-neutral-500">⚡ 活跃健康</p>
                {coopCount < partners.length * 0.7 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="活跃度偏低" />}
              </div>
              <p className="text-2xl font-bold text-emerald-600">72</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">活跃{coopCount}家 · L1→L2 {wonCount}家 · 沉睡{Math.max(0, coopCount-wonCount-Math.round(coopCount*0.45))}家</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 ml-2"><Activity className="w-5 h-5 text-emerald-600" /></div>
          </div>
          <div className="h-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '72%' }} />
          </div>
          <button className="mt-2 w-full text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm rounded-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 max-w-[300px] text-center shadow-lg">
            活跃决定了过程。诊断伙伴的参与深度，识别"僵尸伙伴"和"超级贡献者"。
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45"></div>
          </div>
        </div>

        {/* 能效健康 */}
        <div className="group/tip relative bg-white dark:bg-neutral-900 rounded-xl border border-purple-200 dark:border-purple-800 p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setHealthDetail({
            title: '能效健康 — 投入产出分析',
            items: [
              { label: '单伙伴平均产出(ARPP)', value: `¥${(107100000 / Math.max(coopCount, 1) / 10000).toFixed(0)}万`, tip: 'Pipeline总额 ÷ 活跃伙伴数，衡量伙伴平均战斗力' },
              { label: '有赢单伙伴', value: `${wonCount} 家`, extra: `赢单率 ≥1%`, tip: '至少有一单成交的伙伴' },
              { label: '明星伙伴(赢单率≥80%)', value: `${partners.filter(p=>(p.winRate||0)>=80).length} 家`, extra: partners.filter(p=>(p.winRate||0)>=80).map(p=>p.name).join(' · ') || '无', tip: '赢单率超过80%的高效伙伴' },
              { label: '中坚伙伴(赢单率50-79%)', value: `${partners.filter(p=>(p.winRate||0)>=50&&(p.winRate||0)<80).length} 家`, extra: '', tip: '' },
              { label: '待提升(赢单率<50%)', value: `${partners.filter(p=>(p.winRate||0)>0&&(p.winRate||0)<50).length} 家`, extra: '', tip: '有赢单但效率需提升' },
              { label: '零产出(无赢单)', value: `${partners.filter(p=>!(p.winRate||0)).length} 家`, extra: '需诊断或淘汰', tip: '尚未有任何赢单记录的伙伴' },
            ],
          })}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs text-neutral-500">📊 能效健康</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">65</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">ARPP ¥{(107100000/Math.max(coopCount,1)/10000).toFixed(0)}万 · 赢单率{Math.round(wonCount/Math.max(partners.length,1)*100)}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 ml-2"><Target className="w-5 h-5 text-purple-600" /></div>
          </div>
          <div className="h-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '65%' }} />
          </div>
          <button className="mt-2 w-full text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-purple-50 transition-colors">
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm rounded-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 max-w-[300px] text-center shadow-lg">
            能效决定了利润。诊断投入产出比，识别"高投入低产出"和"低资源高成长"伙伴。
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45"></div>
          </div>
        </div>
      </div>

      {/* Health Detail Modal */}
      <AnimatePresence>
        {healthDetail && <HealthDetail {...healthDetail} onClose={() => setHealthDetail(null)} />}
      </AnimatePresence>

      {/* Right-side Smart Task Drawer Trigger */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center">
        <div className="bg-amber-500 text-white text-[11px] font-bold px-3 py-2 rounded-l-lg shadow-lg mr-0 animate-pulse">
          待办 <span className="text-base">{pendingCount + partners.filter(p => !p.winRate).length}</span> 项
        </div>
        <button onClick={() => setShowDrawer(true)}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-r-xl shadow-xl px-1.5 py-5 flex flex-col items-center gap-1.5 transition-all">
          <Bell className="w-5 h-5 animate-pulse" />
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
      </div>

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
              <div className="sticky top-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-5 py-5 flex items-center justify-between z-10 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Bell className="w-6 h-6 animate-pulse" /></div>
                  <div><h3 className="text-base font-extrabold">智能待办中心</h3><p className="text-[11px] text-white/70">{pendingCount + partners.filter(p => !p.winRate).length} 项待处理</p></div>
                </div>
                <button onClick={() => setShowDrawer(false)} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                {pendingCount > 0 && (<div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200"><div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-sm font-semibold text-red-700">待批复 ({pendingCount})</span></div>
                  {partners.filter(p => p.status === 'Prospective').slice(0, 5).map(p => (<div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg mb-1.5"><div><p className="text-xs font-semibold">{p.name}</p><p className="text-[10px] text-neutral-400">{p.tier} · {p.region}</p></div><button onClick={() => { setShowDrawer(false); onTabChange?.('pending'); }} className="text-[10px] text-red-600 hover:underline">批复 →</button></div>))}
                  <button onClick={() => { setShowDrawer(false); onTabChange?.('pending'); }} className="w-full text-center text-[11px] text-red-600 hover:underline mt-2">查看全部 →</button>
                </div>)}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200"><div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-sm font-semibold text-amber-700">无赢单伙伴 ({partners.filter(p => !p.winRate).length})</span></div>
                  {partners.filter(p => p.status === 'Cooperating' && !p.winRate).slice(0, 5).map(p => (<div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg mb-1.5"><div><p className="text-xs font-semibold">{p.name}</p><p className="text-[10px] text-neutral-400">{p.region} · 经理: {p.manager || '—'}</p></div><a href={`/partners/${p.id}`} className="text-[10px] text-blue-600 hover:underline">诊断 →</a></div>))}
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200"><div className="flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-blue-500" /><span className="text-sm font-semibold text-blue-700">建议发起 JBP</span></div>
                  {partners.filter(p => p.status === 'Cooperating' && p.winRate === 0).slice(0, 3).map(p => (<div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg mb-1.5"><p className="text-xs font-semibold">{p.name}</p><button onClick={() => { setShowDrawer(false); navigate(`/partners/${p.id}`); }} className="text-[10px] text-blue-600 hover:underline">发起 →</button></div>))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
