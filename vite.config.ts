import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@pages', replacement: path.resolve(__dirname, 'src/pages') },
      { find: '@widgets', replacement: path.resolve(__dirname, 'src/widgets') },
      { find: '@caracteristicas', replacement: path.resolve(__dirname, 'src/caracteristicas') },
      { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@entidades', replacement: path.resolve(__dirname, 'src/entidades') },
      { find: '@shared', replacement: path.resolve(__dirname, 'src/shared') },
      { find: '@shared/validacion', replacement: path.resolve(__dirname, 'src/shared/validation') },
      { find: '@app', replacement: path.resolve(__dirname, 'src/app') },
    ],
  },
  server: {
    proxy: {
      // Auth service: GET/POST /api/auth/* → http://localhost:8080/auth/*
      '/api/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: false,
        configure: (proxy) => {
          // Log para verificar requests
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[Proxy] ${req.method} ${req.url}`);
            proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || 'unknown');
          });
          proxy.on('error', (err, req) => {
            console.error(`[Proxy Error] ${req.method} ${req.url}: ${err.message}`);
          });
        },
      },
      // RRHH service: GET /api/rrhh/postulantes → http://localhost:8080/rrhh/postulantes
      '/api/rrhh': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/leads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/presence': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    port: 5173,
    strictPort: false,
  },
})