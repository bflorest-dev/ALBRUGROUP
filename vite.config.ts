import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@paginas', replacement: path.resolve(__dirname, 'src/paginas') },
      { find: '@widgets', replacement: path.resolve(__dirname, 'src/widgets') },
      { find: '@caracteristicas', replacement: path.resolve(__dirname, 'src/caracteristicas') },
      { find: '@entidades', replacement: path.resolve(__dirname, 'src/entidades') },
      { find: '@compartido', replacement: path.resolve(__dirname, 'src/compartido') },
      { find: '@app', replacement: path.resolve(__dirname, 'src/app') },
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