# Honors chest X-ray demo backend

This FastAPI backend runs **locally** with both tested model checkpoints in `backend/models/`. It does not need Colab, Google Drive, or an internet connection after the dependencies have been installed. The models load on startup and run inference on the local machine; training is not required.

## Start the server

On macOS, double-click `start_backend.command` or run it from Terminal. Alternatively:

```bash
cd backend
source .venv/bin/activate
uvicorn app:app --host 127.0.0.1 --port 8000
```

Allow time for startup: both models are loaded before the server reports ready. Then open `http://127.0.0.1:8000/docs`. Stop it with Ctrl+C. If your environment has not been set up, create it with `python3 -m venv .venv`, activate it, and run `pip install -r requirements.txt` (this initial installation requires internet access).

- `GET /health` confirms the backend is running and both models loaded.
- `GET /models` lists model identifiers and finding labels.
- `POST /predict` accepts a PNG/JPEG and returns predictions; optionally it includes a Grad-CAM overlay.
- `API_CONTEXT.md` contains the detailed frontend integration contract.

`127.0.0.1` works when frontend and backend run on the **same computer**. If the frontend is on another device or hosted online, configure a reachable server or secure network connection and set `CORS_ORIGINS` to the frontend origin. There is no built-in authentication; do not expose it publicly or send real patient data without appropriate safeguards.

Set `MODEL_DEVICE=cpu` to force CPU or leave unset for automatic CUDA selection on a supported system; the default on this Mac is CPU. `MODEL_DIR` can point to another folder with both model files. This is an academic prototype, not a diagnostic product.
