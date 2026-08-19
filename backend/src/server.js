import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { initFirebase } from "./config/firebase.js";

// ─── Route Imports ──────────────────────────────────────────────
import healthRoutes from "./routes/health.js";
import incidentRoutes from "./routes/incidents.js";
import ingestRoutes from "./routes/ingest.js";
import redditRoutes from "./routes/reddit.js";
import alertRoutes from "./routes/alerts.js";
import intelligenceRoutes from "./routes/intelligence.js";
import searchRoutes from "./routes/search.js";
import analyticsRoutes from "./routes/analytics.js";
import adminRoutes from "./routes/admin.js";
import riskRoutes from "./routes/risk.js";
import disastersRoutes from "./routes/disasters.js";
import aiRoutes from "./routes/ai.js";
import { ingestionWorker } from "./workers/ingestionWorker.js";

// ─── Initialize Firebase Admin SDK ─────────────────────────────
initFirebase();

// ─── Create Express App ─────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT) || 4000;

// ─── Security Middleware ────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ─── CORS ───────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, true); // Allow all in dev; tighten for production
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-User-Role", "X-User-Email", "X-Role", "X-Email"],
}));

// ─── Rate Limiting ──────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: "RATE_LIMITED", message: "Too many requests. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const ingestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { error: "RATE_LIMITED", message: "Ingestion rate limit exceeded." },
});

// ─── Body Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Request Logging ────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`;
    if (res.statusCode >= 400) {
      console.warn(log);
    } else {
      console.log(log);
    }
  });
  next();
});

// ─── Mount Routes ───────────────────────────────────────────────
app.use("/api/health", healthRoutes);
app.use("/api/incidents", apiLimiter, incidentRoutes);
app.use("/api/ingest", ingestLimiter, ingestRoutes);
app.use("/api/ingest/reddit", ingestLimiter, redditRoutes);
app.use("/api/alerts", apiLimiter, alertRoutes);
app.use("/api/intelligence", apiLimiter, intelligenceRoutes);
app.use("/api/search", apiLimiter, searchRoutes);
app.use("/api/analytics", apiLimiter, analyticsRoutes);
app.use("/api/admin", apiLimiter, adminRoutes);
app.use("/api/risk", apiLimiter, riskRoutes);
app.use("/api/disasters", apiLimiter, disastersRoutes);
app.use("/api/ai", apiLimiter, aiRoutes);

// ─── API Documentation Route ────────────────────────────────────
app.get("/api", (req, res) => {
  res.json({
    service: "DisasterLens AI — Backend API",
    version: "1.0.0",
    problemStatement: "SIH PS-SW-005 — Multi-Source Disaster Intelligence and Response Support System",
    endpoints: {
      health: "GET /api/health",
      incidents: {
        list: "GET /api/incidents?disasterType=&severity=&status=&limit=&offset=",
        detail: "GET /api/incidents/:id",
        create: "POST /api/incidents (auth required)",
        update: "PATCH /api/incidents/:id (auth required)",
        delete: "DELETE /api/incidents/:id (admin only)",
      },
      ingestion: {
        citizen: "POST /api/ingest/citizen",
        news: "POST /api/ingest/news",
        sensor: "POST /api/ingest/sensor",
        social: "POST /api/ingest/social",
        reddit: "POST /api/ingest/reddit",
        redditBatch: "POST /api/ingest/reddit/batch",
        redditStatus: "GET /api/ingest/reddit/status",
        stats: "GET /api/ingest/stats",
      },
      alerts: {
        list: "GET /api/alerts?severity=&status=",
        create: "POST /api/alerts (auth required)",
        update: "PATCH /api/alerts/:id (auth required)",
      },
      intelligence: {
        feed: "GET /api/intelligence/feed?urgency=&source=&limit=",
      },
      search: {
        query: "GET /api/search?q=&disasterType=&severity=&minConfidence=&dateFrom=&dateTo=",
      },
      analytics: {
        overview: "GET /api/analytics/overview",
        trends: "GET /api/analytics/trends",
        categories: "GET /api/analytics/categories",
        severity: "GET /api/analytics/severity",
        sources: "GET /api/analytics/sources",
      },
      admin: {
        users: "GET /api/admin/users (admin only)",
        changeRole: "PATCH /api/admin/users/:id/role (admin only)",
        auditLogs: "GET /api/admin/audit-logs (admin only)",
        systemHealth: "GET /api/admin/system-health (admin only)",
      },
    },
  });
});

// ─── 404 Handler ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found. Visit GET /api for documentation.`,
  });
});

// ─── Error Handler ──────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[Server Error]", err.stack || err.message);
  res.status(err.status || 500).json({
    error: "INTERNAL_ERROR",
    message: process.env.NODE_ENV === "production" ? "Internal server error." : err.message,
  });
});

// ─── Start Server ───────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           DisasterLens AI — Backend Server                  ║
║           SIH PS-SW-005 Multi-Source Intelligence           ║
╠══════════════════════════════════════════════════════════════╣
║  Server:     http://localhost:${PORT}                          ║
║  API Docs:   http://localhost:${PORT}/api                      ║
║  Health:     http://localhost:${PORT}/api/health                ║
║  Environment: ${(process.env.NODE_ENV || "development").padEnd(44)}║
╚══════════════════════════════════════════════════════════════╝
  `);

  // Start background ingestion worker asynchronously without blocking startup
  ingestionWorker.start({ initialRun: process.env.NODE_ENV !== "test" });
});

// ─── Graceful Shutdown ─────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
  ingestionWorker.stop();
  server.close(() => {
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });

  // Force close if graceful shutdown exceeds 10 seconds
  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
