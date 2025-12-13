
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are loaded relatively, fixing deployment on subpaths (e.g. GitHub Pages)
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
          'vendor-pdf': ['pdf-lib', 'jspdf'],
          'vendor-ui': ['lucide-react', '@dnd-kit/core', '@dnd-kit/sortable'],
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'] // Prevent Vite from processing PDF.js heavily as we use dynamic imports
  }
});
