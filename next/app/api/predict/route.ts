import { backendUrl, uploadLimit } from "@/lib/analysis-server";
import { isFinding, isModelId } from "@/lib/analysis";
export const runtime = "nodejs";
export const maxDuration = 120;
const failure = (detail: string, status: number) =>
  Response.json(
    { detail },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function POST(request: Request) {
  let url: string | null;
  try {
    url = backendUrl();
  } catch {
    return failure(
      "The analysis service address is not configured correctly.",
      503,
    );
  }
  if (!url)
    return failure(
      "The model service is not connected to this website. Run the project locally to use the trained models.",
      503,
    );
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data"))
    return failure("Choose a PNG or JPEG image to analyse.", 400);
  const declaredSize = Number(request.headers.get("content-length"));
  const bodyLimit = uploadLimit + 64 * 1024;
  if (Number.isFinite(declaredSize) && declaredSize > bodyLimit)
    return failure(
      `The image must be smaller than ${uploadLimit / 1024 / 1024} MiB.`,
      413,
    );
  try {
    if (!request.body) return failure("The image file is missing.", 422);
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > bodyLimit) {
        await reader.cancel();
        return failure("The uploaded image is too large.", 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: bytes,
    }).formData();
    const file = form.get("file"),
      model = form.get("model") || "resnet50",
      finding = form.get("explain_finding");
    if (!(file instanceof File) || !file.size)
      return failure("Choose a non-empty PNG or JPEG image.", 422);
    if (file.size > uploadLimit)
      return failure("The uploaded image is too large.", 413);
    if (!["image/png", "image/jpeg"].includes(file.type))
      return failure("Only PNG and JPEG images are supported.", 400);
    if (!isModelId(model))
      return failure("Choose ResNet50 or DenseNet121.", 422);
    if (finding !== null && !isFinding(finding))
      return failure("Choose a valid finding for the attention map.", 422);
    const forward = new FormData();
    forward.append("file", file);
    forward.append("model", model);
    if (finding !== null) forward.append("explain_finding", String(finding));
    const response = await fetch(`${url}/predict`, {
      method: "POST",
      body: forward,
      cache: "no-store",
      signal: AbortSignal.timeout(115_000),
    });
    const body = await response.json();
    return Response.json(body, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    )
      return failure(
        "The model took too long to respond. Try again with one model.",
        504,
      );
    return failure(
      "The analysis service could not be reached. Start the backend and try again.",
      503,
    );
  }
}
