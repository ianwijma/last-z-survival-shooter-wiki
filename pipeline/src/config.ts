import { config } from "dotenv";

config();

export interface Config {
  openrouterApiKey: string;
  youtubeApiKey?: string;
  modelExtract: string;
  modelFormat: string;
  modelVision: string;
  modelFallback: string;
  extractorVersion: string;
  ingesterVersion: string;
  generatorVersion: string;
}

export function loadConfig(): Config {
  return {
    openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
    modelExtract: process.env.MODEL_EXTRACT ?? "anthropic/claude-sonnet-4",
    modelFormat: process.env.MODEL_FORMAT ?? "google/gemini-2.5-flash",
    modelVision: process.env.MODEL_VISION ?? "google/gemini-2.5-pro",
    modelFallback: process.env.MODEL_FALLBACK ?? "anthropic/claude-haiku-4",
    extractorVersion: "v1",
    ingesterVersion: "v1",
    generatorVersion: "v1",
  };
}

export const config = loadConfig();
