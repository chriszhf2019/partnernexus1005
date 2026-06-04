import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ChevronRight,
  Target,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  Lightbulb,
  MousePointer2,
  Briefcase
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { MDFStats, MDFMonthlyActivity } from '../../types';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';

interface MDFModuleProps {
  stats: MDFStats;
  activities: MDFMonthlyActivity[];
}

export const MDFModule: React.FC<MDFModuleProps> = ({ stats, activities }) => {
  const { t } = useLanguage();

  const getStatusIcon = (status: MDFMonthlyActivity['status']) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Planning': return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'Cancelled': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Strategic Overview: Essence, Core, Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Lightbulb className="w-16 h-16 text-black dark:text-white" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#f5f5f7] rounded-xl text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">{t('marketing.essence')}</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {t('marketing.essenceDesc')}
          </p>
          <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-2 text-[10px] font-black text-blue-600">
            <span>BRAND VALUE</span>
            <span className="w-1 h-1 bg-blue-200 rounded-full" />
            <span>DEMAND GEN</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">{t('marketing.core')}</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {t('marketing.coreDesc')}
          </p>
          <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-2 text-[10px] font-black text-emerald-600">
            <span>CONVERSION</span>
            <span className="w-1 h-1 bg-emerald-200 rounded-full" />
            <span>ENABLEMENT</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="w-16 h-16 text-amber-500" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <MousePointer2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">{t('marketing.methods')}</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {t('marketing.methodsDesc')}
          </p>
          <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-2 text-[10px] font-black text-amber-600">
            <span>MULTI-TOUCH</span>
            <span className="w-1 h-1 bg-amber-200 rounded-full" />
            <span>CLOSED-LOOP</span>
          </div>
        </motion.div>
      </div>

      {/* Overall Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">年度 MDF 总配额</p>
          <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats.annualQuota)}</h3>
          <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-400">季度配额: {formatCurrency(stats.quarterlyQuota)}</span>
            <span className="text-emerald-600 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> {stats.annualQuota > 0 ? Math.round((stats.usedAmount / stats.annualQuota) * 100) : 0}% 已用</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">已执行/核销金额</p>
          <h3 className="text-2xl font-black text-blue-600">{formatCurrency(stats.usedAmount)}</h3>
          <div className="mt-4 w-full bg-[#f5f5f7] h-1.5 rounded-full overflow-hidden">
            <div className="bg-black h-full rounded-full" style={{ width: `${(stats.usedAmount / stats.annualQuota) * 100}%` }}></div>
          </div>
          <p className="mt-2 text-[10px] font-bold text-slate-400">使用率: {((stats.usedAmount / stats.annualQuota) * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">剩余可用基金</p>
          <h3 className="text-2xl font-black text-emerald-600">{formatCurrency(stats.remainingAmount)}</h3>
          <p className="mt-4 text-[10px] font-bold text-slate-400">已执行 {activities.filter(a => a.status === 'Completed').length} 个活动</p>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">线索转化率 (Leads ROI)</p>
          <h3 className="text-2xl font-black text-slate-900">{stats.conversionRate}%</h3>
          <div className="mt-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= Math.ceil(stats.conversionRate / 20) ? "bg-black dark:bg-white" : "bg-[#f5f5f7]")} />
            ))}
          </div>
          <p className="mt-2 text-[10px] font-bold text-slate-400">
            {activities.reduce((s, a) => s + (a.leadsGenerated || 0), 0)} 条线索
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Campaign Funnel (The Essence) */}
        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm flex flex-col">
          <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-black dark:text-white" /> {t('marketing.funnel')}
          </h4>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            {(() => {
              const totalActivities = activities.length;
              const completedActivities = activities.filter(a => a.status === 'Completed').length;
              const inProgressActivities = activities.filter(a => a.status === 'In Progress').length;
              const totalLeadsFromActivities = activities.reduce((s, a) => s + (a.leadsGenerated || 0), 0);
              const totalSpendAll = activities.reduce((s, a) => s + (a.actualSpend || a.budget || 0), 0);
              // Estimated pipeline from leads (conservative: 20% lead to opportunity, avg 500K/opp)
              const estimatedPipeline = Math.round(totalLeadsFromActivities * 0.2 * 500000);
              // Funnel stages based on actual data
              const funnelStages = [
                { label: t('marketing.awareness'), value: `${totalActivities} 活动`, percentage: 100, color: 'bg-slate-900' },
                { label: t('marketing.consideration'), value: `${inProgressActivities + completedActivities} 执行`, percentage: totalActivities > 0 ? Math.round(((inProgressActivities + completedActivities) / totalActivities) * 100) : 0, color: 'bg-slate-700' },
                { label: t('marketing.conversion'), value: `${totalLeadsFromActivities} 线索`, percentage: totalActivities > 0 ? Math.max(Math.round((totalLeadsFromActivities / Math.max(1, totalActivities * 30)) * 100), 5) : 0, color: 'bg-black dark:bg-white' },
                { label: t('marketing.roi'), value: formatCurrency(estimatedPipeline), percentage: totalSpendAll > 0 ? Math.round((estimatedPipeline / totalSpendAll) * 20) : 0, color: 'bg-black' },
              ];
              return funnelStages.map((step, idx) => (
                <div key={idx} className="relative group">
                  <div className="flex items-center justify-between mb-1.5 px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{step.label}</span>
                    <span className="text-[10px] font-black text-slate-900">{step.value}</span>
                  </div>
                  <div className="w-full bg-[#f5f5f7] dark:bg-[#2c2c2e] h-8 rounded-xl overflow-hidden border border-black/5 dark:border-white/5 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${step.percentage}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={cn("h-full rounded-xl transition-all", step.color)}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className="mt-8 p-4 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-black dark:text-white mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">ROI Insight</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              {activities.length > 0
                ? `当前 ${activities.length} 个活动中，${activities.filter(a => a.leadsGenerated > 0).length} 个已产生线索。线索转化率 ${stats.conversionRate}%，建议优化高意向活动投放。`
                : '暂无营销活动数据，创建活动后将在此显示 ROI 分析。'}
            </p>
          </div>
        </div>

        {/* Monthly Activity Details */}
        <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4 text-black dark:text-white" /> 本月活动执行详情 (9月)
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">高转化</span>
              </div>
              <button className="text-[10px] font-black text-black dark:text-white hover:underline">查看历史活动</button>
            </div>
          </div>
          
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="p-5 rounded-2xl border border-black/5 hover:border-black/5 dark:border-white/5 hover:bg-slate-50/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center relative">
                      {getStatusIcon(activity.status)}
                      {activity.leadsGenerated > 100 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{activity.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{activity.type}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{activity.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{formatCurrency(activity.actualSpend || activity.budget)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">BUDGET: {formatCurrency(activity.budget)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <span>EXECUTION PROGRESS</span>
                      <span>{activity.progress}%</span>
                    </div>
                    <div className="w-full bg-[#f5f5f7] h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${activity.progress}%` }}
                        className="bg-black dark:bg-white h-full rounded-full" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-black text-emerald-600">{activity.leadsGenerated}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">LEADS</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-blue-600">¥{(activity.budget / (activity.leadsGenerated || 1)).toFixed(0)}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">CPL</p>
                    </div>
                    <button className="p-2.5 bg-[#f5f5f7] dark:bg-[#2c2c2e] text-slate-400 hover:text-black dark:text-white hover:bg-[#f5f5f7] rounded-xl transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marketing Toolkit & Best Practices (The Methods) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
          <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-black dark:text-white" /> {t('marketing.toolkit')}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '品牌视觉规范', desc: 'VI/CI 统一标准', icon: '🎨' },
              { label: '行业解决方案', desc: '标准化 PPT/白皮书', icon: '📄' },
              { label: '活动执行模板', desc: 'SOP 流程清单', icon: '📋' },
              { label: '获客工具集成', desc: 'CRM/线索追踪', icon: '🔗' },
            ].map((tool, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-black/5 hover:border-blue-100 hover:bg-[#f5f5f7]/20 transition-all cursor-pointer group">
                <span className="text-xl mb-2 block">{tool.icon}</span>
                <p className="text-xs font-black text-black dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{tool.label}</p>
                <p className="text-[10px] font-bold text-slate-400">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
          <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> {t('marketing.bestPractices')}
          </h4>
          <div className="space-y-4">
            {[
              { title: '如何通过行业沙龙提升 30% 转化？', author: '华东区渠道经理', date: '2024-08-15' },
              { title: '线上研讨会的线索清洗与跟进 SOP', author: '市场部专家', date: '2024-07-22' },
              { title: 'MDF 申请与核销的常见避坑指南', author: '财务合规部', date: '2024-09-01' },
            ].map((post, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-black/5 dark:border-white/5 hover:bg-white transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-black dark:text-white group-hover:text-black dark:text-white transition-colors">{post.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{post.author} • {post.date}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black dark:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
