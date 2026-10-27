import Image from "next/image";
export function LungFallback() {
  return (
    <div className="lung-fallback">
      <Image
        src="/images/lungs-particles.webp"
        alt=""
        fill
        priority
        sizes="(max-width: 600px) 95vw, 58vw"
        quality={85}
        style={{ objectFit: "contain", padding: "0%" }}
      />
    </div>
  );
}
