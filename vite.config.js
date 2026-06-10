import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/proxy': { target: 'http://localhost:3001', changeOrigin: true },
      '/scrape': { target: 'http://localhost:3001', changeOrigin: true },
      '/scrape-status': { target: 'http://localhost:3001', changeOrigin: true },
      '/scan-links': { target: 'http://localhost:3001', changeOrigin: true },
      '/test-selectors': { target: 'http://localhost:3001', changeOrigin: true },
      '/health': { target: 'http://localhost:3001', changeOrigin: true },
    }
  }
})
