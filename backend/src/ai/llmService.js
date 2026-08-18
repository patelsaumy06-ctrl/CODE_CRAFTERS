import { classifier } from "./classifier.js";

/**
 * LLM Service Abstraction — DisasterLens AI
 *
 * Provides a unified interface for AI-powered disaster event analysis.
 * Falls back to the deterministic classifier when no LLM is configured.
 *
 * Environment:
 *   LLM_ENABLED  — "true" to enable LLM provider (default: false)
 *   LLM_API_KEY  — Provider API key (backend-only, never expose to frontend)
 *   LLM_MODEL    — Model identifier (e.g. "google/gemini-2.0-flash-001", "gpt-4o")
 *   LLM_PROVIDER — Provider name: "openrouter" | "gemini" | "openai" (default: "openrouter")
 */

let _config = null;

function getConfig() {
  if (_config) return _config;
  _config = {
    enabled: process.env.LLM_ENABLED === "true",
    apiKey: process.env.LLM_API_KEY || "",
    model: process.env.LLM_MODEL || "google/gemini-2.0-flash-001",
    provider: process.env.LLM_PROVIDER || "openrouter",
  };
  return _config;
}

/**
 * Check whether LLM integration is active.
 */
export function isLLMEnabled() {
  const cfg = getConfig();
  return cfg.enabled && cfg.apiKey.length > 0;
}

/**
 * Return safe status info (never exposes the key).
 */
export function getLLMStatus() {
  const cfg = getConfig();
  return {
    enabled: cfg.enabled,
    configured: cfg.enabled && cfg.apiKey.length > 0,
    provider: cfg.provider,
    model: cfg.model,
    // never return apiKey
  };
}

/**
 * Analyze a disaster event using LLM (or deterministic fallback).
 *
 * @param {Object} input — normalized event
 *   { title, text, description, source, location, metadata }
 * @returns {Promise<LLMAnalysisResult>}
 */
export async function analyzeDisasterEvent(input) {
  if (isLLMEnabled()) {
    try {
      return await _callLLMProvider(input);
    } catch (error) {
      console.warn("[LLM Service] Provider call failed, falling back to deterministic classifier:", error.message);
      return _deterministicFallback(input);
    }
  }
  return _deterministicFallback(input);
}

// ─── Deterministic Fallback ────────────────────────────────────

function _deterministicFallback(input) {
  const classification = classifier.classify(input);

  return {
    disasterType: classification.disasterType,
    summary: _generateSummary(input, classification),
    urgency: classification.urgency,
    affectedArea: input.location?.address || null,
    extractedEntities: classification.matchedKeywords || [],
    indicators: classification.matchedKeywords || [],
    confidence: classification.confidence,
    reasoning: classification.classificationReason,
    source: "deterministic_classifier",
    raw: classification,
  };
}

function _generateSummary(input, classification) {
  const text = input.text || input.description || input.title || "";
  const snippet = text.length > 120 ? text.slice(0, 120) + "…" : text;
  return `${classification.disasterType.toUpperCase()} event detected (${classification.urgency} urgency): ${snippet}`;
}

// ─── LLM Provider Call (stub — ready for real provider integration) ──

async function _callLLMProvider(input) {
  const cfg = getConfig();

  const prompt = _buildPrompt(input);

  // ── Provider dispatch ──
  if (cfg.provider === "openrouter") {
    return _callOpenRouter(cfg, prompt, input);
  } else if (cfg.provider === "gemini") {
    return _callGemini(cfg, prompt, input);
  } else if (cfg.provider === "openai") {
    return _callOpenAI(cfg, prompt, input);
  }

  console.warn(`[LLM Service] Unknown provider "${cfg.provider}", using fallback.`);
  return _deterministicFallback(input);
}

function _buildPrompt(input) {
  const text = `${input.title || ""}\n${input.text || input.description || ""}`.trim();
  return `You are a disaster intelligence analyst. Analyze this report and return JSON only.

Report:
"""
${text}
"""

Location: ${input.location?.address || "Unknown"} (${input.location?.latitude || "?"}, ${input.location?.longitude || "?"})
Source: ${input.sourceType || input.source || "unknown"}

Return ONLY valid JSON:
{
  "disasterType": "flood|earthquake|cyclone|landslide|wildfire|drought|storm|tsunami|industrial|infrastructure|other",
  "summary": "one-line summary",
  "urgency": "critical|high|moderate|low",
  "affectedArea": "area description or null",
  "extractedEntities": ["entity1", "entity2"],
  "indicators": ["indicator1"],
  "confidence": 0.0-1.0,
  "reasoning": "brief reasoning"
}`;
}

// ── Gemini Provider ──

async function _callGemini(cfg, prompt, input) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return _parseLLMResponse(rawText, input);
}

// ── OpenRouter Provider (OpenAI-compatible, multi-model gateway) ──

async function _callOpenRouter(cfg, prompt, input) {
  const url = "https://openrouter.ai/api/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      "HTTP-Referer": "https://disasterlens.ai",
      "X-Title": "DisasterLens AI",
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} — ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || "";
  return _parseLLMResponse(rawText, input);
}

// ── OpenAI Provider ──

async function _callOpenAI(cfg, prompt, input) {
  const url = "https://api.openai.com/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || "";
  return _parseLLMResponse(rawText, input);
}

// ── Response Parser ──

function _parseLLMResponse(rawText, input) {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawText];
    const parsed = JSON.parse(jsonMatch[1].trim());

    return {
      disasterType: parsed.disasterType || "other",
      summary: parsed.summary || "",
      urgency: parsed.urgency || "low",
      affectedArea: parsed.affectedArea || null,
      extractedEntities: parsed.extractedEntities || [],
      indicators: parsed.indicators || [],
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
      reasoning: parsed.reasoning || "",
      source: "llm",
      raw: parsed,
    };
  } catch (parseError) {
    console.warn("[LLM Service] Failed to parse LLM response, using fallback:", parseError.message);
    return _deterministicFallback(input);
  }
}

export default {
  analyzeDisasterEvent,
  isLLMEnabled,
  getLLMStatus,
};
