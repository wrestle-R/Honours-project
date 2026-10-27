import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = (process.env.LUCENT_TEST_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const sample = await readFile(
  new URL("../public/images/example-chest.jpg", import.meta.url),
);
function form(model = "resnet50", finding) {
  const data = new FormData();
  data.append(
    "file",
    new Blob([sample], { type: "image/jpeg" }),
    "synthetic-example.jpg",
  );
  data.append("model", model);
  if (finding !== undefined) data.append("explain_finding", finding);
  return data;
}
async function post(data) {
  const response = await fetch(`${base}/api/predict`, {
    method: "POST",
    body: data,
    signal: AbortSignal.timeout(120_000),
  });
  return { response, body: await response.json() };
}
function checkPrediction(body, model) {
  assert.equal(body.architecture, model);
  assert.equal(body.findings.length, 14);
  assert.equal(new Set(body.findings.map((item) => item.finding)).size, 14);
  assert.equal(body.scores_are_calibrated_probabilities, false);
  for (const row of body.findings) {
    assert.ok(Number.isFinite(row.score) && row.score >= 0 && row.score <= 1);
    assert.ok(
      Number.isFinite(row.threshold) &&
        row.threshold >= 0 &&
        row.threshold <= 1,
    );
    assert.equal(row.above_threshold, row.score >= row.threshold);
  }
  assert.equal(
    body.no_label_above_threshold,
    !body.findings.some((item) => item.above_threshold),
  );
}
await test("the frontend sees both loaded checkpoints", async () => {
  const response = await fetch(`${base}/api/service`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.status, "ready");
  assert.equal(data.models.filter((item) => item.available).length, 2);
  assert.equal(data.findings.length, 14);
});
for (const model of ["resnet50", "densenet121"])
  await test(`${model} returns 14 actual model scores through the frontend`, async () => {
    const { response, body } = await post(form(model));
    assert.equal(response.status, 200, JSON.stringify(body));
    checkPrediction(body, model);
  });
await test("Grad-CAM returns a complete 224px PNG and the requested finding", async () => {
  const { response, body } = await post(form("resnet50", "Effusion"));
  assert.equal(response.status, 200, JSON.stringify(body));
  checkPrediction(body, "resnet50");
  assert.equal(body.explanation.finding, "Effusion");
  assert.equal(typeof body.explanation.degenerate, "boolean");
  const bytes = Buffer.from(
    body.explanation.overlay_data_url.split(",")[1],
    "base64",
  );
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
  assert.equal(bytes.readUInt32BE(16), 224);
  assert.equal(bytes.readUInt32BE(20), 224);
});
await test("invalid models and empty finding fields are rejected", async () => {
  assert.equal((await post(form("unknown"))).response.status, 422);
  assert.equal((await post(form("resnet50", ""))).response.status, 422);
});
await test("corrupt image contents are rejected by the backend", async () => {
  const data = new FormData();
  data.append(
    "file",
    new Blob(["not an image"], { type: "image/png" }),
    "corrupt.png",
  );
  assert.equal((await post(data)).response.status, 400);
});
