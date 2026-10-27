import { ImageResponse } from "next/og";
export const alt =
  "Lucent. See beyond the scan. Explainable medical imaging research.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#101211",
          color: "#eeeae2",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 9 }}>✳ LUCENT</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 110,
            lineHeight: 1.05,
            letterSpacing: -6,
          }}
        >
          <span>See beyond</span>
          <span style={{ color: "#f36a3b", fontStyle: "italic" }}>
            the scan.
          </span>
        </div>
        <div style={{ fontSize: 20, color: "#9c9f98" }}>
          EXPLAINABLE MEDICAL IMAGING · AN HONOURS PROJECT
        </div>
      </div>
    ),
    size,
  );
}
