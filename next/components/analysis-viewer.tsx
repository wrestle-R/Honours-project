"use client";
import Image from "next/image";
import { Columns2, Eye, ImagePlus, ScanLine, Upload } from "lucide-react";
import type { DragEvent, RefObject } from "react";
import type { Explanation } from "@/lib/analysis";
export type PreparedImage = {
  file: File;
  preview: string;
  modelInput: string;
  width: number;
  height: number;
  synthetic: boolean;
};
export type ViewMode = "original" | "attention" | "compare";
type Props = {
  image: PreparedImage | null;
  explanation?: Explanation;
  view: ViewMode;
  setView: (value: ViewMode) => void;
  opacity: number;
  setOpacity: (value: number) => void;
  split: number;
  setSplit: (value: number) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  onFile: (file: File, synthetic?: boolean) => Promise<void>;
  busy: boolean;
  onSample: () => void;
  fileLimit: number;
  dragOver: boolean;
  onDrag: (value: boolean) => void;
};
export function AnalysisViewer({
  image,
  explanation,
  view,
  setView,
  opacity,
  setOpacity,
  split,
  setSplit,
  inputRef,
  onFile,
  busy,
  onSample,
  fileLimit,
  dragOver,
  onDrag,
}: Props) {
  const usable = !!explanation && !explanation.degenerate;
  function drop(event: DragEvent) {
    event.preventDefault();
    onDrag(false);
    if (!busy && event.dataTransfer.files[0])
      void onFile(event.dataTransfer.files[0]);
  }
  return (
    <section className="analysis-image-panel" aria-labelledby="input-heading">
      <div className="panel-heading">
        <div>
          <span className="step-label">01 / INPUT IMAGE</span>
          <h2 id="input-heading">
            {image ? image.file.name : "Your chest X-ray"}
          </h2>
        </div>
        <button
          className="button button-quiet"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload size={16} />
          {image ? "Replace image" : "Choose image"}
        </button>
      </div>
      <input
        className="sr-only"
        id="scan-upload"
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
          event.currentTarget.value = "";
        }}
        aria-label="Upload a chest X-ray image"
        disabled={busy}
      />
      <div
        className={`analysis-stage ${dragOver ? "is-dragging" : ""}`}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
            onDrag(true);
          }
        }}
        onDragLeave={() => onDrag(false)}
        onDrop={drop}
      >
        {!image ? (
          <div className="upload-empty">
            <div className="upload-glyph">
              <ScanLine size={42} strokeWidth={1} />
            </div>
            <span>ONE IMAGE. A CLOSER LOOK.</span>
            <h3>Start with a chest X-ray.</h3>
            <p>
              Drop a PNG or JPEG here, or choose an image from your computer.
            </p>
            <button
              className="button button-primary"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <ImagePlus size={17} />
              Choose an image
            </button>
            <small>PNG or JPEG · up to {fileLimit / 1024 / 1024} MiB</small>
            <button className="sample-link" onClick={onSample} disabled={busy}>
              Or explore with a synthetic example <span>↗</span>
            </button>
          </div>
        ) : (
          <>
            <div className="analysis-image-meta">
              <span>
                {view === "original"
                  ? "ORIGINAL IMAGE"
                  : "224 × 224 MODEL-INPUT PREVIEW"}
              </span>
              <span>
                {image.synthetic ? "SYNTHETIC EXAMPLE" : "UPLOADED IMAGE"}
              </span>
            </div>
            <div
              className={`analysis-image-frame ${view === "original" ? "full-image" : "model-image"}`}
            >
              <Image
                src={view === "original" ? image.preview : image.modelInput}
                alt={
                  image.synthetic
                    ? "Synthetic chest X-ray example"
                    : `Uploaded image: ${image.file.name}`
                }
                fill
                unoptimized
                sizes="(max-width: 900px) 100vw, 55vw"
              />
              {usable && view !== "original" && (
                <div
                  className="actual-overlay"
                  style={{
                    opacity: opacity / 100,
                    clipPath:
                      view === "compare" ? `inset(0 0 0 ${split}%)` : undefined,
                  }}
                >
                  <Image
                    src={explanation.overlay_data_url}
                    alt={`Grad-CAM model attention for ${explanation.finding}`}
                    fill
                    unoptimized
                    sizes="(max-width: 900px) 100vw, 55vw"
                  />
                </div>
              )}
              {usable && view === "compare" && (
                <>
                  <div className="actual-divider" style={{ left: `${split}%` }}>
                    <span>
                      <Columns2 size={16} />
                    </span>
                  </div>
                  <input
                    className="actual-compare-input"
                    type="range"
                    min="5"
                    max="95"
                    value={split}
                    onChange={(event) => setSplit(Number(event.target.value))}
                    aria-label="Attention comparison divider"
                  />
                </>
              )}
            </div>
            <div className="analysis-image-footer">
              <span>
                {image.width} × {image.height} px ·{" "}
                {(image.file.size / 1024 / 1024).toFixed(2)} MiB
              </span>
              <span>
                {view === "compare"
                  ? "Original preview / Grad-CAM"
                  : usable && view === "attention"
                    ? `Grad-CAM · ${explanation.finding.replaceAll("_", " ")}`
                    : "No image is saved by the application"}
              </span>
            </div>
          </>
        )}
        {busy && (
          <div className="stage-working" aria-hidden="true">
            <div />
            <span>Processing image</span>
          </div>
        )}
      </div>
      <div className="analysis-view-toolbar">
        <div
          className="view-tabs"
          role="group"
          aria-label="Analysis image view"
        >
          {[
            { id: "original" as const, label: "Original", icon: Eye },
            { id: "attention" as const, label: "Attention", icon: ScanLine },
            { id: "compare" as const, label: "Compare", icon: Columns2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-pressed={view === id}
              onClick={() => setView(id)}
              disabled={!image || (id !== "original" && !usable)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
        {usable && view !== "original" && (
          <label className="actual-opacity">
            Overlay{" "}
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(event) => setOpacity(Number(event.target.value))}
              aria-label="Grad-CAM overlay opacity"
            />
            <output>{opacity}%</output>
          </label>
        )}
      </div>
      <p className="image-panel-note">
        {image?.synthetic
          ? "This example is AI-generated. It is not a patient scan or a dataset record."
          : "Use de-identified chest X-rays for this academic demonstration. The service checks image format and dimensions, not whether an image is an X-ray."}
      </p>
    </section>
  );
}
