import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', 'VITE_');
  
  return {
    plugins: [react()],
    // Add dev server proxy so frontend calls like "/api/..." go to backend at http://localhost:5213
    server: {
      host: true,
      port: 5174,
      strictPort: true,
      allowedHosts: [
        'renewed-spirit-production.up.railway.app',
        'localhost',
        '127.0.0.1',
      ],
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5213',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

