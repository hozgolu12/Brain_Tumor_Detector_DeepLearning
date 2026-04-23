import { pgTable, text, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const predictionsTable = pgTable("predictions", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  predictedClass: text("predicted_class").notNull(),
  confidence: real("confidence").notNull(),
  probabilities: jsonb("probabilities").notNull().$type<Array<{ label: string; probability: number }>>(),
  imageDataUrl: text("image_data_url").notNull(),
  modelVersion: text("model_version").notNull(),
  processingTimeMs: integer("processing_time_ms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PredictionRow = typeof predictionsTable.$inferSelect;
export type InsertPredictionRow = typeof predictionsTable.$inferInsert;
