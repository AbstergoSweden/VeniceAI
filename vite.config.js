import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remove-csp-for-electron',
      transformIndexHtml(html) {
        // Remove CSP meta tag for Electron builds (file:// protocol doesn't work with CSP)
        return html.replace(
          /<meta\s+http-equiv="Content-Security-Policy"[^>]*>/i,
          ''
        )
      }
    }
  ],
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
