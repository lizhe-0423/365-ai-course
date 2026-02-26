import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const deepseekKey = env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY || ''

  const deepseekProxy = {
    target: 'https://api.deepseek.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
    headers: deepseekKey ? { Authorization: `Bearer ${deepseekKey}` } : undefined,
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/deepseek': deepseekProxy,
      },
    },
    preview: {
      proxy: {
        '/api/deepseek': deepseekProxy,
      },
    },
  }
})
