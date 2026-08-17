import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

let db;
let authAdmin;
let initialized = false;
let credentialMode = "none";
let inMemoryDbInstance = null;

// ─── In-Memory Mock Database Fallback ───────────────────────────
function processData(newData, existingData = {}) {
  const result = { ...existingData };
  for (const [key, value] of Object.entries(newData)) {
    if (value && typeof value === "object") {
      if (value._methodName === "serverTimestamp" || value.constructor?.name === "FieldValue" || value.isServerTimestamp) {
        result[key] = new Date();
        continue;
      }
      if (value._methodName === "increment") {
        result[key] = (Number(result[key]) || 0) + (Number(value.operand) || 1);
        continue;
      }
    }
    result[key] = value;
  }
  return result;
}

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
}

class InMemoryStore {
  constructor() {
    this.collections = new Map();
  }

  _getColl(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return this.collections.get(name);
  }

  collection(name) {
    return new Query(this, name);
  }
}

class Query {
  constructor(store, collName, filters = [], sort = null, lim = null, off = 0) {
    this.store = store;
    this.collName = collName;
    this.filters = filters;
    this.sort = sort;
    this.lim = lim;
    this.off = off;
  }

  where(field, op, val) {
    return new Query(this.store, this.collName, [...this.filters, { field, op, val }], this.sort, this.lim, this.off);
  }

  orderBy(field, dir = "asc") {
    return new Query(this.store, this.collName, this.filters, { field, dir }, this.lim, this.off);
  }

  limit(n) {
    return new Query(this.store, this.collName, this.filters, this.sort, n, this.off);
  }

  offset(n) {
    return new Query(this.store, this.collName, this.filters, this.sort, this.lim, n);
  }

  async add(data) {
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const processed = processData(data, {});
    this.store._getColl(this.collName).set(id, processed);
    return { id };
  }

  doc(id) {
    const store = this.store;
    const collName = this.collName;
    return {
      id,
      async get() {
        const item = store._getColl(collName).get(id);
        return {
          id,
          exists: Boolean(item),
          data: () => (item ? { ...item } : undefined),
        };
      },
      async set(data, opts = {}) {
        const existing = opts.merge ? store._getColl(collName).get(id) || {} : {};
        const processed = processData(data, existing);
        store._getColl(collName).set(id, processed);
      },
      async update(data) {
        const existing = store._getColl(collName).get(id) || {};
        const processed = processData(data, existing);
        store._getColl(collName).set(id, processed);
      },
      async delete() {
        store._getColl(collName).delete(id);
      },
    };
  }

  async get() {
    const map = this.store._getColl(this.collName);
    let items = Array.from(map.entries()).map(([id, data]) => ({ id, data: { ...data } }));

    for (const { field, op, val } of this.filters) {
      items = items.filter(({ data }) => {
        const fieldVal = getNestedValue(data, field);
        if (op === "==") return fieldVal === val;
        if (op === "!=") return fieldVal !== val;
        if (op === ">") return fieldVal > val;
        if (op === ">=") return fieldVal >= val;
        if (op === "<") return fieldVal < val;
        if (op === "<=") return fieldVal <= val;
        if (op === "in") return Array.isArray(val) && val.includes(fieldVal);
        if (op === "array-contains") return Array.isArray(fieldVal) && fieldVal.includes(val);
        return true;
      });
    }

    if (this.sort) {
      const { field, dir } = this.sort;
      items.sort((a, b) => {
        const valA = getNestedValue(a.data, field);
        const valB = getNestedValue(b.data, field);
        if (valA === undefined && valB === undefined) return 0;
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        const comp = valA > valB ? 1 : valA < valB ? -1 : 0;
        return dir === "desc" ? -comp : comp;
      });
    }

    if (this.off > 0) items = items.slice(this.off);
    if (this.lim !== null) items = items.slice(0, this.lim);

    const docs = items.map(({ id, data }) => ({
      id,
      exists: true,
      data: () => data,
    }));

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
    };
  }
}

function getInMemoryDb() {
  if (!inMemoryDbInstance) {
    inMemoryDbInstance = new InMemoryStore();
  }
  return inMemoryDbInstance;
}

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
        "[Firebase Admin] Initialized with project ID only — Using in-memory fallback store for local development."
      );
    }

    if (!admin.apps.length) {
      credentialMode = "none";
      console.error("[Firebase Admin] No credentials configured. Using in-memory fallback store.");
    }
  } catch (error) {
    credentialMode = "error";
    console.error("[Firebase Admin] Credential init failed:", error.message);
  }

  if (credentialMode === "service_account_file" || credentialMode === "inline_credentials") {
    db = admin.firestore();
    authAdmin = admin.auth();
    console.log("[Firebase Admin] Cloud Firestore and Auth clients active.");
  } else {
    db = getInMemoryDb();
    authAdmin = null;
    console.log("[Firebase Admin] In-Memory Fallback Store active for local development.");
  }

  initialized = true;
  return { db, authAdmin, credentialMode };
}

/**
 * Verify Firestore connectivity with a lightweight read.
 */
export async function verifyFirebaseConnection() {
  const mode = getCredentialMode();
  if (mode === "service_account_file" || mode === "inline_credentials") {
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

  // In-memory mode active
  return {
    connected: true,
    mode: "in_memory_fallback",
    firestore: true,
    auth: false,
    error: null,
    note: "Running with In-Memory Store fallback. Set FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env for Cloud Firestore.",
  };
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
  if (!initialized) initFirebase();
  return db || getInMemoryDb();
}

export function getAuth() {
  if (!initialized) initFirebase();
  if (!authAdmin) {
    if (process.env.NODE_ENV !== "production") {
      return null;
    }
    throw new Error(
      "Firebase Admin Auth not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY in backend/.env"
    );
  }
  return authAdmin;
}

export default admin;

