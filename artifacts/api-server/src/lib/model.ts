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

export class ModelUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelUnavailableError";
  }
}

export async function runInference(
  imageBase64: string,
  filename: string,
): Promise<InferenceResult> {
  if (!MODEL_SERVICE_URL) {
    throw new ModelUnavailableError(
      "MODEL_SERVICE_URL is not configured. Start the Python inference service (see model_service/README.md) and set MODEL_SERVICE_URL.",
    );
  }
  const start = Date.now();
  let resp: Response;
  try {
    resp = await fetch(`${MODEL_SERVICE_URL.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imageBase64, filename }),
    });
  } catch (err) {
    logger.error({ err }, "Model service request failed");
    throw new ModelUnavailableError(
      `Could not reach model service at ${MODEL_SERVICE_URL}.`,
    );
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new ModelUnavailableError(
      `Model service returned ${resp.status}${text ? `: ${text}` : ""}`,
    );
  }
  const data = (await resp.json()) as Partial<InferenceResult>;
  if (!data.predictedClass || !data.probabilities) {
    throw new ModelUnavailableError("Invalid response from model service");
  }
  return {
    predictedClass: data.predictedClass,
    confidence: data.confidence ?? 0,
    probabilities: data.probabilities,
    modelVersion: data.modelVersion ?? "external",
    backend: data.backend ?? "tensorflow-python",
    processingTimeMs: data.processingTimeMs ?? Date.now() - start,
  };
}

export async function getModelInfo() {
  const baseInfo = {
    name: "NeuroScan CNN",
    classes: [...CLASSES],
    inputSize: "224x224",
  };
  if (!MODEL_SERVICE_URL) {
    return {
      ...baseInfo,
      version: "not-loaded",
      loaded: false,
      backend: "none",
    };
  }
  try {
    const resp = await fetch(`${MODEL_SERVICE_URL.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (resp.ok) {
      return {
        ...baseInfo,
        version: process.env["MODEL_VERSION"] ?? "external-1.0",
        loaded: true,
        backend: "tensorflow-python",
      };
    }
  } catch (err) {
    logger.warn({ err }, "Model service health check failed");
  }
  return {
    ...baseInfo,
    version: "unreachable",
    loaded: false,
    backend: "tensorflow-python",
  };
}
