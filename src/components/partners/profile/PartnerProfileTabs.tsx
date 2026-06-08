import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useProfileTab } from './ProfileTabContext';
import { AIPanel } from '../../ui/AIPanel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Tabs } from '../../ui/Tabs';
import { RegionCascader } from '../../ui/RegionCascader';
import { ProgressBar } from '../../ui/ProgressBar';
import { EmptyState } from '../../ui/EmptyState';
import { StaffManagementTab } from '../StaffManagementTab';
import { PartnerTimeline } from '../PartnerTimeline';
import { Gauge, StatCard, Breakthrough } from './ProfileComponents';
import { formatCurrency } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';
import { TIER_OPTIONS, TYPE_OPTIONS, STATUS_OPTIONS, TIER_LABELS } from '../../../lib/partner-labels';
import { cn } from '../../../lib/utils';
import {
  User, MapPin, Phone, History, ChevronRight, Building2, TrendingUp, TrendingDown,
  Target, Award, DollarSign, Clock, CheckCircle2, AlertTriangle, ExternalLink,
  ArrowUpRight, ArrowDownRight, Download, Plus, Save, FileText, Users, Zap,
  Layers, Briefcase, GitBranch, Network, Calendar, Package, ShoppingCart, Star,
  Lightbulb, Info, Link2, Activity, Shield, Search, BarChart3, PieChart, Eye,
  MessageSquare, ThumbsUp, ThumbsDown, RefreshCw, Rocket, Crosshair, Compass,
  Radar, Flame, Bell, Mail, Gift, X, Check, Tag, ListTodo, Trash2, Pencil,
} from 'lucide-react';

export const ProfileTabs = () => {
  const {
    partner, t, cur, config, activities,
    realDeals, realActivities, realIncentives,
    isEditing, setIsEditing,
    activeTab, setActiveTab,
    formData, dispatch,
    scores, breakthroughs,
    ecosystemPartners, milestones, industryCoverage,
    tasks, setTasks, taskFilter, setTaskFilter,
    toggleTaskComplete, updateTaskStatus, updateTaskDetail,
    addSubtask, deleteSubtask, updateSubtaskStatus,
    createNewTask, updatePartner,
    followUps, addFollowUp, removeFollowUp,
    saveFollowUpEdit, saveFollowUps,
    customers, saveCustomers, addCustomer,
    removeCustomer, saveCustomerEdit,
    closeDetail, openDetail, detailModal, 
    capFill, winRate, marketingScore,
    mdfPct, pipelineHealth, primaryContact,
    loading,
    keyCustomers, handleSave,
    editingCustomer, setEditingCustomer,
    showCustomerForm, setShowCustomerForm,
  } = useProfileTab();

  // 客户编辑表单状态
  const [editForm, setEditForm] = useState<any>({});
  const [newCustomer, setNewCustomer] = useState<any>({ name: '', industry: '', relationship: '合作中', annualRevenue: 0, majorProjectsStr: '', salesLead: '', productsStr: '', status: '跟进中', since: '', contactPerson: '', contactPhone: '', notes: '', goals: '' });
  
  // 跟进表单状态
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<string | null>(null);
  const [newFollowUp, setNewFollowUp] = useState({ title: '', desc: '', status: '进行中', date: new Date().toISOString().split('T')[0], nextStep: '' });

  // ─── Customer Card ─────────────────────────────────────
  const CustomerCard = ({ customer, onEdit, onDelete, onAddProgress, cur: curF }: any) => {
    const [showProgress, setShowProgress] = useState(false);
    const [newProgress, setNewProgress] = useState({ date: new Date().toISOString().split('T')[0], desc: '', nextStep: '' });
    return (
      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">{customer.name}</span>
              <Badge variant={customer.status === '合作中' ? 'success' : customer.status === '战略合作' ? 'info' : customer.status === '已流失' ? 'danger' : 'default'} size="sm">{customer.status}</Badge>
              {customer.industry && <span className="text-xs text-neutral-400">{customer.industry}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
              <span>{customer.contactPerson || '无联系人'}</span>
              {customer.contactPhone && <span>{customer.contactPhone}</span>}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">合作 {customer.relationship} · {customer.goals || '无目标设定'}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit?.(customer)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"><Pencil className="w-3.5 h-3.5 text-neutral-400" /></button>
            <button onClick={() => onDelete?.(customer.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
          </div>
        </div>
        {(customer.annualRevenue || 0) > 0 && (
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-neutral-500">年合作额: <strong className="text-neutral-900 dark:text-white">{curF(customer.annualRevenue)}</strong></span>
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => setShowProgress(!showProgress)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Activity className="w-3 h-3" />{showProgress ? '收起' : '跟进记录'} ({customer.progress?.length || 0})
          </button>
        </div>
        {showProgress && (
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            {(customer.progress || []).map((p: any, i: number) => (
              <div key={i} className="p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">{p.date}</span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">{p.desc}</p>
                {p.nextStep && <p className="text-[10px] text-blue-600 mt-0.5">下一步: {p.nextStep}</p>}
              </div>
            ))}
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <input className="w-full text-xs p-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 mb-1" placeholder="跟进内容" value={newProgress.desc} onChange={e => setNewProgress({...newProgress, desc: e.target.value})} />
              <input className="w-full text-xs p-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 mb-1" placeholder="下一步计划" value={newProgress.nextStep} onChange={e => setNewProgress({...newProgress, nextStep: e.target.value})} />
              <div className="flex items-center gap-2 mt-1">
                <input type="date" className="text-xs p-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800" value={newProgress.date} onChange={e => setNewProgress({...newProgress, date: e.target.value})} />
                <button onClick={() => { onAddProgress?.(customer.id, newProgress); setNewProgress({ date: new Date().toISOString().split('T')[0], desc: '', nextStep: '' }); }} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">添加</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AI Analysis */}
              <AIPanel
                title="AI 伙伴分析"
                buttonText="AI 智能分析"
                config={{ aiApiKey: config.aiApiKey as string, aiBaseUrl: config.aiBaseUrl as string, aiModel: config.aiModel as string }}
                prompt={`分析以下合作伙伴：名称${partner.name}，等级${partner.tier}，类型${partner.type}，行业${partner.industry || '未填'}，地区${partner.city || '未填'}，赢单率${partner.winRate || 0}%，合作年限${partner.years || 0}年。请给出：1)健康度评估 2)关键发现 3)行动建议`}
                context="你是 PartnerNexus 合作伙伴管理系统的 AI 分析专家。给出专业简洁的分析报告。"
              />

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  第一段：AI 决策层 - 合作突破口
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2"><Crosshair className="w-4 h-4 text-blue-600" />合作突破口</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {breakthroughs.map((b, i) => <Breakthrough key={i} {...b} />)}
                </div>
              </div>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  第二段：商机全景中心（列表形式）
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    商机全景
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => window.open(`/deals?partnerId=${partner.id}&partnerName=${encodeURIComponent(partner.name)}`, '_blank')} className="flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      新建商机
                    </Button>
                    <Badge variant={scores.pipelineHealth >= 60 ? 'success' : 'warning'} size="sm">健康度 {scores.pipelineHealth}%</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 顶部统计 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">本季度报备</p>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{cur(partner.pipeline.registered)}</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">本季度赢单</p>
                      <p className="text-lg font-semibold text-emerald-600">{cur(partner.pipeline.won || 0)}</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">转化率</p>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{partner.winRate || 0}%</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">进行中</p>
                      <p className="text-lg font-semibold text-blue-600">{partner.pipeline.commercial + partner.pipeline.solution}</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">本季度结单</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {partner.pipeline.won > 0 ? '赢' : '-'}
                      </p>
                    </div>
                  </div>

                  {/* 商机详情列表 */}
                  <div className="space-y-3">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                      </div>
                    ) : realDeals.length > 0 ? (
                      realDeals.map((project, idx) => (
                        <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors cursor-pointer" onClick={() => window.open(`/deals/${project.id}`, '_blank')}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{project.name}</p>
                                <ExternalLink className="w-4 h-4 text-neutral-400 shrink-0" />
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="default" size="sm">{project.stage}</Badge>
                                <Badge variant={project.status === '进行中' ? 'info' : project.stage === '赢单' ? 'success' : 'danger'} size="sm">
                                  {project.status}
                                </Badge>
                                {project.review && (
                                  <Badge variant={project.stage === '赢单' ? 'success' : 'warning'} size="sm" className="bg-amber-50 text-amber-600 border-amber-200">
                                    {project.review}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{project.customer}</span>
                                <span className="flex items-center gap-1"><User className="w-3 h-3" />{project.owner}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{project.closeDate}</span>
                              </div>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{cur(project.amount)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-neutral-500">暂无商机数据</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  第三段：营销与激励投产区（列表形式）
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：市场活动 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      市场活动
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                        </div>
                      ) : realActivities.length > 0 ? (
                        realActivities.map((activity, idx) => (
                          <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors cursor-pointer" onClick={() => openDetail('activity', activity)}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{activity.name}</p>
                                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                                  <Badge variant={activity.status === '进行中' ? 'info' : activity.status === '已完结' ? 'success' : 'default'} size="sm">
                                    {activity.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{activity.type}</span>
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{activity.startDate} ~ {activity.endDate}</span>
                                </div>
                                {activity.status === '进行中' && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${activity.progress}%` }}></div>
                                    </div>
                                    <span className="text-xs font-medium text-purple-600">{activity.progress}%</span>
                                  </div>
                                )}
                                {activity.status === '已完结' && (
                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="text-center p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded">
                                      <p className="text-sm font-semibold text-emerald-600">{activity.actualLeads}</p>
                                      <p className="text-[10px] text-emerald-500">线索数</p>
                                    </div>
                                    <div className="text-center p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded">
                                      <p className="text-sm font-semibold text-blue-600">{cur(activity.relatedDeals)}</p>
                                      <p className="text-[10px] text-blue-500">关联商机</p>
                                    </div>
                                    <div className="text-center p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded">
                                      <p className="text-sm font-semibold text-amber-600">{activity.roi}%</p>
                                      <p className="text-[10px] text-amber-500">ROI</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-4 shrink-0">
                                <p className="text-xs text-neutral-500">预算</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{cur(activity.budget)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-neutral-500">暂无市场活动数据</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 右侧：激励计划参与 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-amber-600" />
                      激励计划参与
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                        </div>
                      ) : (realIncentives.length > 0 ? (
                        realIncentives.map((plan, idx) => (
                          <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors cursor-pointer" onClick={() => openDetail('incentive', plan)}>
                            <div className="flex items-center gap-3">
                              <div className="relative w-14 h-14 shrink-0">
                                <svg className="w-full h-full -rotate-90">
                                  <circle cx="28" cy="28" r="25" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                                  <circle cx="28" cy="28" r="25" fill="none" stroke={plan.progress === 100 ? '#10b981' : plan.progress >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${plan.progress * 1.57} 157`} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-sm font-bold ${plan.progress === 100 ? 'text-emerald-600' : plan.progress >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{plan.progress}%</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{plan.name}</p>
                                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                                  <Badge variant={plan.status === '已完成' ? 'success' : plan.status === '进行中' ? 'info' : 'default'} size="sm">
                                    {plan.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">{plan.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  <span className="text-neutral-500">目标: <span className="font-medium text-neutral-700 dark:text-neutral-300">{cur(plan.target)}</span></span>
                                  <span className="text-neutral-500">已达成: <span className="font-medium text-blue-600">{cur(plan.current)}</span></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-neutral-500">暂无激励计划数据</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  第四段：待办跟进与动态（智能任务清单）
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      待办跟进
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={createNewTask} className="flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        新建待办
                      </Button>
                      <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                        {['全部', '进行中', '已完成', '已取消'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setTaskFilter(status)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              taskFilter === status
                                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.filter(t => taskFilter === '全部' || t.status === taskFilter).map((task, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors cursor-pointer" onClick={() => openDetail('task', task)}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id); }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            task.status === '已完成' ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-300 dark:border-neutral-600 hover:border-emerald-500'
                          }`}
                        >
                          {task.status === '已完成' && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.status === '已完成' ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <ProgressBar value={task.progress} size="sm" className="w-32" />
                            <span className="text-xs text-neutral-400">{task.progress}%</span>
                          </div>
                        </div>
                        <Badge variant={task.status === '已完成' ? 'success' : task.status === '进行中' ? 'info' : task.status === '已取消' ? 'danger' : 'warning'} size="sm">
                          {task.status}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 详情弹窗 */}
              <AnimatePresence>
                {detailModal.type && detailModal.data && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={closeDetail}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {detailModal.type === 'deal' && (
                        <Card className="w-full max-w-lg">
                          <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                商机详情
                              </CardTitle>
                              <button onClick={closeDetail} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{detailModal.data.name}</h3>
                                <p className="text-sm text-neutral-500 mt-1">{detailModal.data.description}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">客户</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.customer}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">负责人</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.owner}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">金额</p>
                                <p className="text-sm font-semibold text-blue-600">{cur(detailModal.data.amount)}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">预计结单</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.closeDate}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">阶段</p>
                                <Badge variant="default" size="sm">{detailModal.data.stage}</Badge>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">状态</p>
                                <Badge variant={detailModal.data.status === '进行中' ? 'info' : detailModal.data.stage === '赢单' ? 'success' : 'danger'} size="sm">
                                  {detailModal.data.status}
                                </Badge>
                              </div>
                            </div>
                            {detailModal.data.review && (
                              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">复盘标签</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{detailModal.data.review}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <Button variant="primary" size="sm" className="flex-1">编辑商机</Button>
                              <Button variant="outline" size="sm" className="flex-1">查看历史</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {detailModal.type === 'activity' && (
                        <Card className="w-full max-w-lg">
                          <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                市场活动详情
                              </CardTitle>
                              <button onClick={closeDetail} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{detailModal.data.name}</h3>
                              <p className="text-sm text-neutral-500 mt-1">{detailModal.data.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">活动类型</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.type}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">活动地点</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.location}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">开始日期</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.startDate}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">结束日期</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.endDate}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">预算</p>
                                <p className="text-sm font-semibold text-blue-600">{cur(detailModal.data.budget)}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">状态</p>
                                <Badge variant={detailModal.data.status === '进行中' ? 'info' : detailModal.data.status === '已完结' ? 'success' : 'default'} size="sm">
                                  {detailModal.data.status}
                                </Badge>
                              </div>
                            </div>
                            {detailModal.data.status === '进行中' && (
                              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">执行进度</p>
                                  <p className="text-sm font-bold text-purple-600">{detailModal.data.progress}%</p>
                                </div>
                                <div className="h-3 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${detailModal.data.progress}%` }}></div>
                                </div>
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">预计产出线索: {detailModal.data.expectedLeads}个</p>
                              </div>
                            )}
                            {detailModal.data.status === '已完结' && (
                              <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-center">
                                  <p className="text-xl font-bold text-emerald-600">{detailModal.data.actualLeads}</p>
                                  <p className="text-xs text-emerald-500">实际线索</p>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
                                  <p className="text-xl font-bold text-blue-600">{cur(detailModal.data.relatedDeals)}</p>
                                  <p className="text-xs text-blue-500">关联商机</p>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-center">
                                  <p className="text-xl font-bold text-amber-600">{detailModal.data.roi}%</p>
                                  <p className="text-xs text-amber-500">ROI</p>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <Button variant="primary" size="sm" className="flex-1">编辑活动</Button>
                              <Button variant="outline" size="sm" className="flex-1">查看报告</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {detailModal.type === 'incentive' && (
                        <Card className="w-full max-w-lg">
                          <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Gift className="w-5 h-5 text-amber-600" />
                                激励计划详情
                              </CardTitle>
                              <button onClick={closeDetail} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{detailModal.data.name}</h3>
                              <p className="text-sm text-neutral-500 mt-1">{detailModal.data.description}</p>
                            </div>
                            <div className="flex items-center justify-center py-4">
                              <div className="relative w-32 h-32">
                                <svg className="w-full h-full -rotate-90">
                                  <circle cx="64" cy="64" r="58" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                  <circle cx="64" cy="64" r="58" fill="none" stroke={detailModal.data.progress === 100 ? '#10b981' : detailModal.data.progress >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${detailModal.data.progress * 3.65} 365`} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-3xl font-bold ${detailModal.data.progress === 100 ? 'text-emerald-600' : detailModal.data.progress >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{detailModal.data.progress}%</span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">目标金额</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{cur(detailModal.data.target)}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">已达成</p>
                                <p className="text-sm font-semibold text-blue-600">{cur(detailModal.data.current)}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">当前档位</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.tier || detailModal.data.currentTier || '暂无'}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">状态</p>
                                <Badge variant={detailModal.data.status === '已完成' ? 'success' : detailModal.data.status === '进行中' ? 'info' : 'default'} size="sm">
                                  {detailModal.data.status}
                                </Badge>
                              </div>
                            </div>
                            {detailModal.data.nextTier && (
                              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">解锁下一档位</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">再完成 {cur(detailModal.data.nextTier)} 即可解锁</p>
                                {detailModal.data.nextTierReward && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400">预计奖励: {cur(detailModal.data.nextTierReward)}</p>
                                )}
                              </div>
                            )}
                            {detailModal.data.reward && (
                              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">已获得奖励</p>
                                <p className="text-lg font-bold text-emerald-600 mt-1">{cur(detailModal.data.reward)}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <Button variant="primary" size="sm" className="flex-1">查看规则</Button>
                              <Button variant="outline" size="sm" className="flex-1">联系经理</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {detailModal.type === 'task' && (
                        <Card className="w-full max-w-lg">
                          <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                待办任务详情
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <button onClick={closeDetail} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* 任务标题和状态 */}
                            <div>
                              <input
                                type="text"
                                value={detailModal.data.title}
                                onChange={(e) => updateTaskDetail(detailModal.data.id, 'title', e.target.value)}
                                className="w-full text-lg font-semibold text-neutral-900 dark:text-white bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={detailModal.data.status === '已完成' ? 'success' : detailModal.data.status === '进行中' ? 'info' : detailModal.data.status === '已取消' ? 'danger' : 'warning'} size="sm">
                                  {detailModal.data.status}
                                </Badge>
                                <Badge variant={detailModal.data.priority === '高' ? 'danger' : detailModal.data.priority === '中' ? 'warning' : 'info'} size="sm">
                                  {detailModal.data.priority === '高' ? '高优先级' : detailModal.data.priority === '中' ? '中优先级' : '低优先级'}
                                </Badge>
                              </div>
                            </div>

                            {/* 任务目标 */}
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-amber-600" />
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">任务目标</p>
                              </div>
                              <textarea
                                value={detailModal.data.goal || ''}
                                onChange={(e) => updateTaskDetail(detailModal.data.id, 'goal', e.target.value)}
                                className="w-full text-sm text-neutral-700 dark:text-neutral-300 bg-transparent resize-none focus:outline-none"
                                rows={2}
                                placeholder="输入任务目标..."
                              />
                            </div>

                            {/* 任务详情 */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">负责人</p>
                                <input
                                  type="text"
                                  value={detailModal.data.assignee}
                                  onChange={(e) => updateTaskDetail(detailModal.data.id, 'assignee', e.target.value)}
                                  className="w-full text-sm font-medium text-neutral-900 dark:text-white bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors mt-1"
                                />
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">截止日期</p>
                                <input
                                  type="date"
                                  value={detailModal.data.dueDate}
                                  onChange={(e) => updateTaskDetail(detailModal.data.id, 'dueDate', e.target.value)}
                                  className="w-full text-sm font-medium text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-700 rounded border-none px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">关联商机</p>
                                <input
                                  type="text"
                                  value={detailModal.data.relatedDeal}
                                  onChange={(e) => updateTaskDetail(detailModal.data.id, 'relatedDeal', e.target.value)}
                                  className="w-full text-sm font-medium text-blue-600 bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors mt-1"
                                />
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">优先级</p>
                                <select
                                  value={detailModal.data.priority}
                                  onChange={(e) => updateTaskDetail(detailModal.data.id, 'priority', e.target.value)}
                                  className="w-full text-sm font-medium bg-neutral-100 dark:bg-neutral-700 rounded border-none px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="高">高</option>
                                  <option value="中">中</option>
                                  <option value="低">低</option>
                                </select>
                              </div>
                            </div>

                            {/* 任务描述 */}
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                              <p className="text-xs font-medium text-neutral-500 mb-2">任务描述</p>
                              <textarea
                                value={detailModal.data.description}
                                onChange={(e) => updateTaskDetail(detailModal.data.id, 'description', e.target.value)}
                                className="w-full text-sm text-neutral-700 dark:text-neutral-300 bg-transparent resize-none focus:outline-none"
                                rows={3}
                                placeholder="输入任务描述..."
                              />
                            </div>

                            {/* 子任务管理 */}
                            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                                <div className="flex items-center gap-2">
                                  <ListTodo className="w-4 h-4 text-purple-600" />
                                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">子任务拆分</p>
                                </div>
                                <span className="text-xs text-neutral-500">{detailModal.data.subtasks?.filter(st => st.status === '已完成').length || 0}/{detailModal.data.subtasks?.length || 0}</span>
                              </div>
                              <div className="p-3 space-y-2">
                                {detailModal.data.subtasks && detailModal.data.subtasks.length > 0 ? (
                                  detailModal.data.subtasks.map((subtask, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-100 dark:bg-neutral-750 rounded-lg group">
                                      <button
                                        onClick={() => updateSubtaskStatus(detailModal.data.id, subtask.id, subtask.status === '已完成' ? '待跟进' : '已完成')}
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                          subtask.status === '已完成' 
                                            ? 'bg-green-500 border-green-500' 
                                            : 'border-neutral-300 dark:border-neutral-600 hover:border-green-500'
                                        }`}
                                      >
                                        {subtask.status === '已完成' && <Check className="w-3 h-3 text-white" />}
                                      </button>
                                      <input
                                        type="text"
                                        value={subtask.title}
                                        onChange={(e) => {
                                          setTasks(tasks.map(t => {
                                            if (t.id === detailModal.data.id) {
                                              return {
                                                ...t,
                                                subtasks: t.subtasks.map(st =>
                                                  st.id === subtask.id ? { ...st, title: e.target.value } : st
                                                )
                                              };
                                            }
                                            return t;
                                          }));
                                        }}
                                        className={`flex-1 text-sm bg-transparent border-none focus:outline-none ${
                                          subtask.status === '已完成' ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'
                                        }`}
                                      />
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Badge variant={subtask.status === '已完成' ? 'success' : subtask.status === '进行中' ? 'info' : 'warning'} size="sm">
                                          {subtask.status}
                                        </Badge>
                                        <button
                                          onClick={() => deleteSubtask(detailModal.data.id, subtask.id)}
                                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                                        >
                                          <Trash2 className="w-3 h-3 text-neutral-400" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-neutral-500 text-center py-4">暂无子任务，点击下方按钮添加</p>
                                )}
                                <div className="flex items-center gap-2 pt-2">
                                  <input
                                    type="text"
                                    placeholder="添加子任务..."
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        addSubtask(detailModal.data.id, e.currentTarget.value);
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                    className="flex-1 text-sm bg-neutral-200 dark:bg-neutral-700 rounded px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const input = document.querySelector('input[placeholder="添加子任务..."]') as HTMLInputElement;
                                      if (input) {
                                        addSubtask(detailModal.data.id, input.value);
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* 任务进度 */}
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">任务进度</p>
                                <p className="text-sm font-bold text-blue-600">{detailModal.data.progress}%</p>
                              </div>
                              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${detailModal.data.progress}%` }}></div>
                              </div>
                            </div>

                            {/* 状态切换按钮 */}
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                variant={detailModal.data.status === '待跟进' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => updateTaskStatus(detailModal.data.id, '待跟进')}
                              >
                                待跟进
                              </Button>
                              <Button
                                variant={detailModal.data.status === '进行中' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => updateTaskStatus(detailModal.data.id, '进行中')}
                              >
                                进行中
                              </Button>
                              <Button
                                variant={detailModal.data.status === '已完成' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => updateTaskStatus(detailModal.data.id, '已完成')}
                              >
                                已完成
                              </Button>
                              <Button
                                variant={detailModal.data.status === '已取消' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => updateTaskStatus(detailModal.data.id, '已取消')}
                              >
                                已取消
                              </Button>
                            </div>
                            <div className="flex gap-2 pt-4">
                              <Button variant="danger" size="sm" className="flex-1" onClick={() => toggleTaskComplete(detailModal.data.id)}>
                                {detailModal.data.status === '已完成' ? '撤销完成' : '标记完成'}
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1">删除任务</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 2: 活跃度分析
              ══════════════════════════════════════════════ */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* Activity Score + Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader><CardTitle>活跃度综合评分</CardTitle></CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <Gauge score={scores.activity} label="综合活跃度" />
                    <div className="w-full mt-4 space-y-2">
                      {[
                        { label: '交易活跃', score: partner.pipeline.registered > 0 ? 85 : 20, icon: ShoppingCart, detail: '是否有在跟Pipeline' },
                        { label: '赋能活跃', score: partner.enablement.certifiedEngineers > 5 ? 80 : partner.enablement.certifiedEngineers * 15, icon: Award, detail: '认证人员数量' },
                        { label: '营销活跃', score: partner.mdf.used > 0 ? 75 : 10, icon: Target, detail: 'MDF基金使用情况' },
                        { label: '协作活跃', score: (ecosystemPartners || []).length > 2 ? 82 : (ecosystemPartners || []).length * 25, icon: Users, detail: '生态协作关系数' },
                      ].map((d) => (
                        <div key={d.label} className="flex items-center gap-3">
                          <d.icon className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 w-16">{d.label}</span>
                          <ProgressBar value={d.score} size="sm" className="flex-1" />
                          <span className="text-xs font-semibold w-8 text-right">{d.score}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>活跃趋势与行为分析</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {(() => {
                          const dealStatus = partner.pipeline.registered > 0 ? 'active' : 'warning';
                          const dealValue = partner.pipeline.registered > 0 ? '2天前' : '30天前';
                          const dealDetail = partner.pipeline.registered > 0 ? `${keyCustomers[0]?.name || '客户'}进入商务阶段` : '暂无交易进展';
                          
                          const reportStatus = partner.pipeline.commercial > 0 ? 'active' : 'warning';
                          const reportValue = partner.pipeline.commercial > 0 ? '5天前' : '45天前';
                          const reportDetail = partner.pipeline.commercial > 0 ? `新商机: ${partner.industry || '行业'}云平台项目` : '暂无新商机报备';
                          
                          const trainingStatus = partner.enablement.expiryRiskCount > 0 ? 'warning' : 'active';
                          const trainingValue = partner.enablement.expiryRiskCount > 0 ? '1周前' : '2周前';
                          const trainingDetail = partner.enablement.expiryRiskCount > 0 
                            ? `${partner.enablement.expiryRiskCount}人认证即将过期需续期` 
                            : `${partner.enablement.certifiedEngineers}人认证有效`;
                          
                          return [
                            { label: '最近交易', value: dealValue, status: dealStatus, detail: dealDetail },
                            { label: '最近报备', value: reportValue, status: reportStatus, detail: reportDetail },
                            { label: '最近培训', value: trainingValue, status: trainingStatus, detail: trainingDetail },
                          ];
                        })().map((r) => (
                          <div key={r.label} className={cn('p-3 rounded-lg border', r.status === 'active' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30' : 'border-amber-200 dark:border-amber-800 bg-amber-50/30')}>
                            <p className="text-xs text-neutral-500">{r.label}</p>
                            <p className="text-lg font-semibold text-neutral-900 dark:text-white">{r.value}</p>
                            <p className="text-[10px] text-neutral-400 mt-1">{r.detail}</p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">活跃度诊断</p>
                        <div className="space-y-2 text-sm">
                          {partner.pipeline.registered > 0 ? (
                            <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">交易活跃度健康——近30天有交易进展，高于同级伙伴均值</span></div>
                          ) : (
                            <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">交易活跃度偏低——近期无交易进展，建议主动触达了解情况</span></div>
                          )}
                          {ecosystemPartners.length > 2 ? (
                            <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">协作活跃度优秀——{ecosystemPartners.length}个活跃生态协作关系，网络效应显著</span></div>
                          ) : (
                            <div className="flex items-start gap-2"><Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">协作活跃度一般——{ecosystemPartners.length}个生态协作关系，建议拓展合作网络</span></div>
                          )}
                          {partner.enablement.expiryRiskCount > 0 ? (
                            <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">赋能活跃度存在风险——{partner.enablement.expiryRiskCount}人认证即将过期，可能影响下季度报备优先级</span></div>
                          ) : (
                            <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">赋能活跃度健康——{partner.enablement.certifiedEngineers}人认证有效，能力储备充足</span></div>
                          )}
                          {mdfPct > 50 ? (
                            <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">营销活跃度良好——MDF使用率{mdfPct}%，联合营销投入充足</span></div>
                          ) : mdfPct > 20 ? (
                            <div className="flex items-start gap-2"><Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">营销活跃度可提升——MDF使用率{mdfPct}%，建议加大联合营销投入</span></div>
                          ) : (
                            <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">营销活跃度不足——MDF使用率{mdfPct}%，建议制定营销计划</span></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 3: 绩效评估
              ══════════════════════════════════════════════ */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: '综合评分', score: scores.overall, max: 100, benchmark: scores.tierBenchmark },
                  { label: '活跃度', score: scores.activity, max: 100, benchmark: 65 },
                  { label: '能力值', score: scores.capability, max: 100, benchmark: 70 },
                  { label: '忠诚度', score: scores.loyalty, max: 100, benchmark: 55 },
                  { label: 'Pipeline', score: scores.pipelineHealth, max: 100, benchmark: 60 },
                  { label: '增长力', score: Math.max(0, scores.growth), max: 50, benchmark: 25 },
                ].map((m) => (
                  <Card key={m.label}>
                    <div className="text-center">
                      <Gauge score={m.score} label={m.label} max={m.max} />
                      <div className="mt-2 flex items-center justify-center gap-1 text-[10px]">
                        <span className="text-neutral-400">同级均值</span>
                        <span className={cn('font-semibold', m.score >= m.benchmark ? 'text-emerald-600' : 'text-amber-600')}>{m.benchmark}</span>
                        <span className={m.score >= m.benchmark ? 'text-emerald-500' : 'text-amber-500'}>{m.score >= m.benchmark ? '↑' : '↓'}{Math.abs(m.score - m.benchmark)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader><CardTitle>多维评估矩阵</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">评估维度</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">得分</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">同级均值</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">排名</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">趋势</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">评价</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {[
                          { dim: '营收贡献', score: 88, benchmark: 72, rank: 'Top 15%', trend: 12, note: '远超同级均值，是区域营收核心引擎' },
                          { dim: '商机转化', score: 68, benchmark: 70, rank: 'Top 45%', trend: -3, note: '方案→商务环节存在瓶颈，需优化' },
                          { dim: '客户满意度', score: 92, benchmark: 78, rank: 'Top 8%', trend: 5, note: '客户续约率95%，NPS得分行业领先' },
                          { dim: '技术能力', score: 75, benchmark: 68, rank: 'Top 30%', trend: 8, note: '认证覆盖率高，但AI新赛道不足' },
                          { dim: '生态贡献', score: 85, benchmark: 55, rank: 'Top 10%', trend: 15, note: '网络枢纽价值突出，协作产出高' },
                          { dim: '创新投入', score: 60, benchmark: 45, rank: 'Top 35%', trend: 10, note: '参与联合产品定义，创新意愿强' },
                        ].map((r, i) => (
                          <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">{r.dim}</td>
                            <td className="py-3 px-4 text-center"><span className={cn('font-semibold', r.score >= 80 ? 'text-emerald-600' : r.score >= 60 ? 'text-amber-600' : 'text-red-500')}>{r.score}</span></td>
                            <td className="py-3 px-4 text-center text-neutral-400">{r.benchmark}</td>
                            <td className="py-3 px-4 text-center"><Badge variant={r.rank.includes('Top 2') ? 'success' : r.rank.includes('Top 5') ? 'info' : 'default'} size="sm">{r.rank}</Badge></td>
                            <td className="py-3 px-4 text-center"><span className={cn('text-xs font-semibold', r.trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>{r.trend >= 0 ? '↑' : '↓'}{Math.abs(r.trend)}%</span></td>
                            <td className="py-3 px-4 text-xs text-neutral-500">{r.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 4: 意愿度 (Willingness)
              ══════════════════════════════════════════════ */}
          {activeTab === 'willingness' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>意愿度评估</CardTitle><Badge variant="info" size="sm">Mindshare 心智份额</Badge></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl">
                        <div>
                          <p className="text-sm text-neutral-500">综合意愿度得分</p>
                          <p className="text-3xl font-bold text-blue-600 mt-1">82</p>
                        </div>
                        <div className="w-20 h-20">
                          <svg viewBox="0 0 80 80" className="w-full h-full">
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#e4e4e7" strokeWidth="8"/>
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray={`${82 * 1.88} 188`} strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">资源投入意愿</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{width: '90%'}}></div>
                            </div>
                            <span className="text-sm font-semibold text-emerald-600">90%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">资金投入意愿</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{width: '65%'}}></div>
                            </div>
                            <span className="text-sm font-semibold text-amber-600">65%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">响应速度</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{width: '85%'}}></div>
                            </div>
                            <span className="text-sm font-semibold text-emerald-600">85%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">目标承诺度</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{width: '78%'}}></div>
                            </div>
                            <span className="text-sm font-semibold text-blue-600">78%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">培训参与度</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{width: '92%'}}></div>
                            </div>
                            <span className="text-sm font-semibold text-purple-600">92%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-neutral-900 mb-2">评估解读</h4>
                          <p className="text-sm text-neutral-600 leading-relaxed">该伙伴意愿度较高，表现出强烈的合作积极性。特别在培训参与和资源投入方面表现突出，显示出对厂商产品的高度认可。建议重点培养，可考虑纳入核心合作伙伴计划。</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">近期表现趋势</CardTitle></CardHeader>
                        <CardContent>
                          <div className="flex items-end justify-between h-24 gap-2">
                            {[65, 72, 68, 78, 82, 79].map((val, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t" style={{height: `${val * 0.8}px`, backgroundColor: val >= 75 ? '#2563eb' : '#cbd5e1'}}></div>
                                <span className="text-[10px] text-neutral-400">{['1月','2月','3月','4月','5月','6月'][i]}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">提升建议</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">建议在QBR中引导设定更高的业绩目标，提升承诺水平</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">资金投入意愿有提升空间，可探讨更多联合营销机会</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 5: 能力度 (Capability)
              ══════════════════════════════════════════════ */}
          {activeTab === 'capability' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>能力度评估</CardTitle><Badge variant="success" size="sm">硬实力</Badge></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-xl">
                        <div>
                          <p className="text-sm text-neutral-500">综合能力得分</p>
                          <p className="text-3xl font-bold text-emerald-600 mt-1">76</p>
                        </div>
                        <div className="w-20 h-20">
                          <svg viewBox="0 0 80 80" className="w-full h-full">
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#e4e4e7" strokeWidth="8"/>
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#059669" strokeWidth="8" strokeDasharray={`${76 * 1.88} 188`} strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-neutral-900 dark:text-white">12</p>
                          <p className="text-xs text-neutral-500 mt-1">认证工程师</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-emerald-600">94%</p>
                          <p className="text-xs text-neutral-500 mt-1">实施成功率</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-blue-600">68%</p>
                          <p className="text-xs text-neutral-500 mt-1">赢单率</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-purple-600">95%</p>
                          <p className="text-xs text-neutral-500 mt-1">客户续约率</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">销售能力</span>
                          <span className="text-sm font-semibold text-blue-600">72%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">技术能力</span>
                          <span className="text-sm font-semibold text-emerald-600">85%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">交付服务能力</span>
                          <span className="text-sm font-semibold text-purple-600">92%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">市场拓展能力</span>
                          <span className="text-sm font-semibold text-amber-600">65%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-neutral-900 mb-2">评估解读</h4>
                          <p className="text-sm text-neutral-600 leading-relaxed">该伙伴技术能力和交付服务能力突出，拥有12名认证工程师，实施成功率达94%。销售能力有提升空间，建议加强销售培训和商机跟进技巧。</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">能力雷达图</CardTitle></CardHeader>
                        <CardContent>
                          <div className="flex justify-center">
                            <div className="w-48 h-48 relative">
                              <svg viewBox="0 0 100 100" className="w-full h-full">
                                {[0.3, 0.5, 0.7, 0.9].map((scale, si) => (
                                  <polygon key={si} points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="#e4e4e7" strokeWidth="0.5" transform={`scale(${scale})`} style={{ transformOrigin: "50% 50%" }}/>
                                ))}
                                {[0, 60, 120, 180, 240, 300].map((angle, ai) => {
                                  const rad = (angle * Math.PI) / 180;
                                  return <line key={ai} x1="50" y1="50" x2={50 + 40 * Math.cos(rad)} y2={50 + 40 * Math.sin(rad)} stroke="#e4e4e7" strokeWidth="0.5"/>;
                                })}
                                {['销售','技术','交付','市场','客服','创新'].map((label, li) => {
                                  const rad = ((li * 60 - 90) * Math.PI) / 180;
                                  const x = 50 + 48 * Math.cos(rad);
                                  const y = 50 + 48 * Math.sin(rad);
                                  return <text key={li} x={x} y={y} textAnchor="middle" fontSize="8" fill="#6b7280">{label}</text>;
                                })}
                                <polygon points="50,15 77,28 82,55 70,82 30,82 25,55 38,28" fill="rgba(5,150,105,0.15)" stroke="#059669" strokeWidth="1.5"/>
                                {[70,85,92,65,88,75].map((val, vi) => {
                                  const rad = ((vi * 60 - 90) * Math.PI) / 180;
                                  const x = 50 + (val / 100) * 40 * Math.cos(rad);
                                  const y = 50 + (val / 100) * 40 * Math.sin(rad);
                                  return <circle key={vi} cx={x} cy={y} r="2" fill="#059669"/>;
                                })}
                              </svg>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">能力短板</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">市场拓展能力较弱，建议增加市场活动策划培训</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">技术能力突出，可考虑认证为技术服务合作伙伴</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 6: 业务契合度 (Business Fit)
              ══════════════════════════════════════════════ */}
          {activeTab === 'businessFit' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>业务契合度评估</CardTitle><Badge variant="warning" size="sm">战略匹配</Badge></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl">
                        <div>
                          <p className="text-sm text-neutral-500">综合契合度得分</p>
                          <p className="text-3xl font-bold text-purple-600 mt-1">88</p>
                        </div>
                        <div className="w-20 h-20">
                          <svg viewBox="0 0 80 80" className="w-full h-full">
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#e4e4e7" strokeWidth="8"/>
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#7c3aed" strokeWidth="8" strokeDasharray={`${88 * 1.88} 188`} strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-emerald-600">92%</p>
                          <p className="text-xs text-neutral-500 mt-1">客群重合度</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-blue-600">85%</p>
                          <p className="text-xs text-neutral-500 mt-1">产品互补度</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-purple-600">88%</p>
                          <p className="text-xs text-neutral-500 mt-1">模式相似度</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-amber-600">78%</p>
                          <p className="text-xs text-neutral-500 mt-1">地域覆盖匹配</p>
                        </div>
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">客群画像分析</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-600">Enterprise级客户占比</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{width: '92%'}}></div>
                              </div>
                              <span className="text-sm font-semibold">92%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-600">政务行业客户占比</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{width: '75%'}}></div>
                              </div>
                              <span className="text-sm font-semibold">75%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-600">金融行业客户占比</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{width: '88%'}}></div>
                              </div>
                              <span className="text-sm font-semibold">88%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-neutral-900 mb-2">评估解读</h4>
                          <p className="text-sm text-neutral-600 leading-relaxed">该伙伴与厂商业务高度契合，客群画像重合度达92%，产品组合互补性强。双方商业模式相似，均以订阅制SaaS为主，合作协同效应显著。</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">产品组合分析</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-emerald-50/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-sm">安全软件代理</span>
                              </div>
                              <span className="text-xs font-semibold text-emerald-600">互补品</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-emerald-50/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-sm">云服务集成</span>
                              </div>
                              <span className="text-xs font-semibold text-emerald-600">互补品</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="text-sm">咨询服务</span>
                              </div>
                              <span className="text-xs font-semibold text-blue-600">中性</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="text-sm">竞品A代理</span>
                              </div>
                              <span className="text-xs font-semibold text-red-600">竞品</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">合作建议</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">高度契合，建议深化战略合作，拓展联合解决方案</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">存在竞品代理，需关注合作深度和排他性</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 7: 符合度 (Compliance)
              ══════════════════════════════════════════════ */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>符合度评估</CardTitle><Badge variant="danger" size="sm">合规与底线</Badge></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-xl">
                        <div>
                          <p className="text-sm text-neutral-500">综合符合度得分</p>
                          <p className="text-3xl font-bold text-amber-600 mt-1">95</p>
                        </div>
                        <div className="w-20 h-20">
                          <svg viewBox="0 0 80 80" className="w-full h-full">
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#e4e4e7" strokeWidth="8"/>
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#d97706" strokeWidth="8" strokeDasharray={`${95 * 1.88} 188`} strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      <Card className="bg-emerald-50/30 border-emerald-200">
                        <CardContent className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600"/>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">资质审核通过</p>
                            <p className="text-xs text-neutral-500">公司资质齐全，无违规记录</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">资质合规</span>
                          <span className="text-sm font-semibold text-emerald-600">100%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">规则遵守</span>
                          <span className="text-sm font-semibold text-emerald-600">98%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">业绩达标率</span>
                          <span className="text-sm font-semibold text-blue-600">88%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">投诉率</span>
                          <span className="text-sm font-semibold text-emerald-600">0%</span>
                        </div>
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">资质信息</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">注册资本</span>
                            <span className="font-medium">500万元</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">成立年限</span>
                            <span className="font-medium">8年</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">信用等级</span>
                            <span className="font-medium text-emerald-600">A级</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">黑名单状态</span>
                            <span className="font-medium text-emerald-600">无记录</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-neutral-900 mb-2">评估解读</h4>
                          <p className="text-sm text-neutral-600 leading-relaxed">该伙伴合规表现优秀，资质齐全，无违规记录。业绩达标率88%，接近金牌伙伴门槛。建议在QBR中讨论提升业绩目标，冲击更高等级。</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">违规记录</CardTitle></CardHeader>
                        <CardContent className="text-center py-8">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3"/>
                          <p className="text-sm font-medium text-neutral-900">暂无违规记录</p>
                          <p className="text-xs text-neutral-500 mt-1">合作期间表现良好</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">等级达标情况</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-neutral-500">当前等级</span>
                                <span className="font-medium text-amber-600">金牌</span>
                              </div>
                              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{width: '88%'}}></div>
                              </div>
                              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                                <span>当前: 88%</span>
                                <span>目标: 100%</span>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500">距离白金等级还差 ¥200万 业绩</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">合规建议</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">合规表现优秀，继续保持</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">业绩达标率接近门槛，建议制定提升计划</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 8: 合作机会
              ══════════════════════════════════════════════ */}
          {activeTab === 'opportunity' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>合作突破口识别</CardTitle><Badge variant="info" size="sm">AI 推荐</Badge></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {breakthroughs.map((b, i) => <Breakthrough key={i} {...b} />)}
                  </div>
                </CardContent>
              </Card>

              {/* ── 能力画像总览 ─────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle>能力画像</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">技术域 × 行业覆盖</span>
                    <div className="relative group/ml">
                      <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 cursor-help inline-flex">?</span>
                      <div className="absolute right-0 top-5 w-64 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/ml:opacity-100 group-hover/ml:visible transition-all text-[10px] text-neutral-500 leading-relaxed">
                        能力画像从两个维度评估：<b>技术成熟度</b>（传统/云/AI/安全/数据/服务 6域）和<b>行业覆盖度</b>（医疗/政务/金融/制造/教育）。圆的填充比例=该领域的自主交付能力。
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Hexagonal Capability Map */}
                    <div className="lg:col-span-2 flex items-center justify-center">
                      <div className="relative w-64 h-64">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          {/* Background hexagon grid */}
                          {[0.3, 0.55, 0.8].map((scale, si) => (
                            <polygon key={si} points="100,15 180,55 180,125 100,165 20,125 20,55"
                              fill="none" stroke="#e4e4e7" strokeWidth="0.5"
                              transform={`scale(${scale})`} transform-origin="100 90" />
                          ))}
                          {/* Axes */}
                          {[0, 60, 120, 180, 240, 300].map((angle, ai) => {
                            const rad = (angle * Math.PI) / 180;
                            return <line key={ai} x1="100" y1="90" x2={100 + 75 * Math.cos(rad)} y2={90 + 75 * Math.sin(rad)} stroke="#e4e4e7" strokeWidth="0.5" />;
                          })}
                          {/* Capability shape */}
                          {[
                            { name: '传统IT', value: 85, angle: 300, color: '#52525b' },
                            { name: '云原生', value: 90, angle: 0, color: '#2563eb' },
                            { name: 'AI/ML', value: 25, angle: 60, color: '#dc2626' },
                            { name: '安全', value: 45, angle: 120, color: '#d97706' },
                            { name: '数据', value: 80, angle: 180, color: '#059669' },
                            { name: '服务', value: 70, angle: 240, color: '#7c3aed' },
                          ].map((cap) => {
                            const rad = (cap.angle * Math.PI) / 180;
                            const points = [
                              { name: '传统IT', value: 85, angle: 300 },
                              { name: '云原生', value: 90, angle: 0 },
                              { name: 'AI/ML', value: 25, angle: 60 },
                              { name: '安全', value: 45, angle: 120 },
                              { name: '数据', value: 80, angle: 180 },
                              { name: '服务', value: 70, angle: 240 },
                            ].map((p) => {
                              const r = (p.angle * Math.PI) / 180;
                              const dist = 15 + (p.value / 100) * 65;
                              return `${100 + dist * Math.cos(r)},${90 + dist * Math.sin(r)}`;
                            }).join(' ');
                            return <polygon key={cap.name} points={points} fill="rgba(37,99,235,0.08)" stroke="#2563eb" strokeWidth="1.5" />;
                          })}
                          {/* Data points + labels */}
                          {[
                            { name: '传统IT', value: 85, angle: 300, color: '#52525b' },
                            { name: '云原生', value: 90, angle: 0, color: '#2563eb' },
                            { name: 'AI/ML', value: 25, angle: 60, color: '#dc2626' },
                            { name: '安全', value: 45, angle: 120, color: '#d97706' },
                            { name: '数据', value: 80, angle: 180, color: '#059669' },
                            { name: '服务', value: 70, angle: 240, color: '#7c3aed' },
                          ].map((cap) => {
                            const rad = (cap.angle * Math.PI) / 180;
                            const dist = 15 + (cap.value / 100) * 65;
                            const cx = 100 + dist * Math.cos(rad);
                            const cy = 90 + dist * Math.sin(rad);
                            const lx = 100 + 80 * Math.cos(rad);
                            const ly = 90 + 80 * Math.sin(rad);
                            const capFill = cap.value >= 70 ? '#059669' : cap.value >= 40 ? '#d97706' : '#dc2626';
                            return (
                              <g key={cap.name}>
                                <circle cx={cx} cy={cy} r="4" fill={capFill} stroke="white" strokeWidth="2" />
                                <text x={lx} y={ly} textAnchor="middle" fontSize="9" fontWeight={600} fill="#888" dy={cap.angle === 0 ? -6 : cap.angle === 180 ? 14 : 4}>
                                  {cap.name}
                                </text>
                                <text x={lx} y={ly} textAnchor="middle" fontSize="8" fill={capFill} dy={cap.angle === 0 ? 6 : cap.angle === 180 ? 24 : 14}>
                                  {cap.value}%
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>

                    {/* Right: Industry × Capability Matrix + Detail */}
                    <div className="lg:col-span-3 space-y-4">
                      <div>
                        <p className="text-xs font-medium text-neutral-500 mb-2">行业 × 技术能力覆盖矩阵</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                <th className="text-left py-2 px-2 font-medium text-neutral-400">行业</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">传统IT</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">云原生</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">AI/ML</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">安全</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">数据</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">服务</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">覆盖度</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const industryCoverage: Record<string, {cells: number[], coverage: number}> = {
                                  '医疗': { cells: [1,1,0.3,0.5,1,1], coverage: 75 },
                                  '政务': { cells: [1,1,0.2,0.3,1,0.5], coverage: 60 },
                                  '金融': { cells: [0.8,0.7,0.2,0.8,0.7,0.6], coverage: 65 },
                                  '制造': { cells: [0.9,0.6,0.3,0.5,0.6,0.4], coverage: 55 },
                                  '教育': { cells: [0.7,0.5,0.2,0.4,0.5,0.3], coverage: 43 },
                                  '零售': { cells: [0.6,0.8,0.4,0.6,0.7,0.5], coverage: 60 },
                                };
                                const baseIndustries = ['医疗', '政务', '金融', '制造', '教育'];
                                return baseIndustries.map(industry => {
                                  const data = industryCoverage[industry] || { cells: [0.5,0.5,0.2,0.4,0.5,0.4], coverage: 43 };
                                  // 如果是合作伙伴所在行业，适当提升覆盖度
                                  if (industry === partner.industry) {
                                    return { 
                                      industry, 
                                      cells: data.cells.map(c => Math.min(1, c + 0.2)), 
                                      coverage: Math.min(100, data.coverage + 15) 
                                    };
                                  }
                                  return { industry, ...data };
                                });
                              })().map((row, ri) => (
                                <tr key={ri} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                  <td className="py-2.5 px-2 font-medium text-neutral-700 dark:text-neutral-300">{row.industry}</td>
                                  {row.cells.map((v, ci) => (
                                    <td key={ci} className="py-2.5 px-2 text-center">
                                      <div className={cn('w-5 h-5 rounded mx-auto', v === 1 ? 'bg-emerald-500' : v >= 0.5 ? 'bg-amber-400' : 'bg-neutral-200 dark:bg-neutral-700')}
                                        title={v === 1 ? '自主交付' : v >= 0.5 ? '协作交付' : '未覆盖'} />
                                    </td>
                                  ))}
                                  <td className="py-2.5 px-2 text-center">
                                    <span className={cn('text-xs font-semibold', row.coverage >= 60 ? 'text-emerald-600' : row.coverage >= 30 ? 'text-amber-600' : 'text-red-500')}>
                                      {row.coverage}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-400">
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500" /> 自主交付</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-400" /> 协作交付</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-neutral-200 dark:bg-neutral-700" /> 未覆盖</span>
                        </div>
                      </div>

                      {/* Gap-specific callouts */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-xs font-semibold text-red-700 dark:text-red-400">最大缺口</span>
                          </div>
                          <p className="text-[11px] text-red-600 dark:text-red-300">AI/ML能力仅25%——医疗+政务行业均未覆盖，竞品AWS已抢占先机</p>
                        </div>
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">待加强</span>
                          </div>
                          <p className="text-[11px] text-amber-600 dark:text-amber-300">安全能力45%依赖生态协作——金融行业合规要求高，自主能力是准入门槛</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── 客户拓展建议 ─────────────────────────── */}
              <Card>
                <CardHeader><CardTitle>行业拓展路径</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(() => {
                      const industryRecommendations: Record<string, {target: string, detail: string, cases: string, priority: string, capability: string}[]> = {
                        '医疗': [
                          { target: '医疗行业深耕', detail: '3个独家客户→撬动同区域标杆', cases: '积水潭医院、华山医院', priority: '高', capability: '云原生+数据' },
                          { target: 'AI医疗联合方案', detail: '与上海智医ISV联合打造', cases: '瑞金丢标复盘→差异化', priority: '高', capability: '需生态协作补全' },
                          { target: '医药企业拓展', detail: '药企数字化转型机遇', cases: '国药、上药集团', priority: '中', capability: '数据+云原生' },
                          { target: '医疗器械智能化', detail: 'AI辅助诊断方案', cases: '迈瑞、联影', priority: '中', capability: 'AI+数据缺口' },
                        ],
                        '政务': [
                          { target: '政务行业扩展', detail: '卫健委→人社局、医保局', cases: '数据平台+云原生组合', priority: '高', capability: '数据+云原生' },
                          { target: '智慧城市建设', detail: '城市大脑项目机会', cases: '市级项目招标', priority: '高', capability: '云原生+安全' },
                          { target: '数据中台建设', detail: '政务数据共享平台', cases: '省级大数据局', priority: '中', capability: '数据+安全' },
                          { target: '数字政府升级', detail: '一网通办深化', cases: '政务服务中心', priority: '中', capability: '服务+云原生' },
                        ],
                        '金融': [
                          { target: '金融行业突破', detail: '首个标杆→城商行、保险', cases: '需补安全+AI能力', priority: '高', capability: '安全+AI缺口' },
                          { target: '银行数字化', detail: '核心系统云迁移', cases: '股份制银行', priority: '高', capability: '云原生+安全' },
                          { target: '保险科技', detail: 'AI核保理赔方案', cases: '头部保险公司', priority: '中', capability: 'AI+数据' },
                          { target: '证券数字化', detail: '交易系统升级', cases: '券商总部', priority: '中', capability: '安全+数据' },
                        ],
                        '制造': [
                          { target: '制造行业深耕', detail: '工业互联网平台落地', cases: '三一重工、海尔', priority: '高', capability: '云原生+数据' },
                          { target: '智能工厂建设', detail: '数字化车间改造', cases: '比亚迪、宁德时代', priority: '高', capability: 'AI+边缘计算' },
                          { target: '供应链数字化', detail: '上下游协同平台', cases: '大型制造集团', priority: '中', capability: '数据+云原生' },
                          { target: '质量检测AI', detail: '视觉检测方案', cases: '电子制造企业', priority: '中', capability: 'AI+数据缺口' },
                        ],
                        '教育': [
                          { target: '教育云平台', detail: '高校数字化升级', cases: '双一流大学', priority: '高', capability: '云原生+服务' },
                          { target: '智慧校园', detail: '教学管理一体化', cases: '职业院校', priority: '高', capability: '数据+服务' },
                          { target: '在线教育', detail: 'AI助教方案', cases: '教育科技公司', priority: '中', capability: 'AI+云原生' },
                          { target: '教育数据中台', detail: '学情分析平台', cases: '教育局', priority: '中', capability: '数据+服务' },
                        ],
                        '零售': [
                          { target: '零售数字化', detail: '全渠道融合方案', cases: '连锁商超', priority: '高', capability: '云原生+数据' },
                          { target: '智慧门店', detail: 'AI导购+无人零售', cases: '电商平台', priority: '高', capability: 'AI+边缘' },
                          { target: '供应链优化', detail: '库存预测系统', cases: '快消品牌', priority: '中', capability: '数据+AI' },
                          { target: '会员营销', detail: '精准营销平台', cases: '零售集团', priority: '中', capability: '数据+服务' },
                        ],
                      };
                      return industryRecommendations[partner.industry || '医疗'] || industryRecommendations['医疗'];
                    })().map((t) => (
                      <div key={t.target} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">{t.target}</span>
                          <Badge variant={t.priority === '高' ? 'danger' : 'warning'} size="sm">{t.priority}</Badge>
                        </div>
                        <p className="text-xs text-neutral-500 mb-2">{t.detail}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-400">靶向:</span>
                          <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300">{t.cases}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-400">所需能力:</span>
                          <Badge variant={t.capability.includes('缺口') ? 'danger' : t.capability.includes('协作') ? 'warning' : 'info'} size="sm">{t.capability}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 5: 人员管理
              ══════════════════════════════════════════════ */}
          {activeTab === 'staff' && (
            <StaffManagementTab partnerId={partner.id} />
          )}

          {/* ══════════════════════════════════════════════
              TAB 7: 关系档案
              ══════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Layered Info + Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle>基本信息</CardTitle><div className="flex gap-2">{isEditing ? <><Button variant="brand" size="sm" onClick={handleSave}>保存</Button><Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>取消</Button></> : <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>编辑</Button>}</div></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="名称（中文）" value={formData.name} onChange={(e) => dispatch({ type: 'SET', field: 'name', value: e.target.value })} disabled={!isEditing} />
                        <Input label="名称（英文）" value={formData.englishName || ''} onChange={(e) => dispatch({ type: 'SET', field: 'englishName', value: e.target.value })} disabled={!isEditing} />
                        <Input label="网址" value={formData.website || ''} onChange={(e) => dispatch({ type: 'SET', field: 'website', value: e.target.value })} disabled={!isEditing} />
                        <Input label="信用代码" value={formData.unifiedSocialCreditCode} onChange={(e) => dispatch({ type: 'SET', field: 'unifiedSocialCreditCode', value: e.target.value })} disabled={!isEditing} />
                        <Select label="类型" options={(config?.partnerTypes || [formData.type]).map(v=>({value:v,label:v}))} value={formData.type} onChange={(e) => dispatch({ type: 'SET', field: 'type', value: e.target.value })} disabled={!isEditing} />
                        <Select label="等级" options={(config?.partnerTiers || [formData.tier]).map(v=>({value:v,label:v}))} value={formData.tier} onChange={(e) => dispatch({ type: 'SET', field: 'tier', value: e.target.value })} disabled={!isEditing} />
                        <Select label="状态" options={STATUS_OPTIONS} value={formData.status} onChange={(e) => dispatch({ type: 'SET', field: 'status', value: e.target.value })} disabled={!isEditing} />
                        <Input label="加入日期" type="date" value={formData.startDate} onChange={(e) => dispatch({ type: 'SET', field: 'startDate', value: e.target.value })} disabled={!isEditing} />
                        <Select label="行业" options={(config?.industries || [formData.industry]).map(v=>({value:v,label:v}))} value={formData.industry} onChange={(e) => dispatch({ type: 'SET', field: 'industry', value: e.target.value })} disabled={!isEditing} />
                        {isEditing ? (
                          <RegionCascader label="所在地区" value={{ province: formData.province, city: formData.city, district: formData.district }} onChange={(v) => { dispatch({ type: 'SET', field: 'province', value: v.province }); dispatch({ type: 'SET', field: 'city', value: v.city }); dispatch({ type: 'SET', field: 'district', value: v.district }); }} />
                        ) : (
                          <Input label="所在地区" value={[formData.province, formData.city, formData.district].filter(Boolean).join(' · ') || '-'} disabled />
                        )}
                        <div className="col-span-2"><Input label="详细地址" value={formData.location || ''} onChange={(e) => dispatch({ type: 'SET', field: 'location', value: e.target.value })} disabled={!isEditing} /></div>
                        <div className="col-span-2"><Input label="注册地址" value={formData.registeredAddress || ''} onChange={(e) => dispatch({ type: 'SET', field: 'registeredAddress', value: e.target.value })} disabled={!isEditing} /></div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">合作范围</label>
                          <textarea className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm resize-none disabled:bg-neutral-50 dark:disabled:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-brand/20" rows={2} value={formData.cooperationScope} onChange={(e) => dispatch({ type: 'SET', field: 'cooperationScope', value: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="flex items-center gap-2"><input type="checkbox" id="isCore" checked={formData.isCorePartner} onChange={(e) => dispatch({ type: 'SET', field: 'isCorePartner', value: e.target.checked })} disabled={!isEditing} className="w-4 h-4 rounded" /><label htmlFor="isCore" className="text-sm cursor-pointer select-none">核心合作伙伴</label></div>
                      </div>
                      {isEditing && <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800"><Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>取消</Button><Button variant="brand" size="sm" onClick={handleSave}><Save className="w-4 h-4" />保存</Button></div>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>主要联系人</CardTitle></CardHeader>
                    <CardContent>
                      {primaryContact ? (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">{primaryContact.lastName?.charAt(0) || '?'}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-white">{primaryContact.lastName}{primaryContact.firstName}</p>
                            <p className="text-xs text-neutral-500">{primaryContact.title || '-'}{primaryContact.department ? ` · ${primaryContact.department}` : ''}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-neutral-400">
                              {primaryContact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{primaryContact.phone}</span>}
                              {primaryContact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{primaryContact.email}</span>}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-400 py-2">暂无联系人</p>
                      )}
                      <button onClick={() => setActiveTab('staff')} className="mt-3 text-xs text-blue-600 hover:underline">查看全部人员 →</button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <PartnerTimeline
                    key={partner.id + (partner.milestones?.length || 0)}
                    events={(partner.milestones || []).map((m: any) => ({ id: m.id || Date.now().toString(), type: m.stage || m.type || 'milestone', title: m.title || m.event || '', description: m.desc || m.description || '', date: m.date || m.year || '', operator: m.operator || '' }))}
                    partnerName={partner.name}
                    onUpdateEvents={async (events) => {
                      const milestones = events.map(e => ({ id: e.id, stage: e.type, title: e.title, description: e.description || '', date: e.date, operator: e.operator || '', year: e.date?.split('-')[0] || '' }));
                      await supabase.from('partners').update({ milestones }).eq('id', partner.id);
                      updatePartner({ ...partner, milestones } as any);
                    }}
                  />

                </div>
              </div>

              {/* Key Customers */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>重要客户</CardTitle><p className="text-xs text-neutral-400 mt-0.5">{keyCustomers.length} 家客户 · {keyCustomers.reduce((s:number,c:any)=>s+(c.annualRevenue||0),0)>0?'总额 '+cur(keyCustomers.reduce((s:number,c:any)=>s+(c.annualRevenue||0),0)):''}</p></div>
                  <Button variant="ghost" size="sm" onClick={() => { setShowCustomerForm(!showCustomerForm); setEditingCustomer(null); }}><Plus className="w-3.5 h-3.5" />添加</Button>
                </CardHeader>
                <CardContent>
                  {(showCustomerForm || editingCustomer) && (
                    <div className="p-3 mb-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs font-semibold mb-2">{editingCustomer ? '编辑客户' : '添加客户'}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <Input value={editingCustomer ? editForm.name : newCustomer.name} onChange={e => editingCustomer ? setEditForm({...editForm, name: e.target.value}) : setNewCustomer({...newCustomer, name: e.target.value})} placeholder="客户名称 *" />
                        <Input value={editingCustomer ? editForm.industry : newCustomer.industry} onChange={e => editingCustomer ? setEditForm({...editForm, industry: e.target.value}) : setNewCustomer({...newCustomer, industry: e.target.value})} placeholder="行业" />
                        <Select value={editingCustomer ? editForm.relationship : newCustomer.relationship} options={[{value:'战略合作',label:'战略合作'},{value:'合作中',label:'合作中'},{value:'潜在客户',label:'潜在客户'},{value:'跟进中',label:'跟进中'},{value:'已流失',label:'已流失'}]} onChange={e => editingCustomer ? setEditForm({...editForm, relationship: e.target.value}) : setNewCustomer({...newCustomer, relationship: e.target.value})} />
                        <Input type="number" value={editingCustomer ? (editForm.annualRevenue||'') : (newCustomer.annualRevenue||'')} onChange={e => editingCustomer ? setEditForm({...editForm, annualRevenue: Number(e.target.value)}) : setNewCustomer({...newCustomer, annualRevenue: Number(e.target.value)})} placeholder="年合作额" />
                        <Input value={editingCustomer ? editForm.salesLead : newCustomer.salesLead} onChange={e => editingCustomer ? setEditForm({...editForm, salesLead: e.target.value}) : setNewCustomer({...newCustomer, salesLead: e.target.value})} placeholder="销售负责人" />
                        <Input value={editingCustomer ? editForm.productsStr : newCustomer.productsStr || ''} onChange={e => editingCustomer ? setEditForm({...editForm, productsStr: e.target.value}) : setNewCustomer({...newCustomer, productsStr: e.target.value})} placeholder="产品/方案（逗号分隔）" />
                        <Input value={editingCustomer ? editForm.majorProjectsStr : newCustomer.majorProjectsStr || ''} onChange={e => editingCustomer ? setEditForm({...editForm, majorProjectsStr: e.target.value}) : setNewCustomer({...newCustomer, majorProjectsStr: e.target.value})} placeholder="重点项目（逗号分隔）" />
                        <Input value={editingCustomer ? editForm.contactPerson : newCustomer.contactPerson} onChange={e => editingCustomer ? setEditForm({...editForm, contactPerson: e.target.value}) : setNewCustomer({...newCustomer, contactPerson: e.target.value})} placeholder="客户联系人" />
                        <Input value={editingCustomer ? editForm.contactPhone : newCustomer.contactPhone} onChange={e => editingCustomer ? setEditForm({...editForm, contactPhone: e.target.value}) : setNewCustomer({...newCustomer, contactPhone: e.target.value})} placeholder="联系电话" />
                        <Select value={editingCustomer ? editForm.status : newCustomer.status} options={[{value:'在服',label:'在服'},{value:'POC',label:'POC'},{value:'商务',label:'商务'},{value:'跟进中',label:'跟进中'},{value:'丢标',label:'丢标'}]} onChange={e => editingCustomer ? setEditForm({...editForm, status: e.target.value}) : setNewCustomer({...newCustomer, status: e.target.value})} />
                      </div>
                      <div className="col-span-full mt-2">
                        <Input value={editingCustomer ? editForm.goals : newCustomer.goals} onChange={e => editingCustomer ? setEditForm({...editForm, goals: e.target.value}) : setNewCustomer({...newCustomer, goals: e.target.value})} placeholder="合作目标（如：完成HIS系统升级签约，实现AI诊断POC）" />
                      </div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => { setShowCustomerForm(false); setEditingCustomer(null); }}>取消</Button>
                        <Button variant="brand" size="sm" onClick={() => editingCustomer ? saveCustomerEdit() : addCustomer()}>{editingCustomer ? '保存修改' : '添加客户'}</Button>
                      </div>
                    </div>
                  )}
                  {keyCustomers.length === 0 ? (
                    <p className="text-sm text-neutral-400 py-4 text-center">暂无重要客户，点击"添加"录入</p>
                  ) : (
                    <div className="space-y-3">
                      {keyCustomers.map((c: any) => (
                        <CustomerCard key={c.id} customer={c} onEdit={(cust) => { setEditingCustomer(cust.id); const p = (cust.products||[]).join('，'); const m = (cust.majorProjects||[]).join('，'); setEditForm({...cust, productsStr: p, majorProjectsStr: m}); setShowCustomerForm(false); }} onDelete={removeCustomer} onAddProgress={async (custId, prog) => { const updated = keyCustomers.map(x => x.id===custId ? {...x, progress: [...(x.progress||[]), prog]} : x); await saveCustomers(updated); }} cur={cur} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Work Follow-ups */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>工作跟进</CardTitle><p className="text-xs text-neutral-400 mt-0.5">{followUps.length} 条记录 · {followUps.filter(f=>f.status==='已完结').length}完结 · {followUps.filter(f=>f.status==='进行中').length}进行中</p></div>
                  <Button variant="ghost" size="sm" onClick={() => { setShowFollowUpForm(!showFollowUpForm); setEditingFollowUp(null); }}><Plus className="w-3.5 h-3.5" />添加</Button>
                </CardHeader>
                <CardContent>
                  {(showFollowUpForm || editingFollowUp) && (
                    <div className="p-3 mb-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs font-semibold mb-2">{editingFollowUp ? '编辑跟进' : '添加跟进'}</p>
                      <div className="space-y-2">
                        <Input value={newFollowUp.title} onChange={e => setNewFollowUp({...newFollowUp, title: e.target.value})} placeholder="标题 *" />
                        <div className="flex gap-2">
                          <Select value={newFollowUp.status} options={[{value:'草稿',label:'草稿'},{value:'进行中',label:'进行中'},{value:'已完结',label:'已完结'},{value:'放弃',label:'放弃'}]} onChange={e => setNewFollowUp({...newFollowUp, status: e.target.value})} />
                          <Input type="date" value={newFollowUp.date} onChange={e => setNewFollowUp({...newFollowUp, date: e.target.value})} />
                        </div>
                        <Input value={newFollowUp.desc} onChange={e => setNewFollowUp({...newFollowUp, desc: e.target.value})} placeholder="详细描述" />
                        <Input value={newFollowUp.nextStep} onChange={e => setNewFollowUp({...newFollowUp, nextStep: e.target.value})} placeholder="下一步计划" />
                      </div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => { setShowFollowUpForm(false); setEditingFollowUp(null); }}>取消</Button>
                        <Button variant="brand" size="sm" onClick={() => editingFollowUp ? saveFollowUpEdit() : addFollowUp()}>{editingFollowUp ? '保存' : '添加'}</Button>
                      </div>
                    </div>
                  )}
                  {followUps.length === 0 ? (
                    <p className="text-sm text-neutral-400 py-4 text-center">暂无工作跟进，点击"添加"记录</p>
                  ) : (
                    <div className="space-y-2">
                      {followUps.map((f: any) => (
                        <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 transition-colors">
                          <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${f.status==='已完结'?'bg-emerald-500':f.status==='进行中'?'bg-blue-500':f.status==='草稿'?'bg-neutral-400':'bg-red-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{f.title}</span>
                              <Badge variant={f.status==='已完结'?'success':f.status==='进行中'?'info':f.status==='草稿'?'default':'danger'} size="sm">{f.status}</Badge>
                              <span className="text-xs text-neutral-400">{f.date}</span>
                            </div>
                            {f.desc && <p className="text-xs text-neutral-500 mt-1">{f.desc}</p>}
                            {f.nextStep && <p className="text-xs text-blue-600 mt-0.5">→ {f.nextStep}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditingFollowUp(f.id); setNewFollowUp({ title: f.title, desc: f.desc||'', status: f.status, date: f.date, nextStep: f.nextStep||'' }); setShowFollowUpForm(false); }} className="p-1 text-neutral-400 hover:text-blue-500"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => removeFollowUp(f.id)} className="p-1 text-neutral-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 8: 生态协作网络
              ══════════════════════════════════════════════ */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              {/* Network Position Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>网络位置分析</CardTitle>
                  <div className="relative group">
                    <button className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[11px] font-semibold text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors">?</button>
                    <div className="absolute right-0 top-6 w-72 p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      该伙伴处于生态网络的<b>结构洞</b>位置——连接了原本不互通的SI和ISV群体，因此享有<b>信息优势</b>（比别人更早知道机会）和<b>控制优势</b>（决定信息如何流动）。这种"桥梁"角色赋予其独特的生态定价权。
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Hub-and-spoke diagram */}
                    <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                      <div className="relative w-48 h-48">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-neutral-900 dark:bg-white flex flex-col items-center justify-center text-white dark:text-neutral-900 z-10 shadow-lg">
                          <span className="text-[9px] font-semibold">本伙伴</span>
                          <span className="text-[8px] opacity-70">{partner.tier}</span>
                        </div>
                        {[
                          { label: '昆仑联通', type: 'SI', angle: -90, dist: 55, color: '#2563eb' },
                          { label: '精诚中国', type: 'Reseller', angle: -20, dist: 60, color: '#059669' },
                          { label: '上海智医', type: 'ISV', angle: 50, dist: 55, color: '#7c3aed' },
                          { label: '南京云帆', type: 'SI(子)', angle: 130, dist: 50, color: '#d97706' },
                          { label: '杭州智联', type: 'ISV(子)', angle: 200, dist: 55, color: '#0891b2' },
                        ].map((node) => {
                          const rad = (node.angle * Math.PI) / 180;
                          const cx = 50 + node.dist * Math.cos(rad) * 0.8;
                          const cy = 50 + node.dist * Math.sin(rad) * 0.8;
                          return (
                            <svg key={node.label} className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
                              <line x1="50%" y1="50%" x2={`${cx}%`} y2={`${cy}%`} stroke={node.color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                              <circle cx={`${cx}%`} cy={`${cy}%`} r="5" fill={node.color} opacity="0.8" />
                              <text x={`${cx}%`} y={`${cy + 5}%`} textAnchor="middle" fontSize="7" fill="#888">{node.label}</text>
                            </svg>
                          );
                        })}
                      </div>
                      <p className="text-xs text-neutral-500 mt-2 text-center">星型拓扑 · 该伙伴是网络中心节点</p>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                          <b>该伙伴处于网络的"桥梁"位置。</b>SI（昆仑联通）和ISV（上海智医）原本没有直接连接，而是通过该伙伴间接协作。这使得该伙伴不仅是一个交易中介，更是<b>信息枢纽和信任中介</b>——谁掌握连接，谁就掌握价值分配的话语权。
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">网络价值增长潜力</span>
                            <div className="relative group/ml">
                              <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 cursor-help inline-flex">?</span>
                              <div className="absolute left-0 top-5 w-56 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/ml:opacity-100 group-hover/ml:visible transition-all text-[10px] text-neutral-500 leading-relaxed">
                                网络价值与连接节点数的平方成正比。当前5节点=25单位价值，扩展到8节点将达到64单位(+156%)。
                              </div>
                            </div>
                          </div>
                          <p className="text-2xl font-semibold text-neutral-900 dark:text-white">+156%</p>
                          <p className="text-xs text-neutral-500 mt-1">5节点→8节点的预期价值增幅</p>
                        </div>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">互补性评估</span>
                            <div className="relative group/ml">
                              <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 cursor-help inline-flex">?</span>
                              <div className="absolute left-0 top-5 w-56 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/ml:opacity-100 group-hover/ml:visible transition-all text-[10px] text-neutral-500 leading-relaxed">
                                创新商业化需要互补性资产。云原生方案(核心)+AI能力(互补)+分销渠道(互补)=完整的价值闭环。互补性越强，协作的不可替代性越高。
                              </div>
                            </div>
                          </div>
                          <p className="text-2xl font-semibold text-emerald-600">高</p>
                          <p className="text-xs text-neutral-500 mt-1">核心+AI+渠道形成完整闭环</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Table */}
              <Card>
                <CardHeader><CardTitle>协作关系图谱</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">协作伙伴</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">关系类型</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">协作强度</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">协作产出</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">联合项目</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">协作逻辑 <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[9px] text-neutral-500 cursor-help">?</span></th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">放大建议</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {[
                          { ...ecosystemPartners[0], logic: 'SI提供客户关系 + 本伙伴提供技术方案 → 联合打单的交易成本远低于各自独立获客，这是典型的专业化分工带来的效率提升', amplify: '联合项目数从5个→10个，预计增量营收¥280万' },
                          { ...ecosystemPartners[1], logic: '双方存在相互依赖：精诚依赖本伙伴的产品授权，本伙伴依赖精诚的客户渠道。这种对称的相互依赖创造了最稳定的合作基础', amplify: '拓展安全+数据产品线，利用精诚的12个客户触点交叉销售' },
                          { ...ecosystemPartners[2], logic: '本伙伴的云原生方案(核心能力) + 上海智医的AI算法(稀缺能力) = 单一伙伴无法独立提供的完整AI医疗解决方案，协作的不可替代性极高', amplify: '联合参加Q3医疗峰会，预计产出5-8个高质量商机' },
                        ].map((ep, i) => (
                          <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#2563eb','#059669','#7c3aed'][i] }} />
                                <span className="font-medium text-neutral-900 dark:text-white">{ep.name}</span>
                              </div>
                              <p className="text-xs text-neutral-400 mt-0.5">{ep.type}</p>
                            </td>
                            <td className="py-4 px-4 text-center"><Badge variant={i===0?'primary':i===1?'success':'info'} size="sm">{ep.relation}</Badge></td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <ProgressBar value={ep.deals/0.15} size="sm" className="w-16" variant={ep.deals>=8?'brand':'default'} />
                                <span className="text-xs font-medium">{ep.deals>=8?'强':ep.deals>=4?'中':'弱'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-semibold">{cur(ep.volume)}</td>
                            <td className="py-4 px-4 text-center">{ep.deals} 个</td>
                            <td className="py-4 px-4 max-w-[220px]"><p className="text-xs text-neutral-500 leading-relaxed">{ep.logic}</p></td>
                            <td className="py-4 px-4 max-w-[200px]"><p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">{ep.amplify}</p></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Sub-partners */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>子合作伙伴</CardTitle>
                    <Button variant="secondary" size="sm"><Plus className="w-4 h-4" />新增</Button>
                  </CardHeader>
                  <CardContent>
                    {[
                      { id: 'sp1', name: '南京云帆科技有限公司', type: 'SI', contact: '周伟', phone: '13812345678', status: 'Active', role: '区域交付延伸——弥补华东二线城市覆盖', analysis: '自建华东二线交付团队成本约¥80万/年，子合作模式成本仅¥30万/年，节约63%。当交易频率低、资产专用性低时，外包优于内部化。' },
                      { id: 'sp2', name: '杭州智联信息技术有限公司', type: 'ISV', contact: '林芳', phone: '13987654321', status: 'Active', role: 'AI能力补全——弥补算法和模型开发短板', analysis: 'AI能力自建需2年+¥200万投入，子合作模式6个月即获得可用能力。当速度是首要竞争要素时，外部获取优于内部建设。' },
                    ].map((sp) => (
                      <div key={sp.id} className="py-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div><p className="text-sm font-medium text-neutral-900 dark:text-white">{sp.name}</p><p className="text-xs text-neutral-400">{sp.type} · {sp.contact} · {sp.phone}</p></div>
                          <Badge variant={sp.status === 'Active' ? 'success' : 'warning'} size="sm">{sp.status === 'Active' ? '活跃' : '非活跃'}</Badge>
                        </div>
                        <p className="text-xs text-neutral-500 mb-1">战略角色: {sp.role}</p>
                        <div className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 cursor-help shrink-0 mt-0.5 relative group/ml">
                            ?
                            <div className="absolute left-0 bottom-5 w-52 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/ml:opacity-100 group-hover/ml:visible transition-all text-[10px] text-neutral-500 leading-relaxed">
                              企业边界的决策逻辑：当外部交易成本低于内部管理成本时，选择合作而非自建。这里的分析量化了两种模式的成本和速度差异。
                            </div>
                          </span>
                          <p className="text-xs text-neutral-500 leading-relaxed">{sp.analysis}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>协作网络价值评估</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { dim: '连接广度', desc: '5个直接连接节点形成一级协作圈，星型拓扑中心位置——连接的数量和多样性决定了信息获取的广度', score: 85 },
                        { dim: '关系深度', desc: '与昆仑联通合作5个项目（联合打单成功率68%），但与ISV协作仅3个项目——深度有待加强', score: 72 },
                        { dim: '认知协同', desc: '与精诚中国12个项目的长期合作建立了共享市场理解和客户洞察——默契降低了沟通成本', score: 80 },
                      ].map((d) => (
                        <div key={d.dim} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-neutral-900 dark:text-white">{d.dim}</span>
                              <div className="relative group/ml">
                                <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 cursor-help inline-flex">?</span>
                                <div className="absolute left-0 top-5 w-56 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/ml:opacity-100 group-hover/ml:visible transition-all text-[10px] text-neutral-500 leading-relaxed">
                                  协作价值取决于三个维度：连接谁（结构）、关系多深（关系）、是否互相理解（认知）。三个维度共同决定了协作的效率和产出。
                                </div>
                              </div>
                            </div>
                            <span className={cn('text-sm font-semibold', d.score >= 80 ? 'text-emerald-600' : d.score >= 70 ? 'text-amber-600' : 'text-red-500')}>{d.score}分</span>
                          </div>
                          <ProgressBar value={d.score} size="sm" variant={d.score >= 80 ? 'success' : 'default'} />
                          <p className="text-xs text-neutral-500 mt-2">{d.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        <b>综合评估：</b>协作网络总评分79分（白金前25%）。该伙伴在连接广度上表现优异，但关系深度（特别是ISV协作）有提升空间——应从项目级协作升级为方案级共创。核心建议：将伙伴定位从"渠道代理"升级为<b>"区域生态协调者"</b>，赋予更多跨伙伴协作的撮合权。
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ecosystem Value Summary */}
              <Card>
                <CardHeader><CardTitle>生态协作价值总览</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: '网络规模', value: '5节点', sub: '3生态+2子伙伴' },
                      { label: '协作营收', value: cur(ecosystemPartners.reduce((s,e)=>s+e.volume,0)), sub: '占总营收60%' },
                      { label: '网络位置', value: '枢纽', sub: '星型拓扑中心' },
                      { label: '协作评分', value: '79分', sub: '白金前25%' },
                    ].map((m) => (
                      <div key={m.label} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-center">
                        <p className="text-xs text-neutral-400 mb-1">{m.label}</p>
                        <p className="text-xl font-semibold text-neutral-900 dark:text-white">{m.value}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{m.sub}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
    </>
  );
};
