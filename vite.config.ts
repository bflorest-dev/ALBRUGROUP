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
    ],
  },
})
