import { Brand } from "@/components/brand";
export default function NotFound() {
  return (
    <main
      className="wrap"
      style={{
        minHeight: "85svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 24,
      }}
    >
      <Brand />
      <p className="section-kicker">PAGE NOT FOUND</p>
      <h1 style={{ fontSize: "clamp(42px,6vw,76px)", lineHeight: 1.15 }}>
        Let’s get you
        <br />
        back to the workbench.
      </h1>
      <p style={{ color: "var(--muted)", maxWidth: 440 }}>
        This page does not exist. You can return to Lucent or open the analysis
        workbench.
      </p>
      <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
        <a className="button button-primary" href="/workbench">
          Open workbench
        </a>
        <a className="button button-outline" href="/">
          Back to overview
        </a>
      </div>
    </main>
  );
}
