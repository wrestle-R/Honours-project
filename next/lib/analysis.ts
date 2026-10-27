export const MODEL_IDS = ["resnet50", "densenet121"] as const;
export type ModelId = (typeof MODEL_IDS)[number];
export type ModelSelection = ModelId | "compare";
export const MODEL_NAMES: Record<ModelId, string> = {
  resnet50: "ResNet50",
  densenet121: "DenseNet121",
};
export const FINDINGS = [
  "Atelectasis",
  "Cardiomegaly",
  "Consolidation",
  "Edema",
  "Effusion",
  "Emphysema",
  "Fibrosis",
  "Hernia",
  "Infiltration",
  "Mass",
  "Nodule",
  "Pleural_Thickening",
  "Pneumonia",
  "Pneumothorax",
] as const;
export type FindingName = (typeof FINDINGS)[number];
export type FindingScore = {
  finding: FindingName;
  score: number;
  threshold: number;
  above_threshold: boolean;
};
export type Explanation = {
  finding: FindingName;
  architecture: ModelId;
  method: string;
  score: number;
  class_index: number;
  native_feature_size: number[];
  degenerate: boolean;
  limitation: string;
  overlay_data_url: string;
};
export type Prediction = {
  architecture: ModelId;
  model_version: string;
  findings: FindingScore[];
  no_label_above_threshold: boolean;
  scores_are_calibrated_probabilities: false;
  threshold_source: string;
  input_validation: string;
  interpretation: string;
  disclaimer: string;
  explanation?: Explanation;
};
export type ServiceState = {
  status: "ready" | "offline";
  models: { id: ModelId; available: boolean }[];
  findings: readonly string[];
  default_model: ModelId;
  max_upload_bytes: number;
  mode: "local" | "hosted";
  message: string;
};
export const displayFinding = (value: string) => value.replaceAll("_", " ");
export const isModelId = (value: unknown): value is ModelId =>
  MODEL_IDS.includes(value as ModelId);
export const isFinding = (value: unknown): value is FindingName =>
  FINDINGS.includes(value as FindingName);
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const unit = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1;

export function readPrediction(value: unknown, expected: ModelId): Prediction {
  if (
    !record(value) ||
    value.architecture !== expected ||
    typeof value.model_version !== "string" ||
    !Array.isArray(value.findings) ||
    value.findings.length !== FINDINGS.length
  )
    throw new Error(
      "The analysis service returned an incomplete result. Please try again.",
    );
  const seen = new Set<string>();
  for (const item of value.findings) {
    if (
      !record(item) ||
      !isFinding(item.finding) ||
      seen.has(item.finding) ||
      !unit(item.score) ||
      !unit(item.threshold) ||
      typeof item.above_threshold !== "boolean"
    )
      throw new Error("The analysis service returned invalid finding scores.");
    seen.add(item.finding);
  }
  if (value.explanation !== undefined) {
    const explanation = value.explanation;
    if (
      !record(explanation) ||
      !isFinding(explanation.finding) ||
      explanation.architecture !== expected ||
      typeof explanation.degenerate !== "boolean" ||
      typeof explanation.overlay_data_url !== "string" ||
      !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(
        explanation.overlay_data_url,
      ) ||
      explanation.overlay_data_url.length > 2_000_000
    )
      throw new Error(
        "The attention map could not be read. Your prediction scores are still available.",
      );
  }
  return value as unknown as Prediction;
}

export function errorMessage(
  body: unknown,
  fallback = "The request could not be completed.",
): string {
  if (!record(body)) return fallback;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail))
    return body.detail
      .map((item) =>
        record(item) && typeof item.msg === "string"
          ? item.msg
          : "Invalid request field",
      )
      .join(". ");
  return fallback;
}
