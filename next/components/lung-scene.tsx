"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  MoveHorizontal,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { LungFallback } from "./lung-fallback";

type SceneHandle = {
  rotate: (amount: number) => void;
  reset: () => void;
  setPaused: (paused: boolean) => void;
  setAttention: (attention: boolean) => void;
};

export function LungScene() {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<SceneHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [attention, setAttention] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPaused(motion.matches);
    import("./lung-renderer")
      .then(async ({ mountLungs }) => {
        if (cancelled) return;
        try {
          const scene = await mountLungs(element, { paused: motion.matches });
          if (cancelled) {
            scene.dispose();
            return;
          }
          cleanup = scene.dispose;
          api.current = scene;
          setReady(true);
        } catch {
          setUnavailable(true);
        }
      })
      .catch(() => setUnavailable(true));
    return () => {
      cancelled = true;
      api.current = null;
      cleanup?.();
    };
  }, []);
  function togglePause() {
    const value = !paused;
    setPaused(value);
    api.current?.setPaused(value);
  }
  function toggleAttention() {
    const value = !attention;
    setAttention(value);
    api.current?.setAttention(value);
  }
  return (
    <div className={`anatomy ${ready ? "scene-ready" : ""}`}>
      <div className="anatomy-orbit orbit-one" />
      <div className="anatomy-orbit orbit-two" />
      <div className="anatomy-orbit orbit-three" />
      <LungFallback />
      <div
        className="lung-canvas"
        ref={host}
        role="img"
        aria-label="Conceptual 3D particle lungs. Use the rotation buttons or drag to explore."
      />
      <div className="anatomy-label">
        <span className="tiny-cross">+</span>
        <span>
          <b>{attention ? "02" : "01"}</b> /{" "}
          {attention ? "ATTENTION" : "STRUCTURE"}
        </span>
      </div>
      <span className="anatomy-axis axis-top">SUPERIOR</span>
      <span className="anatomy-axis axis-side">L</span>
      <div className="anatomy-bottom">
        <span>
          <MoveHorizontal size={14} />
          {unavailable ? "Conceptual anatomy" : "Drag to explore"}
        </span>
        <div className="scene-controls">
          <button
            onClick={() => api.current?.rotate(-0.3)}
            aria-label="Rotate lungs left"
            disabled={!ready}
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={togglePause}
            aria-label={paused ? "Play lung animation" : "Pause lung animation"}
            disabled={!ready}
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <button
            onClick={() => api.current?.reset()}
            aria-label="Reset lung view"
            disabled={!ready}
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={() => api.current?.rotate(0.3)}
            aria-label="Rotate lungs right"
            disabled={!ready}
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <button
        className={`attention-toggle ${attention ? "active" : ""}`}
        aria-pressed={attention}
        onClick={toggleAttention}
        disabled={!ready}
      >
        <span /> {attention ? "Viewing attention" : "Reveal attention"}
      </button>
    </div>
  );
}
