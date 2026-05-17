import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, generateObject } from "ai";
import type { ModelTier } from "./models";
import { MODEL_PRESETS, getModelForTier } from "./models";
import { config } from "../config";
import type { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: config.openrouterApiKey,
});

export interface CallLLMOptions {
  tier: ModelTier;
  prompt: string;
  systemPrompt?: string;
  schema?: z.ZodType<unknown>;
  maxRetries?: number;
  stricterPromptPrefix?: string;
}

export interface CallLLMResult<T> {
  content: T;
  model: string;
  attempts: number;
  usedFallback: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

export async function callLLM<T = string>(
  options: CallLLMOptions
): Promise<CallLLMResult<T>> {
  const { tier, prompt, systemPrompt, schema, maxRetries = 3, stricterPromptPrefix } = options;
  
  let attempts = 0;
  let usedFallback = false;
  const primaryModel = getModelForTier(tier);
  const fallbackModel = MODEL_PRESETS.FALLBACK;

  async function attemptWithModel(modelId: string, useStricterPrompt: boolean): Promise<T> {
    const model = openrouter(modelId);
    const effectivePrompt = useStricterPrompt && stricterPromptPrefix 
      ? `${stricterPromptPrefix}\n\n${prompt}` 
      : prompt;

    if (schema) {
      const result = await generateObject({
        model,
        prompt: effectivePrompt,
        schema,
      });
      return result.object as T;
    } else {
      const result = await generateText({
        model,
        prompt: effectivePrompt,
      });
      return result.text as T;
    }
  }

  for (let retryRound = 0; retryRound < 2; retryRound++) {
    const modelId = retryRound === 0 ? primaryModel : fallbackModel;
    usedFallback = retryRound === 1;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      attempts++;
      try {
        const useStricterPrompt = attempt >= Math.floor(maxRetries / 2);
        const result = await attemptWithModel(modelId, useStricterPrompt);
        return { content: result, model: modelId, attempts, usedFallback };
      } catch (error) {
        const isRateLimit = error instanceof Error && 
          (error.message.includes("429") || error.message.includes("rate limit"));
        const isServerError = error instanceof Error && 
          (error.message.includes("5") || error.message.includes("timeout"));
        const isValidationError = error instanceof Error && 
          error.message.includes("validation");

        if (isRateLimit || isServerError) {
          if (attempt < maxRetries - 1) {
            const backoff = calculateBackoff(attempt);
            await sleep(backoff);
            continue;
          }
        }

        if (isValidationError && attempt < maxRetries - 1) {
          continue;
        }

        if (attempt === maxRetries - 1 && retryRound === 0) {
          break;
        }

        if (attempt === maxRetries - 1 && retryRound === 1) {
          throw error;
        }
      }
    }
  }

  throw new Error("LLM call failed after all retries and fallback attempts");
}

export { openrouter };
