import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'], gsap: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'lenis'], ogl: ['ogl'], react: ['react', 'react-dom', 'react-router-dom'] }
      }
    }
  }
});
