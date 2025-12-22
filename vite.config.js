import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

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
        );
      }
    },
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/bundle-stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),

  base: './', // Required for Electron

  define: {
    __firebase_config: JSON.stringify({
      apiKey: "AIzaSyD-MOCK",
      projectId: "demo-project"
    }),
    __app_id: JSON.stringify("demo-app"),
    __initial_auth_token: "undefined"
  },

  build: {
    // Target modern browsers for better optimization
    target: 'esnext',

    // Increase chunk size warning limit (we'll split manually)
    chunkSizeWarningLimit: 600,

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.* in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'] // Remove specific console calls
      }
    },

    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],

          // Large UI libraries
          'ui-vendor': ['framer-motion', 'lucide-react'],

          // Firebase
          'firebase-vendor': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/app-check'
          ],

          // Web3/Crypto
          'web3-vendor': ['ethers']
        },

        // Naming strategy for chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },

        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js'
      },

      // Tree-shaking optimization
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false
      }
    },

    // Source maps for production debugging (can be disabled for smaller builds)
    sourcemap: false,

    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },

  // Optimize dev server
  server: {
    hmr: {
      overlay: true
    }
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'lucide-react',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ]
  }
});

