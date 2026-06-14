/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

import { apiPlugin } from './vite-plugin-api.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    optimizeDeps: {
      include: ['recharts'],
    },
    define: {
      // Make GEMINI_API_KEY available as process.env (needed by some dependencies)
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // ⚠️ VITE_* 变量由 Vite 自动从 .env 文件加载，无需在此硬编码。
      //    如需覆盖，请在 .env.production / .env.development 中设置。
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash].js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    },
  };
});
