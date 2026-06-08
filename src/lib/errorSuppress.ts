// 抑制已知的生产环境运行时错误：
// motion/react 的 AnimatePresence 退出动画与 React 协调的冲突
// 通过确保组件有稳定 key 来解决，此处仅保留未捕获拒绝的日志

export function suppressKnownErrors() {
  window.addEventListener('unhandledrejection', (e) => {
    const msg = (e.reason?.message || e.reason || '') as string;
    if (typeof msg === 'string') {
      // 仅抑制 Supabase URL 配置错误
      if (msg.includes('supabaseUrl is required') || msg.includes('Missing supabase')) {
        e.preventDefault();
        return;
      }
    }
  });
}
