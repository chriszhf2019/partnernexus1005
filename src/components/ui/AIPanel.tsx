import { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';

interface AIPanelProps {
  title?: string;
  prompt: string;
  context?: string;
  config?: { aiApiKey?: string; aiBaseUrl?: string; aiModel?: string };
  onResult?: (text: string) => void;
  trigger?: 'button' | 'icon';
  className?: string;
  buttonText?: string;
}

export const AIPanel = ({ title = 'AI 分析', prompt, context, config, trigger = 'button', className = '', buttonText = 'AI 分析' }: AIPanelProps) => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const runAI = async () => {
    setLoading(true);
    setOpen(true);
    setResult('');
    try {
      const { aiQuery } = await import('../../services/ai-service');
      const text = await aiQuery(prompt, context, config);
      setResult(text);
    } catch (e: any) {
      setResult('AI 调用失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (trigger === 'icon') {
    return (
      <>
        <button onClick={runAI} className={`p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors ${className}`} title={title}>
          <Sparkles className="w-4 h-4 text-purple-500" />
        </button>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" />{title}</h3>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5" /></button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /><span className="ml-3 text-sm text-neutral-500">AI 分析中...</span></div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">{result}</div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={className}>
      {!open ? (
        <button onClick={runAI} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
          <Sparkles className="w-4 h-4" />{buttonText}
        </button>
      ) : (
        <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" />{title}</h4>
            <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /><span className="ml-2 text-sm text-neutral-500">AI 分析中...</span></div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
          )}
        </div>
      )}
    </div>
  );
};
