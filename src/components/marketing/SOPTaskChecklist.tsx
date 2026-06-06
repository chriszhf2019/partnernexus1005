import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Camera, Upload, FileText, Users, QrCode, X, Clock, ArrowRight, Package, Send, UserCheck, Mic, Presentation, Receipt, FileCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SOPTaskChecklistProps { open: boolean; onClose: () => void; }

export const SOPTaskChecklist: React.FC<SOPTaskChecklistProps> = ({ open, onClose }) => {
  const [tasks, setTasks] = useState([
    { id: 't1', phase: '准备阶段', name: '物料到位确认', desc: '展架、易拉宝、宣传册到达现场', icon: Package, done: true, evidence: '已拍照上传', time: '活动前3天' },
    { id: 't2', phase: '准备阶段', name: '邀请函发送', desc: '通过系统发送H5邀请函给目标客户', icon: Send, done: true, evidence: '已发送128封', time: '活动前2周' },
    { id: 't3', phase: '准备阶段', name: '专家确认到场', desc: '确认原厂架构师演讲时间及内容', icon: UserCheck, done: true, evidence: '张明远 已确认', time: '活动前1周' },
    { id: 't4', phase: '执行阶段', name: '现场签到开启', desc: '生成并展示签到二维码，开启扫码签到', icon: QrCode, done: true, evidence: '87人已签到', time: '活动当天 08:00' },
    { id: 't5', phase: '执行阶段', name: '开场致辞', desc: '合作伙伴负责人致开场辞', icon: Mic, done: true, evidence: '已完成', time: '活动当天 09:00' },
    { id: 't6', phase: '执行阶段', name: '主题演讲', desc: '原厂专家进行产品/方案主题演讲', icon: Presentation, done: true, evidence: '60分钟完成', time: '活动当天 09:30' },
    { id: 't7', phase: '执行阶段', name: '客户互动环节', desc: 'Q&A、抽奖、Demo演示', icon: Users, done: false, evidence: '', time: '活动当天 10:30' },
    { id: 't8', phase: '执行阶段', name: '线索采集录入', desc: '现场收集客户信息并录入系统', icon: FileText, done: false, evidence: '', time: '活动当天 11:00' },
    { id: 't9', phase: '收尾阶段', name: '现场照片上传', desc: '上传活动现场照片（至少5张）', icon: Camera, done: false, evidence: '', time: '活动结束后24h内' },
    { id: 't10', phase: '收尾阶段', name: '费用核销提交', desc: '提交发票及费用明细进行MDF核销', icon: Receipt, done: false, evidence: '', time: '活动结束后7天内' },
    { id: 't11', phase: '收尾阶段', name: '结项报告生成', desc: '一键生成活动结项报告', icon: FileCheck, done: false, evidence: '', time: '活动结束后7天内' },
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done, evidence: !t.done ? '已完成' : '' } : t));
  };

  const phases = ['准备阶段', '执行阶段', '收尾阶段'];
  const doneCount = tasks.filter(t => t.done).length;
  const progress = Math.round(doneCount / tasks.length * 100);

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-3xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand" /><h2 className="text-lg font-semibold">执行标准化任务清单 (SOP)</h2></div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">{doneCount}/{tasks.length} 已完成 ({progress}%)</span>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {phases.map(phase => {
              const phaseTasks = tasks.filter(t => t.phase === phase);
              const phaseDone = phaseTasks.filter(t => t.done).length;
              return (
                <div key={phase}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{phase}</h3>
                    <Badge size="sm" variant={phaseDone === phaseTasks.length ? 'success' : 'warning'}>{phaseDone}/{phaseTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {phaseTasks.map(task => (
                      <div key={task.id} onClick={() => toggleTask(task.id)} className={cn('flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all', task.done ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/5' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300')}>
                        <button className="shrink-0">{task.done ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-neutral-300" />}</button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2"><task.icon className="w-4 h-4 text-neutral-400" /><span className={cn('text-sm font-medium', task.done ? 'text-neutral-500 line-through' : 'text-neutral-900 dark:text-white')}>{task.name}</span></div>
                          <p className="text-xs text-neutral-400 mt-0.5">{task.desc}</p>
                          {task.evidence && <p className="text-xs text-emerald-600 mt-1">📎 {task.evidence}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-neutral-400"><Clock className="w-3 h-3 inline mr-1" />{task.time}</span>
                          {!task.done && task.id === 't9' && <Button variant="ghost" size="sm"><Upload className="w-3.5 h-3.5" /></Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {progress === 100 && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 rounded-xl text-center">
                <p className="text-sm font-semibold text-emerald-700">🎉 所有任务已完成！</p>
                <p className="text-xs text-emerald-600 mt-1">点击下方按钮一键生成结项报告</p>
                <Button variant="brand" size="sm" className="mt-3">生成结项报告</Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
