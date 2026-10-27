"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Brain,
  Eye,
  Columns2,
  ArrowUpRight,
  Info,
  RotateCcw,
  ScanLine,
  Layers3,
  ChartNoAxesColumnIncreasing,
} from "lucide-react";

type Mode = "original" | "attention" | "compare";
const modes = [
  { id: "original" as Mode, label: "Original", icon: Eye },
  { id: "attention" as Mode, label: "Attention", icon: Brain },
  { id: "compare" as Mode, label: "Compare", icon: Columns2 },
];
const features = [
  {
    icon: Layers3,
    title: "More than one finding.",
    description:
      "One image can tell several stories. Each trained model considers 14 radiographic findings independently.",
  },
  {
    icon: Brain,
    title: "See where it looks.",
    description:
      "Grad-CAM helps inspect the image regions that influence an output. Attention is a starting point for asking why.",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Put models side by side.",
    description:
      "Compare DenseNet121 with a ResNet50 baseline, then look closely at where their results differ.",
  },
];
export function Workbench() {
  const [mode, setMode] = useState<Mode>("attention");
  const [opacity, setOpacity] = useState(65);
  const [split, setSplit] = useState(50);
  const [region, setRegion] = useState("mid");
  return (
    <div className="workbench" data-reveal>
      <div className="viewer-bar">
        <span>
          <ScanLine size={15} /> WORKBENCH PREVIEW
        </span>
        <span className="demo-status">
          <i /> Illustrative preview
        </span>
      </div>
      <div className="workbench-grid">
        <div className="viewer-modes" role="group" aria-label="Image view mode">
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={mode === id ? "selected" : ""}
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className={`scan-stage mode-${mode}`}>
          <div className="image-caption">
            <span>SYNTHETIC CHEST IMAGE</span>
            <span>FRONTAL VIEW</span>
          </div>
          <div className="scan-image">
            <Image
              src="/images/chest-illustration.webp"
              alt="Synthetic educational illustration of a frontal chest radiograph, not a patient scan"
              fill
              sizes="(max-width: 700px) 90vw, (max-width: 1000px) 70vw, 48vw"
              quality={85}
            />
            <div
              className="heatmap-clip"
              style={{
                clipPath:
                  mode === "compare" ? `inset(0 0 0 ${split}%)` : undefined,
              }}
            >
              <div
                className={`heatmap heatmap-${region}`}
                style={{ opacity: mode === "original" ? 0 : opacity / 100 }}
              />
            </div>
            {mode === "compare" && (
              <>
                <div className="compare-line" style={{ left: `${split}%` }}>
                  <span>
                    <Columns2 size={16} />
                  </span>
                </div>
                <div className="compare-labels">
                  <span>Original</span>
                  <span>Illustrative attention</span>
                </div>
                <input
                  className="compare-range"
                  type="range"
                  min="5"
                  max="95"
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  aria-label="Image comparison divider"
                />
              </>
            )}
          </div>
          <div className="scan-corner corner-tl" />
          <div className="scan-corner corner-tr" />
          <div className="scan-corner corner-bl" />
          <div className="scan-corner corner-br" />
          <div className="scan-bottom">
            <span>ILLUSTRATIVE IMAGE</span>
            <span>NO PATIENT DATA</span>
          </div>
        </div>
        <div className="viewer-info">
          <span className="eyebrow">A WINDOW INTO THE MODEL</span>
          <h3>
            A closer look<span>.</span>
          </h3>
          <p className="viewer-intro">
            A preview of the questions the workbench will help us explore.
          </p>
          <div className="viewer-features">
            {features.map(({ icon: Icon, title, description }) => (
              <div className="viewer-feature" key={title}>
                <Icon size={22} />
                <div>
                  <h4>{title}</h4>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="region-picker">
            <span>Explore illustrative attention</span>
            <div
              className="region-options"
              role="group"
              aria-label="Illustrative attention region"
            >
              {[
                { id: "upper", label: "Upper" },
                { id: "mid", label: "Mid" },
                { id: "lower", label: "Lower" },
              ].map((item) => (
                <button
                  key={item.id}
                  aria-pressed={region === item.id}
                  onClick={() => {
                    setRegion(item.id);
                    if (mode === "original") setMode("attention");
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <a href="#science" className="text-link">
            Behind the approach <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
      <div className="viewer-controls">
        <label htmlFor="opacity">
          Attention opacity <output>{opacity}%</output>
        </label>
        <input
          id="opacity"
          aria-label="Attention opacity"
          type="range"
          min="0"
          max="100"
          value={opacity}
          style={{
            background: `linear-gradient(to right,var(--orange) ${opacity}%,var(--range-track) ${opacity}%)`,
          }}
          onChange={(e) => {
            setOpacity(Number(e.target.value));
            if (mode === "original") setMode("attention");
          }}
        />
        <button
          className="reset-view"
          onClick={() => {
            setOpacity(65);
            setSplit(50);
            setRegion("mid");
            setMode("attention");
          }}
          aria-label="Reset workbench preview"
        >
          <RotateCcw size={15} />
        </button>
        <span className="demo-note">
          <Info size={14} /> ILLUSTRATIVE DEMO · NO MODEL CONNECTED
        </span>
      </div>
      <p className="demo-disclaimer">
        The image is AI-generated and the attention overlay is hand-designed.
        These controls demonstrate the interface, not an analysis or a
        diagnosis.
      </p>
    </div>
  );
}
