import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, Eye, CheckCircle2, Camera, Users, DollarSign, TrendingUp, X, FileCheck } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AutoReportGeneratorProps { open: boolean; onClose: () => void; }

export const AutoReportGenerator: React.FC<AutoReportGeneratorProps> = ({ open, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const reportData = {
    activityName: 'Q2 华东医疗峰会',
    date: '2026-06-15',
    location: '上海浦东嘉里大酒店',
    budget: 150000, spent: 135000,
    expectedAttendees: 120, actualAttendees: 87, attendanceRate: 72.5,
    vipCount: 12, directorCount: 8,
    leadsGenerated: 42, qualifiedLeads: 28,
    opportunitiesCreated: 15, dealsValue: 2800000,
    photos: 23, satisfaction: 4.6,
    keyTakeaways: [
      'AI影像辅助诊断引发热议，8家医院表示采购意向',
      '云原生架构升级成为主流需求，容器化改造方案需求明确',
      '华东地区医疗信息化预算持续增长，Q3有望集中释放',
    ],
    nextSteps: [
      '7天内完成全部线索跟进录入',
      '针对8家意向医院安排一对一方案交流',
      'Q3规划：苏州、杭州、南京三城巡回沙龙',
    ],
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    setDone(true);
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-3xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-brand" /><h2 className="text-lg font-semibold">一键生成结项报告</h2></div>
            <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 space-y-4">
            {/* Preview */}
            <Card>
              <CardContent>
                <div className="text-center mb-4">
                  <h3 className="text-base font-bold">{reportData.activityName}</h3>
                  <p className="text-xs text-neutral-500">{reportData.date} · {reportData.location}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: '预算执行', value: `${Math.round(reportData.spent / reportData.budget * 100)}%`, sub: `${formatCurrency(reportData.spent)} / ${formatCurrency(reportData.budget)}`, color: 'text-blue-600' },
                    { label: '到场率', value: `${reportData.attendanceRate}%`, sub: `${reportData.actualAttendees}/${reportData.expectedAttendees}人`, color: 'text-emerald-600' },
                    { label: '线索转化', value: `${reportData.qualifiedLeads}条`, sub: `商机 ${reportData.opportunitiesCreated}个`, color: 'text-amber-600' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
                      <p className="text-xs text-neutral-500">{s.label}</p>
                      <p className="text-[10px] text-neutral-400">{s.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">核心成果:</p>
                  <ul className="list-disc pl-4 space-y-1 text-neutral-600 dark:text-neutral-400">
                    {reportData.keyTakeaways.map((k, i) => <li key={i} className="text-xs">{k}</li>)}
                  </ul>
                  <p className="font-medium mt-3">后续计划:</p>
                  <ul className="list-disc pl-4 space-y-1 text-neutral-600 dark:text-neutral-400">
                    {reportData.nextSteps.map((s, i) => <li key={i} className="text-xs">{s}</li>)}
                  </ul>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
                  <span><Camera className="w-3 h-3 inline" /> {reportData.photos}张现场照片</span>
                  <span><Users className="w-3 h-3 inline" /> {reportData.vipCount}位VIP</span>
                  <span><DollarSign className="w-3 h-3 inline" /> {formatCurrency(reportData.dealsValue)}商机金额</span>
                </div>
              </CardContent>
            </Card>

            {done ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-emerald-700">报告生成完毕！</p>
                <p className="text-xs text-emerald-600">已自动聚合预算支出、到场人数、线索数量、现场照片</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Button variant="brand" size="sm"><Download className="w-4 h-4 mr-1" />下载PDF</Button>
                  <Button variant="secondary" size="sm"><Eye className="w-4 h-4 mr-1" />预览</Button>
                </div>
              </div>
            ) : (
              <Button variant="brand" size="md" className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />自动生成中...</>
                ) : (
                  <><FileCheck className="w-4 h-4 mr-2" />一键生成结项报告 (PDF)</>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
