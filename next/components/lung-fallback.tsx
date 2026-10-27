import Image from "next/image";
import type { Ref } from "react";
export function LungFallback({
  visualRef,
}: {
  visualRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div className="lung-fallback" ref={visualRef}>
      <Image
        src="/images/lungs-particles.webp"
        alt="Concept illustration of the lungs and branching airways"
        fill
        priority
        draggable={false}
        sizes="(max-width: 600px) 95vw, 58vw"
        quality={85}
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}
