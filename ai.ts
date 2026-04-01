import { logger } from "./logger.js";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini";
const FALLBACK_MODEL = "anthropic/claude-3-haiku";

// Collect all available API keys for rotation
function getApiKeys(): string[] {
  const keys = [
    process.env["OPENROUTER_API_KEY"],
    process.env["OPENROUTER_API_KEY_2"],
    process.env["OPENROUTER_API_KEY_3"],
    process.env["OPENROUTER_API_KEY_4"],
    process.env["OPENROUTER_API_KEY_5"],
    process.env["OPENROUTER_API_KEY_6"],
  ].filter((k): k is string => typeof k === "string" && k.length > 0);

  if (keys.length === 0) throw new Error("No OPENROUTER_API_KEY set");
  return keys;
}

// Round-robin key index
let keyIndex = 0;

function nextKey(): string {
  const keys = getApiKeys();
  const key = keys[keyIndex % keys.length]!;
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

interface AiArticleContent {
  title: string;
  summaryPoints: string[];
  fullArticle: string;
  timeline: Array<{ step: number; title: string; description: string }>;
  vocabulary: Array<{ word: string; meaning: string }>;
}

async function callOpenRouter(messages: Array<{ role: string; content: string }>, model: string): Promise<string> {
  const keys = getApiKeys();
  let lastError: Error | null = null;

  // Try each key in round-robin order, starting from the current index
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = nextKey();
    try {
      return await callOpenRouterWithKey(messages, model, key);
    } catch (err) {
      lastError = err as Error;
      logger.warn({ err, attempt: attempt + 1, totalKeys: keys.length }, "Key failed, trying next key");
    }
  }

  throw lastError ?? new Error("All API keys failed");
}

async function callOpenRouterWithKey(messages: Array<{ role: string; content: string }>, model: string, apiKey: string): Promise<string> {
  const resp = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://pulsegurgaon.app",
      "X-Title": "PulseGurgaon",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenRouter API error ${resp.status}: ${text}`);
  }

  const data = await resp.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (data.error) throw new Error(`OpenRouter error: ${data.error.message}`);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in response");
  return content;
}

function extractJson(text: string): string {
  // Find JSON object in text
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text;
}

function buildFallbackContent(title: string, description: string): AiArticleContent {
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return {
    title,
    summaryPoints: [
      sentences[0]?.trim() || title,
      sentences[1]?.trim() || "Follow this story for more updates.",
      sentences[2]?.trim() || "Stay informed with PulseGurgaon.",
    ],
    fullArticle: description || title,
    timeline: [
      { step: 1, title: "Background", description: "The story began with reports emerging from various sources." },
      { step: 2, title: "Development", description: "Initial reports confirmed the situation was developing rapidly." },
      { step: 3, title: "Response", description: "Stakeholders and authorities began responding to the situation." },
      { step: 4, title: "Impact", description: "The event had immediate impact on those involved." },
      { step: 5, title: "Current Status", description: "The situation continues to evolve as more information becomes available." },
      { step: 6, title: "What's Next", description: "Observers are watching for further developments in the coming days." },
    ],
    vocabulary: [
      { word: "Context", meaning: "The circumstances that form the setting for an event." },
      { word: "Impact", meaning: "A marked effect or influence on something." },
      { word: "Development", meaning: "A new and advanced stage of a situation." },
      { word: "Response", meaning: "An answer or reaction to something." },
    ],
  };
}

export async function enhanceArticle(title: string, description: string): Promise<AiArticleContent> {
  const prompt = `You are a professional news editor for PulseGurgaon, an Indian news platform. Given the news title and raw content below, generate enriched article content in strict JSON format.

Title: ${title}
Content: ${description.slice(0, 800)}

Generate ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "title": "A strong, engaging headline (same topic, rewritten for impact)",
  "summaryPoints": ["Point 1 (one sentence)", "Point 2 (one sentence)", "Point 3 (one sentence)"],
  "fullArticle": "A detailed ~400-500 word article about this news, written in clear journalistic English. Explain the who, what, why, and what it means.",
  "timeline": [
    {"step": 1, "title": "Background", "description": "One sentence about the background context"},
    {"step": 2, "title": "Initial Reports", "description": "One sentence about when/how this started"},
    {"step": 3, "title": "Key Development", "description": "One sentence about the main development"},
    {"step": 4, "title": "Response", "description": "One sentence about reactions or responses"},
    {"step": 5, "title": "Current Status", "description": "One sentence about where things stand now"},
    {"step": 6, "title": "What's Next", "description": "One sentence about what to expect going forward"}
  ],
  "vocabulary": [
    {"word": "word1", "meaning": "simple explanation in one sentence"},
    {"word": "word2", "meaning": "simple explanation in one sentence"},
    {"word": "word3", "meaning": "simple explanation in one sentence"},
    {"word": "word4", "meaning": "simple explanation in one sentence"}
  ]
}`;

  const models = [MODEL, FALLBACK_MODEL];

  for (const model of models) {
    try {
      const text = await callOpenRouter([
        { role: "system", content: "You are a professional news editor. Always respond with valid JSON only, no markdown." },
        { role: "user", content: prompt },
      ], model);

      const jsonStr = extractJson(text);
      const parsed = JSON.parse(jsonStr) as Partial<AiArticleContent>;

      // Validate structure
      if (
        typeof parsed.title === "string" &&
        Array.isArray(parsed.summaryPoints) && parsed.summaryPoints.length >= 3 &&
        typeof parsed.fullArticle === "string" &&
        Array.isArray(parsed.timeline) && parsed.timeline.length >= 6 &&
        Array.isArray(parsed.vocabulary) && parsed.vocabulary.length >= 4
      ) {
        return {
          title: parsed.title,
          summaryPoints: parsed.summaryPoints.slice(0, 3),
          fullArticle: parsed.fullArticle,
          timeline: parsed.timeline.slice(0, 6),
          vocabulary: parsed.vocabulary.slice(0, 4),
        };
      }
    } catch (err) {
      logger.warn({ err, model }, "AI enhancement failed, trying fallback");
    }
  }

  // All models failed — use fallback content
  logger.warn({ title }, "All AI models failed, using fallback content");
  return buildFallbackContent(title, description);
}

export async function aiSearchQuery(
  query: string,
  articles: Array<{ id: number; title: string; description: string; category: string }>
): Promise<{ ids: number[]; interpretation: string; suggestedTopics: string[] }> {
  const articleSummaries = articles.slice(0, 50).map(a =>
    `ID:${a.id} [${a.category}] ${a.title}`
  ).join("\n");

  const prompt = `User searched: "${query}"

Available news articles:
${articleSummaries}

Return ONLY valid JSON:
{
  "ids": [list of up to 10 most relevant article IDs as numbers],
  "interpretation": "One sentence explaining what the user is looking for",
  "suggestedTopics": ["topic1", "topic2", "topic3", "topic4"]
}`;

  try {
    const text = await callOpenRouter([
      { role: "system", content: "You are a smart news search assistant. Return valid JSON only." },
      { role: "user", content: prompt },
    ], MODEL);

    const jsonStr = extractJson(text);
    const parsed = JSON.parse(jsonStr) as {
      ids?: number[];
      interpretation?: string;
      suggestedTopics?: string[];
    };

    return {
      ids: (parsed.ids || []).filter((id): id is number => typeof id === "number"),
      interpretation: parsed.interpretation || `Showing results related to: ${query}`,
      suggestedTopics: parsed.suggestedTopics || [],
    };
  } catch (err) {
    logger.warn({ err }, "AI search failed, using keyword fallback");
    const q = query.toLowerCase();
    const matched = articles
      .filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
      .slice(0, 10)
      .map(a => a.id);
    return {
      ids: matched,
      interpretation: `Showing results related to: ${query}`,
      suggestedTopics: ["Latest News", "Breaking News", "India", "World"],
    };
  }
}
