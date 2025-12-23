import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      '/price': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/profile': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/reset': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});