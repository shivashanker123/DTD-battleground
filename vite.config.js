import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // The game server (npm run server) owns all state; the dev site talks to it through this proxy.
    proxy: { '/api': `http://localhost:${process.env.PORT || 3001}` },
  },
})
