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

export function getServerConfig(): ServerConfig {
  if (typeof window !== "undefined") {
    throw new Error("Server configuration must not be accessed on the client side.");
  }

  const hindsightApiKey = process.env.HINDSIGHT_API_KEY || "";
  const hindsightBaseUrl = process.env.HINDSIGHT_BASE_URL || "https://api.hindsight.vectorize.io";
  const hindsightBankId = process.env.HINDSIGHT_BANK_ID || "engineering-incidents";
  const groqApiKey = process.env.GROQ_API_KEY || "";
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
