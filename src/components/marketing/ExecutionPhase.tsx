import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ChevronDown, ChevronRight, Plus, CheckCircle2, Circle, User, FileText,
  Clock, AlertCircle, CheckSquare, Square, MessageCircle, Upload, Link2,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ExecutionPhaseProps {
  activityId: string;
}

// 子任务预设模板
const defaultTaskTemplates: Record<string, string[]> = {
  '活动前准备': [
    '物料清单确认',
    '场地合同签署',
    'PPT初稿完成',
    '嘉宾邀请名单确认',
    '活动流程确认'
  ],
  '宣传推广': [
    '公众号推文撰写',
    '海报设计定稿',
    '邮件邀请发送',
    '社交媒体发布',
    '媒体合作确认'
  ],
  '客户邀请': [
    '邀请函发送',
    '参会确认跟进',
    '收集客户信息',
    '席位安排',
    '交通指引发送'
  ],
  '活动执行': [
    '签到系统准备',
    '设备调试完成',
    '嘉宾接待安排',
    '互动环节准备',
    '应急预案确认'
  ],
  '活动收尾': [
    '现场清理',
    '数据整理汇总',
    '感谢邮件发送',
    '费用结算',
    '活动复盘会议'
  ]
};

export const ExecutionPhase = ({ activityId }: ExecutionPhaseProps) => {
  const [phases, setPhases] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [currentPhaseId, setCurrentPhaseId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ name: '', description: '', assignee: '', deadline: '', task_type: 'general' });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedPhaseForTemplate, setSelectedPhaseForTemplate] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [timelineLogs, setTimelineLogs] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showAddAttachmentModal, setShowAddAttachmentModal] = useState(false);
  const [currentAttachmentPhaseId, setCurrentAttachmentPhaseId] = useState<string | null>(null);
  const [newAttachment, setNewAttachment] = useState({ name: '', type: 'file', url: '', file_type: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: phasesData } = await supabase
      .from('marketing_execution_phases')
      .select('*')
      .eq('activity_id', activityId)
      .order('phase_order', { ascending: true });
    setPhases(phasesData || []);

    const { data: tasksData } = await supabase
      .from('marketing_phase_tasks')
      .select('*')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true });
    setTasks(tasksData || []);

    // 获取最近动态
    const { data: logsData } = await supabase
      .from('marketing_phase_logs')
      .select('*')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false })
      .limit(10);
    setTimelineLogs(logsData || []);

    // 获取附件
    const { data: attachmentsData } = await supabase
      .from('marketing_phase_attachments')
      .select('*')
      .eq('activity_id', activityId);
    setAttachments(attachmentsData || []);

    // 默认展开当前进行中的阶段
    const currentPhase = phasesData?.find(p => p.status === 'in_progress');
    if (currentPhase) {
      setExpandedPhase(currentPhase.id);
    } else {
      // 如果没有进行中的阶段，展开第一个阶段
      const firstPendingPhase = phasesData?.find(p => p.status === 'pending');
      if (firstPendingPhase) {
        setExpandedPhase(firstPendingPhase.id);
      }
    }
  };

  const handleUpdatePhaseStatus = async (phaseId: string, status: string) => {
    await supabase.from('marketing_execution_phases').update({ status }).eq('id', phaseId);
    
    // 添加日志
    const phase = phases.find(p => p.id === phaseId);
    const statusText = getStatusText(status);
    await addLog(`阶段「${phase.name}」状态变更为「${statusText}」`);
    
    loadData();
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completed_date = new Date().toISOString();
    }
    await supabase.from('marketing_phase_tasks').update(updateData).eq('id', taskId);
    
    // 添加日志
    const task = tasks.find(t => t.id === taskId);
    const statusText = getStatusText(status);
    await addLog(`${task.assignee || '某人'}${status === 'completed' ? '完成' : '更新'}了任务「${task.name}」`);
    
    // 检查阶段是否所有任务都完成
    const phaseId = tasks.find(t => t.id === taskId)?.phase_id;
    if (phaseId && status === 'completed') {
      checkPhaseCompletion(phaseId);
    }
    
    loadData();
  };

  const checkPhaseCompletion = async (phaseId: string) => {
    const phaseTasks = tasks.filter(t => t.phase_id === phaseId);
    const completedTasks = phaseTasks.filter(t => t.status === 'completed');
    
    if (phaseTasks.length > 0 && completedTasks.length === phaseTasks.length) {
      const phase = phases.find(p => p.id === phaseId);
      await supabase.from('marketing_execution_phases').update({ status: 'completed' }).eq('id', phaseId);
      await addLog(`阶段「${phase.name}」所有任务已完成！`);
      
      // 自动弹出提示
      setTimeout(() => {
        if (confirm(`阶段「${phase.name}」已完成，是否开启下一阶段？`)) {
          const currentIndex = phases.findIndex(p => p.id === phaseId);
          if (currentIndex < phases.length - 1) {
            const nextPhase = phases[currentIndex + 1];
            handleUpdatePhaseStatus(nextPhase.id, 'in_progress');
          }
        }
      }, 500);
      
      loadData();
    }
  };

  const handleAddTask = async () => {
    if (!newTask.name || !currentPhaseId) return;
    try {
      await supabase.from('marketing_phase_tasks').insert({
        activity_id: activityId,
        phase_id: currentPhaseId,
        ...newTask
      });
      await addLog(`添加了新任务「${newTask.name}」`);
      setNewTask({ name: '', description: '', assignee: '', deadline: '', task_type: 'general' });
      setShowAddTaskModal(false);
      loadData();
    } catch (e) {
      alert('添加任务失败');
    }
  };

  const handleAddTemplateTasks = async () => {
    if (!selectedPhaseForTemplate || selectedTemplates.length === 0) return;
    try {
      for (const taskName of selectedTemplates) {
        await supabase.from('marketing_phase_tasks').insert({
          activity_id: activityId,
          phase_id: selectedPhaseForTemplate,
          name: taskName,
          status: 'pending'
        });
      }
      await addLog(`批量添加了 ${selectedTemplates.length} 个预设任务`);
      setSelectedTemplates([]);
      setShowTemplateModal(false);
      loadData();
    } catch (e) {
      alert('添加预设任务失败');
    }
  };

  const addLog = async (message: string, action: string = 'update') => {
    await supabase.from('marketing_phase_logs').insert({
      activity_id: activityId,
      action,
      description: message,
      operator: '当前用户',
      created_at: new Date().toISOString()
    });
  };

  const handleAddAttachment = async () => {
    if (!newAttachment.name || !currentAttachmentPhaseId) return;
    try {
      await supabase.from('marketing_phase_attachments').insert({
        activity_id: activityId,
        phase_id: currentAttachmentPhaseId,
        ...newAttachment,
        uploaded_by: '当前用户',
        created_at: new Date().toISOString()
      });
      await addLog(`添加了附件「${newAttachment.name}」`, 'add');
      setNewAttachment({ name: '', type: 'file', url: '', file_type: '' });
      setShowAddAttachmentModal(false);
      loadData();
    } catch (e) {
      alert('添加附件失败');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('确定要删除这个附件吗？')) return;
    const attachment = attachments.find(a => a.id === attachmentId);
    await supabase.from('marketing_phase_attachments').delete().eq('id', attachmentId);
    await addLog(`删除了附件「${attachment?.name}」`, 'delete');
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-neutral-500 bg-neutral-200';
      case 'blocked': return 'text-red-600 bg-red-50';
      default: return 'text-neutral-500 bg-neutral-200';
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

  const getPhaseCompletion = (phaseId: string) => {
    const phaseTasks = tasks.filter(t => t.phase_id === phaseId);
    if (phaseTasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = phaseTasks.filter(t => t.status === 'completed').length;
    return {
      completed,
      total: phaseTasks.length,
      percentage: Math.round((completed / phaseTasks.length) * 100)
    };
  };

  const getOverallProgress = () => {
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    return {
      completed: completedPhases,
      total: phases.length,
      percentage: phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0
    };
  };

  const overallProgress = getOverallProgress();
  const currentPhaseIndex = phases.findIndex(p => p.status === 'in_progress');

  return (
    <div className="flex gap-6">
      {/* 左侧时间轴 */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-6">
          <h3 className="text-sm font-semibold text-neutral-500 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            执行进度
          </h3>
          
          {/* 整体进度条 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-600">整体进度</span>
              <span className="font-medium">{overallProgress.completed}/{overallProgress.total}</span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${overallProgress.percentage}%` }}
              />
            </div>
          </div>

          {/* 垂直时间轴 */}
          <div className="relative">
            {phases.map((phase, index) => {
              const isCompleted = phase.status === 'completed';
              const isInProgress = phase.status === 'in_progress';
              const isPending = phase.status === 'pending';
              const isBlocked = phase.status === 'blocked';
              const isLast = index === phases.length - 1;
              const completion = getPhaseCompletion(phase.id);

              return (
                <div key={phase.id} className="relative pb-6 last:pb-0">
                  {/* 连接线 */}
                  {!isLast && (
                    <div 
                      className={`absolute left-[11px] top-8 w-0.5 h-[calc(100%-24px)] transition-colors ${
                        isCompleted ? 'bg-green-400' : isInProgress ? 'bg-blue-400' : 'bg-neutral-200'
                      }`}
                    />
                  )}

                  {/* 状态圆点 */}
                  <div 
                    className={`flex items-center gap-3 cursor-pointer group ${
                      isInProgress ? 'animate-pulse' : ''
                    }`}
                    onClick={() => setExpandedPhase(phase.id)}
                  >
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500' : 
                      isInProgress ? 'bg-blue-500 ring-4 ring-blue-200 ring-opacity-50' : 
                      isBlocked ? 'bg-red-500' : 'bg-neutral-300'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : isBlocked ? (
                        <AlertCircle className="w-3 h-3 text-white" />
                      ) : (
                        <Circle className="w-3 h-3 text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium truncate ${
                          isInProgress ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-neutral-600'
                        }`}>
                          {phase.name}
                        </span>
                        {completion.total > 0 && (
                          <span className="text-xs text-neutral-400">{completion.percentage}%</span>
                        )}
                      </div>
                      <Badge className={`text-xs ${getStatusColor(phase.status)}`}>
                        {getStatusText(phase.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 最近动态 */}
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-neutral-500 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              最近动态
            </h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {timelineLogs.length === 0 ? (
                <p className="text-sm text-neutral-400">暂无动态</p>
              ) : (
                timelineLogs.map((log, index) => (
                  <div key={log.id || index} className="text-xs text-neutral-500 pb-2 border-b border-neutral-100 last:border-0">
                    <span className="text-neutral-300 mr-2">
                      {new Date(log.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧主内容区 */}
      <div className="flex-1">
        {phases.map((phase) => {
          const isExpanded = expandedPhase === phase.id;
          const isCompleted = phase.status === 'completed';
          const isInProgress = phase.status === 'in_progress';
          const completion = getPhaseCompletion(phase.id);
          const phaseTasks = tasks.filter(t => t.phase_id === phase.id);

          return (
            <Card key={phase.id} className={`mb-4 transition-all duration-300 ${
              isInProgress ? 'ring-2 ring-blue-200' : ''
            }`}>
              <CardHeader 
                className="cursor-pointer hover:bg-neutral-50 -mx-4 -mt-4 px-4 pt-4"
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      isCompleted ? 'bg-green-500' : isInProgress ? 'bg-blue-500 animate-pulse' : 'bg-neutral-300'
                    }`}>
                      {phase.phase_order}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{phase.name}</CardTitle>
                      <p className="text-sm text-neutral-500">{phase.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* 阶段状态标签 */}
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(phase.status)}`}>
                        {getStatusText(phase.status)}
                      </Badge>
                    </div>

                    {/* 进度条 */}
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-500">任务进度</span>
                        <span className="font-medium">{completion.completed}/{completion.total}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            isCompleted ? 'bg-green-500' : isInProgress ? 'bg-blue-500' : 'bg-neutral-300'
                          }`}
                          style={{ width: `${completion.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* 展开/折叠图标 */}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-4">
                  {/* 任务清单区 */}
                  <div className="space-y-3">
                    {phaseTasks.length === 0 ? (
                      <div className="bg-neutral-50 rounded-lg p-6 text-center">
                        <CheckSquare className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500 mb-4">暂无任务</p>
                        <div className="flex gap-2 justify-center">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setCurrentPhaseId(phase.id);
                              setSelectedPhaseForTemplate(phase.id);
                              setShowTemplateModal(true);
                            }}
                            variant="outline"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            从模板添加
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setCurrentPhaseId(phase.id);
                              setShowAddTaskModal(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            添加任务
                          </Button>
                        </div>
                      </div>
                    ) : (
                      phaseTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          {/* 任务勾选框 */}
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                            className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                              task.status === 'completed' 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-neutral-300 hover:border-green-400'
                            }`}
                          >
                            {task.status === 'completed' && <CheckSquare className="w-3 h-3" />}
                          </button>

                          {/* 任务信息 */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${task.status === 'completed' ? 'line-through text-neutral-400' : ''}`}>
                              {task.name}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                              {task.assignee && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {task.assignee}
                                </span>
                              )}
                              {task.deadline && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.deadline}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 状态标签 */}
                          <Badge className={`${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </Badge>

                          {/* 负责人头像/沟通按钮 */}
                          {task.assignee && (
                            <Button size="sm" variant="ghost" className="h-8">
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* 添加任务按钮 */}
                  {phaseTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPhaseForTemplate(phase.id);
                            setShowTemplateModal(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          从模板添加
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setCurrentPhaseId(phase.id);
                            setShowAddTaskModal(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          添加任务
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 阶段产出/附件区 */}
                  <div className="mt-6 pt-4 border-t border-neutral-200">
                    <h4 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      阶段产出/附件
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {attachments.filter(a => a.phase_id === phase.id).map((attachment) => (
                        <div 
                          key={attachment.id} 
                          className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg group"
                        >
                          {attachment.type === 'link' ? (
                            <Link2 className="w-4 h-4 text-purple-500" />
                          ) : (
                            <FileText className={`w-4 h-4 ${attachment.file_type?.includes('pdf') ? 'text-red-500' : attachment.file_type?.includes('xlsx') ? 'text-green-500' : 'text-blue-500'}`} />
                          )}
                          <a 
                            href={attachment.url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline truncate max-w-[150px]"
                          >
                            {attachment.name}
                          </a>
                          <button
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8"
                        onClick={() => {
                          setCurrentAttachmentPhaseId(phase.id);
                          setShowAddAttachmentModal(true);
                        }}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        添加附件
                      </Button>
                    </div>
                  </div>

                  {/* 阶段备注 */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">阶段备注</h4>
                    <textarea
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="记录该阶段的特殊情况..."
                    />
                  </div>

                  {/* 状态变更下拉 */}
                  <div className="mt-4 flex justify-end">
                    <select
                      value={phase.status}
                      onChange={(e) => handleUpdatePhaseStatus(phase.id, e.target.value)}
                      className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">待处理</option>
                      <option value="in_progress">进行中</option>
                      <option value="completed">已完成</option>
                      <option value="blocked">已阻塞</option>
                    </select>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* 添加任务弹窗 */}
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">添加执行任务</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600">任务名称</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="任务名称"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600">描述</label>
                  <textarea
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="任务描述"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">负责人</label>
                    <input
                      type="text"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                      placeholder="负责人姓名"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">截止日期</label>
                    <input
                      type="date"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="ghost" onClick={() => setShowAddTaskModal(false)}>取消</Button>
                <Button onClick={handleAddTask}>保存任务</Button>
              </div>
            </div>
          </div>
        )}

        {/* 模板任务选择弹窗 */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">选择预设任务</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {defaultTaskTemplates[phases.find(p => p.id === selectedPhaseForTemplate)?.name || '']?.map((task, index) => (
                  <label 
                    key={index} 
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTemplates.includes(task) 
                        ? 'bg-blue-50 border-2 border-blue-500' 
                        : 'bg-neutral-50 border-2 border-transparent hover:border-neutral-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(task)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTemplates([...selectedTemplates, task]);
                        } else {
                          setSelectedTemplates(selectedTemplates.filter(t => t !== task));
                        }
                      }}
                      className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-neutral-700">{task}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="ghost" onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplates([]);
                }}>取消</Button>
                <Button onClick={handleAddTemplateTasks}>添加选中任务</Button>
              </div>
            </div>
          </div>
        )}

        {/* 添加附件弹窗 */}
        {showAddAttachmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">添加附件</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600">附件名称</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newAttachment.name}
                    onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })}
                    placeholder="附件名称"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600">类型</label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newAttachment.type}
                    onChange={(e) => setNewAttachment({ ...newAttachment, type: e.target.value })}
                  >
                    <option value="file">文件</option>
                    <option value="link">链接</option>
                    <option value="image">图片</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600">URL/链接</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newAttachment.url}
                    onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
                    placeholder="文件URL或链接地址"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600">文件类型</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newAttachment.file_type}
                    onChange={(e) => setNewAttachment({ ...newAttachment, file_type: e.target.value })}
                    placeholder="如：pdf, xlsx, docx"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="ghost" onClick={() => {
                  setShowAddAttachmentModal(false);
                  setNewAttachment({ name: '', type: 'file', url: '', file_type: '' });
                }}>取消</Button>
                <Button onClick={handleAddAttachment}>保存附件</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
