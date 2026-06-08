import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';
import {
  FileText, Download, RefreshCw, Sparkles, TrendingUp, Target, Users,
  Building2, Award, AlertTriangle, MapPin, Calendar, Zap, Shield, Star,
  Lightbulb, ChevronRight, CheckCircle2, X, ArrowUp, ArrowDown, Video
} from 'lucide-react';

interface PartnerBusinessPlanProps {
  partner: any;
  relatedDeals: any[];
  relatedPlans?: any[];
  contacts?: any[];
  onScheduleJBP?: () => void;
}

// Extract 10 key tags from partner data
function extractTags(partner: any, deals: any[], contacts?: any[]): Array<{ label: string; value: string; icon: typeof Star; color: string; detail: string }> {
  const tags: Array<{ label: string; value: string; icon: typeof Star; color: string; detail: string }> = [];

  // 1. Partner Tier & Status
  tags.push({
    label: '合作等级', value: partner.tier || 'Registered',
    icon: Award, color: 'text-amber-600',
    detail: `${partner.tier || 'Registered'} 级合作伙伴，${partner.status === 'Cooperating' ? '已建立合作关系' : '待发展'}，合作始于 ${partner.start_date?.slice(0, 7) || '近期'}`
  });

  // 2. Industry Focus
  const industries = partner.industry ? partner.industry.split('、').filter(Boolean) : [];
  const capabilities = partner.capabilities || [];
  const focusAreas = [...new Set([...industries, ...capabilities])];
  tags.push({
    label: '行业聚焦', value: focusAreas.slice(0, 3).join(' · ') || '待明确',
    icon: Target, color: 'text-blue-600',
    detail: `核心行业: ${focusAreas.join('、') || '待明确'}。建议深耕${focusAreas[0] || '目标行业'}，拓展${focusAreas[1] || '相邻行业'}市场`
  });

  // 3. Geographic Coverage
  const region = partner.region || partner.province || partner.city || '待明确';
  tags.push({
    label: '区域覆盖', value: [partner.province, partner.city].filter(Boolean).join(' ') || region,
    icon: MapPin, color: 'text-emerald-600',
    detail: `总部位于 ${partner.city || partner.province || '待明确'}，覆盖 ${region} 区域。${partner.city ? '建议以' + partner.city + '为中心辐射周边城市' : '建议明确重点城市布局'}`
  });

  // 4. Deal Pipeline
  const totalPipeline = deals.reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'ClosedWon' || d.status === 'Converted');
  const activeDeals = deals.filter(d => d.stage !== 'ClosedWon' && d.stage !== 'ClosedLost');
  tags.push({
    label: '商机管道', value: `${deals.length}个 · ${formatCurrency(totalPipeline, 'CNY')}`,
    icon: TrendingUp, color: totalPipeline > 5000000 ? 'text-emerald-600' : 'text-amber-600',
    detail: `总商机 ${deals.length} 个，总价值 ${formatCurrency(totalPipeline, 'CNY')}。活跃商机 ${activeDeals.length} 个，成交 ${wonDeals.length} 个`
  });

  // 5. Win Rate & Performance
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
  tags.push({
    label: '赢单率', value: `${winRate}%`,
    icon: Zap, color: winRate >= 30 ? 'text-emerald-600' : winRate > 0 ? 'text-amber-600' : 'text-red-500',
    detail: winRate > 0 ? `赢单率 ${winRate}%，${winRate >= 30 ? '表现良好' : '有待提升'}。建议优化商机筛选和方案匹配` : '暂无赢单记录，建议加强售前支持和方案能力建设'
  });

  // 6. Team & Contacts
  const contactCount = contacts?.length || 0;
  const keyRoles = contacts?.map((c: any) => c.title).filter(Boolean) || [];
  tags.push({
    label: '团队规模', value: `${contactCount} 位联系人`,
    icon: Users, color: 'text-purple-600',
    detail: contactCount > 0 ? `已建立 ${contactCount} 位联系人，关键角色: ${keyRoles.join('、')}` : '尚未建立联系人档案，建议尽快完善'
  });

  // 7. Certification Level
  const certs = partner.certifications || [];
  tags.push({
    label: '认证水平', value: certs.length > 0 ? certs.join(' · ') : '未认证',
    icon: Shield, color: certs.length >= 2 ? 'text-emerald-600' : 'text-amber-600',
    detail: certs.length > 0 ? `已获得 ${certs.join('、')}，${certs.length >= 2 ? '技术能力有保障' : '建议继续获取更高级别认证'}` : '尚未获得认证，建议优先完成 L1 认证以解锁更多权益'
  });

  // 8. Monthly Activity Trend
  const monthly = partner.monthly_activity || [];
  const recentActivity = monthly.slice(-3);
  const activityTrend = recentActivity.length >= 2 ? (recentActivity[recentActivity.length - 1] || 0) - (recentActivity[0] || 0) : 0;
  tags.push({
    label: '活跃度趋势', value: activityTrend > 0 ? '↑ 上升' : activityTrend < 0 ? '↓ 下降' : '→ 平稳',
    icon: activityTrend > 0 ? ArrowUp : activityTrend < 0 ? ArrowDown : Calendar,
    color: activityTrend > 0 ? 'text-emerald-600' : activityTrend < 0 ? 'text-red-500' : 'text-neutral-600',
    detail: `近3月活跃度${activityTrend > 0 ? '呈上升趋势' : activityTrend < 0 ? '有所下降' : '保持平稳'}。${activityTrend < 0 ? '建议加强互动和赋能投入' : '继续保持良好的合作节奏'}`
  });

  // 9. Customer Portfolio
  const customers = partner.customer_portfolio || [];
  tags.push({
    label: '客户资产', value: customers.length > 0 ? `${customers.length} 个客户` : '待积累',
    icon: Building2, color: customers.length >= 3 ? 'text-emerald-600' : 'text-amber-600',
    detail: customers.length > 0 ? `已积累 ${customers.length} 个客户案例。${customers.map((c: any) => c.name).slice(0, 3).join('、')}${customers.length > 3 ? '等' : ''}` : '暂无客户案例积累，建议从小项目切入建立标杆'
  });

  // 10. Core Partner Status
  const isCore = partner.is_core_partner;
  tags.push({
    label: '核心伙伴', value: isCore ? '✅ 是' : '❌ 否',
    icon: Star, color: isCore ? 'text-amber-600' : 'text-neutral-400',
    detail: isCore ? '已入选核心伙伴计划，享受优先商机分配和专属技术支持' : '尚未成为核心伙伴。建议提升认证等级和业绩贡献以申请核心伙伴资格'
  });

  return tags;
}

// Generate business plan summary
function generateSummary(tags: Array<{ label: string; value: string; detail: string }>): string {
  const name = tags.find(t => t.label === '合作等级');
  const focus = tags.find(t => t.label === '行业聚焦');
  const pipeline = tags.find(t => t.label === '商机管道');
  const cert = tags.find(t => t.label === '认证水平');
  const core = tags.find(t => t.label === '核心伙伴');

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (Number(tags.find(t => t.label === '赢单率')?.value.replace('%', '')) >= 30) strengths.push('赢单率良好');
  else improvements.push('提升赢单率');

  if (tags.find(t => t.label === '认证水平')?.value.includes('L2')) strengths.push('技术认证完备');
  else improvements.push('完成更高级别认证');

  if (core?.value.includes('是')) strengths.push('核心伙伴身份');
  else improvements.push('争取核心伙伴资格');

  if (tags.find(t => t.label === '活跃度趋势')?.value.includes('↑')) strengths.push('活跃度上升');
  else if (tags.find(t => t.label === '活跃度趋势')?.value.includes('↓')) improvements.push('提升活跃度');

  return `## 合作伙伴业务计划\n\n### 基本信息\n- **伙伴名称**: ${name?.detail.split('。')[0] || '待完善'}\n- **核心领域**: ${focus?.value || '待明确'}\n- **商机概况**: ${pipeline?.detail || '暂无数据'}\n\n### 优势分析\n${strengths.map(s => `- ✅ ${s}`).join('\n')}\n\n### 改进方向\n${improvements.map(i => `- 📌 ${i}`).join('\n')}\n\n### 下一步行动\n1. 制定季度联合业务目标\n2. 安排技术赋能培训\n3. 共同开拓 ${focus?.value?.split('·')[0]?.trim() || '目标'} 市场\n4. 建立月度业务复盘机制\n\n---\n*由 PartnerNexus 智能业务计划生成器自动生成*`;
}

export const PartnerBusinessPlan = ({ partner, relatedDeals, contacts, onScheduleJBP }: PartnerBusinessPlanProps) => {
  const [show, setShow] = useState(false);
  const [generating, setGenerating] = useState(false);

  const tags = useMemo(() => extractTags(partner, relatedDeals, contacts), [partner, relatedDeals, contacts]);
  const summary = useMemo(() => generateSummary(tags), [tags]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShow(true);
    }, 800);
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${partner.name || 'partner'}_business_plan.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Generate Button */}
      {!show && (
        <Card className="border-2 border-dashed border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">一键生成业务计划</h3>
                <p className="text-[11px] text-neutral-500">从伙伴数据中智能抽取 10 个核心标签，自动生成结构化业务计划文档</p>
              </div>
            </div>
            <Button variant="brand" size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />分析中...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />生成业务计划</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Business Plan Panel */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-blue-200 dark:border-blue-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5 text-blue-600" />
                    {partner.name} · 业务计划
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={handleDownload}>
                      <Download className="w-3.5 h-3.5 mr-1" />下载 MD
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShow(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 10 Key Tags Grid */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-500 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    智能抽取的 10 个核心标签
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {tags.map((tag, i) => (
                      <div
                        key={i}
                        className="group relative p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all cursor-default"
                        title={tag.detail}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <tag.icon className={cn('w-3.5 h-3.5', tag.color)} />
                          <span className="text-[10px] text-neutral-400">{tag.label}</span>
                        </div>
                        <p className={cn('text-[11px] font-bold line-clamp-2', tag.color)}>{tag.value}</p>
                        {/* Hover detail tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-neutral-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed">
                          {tag.detail}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-neutral-800 rotate-45" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Plan Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    智能业务计划摘要
                  </h4>
                  <div className="space-y-4">
                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-[11px] font-semibold text-emerald-600 mb-2">✅ 优势分析</h5>
                        <ul className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                          {tags.filter(t => t.label === '赢单率' && Number(t.value.replace('%', '')) >= 30).length > 0 && <li className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />赢单率表现良好，客户认可度高</li>}
                          {tags.filter(t => t.label === '认证水平' && t.value.includes('L2')).length > 0 && <li className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />技术认证完备，方案交付能力强</li>}
                          {tags.filter(t => t.label === '活跃度趋势' && t.value.includes('↑')).length > 0 && <li className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />近期活跃度上升，合作意愿强</li>}
                          {tags.filter(t => t.label === '客户资产' && parseInt(t.value) >= 3).length > 0 && <li className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />已积累多个客户案例，有标杆效应</li>}
                          {tags.filter(t => t.label === '商机管道' && relatedDeals.length >= 5).length > 0 && <li className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />商机管道丰富，市场拓展积极</li>}
                          <li className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />覆盖{tags.find(t => t.label === '区域覆盖')?.value?.split(' ')[0] || '核心'}区域，有本地化优势</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-semibold text-amber-600 mb-2">📌 改进方向</h5>
                        <ul className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                          {tags.filter(t => t.label === '核心伙伴' && t.value.includes('否')).length > 0 && <li className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />申请核心伙伴资格，解锁优先商机</li>}
                          {tags.filter(t => t.label === '认证水平' && !t.value.includes('L2')).length > 0 && <li className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />完成更高级别技术认证</li>}
                          {tags.filter(t => t.label === '赢单率' && Number(t.value.replace('%', '')) < 30).length > 0 && <li className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />加强售前支持和方案匹配能力</li>}
                          <li className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />建立月度业务复盘机制</li>
                          <li className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />拓展相邻行业市场，降低单一行业风险</li>
                        </ul>
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div>
                      <h5 className="text-[11px] font-semibold text-blue-600 mb-2">🎯 下一步行动</h5>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {[
                          '制定季度联合业务目标和 KPI',
                          '安排技术赋能培训（建议 2 周内）',
                          `共同开拓 ${tags.find(t => t.label === '行业聚焦')?.value?.split('·')[0]?.trim() || '目标'} 市场`,
                          '建立双周业务复盘和 pipeline review',
                        ].map((step, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-neutral-800 rounded-lg">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                            <span className="text-neutral-700 dark:text-neutral-300">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* JBP Meeting CTA */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-neutral-900 dark:text-white">发起 JBP 联合业务规划会议</h5>
                            <p className="text-[10px] text-neutral-500 mt-0.5">
                              基于以上 10 个标签和业务计划，与 {partner.name} 共同制定季度 Joint Business Plan
                            </p>
                          </div>
                        </div>
                        <Button variant="brand" size="md" onClick={onScheduleJBP} className="shrink-0">
                          <Calendar className="w-4 h-4 mr-2" />发起 JBP 会议
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-3 text-[10px]">
                        {[
                          { label: '会议类型', value: '季度业务复盘 + 规划' },
                          { label: '建议时长', value: '90 分钟' },
                          { label: '参会角色', value: '双方销售 + 技术负责人' },
                          { label: '核心议题', value: `业务回顾 · ${tags.find(t => t.label === '行业聚焦')?.value?.split('·')[0] || '市场'}拓展 · 目标设定` },
                        ].map((item, i) => (
                          <div key={i} className="p-2 bg-white dark:bg-neutral-800 rounded-lg">
                            <p className="text-neutral-400 mb-0.5">{item.label}</p>
                            <p className="font-semibold text-neutral-700 dark:text-neutral-300">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
