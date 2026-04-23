import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { desc, sql } from "drizzle-orm";
import { db, predictionsTable } from "@workspace/db";
import {
  PredictTumorBody,
  PredictTumorResponse,
  ListPredictionsResponse,
  GetPredictionStatsResponse,
  GetModelInfoResponse,
} from "@workspace/api-zod";
import { runInference, getModelInfo, CLASSES } from "../lib/model";

const router: IRouter = Router();

router.post("/predict", async (req, res) => {
  const parsed = PredictTumorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const { imageBase64, filename } = parsed.data;

  const result = await runInference(imageBase64, filename);
  const id = randomUUID();
  const mime =
    filename.toLowerCase().endsWith(".png")
      ? "image/png"
      : filename.toLowerCase().endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
  const imageDataUrl = `data:${mime};base64,${imageBase64}`;
  const createdAt = new Date();

  await db.insert(predictionsTable).values({
    id,
    filename,
    predictedClass: result.predictedClass,
    confidence: result.confidence,
    probabilities: result.probabilities,
    imageDataUrl,
    modelVersion: result.modelVersion,
    processingTimeMs: result.processingTimeMs,
    createdAt,
  });

  const payload = PredictTumorResponse.parse({
    id,
    filename,
    predictedClass: result.predictedClass,
    confidence: result.confidence,
    probabilities: result.probabilities,
    imageDataUrl,
    createdAt: createdAt.toISOString(),
    modelVersion: result.modelVersion,
    processingTimeMs: result.processingTimeMs,
  });
  res.json(payload);
});

router.get("/predictions", async (_req, res) => {
  const rows = await db
    .select()
    .from(predictionsTable)
    .orderBy(desc(predictionsTable.createdAt))
    .limit(200);
  const payload = ListPredictionsResponse.parse(
    rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      predictedClass: r.predictedClass,
      confidence: r.confidence,
      probabilities: r.probabilities,
      imageDataUrl: r.imageDataUrl,
      createdAt: r.createdAt.toISOString(),
      modelVersion: r.modelVersion,
      processingTimeMs: r.processingTimeMs,
    })),
  );
  res.json(payload);
});

router.get("/predictions/stats", async (_req, res) => {
  const rows = await db
    .select({
      predictedClass: predictionsTable.predictedClass,
      confidence: predictionsTable.confidence,
      createdAt: predictionsTable.createdAt,
    })
    .from(predictionsTable);

  const total = rows.length;
  const averageConfidence =
    total === 0 ? 0 : rows.reduce((s, r) => s + r.confidence, 0) / total;
  const counts = new Map<string, number>(CLASSES.map((c) => [c, 0]));
  for (const r of rows) {
    counts.set(r.predictedClass, (counts.get(r.predictedClass) ?? 0) + 1);
  }
  const noTumor = counts.get("no_tumor") ?? 0;
  const tumorDetected = total - noTumor;
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const last24h = rows.filter((r) => r.createdAt.getTime() >= since).length;
  void sql; // avoid unused import warning

  const payload = GetPredictionStatsResponse.parse({
    total,
    averageConfidence: Number(averageConfidence.toFixed(4)),
    tumorDetected,
    noTumor,
    byClass: Array.from(counts.entries()).map(([label, count]) => ({ label, count })),
    last24h,
  });
  res.json(payload);
});

router.get("/model/info", (_req, res) => {
  const payload = GetModelInfoResponse.parse(getModelInfo());
  res.json(payload);
});

export default router;
