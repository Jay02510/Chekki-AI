
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // API_KEY is accessed via process.env in the Vercel serverless function, 
    // but we keep this empty object to prevent client-side reference errors.
    'process.env': {}
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increased threshold to 1MB to resolve the build warning
    rollupOptions: {
      output: {
        // Split vendor libraries (React, Firebase, GenAI) into their own chunks for better caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
