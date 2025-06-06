import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // Essential for Netlify

  plugins: [react()],
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    dedupe: ['react', 'react-dom']
  },
  build: {
    sourcemap: true,
    target: 'esnext',
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-hook-form', 'react-dropzone'],
          'utils-vendor': ['date-fns']
        }
      }
    }
  }
});