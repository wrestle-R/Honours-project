import "server-only";
import { FINDINGS, MODEL_IDS, type ServiceState } from "./analysis";

export const uploadLimit = process.env.VERCEL
  ? 4 * 1024 * 1024
  : 20 * 1024 * 1024;
export function backendUrl(): string | null {
  const configured = process.env.LUCENT_API_URL?.trim();
  if (!configured && process.env.VERCEL) return null;
  const value = new URL(configured || "http://127.0.0.1:8000");
  if (!["http:", "https:"].includes(value.protocol))
    throw new Error("Unsupported API address");
  return value.toString().replace(/\/$/, "");
}
export async function serviceState(): Promise<ServiceState> {
  const base: ServiceState = {
    status: "offline",
    models: MODEL_IDS.map((id) => ({ id, available: false })),
    findings: FINDINGS,
    default_model: "resnet50",
    max_upload_bytes: uploadLimit,
    mode: process.env.VERCEL ? "hosted" : "local",
    message: "The analysis service is not connected.",
  };
  try {
    const url = backendUrl();
    if (!url)
      return {
        ...base,
        message:
          "The public interface is ready. The trained models currently run with the local project.",
      };
    const [healthResponse, modelsResponse] = await Promise.all([
      fetch(`${url}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${url}/models`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }),
    ]);
    if (!healthResponse.ok || !modelsResponse.ok) return base;
    const [health, catalog] = await Promise.all([
      healthResponse.json(),
      modelsResponse.json(),
    ]);
    if (health.status !== "ok" || !Array.isArray(health.loaded_models))
      return base;
    const models = MODEL_IDS.map((id) => ({
      id,
      available: Boolean(
        health.loaded_models.includes(id) &&
          catalog.models?.some(
            (item: { id: string; available: boolean }) =>
              item.id === id && item.available === true,
          ),
      ),
    }));
    if (!models.some((item) => item.available)) return base;
    return {
      ...base,
      status: "ready",
      models,
      message: "Trained models connected.",
    };
  } catch {
    return base;
  }
}
