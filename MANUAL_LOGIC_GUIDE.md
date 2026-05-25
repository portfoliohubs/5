# DentalFolio — System Architecture & Exception Manual

This document is the authoritative Source of Truth for DentalFolio's runtime flows, cryptographic/messaging schemes, error matrix, and PWA update strategy.

**Note:** Metadata format stored inside PDFs: `DentalFolio-V1|<name_b64>|<maxCases>|<usedCases>|<key_b64>` (name and key parts are base64 UTF-8 encoded to safely support special characters).

**Contents**
- **First-Time User Flow** (Mermaid)
- **Append/Update Mode Flow** (Mermaid)
- **Monetization & Crypto Scheme Explanation**
- **Exhaustive Error Matrix & Troubleshooting**
- **PWA Caching & Hot-Fix Updates Strategy**

## 1) Comprehensive Logic Flow Diagrams

First-Time User Flow (Input -> Compression -> Key Verification -> PDF Injection -> Local Download)

```mermaid
flowchart TD
  A[User opens app] --> B[Fill personal info & upload profile image]
  B --> C[Add case images and descriptions]
  C --> D[Image optimizer queue compresses each image]
  D --> E[User chooses Tier and enters Activation Key]
  E --> F[KeyValidator computes HMAC(email|tierLimit, secretSalt)]
  F -->|valid| G[Unlocked: Generate PDF]
  F -->|invalid| H[Show activation error]
  G --> I[pdfGenerator embeds metadata and builds PDF pages]
  I --> J[Trigger client-side download — iOS tooltip if needed]
  J --> K[LocalStorage backup of final state]

```

Append/Update Mode Flow (Upload PDF -> Metadata Extraction -> Read-Only Lock -> State Validation -> PDF Merging)

```mermaid
flowchart TD
  U[User uploads existing PDF] --> V[parseDentalMetadata(file)]
  V -->|corrupted/encrypted| X[Return error code -> show message]
  V -->|no metadata| Y[Show "not a DentalFolio PDF" message]
  V -->|valid metadata| Z[Populate doctor name (read-only) and usage counters]
  Z --> AA[User adds up to (maxCases - usedCases) new cases]
  AA --> AB[generateDentalPDF creates new PDF with updated metadata]
  AB --> AC[Download new merged PDF]

```

## 2) Monetization & Crypto Scheme Explanation

- Admin-side construction (server/admin tool):
  - Input: `doctorEmail` (UTF-8), `tierLimit` (integer), `secretSalt` (high-entropy string).
  - Compute HMAC-SHA256 using `secretSalt` as the HMAC key and message `doctorEmail|tierLimit`.
  - Encode resulting signature as lowercase hex; provide this 64-hex string to the user as their Activation Key.

- Client-side verification (implemented in `src/components/KeyValidator.jsx`):
  - The frontend computes the same HMAC using the embedded `SECRET_SALT` and compares (constant-time) the provided key to the expected hex signature.
  - On success, the app sets `maxCases` to the chosen tier limit and unlocks PDF generation.

Security notes:
- Because this project is purely client-side, `SECRET_SALT` is present in distributed code. This makes the validation deterministically reproducible in the browser but discoverable by an attacker who inspects the bundled JS. To increase security, move secret generation & verification server-side (recommended for production). The current design is acceptable for a zero-backend demo but not cryptographically authoritative.

## 3) Exhaustive Error Matrix & Troubleshooting Table

| Scenario / Exception Event | Catching Mechanism (file:function) | User Interface Treatment (message) | Resolution Workflow |
|---|---|---|---|
| Uploading a non-PDF file | `src/utils/pdfGenerator.js:parseDentalMetadata` checks MIME and filename | "Selected file is not a PDF." | Re-upload the correct PDF file. If problem persists, export PDF again from source app.
| Uploading an encrypted or corrupted PDF | `parseDentalMetadata` handles PDFDocument.load errors -> returns `corrupted_or_encrypted` | "PDF appears corrupted or encrypted and cannot be read." | Ask user to send original source PDF to admin; admin can attempt decryption or request re-export.
| PDF contains no DentalFolio metadata | `parseDentalMetadata` returns `no_dentalfolio_metadata` | "This PDF does not contain DentalFolio metadata." | Confirm user uploaded correct DentalFolio export. If they used another tool, re-create the portfolio via app.
| Invalid Activation Key format (wrong length) | `src/components/KeyValidator.jsx:validateKey()` checks length | "Invalid Activation Key format" | User verifies key received from admin; admin re-sends correct 64-hex HMAC signature.
| Invalid Activation Key (wrong value) | `KeyValidator` HMAC compare -> constant-time mismatch | "Invalid Activation Key" | User contacts support/admin via WhatsApp link to request new key purchase/validation.
| Exceeding tier limit during append mode | `src/components/CaseManager.jsx` prevents adding beyond `remaining` | "You can add up to X more cases." | User can purchase a higher tier via the WhatsApp flow or remove excess cases before generating PDF.
| LocalStorage corrupted / parse error | `src/App.jsx` guarded localStorage parse surrounded by try/catch | "Restoring your session..." (fails silently) and logs debug | User can clear site storage or re-enter data. Admin can instruct clearing storage or using incognito to reinitialize.
| Image compression failure (large or unsupported image) | `src/utils/imageOptimizer.js` rejects; CaseManager catches and alerts | "Failed to optimize image — try a different photo or lower resolution source." | Try exporting a lower-res image, or re-take photo with phone camera settings reduced.
| Simultaneous heavy uploads causing browser instability | `src/utils/imageOptimizer.js` concurrency queue (MAX_CONCURRENT=3) prevents flooding | Shows per-image failure alerts; prevents browser OOM | Upload images in smaller batches; if device low memory, use lower-res photos or desktop to compile portfolio.
| iOS direct-download behavior confusion | `src/App.jsx` detects iOS and shows tooltip before download | "iOS open files in a new tab... Save to Files to download" | Follow the instructions in the tooltip; use device Files app to save PDFs.
| PDF generation failure (embedding large images) | `src/utils/pdfGenerator.js` catches embed errors per image and continues | "Some images could not be embedded; their pages may be empty." (logged in console.debug) | Recompress or replace the problematic image and retry. Admin can request original images for inspection.
| Unexpected runtime errors | Top-level try/catch in critical flows; errors logged to console.debug | Generic friendly message like "An error occurred — please retry or contact support." | Gather reproduction steps and device details; have user share console logs if possible.

## 4) PWA Caching & Hot-Fix Updates Strategy

- Service Worker & Versioning:
  - We use `vite-plugin-pwa` with `registerType: 'autoUpdate'`. The service worker will automatically check for updates and install the new service worker in the background.
  - When a new service worker is activated, the app will continue running the old code until the user reloads. The plugin triggers an update event which the app can observe to prompt the user.

- Forcing a hot-fix to all devices (recommended steps):
  1. Patch the bug and increment an `APP_VERSION` constant in the front-end code (e.g., in `src/App.jsx` or build-time env). Commit & push to `main`.
 2. The GitHub Action builds and publishes new assets to `gh-pages`.
 3. Because the service worker is configured with `autoUpdate`, most clients will fetch the updated service worker and install it in the background.
 4. To expedite activation: implement a small runtime check in the app on load that compares a remote `version.json` (served from the same origin) to the current running `APP_VERSION`. If mismatch, show a full-screen prompt: "Update available — Tap to reload." This forces immediate activation.

- Emergency rollback:
  - If a pushed release breaks the SW/boot, revert the `gh-pages` branch to the last working commit, or re-deploy a fixed build with higher priority.
  - Because assets are served statically, the new build replaces the old one; ensure the service worker update prompt is clear and instructs users to refresh.

## Developer Notes & File Map
- PDF logic: `src/utils/pdfGenerator.js`
- Image optimization & queue: `src/utils/imageOptimizer.js`
- Key validation: `src/components/KeyValidator.jsx`
- State hydration + localStorage: `src/App.jsx`
- Case upload UI: `src/components/CaseManager.jsx`
- PWA plugin & base setting: `src/vite.config.js`
- CI/CD deploy action: `.github/workflows/deploy.yml`

If you need, I can also add runtime telemetry hooks (opt-in) to collect failure events to your chosen analytics endpoint for easier debugging of real devices.

## Appendix: Production Deployment & GitHub Pages Setup (Recommended Method)

This section provides the complete, production-ready setup to deploy DentalFolio to GitHub Pages with a robust, deterministic CI/CD pipeline.

### Local Setup (One-Time)

**Step 1: Generate `package-lock.json` for deterministic builds**

Run on your developer machine:

```bash
cd "path/to/portfolio PWA VS"
npm install
npm run build
```

This generates `package-lock.json` and verifies the build succeeds locally. Expected output: `dist/` folder containing built assets, `dist/sw.js` (service worker), and workbox files.

**Step 2: Commit and push the lockfile**

```bash
git add package-lock.json
git commit -m "chore: add package-lock.json for reproducible CI builds"
git push origin main
```

**Why this is the best approach:**
- `npm ci` (CI clean install) uses exact versions from `package-lock.json`, ensuring reproducible builds across machines and CI runners.
- Prevents accidental upgrades of transitive dependencies.
- Speeds up CI installs due to npm caching (locks are cached more efficiently than open ranges).

### GitHub Actions Workflow (Already Configured)

The repository includes `.github/workflows/deploy.yml` with the following optimizations:

- **Node caching**: Uses `actions/cache@v4` with keys based on `package-lock.json` and `package.json` hashes. Cache hits skip reinstalls entirely.
- **Robust install**: Checks for `package-lock.json` and runs `npm ci` when present (fast), otherwise falls back to `npm install` (safe fallback).
- **Vite configuration**: Set to `root: src`, `publicDir: ../public`, `build.outDir: ../dist` to locate files in non-standard structure.
- **PWA assets**: `includeAssets: ['icons/*', 'manifest.json']` only references files that exist in `public/` folder.
- **Auto-deploy**: On push to `main`, builds `dist/` and publishes to `gh-pages` branch (GitHub Pages serves this automatically).

### GitHub Pages Configuration

To deploy to GitHub Pages, perform a one-time setup:

1. Go to your repository **Settings** → **Pages**.
2. Under "Source", select **Deploy from a branch**.
3. Select branch: `gh-pages`, folder: `/ (root)`, and click **Save**.
4. Within ~1 minute, your app is live at `https://<username>.github.io/<repo-name>/` (or custom domain if configured).

### Complete Deployment Checklist

Before your first push to `main` after following "Local Setup" above:

- [ ] Run `npm install` locally → `package-lock.json` generated
- [ ] Run `npm run build` locally → `dist/` created successfully
- [ ] Commit `package-lock.json` to git
- [ ] Push to `main` branch
- [ ] GitHub Action triggers automatically
- [ ] Check **Actions** tab to verify build completes without errors
- [ ] Once build succeeds, check **Settings** → **Pages** to confirm deployment URL
- [ ] Visit the deployment URL to verify app is live

### CI Troubleshooting

**"Dependencies lock file is not found" error**
- Cause: GitHub Actions `setup-node` cache input requires `package-lock.json`. Fixed by removing that input and using explicit `actions/cache` step (already done in current workflow).
- Resolution: Run `npm install` locally, commit `package-lock.json`, and push to `main`.

**"Could not resolve entry module index.html" build error**
- Cause: Vite `root` configuration pointing to wrong directory.
- Resolution: Verify `src/vite.config.js` has:
  ```javascript
  root: path.resolve(__dirname),  // src/
  publicDir: path.resolve(REPO_ROOT, 'public'),
  build: { outDir: path.resolve(REPO_ROOT, 'dist'), emptyOutDir: true }
  ```
  This is already configured correctly in this repository.

**PWA "glob patterns don't match any files" warning**
- Cause: `includeAssets` references files that don't exist in `public/` folder.
- Resolution: Ensure referenced files exist, or remove missing entries from `vite.config.js`. Current config includes `icons/*` and `manifest.json` which should exist.

**Asset 404 errors on GitHub Pages (CSS/JS loading fails)**
- Cause: `base` not set to relative path for GitHub Pages.
- Resolution: Verify `src/vite.config.js` has `base: './'` to ensure assets load from repo-relative paths. Already configured correctly.

### Hot-Fix & Version Updates

If you need to push a bug fix or feature update:

1. Make code changes locally.
2. Test with `npm run dev` and `npm run build`.
3. Commit and push to `main`.
4. GitHub Action auto-builds and deploys to `gh-pages` within ~2 minutes.
5. Users' browsers fetch the new service worker automatically (due to `registerType: 'autoUpdate'` in PWA config).

For faster user adoption of critical fixes, add a version check on app load and prompt users to refresh (see "PWA Caching & Hot-Fix Updates Strategy" section above).

### Local Development Commands Reference

```bash
npm install           # Install dependencies (generates lockfile)
npm run dev          # Start dev server (Vite, hot reload, localhost:5173)
npm run build        # Build production assets to dist/
npm run preview      # Preview production build locally
npm run deploy       # Deploy dist/ to gh-pages branch (if you prefer local deploy)
```

### File Locations & CI Dependencies

- **Build config**: `src/vite.config.js`
- **Source root**: `src/` (with `index.html` entry point)
- **Public assets**: `public/` (icons, manifest.json)
- **Build output**: `dist/` (generated by `npm run build`)
- **Workflow**: `.github/workflows/deploy.yml`
- **Lockfile (after `npm install`)**: `package-lock.json` at repo root
