# DentalFolio

Premium client-side PWA to build dental PDF portfolios. Built with React, Vite, Tailwind CSS. Exports a fully offline-capable PDF with embedded metadata for append/update behavior.

Quick start

1. Install dependencies

```bash
npm install
```

2. Run dev server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

4. Deploy to GitHub Pages (optional)

```bash
npm run deploy
```

Notes
- The Vite config is located at `src/vite.config.js` per project structure.
- The activation key uses a client-side salt inside `src/components/KeyValidator.jsx` for deterministic validation. Keep the salt secret if you change it.
- PDF creation and metadata parsing live in `src/utils/pdfGenerator.js`.
- Images are compressed and EXIF is stripped using `browser-image-compression` in `src/utils/imageOptimizer.js`.

Files of interest: `src/App.jsx`, `src/components/*`, `src/utils/*`.
