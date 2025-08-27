import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Ensure CSS is properly extracted and loaded
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    // Ensure CSS is properly processed
    cssCodeSplit: false,
    // Prevent empty chunks
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  // Optimize for production builds
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  // Ensure proper CSS handling
  css: {
    postcss: './postcss.config.cjs',
  },
})
