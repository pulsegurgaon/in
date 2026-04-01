const CATEGORY_KEYWORDS: Record<string, string[]> = {
  India: [
    "india", "indian", "delhi", "mumbai", "gurgaon", "gurugram", "bangalore", "bengaluru",
    "hyderabad", "chennai", "kolkata", "modi", "bjp", "congress", "parliament", "lok sabha",
    "rajya sabha", "rupee", "bse", "nse", "sensex", "nifty", "ipl", "bcci", "aadhaar",
    "gst", "supreme court india", "high court", "cbi", "ed enforcement",
  ],
  Technology: [
    "tech", "technology", "ai", "artificial intelligence", "machine learning", "software",
    "app", "startup", "silicon valley", "google", "apple", "microsoft", "amazon", "meta",
    "facebook", "twitter", "x.com", "openai", "chatgpt", "crypto", "blockchain", "bitcoin",
    "ethereum", "nft", "cybersecurity", "hack", "data breach", "smartphone", "5g", "cloud",
    "gpu", "nvidia", "tesla", "electric vehicle", "ev", "robot", "automation",
  ],
  Finance: [
    "market", "stock", "shares", "economy", "gdp", "inflation", "interest rate", "rbi",
    "federal reserve", "fed", "bank", "finance", "investment", "fund", "ipo", "bond",
    "commodity", "oil", "gold", "dollar", "euro", "forex", "trade", "export", "import",
    "budget", "tax", "fiscal", "monetary", "recession", "growth", "earnings", "profit",
    "revenue", "billion", "trillion", "venture capital", "private equity",
  ],
  World: [
    "world", "global", "international", "united nations", "un", "nato", "war", "conflict",
    "ukraine", "russia", "china", "usa", "america", "europe", "middle east", "israel",
    "palestine", "iran", "north korea", "climate change", "g20", "g7", "diplomatic",
    "sanctions", "treaty", "summit", "president", "prime minister", "election", "vote",
    "protest", "refugee", "migration",
  ],
};

export function detectCategory(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();

  // Score each category
  const scores: Record<string, number> = { India: 0, Technology: 0, Finance: 0, World: 0 };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        scores[category] += kw.split(" ").length; // Multi-word keywords score higher
      }
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best[1] > 0) return best[0];
  return "General";
}
