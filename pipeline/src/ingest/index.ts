import type { Source } from "../llm/schemas";

export interface IngestResult {
  source: Source;
  rawPath: string;
}

export async function ingestYouTube(url: string, options?: { force?: boolean }): Promise<IngestResult> {
  throw new Error("Not yet implemented: ingestYouTube");
}

export async function ingestWiki(url: string, options?: { force?: boolean }): Promise<IngestResult> {
  throw new Error("Not yet implemented: ingestWiki");
}

export async function ingestReddit(url: string, options?: { force?: boolean }): Promise<IngestResult> {
  throw new Error("Not yet implemented: ingestReddit");
}

export async function ingestSteam(url: string, options?: { force?: boolean }): Promise<IngestResult> {
  throw new Error("Not yet implemented: ingestSteam");
}

export async function ingestOfficial(url: string, options?: { force?: boolean }): Promise<IngestResult> {
  throw new Error("Not yet implemented: ingestOfficial");
}

export async function ingestInbox(options?: { force?: boolean }): Promise<IngestResult[]> {
  throw new Error("Not yet implemented: ingestInbox");
}

export async function ingestImage(path: string, options?: { force?: boolean }): Promise<IngestResult> {
  throw new Error("Not yet implemented: ingestImage");
}
