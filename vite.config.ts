import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// BE(8000)의 최상위 경로 전부. 라우터를 추가하면 여기에도 넣는다
const API_PATHS =
  '^/(health|auth|me|crops|pesticides|pests|ocr|parcels|addresses|fields|zones|inventory)(/|\\?|$)'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      [API_PATHS]: {
        target: 'http://localhost:8000',
        // FE 라우트 /pests, /fields와 API 경로가 같다. 주소창 이동·새로고침(HTML 요청)은 SPA로 보낸다
        bypass: (req) => (req.headers.accept?.includes('text/html') ? '/index.html' : undefined),
      },
    },
  },
  preview: {
    port: 3000,
  },
})
