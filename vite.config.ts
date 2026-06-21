import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { bodyBake } from './vite-plugin-bodybake';

// Mirrors the danmercede-info template scaffold. The template's GEMINI_API_KEY
// `define` block is identity-spoke-specific and is intentionally dropped here —
// this product microsite needs no API key.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), bodyBake()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
