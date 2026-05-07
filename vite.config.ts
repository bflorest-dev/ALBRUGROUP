import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${path.resolve(__dirname, 'src')}/` },
      { find: '@pages', replacement: path.resolve(__dirname, 'src/pages') },
      { find: '@widgets', replacement: path.resolve(__dirname, 'src/widgets') },
      { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@entities', replacement: path.resolve(__dirname, 'src/entities') },
      { find: '@shared', replacement: path.resolve(__dirname, 'src/shared') },
      { find: '@app', replacement: path.resolve(__dirname, 'src/app') },
    ],
  },
  server: {
    middlewareMode: false,
    proxy: {
      // Universal proxy: catch /api/* and forward to backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // /api/auth/autorizacion/forgot-password → /autorizacion/forgot-password
          // /api/rrhh/... → /rrhh/...
          // /api/leads/... → /leads/...
          const rewritten = path.replace(/^\/api/, '');
          console.log(`[ViteProxy] ${path} → ${rewritten}`);
          return rewritten;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log(`[ViteProxy] Forwarding ${req.method} ${req.url} to localhost:8080`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`[ViteProxy] Response ${proxyRes.statusCode} for ${req.url}`);
          });
          proxy.on('error', (err, _req) => {
            console.error(`[ViteProxy] Error: ${err.message}`);
          });
        },
      },
    },
    port: 5173,
    strictPort: false,
    cors: {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    },
  },
})