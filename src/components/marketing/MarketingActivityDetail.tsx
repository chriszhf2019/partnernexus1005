import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MarketingEvaluation } from './MarketingEvaluation';
import { ExecutionPhase } from './ExecutionPhase';
import { MarketingMaturityTracker } from '../LifecycleTracker';
import { marketingMaturityService } from '../../services/lifecycle-service';
import type { MarketingMaturityHealth, MarketingMaturityEvent, MarketingCampaign } from '../../types';
import { 
  ArrowLeft, Edit, Plus, Trash2, Upload, FileSpreadsheet,
  Calendar, Users, ClipboardList, CheckSquare, Star,
  TrendingUp, MessageSquare, Phone, User, Building2,
  Target, Zap, Gift, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

interface ActivityDetailProps {
  id?: string;
}

export const MarketingActivityDetail = ({ id }: ActivityDetailProps) => {
  const { activityId: paramId } = useParams();
  const activityId = id || paramId || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'arrangement' | 'execution' | 'evaluation'>('arrangement');

  // 关系深度生命周期
  const [maturityHealth, setMaturityHealth] = useState<MarketingMaturityHealth | null>(null);
  const [maturityEvents, setMaturityEvents] = useState<MarketingMaturityEvent[]>([]);

  // 物料管理
  const [materials, setMaterials] = useState<any[]>([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', description: '', type: 'other', quantity: 0, responsible_person: '', deadline: '' });

  // 客户名单管理
  const [guests, setGuests] = useState<any[]>([]);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', company: '', title: '', phone: '', email: '', partner_id: '', partner_name: '', assigned_to: '', notes: '' });
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (!activityId) { setLoading(false); return; }
    loadActivityData();
  }, [activityId]);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      const { data: activityData } = await supabase
        .from('marketing_activities')
        .select('*')
        .eq('id', activityId)
        .single();
      setActivity(activityData);

      const { data: materialsData } = await supabase
        .from('marketing_materials')
        .select('*')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false });
      setMaterials(materialsData || []);

      const { data: guestsData } = await supabase
        .from('marketing_guests')
        .select('*')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false });
      setGuests(guestsData || []);

      // 检查并创建默认执行阶段
      const { data: phasesData } = await supabase
        .from('marketing_execution_phases')
        .select('*')
        .eq('activity_id', activityId);
      if (!phasesData || phasesData.length === 0) {
        createDefaultPhases();
      }

      // 4支柱健康度评估
      if (activityData) {
        // 将 marketing_activities 转换为 MarketingCampaign 结构
        const campaignLike: MarketingCampaign = {
          id: activityData.id,
          name: activityData.name,
          type: (activityData.type as any) || 'vendor_self',
          hostType: 'vendor',
          year: new Date(activityData.start_date || activityData.created_at).getFullYear(),
          quarter: `Q${Math.floor(new Date(activityData.start_date || activityData.created_at).getMonth() / 3) + 1}`,
          category: activityData.activity_type,
          region: activityData.region,
          city: activityData.city,
          budget: typeof activityData.budget === 'number' ? activityData.budget : 0,
          actualSpend: typeof activityData.actual_cost === 'number' ? activityData.actual_cost : 0,
          approvedAmount: typeof activityData.approved_budget === 'number' ? activityData.approved_budget : 0,
          plannedStartDate: activityData.start_date,
          plannedEndDate: activityData.end_date,
          actualStartDate: activityData.actual_start_date,
          actualEndDate: activityData.actual_end_date,
          expectedAttendees: activityData.expected_attendees || activityData.guest_count_expected || 0,
          actualAttendees: activityData.actual_attendees || activityData.attendance_count || 0,
          registeredCount: guestsData ? guestsData.length : (activityData.registered_count || 0),
          checkedInCount: activityData.checked_in_count || 0,
          status: (activityData.status as any) || 'pending',
          currentPhase: (activityData.phase as any) || 'planning',
          partnerId: activityData.partner_id,
          partnerName: activityData.partner_name,
          responsiblePerson: activityData.responsible_person,
          description: activityData.description,
          hasEvaluation: !!activityData.evaluation_score,
          leadsGenerated: activityData.leads_generated || 0,
          dealsCreated: activityData.deals_created || 0,
          dealsValue: activityData.deals_value || 0,
          createdAt: activityData.created_at,
          updatedAt: activityData.updated_at,
        };
        const [health, events] = await Promise.all([
          marketingMaturityService.calculateHealth(activityData.id, campaignLike),
          marketingMaturityService.getEvents(activityData.id),
        ]);
        setMaturityHealth(health);
        setMaturityEvents(events);
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    }
    setLoading(false);
  };

  const createDefaultPhases = async () => {
    const defaultPhases = [
      { name: '活动前准备', description: '活动策划、场地预订、物料准备', phase_order: 1, status: 'pending' },
      { name: '宣传推广', description: '微信公众号推广、邮件邀请、社交媒体推广', phase_order: 2, status: 'pending' },
      { name: '客户邀请', description: '发送邀请函、确认参加、收集信息', phase_order: 3, status: 'pending' },
      { name: '活动执行', description: '签到、内容分享、互动环节', phase_order: 4, status: 'pending' },
      { name: '活动收尾', description: '现场清理、数据整理、感谢邮件', phase_order: 5, status: 'pending' }
    ];

    for (const phase of defaultPhases) {
      await supabase.from('marketing_execution_phases').insert({
        activity_id: activityId,
        ...phase
      });
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name) return;
    try {
      await supabase.from('marketing_materials').insert({
        activity_id: activityId,
        ...newMaterial
      });
      setNewMaterial({ name: '', description: '', type: 'other', quantity: 0, responsible_person: '', deadline: '' });
      setShowMaterialForm(false);
      loadActivityData();
    } catch (e) {
      alert('添加物料失败');
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('确定要删除这个物料吗？')) return;
    await supabase.from('marketing_materials').delete().eq('id', materialId);
    loadActivityData();
  };

  const handleAddGuest = async () => {
    if (!newGuest.name) return;
    try {
      await supabase.from('marketing_guests').insert({
        activity_id: activityId,
        ...newGuest
      });
      setNewGuest({ name: '', company: '', title: '', phone: '', email: '', partner_id: '', partner_name: '', assigned_to: '', notes: '' });
      setShowGuestForm(false);
      loadActivityData();
    } catch (e) {
      alert('添加客户失败');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('确定要删除这个客户吗？')) return;
    await supabase.from('marketing_guests').delete().eq('id', guestId);
    loadActivityData();
  };

  const handleUpdateGuestStatus = async (guestId: string, status: string) => {
    await supabase.from('marketing_guests').update({ status }).eq('id', guestId);
    loadActivityData();
  };

  const handleImportGuests = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      const header = rows[0].split('\t');
      const nameIndex = header.findIndex(h => h.includes('姓名') || h.includes('name'));
      const companyIndex = header.findIndex(h => h.includes('公司') || h.includes('company'));
      const titleIndex = header.findIndex(h => h.includes('职位') || h.includes('title'));
      const phoneIndex = header.findIndex(h => h.includes('电话') || h.includes('phone'));

      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split('\t');
        if (cells[nameIndex]) {
          await supabase.from('marketing_guests').insert({
            activity_id: activityId,
            name: cells[nameIndex] || '',
            company: cells[companyIndex] || '',
            title: cells[titleIndex] || '',
            phone: cells[phoneIndex] || ''
          });
        }
      }
      loadActivityData();
      setShowImportModal(false);
      e.target.value = '';
    } catch (e) {
      alert('导入失败，请确保文件是制表符分隔的格式');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-neutral-500 bg-neutral-50';
      case 'blocked': return 'text-red-600 bg-red-50';
      default: return 'text-neutral-500 bg-neutral-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'pending': return '待处理';
      case 'blocked': return '已阻塞';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-neutral-400">加载中...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-lg font-semibold text-neutral-400">未找到活动</p>
        <button onClick={() => navigate('/marketing')} className="text-sm text-blue-500 hover:underline">返回营销管理</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/marketing')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{activity.name}</h1>
          <p className="text-sm text-neutral-500">
            {activity.type} · {activity.event_date} · {activity.location}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/marketing/edit/${activityId}`)}>
          <Edit className="w-4 h-4 mr-2" />
          编辑
        </Button>
      </div>

      <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('arrangement')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'arrangement'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <ClipboardList className="w-4 h-4 inline-block mr-2" />
          活动具体安排
        </button>
        <button
          onClick={() => setActiveTab('execution')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'execution'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline-block mr-2" />
          活动执行过程
        </button>
        <button
          onClick={() => setActiveTab('evaluation')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'evaluation'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Star className="w-4 h-4 inline-block mr-2" />
          活动后评估
        </button>
      </div>

      {activeTab === 'arrangement' && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  活动物料清单
                </CardTitle>
                <Button size="sm" onClick={() => setShowMaterialForm(!showMaterialForm)}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加物料
                </Button>
              </CardHeader>
              <CardContent>
                {showMaterialForm && (
                  <div className="p-4 bg-neutral-50 rounded-lg space-y-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-neutral-600">物料名称</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newMaterial.name}
                          onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-600">类型</label>
                        <select
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newMaterial.type}
                          onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value })}
                        >
                          <option value="venue">场地</option>
                          <option value="equipment">设备</option>
                          <option value="materials">物资</option>
                          <option value="promotion">宣传物料</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-600">数量</label>
                        <input
                          type="number"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newMaterial.quantity}
                          onChange={e => setNewMaterial({ ...newMaterial, quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-600">负责人</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newMaterial.responsible_person}
                          onChange={e => setNewMaterial({ ...newMaterial, responsible_person: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-600">完成期限</label>
                        <input
                          type="date"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newMaterial.deadline}
                          onChange={e => setNewMaterial({ ...newMaterial, deadline: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">备注</label>
                      <textarea
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        rows={2}
                        value={newMaterial.description}
                        onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddMaterial}>保存</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowMaterialForm(false)}>取消</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {materials.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-4">暂无物料</p>
                  ) : (
                    materials.map(material => (
                      <div key={material.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                        <div>
                          <p className="font-medium">{material.name}</p>
                          <p className="text-sm text-neutral-500">
                            {material.type === 'venue' ? '场地' : 
                             material.type === 'equipment' ? '设备' :
                             material.type === 'materials' ? '物资' :
                             material.type === 'promotion' ? '宣传物料' : '其他'} · {material.quantity}件 · {material.responsible_person}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(material.status)}>{getStatusText(material.status)}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteMaterial(material.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  客户名单
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowImportModal(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    导入Excel
                  </Button>
                  <Button size="sm" onClick={() => setShowGuestForm(!showGuestForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加客户
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showGuestForm && (
                  <div className="p-4 bg-neutral-50 rounded-lg space-y-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-neutral-600">姓名</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newGuest.name}
                          onChange={e => setNewGuest({ ...newGuest, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-600">公司</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newGuest.company}
                          onChange={e => setNewGuest({ ...newGuest, company: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-600">职位</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newGuest.title}
                          onChange={e => setNewGuest({ ...newGuest, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-600">电话</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newGuest.phone}
                          onChange={e => setNewGuest({ ...newGuest, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-600">邮箱</label>
                        <input
                          type="email"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newGuest.email}
                          onChange={e => setNewGuest({ ...newGuest, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-600">跟进人</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          value={newGuest.assigned_to}
                          onChange={e => setNewGuest({ ...newGuest, assigned_to: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">备注</label>
                      <textarea
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        rows={2}
                        value={newGuest.notes}
                        onChange={e => setNewGuest({ ...newGuest, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddGuest}>保存</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowGuestForm(false)}>取消</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {guests.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-4">暂无客户</p>
                  ) : (
                    guests.map(guest => (
                      <div key={guest.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                        <div>
                          <p className="font-medium">{guest.name}</p>
                          <p className="text-sm text-neutral-500">{guest.company} · {guest.title}</p>
                          <p className="text-sm text-neutral-400">{guest.phone}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            className="px-2 py-1 border rounded text-xs"
                            value={guest.status || 'invited'}
                            onChange={e => handleUpdateGuestStatus(guest.id, e.target.value)}
                          >
                            <option value="invited">已邀请</option>
                            <option value="confirmed">已确认</option>
                            <option value="attended">已到场</option>
                            <option value="declined">已拒绝</option>
                          </select>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteGuest(guest.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {showImportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">导入客户名单</h3>
                <p className="text-sm text-neutral-500 mb-4">请选择Excel文件（支持xls、xlsx、csv格式）</p>
                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center">
                  <FileSpreadsheet className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500 mb-2">拖拽文件到此处</p>
                  <input
                    type="file"
                    accept=".xls,.xlsx,.csv,.txt"
                    onChange={handleImportGuests}
                    className="hidden"
                    id="guest-import-file"
                  />
                  <label htmlFor="guest-import-file" className="text-sm text-blue-500 cursor-pointer hover:underline">
                    点击选择文件
                  </label>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="ghost" onClick={() => setShowImportModal(false)}>取消</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'execution' && (
        <ExecutionPhase activityId={activityId} />
      )}

      {activeTab === 'evaluation' && (
        <MarketingEvaluation activityId={activityId} activityName={activity.name} />
      )}

      {/* 市场活动4阶段关系深度生命周期追踪 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              关系深度演进追踪 · 4支柱健康度
            </div>
            <div className="text-xs font-normal text-neutral-500">
              {maturityHealth?.currentStage
                ? `当前阶段：${maturityHealth.currentStage}（${maturityHealth.daysInCurrentStage}天） · 综合评分 ${maturityHealth.overallScore}`
                : '暂无评估数据'}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarketingMaturityTracker
            campaignName={activity?.name || '市场活动'}
            maturityHealth={maturityHealth}
            events={maturityEvents}
            onStageClick={(stage) => console.log('[MarketingActivityDetail] stage clicked:', stage)}
          />
        </CardContent>
      </Card>
    </div>
  );
};
