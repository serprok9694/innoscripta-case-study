/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { apiProxy } from './server/vite-api-proxy.ts';

export default defineConfig(({ mode }) => {
  // Empty prefix: load non-VITE_ vars too. They are used by the proxy only
  // and are never exposed to client code.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };

  return {
    plugins: [react(), tailwindcss(), apiProxy(env)],
    build: {
      rolldownOptions: {
        output: {
          // Libraries change less often than app code: separate chunks stay cached
          // across deploys, and no single chunk trips the 500 kB warning.
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
              },
              { name: 'vendor', test: /node_modules[\\/]/ },
            ],
          },
        },
      },
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
      },
    },
  };
});
