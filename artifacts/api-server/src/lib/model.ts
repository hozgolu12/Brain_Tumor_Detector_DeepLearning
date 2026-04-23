import { logger } from "./logger";

export const CLASSES = ["glioma", "meningioma", "pituitary", "no_tumor"] as const;
export type TumorClass = (typeof CLASSES)[number];

export interface InferenceResult {
  predictedClass: string;
  confidence: number;
  probabilities: Array<{ label: string; probability: number }>;
  modelVersion: string;
  backend: string;
  processingTimeMs: number;
}

const MODEL_SERVICE_URL = process.env["MODEL_SERVICE_URL"];

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

function deterministicMockInference(imageBase64: string, filename: string): InferenceResult {
  const start = Date.now();
  let hash = 0;
  const sample = imageBase64.slice(0, 2048) + filename;
  for (let i = 0; i < sample.length; i++) {
    hash = (hash * 31 + sample.charCodeAt(i)) | 0;
  }
  const rand = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  const logits = CLASSES.map((_, i) => rand(hash + i * 17) * 4);
  const dominant = Math.abs(hash) % CLASSES.length;
  logits[dominant] += 3 + rand(hash + 99) * 2;
  const probs = softmax(logits);
  const probabilities = CLASSES.map((label, i) => ({
    label,
    probability: Number(probs[i]!.toFixed(4)),
  }));
  let bestIdx = 0;
  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i]!.probability > probabilities[bestIdx]!.probability) bestIdx = i;
  }
  return {
    predictedClass: probabilities[bestIdx]!.label,
    confidence: probabilities[bestIdx]!.probability,
    probabilities,
    modelVersion: "mock-v1.0",
    backend: "mock",
    processingTimeMs: Date.now() - start + Math.floor(rand(hash) * 80) + 40,
  };
}

export async function runInference(
  imageBase64: string,
  filename: string,
): Promise<InferenceResult> {
  if (MODEL_SERVICE_URL) {
    const start = Date.now();
    try {
      const resp = await fetch(`${MODEL_SERVICE_URL.replace(/\/$/, "")}/predict`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64, filename }),
      });
      if (!resp.ok) {
        throw new Error(`Model service returned ${resp.status}`);
      }
      const data = (await resp.json()) as Partial<InferenceResult>;
      if (!data.predictedClass || !data.probabilities) {
        throw new Error("Invalid response from model service");
      }
      return {
        predictedClass: data.predictedClass,
        confidence: data.confidence ?? 0,
        probabilities: data.probabilities,
        modelVersion: data.modelVersion ?? "external",
        backend: data.backend ?? "tensorflow-python",
        processingTimeMs: data.processingTimeMs ?? Date.now() - start,
      };
    } catch (err) {
      logger.error({ err }, "Model service call failed, falling back to mock");
      return deterministicMockInference(imageBase64, filename);
    }
  }
  return deterministicMockInference(imageBase64, filename);
}

export function getModelInfo() {
  return {
    name: "NeuroScan CNN",
    version: MODEL_SERVICE_URL ? "external-1.0" : "mock-v1.0",
    classes: [...CLASSES],
    inputSize: "224x224",
    loaded: true,
    backend: MODEL_SERVICE_URL ? "tensorflow-python" : "mock",
  };
}
