import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    proxy: {
      '/api/chat': {
        target: 'https://chat.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, '/api/v0/chat/completions'),
      },
      '/api/doubao': {
        target: 'https://www.doubao.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/doubao/, '/api/v0/chat/completions'),
      },
    },
  },
})