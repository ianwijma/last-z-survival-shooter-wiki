import type { ExtractionFrontmatter, Source } from "../llm/schemas";

export interface Extraction {
  frontmatter: ExtractionFrontmatter;
  body: string;
}

export async function extractSource(sourceId: string): Promise<Extraction> {
  throw new Error("Not yet implemented: extractSource");
}

export async function extractStaleSources(): Promise<Extraction[]> {
  throw new Error("Not yet implemented: extractStaleSources");
}

export async function extractAllSources(): Promise<Extraction[]> {
  throw new Error("Not yet implemented: extractAllSources");
}

export async function reextractSource(sourceId: string): Promise<Extraction> {
  throw new Error("Not yet implemented: reextractSource");
}
