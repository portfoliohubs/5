import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*'],
      manifest: {
        name: 'DentalFolio',
        short_name: 'DentalFolio',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
      }
    })
  ]
})
