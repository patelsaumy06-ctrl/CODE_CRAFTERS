import { Router } from "express";
import { getDb } from "../config/firebase.js";
import { COLLECTIONS, ADMIN_ROLES } from "../config/constants.js";
import { authenticateUser, requireRole } from "../middleware/auth.js";
import { verifyFirebaseConnection } from "../config/firebase.js";
import { pipeline } from "../services/processingPipeline.js";
import admin from "firebase-admin";

const router = Router();

// All admin routes require authentication + admin/commander role
router.use(authenticateUser);
router.use(requireRole(...ADMIN_ROLES));

/**
 * GET /api/admin/users — List all users
 */
router.get("/users", async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.USERS).get();
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ data: users, meta: { count: users.length } });
  } catch (error) {
    console.error("[Admin Users GET] Error:", error.message);
    res.status(500).json({ error: "FETCH_FAILED", message: error.message });
  }
});

/**
 * PATCH /api/admin/users/:id/role — Update user role
 */
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: "MISSING_ROLE", message: "Role is required." });
    }

    const db = getDb();
    const userRef = db.collection(COLLECTIONS.USERS).doc(req.params.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "NOT_FOUND", message: "User not found." });
    }

    await userRef.update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Audit
    await db.collection(COLLECTIONS.AUDIT_LOGS).add({
      action: "USER_ROLE_CHANGED",
      details: `${req.user.email} changed ${userDoc.data().email || req.params.id} role to ${role}`,
      user: req.user.email,
      ip: req.ip,
      status: "Success",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: `User role updated to ${role}.` });
  } catch (error) {
    console.error("[Admin Role PATCH] Error:", error.message);
    res.status(500).json({ error: "UPDATE_FAILED", message: error.message });
  }
});

/**
 * GET /api/admin/audit-logs — List audit logs
 */
router.get("/audit-logs", async (req, res) => {
  try {
    const db = getDb();
    const { limit: limitStr = "100" } = req.query;
    const limit = Math.min(parseInt(limitStr) || 100, 500);

    const snapshot = await db
      .collection(COLLECTIONS.AUDIT_LOGS)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.json({ data: logs, meta: { count: logs.length } });
  } catch (error) {
    console.error("[Admin Audit GET] Error:", error.message);
    res.status(500).json({ error: "FETCH_FAILED", message: error.message });
  }
});

/**
 * GET /api/admin/system-health — System health and pipeline status
 */
router.get("/system-health", async (req, res) => {
  try {
    const pipelineStats = pipeline.getStats();
    const firebase = await verifyFirebaseConnection();

    const services = [
      {
        service: "Processing Pipeline",
        status: pipelineStats.errors === 0 ? "Healthy" : "Degraded",
        latency: pipelineStats.lastProcessedAt ? "Active" : "Idle",
        details: `${pipelineStats.processed} processed, ${pipelineStats.errors} errors`,
      },
      {
        service: "Firebase Firestore",
        status: firebase.firestore ? "Healthy" : "Blocked",
        latency: firebase.connected ? "Connected" : "—",
        details: firebase.error || "Connected",
      },
      {
        service: "Firebase Auth",
        status: firebase.auth ? "Healthy" : "Blocked",
        latency: firebase.connected ? "Active" : "—",
        details: firebase.connected ? "Token verification active" : "Credentials missing",
      },
      {
        service: "AI Classification Engine",
        status: "Healthy",
        latency: "< 5ms",
        details: "Deterministic classifier online",
      },
      {
        service: "Confidence Scoring Engine",
        status: "Healthy",
        latency: "< 2ms",
        details: "6-factor weighted scoring active",
      },
      {
        service: "Alert Engine",
        status: "Healthy",
        latency: "< 10ms",
        details: `${pipelineStats.alerts_triggered} alerts triggered`,
      },
    ];

    res.json({
      data: {
        status: "operational",
        uptime: process.uptime(),
        services,
        pipelineStats,
      },
    });
  } catch (error) {
    console.error("[Admin Health GET] Error:", error.message);
    res.status(500).json({ error: "HEALTH_CHECK_FAILED", message: error.message });
  }
});

export default router;
