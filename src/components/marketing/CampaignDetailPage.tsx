import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Tabs } from '../ui/Tabs';
import { formatCurrency } from '../../lib/utils';
import { campaignService } from '../../services/campaign-service';
import { dealService } from '../../services/deal-service';
import type {
  MarketingCampaign,
  CampaignStatus,
  CampaignPhase,
  CampaignGoal,
  CampaignAttendee,
  CampaignRegistration,
  CampaignPointRecord,
  CampaignEvaluation,
  CampaignInvitation,
  CampaignPhaseTask,
  CampaignFeedback,
  CampaignQuestion,
  CampaignMiniAppConfig,
  CampaignGoalWeight,
  Deal,
  DealLifecycleStage,
} from '../../types';
import {
  ArrowLeft,
  Plus,
  Users,
  Calendar,
  DollarSign,
  Target,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  X,
  Save,
  Check,
  Gift,
  MessageCircle,
  Award,
  TrendingUp,
  Star,
  Send,
  Download,
  Upload,
  UserPlus,
  UserCheck,
  Ticket,
  Gift as GiftIcon,
  Share2,
  BarChart3,
  PieChart,
  Activity,
  Briefcase,
} from 'lucide-react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// 阶段配置
const PHASE_CONFIG: Record<CampaignPhase, { label: string; color: string; icon: string }> = {
  planning: { label: '计划', color: 'text-blue-600 bg-blue-100', icon: '📋' },
  preparing: { label: '准备', color: 'text-yellow-600 bg-yellow-100', icon: '⚙️' },
  executing: { label: '执行', color: 'text-green-600 bg-green-100', icon: '🚀' },
  follow_up: { label: '跟进', color: 'text-purple-600 bg-purple-100', icon: '📈' },
  evaluating: { label: '评估', color: 'text-indigo-600 bg-indigo-100', icon: '📊' },
  closed: { label: '已结束', color: 'text-gray-600 bg-gray-100', icon: '✅' },
};

// 状态配置
const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已批复', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '进行中', color: 'bg-green-100 text-green-800' },
  completed: { label: '已完成', color: 'bg-purple-100 text-purple-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
};

// 活动目标配置
const GOAL_CONFIG: Record<CampaignGoal, { label: string; color: string; icon: string; description: string }> = {
  awareness: {
    label: '打声量',
    color: 'bg-orange-100 text-orange-800',
    icon: '📢',
    description: '提升品牌知名度、扩大市场影响力',
  },
  conversion: {
    label: '做转化',
    color: 'bg-green-100 text-green-800',
    icon: '🎯',
    description: '产生商机线索、促进销售转化',
  },
  engagement: {
    label: '提粘性',
    color: 'bg-purple-100 text-purple-800',
    icon: '❤️',
    description: '增强客户粘性、提升用户忠诚度',
  },
};

// 辅助函数：根据目标获取目标值基准
const getGoalTarget = (goals: CampaignGoalWeight[] | undefined, metric: string): number | null => {
  if (!goals || goals.length === 0) return null;
  for (const g of goals) {
    if (g.targets) {
      const target = g.targets.find(t => t.metric === metric);
      if (target) return target.targetValue;
    }
  }
  return null;
};

// 辅助函数：计算目标达成率
const getAchievementRate = (actual: number, target: number | null): { rate: number; color: string } => {
  if (target === null || target === 0) return { rate: 0, color: 'text-gray-500' };
  const rate = Math.round((actual / target) * 100);
  const color = rate >= 100 ? 'text-green-600' : rate >= 80 ? 'text-yellow-600' : 'text-red-600';
  return { rate, color };
};

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { config } = useConfig();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState<MarketingCampaign | null>(null);
  const [attendees, setAttendees] = useState<CampaignAttendee[]>([]);
  const [registrations, setRegistrations] = useState<CampaignRegistration[]>([]);
  const [invitations, setInvitations] = useState<CampaignInvitation[]>([]);
  const [pointRecords, setPointRecords] = useState<CampaignPointRecord[]>([]);
  const [questions, setQuestions] = useState<CampaignQuestion[]>([]);
  const [feedbacks, setFeedbacks] = useState<CampaignFeedback[]>([]);
  const [evaluation, setEvaluation] = useState<CampaignEvaluation | null>(null);
  const [phaseTasks, setPhaseTasks] = useState<CampaignPhaseTask[]>([]);
  const [miniAppConfig, setMiniAppConfig] = useState<CampaignMiniAppConfig | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 模态框状态
  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false);
  const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showMiniAppConfigModal, setShowMiniAppConfigModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateDealModal, setShowCreateDealModal] = useState(false);
  const [selectedAttendeeForDeal, setSelectedAttendeeForDeal] = useState<CampaignAttendee | null>(null);
  
  // 新建数据状态
  const [newAttendee, setNewAttendee] = useState<Partial<CampaignAttendee>>({
    name: '',
    company: '',
    position: '',
    phone: '',
    email: '',
    source: 'registration',
    attendeeType: 'prospect',
  });
  
  const [newInvitation, setNewInvitation] = useState<Partial<CampaignInvitation>>({
    inviteeName: '',
    inviteeCompany: '',
    inviteeEmail: '',
    inviteePhone: '',
  });
  
  // 扩展的评估表单类型
  type ExtendedEvaluationForm = Partial<CampaignEvaluation> & {
    // 打声量指标
    awarenessMetrics?: {
      brandExposure: number;
      mediaCoverage: number;
      socialMediaReach: number;
      socialMediaEngagement: number;
      pressReleaseCount: number;
      influencerEngagement: number;
      brandAwarenessScore: number;
      marketImpactScore: number;
    };
    // 做转化指标
    conversionMetrics?: {
      leadsGenerated: number;
      qualifiedLeads: number;
      opportunitiesCreated: number;
      pipelineValue: number;
      dealsClosed: number;
      dealsValue: number;
      leadToOpportunityRate: number;
      opportunityToDealRate: number;
      costPerLead: number;
      costPerDeal: number;
      conversionEfficiencyScore: number;
    };
    // 提粘性指标
    engagementMetrics?: {
      repeatAttendees: number;
      npsScore: number;
      customerRetentionRate: number;
      activeUserIncrease: number;
      productUsageIncrease: number;
      customerFeedbackScore: number;
      loyaltyScore: number;
      engagementDepth: number;
    };
    lessonsLearned?: string;
    recommendations?: string;
  };
  
  const [evaluationForm, setEvaluationForm] = useState<ExtendedEvaluationForm>({
    overallQuality: 4,
    attendeeSatisfaction: 4,
    conversionRate: 0,
    leadConversionRate: 0,
    dealConversionRate: 0,
    roi: 0,
    strengths: '',
    improvements: '',
  });
  
  const [dealForm, setDealForm] = useState<Partial<Deal>>({
    title: '',
    customerName: '',
    value: 0,
    stage: 'lead' as any,
    region: '',
    salesName: '',
    salesTeam: '',
    productType: '',
    expectedCloseDate: '',
  });
  
  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');
  
  // 加载数据
  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);
  
  const loadData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const [
        campaignData,
        attendeesData,
        registrationsData,
        invitationsData,
        pointRecordsData,
        questionsData,
        feedbacksData,
        evaluationData,
        phaseTasksData,
        miniAppConfigData,
      ] = await Promise.all([
        campaignService.getById(id),
        campaignService.getAttendees(id),
        campaignService.getRegistrations(id),
        campaignService.getInvitations(id),
        campaignService.getPointRecords(id),
        campaignService.getQuestions(id),
        campaignService.getFeedback(id),
        campaignService.getEvaluation(id),
        campaignService.getPhaseTasks(id),
        campaignService.getMiniAppConfig(id),
      ]);
      
      setCampaign(campaignData || null);
      setAttendees(attendeesData);
      setRegistrations(registrationsData);
      setInvitations(invitationsData);
      setPointRecords(pointRecordsData);
      setQuestions(questionsData);
      setFeedbacks(feedbacksData);
      setEvaluation(evaluationData || null);
      setPhaseTasks(phaseTasksData);
      setMiniAppConfig(miniAppConfigData || null);
      
      // 设置评估表单初始值
      if (evaluationData) {
        setEvaluationForm(evaluationData);
      }
    } catch (e) {
      console.error('Failed to load campaign data:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 添加参会者
  const handleAddAttendee = async () => {
    if (!id || !newAttendee.name) return;
    
    try {
      const created = await campaignService.addAttendee({
        ...newAttendee,
        campaignId: id,
      });
      
      if (created) {
        setShowAddAttendeeModal(false);
        setNewAttendee({
          name: '',
          company: '',
          position: '',
          phone: '',
          email: '',
          source: 'registration',
          attendeeType: 'prospect',
        });
        await loadData();
      }
    } catch (e) {
      console.error('Failed to add attendee:', e);
      alert('添加失败');
    }
  };
  
  // 签到
  const handleCheckIn = async (attendeeId: string) => {
    if (!id) return;
    
    try {
      await campaignService.checkIn(id, attendeeId);
      await loadData();
    } catch (e) {
      console.error('Failed to check in:', e);
      alert('签到失败');
    }
  };
  
  // 创建邀请
  const handleCreateInvitation = async () => {
    if (!id || !newInvitation.inviteeName) return;
    
    try {
      const created = await campaignService.createInvitation({
        ...newInvitation,
        campaignId: id,
      });
      
      if (created) {
        setShowInviteModal(false);
        setNewInvitation({
          inviteeName: '',
          inviteeCompany: '',
          inviteeEmail: '',
          inviteePhone: '',
        });
        await loadData();
      }
    } catch (e) {
      console.error('Failed to create invitation:', e);
      alert('创建邀请失败');
    }
  };
  
  // 保存评估
  const handleSaveEvaluation = async () => {
    if (!id) return;
    
    try {
      await campaignService.saveEvaluation({
        ...evaluationForm,
        campaignId: id,
        evaluatedAt: new Date().toISOString(),
      });
      
      setShowEvaluationModal(false);
      await loadData();
    } catch (e) {
      console.error('Failed to save evaluation:', e);
      alert('保存评估失败');
    }
  };
  
  // 保存小程序配置
  const handleSaveMiniAppConfig = async () => {
    if (!id) return;
    
    try {
      await campaignService.saveMiniAppConfig({
        ...miniAppConfig,
        campaignId: id,
      });
      
      setShowMiniAppConfigModal(false);
      await loadData();
    } catch (e) {
      console.error('Failed to save mini app config:', e);
      alert('保存配置失败');
    }
  };
  
  // 打开创建商机模态框
  const handleOpenCreateDeal = (attendee: CampaignAttendee) => {
    setSelectedAttendeeForDeal(attendee);
    setDealForm({
      title: `${attendee.company || attendee.name} - 商机`,
      customerName: attendee.company || attendee.name,
      value: 0,
      stage: 'lead' as DealLifecycleStage,
      region: '',
      salesName: '',
      salesTeam: '',
      productType: '',
      expectedCloseDate: '',
    });
    setShowCreateDealModal(true);
  };
  
  // 创建商机
  const handleCreateDeal = async () => {
    if (!dealForm.title || !dealForm.customerName) {
      alert('请填写商机名称和客户名称');
      return;
    }
    
    try {
      const newDeal: Omit<Deal, 'id'> = {
        title: dealForm.title || '',
        customerName: dealForm.customerName || '',
        value: dealForm.value || 0,
        stage: (dealForm.stage || 'Registered') as any,
        lifecycle: [] as any[],
        region: dealForm.region || '',
        salesName: dealForm.salesName || '',
        salesTeam: dealForm.salesTeam || '',
        productType: dealForm.productType || '',
        expectedCloseDate: dealForm.expectedCloseDate || '',
        partnerId: '',
        partnerName: '',
        partnerType: 'direct' as any,
        status: 'active' as any,
        createdDate: new Date().toISOString(),
        lastActivityDate: new Date().toISOString(),
        sourceInfo: {
          source: 'campaign' as any,
          relatedCampaignId: id,
          leadQuality: 'Warm',
        },
      };
      
      const created = await dealService.create(newDeal);
      
      if (created) {
        // 更新参会者的商机状态
        if (selectedAttendeeForDeal && id) {
          await campaignService.linkAttendeeWithDeal(selectedAttendeeForDeal.id, created.id);
          // 更新活动的商机统计
          await campaignService.incrementDealsCreated(id);
        }
        
        setShowCreateDealModal(false);
        await loadData();
        alert('商机创建成功！');
      }
    } catch (e) {
      console.error('Failed to create deal:', e);
      alert('创建商机失败');
    }
  };
  
  // 更新活动状态
  const handleUpdateStatus = async (status: CampaignStatus) => {
    if (!id) return;
    
    try {
      await campaignService.updateStatus(id, status);
      await loadData();
    } catch (e) {
      console.error('Failed to update status:', e);
      alert('更新状态失败');
    }
  };
  
  // 更新活动阶段
  const handleUpdatePhase = async (phase: CampaignPhase) => {
    if (!id) return;
    
    try {
      await campaignService.updatePhase(id, phase);
      await loadData();
    } catch (e) {
      console.error('Failed to update phase:', e);
      alert('更新阶段失败');
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">加载中...</div>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">活动不存在</p>
          <Button variant="outline" onClick={() => navigate('/marketing/campaigns')}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }
  
  // 渲染阶段进度
  const renderPhaseProgress = () => {
    const phases: CampaignPhase[] = ['planning', 'preparing', 'executing', 'follow_up', 'evaluating'];
    const currentIndex = phases.indexOf(campaign.currentPhase);
    
    return (
      <div className="flex items-center justify-between mb-6">
        {phases.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const config = PHASE_CONFIG[phase];
          
          return (
            <React.Fragment key={phase}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? `${config.color}`
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : config.icon}
                </div>
                <span className="mt-2 text-sm font-medium">{config.label}</span>
              </div>
              {index < phases.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };
  
  // 渲染统计卡片
  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="text-center">
          <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
          <div className="text-2xl font-bold">{campaign.registeredCount}</div>
          <div className="text-sm text-gray-600">已报名</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="text-center">
          <UserCheck className="w-8 h-8 mx-auto text-green-600 mb-2" />
          <div className="text-2xl font-bold">{campaign.checkedInCount}</div>
          <div className="text-sm text-gray-600">已签到</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="text-center">
          <Ticket className="w-8 h-8 mx-auto text-purple-600 mb-2" />
          <div className="text-2xl font-bold">{campaign.expectedAttendees}</div>
          <div className="text-sm text-gray-600">预期参会</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="text-center">
          <GiftIcon className="w-8 h-8 mx-auto text-orange-600 mb-2" />
          <div className="text-2xl font-bold">
            {attendees.reduce((sum, a) => sum + a.totalPoints, 0)}
          </div>
          <div className="text-sm text-gray-600">总积分</div>
        </CardContent>
      </Card>
    </div>
  );
  
  // 渲染概览标签页
  const renderOverviewTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">活动类型</div>
              <div className="font-medium">
                {campaign.type === 'vendor_self' ? '厂商自办' : campaign.type === 'partner_joint' ? '合作伙伴合办' : 'MDF活动'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">活动类别</div>
              <div className="font-medium">{campaign.category || '未设置'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">预算</div>
              <div className="font-medium">{cur(campaign.budget)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">实际支出</div>
              <div className="font-medium">{cur(campaign.actualSpend)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">计划开始日期</div>
              <div className="font-medium">{campaign.plannedStartDate || '未设置'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">计划结束日期</div>
              <div className="font-medium">{campaign.plannedEndDate || '未设置'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">实际开始日期</div>
              <div className="font-medium">{campaign.actualStartDate || '未开始'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">实际结束日期</div>
              <div className="font-medium">{campaign.actualEndDate || '未结束'}</div>
            </div>
          </div>
          
          {campaign.description && (
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-1">活动描述</div>
              <p className="text-gray-700">{campaign.description}</p>
            </div>
          )}
          
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditCampaignModal(true)}
            >
              <Edit className="w-4 h-4 mr-1" />
              编辑
            </Button>
            
            <Select
              value={campaign.status}
              onChange={(e) => handleUpdateStatus(e.target.value as CampaignStatus)}
              options={[
                { value: 'draft', label: '草稿' },
                { value: 'pending', label: '待审批' },
                { value: 'approved', label: '已批复' },
                { value: 'in_progress', label: '进行中' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' },
              ]}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>转化数据</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{campaign.leadsGenerated}</div>
              <div className="text-sm text-gray-600 mt-1">产生线索</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{campaign.dealsCreated}</div>
              <div className="text-sm text-gray-600 mt-1">创建商机</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{cur(campaign.dealsValue)}</div>
              <div className="text-sm text-gray-600 mt-1">商机金额</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {evaluation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>活动评估</CardTitle>
              {campaign?.goals && campaign.goals.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">活动目标:</span>
                  {campaign.goals.map((g, idx) => (
                    <Badge key={idx} className={GOAL_CONFIG[g.goal].color}>
                      {GOAL_CONFIG[g.goal].icon} {GOAL_CONFIG[g.goal].label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* 基础评估指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">整体质量</div>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= evaluation.overallQuality
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-medium">{evaluation.overallQuality.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">参会者满意度</div>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= evaluation.attendeeSatisfaction
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-medium">{evaluation.attendeeSatisfaction.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">ROI</div>
                <div className="text-2xl font-bold text-blue-600">{evaluation.roi.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">转化率</div>
                <div className="text-2xl font-bold text-green-600">{evaluation.conversionRate.toFixed(1)}%</div>
              </div>
            </div>
            
            {/* 打声量指标 - 当目标包含awareness时显示 */}
            {campaign?.goals?.some(g => g.goal === 'awareness') && evaluation.awarenessMetrics && (
              <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{GOAL_CONFIG.awareness.icon}</span>
                  <span className="font-medium text-orange-800">{GOAL_CONFIG.awareness.label}指标</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">品牌曝光量</div>
                    <div className="text-lg font-bold text-orange-600">
                      {evaluation.awarenessMetrics.brandExposure.toLocaleString()}
                    </div>
                    {(() => {
                      const target = getGoalTarget(campaign?.goals, 'brandExposure');
                      const achievement = getAchievementRate(evaluation.awarenessMetrics.brandExposure, target);
                      return target !== null ? (
                        <div className={`text-xs ${achievement.color}`}>
                          目标: {target.toLocaleString()} ({achievement.rate}%)
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">媒体报道数</div>
                    <div className="text-lg font-bold">{evaluation.awarenessMetrics.mediaCoverage}</div>
                    {(() => {
                      const target = getGoalTarget(campaign?.goals, 'mediaCoverage');
                      const achievement = getAchievementRate(evaluation.awarenessMetrics.mediaCoverage, target);
                      return target !== null ? (
                        <div className={`text-xs ${achievement.color}`}>
                          目标: {target} ({achievement.rate}%)
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">社交媒体触达</div>
                    <div className="text-lg font-bold text-blue-600">{evaluation.awarenessMetrics.socialMediaReach.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">社交媒体互动</div>
                    <div className="text-lg font-bold text-green-600">{evaluation.awarenessMetrics.socialMediaEngagement.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">新闻稿发布</div>
                    <div className="text-lg font-bold">{evaluation.awarenessMetrics.pressReleaseCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">KOL参与数</div>
                    <div className="text-lg font-bold">{evaluation.awarenessMetrics.influencerEngagement}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">品牌知名度提升</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= evaluation.awarenessMetrics!.brandAwarenessScore
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">市场影响力</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= evaluation.awarenessMetrics!.marketImpactScore
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 做转化指标 - 当目标包含conversion时显示 */}
            {campaign?.goals?.some(g => g.goal === 'conversion') && evaluation.conversionMetrics && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{GOAL_CONFIG.conversion.icon}</span>
                  <span className="font-medium text-green-800">{GOAL_CONFIG.conversion.label}指标</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">产生线索数</div>
                    <div className="text-lg font-bold text-green-600">{evaluation.conversionMetrics.leadsGenerated}</div>
                    {(() => {
                      const target = getGoalTarget(campaign?.goals, 'leadsGenerated');
                      const achievement = getAchievementRate(evaluation.conversionMetrics.leadsGenerated, target);
                      return target !== null ? (
                        <div className={`text-xs ${achievement.color}`}>
                          目标: {target} ({achievement.rate}%)
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">有效线索数</div>
                    <div className="text-lg font-bold">{evaluation.conversionMetrics.qualifiedLeads}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">创建商机数</div>
                    <div className="text-lg font-bold text-blue-600">{evaluation.conversionMetrics.opportunitiesCreated}</div>
                    {(() => {
                      const target = getGoalTarget(campaign?.goals, 'opportunitiesCreated');
                      const achievement = getAchievementRate(evaluation.conversionMetrics.opportunitiesCreated, target);
                      return target !== null ? (
                        <div className={`text-xs ${achievement.color}`}>
                          目标: {target} ({achievement.rate}%)
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Pipeline金额</div>
                    <div className="text-lg font-bold text-purple-600">{cur(evaluation.conversionMetrics.pipelineValue)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">成交数量</div>
                    <div className="text-lg font-bold">{evaluation.conversionMetrics.dealsClosed}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">成交金额</div>
                    <div className="text-lg font-bold text-green-600">{cur(evaluation.conversionMetrics.dealsValue)}</div>
                    {(() => {
                      const target = getGoalTarget(campaign?.goals, 'dealsValue');
                      const achievement = getAchievementRate(evaluation.conversionMetrics.dealsValue, target);
                      return target !== null ? (
                        <div className={`text-xs ${achievement.color}`}>
                          目标: {cur(target)} ({achievement.rate}%)
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">线索转商机率</div>
                    <div className="text-lg font-bold">{evaluation.conversionMetrics.leadToOpportunityRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">商机转成交率</div>
                    <div className="text-lg font-bold">{evaluation.conversionMetrics.opportunityToDealRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">单线索成本</div>
                    <div className="text-lg font-bold text-orange-600">{cur(evaluation.conversionMetrics.costPerLead)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">单成交成本</div>
                    <div className="text-lg font-bold text-orange-600">{cur(evaluation.conversionMetrics.costPerDeal)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">转化效率评分</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= evaluation.conversionMetrics!.conversionEfficiencyScore
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 提粘性指标 - 当目标包含engagement时显示 */}
            {campaign?.goals?.some(g => g.goal === 'engagement') && evaluation.engagementMetrics && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{GOAL_CONFIG.engagement.icon}</span>
                  <span className="font-medium text-purple-800">{GOAL_CONFIG.engagement.label}指标</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">重复参会人数</div>
                    <div className="text-lg font-bold text-purple-600">{evaluation.engagementMetrics.repeatAttendees}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">NPS评分</div>
                    <div className="text-lg font-bold text-blue-600">{evaluation.engagementMetrics.npsScore}</div>
                    {(() => {
                      const target = getGoalTarget(campaign?.goals, 'npsScore');
                      const achievement = getAchievementRate(evaluation.engagementMetrics.npsScore, target);
                      return target !== null ? (
                        <div className={`text-xs ${achievement.color}`}>
                          目标: {target} ({achievement.rate}%)
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">客户留存率</div>
                    <div className="text-lg font-bold">{evaluation.engagementMetrics.customerRetentionRate.toFixed(1)}%</div>
                    {(() => {
                      const target = getGoalTarget(campaign?.goals, 'customerRetentionRate');
                      const achievement = getAchievementRate(evaluation.engagementMetrics.customerRetentionRate, target);
                      return target !== null ? (
                        <div className={`text-xs ${achievement.color}`}>
                          目标: {target}% ({achievement.rate}%)
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">活跃用户增长</div>
                    <div className="text-lg font-bold text-green-600">{evaluation.engagementMetrics.activeUserIncrease}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">产品使用增长</div>
                    <div className="text-lg font-bold">{evaluation.engagementMetrics.productUsageIncrease.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">客户反馈评分</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= evaluation.engagementMetrics!.customerFeedbackScore
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">客户忠诚度</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= evaluation.engagementMetrics!.loyaltyScore
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">参与深度</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= evaluation.engagementMetrics!.engagementDepth
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 综合评估 */}
            {evaluation.strengths && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 font-medium">优点</div>
                <p className="mt-1 text-gray-700 bg-green-50 p-2 rounded">{evaluation.strengths}</p>
              </div>
            )}
            
            {evaluation.improvements && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 font-medium">改进点</div>
                <p className="mt-1 text-gray-700 bg-orange-50 p-2 rounded">{evaluation.improvements}</p>
              </div>
            )}
            
            {evaluation.lessonsLearned && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 font-medium">经验教训</div>
                <p className="mt-1 text-gray-700 bg-blue-50 p-2 rounded">{evaluation.lessonsLearned}</p>
              </div>
            )}
            
            {evaluation.recommendations && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 font-medium">后续建议</div>
                <p className="mt-1 text-gray-700 bg-purple-50 p-2 rounded">{evaluation.recommendations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
  
  // 渲染参会者标签页
  const renderAttendeesTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>参会者列表 ({attendees.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
                <Send className="w-4 h-4 mr-1" />
                发送邀请
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowAddAttendeeModal(true)}>
                <UserPlus className="w-4 h-4 mr-1" />
                添加参会者
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p>暂无参会者</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">姓名</th>
                    <th className="text-left py-2 px-3">公司</th>
                    <th className="text-left py-2 px-3">来源</th>
                    <th className="text-left py-2 px-3">类型</th>
                    <th className="text-left py-2 px-3">签到状态</th>
                    <th className="text-left py-2 px-3">积分</th>
                    <th className="text-left py-2 px-3">跟进状态</th>
                    <th className="text-left py-2 px-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((attendee) => (
                    <tr key={attendee.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{attendee.name}</td>
                      <td className="py-2 px-3">{attendee.company}</td>
                      <td className="py-2 px-3">
                        <Badge className={
                          attendee.source === 'invitation' ? 'bg-blue-100 text-blue-800' :
                          attendee.source === 'registration' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {attendee.source === 'invitation' ? '邀请' :
                           attendee.source === 'registration' ? '报名' : '现场登记'}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        {attendee.attendeeType === 'prospect' ? '潜在客户' :
                         attendee.attendeeType === 'existing_customer' ? '现有客户' : '合作伙伴'}
                      </td>
                      <td className="py-2 px-3">
                        {attendee.checkedIn ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            已签到
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">未签到</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-medium text-orange-600">{attendee.totalPoints}</span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge className={
                          attendee.followUpStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          attendee.followUpStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {attendee.followUpStatus === 'completed' ? '已完成' :
                           attendee.followUpStatus === 'in_progress' ? '跟进中' : '待跟进'}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {!attendee.checkedIn && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckIn(attendee.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          {!attendee.dealCreated && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenCreateDeal(attendee)}
                              title="创建商机"
                            >
                              <Briefcase className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {pointRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>积分记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pointRecords.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <div className="font-medium">{record.attendeeName}</div>
                    <div className="text-sm text-gray-500">
                      {record.source === 'registration' ? '报名' :
                       record.source === 'check_in' ? '签到' :
                       record.source === 'question' ? '提问' :
                       record.source === 'lottery' ? '抽奖' :
                       record.source === 'sharing' ? '分享' : '反馈'}
                    </div>
                  </div>
                  <div className="text-orange-600 font-bold">+{record.points}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
  
  // 渲染邀请标签页
  const renderInvitationsTab = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>邀请管理 ({invitations.length})</CardTitle>
          <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
            <Send className="w-4 h-4 mr-1" />
            发送邀请
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Send className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p>暂无邀请记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">邀请对象</th>
                  <th className="text-left py-2 px-3">公司</th>
                  <th className="text-left py-2 px-3">邀请码</th>
                  <th className="text-left py-2 px-3">邀请时间</th>
                  <th className="text-left py-2 px-3">回复状态</th>
                  <th className="text-left py-2 px-3">是否报名</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{invitation.inviteeName}</td>
                    <td className="py-2 px-3">{invitation.inviteeCompany}</td>
                    <td className="py-2 px-3 font-mono text-sm">{invitation.invitationCode}</td>
                    <td className="py-2 px-3">{new Date(invitation.invitedAt).toLocaleDateString()}</td>
                    <td className="py-2 px-3">
                      <Badge className={
                        invitation.response === 'accepted' ? 'bg-green-100 text-green-800' :
                        invitation.response === 'declined' ? 'bg-red-100 text-red-800' :
                        invitation.response === 'maybe' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {invitation.response === 'accepted' ? '已接受' :
                         invitation.response === 'declined' ? '已拒绝' :
                         invitation.response === 'maybe' ? '待定' : '未回复'}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      {invitation.registered ? (
                        <Badge className="bg-green-100 text-green-800">已报名</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">未报名</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // 渲染商机标签页
  const renderDealsTab = () => {
    // 从参会者中提取已创建商机的参会者
    const attendeesWithDeals = attendees.filter(a => a.dealCreated);
    
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>活动商机转化</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{campaign.leadsGenerated}</div>
                <div className="text-sm text-gray-600 mt-1">产生线索</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{campaign.dealsCreated}</div>
                <div className="text-sm text-gray-600 mt-1">创建商机</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{cur(campaign.dealsValue)}</div>
                <div className="text-sm text-gray-600 mt-1">商机金额</div>
              </div>
            </div>
            
            {attendees.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600 mb-2">转化漏斗</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-blue-500 rounded" style={{ height: '24px', width: '100%' }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>报名: {attendees.length}</span>
                  <span>签到: {campaign.checkedInCount}</span>
                  <span>线索: {campaign.leadsGenerated}</span>
                  <span>商机: {campaign.dealsCreated}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>已转化参会者 ({attendeesWithDeals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {attendeesWithDeals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p>暂无已转化的商机</p>
                <p className="text-sm mt-1">从参会者列表中可以创建商机</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">参会者</th>
                      <th className="text-left py-2 px-3">公司</th>
                      <th className="text-left py-2 px-3">跟进状态</th>
                      <th className="text-left py-2 px-3">查看详情</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendeesWithDeals.map((attendee) => (
                      <tr key={attendee.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{attendee.name}</td>
                        <td className="py-2 px-3">{attendee.company}</td>
                        <td className="py-2 px-3">
                          <Badge className={
                            attendee.followUpStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            attendee.followUpStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {attendee.followUpStatus === 'completed' ? '已完成' :
                             attendee.followUpStatus === 'in_progress' ? '跟进中' : '待跟进'}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/deals/${attendee.dealId}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // 渲染互动标签页
  const renderInteractionTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>提问列表 ({questions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p>暂无提问</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <div key={question.id} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <div className="font-medium">{question.attendeeName}</div>
                      <p className="mt-1 text-gray-700">{question.content}</p>
                      {question.isAnswered && question.answer && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <span className="text-gray-600">回复: </span>
                          <span>{question.answer}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={question.isAnswered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {question.isAnswered ? '已回复' : '待回复'}
                      </Badge>
                      <span className="text-sm text-gray-500">{question.upvotes} 赞</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>反馈列表 ({feedbacks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {feedbacks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p>暂无反馈</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      {feedback.isAnonymity ? '匿名用户' : feedback.attendeeName}
                      {feedback.attendeeCompany && ` (${feedback.attendeeCompany})`}
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= feedback.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {feedback.content && (
                    <p className="text-gray-700">{feedback.content}</p>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    {new Date(feedback.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  
  return (
    <div className="container mx-auto p-6">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/marketing/campaigns')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={STATUS_CONFIG[campaign.status].color}>
              {STATUS_CONFIG[campaign.status].label}
            </Badge>
            <span className="text-gray-500">
              {campaign.year}年 {campaign.quarter}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            value={campaign.currentPhase}
            onChange={(e) => handleUpdatePhase(e.target.value as CampaignPhase)}
            options={[
              { value: 'planning', label: '📋 计划' },
              { value: 'preparing', label: '⚙️ 准备' },
              { value: 'executing', label: '🚀 执行' },
              { value: 'follow_up', label: '📈 跟进' },
              { value: 'evaluating', label: '📊 评估' },
            ]}
          />
          <Button variant="outline" onClick={() => setShowMiniAppConfigModal(true)}>
            <Gift className="w-4 h-4 mr-1" />
            小程序配置
          </Button>
          <Button variant="primary" onClick={() => setShowEvaluationModal(true)}>
            <BarChart3 className="w-4 h-4 mr-1" />
            活动评估
          </Button>
        </div>
      </div>
      
      {/* 阶段进度 */}
      <Card className="mb-6">
        <CardContent>
          {renderPhaseProgress()}
        </CardContent>
      </Card>
      
      {/* 统计卡片 */}
      {renderStatsCards()}
      
      {/* 标签页 */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: '概览' },
          { id: 'attendees', label: '参会者' },
          { id: 'invitations', label: '邀请' },
          { id: 'deals', label: '商机' },
          { id: 'interaction', label: '互动' },
        ]}
      />
      
      <div className="mt-6">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'attendees' && renderAttendeesTab()}
        {activeTab === 'invitations' && renderInvitationsTab()}
        {activeTab === 'deals' && renderDealsTab()}
        {activeTab === 'interaction' && renderInteractionTab()}
      </div>
      
      {/* 添加参会者模态框 */}
      <Modal
        open={showAddAttendeeModal}
        onClose={() => setShowAddAttendeeModal(false)}
        title="添加参会者"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">姓名 *</label>
            <Input
              value={newAttendee.name || ''}
              onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">公司</label>
            <Input
              value={newAttendee.company || ''}
              onChange={(e) => setNewAttendee({ ...newAttendee, company: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">职位</label>
            <Input
              value={newAttendee.position || ''}
              onChange={(e) => setNewAttendee({ ...newAttendee, position: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">电话</label>
            <Input
              value={newAttendee.phone || ''}
              onChange={(e) => setNewAttendee({ ...newAttendee, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <Input
              type="email"
              value={newAttendee.email || ''}
              onChange={(e) => setNewAttendee({ ...newAttendee, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">来源</label>
              <Select
                value={newAttendee.source || 'registration'}
                onChange={(e) => setNewAttendee({ ...newAttendee, source: e.target.value as any })}
                options={[
                  { value: 'registration', label: '报名' },
                  { value: 'invitation', label: '邀请' },
                  { value: 'walk_in', label: '现场登记' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">类型</label>
              <Select
                value={newAttendee.attendeeType || 'prospect'}
                onChange={(e) => setNewAttendee({ ...newAttendee, attendeeType: e.target.value as any })}
                options={[
                  { value: 'prospect', label: '潜在客户' },
                  { value: 'existing_customer', label: '现有客户' },
                  { value: 'partner', label: '合作伙伴' },
                ]}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddAttendeeModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleAddAttendee}>
              添加
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 发送邀请模态框 */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="发送邀请"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">邀请对象姓名 *</label>
            <Input
              value={newInvitation.inviteeName || ''}
              onChange={(e) => setNewInvitation({ ...newInvitation, inviteeName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">公司名称</label>
            <Input
              value={newInvitation.inviteeCompany || ''}
              onChange={(e) => setNewInvitation({ ...newInvitation, inviteeCompany: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <Input
              type="email"
              value={newInvitation.inviteeEmail || ''}
              onChange={(e) => setNewInvitation({ ...newInvitation, inviteeEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">电话</label>
            <Input
              value={newInvitation.inviteePhone || ''}
              onChange={(e) => setNewInvitation({ ...newInvitation, inviteePhone: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleCreateInvitation}>
              <Send className="w-4 h-4 mr-1" />
              发送邀请
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 活动评估模态框 */}
      <Modal
        open={showEvaluationModal}
        onClose={() => setShowEvaluationModal(false)}
        title="活动评估"
        size="lg"
      >
        <div className="space-y-4">
          {/* 活动目标提示 */}
          {campaign?.goals && campaign.goals.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
              <span className="text-sm text-blue-800">
                <strong>活动目标：</strong>
                {campaign.goals.map((g, idx) => (
                  <span key={idx} className="ml-1">
                    {GOAL_CONFIG[g.goal].icon}{GOAL_CONFIG[g.goal].label}
                    {idx < campaign.goals!.length - 1 ? ' + ' : ''}
                  </span>
                ))}
              </span>
            </div>
          )}
          
          {/* 基础评估指标 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">整体质量</label>
              <Select
                value={evaluationForm.overallQuality || 4}
                onChange={(e) => setEvaluationForm({ ...evaluationForm, overallQuality: Number(e.target.value) })}
                options={[1, 2, 3, 4, 5].map(v => ({ value: String(v), label: `${v}星` }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">参会者满意度</label>
              <Select
                value={evaluationForm.attendeeSatisfaction || 4}
                onChange={(e) => setEvaluationForm({ ...evaluationForm, attendeeSatisfaction: Number(e.target.value) })}
                options={[1, 2, 3, 4, 5].map(v => ({ value: String(v), label: `${v}星` }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">转化率 (%)</label>
              <Input
                type="number"
                value={evaluationForm.conversionRate || 0}
                onChange={(e) => setEvaluationForm({ ...evaluationForm, conversionRate: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ROI (%)</label>
              <Input
                type="number"
                value={evaluationForm.roi || 0}
                onChange={(e) => setEvaluationForm({ ...evaluationForm, roi: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">参会者人数</label>
              <Input
                type="number"
                value={campaign?.actualAttendees || 0}
                disabled
              />
            </div>
          </div>
          
          {/* 打声量指标表单 */}
          {campaign?.goals?.some(g => g.goal === 'awareness') && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{GOAL_CONFIG.awareness.icon}</span>
                <span className="font-medium text-orange-800">{GOAL_CONFIG.awareness.label}指标</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">品牌曝光量</label>
                  <Input
                    type="number"
                    value={evaluationForm.awarenessMetrics?.brandExposure || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      awarenessMetrics: { ...evaluationForm.awarenessMetrics!, brandExposure: Number(e.target.value) }
                    })}
                    placeholder="媒体报道、社交媒体传播等"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">媒体报道数量</label>
                  <Input
                    type="number"
                    value={evaluationForm.awarenessMetrics?.mediaCoverage || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      awarenessMetrics: { ...evaluationForm.awarenessMetrics!, mediaCoverage: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">社交媒体触达人数</label>
                  <Input
                    type="number"
                    value={evaluationForm.awarenessMetrics?.socialMediaReach || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      awarenessMetrics: { ...evaluationForm.awarenessMetrics!, socialMediaReach: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">社交媒体互动量</label>
                  <Input
                    type="number"
                    value={evaluationForm.awarenessMetrics?.socialMediaEngagement || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      awarenessMetrics: { ...evaluationForm.awarenessMetrics!, socialMediaEngagement: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">新闻稿发布数量</label>
                  <Input
                    type="number"
                    value={evaluationForm.awarenessMetrics?.pressReleaseCount || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      awarenessMetrics: { ...evaluationForm.awarenessMetrics!, pressReleaseCount: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">KOL/意见领袖参与数</label>
                  <Input
                    type="number"
                    value={evaluationForm.awarenessMetrics?.influencerEngagement || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      awarenessMetrics: { ...evaluationForm.awarenessMetrics!, influencerEngagement: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">品牌知名度提升评分</label>
                  <Select
                    value={evaluationForm.awarenessMetrics?.brandAwarenessScore || 3}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      awarenessMetrics: { ...evaluationForm.awarenessMetrics!, brandAwarenessScore: Number(e.target.value) }
                    })}
                    options={[1, 2, 3, 4, 5].map(v => ({ value: String(v), label: `${v}星` }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">市场影响力评分</label>
                  <Select
                    value={evaluationForm.awarenessMetrics?.marketImpactScore || 3}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      awarenessMetrics: { ...evaluationForm.awarenessMetrics!, marketImpactScore: Number(e.target.value) }
                    })}
                    options={[1, 2, 3, 4, 5].map(v => ({ value: String(v), label: `${v}星` }))}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 做转化指标表单 */}
          {campaign?.goals?.some(g => g.goal === 'conversion') && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{GOAL_CONFIG.conversion.icon}</span>
                <span className="font-medium text-green-800">{GOAL_CONFIG.conversion.label}指标</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">产生线索数量</label>
                  <Input
                    type="number"
                    value={evaluationForm.conversionMetrics?.leadsGenerated || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, leadsGenerated: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">有效线索数量</label>
                  <Input
                    type="number"
                    value={evaluationForm.conversionMetrics?.qualifiedLeads || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, qualifiedLeads: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">创建商机数量</label>
                  <Input
                    type="number"
                    value={evaluationForm.conversionMetrics?.opportunitiesCreated || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, opportunitiesCreated: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pipeline金额</label>
                  <Input
                    type="number"
                    value={evaluationForm.conversionMetrics?.pipelineValue || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, pipelineValue: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">成交数量</label>
                  <Input
                    type="number"
                    value={evaluationForm.conversionMetrics?.dealsClosed || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, dealsClosed: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">成交金额</label>
                  <Input
                    type="number"
                    value={evaluationForm.conversionMetrics?.dealsValue || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, dealsValue: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">线索转商机率 (%)</label>
                  <Input
                    type="number"
                    value={evaluationForm.conversionMetrics?.leadToOpportunityRate || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, leadToOpportunityRate: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">商机转成交率 (%)</label>
                  <Input
                    type="number"
                    value={evaluationForm.conversionMetrics?.opportunityToDealRate || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, opportunityToDealRate: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">单线索成本 (元)</label>
                  <Input
                    type="number"
                    value={evaluationForm.conversionMetrics?.costPerLead || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, costPerLead: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">单成交成本 (元)</label>
                  <Input
                    type="number"
                    value={evaluationForm.conversionMetrics?.costPerDeal || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, costPerDeal: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">转化效率评分</label>
                  <Select
                    value={evaluationForm.conversionMetrics?.conversionEfficiencyScore || 3}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      conversionMetrics: { ...evaluationForm.conversionMetrics!, conversionEfficiencyScore: Number(e.target.value) }
                    })}
                    options={[1, 2, 3, 4, 5].map(v => ({ value: String(v), label: `${v}星` }))}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 提粘性指标表单 */}
          {campaign?.goals?.some(g => g.goal === 'engagement') && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{GOAL_CONFIG.engagement.icon}</span>
                <span className="font-medium text-purple-800">{GOAL_CONFIG.engagement.label}指标</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">重复参会人数</label>
                  <Input
                    type="number"
                    value={evaluationForm.engagementMetrics?.repeatAttendees || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      engagementMetrics: { ...evaluationForm.engagementMetrics!, repeatAttendees: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NPS评分</label>
                  <Input
                    type="number"
                    value={evaluationForm.engagementMetrics?.npsScore || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      engagementMetrics: { ...evaluationForm.engagementMetrics!, npsScore: Number(e.target.value) }
                    })}
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">客户留存率 (%)</label>
                  <Input
                    type="number"
                    value={evaluationForm.engagementMetrics?.customerRetentionRate || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      engagementMetrics: { ...evaluationForm.engagementMetrics!, customerRetentionRate: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">活跃用户增长数</label>
                  <Input
                    type="number"
                    value={evaluationForm.engagementMetrics?.activeUserIncrease || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      engagementMetrics: { ...evaluationForm.engagementMetrics!, activeUserIncrease: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">产品使用增长率 (%)</label>
                  <Input
                    type="number"
                    value={evaluationForm.engagementMetrics?.productUsageIncrease || 0}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      engagementMetrics: { ...evaluationForm.engagementMetrics!, productUsageIncrease: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">客户反馈评分</label>
                  <Select
                    value={evaluationForm.engagementMetrics?.customerFeedbackScore || 3}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      engagementMetrics: { ...evaluationForm.engagementMetrics!, customerFeedbackScore: Number(e.target.value) }
                    })}
                    options={[1, 2, 3, 4, 5].map(v => ({ value: String(v), label: `${v}星` }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">客户忠诚度评分</label>
                  <Select
                    value={evaluationForm.engagementMetrics?.loyaltyScore || 3}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      engagementMetrics: { ...evaluationForm.engagementMetrics!, loyaltyScore: Number(e.target.value) }
                    })}
                    options={[1, 2, 3, 4, 5].map(v => ({ value: String(v), label: `${v}星` }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">参与深度评分</label>
                  <Select
                    value={evaluationForm.engagementMetrics?.engagementDepth || 3}
                    onChange={(e) => setEvaluationForm({
                      ...evaluationForm,
                      engagementMetrics: { ...evaluationForm.engagementMetrics!, engagementDepth: Number(e.target.value) }
                    })}
                    options={[1, 2, 3, 4, 5].map(v => ({ value: String(v), label: `${v}星` }))}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 综合评估 */}
          <div>
            <label className="block text-sm font-medium mb-1">优点</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              value={evaluationForm.strengths || ''}
              onChange={(e) => setEvaluationForm({ ...evaluationForm, strengths: e.target.value })}
              placeholder="请描述活动的优点"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">改进点</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              value={evaluationForm.improvements || ''}
              onChange={(e) => setEvaluationForm({ ...evaluationForm, improvements: e.target.value })}
              placeholder="请描述需要改进的地方"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">经验教训</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              value={evaluationForm.lessonsLearned || ''}
              onChange={(e) => setEvaluationForm({ ...evaluationForm, lessonsLearned: e.target.value })}
              placeholder="从本次活动中获得的经验教训"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">后续建议</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              value={evaluationForm.recommendations || ''}
              onChange={(e) => setEvaluationForm({ ...evaluationForm, recommendations: e.target.value })}
              placeholder="对后续类似活动的建议"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEvaluationModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSaveEvaluation}>
              <Save className="w-4 h-4 mr-1" />
              保存评估
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 小程序配置模态框 */}
      <Modal
        open={showMiniAppConfigModal}
        onClose={() => setShowMiniAppConfigModal(false)}
        title="小程序配置"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={miniAppConfig?.enabled !== false}
                onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="font-medium">启用小程序</span>
            </label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={miniAppConfig?.allowRegistration !== false}
                onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, allowRegistration: e.target.checked })}
                className="w-4 h-4"
              />
              <span>允许报名</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={miniAppConfig?.allowCheckIn !== false}
                onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, allowCheckIn: e.target.checked })}
                className="w-4 h-4"
              />
              <span>允许签到</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={miniAppConfig?.allowQuestions !== false}
                onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, allowQuestions: e.target.checked })}
                className="w-4 h-4"
              />
              <span>允许提问</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={miniAppConfig?.allowLottery || false}
                onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, allowLottery: e.target.checked })}
                className="w-4 h-4"
              />
              <span>允许抽奖</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={miniAppConfig?.allowSharing !== false}
                onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, allowSharing: e.target.checked })}
                className="w-4 h-4"
              />
              <span>允许分享</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={miniAppConfig?.allowFeedback !== false}
                onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, allowFeedback: e.target.checked })}
                className="w-4 h-4"
              />
              <span>允许反馈</span>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">积分规则</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">报名积分</label>
                <Input
                  type="number"
                  value={miniAppConfig?.signupPoints || 10}
                  onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, signupPoints: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">签到积分</label>
                <Input
                  type="number"
                  value={miniAppConfig?.checkInPoints || 20}
                  onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, checkInPoints: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">提问积分</label>
                <Input
                  type="number"
                  value={miniAppConfig?.questionPoints || 5}
                  onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, questionPoints: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">反馈积分</label>
                <Input
                  type="number"
                  value={miniAppConfig?.feedbackPoints || 10}
                  onChange={(e) => setMiniAppConfig({ ...miniAppConfig!, feedbackPoints: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowMiniAppConfigModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSaveMiniAppConfig}>
              <Save className="w-4 h-4 mr-1" />
              保存配置
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 创建商机模态框 */}
      <Modal
        open={showCreateDealModal}
        onClose={() => setShowCreateDealModal(false)}
        title={`为 ${selectedAttendeeForDeal?.name || ''} 创建商机`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg mb-4">
            <div className="text-sm text-blue-800">
              <span className="font-medium">参会者信息:</span> {selectedAttendeeForDeal?.name}
              {selectedAttendeeForDeal?.company && ` - ${selectedAttendeeForDeal.company}`}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">商机名称 *</label>
            <Input
              value={dealForm.title || ''}
              onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
              placeholder="请输入商机名称"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">客户名称 *</label>
              <Input
                value={dealForm.customerName || ''}
                onChange={(e) => setDealForm({ ...dealForm, customerName: e.target.value })}
                placeholder="请输入客户名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">商机金额</label>
              <Input
                type="number"
                value={dealForm.value || 0}
                onChange={(e) => setDealForm({ ...dealForm, value: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">商机阶段</label>
              <Select
                value={dealForm.stage || 'lead'}
                onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value as DealLifecycleStage })}
                options={[
                  { value: 'lead', label: '线索' },
                  { value: 'qualified', label: '合格线索' },
                  { value: 'proposal', label: '方案' },
                  { value: 'negotiation', label: '谈判' },
                  { value: 'closed_won', label: '成交' },
                  { value: 'closed_lost', label: '失单' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">预期成交日期</label>
              <Input
                type="date"
                value={dealForm.expectedCloseDate || ''}
                onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">负责销售</label>
              <Input
                value={dealForm.salesName || ''}
                onChange={(e) => setDealForm({ ...dealForm, salesName: e.target.value })}
                placeholder="请输入销售姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">销售团队</label>
              <Input
                value={dealForm.salesTeam || ''}
                onChange={(e) => setDealForm({ ...dealForm, salesTeam: e.target.value })}
                placeholder="请输入销售团队"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">产品类型</label>
            <Input
              value={dealForm.productType || ''}
              onChange={(e) => setDealForm({ ...dealForm, productType: e.target.value })}
              placeholder="请输入产品类型"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">地区</label>
            <Input
              value={dealForm.region || ''}
              onChange={(e) => setDealForm({ ...dealForm, region: e.target.value })}
              placeholder="请输入地区"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateDealModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleCreateDeal}>
              <Briefcase className="w-4 h-4 mr-1" />
              创建商机
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
