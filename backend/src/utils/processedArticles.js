import { getDb } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";
import admin from "firebase-admin";

/**
 * Processed Article Deduplication Tracker — DisasterLens AI
 *
 * Maintains fast in-memory LRU tracking and persistent Firestore storage
 * to prevent duplicate GDELT news articles from triggering redundant pipeline runs
 * or creating duplicated incident entries.
 */
class ProcessedArticleStore {
  constructor(maxInMemory = 5000) {
    this.maxInMemory = maxInMemory;
    this.memorySet = new Set();
  }

  /**
   * Generate canonical identifier for an article (URL or ID)
   * @param {string|Object} articleOrUrl
   * @returns {string}
   */
  getArticleKey(articleOrUrl) {
    if (!articleOrUrl) return "";
    if (typeof articleOrUrl === "string") return articleOrUrl.trim().toLowerCase();
    const url = articleOrUrl.url || articleOrUrl.source_event_id || articleOrUrl.id || articleOrUrl.title || "";
    return String(url).trim().toLowerCase();
  }

  /**
   * Check whether an article has already been processed.
   * @param {string|Object} articleOrUrl
   * @returns {Promise<boolean>}
   */
  async isProcessed(articleOrUrl) {
    const key = this.getArticleKey(articleOrUrl);
    if (!key) return false;

    // Check fast memory cache first
    if (this.memorySet.has(key)) {
      return true;
    }

    // Check Firestore persistent collection if available
    try {
      const db = getDb();
      const doc = await db.collection(COLLECTIONS.PROCESSED_ARTICLES || "processed_articles").doc(encodeURIComponent(key).slice(0, 100)).get();
      if (doc.exists) {
        this._addToMemory(key);
        return true;
      }
    } catch {
      // If Firestore lookup fails (e.g. offline/in-memory store), rely on memorySet
    }

    return false;
  }

  /**
   * Mark an article as processed.
   * @param {string|Object} articleOrUrl
   * @param {Object} metadata
   * @returns {Promise<void>}
   */
  async markProcessed(articleOrUrl, metadata = {}) {
    const key = this.getArticleKey(articleOrUrl);
    if (!key) return;

    this._addToMemory(key);

    try {
      const db = getDb();
      const docId = encodeURIComponent(key).slice(0, 100);
      await db.collection(COLLECTIONS.PROCESSED_ARTICLES || "processed_articles").doc(docId).set({
        key,
        url: typeof articleOrUrl === "object" ? articleOrUrl.url || "" : articleOrUrl,
        title: typeof articleOrUrl === "object" ? articleOrUrl.title || "" : "",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata,
      });
    } catch {
      // In-memory fallback
    }
  }

  _addToMemory(key) {
    if (this.memorySet.size >= this.maxInMemory) {
      // Evict oldest elements when capacity is exceeded
      const first = this.memorySet.values().next().value;
      this.memorySet.delete(first);
    }
    this.memorySet.add(key);
  }

  clearMemory() {
    this.memorySet.clear();
  }
}

export const processedArticles = new ProcessedArticleStore();
export default processedArticles;
