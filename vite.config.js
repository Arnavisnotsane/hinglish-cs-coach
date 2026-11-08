import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/gnani-stt': {
          target: 'https://api.vachana.ai',
          changeOrigin: true,
          secure: true,
          rewrite: () => '/stt/v3',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('X-API-Key-ID', env.GNANI_API_KEY)
            })
          },
        },
      },
    },
  }
})
