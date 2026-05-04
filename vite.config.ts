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
          // /api/auth/autorizacion/login → /autorizacion/login
          // /api/rrhh/... → /rrhh/...
          // /api/leads/... → /leads/...
          const rewritten = path.replace(/^\/api\/auth/, '').replace(/^\/api/, '');
          console.log(`[ViteProxy] ${path} → ${rewritten}`);
          return rewritten;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[ViteProxy] Forwarding ${req.method} ${req.url} to localhost:8080`);
            console.log(`[ViteProxy] Headers being sent to backend:`, proxyReq.getHeaders());
            
            // Log del body si es POST
            if (req.method === 'POST' && req.url?.includes('/login')) {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body);
                  console.log(`[ViteProxy] Body being sent:`, {
                    username: parsed.username,
                    passwordLength: parsed.password?.length || 0,
                    passwordPreview: parsed.password?.substring(0, 3) + '***'
                  });
                } catch (e) {
                  console.log(`[ViteProxy] Raw body:`, body);
                }
              });
            }
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[ViteProxy] Response ${proxyRes.statusCode} for ${req.url}`);
            if (proxyRes.statusCode === 401) {
              console.error(`[ViteProxy] 401 Response headers:`, proxyRes.headers);
            }
          });
          proxy.on('error', (err) => {
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
