import { createHash } from "crypto";
import { readFile } from "fs/promises";

export function contentHash(content: string): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export async function fileContentHash(path: string): Promise<string> {
  const content = await readFile(path);
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export function hashToShort(hash: string, length = 12): string {
  const cleanHash = hash.replace(/^sha256:/, "");
  return cleanHash.slice(0, length);
}
