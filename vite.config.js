import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: 'esnext',
    minify: 'esbuild',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 600,
    publicDir: 'public',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('xlsx') || id.includes('exceljs') || id.includes('jspdf')) {
              return 'vendor-utils';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            return 'vendor-misc';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'recharts'],
    exclude: []
  },
  preload: true
})
