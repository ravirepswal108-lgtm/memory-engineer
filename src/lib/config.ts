/**
 * Secure Server-side Configuration Module
 *
 * Ensures API keys for Hindsight Cloud and Groq remain server-side only
 * and are never exposed to the client browser.
 */

export interface ServerConfig {
  hindsightApiKey: string;
  hindsightBaseUrl: string;
  hindsightBankId: string;
  groqApiKey: string;
  groqModel: string;
}

/**
 * Clean up an env-var secret pasted into a dashboard: trims whitespace/newlines,
 * removes wrapping quotes and an accidental "Bearer " prefix.
 */
export function cleanSecret(value: string | undefined): string {
  let v = (value || "").trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  v = v.replace(/^Bearer\s+/i, "").trim();
  return v;
}

/**
 * Secret-free description of a key's shape, for diagnosing "Invalid API key format".
 */
export function describeKeyShape(value: string | undefined) {
  const raw = value || "";
  const cleaned = cleanSecret(raw);
  return {
    present: cleaned.length > 0,
    length: cleaned.length,
    prefix: cleaned.slice(0, 4),
    hadSurroundingWhitespace: raw !== raw.trim(),
    hadQuotes: /^["']|["']$/.test(raw.trim()),
    hadBearerPrefix: /^["']?\s*Bearer\s+/i.test(raw.trim()),
    containsInnerWhitespace: /\s/.test(cleaned),
  };
}

export function getServerConfig(): ServerConfig {
  if (typeof window !== "undefined") {
    throw new Error("Server configuration must not be accessed on the client side.");
  }

  const hindsightApiKey = cleanSecret(process.env.HINDSIGHT_API_KEY);
  const hindsightBaseUrl = (cleanSecret(process.env.HINDSIGHT_BASE_URL) || "https://api.hindsight.vectorize.io").replace(/\/+$/, "");
  const hindsightBankId = cleanSecret(process.env.HINDSIGHT_BANK_ID) || "engineering-incidents";
  const groqApiKey = cleanSecret(process.env.GROQ_API_KEY);
  const groqModel = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  return {
    hindsightApiKey,
    hindsightBaseUrl,
    hindsightBankId,
    groqApiKey,
    groqModel,
  };
}

export function validateServerConfig(): { isValid: boolean; missing: string[] } {
  const config = getServerConfig();
  const missing: string[] = [];

  if (!config.hindsightApiKey) missing.push("HINDSIGHT_API_KEY");
  if (!config.hindsightBankId) missing.push("HINDSIGHT_BANK_ID");
  if (!config.groqApiKey) missing.push("GROQ_API_KEY");

  return {
    isValid: missing.length === 0,
    missing,
  };
}
