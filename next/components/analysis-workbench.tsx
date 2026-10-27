"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  FileJson,
  LoaderCircle,
  PlugZap,
  RefreshCw,
  ScanLine,
  X,
} from "lucide-react";
import {
  AnalysisViewer,
  type PreparedImage,
  type ViewMode,
} from "./analysis-viewer";
import { FindingResults } from "./finding-results";
import {
  FINDINGS,
  MODEL_IDS,
  MODEL_NAMES,
  displayFinding,
  errorMessage,
  readPrediction,
  type Explanation,
  type FindingName,
  type ModelId,
  type ModelSelection,
  type Prediction,
  type ServiceState,
} from "@/lib/analysis";

async function prepareImage(
  file: File,
  synthetic: boolean,
): Promise<PreparedImage> {
  if (!["image/png", "image/jpeg"].includes(file.type))
    throw new Error(
      "Choose a PNG or JPEG image. Other formats are not supported.",
    );
  if (!file.size) throw new Error("This image is empty. Choose another file.");
  const preview = URL.createObjectURL(file);
  try {
    const source = new window.Image();
    source.src = preview;
    await source.decode();
    const { naturalWidth: width, naturalHeight: height } = source;
    if (
      Math.min(width, height) < 32 ||
      Math.max(width, height) > 8192 ||
      width * height > 32_000_000
    )
      throw new Error(
        "Each dimension must be between 32 and 8192 pixels, with no more than 32 million pixels in total.",
      );
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 224;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The image preview could not be created.");
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, 224, 224);
    const pixels = context.getImageData(0, 0, 224, 224);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const gray = Math.round(
        pixels.data[index] * 0.299 +
          pixels.data[index + 1] * 0.587 +
          pixels.data[index + 2] * 0.114,
      );
      pixels.data[index] =
        pixels.data[index + 1] =
        pixels.data[index + 2] =
          gray;
    }
    context.putImageData(pixels, 0, 0);
    return {
      file,
      preview,
      modelInput: canvas.toDataURL("image/png"),
      width,
      height,
      synthetic,
    };
  } catch (error) {
    URL.revokeObjectURL(preview);
    throw error instanceof Error && error.message.includes("dimension")
      ? error
      : new Error(
          error instanceof Error && error.message.startsWith("Each")
            ? error.message
            : "This image could not be read. Choose a valid PNG or JPEG.",
        );
  }
}

export function AnalysisWorkbench() {
  const [service, setService] = useState<ServiceState | null>(null),
    [checking, setChecking] = useState(true);
  const [image, setImage] = useState<PreparedImage | null>(null),
    [selection, setSelection] = useState<ModelSelection>("resnet50");
  const [results, setResults] = useState<Partial<Record<ModelId, Prediction>>>(
      {},
    ),
    [maps, setMaps] = useState<Record<string, Explanation>>({});
  const [finding, setFinding] = useState<FindingName>("Effusion"),
    [mapModel, setMapModel] = useState<ModelId>("resnet50");
  const [view, setView] = useState<ViewMode>("original"),
    [opacity, setOpacity] = useState(75),
    [split, setSplit] = useState(50),
    [aboveOnly, setAboveOnly] = useState(false),
    [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false),
    [activity, setActivity] = useState(""),
    [error, setError] = useState(""),
    [completedAt, setCompletedAt] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null),
    controller = useRef<AbortController | null>(null),
    operation = useRef(0);
  const fileLimit = service?.max_upload_bytes || 4 * 1024 * 1024;
  const ids = selection === "compare" ? [...MODEL_IDS] : [selection];
  const hasResults = Object.keys(results).length > 0;
  const explanation = maps[`${mapModel}:${finding}`];
  const canRun =
    !!image &&
    service?.status === "ready" &&
    ids.every(
      (id) => service.models.find((model) => model.id === id)?.available,
    ) &&
    !busy;
  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/service", {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error();
      const data: ServiceState = await response.json();
      setService(data);
    } catch {
      setService({
        status: "offline",
        models: MODEL_IDS.map((id) => ({ id, available: false })),
        findings: FINDINGS,
        default_model: "resnet50",
        max_upload_bytes: 4 * 1024 * 1024,
        mode: "hosted",
        message: "The connection could not be checked. Please try again.",
      });
    } finally {
      setChecking(false);
    }
  }, []);
  useEffect(() => {
    void checkConnection();
    return () => {
      operation.current++;
      controller.current?.abort();
    };
  }, [checkConnection]);
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.preview);
    },
    [image],
  );
  function clearResults() {
    setResults({});
    setMaps({});
    setCompletedAt(null);
    setView("original");
    setAboveOnly(false);
  }
  function cancel() {
    operation.current++;
    controller.current?.abort();
    setBusy(false);
    setActivity("");
  }
  async function chooseFile(file: File, synthetic = false) {
    cancel();
    setError("");
    if (file.size > fileLimit) {
      setError(`Choose an image smaller than ${fileLimit / 1024 / 1024} MiB.`);
      return;
    }
    const current = ++operation.current;
    try {
      const prepared = await prepareImage(file, synthetic);
      if (current !== operation.current) {
        URL.revokeObjectURL(prepared.preview);
        return;
      }
      setImage(prepared);
      clearResults();
    } catch (reason) {
      if (current !== operation.current) return;
      setError(
        reason instanceof Error
          ? reason.message
          : "The image could not be opened.",
      );
    }
  }
  async function sample() {
    try {
      const response = await fetch("/images/example-chest.jpg");
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      await chooseFile(
        new File([blob], "lucent-synthetic-example.jpg", {
          type: "image/jpeg",
        }),
        true,
      );
    } catch {
      setError(
        "The example image could not be loaded. You can choose an image from your computer.",
      );
    }
  }
  async function predict(
    model: ModelId,
    signal: AbortSignal,
    selectedFinding?: FindingName,
  ) {
    if (!image) throw new Error("Choose an image first.");
    const data = new FormData();
    data.append("file", image.file);
    data.append("model", model);
    if (selectedFinding) data.append("explain_finding", selectedFinding);
    const response = await fetch("/api/predict", {
      method: "POST",
      body: data,
      signal,
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      if (response.status >= 500) void checkConnection();
      throw new Error(errorMessage(body));
    }
    return readPrediction(body, model);
  }
  async function run() {
    if (!canRun) return;
    cancel();
    clearResults();
    setError("");
    setBusy(true);
    const current = ++operation.current;
    const abort = new AbortController();
    controller.current = abort;
    const collected: Partial<Record<ModelId, Prediction>> = {};
    try {
      for (const [index, id] of ids.entries()) {
        setActivity(
          `${selection === "compare" ? `${index + 1} of 2 · ` : ""}Running ${MODEL_NAMES[id]}…`,
        );
        const result = await predict(id, abort.signal);
        if (current !== operation.current) return;
        collected[id] = result;
        setResults({ ...collected });
      }
      const primary = collected[ids[0]]!;
      setMapModel(ids[0]);
      setFinding(
        [...primary.findings].sort((a, b) => b.score - a.score)[0].finding,
      );
      setCompletedAt(new Date().toISOString());
    } catch (reason) {
      if (current === operation.current) {
        if (Object.keys(collected).length) {
          const id = Object.keys(collected)[0] as ModelId;
          setMapModel(id);
          setFinding(
            [...collected[id]!.findings].sort((a, b) => b.score - a.score)[0]
              .finding,
          );
          setCompletedAt(new Date().toISOString());
        }
        setError(
          reason instanceof Error
            ? reason.message
            : "The analysis could not be completed.",
        );
      }
    } finally {
      if (current === operation.current) {
        setBusy(false);
        setActivity("");
      }
    }
  }
  async function explain() {
    if (busy || !image || !results[mapModel]) return;
    if (explanation) {
      setView(explanation.degenerate ? "original" : "attention");
      return;
    }
    setError("");
    setBusy(true);
    setActivity(
      `Generating ${displayFinding(finding)} attention with ${MODEL_NAMES[mapModel]}…`,
    );
    const current = ++operation.current;
    const abort = new AbortController();
    controller.current = abort;
    try {
      const result = await predict(mapModel, abort.signal, finding);
      if (current !== operation.current) return;
      if (!result.explanation)
        throw new Error("The model did not return an attention map.");
      setMaps((previous) => ({
        ...previous,
        [`${mapModel}:${finding}`]: result.explanation!,
      }));
      setResults((previous) => ({ ...previous, [mapModel]: result }));
      setView(result.explanation.degenerate ? "original" : "attention");
    } catch (reason) {
      if (current === operation.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "The attention map could not be generated.",
        );
    } finally {
      if (current === operation.current) {
        setBusy(false);
        setActivity("");
      }
    }
  }
  function selectFinding(value: FindingName) {
    setFinding(value);
    if (!maps[`${mapModel}:${value}`]) setView("original");
  }
  function selectModel(value: ModelSelection) {
    if (busy) return;
    setSelection(value);
    setError("");
    clearResults();
    if (value !== "compare") setMapModel(value);
  }
  function exportResults() {
    if (!image || !hasResults) return;
    const payload = {
      project: "Lucent",
      created_at: completedAt,
      input: {
        filename: image.file.name,
        width: image.width,
        height: image.height,
        synthetic: image.synthetic,
      },
      results,
      disclaimer:
        "Academic prototype. Scores are not calibrated probabilities or a diagnosis.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "lucent-analysis.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="analysis-workbench wrap">
      <div className="workbench-heading">
        <div>
          <p className="section-kicker">THE RESEARCH WORKBENCH</p>
          <h1>
            A closer <em>look.</em>
          </h1>
          <p>
            Compare trained models. Inspect their scores.
            <br />
            See which image regions influence an output.
          </p>
        </div>
        <div
          className={`connection-state ${service?.status === "ready" ? "connected" : ""}`}
        >
          <span />
          <div>
            <strong>
              {checking
                ? "Checking the model service…"
                : service?.status === "ready"
                  ? "Models connected"
                  : "Model service offline"}
            </strong>
            <small>
              {service?.status === "ready"
                ? service.models
                    .filter((model) => model.available)
                    .map((model) => MODEL_NAMES[model.id])
                    .join(" + ")
                : "Your image stays unsubmitted until you run an analysis."}
            </small>
          </div>
          <button
            className="icon-button"
            onClick={() => void checkConnection()}
            disabled={checking || busy}
            aria-label="Check model service connection"
          >
            <RefreshCw size={16} className={checking ? "spin" : ""} />
          </button>
        </div>
      </div>
      {service?.status === "offline" && (
        <aside className="service-notice">
          <PlugZap size={20} />
          <div>
            <strong>
              The interface is ready. The model service is offline.
            </strong>
            <p>{service.message}</p>
            <details>
              <summary>
                How to connect the models <ChevronDown size={14} />
              </summary>
              <p>
                From the project folder, run <code>./start.command</code>. It
                starts the backend on port 8000 and the website on port 3000.
                Open the local website to analyse images. A public deployment
                needs a hosted backend configured through{" "}
                <code>LUCENT_API_URL</code>.
              </p>
            </details>
          </div>
          <button
            className="button button-quiet"
            onClick={() => void checkConnection()}
            disabled={checking}
          >
            Check again <RefreshCw size={14} />
          </button>
        </aside>
      )}
      {error && (
        <div className="analysis-error" role="alert">
          <AlertCircle size={19} />
          <p>{error}</p>
          <button
            className="icon-button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="analysis-grid">
        <div className="analysis-left">
          <AnalysisViewer
            image={image}
            explanation={explanation}
            view={view}
            setView={setView}
            opacity={opacity}
            setOpacity={setOpacity}
            split={split}
            setSplit={setSplit}
            inputRef={inputRef}
            onFile={chooseFile}
            busy={busy}
            onSample={() => void sample()}
            fileLimit={fileLimit}
            dragOver={dragOver}
            onDrag={setDragOver}
          />
          <section
            className="explanation-panel"
            aria-labelledby="explanation-heading"
          >
            <div className="panel-heading">
              <div>
                <span className="step-label">03 / VISUAL ATTENTION</span>
                <h2 id="explanation-heading">Where did it look?</h2>
              </div>
              <ScanLine size={22} strokeWidth={1.3} />
            </div>
            {!hasResults ? (
              <p>
                After analysis, select a finding to generate its Grad-CAM
                attention map.
              </p>
            ) : (
              <>
                <div className="explanation-selection">
                  <div>
                    <span>Selected finding</span>
                    <strong>{displayFinding(finding)}</strong>
                  </div>
                  {Object.keys(results).length > 1 ? (
                    <div
                      className="map-models"
                      role="group"
                      aria-label="Model for attention map"
                    >
                      {MODEL_IDS.filter((id) => results[id]).map((id) => (
                        <button
                          key={id}
                          aria-pressed={mapModel === id}
                          disabled={busy}
                          onClick={() => {
                            setMapModel(id);
                            if (!maps[`${id}:${finding}`]) setView("original");
                          }}
                        >
                          {MODEL_NAMES[id]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="model-name">{MODEL_NAMES[mapModel]}</span>
                  )}
                </div>
                <button
                  className="button button-outline generate-map"
                  onClick={() => void explain()}
                  disabled={busy || service?.status !== "ready"}
                >
                  {busy && activity.startsWith("Generating") ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <ScanLine size={17} />
                  )}{" "}
                  {explanation
                    ? "Show attention map"
                    : "Generate attention map"}{" "}
                  <ArrowRight size={16} />
                </button>
                {explanation?.degenerate ? (
                  <p className="map-limitation">
                    <AlertCircle size={16} />
                    This map is constant and uninformative. The original image
                    is shown instead.
                  </p>
                ) : (
                  explanation && (
                    <p className="map-generated">
                      <Check size={15} /> Grad-CAM generated for{" "}
                      {displayFinding(finding)} with {MODEL_NAMES[mapModel]}.
                    </p>
                  )
                )}
              </>
            )}
            <p className="explanation-note">
              Attention shows model influence. It does not confirm a finding or
              provide a clinically validated explanation.
            </p>
          </section>
        </div>
        <div className="analysis-right">
          <section className="model-panel" aria-labelledby="model-heading">
            <div className="panel-heading">
              <div>
                <span className="step-label">CHOOSE AN ARCHITECTURE</span>
                <h2 id="model-heading">One image. Two perspectives.</h2>
              </div>
            </div>
            <div
              className="model-options"
              role="group"
              aria-label="Select analysis model"
            >
              {[
                { id: "resnet50" as const, label: "ResNet50" },
                { id: "densenet121" as const, label: "DenseNet121" },
                { id: "compare" as const, label: "Compare both" },
              ].map((item) => (
                <button
                  key={item.id}
                  aria-pressed={selection === item.id}
                  disabled={
                    busy ||
                    (service?.status === "ready" &&
                      item.id !== "compare" &&
                      !service.models.find((model) => model.id === item.id)
                        ?.available)
                  }
                  onClick={() => selectModel(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p>
              {selection === "compare"
                ? "Run both models on the same image and compare all 14 scores side by side."
                : `${MODEL_NAMES[selection]} returns 14 independent finding scores with its own validation thresholds.`}
            </p>
            <button
              className="button run-analysis"
              onClick={() => void run()}
              disabled={!canRun}
            >
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={18} />
                  Working…
                </>
              ) : (
                <>
                  Run {selection === "compare" ? "both models" : "analysis"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <div className="run-context" aria-live="polite">
              {busy ? (
                <>
                  <span>{activity}</span>
                  <button onClick={cancel}>Cancel</button>
                </>
              ) : completedAt ? (
                <span>
                  <Check size={14} />
                  Analysis complete ·{" "}
                  {new Date(completedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : (
                <span>
                  {!image
                    ? "Choose an image to begin."
                    : service?.status !== "ready"
                      ? "Connect the model service to run this image."
                      : "Your image is ready for analysis."}
                </span>
              )}
            </div>
          </section>
          <FindingResults
            results={results}
            selected={finding}
            onSelect={selectFinding}
            aboveOnly={aboveOnly}
            onFilter={setAboveOnly}
            busy={busy}
            onExport={exportResults}
          />
          {hasResults && (
            <details className="run-details">
              <summary>
                Model and request details <ChevronDown size={14} />
              </summary>
              {(Object.keys(results) as ModelId[]).map((id) => (
                <dl key={id}>
                  <dt>{MODEL_NAMES[id]}</dt>
                  <dd>{results[id]!.model_version}</dd>
                  <dt>Thresholds</dt>
                  <dd>{results[id]!.threshold_source}</dd>
                </dl>
              ))}
              <p>
                Format and dimensions are validated. The backend does not verify
                that an image is a chest X-ray.
              </p>
            </details>
          )}
        </div>
      </div>
      <footer className="analysis-footer">
        <span>
          <FileJson size={15} />
          Images are processed in memory. Results stay in this browser session
          unless you export them.
        </span>
        <span>Academic prototype · not for clinical use</span>
      </footer>
    </div>
  );
}
