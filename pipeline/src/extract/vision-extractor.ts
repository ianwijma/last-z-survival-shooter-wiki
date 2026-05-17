import type { ExtractionFrontmatter, Source } from "../llm/schemas";

export interface Extraction {
  frontmatter: ExtractionFrontmatter;
  body: string;
}

export async function extractImageSource(source: Source): Promise<Extraction> {
  throw new Error("Not yet implemented: extractImageSource");
}
