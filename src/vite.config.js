import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Vite config lives in `src/` per project structure. Set root and publicDir
const SRC_DIR = path.resolve(__dirname)
const REPO_ROOT = path.resolve(SRC_DIR, '..')

export default defineConfig({
  root: SRC_DIR,
  base: './',
  publicDir: path.resolve(REPO_ROOT, 'public'),
  build: {
    outDir: path.resolve(REPO_ROOT, 'dist'),
    emptyOutDir: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // include only assets that exist in the public folder to avoid warnings
      includeAssets: ['icons/*', 'manifest.json'],
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
