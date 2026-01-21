
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Essencial para o modo "Portable" (caminhos relativos)
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react-virtualized-auto-sizer', 'react-window']
  }
})
