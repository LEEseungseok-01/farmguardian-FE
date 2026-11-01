import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8443,
    strictPort: true,
  },
  preview: {
    port: 8443,
  },
})
