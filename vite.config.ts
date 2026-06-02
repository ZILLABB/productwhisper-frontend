import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Dev proxy target for /api/v1. Defaults to the backend's default port (8000),
  // but can be overridden via VITE_PROXY_TARGET in .env (e.g. when 8000 is taken
  // by another local service and the backend runs on a different port).
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:8000';

  return {
    plugins: [react()],
    publicDir: 'public',
    server: {
      port: 3000,
      proxy: {
        '/api/v1': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'framer-motion': path.resolve(__dirname, './src/lib/framer-motion-shim.tsx'),
      },
    },
  };
});
