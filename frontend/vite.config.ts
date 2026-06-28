import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy para el entorno de desarrollo local
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        //target: 'http://127.0.0.1:3000', // Apunta al backend en Rust local
        changeOrigin: true,
        secure: false,
      }
    }
  }
});