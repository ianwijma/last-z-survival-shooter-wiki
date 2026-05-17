export type ModelTier = "EXTRACT" | "FORMAT" | "VISION" | "FALLBACK";

export const MODEL_PRESETS: Record<ModelTier, string> = {
  EXTRACT: process.env.MODEL_EXTRACT ?? "anthropic/claude-sonnet-4",
  FORMAT: process.env.MODEL_FORMAT ?? "google/gemini-2.5-flash",
  VISION: process.env.MODEL_VISION ?? "google/gemini-2.5-pro",
  FALLBACK: process.env.MODEL_FALLBACK ?? "anthropic/claude-haiku-4",
};

export function getModelForTier(tier: ModelTier): string {
  return MODEL_PRESETS[tier];
}
