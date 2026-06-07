import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { cn } from '../../../lib/utils';

interface FeedbackItem {
  id: string;
  userName: string;
  company: string;
  programName: string;
  rating: number;
  content: string;
  createdAt: string;
}

interface FeedbackAnalysisProps {
  feedback: FeedbackItem[];
  className?: string;
}

export const FeedbackAnalysis = ({ feedback, className }: FeedbackAnalysisProps) => {
  // Score distribution
  const distribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]; // 1⭐ to 5⭐
    feedback.forEach(f => { if (f.rating >= 1 && f.rating <= 5) dist[f.rating - 1]++; });
    return dist;
  }, [feedback]);

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : '0';

  // Simple keyword extraction (split by punctuation, filter short words)
  const keywords = useMemo(() => {
    const wordFreq: Record<string, number> = {};
    const stopWords = new Set(['的', '了', '是', '我', '不', '在', '和', '也', '就', '都', '而', '及', '与', '着', '或', '一个', '没有', '我们', '你们', '他们', '这个', '那个', '可以', '觉得', '非常', '比较', '还是', '但是']);
    feedback.forEach(f => {
      const words = f.content.split(/[，。！？、；：""''（）\s,.!?;:()]+/);
      words.forEach(w => {
        if (w.length >= 2 && !stopWords.has(w)) {
          wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
      });
    });
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count], i) => ({
        word,
        count,
        size: i < 3 ? 'text-[16px] font-extrabold' : i < 7 ? 'text-[13px] font-bold' : i < 12 ? 'text-[10px] font-semibold' : 'text-[8px] font-medium',
        color: i < 3 ? 'text-blue-600 dark:text-blue-400' : count > 1 ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-500',
      }));
  }, [feedback]);

  const lowScoreFeedback = feedback.filter(f => f.rating <= 2);
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-emerald-600'];

  if (feedback.length === 0) {
    return <div className="text-center py-12 text-neutral-400 text-sm">暂无学员反馈</div>;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Score Distribution */}
        <Card>
          <CardContent>
            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3">评分分布</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = distribution[star - 1];
                const pct = feedback.length > 0 ? (count / feedback.length) * 100 : 0;
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
            <p className="text-center mt-3 text-sm font-bold text-neutral-800 dark:text-white">
              综合评分 {avgRating} <span className="font-normal text-neutral-400 text-[11px]">/5 · {feedback.length}条评价</span>
            </p>
          </CardContent>
        </Card>

        {/* Keyword Cloud */}
        <Card className="md:col-span-2">
          <CardContent>
            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3">关键词分析</h4>
            <div className="flex flex-wrap gap-x-2 gap-y-1 items-center justify-center min-h-[100px]">
              {keywords.map((kw, i) => (
                <span key={i} className={cn(kw.size, kw.color, 'cursor-default hover:opacity-80 transition-opacity')}>
                  {kw.word}
                </span>
              ))}
            </div>
            <p className="text-[9px] text-neutral-400 text-center mt-2">字号 = 出现频率 · 基于反馈内容自动提取</p>
          </CardContent>
        </Card>
      </div>

      {/* Low-score highlight */}
      {lowScoreFeedback.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50/50 dark:from-red-950/20">
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">需关注的低分反馈</span>
            </div>
            <div className="space-y-2">
              {lowScoreFeedback.map(f => (
                <div key={f.id} className="p-2 bg-white dark:bg-neutral-800 rounded-lg text-xs text-neutral-700 dark:text-neutral-300">
                  &ldquo;{f.content}&rdquo; — <span className="font-medium">{f.userName}</span>
                  <span className="ml-1">{'⭐'.repeat(f.rating)}</span>
                  <span className="ml-2 text-neutral-400">{f.programName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
