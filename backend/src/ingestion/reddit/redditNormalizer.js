import { v4 as uuidv4 } from "uuid";

/**
 * Reddit Event Normalizer — DisasterLens AI
 *
 * Transforms raw Reddit post/comment data into the canonical
 * NormalizedEvent schema expected by the processing pipeline.
 */

/**
 * Normalize a raw Reddit post into the standard pipeline event format.
 *
 * @param {Object} raw — Reddit post data
 * @returns {NormalizedEvent}
 */
export function normalizeRedditPost(raw) {
  const title = raw.title || "";
  const body = raw.selftext || raw.body || raw.content || raw.text || "";
  const fullText = `${title} ${body}`.trim();

  // Extract coordinates if provided
  const lat = Number(raw.latitude ?? raw.location?.latitude ?? raw.location?.lat) || null;
  const lng = Number(raw.longitude ?? raw.location?.longitude ?? raw.location?.lng) || null;

  // Validate coordinates
  const hasValidCoords = lat !== null && lng !== null &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180;

  return {
    eventId: uuidv4(),
    sourceType: "reddit",
    sourceId: raw.id || raw.name || `reddit_${Date.now()}`,
    title: title || fullText.slice(0, 80) || "Reddit Report",
    text: body || title,
    description: fullText,
    location: {
      latitude: hasValidCoords ? lat : 0,
      longitude: hasValidCoords ? lng : 0,
      address: raw.location?.address || raw.locationText || "",
    },
    media: _extractMedia(raw),
    timestamp: _parseTimestamp(raw),
    metadata: {
      platform: "reddit",
      subreddit: raw.subreddit || raw.subreddit_name_prefixed || "",
      author: raw.author || "[deleted]",
      permalink: raw.permalink
        ? (raw.permalink.startsWith("http") ? raw.permalink : `https://www.reddit.com${raw.permalink}`)
        : "",
      score: Number(raw.score) || 0,
      numComments: Number(raw.num_comments || raw.numComments) || 0,
      upvoteRatio: Number(raw.upvote_ratio || raw.upvoteRatio) || 0,
      flair: raw.link_flair_text || raw.flair || "",
      isNSFW: Boolean(raw.over_18 || raw.nsfw),
      domain: raw.domain || "",
      postId: raw.id || "",
    },
    raw,
  };
}

/**
 * Validate that a raw Reddit payload has minimum required fields.
 *
 * @param {Object} raw
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRedditPayload(raw) {
  const errors = [];

  if (!raw || typeof raw !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object."] };
  }

  const title = raw.title || "";
  const body = raw.selftext || raw.body || raw.content || raw.text || "";

  if (!title && !body) {
    errors.push("At least one of 'title', 'selftext', 'body', 'content', or 'text' must be non-empty.");
  }

  if (raw.subreddit && typeof raw.subreddit !== "string") {
    errors.push("'subreddit' must be a string.");
  }

  // Coordinates are optional for Reddit — don't require them
  if (raw.latitude !== undefined) {
    const lat = Number(raw.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push("'latitude' must be a number between -90 and 90.");
    }
  }

  if (raw.longitude !== undefined) {
    const lng = Number(raw.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push("'longitude' must be a number between -180 and 180.");
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Helpers ──────────────────────────────────────────────────

function _extractMedia(raw) {
  const media = [];
  if (raw.url && /\.(jpg|jpeg|png|gif|webp|mp4)$/i.test(raw.url)) {
    media.push(raw.url);
  }
  if (raw.thumbnail && raw.thumbnail !== "self" && raw.thumbnail !== "default" && raw.thumbnail !== "nsfw") {
    media.push(raw.thumbnail);
  }
  if (raw.preview?.images?.[0]?.source?.url) {
    media.push(raw.preview.images[0].source.url.replace(/&amp;/g, "&"));
  }
  if (Array.isArray(raw.media)) {
    media.push(...raw.media);
  }
  return media;
}

function _parseTimestamp(raw) {
  if (raw.created_utc) {
    // Reddit timestamps are Unix seconds
    const ts = Number(raw.created_utc);
    return new Date(ts > 1e12 ? ts : ts * 1000);
  }
  if (raw.createdAt) {
    return new Date(raw.createdAt);
  }
  if (raw.timestamp) {
    return new Date(raw.timestamp);
  }
  return new Date();
}
