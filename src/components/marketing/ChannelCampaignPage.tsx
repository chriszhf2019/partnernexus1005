import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../lib/utils';
import { campaignService } from '../../services/campaign-service';
import { partnerService } from '../../services/partner-service';
import type { MarketingCampaign, CampaignStatus, Partner } from '../../types';
import {
  ArrowLeft,
  Plus,
  Users,
  Calendar,
  DollarSign,
  Send,
  Check,
  X,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Briefcase,
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

// 合作伙伴活动状态
type PartnerCampaignStatus = 'distributed' | 'planning' | 'pending_review' | 'approved' | 'in_progress' | 'completed' | 'rejected';

const PARTNER_STATUS_CONFIG: Record<PartnerCampaignStatus, { label: string; color: string; icon: string }> = {
  distributed: { label: '已下发', color: 'bg-blue-100 text-blue-800', icon: '📨' },
  planning: { label: '计划中', color: 'bg-yellow-100 text-yellow-800', icon: '📋' },
  pending_review: { label: '待审核', color: 'bg-orange-100 text-orange-800', icon: '⏳' },
  approved: { label: '已批准', color: 'bg-green-100 text-green-800', icon: '✅' },
  in_progress: { label: '执行中', color: 'bg-cyan-100 text-cyan-800', icon: '🚀' },
  completed: { label: '已完成', color: 'bg-purple-100 text-purple-800', icon: '🎉' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-800', icon: '❌' },
};

interface PartnerCampaign {
  id: string;
  campaignId: string;
  partnerId: string;
  partnerName: string;
  status: PartnerCampaignStatus;
  allocatedBudget: number;
  actualSpend: number;
  plannedDate?: string;
  actualDate?: string;
  submittedPlan?: any;
  reviewComments?: string;
  distributedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const ChannelCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentQuarter, setCurrentQuarter] = useState(() => {
    const month = new Date().getMonth();
    return `Q${Math.floor(month / 3) + 1}`;
  });
  
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerCampaigns, setPartnerCampaigns] = useState<PartnerCampaign[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
  const [selectedPartnerCampaign, setSelectedPartnerCampaign] = useState<PartnerCampaign | null>(null);
  
  // 分发活动表单
  const [distributeForm, setDistributeForm] = useState({
    partnerId: '',
    allocatedBudget: 0,
    plannedDate: '',
  });
  
  // 计划提交表单
  const [planForm, setPlanForm] = useState({
    plannedActivities: '',
    targetAudience: '',
    expectedOutcome: '',
    budgetBreakdown: '',
  });
  
  // 审核表单
  const [reviewForm, setReviewForm] = useState({
    approved: true,
    comments: '',
    adjustedBudget: 0,
  });
  
  const cur = (v: number) => formatCurrency(v, 'CNY');
  
  // 加载数据
  useEffect(() => {
    loadData();
  }, [currentYear, currentQuarter]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [campaignList, partnerList] = await Promise.all([
        campaignService.list(currentYear, currentQuarter),
        partnerService.list(),
      ]);
      
      // 只显示合作伙伴类型的活动
      const jointCampaigns = campaignList.filter(c => c.type === 'partner_joint');
      setCampaigns(jointCampaigns);
      setPartners((partnerList as any)?.data || partnerList || []);
      
      // TODO: 从数据库加载合作伙伴活动数据
      // 目前模拟数据
      setPartnerCampaigns([]);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 分发活动给合作伙伴
  const handleDistribute = async () => {
    if (!selectedCampaign || !distributeForm.partnerId) {
      alert('请选择合作伙伴并填写预算');
      return;
    }
    
    try {
      // TODO: 调用 API 分发活动
      alert('活动已下发成功！');
      setShowDistributeModal(false);
      loadData();
    } catch (e) {
      console.error('Failed to distribute campaign:', e);
      alert('下发失败');
    }
  };
  
  // 提交计划
  const handleSubmitPlan = async () => {
    if (!selectedPartnerCampaign) return;
    
    try {
      // TODO: 调用 API 提交计划
      alert('计划已提交！');
      setShowPlanModal(false);
      loadData();
    } catch (e) {
      console.error('Failed to submit plan:', e);
      alert('提交失败');
    }
  };
  
  // 审核计划
  const handleReview = async () => {
    if (!selectedPartnerCampaign) return;
    
    try {
      // TODO: 调用 API 审核计划
      alert(reviewForm.approved ? '已批准计划！' : '已驳回计划！');
      setShowReviewModal(false);
      loadData();
    } catch (e) {
      console.error('Failed to review plan:', e);
      alert('审核失败');
    }
  };
  
  // 获取活动详情
  const handleViewCampaign = (campaign: MarketingCampaign) => {
    navigate(`/marketing/campaigns/${campaign.id}`);
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
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" onClick={() => navigate('/marketing')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">渠道活动管理</h1>
        </div>
        <p className="text-gray-600 ml-12">管理合作伙伴合办活动，下发任务、审核计划、跟踪执行</p>
      </div>
      
      {/* 筛选 */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">年份:</label>
              <Select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                options={[2024, 2025, 2026, 2027].map(y => ({ value: String(y), label: `${y}年` }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">季度:</label>
              <Select
                value={currentQuarter}
                onChange={(e) => setCurrentQuarter(e.target.value)}
                options={QUARTERS.map(q => ({ value: q, label: q }))}
              />
            </div>
            <div className="flex-1" />
            <Button variant="primary" onClick={() => navigate('/marketing/campaigns')}>
              <Plus className="w-4 h-4 mr-1" />
              创建活动
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 合作伙伴活动列表 */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">暂无合作伙伴合办活动</p>
              <p className="text-sm text-gray-400 mb-4">
                创建活动时选择"合作伙伴合办"类型即可在此管理
              </p>
              <Button variant="primary" onClick={() => navigate('/marketing/campaigns')}>
                <Plus className="w-4 h-4 mr-1" />
                创建活动
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => {
            const pc = partnerCampaigns.find(p => p.campaignId === campaign.id);
            
            return (
              <Card key={campaign.id}>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        <Badge className={STATUS_CONFIG[campaign.status].color}>
                          {STATUS_CONFIG[campaign.status].label}
                        </Badge>
                        {pc && (
                          <Badge className={PARTNER_STATUS_CONFIG[pc.status].color}>
                            {PARTNER_STATUS_CONFIG[pc.status].icon} {PARTNER_STATUS_CONFIG[pc.status].label}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">合作伙伴:</span>
                          <span className="ml-1 font-medium">{pc?.partnerName || '未指定'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">分配预算:</span>
                          <span className="ml-1 font-medium">{pc ? cur(pc.allocatedBudget) : '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">实际支出:</span>
                          <span className="ml-1 font-medium text-green-600">{pc ? cur(pc.actualSpend) : '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">计划日期:</span>
                          <span className="ml-1 font-medium">{pc?.plannedDate || '-'}</span>
                        </div>
                      </div>
                      
                      {pc?.reviewComments && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <span className="text-gray-500">审核意见:</span>
                          <span className="ml-1">{pc.reviewComments}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {pc?.status === 'distributed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPartnerCampaign(pc);
                            setShowPlanModal(true);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          提交计划
                        </Button>
                      )}
                      
                      {pc?.status === 'pending_review' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedPartnerCampaign(pc);
                            setReviewForm({
                              approved: true,
                              comments: '',
                              adjustedBudget: pc.allocatedBudget,
                            });
                            setShowReviewModal(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          审核计划
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCampaign(campaign)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* 快捷操作 */}
                  {!pc && (
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setDistributeForm({
                            partnerId: '',
                            allocatedBudget: campaign.budget,
                            plannedDate: campaign.plannedStartDate || '',
                          });
                          setShowDistributeModal(true);
                        }}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        下发活动
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      {/* 流程说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>合作伙伴活动流程</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
              <div>
                <div className="font-medium">下发活动</div>
                <div className="text-sm text-gray-500">厂商向合作伙伴下发活动任务</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold">2</div>
              <div>
                <div className="font-medium">提交计划</div>
                <div className="text-sm text-gray-500">合作伙伴提交详细执行计划</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">3</div>
              <div>
                <div className="font-medium">审核计划</div>
                <div className="text-sm text-gray-500">厂商审核并批复计划</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">4</div>
              <div>
                <div className="font-medium">执行活动</div>
                <div className="text-sm text-gray-500">合作伙伴执行活动</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">5</div>
              <div>
                <div className="font-medium">活动评估</div>
                <div className="text-sm text-gray-500">评估活动效果</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 下发活动模态框 */}
      <Modal
        open={showDistributeModal}
        onClose={() => setShowDistributeModal(false)}
        title="下发活动给合作伙伴"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">选择合作伙伴 *</label>
            <Select
              value={distributeForm.partnerId}
              onChange={(e) => setDistributeForm({ ...distributeForm, partnerId: e.target.value })}
              options={[
                { value: '', label: '请选择合作伙伴' },
                ...(partners.map(p => ({ value: p.id, label: p.name })) || []),
              ]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">分配预算 (元)</label>
            <Input
              type="number"
              value={distributeForm.allocatedBudget}
              onChange={(e) => setDistributeForm({ ...distributeForm, allocatedBudget: Number(e.target.value) })}
            />
            <p className="text-sm text-gray-500 mt-1">
              活动总预算: {selectedCampaign ? cur(selectedCampaign.budget) : 0}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">计划执行日期</label>
            <Input
              type="date"
              value={distributeForm.plannedDate}
              onChange={(e) => setDistributeForm({ ...distributeForm, plannedDate: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDistributeModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleDistribute}>
              <Send className="w-4 h-4 mr-1" />
              下发活动
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 提交计划模态框 */}
      <Modal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="提交活动执行计划"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <span className="font-medium">活动:</span> {selectedPartnerCampaign?.partnerName} - 合作活动
            </div>
            <div className="text-sm text-blue-800 mt-1">
              <span className="font-medium">分配预算:</span> {selectedPartnerCampaign ? cur(selectedPartnerCampaign.allocatedBudget) : 0}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">计划活动内容 *</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              value={planForm.plannedActivities}
              onChange={(e) => setPlanForm({ ...planForm, plannedActivities: e.target.value })}
              placeholder="请详细描述计划开展的活动内容"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">目标受众 *</label>
            <Input
              value={planForm.targetAudience}
              onChange={(e) => setPlanForm({ ...planForm, targetAudience: e.target.value })}
              placeholder="请描述目标受众群体"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">预期成果 *</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              value={planForm.expectedOutcome}
              onChange={(e) => setPlanForm({ ...planForm, expectedOutcome: e.target.value })}
              placeholder="请描述预期的活动效果和成果"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">预算明细</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              value={planForm.budgetBreakdown}
              onChange={(e) => setPlanForm({ ...planForm, budgetBreakdown: e.target.value })}
              placeholder="请列出预算分配明细"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPlanModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmitPlan}>
              <Check className="w-4 h-4 mr-1" />
              提交计划
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* 审核计划模态框 */}
      <Modal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="审核活动计划"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-800">
              <span className="font-medium">合作伙伴:</span> {selectedPartnerCampaign?.partnerName}
            </div>
            <div className="text-sm text-gray-800 mt-1">
              <span className="font-medium">分配预算:</span> {selectedPartnerCampaign ? cur(selectedPartnerCampaign.allocatedBudget) : 0}
            </div>
          </div>
          
          {selectedPartnerCampaign?.submittedPlan && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">提交的计划:</div>
              <div className="text-sm text-blue-700">
                <p><strong>活动内容:</strong> {selectedPartnerCampaign.submittedPlan.plannedActivities}</p>
                <p className="mt-1"><strong>目标受众:</strong> {selectedPartnerCampaign.submittedPlan.targetAudience}</p>
                <p className="mt-1"><strong>预期成果:</strong> {selectedPartnerCampaign.submittedPlan.expectedOutcome}</p>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">审核结果</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={reviewForm.approved}
                  onChange={() => setReviewForm({ ...reviewForm, approved: true })}
                />
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>批准</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!reviewForm.approved}
                  onChange={() => setReviewForm({ ...reviewForm, approved: false })}
                />
                <XCircle className="w-5 h-5 text-red-600" />
                <span>驳回</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {reviewForm.approved ? '调整后预算' : '驳回原因'}
            </label>
            {reviewForm.approved ? (
              <Input
                type="number"
                value={reviewForm.adjustedBudget}
                onChange={(e) => setReviewForm({ ...reviewForm, adjustedBudget: Number(e.target.value) })}
              />
            ) : (
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={reviewForm.comments}
                onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                placeholder="请说明驳回原因"
              />
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">审核意见</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              value={reviewForm.comments}
              onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
              placeholder="如有其他意见请在此说明"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleReview}
              className={reviewForm.approved ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {reviewForm.approved ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  批准计划
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" />
                  驳回计划
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
