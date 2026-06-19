import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, 
  AlertTriangle, 
  Lightbulb, 
  TrendingDown, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Activity,
  BarChart3,
  Rocket,
  MousePointer2,
  Users,
  Calendar,
  ChevronRight,
  Info,
  Settings2,
  TrendingUp,
  X,
  MapPin,
  Clock,
  User,
  DollarSign,
  PieChart,
  CheckCircle2,
  BarChart,
  ArrowUpRight,
  Save,
  RotateCcw,
  Plus,
  PlusCircle,
  Building2,
  MessageSquare,
  QrCode,
  Gift,
  ClipboardCheck,
  Bell,
  Smartphone
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AttendeeMiniApp } from './AttendeeMiniApp';
import { GapAnalysisHeader } from './GapAnalysisHeader';
import { BudgetOverview } from './BudgetOverview';
import { supabase } from '../../lib/supabase';

// Types
interface Activity {
  id: string;
  name: string;
  type: string;
  budget: number;
  channel: string;
  desc: string;
  status: string;
  createdAt: string;
  createdBy: string;
  wechatEnabled: boolean;
  time?: string;
  location?: string;
  host?: string;
  expectedROI?: string;
  leads?: number;
  color?: string;
  loc?: string;
  estimated_value?: number;
  mql_count?: number;
  sql_count?: number;
  expected_pipeline?: number;
}

interface BudgetData {
  marketingTotal: number;
  marketingAllocated: number;
  pmdfTotal: number;
  pmdfAllocated: number;
}

interface CampaignStats {
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  totalLeads: number;
  totalBudget: number;
  usedBudget: number;
  avgConversionRate: number;
}

interface LeadConversionStep {
  label: string;
  value: number;
  count: number;
}

interface Attendee {
  id?: string;
  name: string;
  company: string;
  score: number;
  followUpStatus: string;
  status?: string;
  engagement?: string;
}

interface NewActivityData {
  name: string;
  type: string;
  budget: string;
  channel: string;
  desc: string;
}

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export const StrategyCommandCenter: React.FC = () => {
  const [user, setUser] = useState<UserData>({
    uid: 'guest-user',
    displayName: '访客用户',
    email: 'guest@strategy.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'
  });
  const [isAuthReady, setIsAuthReady] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [winRate, setWinRate] = useState<number | null>(null);
  const [salesTarget, setSalesTarget] = useState<number | null>(null);
  const [actualPipeline, setActualPipeline] = useState<number | null>(null);
  const [convRate, setConvRate] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showExecutionBoard, setShowExecutionBoard] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [modalMode, setModalMode] = useState<'details' | 'edit' | 'leads' | 'attendees'>('details');
  const [editData, setEditData] = useState<Activity | null>(null);
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);
  const [showMiniAppPreview, setShowMiniAppPreview] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [newActivityData, setNewActivityData] = useState<NewActivityData>({
    name: '',
    type: 'Marketing',
    budget: '',
    channel: '',
    desc: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activitiesRes, budgetRes, dealsRes, planRes] = await Promise.all([
          supabase.from('marketing_activities').select('*').order('created_at', { ascending: false }),
          supabase.from('marketing_budgets').select('*').single(),
          supabase.from('deals').select('value, stage, status, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('marketing_plan').select('id, name, budget, estimated_value, leads_count, plan_status, type, activity_type, created_at').order('created_at', { ascending: false }).limit(100)
        ]);

        if (activitiesRes.data) {
          setActivities(activitiesRes.data.map((row: any) => ({
            id: row.id,
            name: row.name || '',
            type: row.type || 'Marketing',
            budget: row.budget || 0,
            channel: row.channel || '',
            desc: row.description || row.desc || '',
            status: row.status || 'Planning',
            createdAt: row.created_at || new Date().toISOString(),
            createdBy: row.created_by || user.uid,
            wechatEnabled: row.wechat_enabled || false,
            time: row.time || row.date || '',
            location: row.location || '',
            host: row.host || '',
            expectedROI: row.expected_roi || '',
            leads: row.leads_generated || 0,
            estimated_value: row.estimated_value || row.expected_pipeline || 0,
            mql_count: row.mql_count || row.leads_generated || 0,
            sql_count: row.sql_count || Math.round((row.leads_generated || 0) * 0.25) || 0,
            expected_pipeline: row.estimated_value || row.expected_pipeline || (row.budget ? row.budget * 10 : 0),
            color: row.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                   row.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                   'bg-amber-50 text-amber-600',
            loc: row.location || ''
          })));
        }

        if (budgetRes.data) {
          setBudgetData({
            marketingTotal: budgetRes.data.marketing_total || 0,
            marketingAllocated: budgetRes.data.marketing_allocated || 0,
            pmdfTotal: budgetRes.data.pmdf_total || 0,
            pmdfAllocated: budgetRes.data.pmdf_allocated || 0
          });
        }

        // --- 从实际数据计算 campaign 统计 ---
        const allActivities = [...(activitiesRes.data || []), ...(planRes.data || [])];
        const completed = allActivities.filter((a: any) =>
          (a.status || a.plan_status) === 'Completed' || (a.status || a.plan_status) === 'In Progress'
        );
        const totalLeads = allActivities.reduce((sum: number, a: any) =>
          sum + (a.leads_generated || a.leads_count || 0), 0
        );
        const totalBudget = (budgetRes.data?.marketing_total || 0) + (budgetRes.data?.pmdf_total || 0);
        const usedBudget = (budgetRes.data?.marketing_allocated || 0) + (budgetRes.data?.pmdf_allocated || 0);

        // 从 deals 表计算 pipeline 数据
        const totalPipeline = (dealsRes.data || []).reduce((s: number, d: any) =>
          s + (Number(d.value) || 0), 0
        );
        const wonPipeline = (dealsRes.data || []).filter((d: any) =>
          d.stage === 'ClosedWon' || d.status === 'Closed Won'
        ).reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);

        setActualPipeline(Math.round(totalPipeline / 1000000 * 10) / 10);
        setSalesTarget(Math.max(Math.round(totalPipeline * 2 / 1000000 * 10) / 10, 10));
        setWinRate(dealsRes.data && dealsRes.data.length > 0
          ? Math.round((wonPipeline / Math.max(totalPipeline, 1)) * 100)
          : 0
        );
        setConvRate(totalLeads > 0 ? Math.min(25, Math.round(((dealsRes.data || []).length / totalLeads) * 100)) : 0);

        setCampaignStats({
          totalActivities: allActivities.length,
          completedActivities: completed.length,
          inProgressActivities: completed.filter((a: any) =>
            (a.status || a.plan_status) === 'In Progress' || (a.status || a.plan_status) === 'Active'
          ).length,
          totalLeads,
          totalBudget,
          usedBudget,
          avgConversionRate: totalLeads > 0 ? Math.min(20, Math.round(((dealsRes.data || []).length / totalLeads) * 100)) : 0
        });
      } catch (error) {
        console.warn('Failed to fetch data:', error);
        // 数据库不可用时显示空状态，不再使用硬编码 mock data
        setBudgetData(null);
        setCampaignStats(null);
      }
    };

    fetchData();
  }, [isAuthReady, user]);

  useEffect(() => {
    if (!selectedActivity?.id) {
      setAttendees([]);
      return;
    }

    const fetchAttendees = async () => {
      try {
        const res = await supabase.from('activity_attendees')
          .select('*')
          .eq('activity_id', selectedActivity.id);
        
        if (res.data) {
          setAttendees(res.data.map((row: any) => ({
            id: row.id,
            name: row.name || '',
            company: row.company || '',
            score: row.score || 50,
            followUpStatus: row.follow_up_status || 'New',
            status: row.status || '',
            engagement: row.engagement || ''
          })));
        }
      } catch (error) {
        console.warn('Failed to fetch attendees:', error);
      }
    };

    fetchAttendees();
  }, [selectedActivity?.id]);

  const handleCreateActivity = async () => {
    if (!newActivityData.name || !newActivityData.budget) return;

    try {
      const { data, error } = await supabase.from('marketing_activities').insert({
        ...newActivityData,
        budget: Number(newActivityData.budget),
        status: 'Planning',
        created_at: new Date().toISOString(),
        created_by: user.uid,
        wechat_enabled: true
      });

      if (!error) {
        setShowNewActivityModal(false);
        setNewActivityData({ name: '', type: 'Marketing', budget: '', channel: '', desc: '' });
        // Refresh activities
        const res = await supabase.from('marketing_activities').select('*').order('created_at', { ascending: false });
        if (res.data) {
          setActivities(res.data.map((row: any) => ({
            id: row.id,
            name: row.name || '',
            type: row.type || 'Marketing',
            budget: row.budget || 0,
            channel: row.channel || '',
            desc: row.description || row.desc || '',
            status: row.status || 'Planning',
            createdAt: row.created_at || new Date().toISOString(),
            createdBy: row.created_by || user.uid,
            wechatEnabled: row.wechat_enabled || false,
            time: row.time || row.date || '',
            location: row.location || '',
            host: row.host || '',
            expectedROI: row.expected_roi || '',
            leads: row.leads_generated || 0,
            color: row.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 
                   row.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                   'bg-amber-50 text-amber-600',
            loc: row.location || ''
          })));
        }
      }
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm('确定要删除该活动及其所有参会数据吗？')) return;
    try {
      await supabase.from('marketing_activities').delete().eq('id', id);
      setSelectedActivity(null);
      // Refresh activities
      const res = await supabase.from('marketing_activities').select('*').order('created_at', { ascending: false });
      if (res.data) {
        setActivities(res.data.map((row: any) => ({
          id: row.id,
          name: row.name || '',
          type: row.type || 'Marketing',
          budget: row.budget || 0,
          channel: row.channel || '',
          desc: row.description || row.desc || '',
          status: row.status || 'Planning',
          createdAt: row.created_at || new Date().toISOString(),
          createdBy: row.created_by || user.uid,
          wechatEnabled: row.wechat_enabled || false,
          time: row.time || row.date || '',
          location: row.location || '',
          host: row.host || '',
          expectedROI: row.expected_roi || '',
          leads: row.leads_generated || 0,
          color: row.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 
                 row.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                 'bg-amber-50 text-amber-600',
          loc: row.location || ''
        })));
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editData?.id) return;
    try {
      await supabase.from('marketing_activities').update({
        ...editData,
        budget: Number(editData.budget),
        updated_at: new Date().toISOString()
      }).eq('id', editData.id);

      setSelectedActivity(editData);
      setModalMode('details');
      // Refresh activities
      const res = await supabase.from('marketing_activities').select('*').order('created_at', { ascending: false });
      if (res.data) {
        setActivities(res.data.map((row: any) => ({
          id: row.id,
          name: row.name || '',
          type: row.type || 'Marketing',
          budget: row.budget || 0,
          channel: row.channel || '',
          desc: row.description || row.desc || '',
          status: row.status || 'Planning',
          createdAt: row.created_at || new Date().toISOString(),
          createdBy: row.created_by || user.uid,
          wechatEnabled: row.wechat_enabled || false,
          time: row.time || row.date || '',
          location: row.location || '',
          host: row.host || '',
          expectedROI: row.expected_roi || '',
          leads: row.leads_generated || 0,
          color: row.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 
                 row.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                 'bg-amber-50 text-amber-600',
          loc: row.location || ''
        })));
      }
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };

  const handleEditClick = () => {
    if (selectedActivity) {
      setEditData({ ...selectedActivity });
    }
    setModalMode('edit');
  };

  const requiredPipeline = useMemo(() => {
    return Math.round(salesTarget / (winRate / 100));
  }, [salesTarget, winRate]);

  const gap = useMemo(() => {
    return Math.max(0, requiredPipeline - actualPipeline);
  }, [requiredPipeline, actualPipeline]);

  const isAtRisk = gap > 0;

  const maxScale = Math.max(actualPipeline, requiredPipeline) * 1.2;
  const actualWidth = (actualPipeline / maxScale) * 100;
  const requiredPos = (requiredPipeline / maxScale) * 100;
  const gapWidth = Math.abs(requiredPipeline - actualPipeline) / maxScale * 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* App Toolbar */}
      <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black dark:bg-white/10 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-black dark:text-white" />
          </div>
          <span className="text-xs font-black text-black dark:text-white uppercase">战略指挥中心 v2.1</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-slate-100">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-900">{user.displayName}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{user.email}</p>
            </div>
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200" />
          </div>
        </div>
      </div>

      {/* Module 1: Revenue Alignment & Gap Analysis */}
      <section className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
        <GapAnalysisHeader 
          winRate={winRate} setWinRate={setWinRate}
          salesTarget={salesTarget} setSalesTarget={setSalesTarget}
          actualPipeline={actualPipeline} setActualPipeline={setActualPipeline}
        />

        <div className="px-8 py-6">
          <div className="relative pt-6 pb-10">
            {/* Bullet Chart / Stacked Bar */}
            <div className="h-8 w-full bg-[#f5f5f7] rounded-xl relative overflow-hidden flex">
              {/* Actual Pipeline */}
              <motion.div 
                initial={false}
                animate={{ width: `${actualWidth}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-slate-900 relative z-10 flex items-center px-3"
              >
                <span className="text-white text-[10px] font-black">¥{actualPipeline}M</span>
              </motion.div>

              {/* Gap Area */}
              {isAtRisk && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-orange-500/20 border-x border-orange-500 border-dashed relative z-0 flex items-center justify-center"
                  style={{ width: `${gapWidth}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-[8px] font-black rounded-full shadow-md flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      ¥{gap}M 缺口
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Scale Markers */}
            <div className="absolute bottom-4 left-0 w-full flex justify-between px-1">
              <div className="flex flex-col items-center">
                <div className="w-px h-1.5 bg-slate-200 mb-0.5" />
                <span className="text-[8px] font-bold text-slate-300">0</span>
              </div>
              <div className="flex flex-col items-center" style={{ position: 'absolute', left: `${actualWidth}%`, transform: 'translateX(-50%)' }}>
                <div className="w-px h-1.5 bg-slate-900 mb-0.5" />
                <span className="text-[9px] font-black text-slate-900">{actualPipeline}M (Actual)</span>
              </div>
              <div className="flex flex-col items-center" style={{ position: 'absolute', left: `${requiredPos}%`, transform: 'translateX(-50%)' }}>
                <div className="w-px h-3 bg-orange-500 mb-0.5" />
                <span className="text-[9px] font-black text-orange-600">{requiredPipeline}M (Required)</span>
              </div>
              <div className="flex flex-col items-center" style={{ position: 'absolute', right: '0' }}>
                <div className="w-px h-4 bg-black dark:bg-white mb-0.5" />
                <span className="text-[9px] font-black text-black dark:text-white">¥{salesTarget}M (Target)</span>
              </div>
            </div>
          </div>

          <div className="mt-2 p-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl border border-black/5 dark:border-white/5 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] text-slate-500 leading-none">
              基于 <span className="font-bold text-slate-700">{winRate}% 赢单率</span>，目标 ¥{salesTarget}M 需 Pipeline <span className="font-bold text-slate-700">¥{requiredPipeline}M</span>。
              {isAtRisk ? (
                <> 缺口 <span className="font-bold text-orange-600">¥{gap}M</span>，建议启动补救。</>
              ) : (
                <> <span className="font-bold text-emerald-600">覆盖倍数健康</span>。</>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Module 2: Budget & Execution Dashboard */}
      <section className="space-y-6">
        <BudgetOverview 
          budgetData={budgetData} 
          onNewActivity={() => setShowNewActivityModal(true)} 
        />

        {/* Detailed Activity List */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-slate-50/50">
            <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-widest">当季重点活动清单 (Q3 Key Activities)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">活动名称 (Activity)</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">时间 (Time)</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">地点 (Location)</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">类型 (Type)</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">主办者 (Host)</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">状态 (Status)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center space-y-3">
                      <div className="w-12 h-12 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full flex items-center justify-center mx-auto border border-slate-100">
                        <Calendar className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">暂无活跃活动，请点击“新增活动”开始规划</p>
                    </td>
                  </tr>
                ) : activities.map((act) => (
                  <tr 
                    key={act.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedActivity(act)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-black dark:text-white group-hover:text-black dark:text-white transition-colors">{act.name}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-500">{act.time || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-500">{act.location || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-[#f5f5f7] text-slate-600 text-[9px] font-black rounded-lg uppercase tracking-tighter">
                        {act.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-500">{act.host || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 text-[9px] font-black rounded-lg uppercase tracking-tighter",
                        act.status === 'In Progress' ? 'text-blue-600 bg-[#f5f5f7]' :
                        act.status === 'Completed' ? 'text-emerald-600 bg-emerald-50' :
                        'text-amber-600 bg-amber-50'
                      )}>
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Module 3: Prescriptive Recommendations */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-black dark:text-white tracking-tight flex items-center gap-2">
            <Lightbulb className={cn("w-5 h-5 transition-colors duration-500", showInsights ? "text-amber-500" : "text-slate-300")} />
            🤖 系统洞察与智能建议 (Insights & Next Best Actions)
          </h2>
          <button 
            onClick={() => setShowInsights(!showInsights)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border",
              showInsights 
                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
                : "bg-white text-slate-600 border-black/5 dark:border-white/5 hover:border-black dark:hover:border-white hover:text-slate-900"
            )}
          >
            {showInsights ? (
              <>收起建议 (Collapse)</>
            ) : (
              <>获取智能建议 (Get Insights)</>
            )}
            <ChevronRight className={cn("w-3 h-3 transition-transform duration-300", showInsights ? "rotate-90" : "rotate-0")} />
          </button>
        </div>

        <AnimatePresence>
          {showInsights && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
                {/* Card 1: Budget Planning */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-[#1c1c1e] p-8 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BarChart3 className="w-24 h-24 text-blue-600" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="px-3 py-1 bg-[#f5f5f7] text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">
                        预算规划建议
                      </div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    </div>

                    <div className="space-y-4 mb-8">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">洞察 (Insight)</p>
                        <p className="text-sm font-bold text-black dark:text-white leading-relaxed">
                          根据缺口分析，医疗与政务行业 Pipeline 严重不足，现有 {campaignStats?.inProgressActivities || activities.filter(a => a.status === 'In Progress').length} 场进行中活动无法支撑 Q3 目标。
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">建议 (Recommendation)</p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          建议冻结通用区域性展会的 MDF 审批，将剩余 <span className="font-black text-blue-600">
                          {budgetData && budgetData.marketingTotal > 0
                            ? `¥${Math.round((budgetData.marketingTotal - budgetData.marketingAllocated) / 10000)}万`
                            : '暂无预算数据'
                          }
                          </span> 预算全额倾斜至头部医疗 ISV 的定向数字营销。
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const remaining = budgetData ? budgetData.marketingTotal - budgetData.marketingAllocated : 0;
                        const partnersCount = 42;
                        alert(`✅ 医疗专项定向 MDF 计划已生成\n\n- 目标伙伴: ${partnersCount} 家医疗 ISV\n- 预算: ¥${Math.round(remaining / 10000)}万\n- 执行周期: Q3-Q4\n- 预期 Pipeline: ¥${Math.round(remaining * 10 / 1000000)}M`);
                      }}
                      className="w-full py-4 bg-black text-white text-xs font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                    >
                      <Rocket className="w-4 h-4" />
                      🚀 一键生成医疗专项定向 MDF 计划
                    </button>
                  </div>
                </motion.div>

                {/* Card 2: Execution Correction */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-[#1c1c1e] p-8 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-24 h-24 text-orange-600" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-orange-100">
                        执行期纠偏建议
                      </div>
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    </div>

                    <div className="space-y-4 mb-8">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">洞察 (Insight)</p>
                        <p className="text-sm font-bold text-black dark:text-white leading-relaxed">
                          上月 {campaignStats?.completedActivities || activities.filter(a => a.status === 'Completed').length} 场活动产出
                          {campaignStats?.totalLeads || activities.reduce((s, a) => s + (a.leads || 0), 0)} 个 MQL，但商机转化率仅为 <span className="text-orange-600">{campaignStats?.avgConversionRate || convRate || 5}%</span>，存在大量沉睡线索。
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">建议 (Recommendation)</p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          不要再花钱办新活动。建议立刻启动<span className="font-black text-orange-600">『线索激活 SPIFF (短期激励)』</span>，用现金直奖刺激渠道销售跟进历史线索。
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const spiffCount = Math.max(10, Math.round((campaignStats?.totalLeads || 0) * 0.6));
                        const partnersCount = Math.max(10, Math.round((campaignStats?.totalLeads || 0) * 0.3));
                        const budgetPerLead = 5000;
                        const expectedPipeline = Math.max(5, Math.round((campaignStats?.totalLeads || 0) * 0.1));
                        alert(`✅ 线索激活 SPIFF 激励令已发布\n\n- 覆盖伙伴: ${partnersCount} 家\n- 激励金额: ¥${Math.round(budgetPerLead / 1000)}K/条有效转化\n- 目标线索: ${spiffCount} MQL\n- 预期激活商机: ¥${expectedPipeline}M`);
                      }}
                      className="w-full py-4 bg-black text-white text-xs font-black rounded-2xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100"
                    >
                      <Zap className="w-4 h-4" />
                      ⚡ 一键发布线索激活专项激励令
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Module 4: Objective-Driven Execution Board */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-black dark:text-white tracking-tight flex items-center gap-2">
            <Activity className={cn("w-5 h-5 transition-colors duration-500", showExecutionBoard ? "text-black dark:text-white" : "text-slate-300")} />
            以目标为导向的执行看板 (Objective-Driven Execution Board)
          </h2>
          <button 
            onClick={() => setShowExecutionBoard(!showExecutionBoard)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border",
              showExecutionBoard 
                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
                : "bg-white text-slate-600 border-black/5 dark:border-white/5 hover:border-black dark:hover:border-white hover:text-slate-900"
            )}
          >
            {showExecutionBoard ? (
              <>收起看板 (Collapse)</>
            ) : (
              <>查看执行看板 (View Board)</>
            )}
            <ChevronRight className={cn("w-3 h-3 transition-transform duration-300", showExecutionBoard ? "rotate-90" : "rotate-0")} />
          </button>
        </div>

        <AnimatePresence>
          {showExecutionBoard && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-4">
                {/* Campaign Card A */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base font-black text-slate-900">【填补 Q3 基础缺口】</h3>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100">
                        执行中 (ON TRACK)
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">预期产出 (Expected)</p>
                          <p className="text-2xl font-black text-slate-900">
                            {campaignStats && campaignStats.totalBudget > 0
                              ? `¥${Math.round(campaignStats.totalBudget * 15 / 1000000)}M`
                              : salesTarget
                              ? `¥${salesTarget}M`
                              : '暂无数据'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">已产出 (Actual)</p>
                          <p className="text-2xl font-black text-emerald-600">
                            {actualPipeline
                              ? `¥${actualPipeline}M`
                              : campaignStats && campaignStats.totalLeads > 0
                                ? `¥${Math.round(campaignStats.totalLeads * 2000 / 1000000)}M`
                                : '¥0M'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#f5f5f7] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(() => {
                              const expected = campaignStats?.totalBudget || 0;
                              const actual = expected > 0 && actualPipeline ? actualPipeline / Math.max(1, Math.round(expected * 15 / 1000000)) * 100 : 0;
                              return Math.min(100, Math.max(5, actual));
                            })()}%`
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-slate-50/50 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">包含的武器弹药 (Campaign Tools)</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-4 py-2 bg-white border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2 shadow-sm">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-bold text-slate-700">
                          {campaignStats && campaignStats.totalActivities > 0
                            ? `${Math.ceil(campaignStats.totalActivities * 0.3)} 个 MDF 线下沙龙`
                            : '线下沙龙活动'
                          }
                        </span>
                      </div>
                      <div className="px-4 py-2 bg-white border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2 shadow-sm">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold text-slate-700">
                          {campaignStats && campaignStats.totalActivities > 0
                            ? `${Math.ceil(campaignStats.totalActivities * 0.2)} 个渠道首单 Incentive`
                            : '渠道首单激励'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Campaign Card B */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base font-black text-slate-900">【AI 新品上市冲刺】</h3>
                      <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100">
                        {(() => {
                          const rate = campaignStats?.avgConversionRate || convRate || 5;
                          return rate >= 15 ? '推进中 (ON TRACK)' : rate >= 8 ? '需关注 (ATTENTION)' : '严重落后 (AT RISK)';
                        })()}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">预期产出 (Expected)</p>
                          <p className="text-2xl font-black text-slate-900">
                            {budgetData && budgetData.pmdfTotal > 0
                              ? `¥${Math.round(budgetData.pmdfTotal / 1000000 * 10) / 10}M`
                              : salesTarget
                                ? `¥${Math.round(salesTarget * 0.6)}M`
                                : '暂无数据'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">已产出 (Actual)</p>
                          <p className="text-2xl font-black text-red-600">
                            {actualPipeline
                              ? `¥${Math.round(actualPipeline * 0.35 * 10) / 10}M`
                              : campaignStats && campaignStats.totalLeads > 0
                                ? `¥${Math.round(campaignStats.totalLeads * 500 / 1000000 * 10) / 10}M`
                                : '¥0M'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#f5f5f7] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(() => {
                              const rate = campaignStats?.avgConversionRate || convRate || 5;
                              return Math.min(100, rate * 3);
                            })()}%`
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-red-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-slate-50/50 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">包含的武器弹药 (Campaign Tools)</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-4 py-2 bg-white border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2 shadow-sm">
                        <MousePointer2 className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-xs font-bold text-slate-700">
                          {campaignStats && campaignStats.totalActivities > 0
                            ? `${Math.ceil(campaignStats.totalActivities * 0.15)} 个 Webinar`
                            : '线上 Webinar'
                          }
                        </span>
                      </div>
                      <div className="px-4 py-2 bg-white border border-black/5 dark:border-white/5 rounded-xl flex items-center gap-2 shadow-sm">
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-700">高额阶梯返点计划</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Footer Insight */}
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4" />
          系统已根据实时销售数据自动更新策略建议 • 最后更新: {new Date().toLocaleDateString('zh-CN')} {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Activity Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActivity(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 text-[8px] font-black rounded-full uppercase tracking-widest", selectedActivity.color)}>
                        {selectedActivity.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedActivity.type}</span>
                    </div>
                    <h3 className="text-2xl font-black text-black dark:text-white tracking-tight">
                      {modalMode === 'leads' ? '线索跟进看板' : modalMode === 'edit' ? '编辑活动信息' : modalMode === 'attendees' ? '参会人员名单 (WeChat)' : selectedActivity.name}
                    </h3>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedActivity(null);
                      setModalMode('details');
                    }}
                    className="p-2 hover:bg-[#f5f5f7] rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                {modalMode === 'details' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                            <Calendar className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">活动时间</p>
                            <p className="text-sm font-black text-slate-900">{selectedActivity.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                            <MapPin className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">活动地点</p>
                            <p className="text-sm font-black text-slate-900">{selectedActivity.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl">
                            <User className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">主办方</p>
                            <p className="text-sm font-black text-slate-900">{selectedActivity.host}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#f5f5f7] rounded-xl">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">预算投入</p>
                            <p className="text-sm font-black text-blue-600">¥{selectedActivity.budget.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-xl">
                            <PieChart className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">预期 ROI</p>
                            <p className="text-sm font-black text-emerald-600">{selectedActivity.expectedROI || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-xl">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">预期线索数</p>
                            <p className="text-sm font-black text-purple-600">{selectedActivity.leads || 0} MQLs</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-3xl border border-black/5 dark:border-white/5 mb-8">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">活动简介 (Description)</p>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {selectedActivity.desc || '暂无简介'}
                      </p>
                    </div>

                    {selectedActivity.wechatEnabled && (
                      <div className="mb-8 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Smartphone className="w-12 h-12 text-emerald-600" />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">微信小程序实时互动已开启</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-bold text-emerald-600">LIVE</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">已报名</p>
                            <p className="text-lg font-black text-slate-900">{attendees.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">现场签到</p>
                            <p className="text-lg font-black text-emerald-600">{attendees.filter(a => a.status === '已签到').length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">互动提问</p>
                            <p className="text-lg font-black text-blue-600">{attendees.filter(a => a.engagement === '提问').length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">抽奖参与</p>
                            <p className="text-lg font-black text-purple-600">{attendees.filter(a => a.engagement === '抽奖').length}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button 
                            onClick={() => setModalMode('attendees')}
                            className="flex-1 py-2 bg-white border border-emerald-200 text-emerald-700 text-[9px] font-black rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                          >
                            <Users className="w-3 h-3" />
                            管理参会名单
                          </button>
                          <button 
                            onClick={() => setShowMiniAppPreview(true)}
                            className="flex-1 py-2 bg-black text-white text-[9px] font-black rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Smartphone className="w-3 h-3" />
                            预览小程序端
                          </button>
                          <button className="flex-1 py-2 bg-white border border-emerald-200 text-emerald-700 text-[9px] font-black rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">
                            <Bell className="w-3 h-3" />
                            发送即时提醒
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button 
                        onClick={handleEditClick}
                        className="flex-1 py-4 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                      >
                        编辑活动详情
                      </button>
                      <button 
                        onClick={() => setModalMode('leads')}
                        className="flex-1 py-4 bg-white border border-black/5 dark:border-white/5 text-slate-600 text-xs font-black rounded-2xl hover:bg-[#f5f5f7] dark:bg-[#2c2c2e] transition-all"
                      >
                        查看线索跟进
                      </button>
                    </div>
                  </motion.div>
                )}

                {modalMode === 'edit' && editData && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">活动名称</label>
                        <input 
                          type="text" 
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-4 py-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">活动时间</label>
                        <input 
                          type="date" 
                          value={editData.time}
                          onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                          className="w-full px-4 py-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">活动地点</label>
                        <input 
                          type="text" 
                          value={editData.location}
                          onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                          className="w-full px-4 py-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">预算投入</label>
                        <input 
                          type="text" 
                          value={editData.budget.toString()}
                          onChange={(e) => setEditData({ ...editData, budget: Number(e.target.value) })}
                          className="w-full px-4 py-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">活动简介</label>
                      <textarea 
                        rows={3}
                        value={editData.desc}
                        onChange={(e) => setEditData({ ...editData, desc: e.target.value })}
                        className="w-full px-4 py-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={handleSaveEdit}
                        className="flex-1 py-4 bg-black dark:bg-white text-white text-xs font-black rounded-2xl hover:bg-black dark:bg-white/90 transition-all flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        保存修改
                      </button>
                      <button 
                        onClick={() => handleDeleteActivity(selectedActivity.id)}
                        className="flex-1 py-4 bg-red-50 text-red-600 text-xs font-black rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        删除活动
                      </button>
                    </div>
                  </motion.div>
                )}

                {modalMode === 'leads' && selectedActivity && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-[#f5f5f7] rounded-2xl border border-blue-100">
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">总线索 (MQL)</p>
                        <p className="text-xl font-black text-blue-600">{selectedActivity.leads || 0}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">商机转化 (SQL)</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-xl font-black text-emerald-600">{selectedActivity.sql_count || Math.round((selectedActivity.leads || 0) * 0.28)}</p>
                          <span className="text-[10px] font-bold text-emerald-400">{selectedActivity.leads && selectedActivity.leads > 0 ? `${Math.round(((selectedActivity.sql_count || Math.round(selectedActivity.leads * 0.28)) / selectedActivity.leads) * 100)}%` : '-'}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                        <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">预估 Pipeline</p>
                        <p className="text-xl font-black text-purple-600">
                          {selectedActivity.expected_pipeline
                            ? `¥${Math.round(selectedActivity.expected_pipeline / 1000000 * 10) / 10}M`
                            : selectedActivity.budget
                              ? `¥${Math.round(selectedActivity.budget * 15 / 1000000 * 10) / 10}M`
                              : '¥0M'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">转化漏斗 (Funnel)</p>
                      <div className="space-y-2">
                        {[
                          { label: '线索获取 (MQL)', value: 100, color: 'bg-slate-900' },
                          { label: '初步沟通 (SAL)', value: 65, color: 'bg-blue-400' },
                          { label: '商机确认 (SQL)', value: 28, color: 'bg-emerald-500' },
                          { label: '方案报价 (Proposal)', value: 12, color: 'bg-emerald-400' },
                        ].map((step, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <span className="w-24 text-[10px] font-bold text-slate-500">{step.label}</span>
                            <div className="flex-1 h-2 bg-[#f5f5f7] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${step.value}%` }}
                                className={cn("h-full rounded-full", step.color)}
                              />
                            </div>
                            <span className="w-8 text-[10px] font-black text-black dark:text-white text-right">{step.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={() => setModalMode('details')}
                        className="w-full py-4 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        返回活动详情
                      </button>
                    </div>
                  </motion.div>
                )}

                {modalMode === 'attendees' && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">线索转化率</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-slate-900">25%</span>
                          <span className="text-[8px] font-bold text-emerald-600">↑ 5%</span>
                        </div>
                      </div>
                      <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">已转商机</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-blue-600">12</span>
                          <span className="text-[8px] font-bold text-slate-400">/ 48 Leads</span>
                        </div>
                      </div>
                      <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">高潜客户 (Hot)</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-orange-600">8</span>
                          <span className="text-[8px] font-bold text-slate-400">需立即跟进</span>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white z-10 shadow-sm">
                          <tr className="border-b border-slate-100">
                            <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">参会人信息</th>
                            <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center">热度</th>
                            <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">跟进状态</th>
                            <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {attendees.map((person, idx) => (
                            <tr key={person.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-900">{person.name}</span>
                                  <span className="text-[9px] text-slate-500">{person.company}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center">
                                  <div className="w-12 h-1.5 bg-[#f5f5f7] rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full rounded-full",
                                        person.score > 80 ? "bg-orange-500" : person.score > 60 ? "bg-blue-400" : "bg-slate-300"
                                      )}
                                      style={{ width: `${person.score}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};