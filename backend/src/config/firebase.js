import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

let db;
let authAdmin;
let initialized = false;
let credentialMode = "none";

/**
 * Initialize Firebase Admin SDK.
 * Requires a service account key file OR inline credentials.
 */
export function initFirebase() {
  if (initialized) return { db, authAdmin, credentialMode };

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  try {
    if (serviceAccountPath) {
      const absPath = resolve(serviceAccountPath);
      if (existsSync(absPath)) {
        const serviceAccount = JSON.parse(readFileSync(absPath, "utf8"));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
        credentialMode = "service_account_file";
        console.log("[Firebase Admin] Initialized with service account key file.");
      } else {
        console.warn(`[Firebase Admin] Service account file not found: ${absPath}`);
      }
    }

    if (!admin.apps.length && clientEmail && privateKey && projectId) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      credentialMode = "inline_credentials";
      console.log("[Firebase Admin] Initialized with inline credentials.");
    }

    if (!admin.apps.length && projectId) {
      admin.initializeApp({ projectId });
      credentialMode = "project_id_only";
      console.warn(
        "[Firebase Admin] Initialized with project ID only — Firestore/Auth will fail without service account credentials."
      );
    }

    if (!admin.apps.length) {
      credentialMode = "none";
      console.error("[Firebase Admin] No credentials configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or inline credentials.");
      return { db: null, authAdmin: null, credentialMode };
    }
  } catch (error) {
    credentialMode = "error";
    console.error("[Firebase Admin] Credential init failed:", error.message);
    return { db: null, authAdmin: null, credentialMode };
  }

  db = admin.firestore();
  authAdmin = admin.auth();
  initialized = true;

  console.log("[Firebase Admin] Firestore and Auth clients created.");
  return { db, authAdmin, credentialMode };
}

/**
 * Verify Firestore connectivity with a lightweight read.
 */
export async function verifyFirebaseConnection() {
  const mode = getCredentialMode();
  if (mode === "none" || mode === "error" || mode === "project_id_only") {
    return {
      connected: false,
      mode,
      firestore: false,
      auth: false,
      error: "Missing valid Firebase Admin service account credentials",
    };
  }

  try {
    const database = getDb();
    await database.collection("_health_check").limit(1).get();
    return { connected: true, mode, firestore: true, auth: true, error: null };
  } catch (error) {
    return {
      connected: false,
      mode,
      firestore: false,
      auth: false,
      error: error.message,
    };
  }
}

export function getCredentialMode() {
  if (!initialized) initFirebase();
  return credentialMode;
}

export function isFirebaseConfigured() {
  const mode = getCredentialMode();
  return mode === "service_account_file" || mode === "inline_credentials";
}

export function getDb() {
  if (!db) initFirebase();
  if (!db) {
    throw new Error(
      "Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY in backend/.env"
    );
  }
  return db;
}

export function getAuth() {
  if (!authAdmin) initFirebase();
  if (!authAdmin) {
    throw new Error(
      "Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY in backend/.env"
    );
  }
  return authAdmin;
}

export default admin;
