# Lucent frontend

Next.js App Router, React and TypeScript. Run the complete local project with `../start.command` after `../setup.command`. Run this directory alone with `npm ci` and `npm run dev`.

## Pages

- `/`: project overview, a static-at-rest hover illustration, readable methodology and an explicitly illustrative interface preview.
- `/workbench`: real model input, model comparison, finding scores, per-finding Grad-CAM, image comparison and JSON export.
- Unknown routes: a branded page linking back to the overview and workbench.

## Structure

- `app/`: page composition, shared typography, themes and metadata.
- `app/workbench/`: analysis page and its responsive styles.
- `app/api/service/`: checks the backend health and available models; returns a clear offline state if disconnected.
- `app/api/predict/`: validates the multipart request and forwards it to the configured inference service. Uploads are not stored.
- `lib/analysis.ts`: shared API types, model/finding names, response validation and error parsing.
- `lib/analysis-server.ts`: server-only backend configuration and service checks.
- `components/analysis-workbench.tsx`: request lifecycle, model selection, files, cancellation and results.
- `components/analysis-viewer.tsx`: upload/drag-and-drop and original/attention/comparison views.
- `components/finding-results.tsx`: all 14 actual scores, threshold markers, model comparison and finding selection.
- `components/lung-scene.tsx`: a small hover-only CSS tilt of the approved illustration. No idle, drag, scroll animation or WebGL renderer.
- `public/images/`: synthetic artwork and the clearly labelled example JPEG.
- `scripts/analysis.integration.test.mjs`: integration checks against the actual running backend through the Next.js bridge.

## Configuration

Locally, the bridge defaults to `http://127.0.0.1:8000`. Optionally set the server-only `LUCENT_API_URL` to a different backend. On Vercel, an unconfigured service stays offline; it never attempts to use a visitor's local machine. Real inference requires a separately hosted Python backend. No custom environment file is needed for local development.

Dark is the default. The sun/moon button selects a persistent light/dark theme, applied before paint on subsequent visits and synchronized across tabs. All sections and controls use the shared palette in `app/theme.css`. The lungs use a complementary ink/copper treatment on paper; X-rays stay on a neutral dark imaging surface.

Visible type is at least 12px, with larger body text, keyboard focus indicators, labelled controls, responsive layouts and reduced-motion support. The model-input comparison preview is normalized to 224×224 so that it aligns spatially with the backend's 224×224 Grad-CAM overlay.

## Checks

```bash
npm run typecheck
npm run build
npm run check:integration
```

Integration checks require local services to be running; `LUCENT_TEST_URL` overrides the default frontend address. The project root README explains setup, hosting, data handling and score interpretation.
