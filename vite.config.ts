import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@atoms', replacement: path.resolve(__dirname, 'src/components/atoms') },
      { find: '@molecules', replacement: path.resolve(__dirname, 'src/components/molecules') },
      { find: '@organisms', replacement: path.resolve(__dirname, 'src/components/organisms') },
      { find: '@templates', replacement: path.resolve(__dirname, 'src/components/templates') },
      { find: '@utils', replacement: path.resolve(__dirname, 'src/utils') },
      { find: '@hooks', replacement: path.resolve(__dirname, 'src/hooks') },
      { find: '@contexts', replacement: path.resolve(__dirname, 'src/contexts') },
      { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@services', replacement: path.resolve(__dirname, 'src/services') },
      { find: '@types', replacement: path.resolve(__dirname, 'src/types') },
      { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@shared', replacement: path.resolve(__dirname, 'src/shared') },
    ],
  },
  server: {
    proxy: {
      // Login: POST /api/auth/autorizacion/login → http://localhost:8080/autorizacion/login
      '/api/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // RRHH service: GET /api/rrhh/postulantes → http://localhost:8080/rrhh/postulantes
      '/api/rrhh': {
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