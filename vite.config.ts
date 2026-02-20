//
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [
      react(),

      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [],

        manifest: {
          name: 'Baraka Sonko Electronics',
          short_name: 'Sonko',
          description: 'Baraka Sonko Electronics online store',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#ea580c',

          icons: [
            {
              src: 'https://media.barakasonko.store/app_icon_android_1722843822884__4_-removebg-preview_1_192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://media.barakasonko.store/app_icon_android_1722843822884__4_-removebg-preview_512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },

        workbox: {
          navigateFallback: '/',

          runtimeCaching: [
            // Cache API (Cloudflare Functions)
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5
                }
              }
            },

            // Cache Images
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            }
          ]
        }
      })
    ],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
