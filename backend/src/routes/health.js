import { Router } from "express";
import { pipeline } from "../services/processingPipeline.js";

const router = Router();

/**
 * GET /api/health — Public health check endpoint
 */
router.get("/", async (req, res) => {
  const pipelineStats = pipeline.getStats();

  res.json({
    status: "ok",
    service: "DisasterLens AI Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    pipeline: {
      processed: pipelineStats.processed,
      errors: pipelineStats.errors,
      lastProcessedAt: pipelineStats.lastProcessedAt,
    },
    environment: process.env.NODE_ENV || "development",
  });
});

export default router;
