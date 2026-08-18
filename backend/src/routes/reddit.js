import { Router } from "express";
import { pipeline } from "../services/processingPipeline.js";
import { normalizeRedditPost, validateRedditPayload } from "../ingestion/reddit/redditNormalizer.js";
import { getRedditStatus, isRedditEnabled } from "../ingestion/reddit/redditService.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/ingest/reddit — Ingest a single Reddit post into the pipeline
 *
 * Accepts raw Reddit post data, normalizes it, and feeds it through
 * the existing Golden Pipeline (Classify → Confidence → Severity → Cluster → Alert).
 */
router.post("/", optionalAuth, async (req, res) => {
  try {
    const body = req.body;

    // Validate payload
    const validation = validateRedditPayload(body);
    if (!validation.valid) {
      return res.status(400).json({
        error: "INVALID_REDDIT_PAYLOAD",
        message: validation.errors.join(" "),
        errors: validation.errors,
      });
    }

    // Normalize Reddit post into canonical event format
    const normalized = normalizeRedditPost(body);

    // Process through the existing Golden Pipeline using "reddit" source type
    const result = await pipeline.process("reddit", {
      ...body,
      // Ensure pipeline normalizer has what it needs
      title: normalized.title,
      description: normalized.text,
      text: normalized.text,
      latitude: normalized.location.latitude,
      longitude: normalized.location.longitude,
      timestamp: normalized.timestamp.toISOString(),
      source: "Reddit",
      sourceId: normalized.sourceId,
      // Pass reddit-specific metadata through
      _redditMeta: normalized.metadata,
    });

    if (!result.success) {
      return res.status(500).json({ error: "PROCESSING_FAILED", message: result.error });
    }

    res.status(201).json({
      message: "Reddit post processed successfully.",
      data: {
        incidentId: result.incidentId,
        isNew: result.isNew,
        classification: result.classification,
        severity: result.severity.severity,
        confidence: result.confidence.confidence,
        alert: result.alert?.shouldAlert ? result.alert.reason : null,
        processingTimeMs: result.processingTimeMs,
        reddit: {
          subreddit: normalized.metadata.subreddit,
          postId: normalized.metadata.postId,
          author: normalized.metadata.author,
        },
      },
    });
  } catch (error) {
    console.error("[Ingest Reddit] Error:", error.message);
    res.status(500).json({ error: "INGESTION_FAILED", message: error.message });
  }
});

/**
 * POST /api/ingest/reddit/batch — Ingest multiple Reddit posts
 */
router.post("/batch", optionalAuth, async (req, res) => {
  try {
    const posts = req.body.posts || req.body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({
        error: "INVALID_REQUEST",
        message: "Expected an array of Reddit posts in 'posts' field or as request body.",
      });
    }

    const maxBatch = 50;
    const batch = posts.slice(0, maxBatch);
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const post of batch) {
      try {
        const validation = validateRedditPayload(post);
        if (!validation.valid) {
          results.push({ postId: post.id || "unknown", success: false, error: validation.errors.join(" ") });
          errorCount++;
          continue;
        }

        const normalized = normalizeRedditPost(post);
        const result = await pipeline.process("reddit", {
          ...post,
          title: normalized.title,
          description: normalized.text,
          text: normalized.text,
          latitude: normalized.location.latitude,
          longitude: normalized.location.longitude,
          timestamp: normalized.timestamp.toISOString(),
          source: "Reddit",
          sourceId: normalized.sourceId,
          _redditMeta: normalized.metadata,
        });

        results.push({
          postId: post.id || normalized.sourceId,
          success: result.success,
          incidentId: result.incidentId,
          isNew: result.isNew,
          disasterType: result.classification?.disasterType,
        });

        if (result.success) successCount++;
        else errorCount++;
      } catch (err) {
        results.push({ postId: post.id || "unknown", success: false, error: err.message });
        errorCount++;
      }
    }

    res.status(201).json({
      message: `Batch processed: ${successCount} succeeded, ${errorCount} failed.`,
      data: { total: batch.length, success: successCount, errors: errorCount, results },
    });
  } catch (error) {
    console.error("[Ingest Reddit Batch] Error:", error.message);
    res.status(500).json({ error: "BATCH_INGESTION_FAILED", message: error.message });
  }
});

/**
 * GET /api/ingest/reddit/status — Reddit integration status
 */
router.get("/status", (req, res) => {
  const status = getRedditStatus();
  res.json({
    reddit: status,
    message: status.configured
      ? "Reddit integration is active."
      : "Reddit integration is disabled. Set REDDIT_ENABLED=true and provide credentials in backend/.env",
  });
});

export default router;
