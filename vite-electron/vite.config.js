import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  server:{
    port : 5000,
    https: false,
    proxy: {
      '/api': {
        // target: 'https://9ece-2a09-bac5-3af7-16aa-00-242-34.ngrok-free.app', // Correct Ngrok URL
        target: 'http://localhost:3000', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
});