import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, TrendingUp, TrendingDown, CheckCircle2,
  Clock, FileText, Users, Zap, Target, ChevronRight, Filter,
  Bell, Lightbulb, Activity, Sparkles, X
} from 'lucide-react';
import { Deal } from '../../types';
import { dealAlertService, type DealAlert, type DealInspectionReport, type AlertType } from '../../services/lifecycle-service';
import { DEAL_MATURITY_STAGE_CONFIG } from '../../types';

const TYPE_LABELS: Record<AlertType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  protection_expiring: { label: '保护期将到期', color: 'text-rose-700', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: <Clock className="w-4 h-4" /> },
  expired_protection:  { label: '保护期已过期', color: 'text-orange-700', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: <Shield className="w-4 h-4" /> },
  stagnant_deal:       { label: '长期停滞', color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: <TrendingDown className="w-4 h-4" /> },
  low_health:          { label: '健康度过低', color: 'text-red-700', bg: 'bg-red-50 dark:bg-red-900/20', icon: <AlertTriangle className="w-4 h-4" /> },
  ready_for_promotion: { label: '可晋级', color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: <TrendingUp className="w-4 h-4" /> },
  missing_solution:    { label: '缺少方案证据', color: 'text-indigo-700', bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: <FileText className="w-4 h-4" /> },
  partner_stuck:       { label: '伙伴漏斗阻塞', color: 'text-purple-700', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: <Users className="w-4 h-4" /> },
};

const SEVERITY_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', label: '紧急' },
  high:     { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300', label: '高' },
  medium:   { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', label: '中' },
  low:      { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', label: '低' },
};

export const DealHealthInspectionPage = ({ deals }: { deals: Deal[] }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showBanner, setShowBanner] = useState(true);

  const report: DealInspectionReport = useMemo(() => {
    return dealAlertService.generateReport(deals || []);
  }, [deals]);

  // 保护期即将到期的商机（首页顶部 banner）
  const expiringDeals = useMemo(() =>
    dealAlertService.getExpiringProtectionDeals(deals || [], 7),
  [deals]);

  // 过滤告警
  const filteredAlerts = useMemo(() => {
    let result = report.alerts;
    if (filter !== 'all') result = result.filter(a => a.type === filter);
    if (severityFilter !== 'all') result = result.filter(a => a.severity === severityFilter);
    return result;
  }, [report, filter, severityFilter]);

  // 格式化金额
  const fmt = (v: number) => {
    if (!v) return '0';
    if (v >= 10000) return (v / 10000).toFixed(1) + '万';
    return String(v);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-20">

      {/* ── 保护期到期紧急提醒 Banner ── */}
      {showBanner && expiringDeals.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 text-white">
          <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-start gap-4">
            <Bell className="w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <div className="font-bold text-lg mb-1">
                🚨 有 {expiringDeals.length} 个商机的保护期将在 7 天内到期
              </div>
              <div className="text-sm text-white/90 mb-3">
                若不能在保护期内推进至方案阶段，可能被其他伙伴重新报备。请立即处理。
              </div>
              <div className="flex flex-wrap gap-2">
                {expiringDeals.slice(0, 5).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => navigate(`/deals/${d.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-medium border border-white/30 transition-all hover:scale-[1.02]"
                  >
                    {d.partnerName} · {d.customerName} · 剩余 {d.protectionRemainingDays} 天
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ── 页面标题区 ── */}
      <div className="max-w-[1400px] mx-auto px-6 pt-10">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> DEAL HEALTH INSPECTION
            </div>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">商机健康巡检报告</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              基于 4 支柱健康度（身份/价值/管理/粘性）与 4 阶段关系深度生命周期，自动识别需关注的商机。
            </p>
            <div className="text-xs text-neutral-400 mt-1">
              报告生成时间：{new Date(report.generatedAt).toLocaleString()} · 共扫描 {report.totalDealsScanned} 个商机
            </div>
          </div>

          {/* 关键指标：右上角 */}
          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm min-w-[120px]">
              <div className="text-xs font-semibold text-neutral-500 mb-1">平均健康度</div>
              <div className={`text-3xl font-black ${report.summary.avgHealthScore >= 70 ? 'text-emerald-600' : report.summary.avgHealthScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                {report.summary.avgHealthScore}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 shadow-sm min-w-[120px]">
              <div className="text-xs font-semibold text-rose-700 mb-1">紧急告警</div>
              <div className="text-3xl font-black text-rose-700">{report.summary.bySeverity.critical}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 shadow-sm min-w-[120px]">
              <div className="text-xs font-semibold text-amber-700 mb-1">需关注</div>
              <div className="text-3xl font-black text-amber-700">{report.summary.bySeverity.high + report.summary.bySeverity.medium}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 shadow-sm min-w-[120px]">
              <div className="text-xs font-semibold text-emerald-700 mb-1">可晋级</div>
              <div className="text-3xl font-black text-emerald-700">{report.summary.promotableCount}</div>
            </div>
          </div>
        </div>

        {/* ── 7 类告警快速统计卡片 ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button
            onClick={() => { setFilter('all'); }}
            className={`p-3 rounded-xl border-2 transition-all text-left hover:shadow-md hover:-translate-y-0.5 ${
              filter === 'all'
                ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
            }`}
          >
            <div className="text-xs font-bold mb-1 opacity-80">全部</div>
            <div className="text-2xl font-black">{report.summary.totalAlerts}</div>
          </button>
          {(Object.keys(TYPE_LABELS) as AlertType[]).map((t) => {
            const count = report.summary.byType[t] || 0;
            const info = TYPE_LABELS[t];
            const active = filter === t;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`p-3 rounded-xl border-2 transition-all text-left hover:shadow-md hover:-translate-y-0.5 ${
                  active ? `${info.bg} border-current ${info.color} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900` :
                  'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold mb-1 opacity-80">
                  {info.icon}
                  <span>{info.label}</span>
                </div>
                <div className="text-2xl font-black">{count}</div>
              </button>
            );
          })}
        </div>

        {/* ── 严重度筛选条 ── */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-neutral-500" />
          <span className="text-xs text-neutral-500 font-semibold mr-2">严重度</span>
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                severityFilter === sev
                  ? 'border-brand bg-brand text-white shadow-md'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
              }`}
            >
              {sev === 'all' ? '全部' : SEVERITY_STYLE[sev]?.label}
              {sev !== 'all' && (
                <span className="ml-1 opacity-70">
                  ({sev === 'critical' ? report.summary.bySeverity.critical :
                     sev === 'high' ? report.summary.bySeverity.high :
                     sev === 'medium' ? report.summary.bySeverity.medium :
                     report.summary.bySeverity.low})
                </span>
              )}
            </button>
          ))}
          {(filter !== 'all' || severityFilter !== 'all') && (
            <button
              onClick={() => { setFilter('all'); setSeverityFilter('all'); }}
              className="ml-auto text-xs text-brand font-semibold hover:underline"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6">

        {/* ── 主内容区：告警列表（左） + 伙伴洞察（右） ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 左侧：告警列表（2/3 宽度） */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                告警详情 ({filteredAlerts.length})
              </h2>
              {filter !== 'all' && (
                <span className="text-xs text-neutral-500 ml-2">
                  筛选：{TYPE_LABELS[filter as AlertType]?.label || filter}
                </span>
              )}
            </div>

            {filteredAlerts.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <div className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  无需关注的商机 🎉
                </div>
                <div className="text-sm text-neutral-500">
                  当前筛选条件下没有告警，请继续保持良好的协同管理。
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[1200px] overflow-y-auto pr-2">
                {filteredAlerts.map((alert: DealAlert) => {
                  const typeInfo = TYPE_LABELS[alert.type];
                  const sevInfo = SEVERITY_STYLE[alert.severity];
                  return (
                    <div
                      key={alert.id}
                      className={`bg-white dark:bg-neutral-900 rounded-2xl border-2 ${
                        alert.severity === 'critical' ? 'border-rose-300 ring-1 ring-rose-200' :
                        alert.severity === 'high' ? 'border-orange-200' :
                        alert.severity === 'medium' ? 'border-amber-200' :
                        'border-emerald-200'
                      } shadow-sm hover:shadow-lg transition-all p-5`}
                    >
                      {/* 顶部：标题 + 标签 */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl ${typeInfo.bg} ${typeInfo.color} flex-shrink-0`}>
                            {typeInfo.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-neutral-900 dark:text-white">{alert.title}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sevInfo.bg} ${sevInfo.color} border ${sevInfo.border}`}>
                                {sevInfo.label}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500">
                              商机 <span className="font-semibold text-neutral-700 dark:text-neutral-300">{alert.dealTitle}</span>
                              <span className="mx-1.5">·</span>
                              伙伴 <span className="font-semibold text-neutral-700 dark:text-neutral-300">{alert.partnerName}</span>
                              <span className="mx-1.5">·</span>
                              客户 <span className="font-semibold text-neutral-700 dark:text-neutral-300">{alert.customerName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-neutral-900 dark:text-white">¥{fmt(alert.dealValue)}</div>
                          <div className="text-xs text-neutral-500">健康度 {alert.healthScore}</div>
                        </div>
                      </div>

                      {/* 中部：详情描述 */}
                      <div className={`text-sm text-neutral-600 dark:text-neutral-400 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 mb-3 leading-relaxed`}>
                        {alert.detail}
                      </div>

                      {/* 下部：建议行动 + 跳转按钮 */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400 flex-1 min-w-0">
                          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="flex-1"><span className="font-semibold text-neutral-700 dark:text-neutral-300">建议行动：</span>{alert.suggestedAction}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-[10px] text-neutral-400">
                            当前：{DEAL_MATURITY_STAGE_CONFIG[alert.dealStage]?.label || alert.dealStage} · 停留 {alert.daysInCurrentStage} 天
                          </div>
                          <button
                            onClick={() => navigate(`/deals/${alert.dealId}`)}
                            className="px-4 py-2 text-xs font-bold rounded-lg bg-brand hover:bg-brand/90 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 flex-shrink-0"
                          >
                            查看商机 <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 右侧：伙伴漏斗阻塞洞察 + 商机关系深度分布（1/3 宽度） */}
          <div className="space-y-6">

            {/* 伙伴洞察 */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-purple-50/80 to-transparent dark:from-purple-900/10">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-purple-700" />
                  <h3 className="font-bold text-neutral-900 dark:text-white">伙伴漏斗阻塞洞察</h3>
                </div>
                <div className="text-xs text-neutral-500">
                  识别 60% 以上商机卡在报备期的伙伴，判断是否需要定向赋能或降级合作。
                </div>
              </div>
              <div className="p-4">
                {report.partnerInsights.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                    <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      伙伴漏斗健康
                    </div>
                    <div className="text-xs text-neutral-500">未发现显著阻塞的伙伴。</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.partnerInsights.map((p, idx) => {
                      const ratio = Math.round((p.stuckInRegistration / p.totalDeals) * 100);
                      return (
                        <div key={idx} className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-neutral-900 dark:text-white text-sm">{p.partnerName}</div>
                            <span className="text-[10px] font-bold text-purple-700 px-2 py-0.5 rounded-full bg-white dark:bg-purple-900/30 border border-purple-300">
                              {ratio}% 卡在报备期
                            </span>
                          </div>
                          <div className="flex gap-2 mb-2 text-xs text-neutral-500">
                            <span>总商机 {p.totalDeals} 个</span>
                            <span>·</span>
                            <span>报备期 {p.stuckInRegistration} 个</span>
                            <span>·</span>
                            <span>平均健康度 {p.avgHealthScore}</span>
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {p.recommendedAction}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 巡检建议 */}
            <div className="bg-gradient-to-br from-brand/10 to-sky-500/5 dark:from-brand/20 dark:to-sky-900/10 rounded-2xl border border-brand/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-neutral-900 dark:text-white">本周巡检建议</h3>
              </div>
              <div className="space-y-3 text-sm">
                {report.summary.bySeverity.critical > 0 && (
                  <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300">
                    <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="flex-1">
                      优先处理 <b>{report.summary.bySeverity.critical}</b> 个紧急告警（保护期到期/停滞过久）。
                    </span>
                  </div>
                )}
                {report.summary.stagnantCount > 0 && (
                  <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="flex-1">
                      <b>{report.summary.stagnantCount}</b> 个商机停滞超过 2 倍平均周期，建议渠道经理逐个诊断。
                    </span>
                  </div>
                )}
                {report.summary.promotableCount > 0 && (
                  <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
                    <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="flex-1">
                      <b>{report.summary.promotableCount}</b> 个商机满足晋级条件，建议主动推动下一阶段协同。
                    </span>
                  </div>
                )}
                {report.summary.stuckPartners > 0 && (
                  <div className="flex items-start gap-2 text-purple-700 dark:text-purple-300">
                    <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="flex-1">
                      <b>{report.summary.stuckPartners}</b> 个伙伴的商机存在漏斗阻塞，建议评估赋能方案。
                    </span>
                  </div>
                )}
                {report.summary.totalAlerts === 0 && (
                  <div className="text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    生态健康状况良好，继续保持！
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-brand/20">
                <button
                  onClick={() => navigate('/deals')}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-brand hover:bg-brand/90 text-white shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  返回商机列表 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealHealthInspectionPage;
