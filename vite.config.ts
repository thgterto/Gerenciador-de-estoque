/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    reporters: ['default'],
    projects: [
      {
        extends: true,
        test: {
          name: 'frontend',
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['./src/vitest.setup.ts'],
        }
      },
      {
        extends: true,
        test: {
          name: 'electron',
          include: ['tests/electron/**/*.{test,spec}.{ts,tsx}'],
          environment: 'node',
          setupFiles: [],
          server: {
            deps: {
              inline: ['electron'],
            },
          },
        }
      },
      {
        extends: true,
        test: {
          name: 'utils',
          include: ['tests/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['tests/electron/**/*', 'tests/e2e/**/*'],
          environment: 'node',
          setupFiles: [],
        }
      }
    ]
  },
  base: process.env.VERCEL ? '/' : './',
  resolve: {
    alias: {
      react: resolve('./node_modules/react'),
      'react-dom': resolve('./node_modules/react-dom'),
    },
  },
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['apexcharts', 'react-apexcharts'],
          utils: ['xlsx', 'html5-qrcode'],
          ui: ['react-window', 'react-virtualized-auto-sizer']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react-virtualized-auto-sizer', 'react-window']
  }
})
