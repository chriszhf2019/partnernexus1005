import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { PartnerHealthRadar } from './PartnerHealthRadar';
import { DiagnosisPanel } from './DiagnosisPanel';
import { ActionCenter } from './ActionCenter';
import { useHealthData } from '../../hooks/useHealthData';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { MapPin, TrendingUp, Award, Activity, ChevronRight, X, Bell, AlertTriangle, Calendar, Target, Clock, DollarSign, Users, Shield } from 'lucide-react';

interface PartnerHealthBarProps {
  partners: any[];
  pendingCount: number;
  wonValue?: number;
  onFilterStatus?: (status: string) => void;
  onTabChange?: (tab: string) => void;
}

export const PartnerHealthBar = ({
  partners, pendingCount, wonValue = 0, onFilterStatus, onTabChange,
}: PartnerHealthBarProps) => {
  const navigate = useNavigate();
  const [showDrawer, setShowDrawer] = useState(false);

  const coopCount = partners.filter(p => p.status === 'Cooperating').length;
  const wonCount = partners.filter(p => (p.winRate || 0) > 0).length;
  const regions = [...new Set(partners.map(p => p.region).filter(Boolean))];
  const newThisQ = pendingCount; // Use the prop directly
  const whiteSpaces = ['西北', '西南'].filter(r => !regions.includes(r));

      const { 
    vitality, diagnoses, tasks, allDiagnoses, allTasks,
    focusMetric, setFocusMetric, loading: healthLoading, 
  } = useHealthData();
  
  const FOCUS_META = [
    { key: 'OVERALL' as const, label: '综合', color: 'bg-neutral-900 dark:bg-white' },
    { key: 'COVERAGE' as const, label: '覆盖', color: 'bg-blue-500' },
    { key: 'VITALITY' as const, label: '活跃', color: 'bg-emerald-500' },
    { key: 'CAPABILITY' as const, label: '能力', color: 'bg-purple-500' },
  ];
  
  return (
    <>
      {/* Three Health Cards — in KPI card 4-column grid style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 覆盖健康 */}
        <div className="group/tip relative bg-white dark:bg-neutral-900 rounded-xl border border-blue-200 dark:border-blue-800 p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/detail/partners-coverage')}>
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
          <button onClick={(e) => { e.stopPropagation(); navigate('/detail/partners-coverage'); }} className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-blue-50 transition-colors">
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm rounded-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 max-w-[300px] text-center shadow-lg">
            覆盖决定了生意的上限。诊断区域分布、行业渗透和空白市场，指导招商策略。
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45"></div>
          </div>
        </div>

        {/* 活跃健康 */}
        <div className="group/tip relative bg-white dark:bg-neutral-900 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/detail/partners-active')}>
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
          <button onClick={(e) => { e.stopPropagation(); navigate('/detail/partners-active'); }} className="mt-2 w-full text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm rounded-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 max-w-[300px] text-center shadow-lg">
            活跃决定了过程。诊断伙伴的参与深度，识别"僵尸伙伴"和"超级贡献者"。
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45"></div>
          </div>
        </div>

        {/* 能效健康 */}
        <div className="group/tip relative bg-white dark:bg-neutral-900 rounded-xl border border-purple-200 dark:border-purple-800 p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/detail/partners-efficiency')}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs text-neutral-500">📊 能效健康</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">65</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">ARPP ¥{wonValue > 0 ? (wonValue/Math.max(coopCount,1)/10000).toFixed(0) : '--'}万 · 赢单率{Math.round(wonCount/Math.max(partners.length,1)*100)}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 ml-2"><Target className="w-5 h-5 text-purple-600" /></div>
          </div>
          <div className="h-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '65%' }} />
          </div>
          <button onClick={(e) => { e.stopPropagation(); navigate('/detail/partners-efficiency'); }} className="mt-2 w-full text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-purple-50 transition-colors">
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm rounded-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 max-w-[300px] text-center shadow-lg">
            能效决定了利润。诊断投入产出比，识别"高投入低产出"和"低资源高成长"伙伴。
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45"></div>
          </div>
        </div>

        {/* 综合健康摘要 — 4th card */}
        <div className="group/tip relative bg-white dark:bg-neutral-900 rounded-xl border border-amber-200 dark:border-amber-800 p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/detail/partners-summary')}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs text-neutral-500">📋 综合健康</p>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              </div>
              <p className="text-2xl font-bold text-amber-600">{Math.round((78+72+65)/3)}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">覆盖78 · 活跃72 · 能效65</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 ml-2"><Shield className="w-5 h-5 text-amber-600" /></div>
          </div>
          <div className="h-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((78+72+65)/3)}%` }} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-center">
            <div className="p-1 bg-blue-50 dark:bg-blue-900/10 rounded"><span className="font-bold text-blue-600">{coopCount}</span><br/><span className="text-neutral-400">活跃</span></div>
            <div className="p-1 bg-red-50 dark:bg-red-900/10 rounded"><span className="font-bold text-red-600">{pendingCount}</span><br/><span className="text-neutral-400">待批</span></div>
            <div className="p-1 bg-emerald-50 dark:bg-emerald-900/10 rounded"><span className="font-bold text-emerald-600">{wonCount}</span><br/><span className="text-neutral-400">赢单</span></div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); navigate('/detail/partners-summary'); }} className="mt-2 w-full text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-amber-50 transition-colors">
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm rounded-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 max-w-[300px] text-center shadow-lg">
            综合生态健康指数 72/100。点击查看详情页面查看全部预警和行动建议。
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45"></div>
          </div>
        </div>
      </div>

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
                {/* 1. 活跃贡献率 */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="text-sm font-semibold text-emerald-700">活跃贡献率 ({Math.round(partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) > 0).length / Math.max(partners.length, 1) * 100)}%)</span></div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg"><span className="text-emerald-600 font-bold">{partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) > 0).length} 家</span><p className="text-[10px] text-neutral-400">有商机产出</p></div>
                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg"><span className="text-amber-600 font-bold">{partners.filter(p => p.status === 'Cooperating' && (p.winRate || 0) === 0).length} 家</span><p className="text-[10px] text-neutral-400">沉睡伙伴</p></div>
                  </div>
                </div>

                {/* 2. 待批复 */}
                {pendingCount > 0 && (<div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200"><div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-red-500" /><span className="text-sm font-semibold text-red-700">待批复 ({pendingCount} 家)</span><span className="text-[10px] text-red-400">最长 {(() => { const days = partners.filter(p => p.status === 'Prospective').map(p => Math.ceil((Date.now() - new Date(p.applicationDate || p.startDate).getTime()) / 86400000)).filter((d: number) => !isNaN(d) && isFinite(d)); return days.length > 0 ? Math.max(...days) : 0; })()} 天</span></div>
                  {partners.filter(p => p.status === 'Prospective').slice(0, 5).map(p => (<div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg mb-1.5"><div><p className="text-xs font-semibold">{p.name}</p><p className="text-[10px] text-neutral-400">{p.tier} · {Math.ceil((Date.now()-new Date(p.applicationDate||p.startDate).getTime())/86400000)}天</p></div><button onClick={() => { setShowDrawer(false); onTabChange?.('pending'); }} className="text-[10px] text-red-600 hover:underline shrink-0">批复 →</button></div>))}
                  <button onClick={() => { setShowDrawer(false); onTabChange?.('pending'); }} className="w-full text-center text-[11px] text-red-600 hover:underline mt-2">查看全部 {pendingCount} 条 →</button>
                </div>)}

                {/* 3. 区域饱和度 */}
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl border border-cyan-200">
                  <div className="flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-cyan-500" /><span className="text-sm font-semibold text-cyan-700">区域饱和度</span></div>
                  <div className="space-y-1.5">
                    {[...new Set(partners.map(p=>p.region).filter(Boolean))].slice(0,6).map(r => {
                      const c = partners.filter(p=>p.region===r).length;
                          const { 
    vitality, diagnoses, tasks, allDiagnoses, allTasks,
    focusMetric, setFocusMetric, loading: healthLoading, 
  } = useHealthData();
  
  const FOCUS_META = [
    { key: 'OVERALL' as const, label: '综合', color: 'bg-neutral-900 dark:bg-white' },
    { key: 'COVERAGE' as const, label: '覆盖', color: 'bg-blue-500' },
    { key: 'VITALITY' as const, label: '活跃', color: 'bg-emerald-500' },
    { key: 'CAPABILITY' as const, label: '能力', color: 'bg-purple-500' },
  ];
  
  return (<div key={r} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg text-xs"><span>{r}</span><span className="font-bold text-cyan-600">{c} 家</span></div>);
                    })}
                  </div>
                  <p className="text-[10px] text-cyan-500 mt-2">
                    {[...new Set(partners.map(p=>p.region).filter(Boolean))].filter(r=>partners.filter(p=>p.region===r).length>=3).length} 区密集 · {['西北','西南'].filter(r=>![...new Set(partners.map(p=>p.region).filter(Boolean))].includes(r)).length} 区空白
                  </p>
                </div>

                {/* 4. 管线覆盖率 */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-purple-500" /><span className="text-sm font-semibold text-purple-700">管线覆盖率</span></div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg"><span className="text-purple-600 font-bold">{partners.filter(p=>(p.winRate||0)>=80).length} 家</span><p className="text-[10px] text-neutral-400">⭐ 明星(≥80%)</p></div>
                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg"><span className="text-purple-600 font-bold">{partners.filter(p=>(p.winRate||0)>=50&&(p.winRate||0)<80).length} 家</span><p className="text-[10px] text-neutral-400">中坚(50-79%)</p></div>
                  </div>
                  <button onClick={() => { setShowDrawer(false); window.open('/analytics', '_blank'); }} className="w-full text-center text-[11px] text-purple-600 hover:underline">查看完整高产出名单 →</button>
                </div>

                {/* 5. 无赢单伙伴 */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200"><div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-sm font-semibold text-amber-700">无赢单伙伴 ({partners.filter(p => !p.winRate).length})</span></div>
                  {partners.filter(p => p.status === 'Cooperating' && !p.winRate).slice(0, 3).map(p => (<div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg mb-1.5"><div><p className="text-xs font-semibold">{p.name}</p><p className="text-[10px] text-neutral-400">{p.region} · {p.manager || '—'}</p></div><a href={`/partners/${p.id}`} className="text-[10px] text-blue-600 hover:underline shrink-0">诊断 →</a></div>))}
                </div>

                {/* 6. JBP 建议 */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200"><div className="flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-blue-500" /><span className="text-sm font-semibold text-blue-700">建议发起 JBP</span></div>
                  {partners.filter(p => p.status === 'Cooperating' && p.winRate === 0).slice(0, 3).map(p => (<div key={p.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg mb-1.5"><p className="text-xs font-semibold">{p.name}</p><button onClick={() => { setShowDrawer(false); window.open(`/partners/${p.id}`, '_blank'); }} className="text-[10px] text-blue-600 hover:underline shrink-0">发起 →</button></div>))}
                </div>

                {/* 7. 动态分层 */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <h4 className="text-xs font-semibold text-neutral-500 mb-3">🏷️ 动态分层标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '🏆 高产出', count: partners.filter(p=>(p.winRate||0)>50&&p.status==='Cooperating').length, color: 'bg-emerald-100 text-emerald-700', action: () => onFilterStatus?.('Cooperating') },
                      { label: '💤 沉睡', count: partners.filter(p=>p.status==='Cooperating'&&(p.winRate||0)===0).length, color: 'bg-amber-100 text-amber-700', action: () => onFilterStatus?.('Cooperating') },
                      { label: '🆕 新进', count: partners.filter(p=>p.status==='Prospective').length, color: 'bg-blue-100 text-blue-700', action: () => onTabChange?.('pending') },
                      { label: '📈 上升', count: partners.filter(p=>p.status==='Cooperating'&&new Date(p.startDate).getTime()>Date.now()-90*86400000).length, color: 'bg-purple-100 text-purple-700', action: () => onFilterStatus?.('Cooperating') },
                    ].map((tag, i) => (
                      <button key={i} onClick={tag.action} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold ${tag.color} hover:opacity-80 transition-opacity`}>
                        {tag.label} {tag.count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. 生态摘要 */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <h4 className="text-xs font-semibold text-neutral-500 mb-2">📋 生态健康摘要</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white dark:bg-neutral-700 rounded-lg"><p className="text-lg font-extrabold text-blue-600">{coopCount}</p><p className="text-[9px] text-neutral-400">活跃伙伴</p></div>
                    <div className="p-2 bg-white dark:bg-neutral-700 rounded-lg"><p className="text-lg font-extrabold text-amber-600">{pendingCount}</p><p className="text-[9px] text-neutral-400">待批复</p></div>
                    <div className="p-2 bg-white dark:bg-neutral-700 rounded-lg"><p className="text-lg font-extrabold text-purple-600">{wonCount}</p><p className="text-[9px] text-neutral-400">有赢单</p></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ 智能诊断面板（三层联动） ═══ */}
      {allDiagnoses.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">🩺 智能诊断</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {focusMetric === 'OVERALL' ? '综合预警' : focusMetric === 'COVERAGE' ? '区域供需热力图' : focusMetric === 'VITALITY' ? '漏斗流失分析' : '技能缺口矩阵'}
                · 基于 {allDiagnoses.length} 项规则触发 · 当前筛选 {diagnoses.length} 项
              </p>
            </div>
            {vitality && (
              <div className="text-xs text-neutral-500">
                活跃评分 <span className="font-semibold text-neutral-700 dark:text-neutral-300">{vitality.score}</span>
                <span className="ml-1">{vitality.trends}</span>
              </div>
            )}
          </div>
          <DiagnosisPanel alerts={diagnoses} />
        </div>
      )}

      {/* ═══ 行动中心（三层联动） ═══ */}
      {allTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">🎯 行动中心</h3>
            <span className="text-xs text-neutral-400">
              {focusMetric === 'OVERALL' ? '紧急任务' : focusMetric === 'COVERAGE' ? '入驻审批与招募任务' : focusMetric === 'VITALITY' ? '激励推送与沉默唤醒' : '课程推荐与标杆案例包装'}
              · 共 {allTasks.length} 项 · 当前 {tasks.length} 项
            </span>
          </div>
          <ActionCenter tasks={tasks} />
        </div>
      )}

      {/* ═══ 活跃度漏斗 ═══ */}
      {vitality && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '注册伙伴', value: vitality.funnel_data.registered, color: 'bg-neutral-300' },
            { label: '合作中', value: vitality.funnel_data.cooperating, color: 'bg-blue-400' },
            { label: '有商机', value: vitality.funnel_data.has_leads, color: 'bg-amber-400' },
            { label: '高产出', value: vitality.funnel_data.high_yield, color: 'bg-emerald-500' },
          ].map((item, i) => (
            <div key={item.label} className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center">
              <div className={cn('w-8 h-8 rounded-full mx-auto mb-1', item.color)} />
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{item.value}</p>
              <p className="text-[10px] text-neutral-500">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
