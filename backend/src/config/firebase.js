import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

let db;
let authAdmin;
let initialized = false;

/**
 * Initialize Firebase Admin SDK.
 * Tries service account file first, then project ID fallback.
 */
export function initFirebase() {
  if (initialized) return { db, authAdmin };

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  try {
    if (serviceAccountPath) {
      const absPath = resolve(serviceAccountPath);
      if (existsSync(absPath)) {
        const serviceAccount = JSON.parse(readFileSync(absPath, "utf8"));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
        console.log("[Firebase Admin] Initialized with service account key.");
      } else {
        // File not found — fall through to project ID init
        initWithProjectId(projectId);
      }
    } else {
      initWithProjectId(projectId);
    }
  } catch (error) {
    console.warn("[Firebase Admin] Credential init failed, using project ID fallback:", error.message);
    initWithProjectId(projectId);
  }

  db = admin.firestore();
  authAdmin = admin.auth();
  initialized = true;

  console.log("[Firebase Admin] Firestore and Auth ready.");
  return { db, authAdmin };
}

function initWithProjectId(projectId) {
  if (!admin.apps.length) {
    try {
      // Try application default credentials first
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId || "codecrafters-a0f3f",
      });
      console.log("[Firebase Admin] Initialized with application default credentials.");
    } catch {
      // Final fallback — project ID only (limited functionality without real credentials)
      admin.initializeApp({ projectId: projectId || "codecrafters-a0f3f" });
      console.log("[Firebase Admin] Initialized with project ID only (limited mode).");
    }
  }
}

export function getDb() {
  if (!db) initFirebase();
  return db;
}

export function getAuth() {
  if (!authAdmin) initFirebase();
  return authAdmin;
}

export default admin;
