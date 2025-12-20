import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // define: {
  //   // Vite doesn't polyfill process.env by default. 
  //   // This mapping ensures the Gemini API SDK can access the API_KEY.
  //   'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  // },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
    },
  },
});
