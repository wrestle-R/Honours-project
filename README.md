# Lucent

An honours project for explainable chest X-ray research. The website introduces the project; the analysis workbench runs the trained ResNet50 and DenseNet121 checkpoints and displays their actual outputs.

**Website:** https://lucent-honours.vercel.app

**Workbench:** https://lucent-honours.vercel.app/workbench

## Run the complete project locally

Use Node.js 22+ and Python 3.12. The setup script uses `uv` when available; otherwise it uses Python's virtual environment and pip. Linux setup installs CPU PyTorch, so a GPU is not required.

First time:

```bash
./setup.command
```

Then start Lucent:

```bash
./start.command
```

Open **http://localhost:3000/workbench**. Keep the terminal open. Both checkpoints load before the backend reports ready. Ctrl+C stops services started by this script; an already running Lucent backend is reused and left running.

The script starts:

| Part                          | Location              | Runs at                         |
| ----------------------------- | --------------------- | ------------------------------- |
| Landing page and model UI     | `next/`               | http://localhost:3000           |
| Research workbench            | `next/app/workbench/` | http://localhost:3000/workbench |
| Frontend-to-backend bridge    | `next/app/api/`       | `/api/service`, `/api/predict`  |
| FastAPI and PyTorch inference | `backend/`            | http://127.0.0.1:8000           |
| API documentation             | FastAPI               | http://127.0.0.1:8000/docs      |
| Trained checkpoints           | `backend/models/`     | Loaded in backend memory        |

`PORT=3001 ./start.command` selects another website port. The browser talks to the Next.js bridge on its own origin, so changing that port does not require a CORS change. You can also run `./start_backend.command` and `npm run dev --prefix next` separately.

## Using the workbench

1. Choose a de-identified PNG/JPEG, drag it onto the viewer, or load the clearly labelled synthetic example.
2. Select ResNet50, DenseNet121 or Compare both. Run the analysis to obtain 14 independent finding scores.
3. Select a finding in the results. Generate its Grad-CAM map with the chosen model.
4. Switch between original, attention and comparison views. Overlay opacity and the comparison divider are adjustable.
5. Export the results as JSON if needed. This includes the request metadata and any generated explanation returned with the results.

Scores range from 0 to 1 and **are not calibrated disease probabilities**. Thresholds were selected on validation data; crossing one is not a diagnosis. A map can be constant and uninformative, in which case the interface explains that and retains the original image. No finding above threshold does not establish a normal scan.

The backend checks image formats, sizes and dimensions. It does not verify that an uploaded image is a chest X-ray. The bundled example is AI-generated, not a patient image or a dataset record.

## What is hosted, and what runs locally

Vercel hosts the website and its Next.js API bridge. The project is connected to GitHub `main` with **Root Directory: `next`**. Pushes to main deploy automatically.

**The PyTorch backend is currently local.** The public workbench therefore shows an honest offline state. It can display the interface and prepare an image, but it does not fabricate results or call a visitor's localhost.

To enable public inference later, deploy `backend/` to a suitable Python host with its checkpoints, HTTPS and appropriate access controls, then set the server-side Vercel variable **`LUCENT_API_URL`** to that backend's base URL and redeploy. The browser does not need the backend address or a public environment variable. No environment file is needed for local use.

Local uploads are limited to 20 MiB. The hosted bridge limits uploads to 4 MiB. Each dimension must be 32–8192 pixels and the image must contain no more than 32 million pixels.

## Privacy and persistence

There are no accounts, scan histories or database writes in this version. The application processes images in memory and does not intentionally save them. Results stay in the current browser session until replaced or exported. Theme preference is the only value intentionally saved in browser storage. Avoid patient-identifying images in an unsecured academic demonstration.

## Verification

Frontend build and types:

```bash
npm run typecheck --prefix next
npm run build --prefix next
```

Real model integration, with both local services running:

```bash
npm run check:integration --prefix next
```

Use `LUCENT_TEST_URL=http://127.0.0.1:3001` before the command if the website uses another port. These checks use the synthetic example, run both trained models, verify Grad-CAM PNG dimensions and exercise invalid inputs.

Backend contract tests:

```bash
cd backend
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest tests -q
```

`API_CONTEXT.md` documents the exact backend request/response contract. Frontend source and design notes are described in `next/README.md`.

Academic research prototype. Not for clinical use.
