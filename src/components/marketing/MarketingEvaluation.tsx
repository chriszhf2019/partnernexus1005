import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  CheckSquare, Edit, Plus, Users, Target, TrendingUp, MessageSquare, 
  Zap, ClipboardList, Star, CheckCircle2, AlertCircle, Gift
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MarketingEvaluationProps {
  activityId: string;
  activityName: string;
}

export const MarketingEvaluation = ({ activityId, activityName }: MarketingEvaluationProps) => {
  const [evaluation, setEvaluation] = useState<any>(null);
  const [evaluationLeads, setEvaluationLeads] = useState<any[]>([]);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [newEvaluationLead, setNewEvaluationLead] = useState({ name: '', company: '', title: '', phone: '', email: '', quality: 'medium', notes: '' });

  const [evalFormData, setEvalFormData] = useState({
    registered_count: 0,
    total_attendees: 0,
    attendance_rate: 0,
    target_client_ratio: 0,
    mql_count: 0,
    sql_count: 0,
    content_score: 0,
    process_score: 0,
    nps_score: 0,
    favorite_session: '',
    customer_highlights: '',
    customer_pain_points: '',
    budget_total: 0,
    budget_actual: 0,
    budget_execution_rate: 0,
    cpl: 0,
    estimated_deal_amount: 0,
    channel_performance: '',
    follow_up_actions: '',
    competitor_dynamics: '',
    ksf: '',
    risk_warnings: '',
    follow_up_plan: '',
    todo_tasks: ''
  });

  useEffect(() => {
    loadEvaluationData();
  }, []);

  const loadEvaluationData = async () => {
    try {
      const { data: evaluationData } = await supabase
        .from('marketing_evaluations')
        .select('*')
        .eq('activity_id', activityId)
        .maybeSingle();
      setEvaluation(evaluationData);

      if (evaluationData) {
        const { data: leadsData } = await supabase
          .from('marketing_evaluation_leads')
          .select('*')
          .eq('evaluation_id', evaluationData.id)
          .order('created_at', { ascending: false });
        setEvaluationLeads(leadsData || []);
      }
    } catch (e) {
      console.error('加载评估数据失败:', e);
    }
  };

  const handleSaveEvaluation = async () => {
    try {
      const calcAttendanceRate = evalFormData.registered_count > 0 
        ? ((evalFormData.total_attendees / evalFormData.registered_count) * 100).toFixed(1)
        : 0;
      const calcBudgetRate = evalFormData.budget_total > 0 
        ? ((evalFormData.budget_actual / evalFormData.budget_total) * 100).toFixed(1)
        : 0;
      const calcCPL = evalFormData.total_attendees > 0 
        ? (evalFormData.budget_actual / evalFormData.total_attendees).toFixed(2)
        : 0;

      const saveData = {
        ...evalFormData,
        attendance_rate: parseFloat(calcAttendanceRate),
        budget_execution_rate: parseFloat(calcBudgetRate),
        cpl: parseFloat(calcCPL),
        is_completed: true,
        evaluated_at: new Date().toISOString()
      };

      if (evaluation) {
        await supabase.from('marketing_evaluations').update(saveData).eq('id', evaluation.id);
      } else {
        const { data: newEval } = await supabase.from('marketing_evaluations').insert({
          activity_id: activityId,
          ...saveData
        }).select().single();
        if (newEval) setEvaluation(newEval);
      }
      setShowEvaluationForm(false);
      loadEvaluationData();
    } catch (e) {
      alert('保存评估失败');
    }
  };

  const handleEditEvaluation = () => {
    if (evaluation) {
      setEvalFormData({
        registered_count: evaluation.registered_count || 0,
        total_attendees: evaluation.total_attendees || 0,
        attendance_rate: evaluation.attendance_rate || 0,
        target_client_ratio: evaluation.target_client_ratio || 0,
        mql_count: evaluation.mql_count || 0,
        sql_count: evaluation.sql_count || 0,
        content_score: evaluation.content_score || 0,
        process_score: evaluation.process_score || 0,
        nps_score: evaluation.nps_score || 0,
        favorite_session: evaluation.favorite_session || '',
        customer_highlights: evaluation.customer_highlights || '',
        customer_pain_points: evaluation.customer_pain_points || '',
        budget_total: evaluation.budget_total || 0,
        budget_actual: evaluation.budget_actual || 0,
        budget_execution_rate: evaluation.budget_execution_rate || 0,
        cpl: evaluation.cpl || 0,
        estimated_deal_amount: evaluation.estimated_deal_amount || 0,
        channel_performance: evaluation.channel_performance || '',
        follow_up_actions: evaluation.follow_up_actions || '',
        competitor_dynamics: evaluation.competitor_dynamics || '',
        ksf: evaluation.ksf || '',
        risk_warnings: evaluation.risk_warnings || '',
        follow_up_plan: evaluation.follow_up_plan || '',
        todo_tasks: evaluation.todo_tasks || ''
      });
      setShowEvaluationForm(true);
    }
  };

  const handleAddEvaluationLead = async () => {
    if (!newEvaluationLead.name || !evaluation) return;
    try {
      await supabase.from('marketing_evaluation_leads').insert({
        evaluation_id: evaluation.id,
        activity_id: activityId,
        ...newEvaluationLead
      });
      setNewEvaluationLead({ name: '', company: '', title: '', phone: '', email: '', quality: 'medium', notes: '' });
      loadEvaluationData();
    } catch (e) {
      alert('添加商机失败');
    }
  };

  const handleConvertToDeal = async (leadId: string, leadData: any) => {
    if (!confirm('确定要将这个商机转换到商机管理吗？')) return;
    try {
      const { data: newDeal } = await supabase.from('deals').insert({
        title: `${activityName} - ${leadData.name}`,
        customer: leadData.company,
        description: leadData.notes,
        status: 'Pending',
        stage: 'Registered'
      }).select().single();

      if (newDeal) {
        await supabase.from('marketing_evaluation_leads').update({
          is_converted: true,
          converted_deal_id: newDeal.id,
          converted_at: new Date().toISOString()
        }).eq('id', leadId);
      }
      loadEvaluationData();
    } catch (e) {
      alert('转换失败');
    }
  };

  const renderScoreStars = (score: number, colorClass: string) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            className={`w-4 h-4 ${n <= score ? colorClass : 'text-neutral-300'}`}
            fill={n <= score ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 核心数据看板 */}
      {evaluation && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">到场率</p>
                <p className="text-4xl font-bold mt-1">
                  {(evaluation.attendance_rate || 0).toFixed(1)}%
                </p>
                <p className="text-blue-100 text-sm mt-2">
                  {evaluation.total_attendees || 0} / {evaluation.registered_count || 0} 人
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">高意向线索</p>
                <p className="text-4xl font-bold mt-1">{evaluation.sql_count || 0}</p>
                <p className="text-green-100 text-sm mt-2">
                  共 {evaluation.mql_count || 0} 条线索
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">预估商机金额</p>
                <p className="text-4xl font-bold mt-1">
                  {(evaluation.estimated_deal_amount || 0).toLocaleString()}
                </p>
                <p className="text-amber-100 text-sm mt-2">
                  CPL: {(evaluation.cpl || 0).toFixed(2)} 元/人
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            活动评估报告
          </CardTitle>
          <div className="flex gap-2">
            {evaluation ? (
              <Button size="sm" onClick={handleEditEvaluation}>
                <Edit className="w-4 h-4 mr-2" />
                编辑
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowEvaluationForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建评估
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showEvaluationForm ? (
            <div className="space-y-6">
              {/* 第一维度：规模与转化 */}
              <div className="border-b border-neutral-200 pb-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  规模与转化维度
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">报名人数</label>
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      value={evalFormData.registered_count}
                      onChange={e => setEvalFormData({ ...evalFormData, registered_count: Number(e.target.value) })}
                      placeholder="报名人数"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">到场人数</label>
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      value={evalFormData.total_attendees}
                      onChange={e => setEvalFormData({ ...evalFormData, total_attendees: Number(e.target.value) })}
                      placeholder="到场人数"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">到场率(自动计算)</label>
                    <div className="w-full mt-1 px-3 py-2 bg-neutral-50 border rounded-lg text-sm">
                      {evalFormData.registered_count > 0 
                        ? ((evalFormData.total_attendees / evalFormData.registered_count) * 100).toFixed(1) 
                        : 0}%
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">目标客户占比(%)</label>
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      value={evalFormData.target_client_ratio}
                      onChange={e => setEvalFormData({ ...evalFormData, target_client_ratio: Number(e.target.value) })}
                      placeholder="目标客户占比"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">初步意向(MQL)</label>
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      value={evalFormData.mql_count}
                      onChange={e => setEvalFormData({ ...evalFormData, mql_count: Number(e.target.value) })}
                      placeholder="初步意向线索数"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">高意向(SQL)</label>
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      value={evalFormData.sql_count}
                      onChange={e => setEvalFormData({ ...evalFormData, sql_count: Number(e.target.value) })}
                      placeholder="高意向商机数"
                    />
                  </div>
                </div>
              </div>

              {/* 第二维度：客户体验与内容 */}
              <div className="border-b border-neutral-200 pb-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  客户体验与内容维度
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">内容价值评分 (1-5星)</label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setEvalFormData({ ...evalFormData, content_score: n })}
                          className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                            n <= evalFormData.content_score
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-500'
                              : 'bg-neutral-50 border-neutral-300 text-neutral-400 hover:border-yellow-300'
                          }`}
                        >
                          <Star className="w-5 h-5" fill={n <= evalFormData.content_score ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">流程服务评分 (1-5星)</label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setEvalFormData({ ...evalFormData, process_score: n })}
                          className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                            n <= evalFormData.process_score
                              ? 'bg-green-100 border-green-400 text-green-500'
                              : 'bg-neutral-50 border-neutral-300 text-neutral-400 hover:border-green-300'
                          }`}
                        >
                          <Star className="w-5 h-5" fill={n <= evalFormData.process_score ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">NPS净推荐值 (-100~100)</label>
                    <input
                      type="number"
                      min="-100"
                      max="100"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      value={evalFormData.nps_score}
                      onChange={e => setEvalFormData({ ...evalFormData, nps_score: Number(e.target.value) })}
                      placeholder="NPS分数"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">最受欢迎环节</label>
                    <input
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      value={evalFormData.favorite_session}
                      onChange={e => setEvalFormData({ ...evalFormData, favorite_session: e.target.value })}
                      placeholder="如：圆桌论坛、新品试用"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">客户好评/亮点</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      rows={3}
                      value={evalFormData.customer_highlights}
                      onChange={e => setEvalFormData({ ...evalFormData, customer_highlights: e.target.value })}
                      placeholder="收集最具代表性的原话"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">客户槽点/问题</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      rows={3}
                      value={evalFormData.customer_pain_points}
                      onChange={e => setEvalFormData({ ...evalFormData, customer_pain_points: e.target.value })}
                      placeholder="需要改进的地方"
                    />
                  </div>
                </div>
              </div>

              {/* 第三维度：财务与ROI */}
              <div className="border-b border-neutral-200 pb-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  财务与ROI维度
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">预算总额(元)</label>
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      value={evalFormData.budget_total}
                      onChange={e => setEvalFormData({ ...evalFormData, budget_total: Number(e.target.value) })}
                      placeholder="预算总额"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">实际支出(元)</label>
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      value={evalFormData.budget_actual}
                      onChange={e => setEvalFormData({ ...evalFormData, budget_actual: Number(e.target.value) })}
                      placeholder="实际支出"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">预算执行率(自动)</label>
                    <div className="w-full mt-1 px-3 py-2 bg-neutral-50 border rounded-lg text-sm">
                      {evalFormData.budget_total > 0 
                        ? ((evalFormData.budget_actual / evalFormData.budget_total) * 100).toFixed(1) 
                        : 0}%
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">单人到场成本CPL(自动)</label>
                    <div className="w-full mt-1 px-3 py-2 bg-neutral-50 border rounded-lg text-sm">
                      {evalFormData.total_attendees > 0 
                        ? (evalFormData.budget_actual / evalFormData.total_attendees).toFixed(2) 
                        : 0} 元
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">预估商机金额(元)</label>
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      value={evalFormData.estimated_deal_amount}
                      onChange={e => setEvalFormData({ ...evalFormData, estimated_deal_amount: Number(e.target.value) })}
                      placeholder="预估商机金额"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">ROI预估(自动)</label>
                    <div className="w-full mt-1 px-3 py-2 bg-neutral-50 border rounded-lg text-sm">
                      {evalFormData.budget_actual > 0 
                        ? ((evalFormData.estimated_deal_amount - evalFormData.budget_actual) / evalFormData.budget_actual * 100).toFixed(1) 
                        : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 第四维度：复盘与行动 */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-500" />
                  复盘与行动维度
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">渠道表现评价</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      rows={3}
                      value={evalFormData.channel_performance}
                      onChange={e => setEvalFormData({ ...evalFormData, channel_performance: e.target.value })}
                      placeholder="哪个渠道邀约效果最好？(销售邀约、公众号、外部广告...)"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">竞争对手动态</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      rows={3}
                      value={evalFormData.competitor_dynamics}
                      onChange={e => setEvalFormData({ ...evalFormData, competitor_dynamics: e.target.value })}
                      placeholder="如果现场有友商，他们的表现如何？"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">成功关键因素(KSF)</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      rows={3}
                      value={evalFormData.ksf}
                      onChange={e => setEvalFormData({ ...evalFormData, ksf: e.target.value })}
                      placeholder="这次做得好的原因是什么？"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">失败/风险预警</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      rows={3}
                      value={evalFormData.risk_warnings}
                      onChange={e => setEvalFormData({ ...evalFormData, risk_warnings: e.target.value })}
                      placeholder="哪些地方差点搞砸了？"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">后续跟进计划</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      rows={3}
                      value={evalFormData.follow_up_plan}
                      onChange={e => setEvalFormData({ ...evalFormData, follow_up_plan: e.target.value })}
                      placeholder="具体的线索分配及转化策略"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">待办任务清单</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      rows={3}
                      value={evalFormData.todo_tasks}
                      onChange={e => setEvalFormData({ ...evalFormData, todo_tasks: e.target.value })}
                      placeholder="活动结束后48小时内必须完成的事项，每行一个任务"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowEvaluationForm(false)}>取消</Button>
                <Button onClick={handleSaveEvaluation}>保存评估</Button>
              </div>
            </div>
          ) : evaluation ? (
            <div className="space-y-6">
              {/* 规模与转化维度 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">报名人数</p>
                  <p className="text-2xl font-bold text-blue-800">{evaluation.registered_count || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">到场人数</p>
                  <p className="text-2xl font-bold text-blue-800">{evaluation.total_attendees || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">到场率</p>
                  <p className="text-2xl font-bold text-blue-800">{(evaluation.attendance_rate || 0).toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">目标客户占比</p>
                  <p className="text-2xl font-bold text-green-800">{(evaluation.target_client_ratio || 0)}%</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">MQL线索</p>
                  <p className="text-2xl font-bold text-green-800">{evaluation.mql_count || 0}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">SQL商机</p>
                  <p className="text-2xl font-bold text-green-800">{evaluation.sql_count || 0}</p>
                </div>
              </div>

              {/* 客户体验与内容维度 */}
              <Card className="bg-neutral-50 border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">客户体验与内容</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex justify-center gap-1 mb-1">
                        {renderScoreStars(evaluation.content_score || 0, 'text-yellow-500 fill-yellow-500')}
                      </div>
                      <p className="text-sm text-neutral-600">内容价值</p>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center gap-1 mb-1">
                        {renderScoreStars(evaluation.process_score || 0, 'text-green-500 fill-green-500')}
                      </div>
                      <p className="text-sm text-neutral-600">流程服务</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-purple-600">{evaluation.nps_score || 0}</p>
                      <p className="text-sm text-neutral-600">NPS净推荐值</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-neutral-800">{evaluation.favorite_session || '-'}</p>
                      <p className="text-sm text-neutral-600">最受欢迎环节</p>
                    </div>
                  </div>
                  {evaluation.customer_highlights && (
                    <div className="mt-4 p-3 bg-white rounded-lg">
                      <p className="text-sm font-medium text-green-600 mb-1">客户好评</p>
                      <p className="text-sm text-neutral-700">{evaluation.customer_highlights}</p>
                    </div>
                  )}
                  {evaluation.customer_pain_points && (
                    <div className="mt-2 p-3 bg-white rounded-lg">
                      <p className="text-sm font-medium text-red-600 mb-1">待改进问题</p>
                      <p className="text-sm text-neutral-700">{evaluation.customer_pain_points}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 财务与ROI维度 */}
              <Card className="bg-neutral-50 border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">财务与ROI</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-neutral-600">预算总额</p>
                      <p className="text-lg font-bold text-neutral-800">¥{(evaluation.budget_total || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">实际支出</p>
                      <p className="text-lg font-bold text-neutral-800">¥{(evaluation.budget_actual || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">预算执行率</p>
                      <p className="text-lg font-bold text-neutral-800">{(evaluation.budget_execution_rate || 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">CPL(单人成本)</p>
                      <p className="text-lg font-bold text-neutral-800">¥{(evaluation.cpl || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">预估商机金额</span>
                      <span className="text-2xl font-bold text-amber-600">¥{(evaluation.estimated_deal_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 复盘与行动维度 */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      成功关键因素(KSF)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-neutral-700">{evaluation.ksf || '暂无'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      风险预警
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-neutral-700">{evaluation.risk_warnings || '暂无'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      渠道表现
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-neutral-700">{evaluation.channel_performance || '暂无'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-500" />
                      竞争对手动态
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-neutral-700">{evaluation.competitor_dynamics || '暂无'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* 后续跟进计划 */}
              {evaluation.follow_up_plan && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-amber-500" />
                      后续跟进计划
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-neutral-700 whitespace-pre-line">{evaluation.follow_up_plan}</p>
                  </CardContent>
                </Card>
              )}

              {/* 待办任务清单 */}
              {evaluation.todo_tasks && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Gift className="w-4 h-4 text-amber-600" />
                      待办任务清单
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2">
                      {evaluation.todo_tasks.split('\n').filter(t => t.trim()).map((task, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-neutral-700">{task}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-500 mb-4">暂无评估数据</p>
              <Button onClick={() => setShowEvaluationForm(true)}>创建评估</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 商机管理 */}
      {evaluation && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>商机管理</CardTitle>
            <Button size="sm" onClick={() => {
              const modal = document.createElement('div');
              modal.innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 class="text-lg font-bold mb-4">添加商机</h3>
                    <div class="space-y-4">
                      <div>
                        <label class="text-sm font-medium text-neutral-600">姓名</label>
                        <input id="leadName" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="客户姓名" />
                      </div>
                      <div>
                        <label class="text-sm font-medium text-neutral-600">公司</label>
                        <input id="leadCompany" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="公司名称" />
                      </div>
                      <div>
                        <label class="text-sm font-medium text-neutral-600">职位</label>
                        <input id="leadTitle" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="职位" />
                      </div>
                      <div>
                        <label class="text-sm font-medium text-neutral-600">电话</label>
                        <input id="leadPhone" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="联系电话" />
                      </div>
                      <div>
                        <label class="text-sm font-medium text-neutral-600">质量</label>
                        <select id="leadQuality" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                          <option value="hot">高优先级</option>
                          <option value="warm">中优先级</option>
                          <option value="medium">普通</option>
                          <option value="cold">低优先级</option>
                        </select>
                      </div>
                      <div>
                        <label class="text-sm font-medium text-neutral-600">备注</label>
                        <textarea id="leadNotes" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" rows="2" placeholder="备注"></textarea>
                      </div>
                    </div>
                    <div class="flex gap-2 mt-6">
                      <button id="saveLead" class="px-4 py-2 bg-blue-600 text-white rounded-lg">保存</button>
                      <button id="closeLeadModal" class="px-4 py-2 border rounded-lg">取消</button>
                    </div>
                  </div>
                </div>
              `;
              document.body.appendChild(modal);

              const saveBtn = modal.querySelector('#saveLead');
              const closeBtn = modal.querySelector('#closeLeadModal');

              closeBtn.addEventListener('click', () => modal.remove());
              saveBtn.addEventListener('click', async () => {
                const data = {
                  name: (document.getElementById('leadName') as HTMLInputElement)?.value,
                  company: (document.getElementById('leadCompany') as HTMLInputElement)?.value,
                  title: (document.getElementById('leadTitle') as HTMLInputElement)?.value,
                  phone: (document.getElementById('leadPhone') as HTMLInputElement)?.value,
                  quality: (document.getElementById('leadQuality') as HTMLSelectElement)?.value,
                  notes: (document.getElementById('leadNotes') as HTMLTextAreaElement)?.value
                };
                if (data.name) {
                  await handleAddEvaluationLead(data as any);
                  modal.remove();
                }
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              添加商机
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evaluationLeads.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">暂无商机</p>
              ) : (
                evaluationLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-neutral-500">{lead.company} · {lead.title}</p>
                      <p className="text-sm text-neutral-400">{lead.phone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        lead.quality === 'hot' ? 'text-red-600 bg-red-50' :
                        lead.quality === 'warm' ? 'text-amber-600 bg-amber-50' :
                        lead.quality === 'medium' ? 'text-blue-600 bg-blue-50' :
                        'text-neutral-600 bg-neutral-50'
                      }>
                        {lead.quality === 'hot' ? '高' : lead.quality === 'warm' ? '中' : lead.quality === 'medium' ? '普通' : '低'}
                      </Badge>
                      {lead.is_converted ? (
                        <Badge className="text-green-600 bg-green-50">已转换</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleConvertToDeal(lead.id, lead)}>
                          转换商机
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
