import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/wordpress/shree-shahi-admin/',
  build: {
    outDir: 'C:/xampp/htdocs/wordpress/shree-shahi-admin',
    emptyOutDir: false,
    assetsDir: 'assets'
  },
  server: {
    port: 5174,
    proxy: {
      '/wordpress/shree-shahi-admin/api': {
        target: 'http://localhost',
        changeOrigin: true
      }
    }
  }
});

