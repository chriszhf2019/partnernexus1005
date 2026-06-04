import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../lib/utils';
import { campaignService } from '../../services/campaign-service';
import type {
  MarketingCampaign,
  CampaignStatus,
  CampaignPhase,
  CampaignType,
  CampaignGoal,
  CampaignGoalWeight,
  GoalTarget,
  QuarterlyCampaignStats,
} from '../../types';
import {
  Plus,
  Calendar,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  X,
  Save,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// 状态配置
const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已批复', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '进行中', color: 'bg-green-100 text-green-800' },
  completed: { label: '已完成', color: 'bg-purple-100 text-purple-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
};

// 阶段配置
const PHASE_CONFIG: Record<CampaignPhase, { label: string; color: string; icon: string }> = {
  planning: { label: '计划', color: 'text-blue-600', icon: '📋' },
  preparing: { label: '准备', color: 'text-yellow-600', icon: '⚙️' },
  executing: { label: '执行', color: 'text-green-600', icon: '🚀' },
  follow_up: { label: '跟进', color: 'text-purple-600', icon: '📈' },
  evaluating: { label: '评估', color: 'text-indigo-600', icon: '📊' },
};

// 活动类型配置
const TYPE_CONFIG: Record<CampaignType, { label: string; color: string }> = {
  vendor_self: { label: '厂商自办', color: 'bg-blue-100 text-blue-800' },
  partner_joint: { label: '合作伙伴合办', color: 'bg-green-100 text-green-800' },
  mdf: { label: 'MDF活动', color: 'bg-purple-100 text-purple-800' },
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

export const CampaignManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<MarketingCampaign[]>([]);
  const [quarterlyStats, setQuarterlyStats] = useState<QuarterlyCampaignStats | null>(null);
  
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentQuarter, setCurrentQuarter] = useState(() => {
    const month = new Date().getMonth();
    return `Q${Math.floor(month / 3) + 1}`;
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  
  // 目标权重配置状态
  const [selectedGoals, setSelectedGoals] = useState<CampaignGoal[]>([]);
  const [goalWeights, setGoalWeights] = useState<Record<CampaignGoal, number>>({
    awareness: 0,
    conversion: 0,
    engagement: 0,
  });
  
  // 目标值基准状态
  const [goalTargets, setGoalTargets] = useState<Record<CampaignGoal, GoalTarget[]>>({
    awareness: [],
    conversion: [],
    engagement: [],
  });
  
  const [newCampaign, setNewCampaign] = useState<Partial<MarketingCampaign>>({
    name: '',
    type: 'vendor_self',
    hostType: 'vendor',
    year: new Date().getFullYear(),
    quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1}`,
    budget: 0,
    expectedAttendees: 0,
    status: 'draft',
    currentPhase: 'planning',
    primaryGoal: undefined,
    goals: [],
  });
  
  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');
  
  // 加载数据
  useEffect(() => {
    loadData();
  }, [currentYear, currentQuarter]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [campaignList, stats] = await Promise.all([
        campaignService.list(currentYear, currentQuarter),
        campaignService.getQuarterlyStats(currentYear, currentQuarter),
      ]);
      setCampaigns(campaignList);
      setFilteredCampaigns(campaignList);
      setQuarterlyStats(stats);
    } catch (e) {
      console.error('Failed to load campaigns:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 过滤活动
  useEffect(() => {
    let filtered = campaigns;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === typeFilter);
    }
    
    if (goalFilter !== 'all') {
      filtered = filtered.filter(c => 
        c.goals?.some(g => g.goal === goalFilter) ||
        c.primaryGoal === goalFilter
      );
    }
    
    setFilteredCampaigns(filtered);
  }, [campaigns, statusFilter, typeFilter, goalFilter]);
  
  // 创建活动
  const handleCreateCampaign = async () => {
    if (!newCampaign.name) {
      alert('请输入活动名称');
      return;
    }
    
    if (selectedGoals.length === 0) {
      alert('请选择至少一个活动目标');
      return;
    }
    
    // 构建目标权重配置
    const goals: CampaignGoalWeight[] = selectedGoals.map(goal => ({
      goal,
      weight: goalWeights[goal],
      description: GOAL_CONFIG[goal].description,
      targets: goalTargets[goal].length > 0 ? goalTargets[goal] : undefined,
    }));
    
    try {
      const created = await campaignService.create({
        ...newCampaign,
        year: currentYear,
        quarter: currentQuarter,
        goals,
        primaryGoal: newCampaign.primaryGoal || selectedGoals[0],
      });
      
      if (created) {
        setShowCreateModal(false);
        setNewCampaign({
          name: '',
          type: 'vendor_self',
          hostType: 'vendor',
          year: currentYear,
          quarter: currentQuarter,
          budget: 0,
          expectedAttendees: 0,
          status: 'draft',
          currentPhase: 'planning',
          primaryGoal: undefined,
          goals: [],
        });
        setSelectedGoals([]);
        setGoalWeights({ awareness: 0, conversion: 0, engagement: 0 });
        setGoalTargets({ awareness: [], conversion: [], engagement: [] });
        await loadData();
      }
    } catch (e) {
      console.error('Failed to create campaign:', e);
      alert('创建失败');
    }
  };
  
  // 更新活动状态
  const handleUpdateStatus = async (id: string, status: CampaignStatus) => {
    try {
      await campaignService.updateStatus(id, status);
      await loadData();
    } catch (e) {
      console.error('Failed to update status:', e);
      alert('更新状态失败');
    }
  };
  
  // 更新活动阶段
  const handleUpdatePhase = async (id: string, phase: CampaignPhase) => {
    try {
      await campaignService.updatePhase(id, phase);
      await loadData();
    } catch (e) {
      console.error('Failed to update phase:', e);
      alert('更新阶段失败');
    }
  };
  
  // 删除活动
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('确定要删除这个活动吗？')) return;
    
    try {
      await campaignService.delete(id);
      await loadData();
    } catch (e) {
      console.error('Failed to delete campaign:', e);
      alert('删除失败');
    }
  };
  
  // 查看活动详情
  const handleViewCampaign = (campaign: MarketingCampaign) => {
    navigate(`/marketing/campaigns/${campaign.id}`);
  };
  
  // 渲染状态选择器
  const renderStatusSelector = (campaign: MarketingCampaign) => {
    return (
      <Select
        value={campaign.status}
        onChange={(e) => handleUpdateStatus(campaign.id, e.target.value as CampaignStatus)}
        className="text-sm"
        options={[
          { value: 'draft', label: '草稿' },
          { value: 'pending', label: '待审批' },
          { value: 'approved', label: '已批复' },
          { value: 'in_progress', label: '进行中' },
          { value: 'completed', label: '已完成' },
          { value: 'cancelled', label: '已取消' },
        ]}
      />
    );
  };
  
  // 渲染阶段选择器
  const renderPhaseSelector = (campaign: MarketingCampaign) => {
    return (
      <Select
        value={campaign.currentPhase}
        onChange={(e) => handleUpdatePhase(campaign.id, e.target.value as CampaignPhase)}
        className="text-sm"
        options={[
          { value: 'planning', label: '计划' },
          { value: 'preparing', label: '准备' },
          { value: 'executing', label: '执行' },
          { value: 'follow_up', label: '跟进' },
          { value: 'evaluating', label: '评估' },
        ]}
      />
    );
  };
  
  return (
    <div className="container mx-auto p-6">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">营销活动管理</h1>
        <p className="text-gray-600">管理年度营销活动，从计划到评估的完整生命周期</p>
      </div>
      
      {/* 年份和季度选择 */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">年份:</label>
            <Select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="w-32"
              options={[
                { value: '2024', label: '2024年' },
                { value: '2025', label: '2025年' },
                { value: '2026', label: '2026年' },
                { value: '2027', label: '2027年' },
              ]}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">季度:</label>
            <div className="flex gap-1">
              {QUARTERS.map(q => (
                <Button
                  key={q}
                  variant={currentQuarter === q ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentQuarter(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex-1" />
          
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            创建活动
          </Button>
        </CardContent>
      </Card>
      
      {/* 季度统计 */}
      {quarterlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-blue-600">{quarterlyStats.totalActivities}</div>
              <div className="text-sm text-gray-600">总活动数</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-green-600">{quarterlyStats.vendorSelfActivities}</div>
              <div className="text-sm text-gray-600">厂商自办</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-purple-600">{quarterlyStats.partnerJointActivities}</div>
              <div className="text-sm text-gray-600">合作伙伴合办</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{cur(quarterlyStats.totalBudget)}</div>
              <div className="text-sm text-gray-600">总预算</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-orange-600">{quarterlyStats.totalExpectedAttendees}</div>
              <div className="text-sm text-gray-600">预期参会</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-teal-600">{quarterlyStats.attendanceRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">出勤率</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 过滤和搜索 */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium">状态:</label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-32"
              options={[
                { value: 'all', label: '全部' },
                { value: 'draft', label: '草稿' },
                { value: 'pending', label: '待审批' },
                { value: 'approved', label: '已批复' },
                { value: 'in_progress', label: '进行中' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' },
              ]}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">类型:</label>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-40"
              options={[
                { value: 'all', label: '全部' },
                { value: 'vendor_self', label: '厂商自办' },
                { value: 'partner_joint', label: '合作伙伴合办' },
                { value: 'mdf', label: 'MDF活动' },
              ]}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">目标:</label>
            <Select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="w-40"
              options={[
                { value: 'all', label: '全部' },
                { value: 'awareness', label: `${GOAL_CONFIG.awareness.icon} ${GOAL_CONFIG.awareness.label}` },
                { value: 'conversion', label: `${GOAL_CONFIG.conversion.icon} ${GOAL_CONFIG.conversion.label}` },
                { value: 'engagement', label: `${GOAL_CONFIG.engagement.icon} ${GOAL_CONFIG.engagement.label}` },
              ]}
            />
          </div>
          
          <div className="flex-1" />
          
          <div className="text-sm text-gray-600">
            共 {filteredCampaigns.length} 个活动
          </div>
        </CardContent>
      </Card>
      
      {/* 活动列表 */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            加载中...
          </CardContent>
        </Card>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">暂无活动</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              创建第一个活动
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map(campaign => (
            <Card key={campaign.id}>
              <CardContent>
                <div className="flex items-start gap-4">
                  {/* 活动信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <Badge className={TYPE_CONFIG[campaign.type].color}>
                        {TYPE_CONFIG[campaign.type].label}
                      </Badge>
                      <Badge className={STATUS_CONFIG[campaign.status].color}>
                        {STATUS_CONFIG[campaign.status].label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {campaign.plannedStartDate 
                            ? `${campaign.plannedStartDate} ~ ${campaign.plannedEndDate || '待定'}`
                            : '时间待定'
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {campaign.actualAttendees || 0} / {campaign.expectedAttendees || 0} 人
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{cur(campaign.budget)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>
                          {PHASE_CONFIG[campaign.currentPhase].icon} {PHASE_CONFIG[campaign.currentPhase].label}
                        </span>
                      </div>
                    </div>
                    
                    {campaign.partnerName && (
                      <div className="mt-2 text-sm text-gray-500">
                        合作伙伴: {campaign.partnerName}
                      </div>
                    )}
                    
                    {/* 活动目标显示 */}
                    {campaign.goals && campaign.goals.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-500">活动目标:</span>
                        {campaign.goals.map((g, idx) => (
                          <Badge key={idx} className={GOAL_CONFIG[g.goal].color}>
                            {GOAL_CONFIG[g.goal].icon} {GOAL_CONFIG[g.goal].label} ({g.weight}%)
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {campaign.primaryGoal && !campaign.goals && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-500">主要目标:</span>
                        <Badge className={GOAL_CONFIG[campaign.primaryGoal].color}>
                          {GOAL_CONFIG[campaign.primaryGoal].icon} {GOAL_CONFIG[campaign.primaryGoal].label}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    {renderPhaseSelector(campaign)}
                    {renderStatusSelector(campaign)}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCampaign(campaign)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* 创建活动模态框 */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建营销活动"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">活动名称 *</label>
            <Input
              value={newCampaign.name || ''}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              placeholder="请输入活动名称"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">活动类型</label>
              <Select
                value={newCampaign.type || 'vendor_self'}
                onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value as CampaignType })}
                options={[
                  { value: 'vendor_self', label: '厂商自办' },
                  { value: 'partner_joint', label: '合作伙伴合办' },
                  { value: 'mdf', label: 'MDF活动' },
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">主机类型</label>
              <Select
                value={newCampaign.hostType || 'vendor'}
                onChange={(e) => setNewCampaign({ ...newCampaign, hostType: e.target.value as 'vendor' | 'partner' })}
                options={[
                  { value: 'vendor', label: '厂商' },
                  { value: 'partner', label: '合作伙伴' },
                ]}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">活动类别</label>
              <Input
                value={newCampaign.category || ''}
                onChange={(e) => setNewCampaign({ ...newCampaign, category: e.target.value })}
                placeholder="如: 线下峰会、线下沙龙、Webinar"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">预算 (元)</label>
              <Input
                type="number"
                value={newCampaign.budget || 0}
                onChange={(e) => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">计划开始日期</label>
              <Input
                type="date"
                value={newCampaign.plannedStartDate || ''}
                onChange={(e) => setNewCampaign({ ...newCampaign, plannedStartDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">计划结束日期</label>
              <Input
                type="date"
                value={newCampaign.plannedEndDate || ''}
                onChange={(e) => setNewCampaign({ ...newCampaign, plannedEndDate: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">预期参会人数</label>
            <Input
              type="number"
              value={newCampaign.expectedAttendees || 0}
              onChange={(e) => setNewCampaign({ ...newCampaign, expectedAttendees: Number(e.target.value) })}
            />
          </div>
          
          {/* 活动目标选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">活动目标 *</label>
            <p className="text-xs text-gray-500 mb-3">选择活动的主要目标，可多选并设置权重</p>
            
            <div className="space-y-3">
              {(Object.keys(GOAL_CONFIG) as CampaignGoal[]).map((goal) => {
                const config = GOAL_CONFIG[goal];
                const isSelected = selectedGoals.includes(goal);
                const weight = goalWeights[goal];
                
                return (
                  <div
                    key={goal}
                    className={`border rounded-lg p-3 transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newGoals = [...selectedGoals, goal];
                              setSelectedGoals(newGoals);
                              // 自动分配权重
                              const defaultWeight = Math.round(100 / newGoals.length);
                              const newWeights = { ...goalWeights };
                              newGoals.forEach(g => newWeights[g] = defaultWeight);
                              setGoalWeights(newWeights);
                            } else {
                              const newGoals = selectedGoals.filter(g => g !== goal);
                              setSelectedGoals(newGoals);
                              const newWeights = { ...goalWeights };
                              newWeights[goal] = 0;
                              // 重新分配权重
                              if (newGoals.length > 0) {
                                const defaultWeight = Math.round(100 / newGoals.length);
                                newGoals.forEach(g => newWeights[g] = defaultWeight);
                              }
                              setGoalWeights(newWeights);
                            }
                          }}
                        />
                        <span className="text-lg">{config.icon}</span>
                        <div>
                          <span className="font-medium">{config.label}</span>
                          <p className="text-xs text-gray-500">{config.description}</p>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">权重:</span>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={weight}
                            onChange={(e) => {
                              const newWeights = { ...goalWeights };
                              newWeights[goal] = Math.min(100, Math.max(0, Number(e.target.value)));
                              setGoalWeights(newWeights);
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 目标值基准输入 */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="text-xs text-gray-600 mb-2 font-medium">目标值设定:</div>
                        <div className="space-y-2">
                          {goal === 'awareness' && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-24">品牌曝光量:</span>
                                <Input
                                  type="number"
                                  placeholder="目标值"
                                  value={goalTargets[goal].find(t => t.metric === 'brandExposure')?.targetValue || ''}
                                  onChange={(e) => {
                                    const targets = [...goalTargets[goal]];
                                    const idx = targets.findIndex(t => t.metric === 'brandExposure');
                                    const newTarget = { metric: 'brandExposure', targetValue: Number(e.target.value), unit: '次' };
                                    if (idx >= 0) targets[idx] = newTarget;
                                    else targets.push(newTarget);
                                    setGoalTargets({ ...goalTargets, [goal]: targets });
                                  }}
                                  className="w-28"
                                />
                                <span className="text-xs text-gray-400">次</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-24">媒体报道:</span>
                                <Input
                                  type="number"
                                  placeholder="目标值"
                                  value={goalTargets[goal].find(t => t.metric === 'mediaCoverage')?.targetValue || ''}
                                  onChange={(e) => {
                                    const targets = [...goalTargets[goal]];
                                    const idx = targets.findIndex(t => t.metric === 'mediaCoverage');
                                    const newTarget = { metric: 'mediaCoverage', targetValue: Number(e.target.value), unit: '篇' };
                                    if (idx >= 0) targets[idx] = newTarget;
                                    else targets.push(newTarget);
                                    setGoalTargets({ ...goalTargets, [goal]: targets });
                                  }}
                                  className="w-28"
                                />
                                <span className="text-xs text-gray-400">篇</span>
                              </div>
                            </>
                          )}
                          {goal === 'conversion' && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-24">预期线索数:</span>
                                <Input
                                  type="number"
                                  placeholder="目标值"
                                  value={goalTargets[goal].find(t => t.metric === 'leadsGenerated')?.targetValue || ''}
                                  onChange={(e) => {
                                    const targets = [...goalTargets[goal]];
                                    const idx = targets.findIndex(t => t.metric === 'leadsGenerated');
                                    const newTarget = { metric: 'leadsGenerated', targetValue: Number(e.target.value), unit: '个' };
                                    if (idx >= 0) targets[idx] = newTarget;
                                    else targets.push(newTarget);
                                    setGoalTargets({ ...goalTargets, [goal]: targets });
                                  }}
                                  className="w-28"
                                />
                                <span className="text-xs text-gray-400">个</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-24">预期商机数:</span>
                                <Input
                                  type="number"
                                  placeholder="目标值"
                                  value={goalTargets[goal].find(t => t.metric === 'opportunitiesCreated')?.targetValue || ''}
                                  onChange={(e) => {
                                    const targets = [...goalTargets[goal]];
                                    const idx = targets.findIndex(t => t.metric === 'opportunitiesCreated');
                                    const newTarget = { metric: 'opportunitiesCreated', targetValue: Number(e.target.value), unit: '个' };
                                    if (idx >= 0) targets[idx] = newTarget;
                                    else targets.push(newTarget);
                                    setGoalTargets({ ...goalTargets, [goal]: targets });
                                  }}
                                  className="w-28"
                                />
                                <span className="text-xs text-gray-400">个</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-24">预期成交金额:</span>
                                <Input
                                  type="number"
                                  placeholder="目标值"
                                  value={goalTargets[goal].find(t => t.metric === 'dealsValue')?.targetValue || ''}
                                  onChange={(e) => {
                                    const targets = [...goalTargets[goal]];
                                    const idx = targets.findIndex(t => t.metric === 'dealsValue');
                                    const newTarget = { metric: 'dealsValue', targetValue: Number(e.target.value), unit: '元' };
                                    if (idx >= 0) targets[idx] = newTarget;
                                    else targets.push(newTarget);
                                    setGoalTargets({ ...goalTargets, [goal]: targets });
                                  }}
                                  className="w-28"
                                />
                                <span className="text-xs text-gray-400">元</span>
                              </div>
                            </>
                          )}
                          {goal === 'engagement' && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-24">NPS评分:</span>
                                <Input
                                  type="number"
                                  placeholder="目标值"
                                  value={goalTargets[goal].find(t => t.metric === 'npsScore')?.targetValue || ''}
                                  onChange={(e) => {
                                    const targets = [...goalTargets[goal]];
                                    const idx = targets.findIndex(t => t.metric === 'npsScore');
                                    const newTarget = { metric: 'npsScore', targetValue: Number(e.target.value), unit: '分' };
                                    if (idx >= 0) targets[idx] = newTarget;
                                    else targets.push(newTarget);
                                    setGoalTargets({ ...goalTargets, [goal]: targets });
                                  }}
                                  className="w-28"
                                />
                                <span className="text-xs text-gray-400">分</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-24">客户留存率:</span>
                                <Input
                                  type="number"
                                  placeholder="目标值"
                                  value={goalTargets[goal].find(t => t.metric === 'customerRetentionRate')?.targetValue || ''}
                                  onChange={(e) => {
                                    const targets = [...goalTargets[goal]];
                                    const idx = targets.findIndex(t => t.metric === 'customerRetentionRate');
                                    const newTarget = { metric: 'customerRetentionRate', targetValue: Number(e.target.value), unit: '%' };
                                    if (idx >= 0) targets[idx] = newTarget;
                                    else targets.push(newTarget);
                                    setGoalTargets({ ...goalTargets, [goal]: targets });
                                  }}
                                  className="w-28"
                                />
                                <span className="text-xs text-gray-400">%</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {selectedGoals.length > 0 && (
              <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">权重总计:</span>
                  <span className={`font-medium ${
                    Object.values(goalWeights).reduce((a, b) => a + b, 0) === 100 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {Object.values(goalWeights).reduce((a, b) => a + b, 0)}%
                    {Object.values(goalWeights).reduce((a, b) => a + b, 0) !== 100 && ' (建议调整为100%)'}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-gray-600">主要目标:</span>
                  <Select
                    value={newCampaign.primaryGoal || ''}
                    onChange={(e) => setNewCampaign({ ...newCampaign, primaryGoal: e.target.value as CampaignGoal })}
                    options={[
                      { value: '', label: '请选择' },
                      ...selectedGoals.map(g => ({ value: g, label: GOAL_CONFIG[g].label })),
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">活动描述</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              value={newCampaign.description || ''}
              onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
              placeholder="请输入活动描述"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleCreateCampaign}>
              <Save className="w-4 h-4 mr-1" />
              创建
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 活动详情模态框 */}
      {showDetailModal && selectedCampaign && (
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedCampaign.name}
          size="xl"
        >
          <div className="space-y-6">
            {/* 基本信息 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">活动类型</div>
                  <div>{TYPE_CONFIG[selectedCampaign.type].label}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">当前阶段</div>
                  <div className="flex items-center gap-1">
                    <span>{PHASE_CONFIG[selectedCampaign.currentPhase].icon}</span>
                    <span>{PHASE_CONFIG[selectedCampaign.currentPhase].label}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">活动状态</div>
                  <Badge className={STATUS_CONFIG[selectedCampaign.status].color}>
                    {STATUS_CONFIG[selectedCampaign.status].label}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-600">预算</div>
                  <div>{cur(selectedCampaign.budget)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">实际支出</div>
                  <div>{cur(selectedCampaign.actualSpend)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">预期参会</div>
                  <div>{selectedCampaign.expectedAttendees}人</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">实际参会</div>
                  <div>{selectedCampaign.actualAttendees}人</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">报名人数</div>
                  <div>{selectedCampaign.registeredCount}人</div>
                </div>
              </div>
            </div>
            
            {/* 时间信息 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">时间安排</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">计划开始日期</div>
                  <div>{selectedCampaign.plannedStartDate || '待定'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">计划结束日期</div>
                  <div>{selectedCampaign.plannedEndDate || '待定'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">实际开始日期</div>
                  <div>{selectedCampaign.actualStartDate || '待定'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">实际结束日期</div>
                  <div>{selectedCampaign.actualEndDate || '待定'}</div>
                </div>
              </div>
            </div>
            
            {/* 描述 */}
            {selectedCampaign.description && (
              <div>
                <h3 className="text-lg font-semibold mb-3">活动描述</h3>
                <p className="text-gray-700">{selectedCampaign.description}</p>
              </div>
            )}
            
            {/* 转化数据 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">转化数据</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">产生线索</div>
                  <div className="text-2xl font-bold text-blue-600">{selectedCampaign.leadsGenerated}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">创建商机</div>
                  <div className="text-2xl font-bold text-green-600">{selectedCampaign.dealsCreated}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">商机金额</div>
                  <div className="text-2xl font-bold text-purple-600">{cur(selectedCampaign.dealsValue)}</div>
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowDetailModal(false);
                  navigate(`/marketing/campaigns/${selectedCampaign.id}`);
                }}
              >
                详细管理
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
