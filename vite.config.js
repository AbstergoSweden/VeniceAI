import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Required for Electron
  define: {
    __firebase_config: JSON.stringify({
      apiKey: "AIzaSyD-MOCK",
      projectId: "demo-project"
    }),
    __app_id: JSON.stringify("demo-app"),
    __initial_auth_token: "undefined"
  }
})
