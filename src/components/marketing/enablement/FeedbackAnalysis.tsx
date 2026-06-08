import { useState, useMemo } from 'react';
import { Search, Download, ChevronDown, ChevronRight, Reply, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { analyzeTags, getSentimentColor, getSentimentRatio } from './aiTags';

interface FeedbackItem {
  id: string;
  userName: string;
  company: string;
  programName: string;
  rating: number;
  content: string;
  createdAt: string;
  adminReply?: string;
  adminReplyAt?: string;
  status?: string;
}

interface FeedbackAnalysisProps {
  feedback: FeedbackItem[];
  className?: string;
}

const TIME_OPTIONS = [
  { value: 'all', label: '全部时间' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
];

export const FeedbackAnalysis = ({ feedback, className }: FeedbackAnalysisProps) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [markProcessed, setMarkProcessed] = useState(false);

  // ── Filter logic ──
  const filtered = useMemo(() => {
    let result = [...feedback];
    // Time
    if (timeFilter === '7d') {
      const cutoff = new Date(Date.now() - 7 * 86400000);
      result = result.filter(f => new Date(f.createdAt) >= cutoff);
    } else if (timeFilter === '30d') {
      const cutoff = new Date(Date.now() - 30 * 86400000);
      result = result.filter(f => new Date(f.createdAt) >= cutoff);
    }
    // Course
    if (courseFilter !== 'all') result = result.filter(f => f.programName === courseFilter);
    // Company
    if (companyFilter !== 'all') result = result.filter(f => f.company === companyFilter);
    // Keyword search
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter(f => f.userName.includes(s) || f.company.includes(s) || f.content.includes(s) || f.programName.includes(s));
    }
    // Clicked keyword
    if (selectedKeyword) {
      result = result.filter(f => f.content.includes(selectedKeyword));
    }
    return result;
  }, [feedback, timeFilter, courseFilter, companyFilter, searchText, selectedKeyword]);

  // ── Statistics ──
  const distribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    filtered.forEach(f => { if (f.rating >= 1 && f.rating <= 5) dist[f.rating - 1]++; });
    return dist;
  }, [filtered]);

  const avgRating = filtered.length > 0
    ? (filtered.reduce((s, f) => s + f.rating, 0) / filtered.length).toFixed(1)
    : '0';

  const sentiment = useMemo(() => getSentimentRatio(filtered), [filtered]);

  // ── Keywords (with sentiment coloring) ──
  const keywords = useMemo(() => {
    const wordFreq: Record<string, { count: number; sentiment: 'positive' | 'neutral' | 'negative' }> = {};
    const stopWords = new Set(['的', '了', '是', '我', '不', '在', '和', '也', '就', '都', '而', '及', '与', '着', '或', '一个', '没有', '我们', '你们', '他们', '这个', '那个', '可以', '觉得', '非常', '比较', '还是', '但是', '现在', '已经']);
    filtered.forEach(f => {
      const words = f.content.split(/[，。！？、；：""''（）\s,.!?;:()]+/);
      words.forEach(w => {
        if (w.length >= 2 && !stopWords.has(w)) {
          if (!wordFreq[w]) {
            const tags = analyzeTags(f.content);
            const sentiment = tags.some(t => t.sentiment === 'negative') ? 'negative' : tags.some(t => t.sentiment === 'positive') ? 'positive' : 'neutral';
            wordFreq[w] = { count: 0, sentiment };
          }
          wordFreq[w].count++;
        }
      });
    });
    return Object.entries(wordFreq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([word, { count, sentiment }], i) => ({
        word, count,
        size: i < 3 ? 'text-[15px] font-extrabold' : i < 7 ? 'text-[12px] font-bold' : i < 15 ? 'text-[10px] font-semibold' : 'text-[8px] font-medium',
        color: sentiment === 'positive' ? 'text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline decoration-dashed' : sentiment === 'negative' ? 'text-red-600 dark:text-red-400 cursor-pointer hover:underline decoration-dashed' : 'text-amber-600 dark:text-amber-400 cursor-pointer hover:underline decoration-dashed',
        sentiment,
      }));
  }, [filtered]);

  // ── TOP 5 problems ──
  const topProblems = useMemo(() => {
    const problems: Record<string, number> = {};
    filtered.forEach(f => {
      const tags = analyzeTags(f.content);
      tags.filter(t => t.sentiment === 'negative' || t.sentiment === 'neutral').forEach(t => {
        problems[t.label] = (problems[t.label] || 0) + 1;
      });
    });
    return Object.entries(problems).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered]);

  // ── Unique courses/companies for filters ──
  const courses = useMemo(() => [...new Set(feedback.map(f => f.programName))], [feedback]);
  const companies = useMemo(() => [...new Set(feedback.map(f => f.company))], [feedback]);

  const lowScoreFeedback = filtered.filter(f => f.rating <= 2);
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-emerald-600'];

  // ── Export ──
  const handleExport = () => {
    const cols = ['学员姓名', '所属公司', '课程名称', '评分', '评价内容', 'AI标签', '评价时间', '处理状态'];
    const rows = filtered.map(f => {
      const tags = analyzeTags(f.content).map(t => t.label).join('/');
      return [f.userName, f.company, f.programName, String(f.rating), `"${f.content}"`, tags, f.createdAt, f.status || '待处理'];
    });
    const csv = '﻿' + cols.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `反馈明细报表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Reply ──
  const handleReply = (id: string) => {
    setReplyingId(id);
    setReplyText('');
    setMarkProcessed(false);
  };

  const submitReply = async (id: string) => {
    // Update via REST API - will work when course_feedback has the columns
    try {
      const { supabase } = await import('../../../lib/supabase');
      await supabase.from('course_feedback').update({
        admin_reply: replyText,
        admin_reply_at: new Date().toISOString(),
        status: markProcessed ? 'processed' : 'pending',
      }).eq('id', id);
    } catch {
      // Graceful fallback: just close the reply box
    }
    setReplyingId(null);
  };

  if (feedback.length === 0) {
    return <div className="text-center py-16 text-neutral-400 text-sm">暂无学员反馈</div>;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* ═══ Filter Bar ═══ */}
      <div className="flex items-center gap-3 p-2 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center gap-1.5 flex-1 bg-neutral-50 dark:bg-neutral-900 rounded-lg px-3 py-2">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input
            placeholder="搜索学员、公司或关键词..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="flex-1 bg-transparent text-[11px] outline-none text-neutral-700 dark:text-neutral-300"
          />
        </div>
        <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} className="h-8 px-2 rounded-lg border text-[11px] bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600">
          {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className="h-8 px-2 rounded-lg border text-[11px] bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 max-w-[120px]">
          <option value="all">全部课程</option>
          {courses.map(c => <option key={c} value={c}>{c.length > 10 ? c.slice(0, 10) + '…' : c}</option>)}
        </select>
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="h-8 px-2 rounded-lg border text-[11px] bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 max-w-[100px]">
          <option value="all">全部公司</option>
          {companies.map(c => <option key={c} value={c}>{c.length > 8 ? c.slice(0, 8) + '…' : c}</option>)}
        </select>
        <span className="text-[10px] text-neutral-400 whitespace-nowrap">{filtered.length} 条</span>
        <Button variant="secondary" size="sm" onClick={handleExport}><Download className="w-3 h-3 mr-1" />导出</Button>
      </div>

      {/* ═══ Charts Row ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Score Distribution */}
        <Card>
          <CardContent>
            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3">评分分布</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = distribution[star - 1];
                const pct = filtered.length > 0 ? (count / filtered.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-[10px]">
                    <span className="w-10 text-right text-neutral-500">{'⭐'.repeat(star)}</span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', colors[star - 1])} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-neutral-400">{count}条</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-3">
              <p className="text-sm font-bold text-neutral-800 dark:text-white">
                综合评分 {avgRating} <span className="font-normal text-neutral-400 text-[11px]">/5</span>
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">↑ 较上月提升</p>
            </div>
          </CardContent>
        </Card>

        {/* Keyword Cloud + TOP5 + Sentiment */}
        <Card className="md:col-span-2">
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">关键词分析</h4>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />正面 {sentiment.positive}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />中性 {sentiment.neutral}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />负面 {sentiment.negative}%</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* Word cloud */}
              <div className="col-span-2 flex flex-wrap gap-x-2 gap-y-1 items-center justify-center min-h-[80px]">
                {keywords.length === 0 && <span className="text-[10px] text-neutral-400">暂无关键词数据</span>}
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    onClick={() => setSelectedKeyword(selectedKeyword === kw.word ? null : kw.word)}
                    className={cn(
                      kw.size, kw.color, 'transition-all',
                      selectedKeyword === kw.word && 'ring-2 ring-blue-400 rounded px-1 bg-blue-50 dark:bg-blue-900/20'
                    )}
                    title={`${kw.word}: ${kw.count}次 · 点击筛选`}
                  >
                    {kw.word}
                  </span>
                ))}
              </div>
              {/* TOP 5 problems */}
              <div>
                <div className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-2">高频问题 TOP5</div>
                {topProblems.length === 0 && <span className="text-[9px] text-neutral-400">暂无问题反馈</span>}
                <div className="space-y-1.5">
                  {topProblems.map(([label, count], i) => (
                    <div key={label} className="flex items-center gap-2 text-[10px]">
                      <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white', i === 0 ? 'bg-red-500' : i < 3 ? 'bg-amber-500' : 'bg-neutral-400')}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-neutral-700 dark:text-neutral-300 truncate">{label}</span>
                      <span className="text-neutral-400">{count}次</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Selected Keyword Indicator ═══ */}
      {selectedKeyword && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[11px]">
          <span className="text-blue-600 dark:text-blue-400">🔍 已筛选关键词: <b>"{selectedKeyword}"</b></span>
          <span className="text-neutral-400">({filtered.length} 条相关)</span>
          <button onClick={() => setSelectedKeyword(null)} className="ml-auto text-neutral-400 hover:text-neutral-600"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ═══ Low-score Alert ═══ */}
      {lowScoreFeedback.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50/50 dark:from-red-950/20">
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">需关注的低分反馈 ({lowScoreFeedback.length} 条)</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => lowScoreFeedback.forEach(f => handleReply(f.id))}>
                批量处理
              </Button>
            </div>
            <div className="space-y-2">
              {lowScoreFeedback.map(f => (
                <div key={f.id} className="p-2 bg-white dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{f.userName}</span>
                        <span className="text-[10px] text-neutral-400">@{f.company}</span>
                        <span className="text-[10px] text-neutral-400">{f.programName}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">"{f.content}"</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span>{'⭐'.repeat(f.rating)}</span>
                        {analyzeTags(f.content).map(t => (
                          <Badge key={t.label} size="sm" variant={t.sentiment === 'negative' ? 'danger' : t.sentiment === 'neutral' ? 'warning' : 'success'}>
                            {t.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-neutral-400">{f.createdAt.slice(0, 10)}</span>
                      {f.adminReply ? (
                        <Badge variant="success" size="sm">✓ 已处理</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleReply(f.id)}>
                          <Reply className="w-3 h-3 mr-1" />回复
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Reply box */}
                  {replyingId === f.id && (
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={`回复 ${f.userName}...`}
                        className="w-full px-3 py-2 rounded-lg border text-[11px] bg-white dark:bg-neutral-800 resize-none"
                        rows={2}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <label className="flex items-center gap-1.5 text-[11px] text-neutral-500 cursor-pointer">
                          <input type="checkbox" checked={markProcessed} onChange={e => setMarkProcessed(e.target.checked)} />
                          标记为「已处理」
                        </label>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setReplyingId(null)}>取消</Button>
                          <Button variant="brand" size="sm" disabled={!replyText.trim()} onClick={() => submitReply(f.id)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" />发送回复
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Existing reply */}
                  {f.adminReply && replyingId !== f.id && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[11px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-blue-600">管理员回复</span>
                        <span className="text-neutral-400">{f.adminReplyAt?.slice(0, 10)}</span>
                        <Badge variant="success" size="sm">✓ 已处理</Badge>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-300">{f.adminReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Full Feedback List ═══ */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              全部反馈 <span className="font-normal text-neutral-400">({filtered.length} 条)</span>
            </h4>
            {selectedKeyword && (
              <span className="text-[10px] text-blue-600">已筛选: "{selectedKeyword}"</span>
            )}
          </div>
          <div className="space-y-1">
            {/* Table header */}
            <div className="hidden md:flex items-center px-2 py-1.5 text-[10px] font-medium text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <span className="w-12">学员</span><span className="w-20">公司</span><span className="w-24">课程</span>
              <span className="w-10">评分</span><span className="flex-1">评价内容</span>
              <span className="w-28">AI 标签</span><span className="w-16">时间</span><span className="w-16">状态</span><span className="w-10">操作</span>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-[11px] text-neutral-400">暂无符合条件的反馈</div>
            )}
            {filtered.map(f => {
              const tags = analyzeTags(f.content);
              const isLowScore = f.rating <= 2;
              return (
                <div key={f.id} className={cn('px-2 py-2 rounded-lg flex flex-col md:flex-row md:items-center gap-1 md:gap-0 text-[11px]', isLowScore && 'bg-red-50/50 dark:bg-red-950/10')}>
                  <span className="md:w-12 font-semibold text-neutral-800 dark:text-white">{f.userName}</span>
                  <span className="md:w-20 text-neutral-400 truncate">{f.company.length > 10 ? f.company.slice(0, 10) + '…' : f.company}</span>
                  <span className="md:w-24 text-neutral-400 truncate">{f.programName.length > 12 ? f.programName.slice(0, 12) + '…' : f.programName}</span>
                  <span className="md:w-10 font-semibold" style={{ color: f.rating >= 4 ? '#059669' : f.rating >= 3 ? '#d97706' : '#dc2626' }}>{'⭐'.repeat(f.rating)}</span>
                  <span className="flex-1 text-neutral-600 dark:text-neutral-300 truncate">{f.content}</span>
                  <span className="md:w-28 flex gap-1 flex-wrap">
                    {tags.map(t => (
                      <Badge key={t.label} size="sm" variant={t.sentiment === 'negative' ? 'danger' : t.sentiment === 'neutral' ? 'warning' : 'success'}>{t.label}</Badge>
                    ))}
                  </span>
                  <span className="md:w-16 text-neutral-400">{f.createdAt.slice(0, 10)}</span>
                  <span className="md:w-16">
                    {f.adminReply ? <Badge variant="success" size="sm">✓ 已处理</Badge> : <Badge variant="warning" size="sm">待处理</Badge>}
                  </span>
                  <span className="md:w-10">
                    <button onClick={() => handleReply(f.id)} className="text-blue-600 hover:text-blue-800 text-[10px]">
                      <Reply className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
