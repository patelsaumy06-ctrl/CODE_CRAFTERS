/**
 * Reddit Ingestion Service — DisasterLens AI
 *
 * Handles Reddit API authentication, subreddit monitoring config,
 * and batch ingestion of Reddit posts into the processing pipeline.
 *
 * Environment:
 *   REDDIT_ENABLED       — "true" to enable (default: false)
 *   REDDIT_CLIENT_ID     — Reddit API OAuth client ID
 *   REDDIT_CLIENT_SECRET — Reddit API OAuth client secret
 *   REDDIT_USER_AGENT    — User-Agent for Reddit API requests
 *   REDDIT_SUBREDDITS    — Comma-separated subreddits to monitor (default: "disaster,naturaldisasters,weather")
 */

let _config = null;
let _accessToken = null;
let _tokenExpiry = 0;

function getConfig() {
  if (_config) return _config;
  _config = {
    enabled: process.env.REDDIT_ENABLED === "true",
    clientId: process.env.REDDIT_CLIENT_ID || "",
    clientSecret: process.env.REDDIT_CLIENT_SECRET || "",
    userAgent: process.env.REDDIT_USER_AGENT || "DisasterLensAI/1.0 (SIH PS-SW-005)",
    subreddits: (process.env.REDDIT_SUBREDDITS || "disaster,naturaldisasters,weather,floods,earthquakes")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
  return _config;
}

/**
 * Check whether Reddit integration is enabled and configured.
 */
export function isRedditEnabled() {
  const cfg = getConfig();
  return cfg.enabled && cfg.clientId.length > 0 && cfg.clientSecret.length > 0;
}

/**
 * Return safe status info (never exposes secrets).
 */
export function getRedditStatus() {
  const cfg = getConfig();
  return {
    enabled: cfg.enabled,
    configured: isRedditEnabled(),
    subreddits: cfg.subreddits,
    hasCredentials: cfg.clientId.length > 0 && cfg.clientSecret.length > 0,
    // never return clientId, clientSecret
  };
}

/**
 * Authenticate with Reddit API using OAuth2 client credentials.
 * Returns an access token (cached until expiry).
 */
export async function authenticate() {
  if (!isRedditEnabled()) {
    throw new Error("Reddit integration is not configured. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.");
  }

  // Return cached token if still valid
  if (_accessToken && Date.now() < _tokenExpiry) {
    return _accessToken;
  }

  const cfg = getConfig();
  const authString = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": cfg.userAgent,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Reddit OAuth failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  _accessToken = data.access_token;
  // Expire 60 seconds early for safety
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  console.log("[Reddit Service] Authenticated successfully.");
  return _accessToken;
}

/**
 * Fetch recent posts from a subreddit.
 *
 * @param {string} subreddit — subreddit name (without r/)
 * @param {Object} opts — { sort: "new"|"hot", limit: 25, after: null }
 * @returns {Promise<Object[]>} — array of raw Reddit post objects
 */
export async function fetchSubredditPosts(subreddit, { sort = "new", limit = 25, after = null } = {}) {
  const token = await authenticate();
  const cfg = getConfig();

  const params = new URLSearchParams({ limit: String(limit) });
  if (after) params.set("after", after);

  const url = `https://oauth.reddit.com/r/${subreddit}/${sort}?${params}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": cfg.userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const posts = (data.data?.children || []).map((child) => child.data);

  return posts;
}

/**
 * Fetch posts from all configured subreddits.
 *
 * @param {Object} opts — { sort, limit }
 * @returns {Promise<Object[]>}
 */
export async function fetchAllConfiguredSubreddits(opts = {}) {
  const cfg = getConfig();
  const allPosts = [];

  for (const sub of cfg.subreddits) {
    try {
      const posts = await fetchSubredditPosts(sub, opts);
      allPosts.push(...posts.map((p) => ({ ...p, subreddit: sub })));
    } catch (error) {
      console.warn(`[Reddit Service] Failed to fetch r/${sub}:`, error.message);
    }
  }

  return allPosts;
}

/**
 * Search Reddit for disaster-related posts.
 *
 * @param {string} query — search query
 * @param {Object} opts — { subreddit, sort, limit }
 * @returns {Promise<Object[]>}
 */
export async function searchReddit(query, { subreddit, sort = "relevance", limit = 25 } = {}) {
  const token = await authenticate();
  const cfg = getConfig();

  const params = new URLSearchParams({
    q: query,
    sort,
    limit: String(limit),
    restrict_sr: subreddit ? "true" : "false",
    type: "link",
  });

  const base = subreddit
    ? `https://oauth.reddit.com/r/${subreddit}/search`
    : "https://oauth.reddit.com/search";

  const response = await fetch(`${base}?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": cfg.userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return (data.data?.children || []).map((child) => child.data);
}

export default {
  isRedditEnabled,
  getRedditStatus,
  authenticate,
  fetchSubredditPosts,
  fetchAllConfiguredSubreddits,
  searchReddit,
};
