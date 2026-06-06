import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Eye, Copy, TrendingUp, Users, DollarSign, X, Target, Lightbulb, Download } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface BenchmarkSquareProps { open: boolean; onClose: () => void; }

const cases = [
  {
    rank: 1, name: '华东医疗行业数字化转型峰会', partner: '上海测试公司', roi: '1:8.5', leads: 42, deals: 5, revenue: 2800000, attendanceRate: 85,
    tier: 'S', badge: '最强标杆',
    highlights: ['提前3周通过H5邀请函精准触达120家医院', '原厂架构师张明远现场Demo引发8家意向', '会后48h内完成全部线索跟进，转化率行业第一'],
    tips: '核心经验：用行业白皮书作为引流钩子，H5报名页转化率提升40%',
    script: '邀约话术："我们联合X医院做了AI诊断案例，院长想邀请您来看一下实际效果"',
    materials: ['H5邀请函模板(已复用32次)', '医疗行业解决方案PPT', 'AI影像Demo视频'],
  },
  {
    rank: 2, name: '制造业智能工厂转型沙龙', partner: '北京测试公司', roi: '1:6.2', leads: 35, deals: 4, revenue: 1800000, attendanceRate: 78,
    tier: 'A', badge: '高转化案例',
    highlights: ['聚焦5家大型制造企业CIO定向邀请', '现场设置产品体验区，客户沉浸式操作', '联合制造行业协会背书，提升公信力'],
    tips: '核心经验：定向邀请决策者比广撒网有效10倍，到场率78%',
    script: '邀约话术："工信部智能制造示范项目参访机会，仅限5个名额"',
    materials: ['制造业白皮书', '工厂数字化诊断评估表', '客户案例视频'],
  },
  {
    rank: 3, name: '金融行业数据安全专题Webinar', partner: '上海测试公司', roi: '1:5.0', leads: 28, deals: 3, revenue: 1200000, attendanceRate: 65,
    tier: 'A', badge: '最佳线上案例',
    highlights: ['线上参会200+人，覆盖全国30个城市', '问答环节产生28条高质量线索', '会后邮件培育序列转化3个商机'],
    tips: '核心经验：Webinar需设置互动环节（提问/抽奖），互动客户转化率是非互动的3倍',
    script: '邀约话术："央行发布了新的数据安全管理办法，我们请到了参与起草的专家解读"',
    materials: ['Webinar流程SOP', '数据安全白皮书', '会后跟进邮件模板'],
  },
];

export const BenchmarkSquare: React.FC<BenchmarkSquareProps> = ({ open, onClose }) => {
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><Trophy className="w-5 h-5 text-amber-500" /><h2 className="text-lg font-semibold">标杆案例广场</h2></div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm"><Star className="w-3 h-3" /> ROI 前5%</Badge>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-neutral-500 mb-4 flex items-center gap-1"><Lightbulb className="w-4 h-4 text-amber-500" />系统自动识别ROI排名前5%的活动。点击展开可查看完整复盘——伙伴可以"抄作业"</p>
            <div className="space-y-4">
              {cases.map(c => (
                <Card key={c.rank} hover onClick={() => setExpandedCase(expandedCase === c.name ? null : c.name)}>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0', c.rank === 1 ? 'bg-amber-100 text-amber-700' : c.rank === 2 ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-50 text-neutral-500')}>{c.rank}</span>
                        <div>
                          <div className="flex items-center gap-2"><span className="text-sm font-semibold">{c.name}</span><Badge variant={c.tier === 'S' ? 'warning' : 'success'} size="sm">{c.tier}级 {c.badge}</Badge></div>
                          <p className="text-xs text-neutral-500 mt-0.5">{c.partner} · ROI {c.roi} · {c.leads}条线索 · {c.deals}单成交 · {formatCurrency(c.revenue)} · 到场率{c.attendanceRate}%</p>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-neutral-400" />
                    </div>

                    {expandedCase === c.name && (
                      <div className="mt-4 p-4 bg-amber-50/50 dark:bg-amber-900/5 rounded-xl border border-amber-200 dark:border-amber-800 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-amber-800 mb-1">🎯 亮点:</p>
                          <ul className="list-disc pl-4 space-y-1">{c.highlights.map((h, i) => <li key={i} className="text-xs text-amber-700">{h}</li>)}</ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-800 mb-1">💡 {c.tips}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-800 mb-1">📞 邀约话术:</p>
                          <p className="text-xs text-amber-700 bg-amber-100/50 dark:bg-amber-900/10 p-2 rounded">"{c.script}"</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-800 mb-1">📦 复用物料:</p>
                          <div className="flex flex-wrap gap-1">{c.materials.map((m, i) => <Badge key={i} size="sm">{m}</Badge>)}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm"><Copy className="w-3.5 h-3.5 mr-1" />一键复制方案</Button>
                          <Button variant="secondary" size="sm"><Download className="w-3.5 h-3.5 mr-1" />下载物料包</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
