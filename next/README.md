# Lucent

See beyond the scan. An honours project exploring explainable chest X-ray analysis.

## Current scope

A polished, responsive Next.js landing page with an interactive Three.js hero, original/attention/comparison image modes, region selection and opacity controls. The page explains the planned research and explicitly labels every illustrative element.

The lungs are a synthetic illustration mapped onto a curved Three.js mesh, with ambient particles and restrained parallax. The visual is 2.5D conceptual anatomy, not a patient reconstruction. A static fallback appears while WebGL loads or when it is unavailable. The workbench chest image is synthetic and its attention overlay is hand-designed. No predictions, patient uploads, accounts or evaluation results are connected yet.

## Local development

Use Node.js 22 or newer. The app and all frontend source live in this directory.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

## Checks

```sh
npm run typecheck
npm run build
npm start
```

## Layout

- `app/`: page composition, styles, metadata, favicon and social image.
- `components/`: navigation, animated anatomy, interactive workbench and reveal behaviour.
- `public/images/`: compressed, synthetic artwork with no patient information.
- `design/`: art direction and asset provenance.

The static content stays in Server Components. Client components handle only the browser interactions. The Three.js renderer loads separately, caps device pixel ratio and frame rate, pauses rendering outside the viewport and releases GPU resources on unmount. Reduced motion is respected, and all image controls have keyboard-accessible equivalents.

## Deployment

The `wrestle-R/Honours-project` GitHub repository connects to the `honours-project` Vercel project with **Root Directory: `next`**, **Framework: Next.js** and **Production Branch: `main`**. Pushes to main deploy automatically. No custom environment variables or real environment files are required for this phase.

## Next phase

Connect the actual trained DenseNet121 and ResNet50 models through a FastAPI backend. Replace the illustrative attention maps with real Grad-CAM outputs and publish measured evaluation metrics only after validation. Preserve patient-level dataset splits, report label noise and evaluate thresholds and class imbalance.

Academic prototype. Not for clinical use.

## Color themes

The header's sun/moon button switches between dark and light themes. Dark is the default, and an explicit choice is saved in browser storage, applied before the first paint on repeat visits and synchronized across tabs. The switch still works if storage is blocked. All sections, forms and controls use shared tokens from `app/theme.css`. The lung visual uses a coordinated ink-and-copper treatment on light backgrounds, while the radiograph retains a neutral dark viewing stage in either theme.
