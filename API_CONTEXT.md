# Frontend integration: Chest X-ray demo API

**Status:** Backend runs locally with both trained model checkpoints included in this project. This is an academic prototype, not a diagnostic service. The backend is not deployed to a public URL yet. Set `API_BASE_URL` to the address of the running server. For development on the same machine the default is `http://127.0.0.1:8000`.

The API accepts one chest X-ray per request and returns 14 independent finding scores. To compare models, send a separate request for each model using the same file. Do not treat scores as calibrated disease probabilities, label a scan healthy, or present the output as a diagnosis. The API validates file type and dimensions; it cannot verify that the image is a chest X-ray.

## Endpoints

### `GET /health`

No parameters. Example response:

```json
{"status":"ok","service":"chest-xray-demo","loaded_models":["resnet50","densenet121"],"model_files":{"resnet50":true,"densenet121":true}}
```

Both checkpoints load during server startup. A successful health response lists both in `loaded_models`; `model_files` additionally reports that the files exist. If model loading fails, server startup fails instead of reporting ready.

### `GET /models`

No parameters. Response includes the available model IDs, checkpoint presence, the default model, and the exact finding names used in requests.

```json
{
  "default_model": "resnet50",
  "models": [{"id":"resnet50","available":true},{"id":"densenet121","available":true}],
  "findings": ["Atelectasis","Cardiomegaly","Consolidation","Edema","Effusion","Emphysema","Fibrosis","Hernia","Infiltration","Mass","Nodule","Pleural_Thickening","Pneumonia","Pneumothorax"],
  "disclaimer": "Academic prototype; not for diagnosis."
}
```

### `POST /predict`

Send `multipart/form-data`:

| Field | Required | Value |
|---|---|---|
| `file` | Yes | Image file: PNG or JPEG, maximum 20 MiB. Each dimension 32–8192 pixels, at most 32 million pixels. |
| `model` | No | `resnet50` (default) or `densenet121`. |
| `explain_finding` | No | Exact finding name from `GET /models`, e.g. `Effusion`. If omitted, no explanation is generated. Omit the field rather than sending an empty string. |

Successful response is JSON. The example abbreviates the list and image data: the real response contains **all 14** findings and a complete data URL.

```json
{
  "architecture": "resnet50",
  "model_version": "nih14_v1_resnet50_1b5d5d03ee2a",
  "findings": [
    {"finding":"Atelectasis","score":0.344,"threshold":0.328,"above_threshold":true}
  ],
  "no_label_above_threshold": false,
  "scores_are_calibrated_probabilities": false,
  "threshold_source": "validation maximum F1 per finding",
  "input_validation": "PNG/JPEG format and dimensions only; no chest-X-ray or out-of-distribution detector",
  "interpretation": "No label above threshold does not establish a clinically normal scan.",
  "disclaimer": "Academic research prototype; not a diagnostic product or substitute for professional medical advice.",
  "explanation": {
    "finding":"Effusion",
    "architecture":"resnet50",
    "method":"Grad-CAM",
    "score":0.989,
    "class_index":4,
    "native_feature_size":[7,7],
    "degenerate":false,
    "limitation":"Model-influence visualization; not a clinically validated explanation",
    "overlay_data_url":"data:image/png;base64,..."
  }
}
```

`explanation` exists only when requested. Render `overlay_data_url` directly in an `<img src={...}>`; it is a 224×224 PNG overlay, not a URL to fetch. If `degenerate` is true, the map was constant and should be labelled as unavailable/uninformative. Explanation score can differ slightly from the corresponding prediction score due to numerical precision. `above_threshold` uses a threshold selected on the validation set, not a clinical threshold.

Error responses:

| Status | Meaning |
|---|---|
| 400 | Empty, invalid, unsupported, corrupted or dimension-invalid image. |
| 413 | Image exceeds 20 MiB. |
| 422 | Missing `file`, unrecognised `model`, or unrecognised/empty `explain_finding`; FastAPI returns validation details. |
| 503 | The requested checkpoint is unavailable. |
| 500 | Inference or explanation failed; server logs contain details. |

For 400, 413, 503 and 500 the body is `{"detail":"..."}`. For 422 `detail` is a list of validation errors. Handle either shape in the UI.

### JavaScript example

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function predictXray(file, model = 'resnet50', finding) {
  const form = new FormData();
  form.append('file', file);
  form.append('model', model);
  if (finding) form.append('explain_finding', finding);
  const response = await fetch(`${API_BASE_URL}/predict`, { method: 'POST', body: form });
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail));
  return body;
}
// Example: const result = await predictXray(file, 'resnet50', 'Effusion');
// <img src={result.explanation.overlay_data_url} alt="Grad-CAM overlay" />
```

Do not set the `Content-Type` header manually for `FormData`; the browser supplies the multipart boundary. For local cross-origin development, CORS allows `localhost` and `127.0.0.1` ports 3000 and 5173. Set the backend `CORS_ORIGINS` environment variable to a comma-separated list of actual frontend origins when different. Requests are serialized to keep model loading and Grad-CAM hooks safe; show a loading indicator while inference runs.

Interactive documentation at `/docs` and machine-readable schema at `/openapi.json` are provided by FastAPI. The server keeps images in memory for the request and does not intentionally save uploads; avoid sending real patient data to an unsecured demo server. There is no built-in authentication. Deploying or tunnelling the service requires appropriate access controls and a reachable HTTPS address.
