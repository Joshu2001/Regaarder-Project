import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore unused warnings
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      }
    }
  }
});
