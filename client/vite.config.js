import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    /**
     * When developing locally - proxies "/api" to the game server.
     */
    proxy: {
      '/api': {
        target: 'http://localhost:2567',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    hmr: {
      clientPort: 443,
    }
  },
});
