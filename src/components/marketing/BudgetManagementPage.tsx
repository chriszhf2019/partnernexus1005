import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../lib/utils';
import { campaignService } from '../../services/campaign-service';
import type { AnnualMarketingBudget, BudgetStatus, CampaignGoal, MarketingCampaign } from '../../types';
import {
  DollarSign,
  TrendingUp,
  PieChart,
  Calendar,
  Edit,
  Save,
  Check,
  X,
  Plus,
  ChevronRight,
  Target,
  Award,
  Users,
  BarChart3,
} from 'lucide-react';

const YEARS = [2024, 2025, 2026, 2027, 2028];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// 状态配置
const STATUS_CONFIG: Record<BudgetStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已批复', color: 'bg-green-100 text-green-800' },
  locked: { label: '已锁定', color: 'bg-red-100 text-red-800' },
};

// 活动目标配置
const GOAL_CONFIG: Record<CampaignGoal, { label: string; color: string; icon: string }> = {
  awareness: { label: '打声量', color: 'bg-orange-100 text-orange-800', icon: '📢' },
  conversion: { label: '做转化', color: 'bg-green-100 text-green-800', icon: '🎯' },
  engagement: { label: '提粘性', color: 'bg-purple-100 text-purple-800', icon: '❤️' },
};

// 按目标统计的数据类型
interface GoalStats {
  goal: CampaignGoal;
  campaignCount: number;
  totalBudget: number;
  totalSpent: number;
  expectedAttendees: number;
  actualAttendees: number;
}

export const BudgetManagementPage: React.FC = () => {
  const { year: urlYear } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  
  const [currentYear, setCurrentYear] = useState(Number(urlYear) || new Date().getFullYear());
  const [budget, setBudget] = useState<AnnualMarketingBudget | null>(null);
  const [budgetUsage, setBudgetUsage] = useState<{
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    byQuarter: { quarter: string; budget: number; spent: number; remaining: number; campaignCount: number }[];
    byCategory: { category: string; budget: number; spent: number; remaining: number; campaignCount: number }[];
  } | null>(null);
  
  const [goalStats, setGoalStats] = useState<GoalStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newBudgetAmount, setNewBudgetAmount] = useState(0);
  const [editingQuarter, setEditingQuarter] = useState<string | null>(null);
  const [quarterBudget, setQuarterBudget] = useState(0);
  
  const cur = (v: number) => formatCurrency(v, 'CNY');
  
  // 加载数据
  useEffect(() => {
    loadData();
  }, [currentYear]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [budgetData, usageData] = await Promise.all([
        campaignService.getAnnualBudget(currentYear),
        campaignService.getBudgetUsage(currentYear),
      ]);
      
      setBudget(budgetData || null);
      setBudgetUsage(usageData || null);
      
      if (budgetData) {
        setNewBudgetAmount(budgetData.totalBudget);
      }
      
      // 加载活动列表并按目标统计
      const campaigns = await campaignService.list(currentYear, 'all');
      const stats: Record<CampaignGoal, GoalStats> = {
        awareness: { goal: 'awareness', campaignCount: 0, totalBudget: 0, totalSpent: 0, expectedAttendees: 0, actualAttendees: 0 },
        conversion: { goal: 'conversion', campaignCount: 0, totalBudget: 0, totalSpent: 0, expectedAttendees: 0, actualAttendees: 0 },
        engagement: { goal: 'engagement', campaignCount: 0, totalBudget: 0, totalSpent: 0, expectedAttendees: 0, actualAttendees: 0 },
      };
      
      campaigns.forEach((campaign: MarketingCampaign) => {
        if (campaign.goals && campaign.goals.length > 0) {
          campaign.goals.forEach(g => {
            const goalWeight = g.weight / 100;
            stats[g.goal].campaignCount += 1;
            stats[g.goal].totalBudget += (campaign.budget || 0) * goalWeight;
            stats[g.goal].totalSpent += (campaign.actualSpend || 0) * goalWeight;
            stats[g.goal].expectedAttendees += (campaign.expectedAttendees || 0) * goalWeight;
            stats[g.goal].actualAttendees += (campaign.actualAttendees || 0) * goalWeight;
          });
        } else if (campaign.primaryGoal) {
          stats[campaign.primaryGoal].campaignCount += 1;
          stats[campaign.primaryGoal].totalBudget += campaign.budget || 0;
          stats[campaign.primaryGoal].totalSpent += campaign.actualSpend || 0;
          stats[campaign.primaryGoal].expectedAttendees += campaign.expectedAttendees || 0;
          stats[campaign.primaryGoal].actualAttendees += campaign.actualAttendees || 0;
        }
      });
      
      setGoalStats(Object.values(stats).filter(s => s.campaignCount > 0));
    } catch (e) {
      console.error('Failed to load budget data:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 创建年度预算
  const handleCreateBudget = async () => {
    if (newBudgetAmount <= 0) {
      alert('请输入有效的预算金额');
      return;
    }
    
    try {
      const created = await campaignService.createAnnualBudget({
        year: currentYear,
        totalBudget: newBudgetAmount,
      });
      
      if (created) {
        setShowCreateModal(false);
        await loadData();
        alert('年度预算创建成功！');
      }
    } catch (e) {
      console.error('Failed to create budget:', e);
      alert('创建预算失败');
    }
  };
  
  // 更新年度预算
  const handleUpdateBudget = async () => {
    if (!budget || newBudgetAmount <= 0) return;
    
    try {
      const updated = await campaignService.updateAnnualBudget(budget.id, {
        totalBudget: newBudgetAmount,
      });
      
      if (updated) {
        setShowEditModal(false);
        await loadData();
        alert('预算更新成功！');
      }
    } catch (e) {
      console.error('Failed to update budget:', e);
      alert('更新预算失败');
    }
  };
  
  // 更新预算状态
  const handleUpdateStatus = async (status: BudgetStatus) => {
    if (!budget) return;
    
    try {
      await campaignService.updateAnnualBudget(budget.id, { status });
      await loadData();
    } catch (e) {
      console.error('Failed to update status:', e);
      alert('更新状态失败');
    }
  };
  
  // 编辑季度预算
  const handleEditQuarter = (quarter: string) => {
    const qb = budget?.quarterlyBudgets?.find(q => q.quarter === quarter);
    setEditingQuarter(quarter);
    setQuarterBudget(qb?.allocatedBudget || 0);
  };
  
  // 保存季度预算
  const handleSaveQuarter = async () => {
    if (!budget || !editingQuarter) return;
    
    try {
      await campaignService.updateQuarterlyBudget(budget.id, editingQuarter, quarterBudget);
      setEditingQuarter(null);
      await loadData();
    } catch (e) {
      console.error('Failed to update quarterly budget:', e);
      alert('更新季度预算失败');
    }
  };
  
  // 计算使用率
  const getUsageRate = (spent: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((spent / total) * 100);
  };
  
  // 获取状态颜色
  const getUsageColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">加载中...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">年度营销预算</h1>
          <p className="text-gray-600 mt-1">管理年度营销预算，按季度分配活动预算</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            options={YEARS.map(y => ({ value: String(y), label: `${y}年` }))}
          />
          {!budget && (
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <DollarSign className="w-4 h-4 mr-1" />
              创建年度预算
            </Button>
          )}
        </div>
      </div>
      
      {!budget ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">暂无{currentYear}年度预算</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              创建年度预算
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 预算概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="text-center">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{cur(budget.totalBudget)}</div>
                <div className="text-sm text-gray-600">年度总预算</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="text-center">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{cur(budgetUsage?.totalSpent || 0)}</div>
                <div className="text-sm text-gray-600">已支出</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="text-center">
                <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <PieChart className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600">{cur(budgetUsage?.remaining || budget.remaining)}</div>
                <div className="text-sm text-gray-600">剩余预算</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="text-center">
                <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-2">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold">
                  {getUsageRate(budgetUsage?.totalSpent || 0, budget.totalBudget)}%
                </div>
                <div className="text-sm text-gray-600">使用率</div>
              </CardContent>
            </Card>
          </div>
          
          {/* 按目标统计 */}
          {goalStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>按活动目标预算分配</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {goalStats.map((stat) => {
                    const config = GOAL_CONFIG[stat.goal];
                    const usageRate = stat.totalBudget > 0 
                      ? Math.round((stat.totalSpent / stat.totalBudget) * 100) 
                      : 0;
                    return (
                      <div key={stat.goal} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">{config.icon}</span>
                          <span className="font-semibold text-lg">{config.label}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">活动数量</span>
                            <span className="font-medium">{stat.campaignCount} 个</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">分配预算</span>
                            <span className="font-medium">{cur(stat.totalBudget)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">已支出</span>
                            <span className="font-medium text-green-600">{cur(stat.totalSpent)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">预期参会</span>
                            <span className="font-medium">{Math.round(stat.expectedAttendees)} 人</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">实际参会</span>
                            <span className="font-medium text-blue-600">{Math.round(stat.actualAttendees)} 人</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>使用率</span>
                            <span className={usageRate > 100 ? 'text-red-600' : 'text-gray-600'}>
                              {usageRate}%
                              {usageRate > 100 && ' (超支)'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${usageRate > 100 ? 'bg-red-500' : usageRate > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, usageRate)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 预算使用进度 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>预算使用进度</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_CONFIG[budget.status].color}>
                    {STATUS_CONFIG[budget.status].label}
                  </Badge>
                  {budget.status === 'draft' && (
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('pending')}>
                      提交审批
                    </Button>
                  )}
                  {budget.status === 'pending' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('approved')}>
                        <Check className="w-4 h-4 mr-1" />
                        批准
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus('draft')}>
                        <X className="w-4 h-4 mr-1" />
                        退回
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                    <Edit className="w-4 h-4 mr-1" />
                    编辑预算
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>已使用: {cur(budgetUsage?.totalSpent || 0)}</span>
                  <span>总计: {cur(budget.totalBudget)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${getUsageColor(getUsageRate(budgetUsage?.totalSpent || 0, budget.totalBudget))}`}
                    style={{ width: `${getUsageRate(budgetUsage?.totalSpent || 0, budget.totalBudget)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 季度预算明细 */}
          <Card>
            <CardHeader>
              <CardTitle>季度预算分配</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {QUARTERS.map((quarter, index) => {
                  const qData = budgetUsage?.byQuarter?.find(q => q.quarter === quarter);
                  const qBudget = budget.quarterlyBudgets?.find(qb => qb.quarter === quarter);
                  const isEditing = editingQuarter === quarter;
                  const usageRate = qData ? getUsageRate(qData.spent, qData.budget) : 0;
                  
                  return (
                    <div key={quarter} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{quarter}</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {qData?.campaignCount || 0} 个活动
                          </Badge>
                        </div>
                        {!isEditing ? (
                          <Button variant="ghost" size="sm" onClick={() => handleEditQuarter(quarter)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingQuarter(null)}>
                              取消
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleSaveQuarter}>
                              <Save className="w-4 h-4 mr-1" />
                              保存
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">分配预算</div>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={quarterBudget}
                              onChange={(e) => setQuarterBudget(Number(e.target.value))}
                            />
                          ) : (
                            <div className="text-lg font-bold">{cur(qBudget?.allocatedBudget || 0)}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">已支出</div>
                          <div className="text-lg font-bold text-green-600">{cur(qData?.spent || 0)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">剩余</div>
                          <div className="text-lg font-bold text-purple-600">{cur(qData?.remaining || 0)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">使用率</div>
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-bold">{usageRate}%</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getUsageColor(usageRate)}`}
                                style={{ width: `${usageRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* 分类预算 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>按类别预算使用</CardTitle>
              </CardHeader>
              <CardContent>
                {(!budgetUsage?.byCategory || budgetUsage.byCategory.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p>暂无分类数据</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {budgetUsage.byCategory.map((cat) => {
                      const rate = getUsageRate(cat.spent, cat.budget);
                      return (
                        <div key={cat.category} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">{cat.category}</span>
                              <Badge className="bg-gray-100 text-gray-800">
                                {cat.campaignCount} 个活动
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">{rate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getUsageColor(rate)}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>已用: {cur(cat.spent)}</span>
                            <span>预算: {cur(cat.budget)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>活动统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span>本年活动总数</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {budgetUsage?.byQuarter?.reduce((sum, q) => sum + q.campaignCount, 0) || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span>预期参会人数</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {budgetUsage?.byQuarter?.reduce((sum, q) => sum + 100, 0) || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span>平均活动预算</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">
                      {cur(
                        budget.totalBudget /
                        (budgetUsage?.byQuarter?.reduce((sum, q) => sum + q.campaignCount, 0) || 1)
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/marketing/campaigns')}
                >
                  <ChevronRight className="w-4 h-4 mr-1" />
                  查看所有活动
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/marketing/campaigns?year=${currentYear}`)}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  查看今年活动
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 创建预算模态框 */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`创建 ${currentYear} 年年度预算`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">年度总预算 (元)</label>
            <Input
              type="number"
              value={newBudgetAmount}
              onChange={(e) => setNewBudgetAmount(Number(e.target.value))}
              placeholder="请输入年度总预算"
            />
            <p className="text-sm text-gray-500 mt-1">
              预算将平均分配到四个季度
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleCreateBudget}>
              <DollarSign className="w-4 h-4 mr-1" />
              创建预算
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 编辑预算模态框 */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑年度预算"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">年度总预算 (元)</label>
            <Input
              type="number"
              value={newBudgetAmount}
              onChange={(e) => setNewBudgetAmount(Number(e.target.value))}
            />
            <p className="text-sm text-gray-500 mt-1">
              修改总预算不会自动调整各季度分配
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleUpdateBudget}>
              <Save className="w-4 h-4 mr-1" />
              保存修改
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
