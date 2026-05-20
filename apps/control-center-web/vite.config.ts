import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        target: process.env.CONTROL_CENTER_API_URL ?? 'http://127.0.0.1:47671',
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.vitest.tsx'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
