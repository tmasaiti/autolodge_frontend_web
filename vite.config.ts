import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../../shared/src'),
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks for better caching
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-state': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-ui': ['lucide-react'],
          'vendor-utils': ['date-fns', 'axios', 'clsx', 'tailwind-merge'],
          'vendor-validation': ['ajv', 'ajv-formats'],
          
          // Feature-based chunks
          'feature-auth': [
            './src/components/auth',
            './src/contexts/AuthContext',
            './src/services/authService'
          ],
          'feature-booking': [
            './src/components/booking',
            './src/services/bookingService',
            './src/store/slices/bookingSlice'
          ],
          'feature-vehicle': [
            './src/components/vehicle',
            './src/services/vehicleService',
            './src/store/slices/vehicleSlice'
          ],
          'feature-search': [
            './src/components/search',
            './src/services/searchService',
            './src/store/slices/searchSlice'
          ],
          'feature-payment': [
            './src/components/payment',
            './src/services/paymentService'
          ],
          'feature-admin': [
            './src/components/admin',
            './src/pages/admin'
          ],
          'feature-messaging': [
            './src/components/messaging',
            './src/services/messagingService',
            './src/store/slices/messagingSlice'
          ],
          'feature-disputes': [
            './src/components/disputes',
            './src/services/disputeService'
          ],
          'feature-insurance': [
            './src/components/insurance',
            './src/services/insuranceService'
          ]
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Performance optimizations
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
  },
  // Performance optimizations for development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'lucide-react',
      'date-fns',
      'axios',
      'clsx',
      'tailwind-merge',
      'ajv',
      'ajv-formats'
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})