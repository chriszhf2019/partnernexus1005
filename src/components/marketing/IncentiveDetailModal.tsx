import React, { useState, useEffect } from 'react';
import { 
  X, 
  Target, 
  Users, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Info, 
  AlertCircle,
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  Lightbulb,
  Building2,
  Briefcase,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { AdjustParametersModal } from './AdjustParametersModal';
import { supabase } from '../../lib/supabase';

interface PartnerData {
  id: string;
  name: string;
  submissions: number;
  eligible: number;
  totalValue: string;
  status: string;
}

interface OpportunityData {
  id: string;
  title: string;
  value: string;
  status: string;
  reason: string;
  date: string;
}

interface IncentiveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: {
    id: string;
    title: string;
    objective: string;
    target: string;
    budget: string;
    consumed: string;
    progress: number;
    partnersCount: number;
    eligibleOpps: number;
  };
}

export const IncentiveDetailModal: React.FC<IncentiveDetailModalProps> = ({ isOpen, onClose, program }) => {
  const [activeTab, setActiveTab] = useState<'partners' | 'policy' | 'insights'>('partners');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [partnersRes, oppsRes] = await Promise.all([
          supabase.from('program_participants').select('*').eq('program_id', program.id),
          supabase.from('program_opportunities').select('*').eq('program_id', program.id)
        ]);
        
        if (partnersRes.data) {
          setPartners(partnersRes.data.map((row: any) => ({
            id: row.partner_id || `p-${row.id}`,
            name: row.partner_name || row.name || '未知伙伴',
            submissions: row.submissions || 0,
            eligible: row.eligible_count || 0,
            totalValue: row.total_value ? `¥${(row.total_value / 10000).toFixed(1)}M` : '¥0',
            status: row.status || 'Active'
          })));
        }
        
        if (oppsRes.data) {
          setOpportunities(oppsRes.data.map((row: any) => ({
            id: row.id,
            title: row.opportunity_title || row.title || '未命名商机',
            value: row.value ? `¥${(row.value / 10000).toFixed(1)}M` : '¥0',
            status: row.is_eligible ? 'Eligible' : 'Ineligible',
            reason: row.eligible_reason || row.reason || (row.is_eligible ? '符合激励规则' : '不符合激励规则'),
            date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          })));
        }
      } catch (error) {
        console.warn('Failed to fetch incentive data, using fallback:', error);
        // Fallback mock data when database is unavailable
        setPartners([
          { id: 'p1', name: '北京华胜天成科技股份有限公司', submissions: 12, eligible: 8, totalValue: '¥4.5M', status: 'Active' },
          { id: 'p2', name: '上海中软华信网络科技有限公司', submissions: 8, eligible: 5, totalValue: '¥2.8M', status: 'Active' },
          { id: 'p3', name: '深圳神州数码云科数据技术有限公司', submissions: 15, eligible: 12, totalValue: '¥8.2M', status: 'High Performer' },
          { id: 'p4', name: '广州佳都数据服务有限公司', submissions: 5, eligible: 2, totalValue: '¥1.2M', status: 'At Risk' },
        ]);
        setOpportunities([
          { id: 'o1', title: '某省人民医院信创数据库替换项目', value: '¥1.2M', status: 'Eligible', reason: '符合医疗信创专项产品目录', date: '2024-03-15' },
          { id: 'o2', title: '市中心医院核心业务系统升级', value: '¥800K', status: 'Eligible', reason: '满足金牌伙伴报备规则', date: '2024-03-18' },
          { id: 'o3', title: '县中医院办公系统采购', value: '¥300K', status: 'Ineligible', reason: '项目金额低于起奖阈值 (¥500K)', date: '2024-03-20' },
          { id: 'o4', title: '某三甲医院容灾备份方案', value: '¥2.1M', status: 'Ineligible', reason: '非指定竞品替换场景', date: '2024-03-22' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, program.id]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl bg-slate-50 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Section */}
          <div className="bg-white p-8 border-b border-slate-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-black dark:bg-white/10 flex items-center justify-center text-black dark:text-white border border-black dark:border-white/20">
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{program.title}</h2>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">执行中 (Active)</span>
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    {program.objective} • {program.target}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[#f5f5f7] rounded-full transition-colors text-slate-400 hover:text-slate-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: '参与伙伴', value: program.partnersCount, sub: '家活跃伙伴', icon: Users, color: 'text-blue-600' },
                { label: '符合奖励商机', value: program.eligibleOpps, sub: '条有效报备', icon: Briefcase, color: 'text-emerald-600' },
                { label: '预算消耗', value: program.consumed, sub: `总额 ${program.budget}`, icon: Coins, color: 'text-black dark:text-white' },
                { label: '业务达成率', value: `${program.progress}%`, sub: '目标 20 家', icon: CheckCircle2, color: 'text-slate-900' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">{stat.value}</span>
                    <span className="text-[10px] font-bold text-slate-400">{stat.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-8 bg-white border-b border-slate-200 flex items-center gap-8">
            {[
              { id: 'partners', label: '伙伴执行清单', icon: Users },
              { id: 'policy', label: '激励政策详情', icon: FileText },
              { id: 'insights', label: 'AI 优化建议', icon: Lightbulb },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "py-4 flex items-center gap-2 text-xs font-black transition-all border-b-2",
                  activeTab === tab.id 
                    ? "border-black dark:border-white text-black dark:text-white" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex">
            {activeTab === 'partners' && (
              <>
                {/* Left: Partner List */}
                <div className="w-1/2 border-r border-slate-200 bg-white overflow-y-auto">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="搜索伙伴名称..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/10"
                          />
                        </div>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {partners.length === 0 ? (
                          <div className="p-8 text-center">
                            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-sm font-bold text-slate-400">暂无参与伙伴</p>
                          </div>
                        ) : partners.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPartner(p.id)}
                        className={cn(
                          "w-full p-6 text-left transition-all hover:bg-slate-50 flex items-center justify-between group",
                          selectedPartner === p.id ? "bg-slate-50 ring-1 ring-inset ring-primary/10" : ""
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 line-clamp-1">{p.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">提交: {p.submissions}</span>
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">符合: {p.eligible}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={cn("w-5 h-5 transition-all", selectedPartner === p.id ? "text-black dark:text-white translate-x-1" : "text-slate-300")} />
                      </button>
                    ))}
                    </div>
                  </>
                )}
                </div>

                {/* Right: Opportunity Detail */}
                <div className="w-1/2 overflow-y-auto p-8 bg-slate-50/50">
                  {selectedPartner ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-900">商机报备明细 (Opportunities)</h3>
                        <div className="flex gap-2">
                          <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all">
                            <Filter className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {opportunities.map((opp) => (
                          <div key={opp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {opp.status === 'Eligible' ? (
                                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                                    <XCircle className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-black text-slate-900">{opp.title}</p>
                                  <p className="text-[10px] font-bold text-slate-400">{opp.date}</p>
                                </div>
                              </div>
                              <span className="text-sm font-black text-slate-900">{opp.value}</span>
                            </div>
                            <div className={cn(
                              "p-3 rounded-xl text-[10px] font-bold flex items-center gap-2",
                              opp.status === 'Eligible' ? "bg-emerald-50/50 text-emerald-700" : "bg-red-50/50 text-red-700"
                            )}>
                              {opp.status === 'Eligible' ? <Info className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                              {opp.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12">
                      <div className="w-20 h-20 rounded-3xl bg-[#f5f5f7] flex items-center justify-center text-slate-300 mb-6">
                        <ArrowUpRight className="w-10 h-10" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-2">选择一个伙伴查看明细</h4>
                      <p className="text-sm font-bold text-slate-400 max-w-xs leading-relaxed">
                        点击左侧清单中的合作伙伴，即可深度下钻查看其提交的每一条商机及其奖励符合情况。
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'policy' && (
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-black dark:text-white" />
                      激励规则与条款 (Policy & Terms)
                    </h3>
                    <div className="space-y-6">
                      {[
                        { label: '奖励基准', content: '每成功替换一家指定竞品数据库，奖励项目金额的 5%，单笔上限 ¥50,000。' },
                        { label: '考核指标', content: '必须完成 POC 验证，并提供原厂替换确认函。' },
                        { label: '参与资格', content: '仅限年度签约的金牌及以上级别合作伙伴。' },
                        { label: '结算方式', content: '项目结项后 30 个工作日内以现金 SPIFF 形式发放至伙伴账户。' },
                      ].map((item, i) => (
                        <div key={i} className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">{item.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-black dark:bg-white/20 rounded-xl">
                          <Lightbulb className="w-6 h-6 text-black dark:text-white" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">AI 策略优化建议</h3>
                      </div>
                      <div className="space-y-6">
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-sm font-bold text-white/90 leading-relaxed mb-4">
                            当前计划在“银牌伙伴”群体中的渗透率仅为 40%，远低于金牌伙伴的 85%。数据表明，银牌伙伴拥有大量县域医疗机构资源，但受限于 POC 技术能力。
                          </p>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setIsAdjustModalOpen(true)}
                              className="px-4 py-2 bg-black dark:bg-white text-white text-[10px] font-black rounded-xl hover:scale-105 transition-all"
                            >
                              开放技术专家支持包
                            </button>
                            <button 
                              onClick={() => setIsAdjustModalOpen(true)}
                              className="px-4 py-2 bg-white/10 text-white text-[10px] font-black rounded-xl hover:bg-white/20 transition-all"
                            >
                              调整起奖阈值
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-black dark:bg-white/20 blur-[100px] -mr-32 -mt-32" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 bg-white border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">数据更新于: 2024-04-06 22:00</p>
            </div>
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-[#f5f5f7] text-slate-600 text-xs font-black rounded-2xl hover:bg-slate-200 transition-all">
                导出完整清单
              </button>
              <button 
                onClick={() => setIsAdjustModalOpen(true)}
                className="px-8 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-slate-200"
              >
                调整激励参数
              </button>
            </div>
          </div>

          {/* Adjust Parameters Modal */}
          <AdjustParametersModal 
            isOpen={isAdjustModalOpen}
            onClose={() => setIsAdjustModalOpen(false)}
            program={program}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
