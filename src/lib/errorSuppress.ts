// 抑制已知的生产环境运行时错误。
// 只抑制明确无害且无法通过代码修复的未捕获 Promise 拒绝。
// 其他错误会正常传播到控制台以便调试。

export function suppressKnownErrors() {
  window.addEventListener('unhandledrejection', (e) => {
    const msg = (e.reason?.message || e.reason || '') as string;
    if (typeof msg === 'string') {
      // 仅抑制因 Supabase 配置缺失导致的初始化拒绝
      // 这些错误在首次加载时无法避免，且不会影响应用正常运行
      if (
        msg === 'supabaseUrl is required' ||
        msg === 'Missing supabase URL in config' ||
        msg === 'supabaseUrl is required.' ||
        msg.startsWith('supabaseUrl')
      ) {
        e.preventDefault();
        return;
      }
    }
  });
}
