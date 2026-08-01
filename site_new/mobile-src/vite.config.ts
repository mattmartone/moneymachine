import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/mobile/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://fadethechalk.vercel.app',
        changeOrigin: true,
      },
      '/saratoga': {
        target: 'https://fadethechalk.vercel.app',
        changeOrigin: true,
      },
      '/monmouth': {
        target: 'https://fadethechalk.vercel.app',
        changeOrigin: true,
      },
    },
  },
})
