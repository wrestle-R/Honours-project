"use client";
import { useRef, type PointerEvent } from "react";
import { LungFallback } from "./lung-fallback";

export function LungScene() {
  const visual = useRef<HTMLDivElement>(null);
  function move(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    visual.current?.style.setProperty("--lung-x", `${x * 8}px`);
    visual.current?.style.setProperty("--lung-y", `${y * 5}px`);
    visual.current?.style.setProperty("--lung-rx", `${y * -3}deg`);
    visual.current?.style.setProperty("--lung-ry", `${x * 4}deg`);
  }
  function reset() {
    visual.current?.removeAttribute("style");
  }
  return (
    <div className="anatomy" onPointerMove={move} onPointerLeave={reset}>
      <div className="anatomy-orbit orbit-one" />
      <div className="anatomy-orbit orbit-two" />
      <div className="anatomy-orbit orbit-three" />
      <LungFallback visualRef={visual} />
      <div className="anatomy-label">
        <span className="tiny-cross">+</span>
        <span>CHEST ANATOMY</span>
      </div>
      <div className="anatomy-bottom">
        <span>Concept illustration</span>
      </div>
    </div>
  );
}
