import { Router } from "express";
import { pipeline } from "../services/processingPipeline.js";
import { verifyFirebaseConnection, getCredentialMode, isFirebaseConfigured } from "../config/firebase.js";
import { getLLMStatus } from "../ai/llmService.js";
import { getRedditStatus } from "../ingestion/reddit/redditService.js";

const router = Router();

/**
 * GET /api/health — Public health check endpoint
 */
router.get("/", async (req, res) => {
  const pipelineStats = pipeline.getStats();
  const firebase = await verifyFirebaseConnection();
  const llm = getLLMStatus();
  const reddit = getRedditStatus();

  res.json({
    status: firebase.connected ? "ok" : "degraded",
    service: "DisasterLens AI Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    firebase: {
      configured: isFirebaseConfigured(),
      credentialMode: getCredentialMode(),
      connected: firebase.connected,
      firestore: firebase.firestore,
      auth: firebase.auth,
      error: firebase.error,
    },
    llm: {
      enabled: llm.enabled,
      configured: llm.configured,
      provider: llm.provider,
      model: llm.model,
    },
    reddit: {
      enabled: reddit.enabled,
      configured: reddit.configured,
      subreddits: reddit.subreddits,
    },
    pipeline: {
      processed: pipelineStats.processed,
      errors: pipelineStats.errors,
      lastProcessedAt: pipelineStats.lastProcessedAt,
    },
    environment: process.env.NODE_ENV || "development",
  });
});

export default router;
