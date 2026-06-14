import { useState, useRef, useCallback, useEffect } from 'react';
import { ImagePlus, Loader2, X, Sparkles, Camera, Clipboard, FileImage } from 'lucide-react';

interface VisionPanelProps {
  apiKey?: string;
  model?: string;
  onResult?: (text: string) => void;
  prompt?: string;
  className?: string;
  buttonText?: string;
}

export const VisionPanel = ({
  apiKey,
  model = 'doubao-seed-2-0-pro-260215',
  onResult,
  prompt: defaultPrompt,
  className = '',
  buttonText = '图片识别',
}: VisionPanelProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(defaultPrompt || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = () => {
            setImage(reader.result as string);
            setFileName(`clipboard.${imageType.split('/')[1] || 'png'}`);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    } catch {
      // Clipboard read not supported or denied
    }
  }, []);

  // Keyboard shortcut for paste
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        handlePaste();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, handlePaste]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/ai/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          prompt: customPrompt || defaultPrompt || '请详细描述这张图片中的内容',
          apiKey,
          model,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setResult(`[识别失败] ${data.error}`);
      } else {
        setResult(data.text);
        onResult?.(data.text);
      }
    } catch (err: any) {
      setResult(`[识别失败] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setFileName('');
    setResult('');
    setCustomPrompt(defaultPrompt || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={className}>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
      >
        <Camera className="w-4 h-4" />
        {buttonText}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                图片识别
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image upload area */}
            {!image ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImagePlus className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      点击选择图片或拖拽到此处
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      支持 JPG、PNG、WebP、GIF · 支持 Ctrl+V 粘贴
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaste();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      从剪贴板粘贴
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      浏览文件
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Preview & analyze */
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <img
                    src={image}
                    alt="预览"
                    className="max-h-80 w-full object-contain"
                  />
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/50 text-xs text-white">
                    {fileName || '粘贴的图片'}
                  </div>
                </div>

                {/* Prompt input */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">
                    识别指令（可选）
                  </label>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="例如：请识别这张图中的文字并翻译成中文"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Analyze button */}
                <button
                  onClick={analyze}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      识别中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      开始识别
                    </>
                  )}
                </button>

                {/* Result */}
                {result && (
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">识别结果</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                      {result}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
