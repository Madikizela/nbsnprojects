import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', 'VITE_');

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5174,
      strictPort: true,
      allowedHosts: 'all',
      proxy: {
        // Local dev: proxy /api calls to local backend
        '/api': {
          target: env.VITE_API_URL || 'http://127.0.0.1:5213',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
