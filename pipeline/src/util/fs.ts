import { readFile, writeFile, mkdir, access, stat } from "fs/promises";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { rename, unlink } from "fs/promises";
import type { Stats } from "fs";

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, "utf-8");
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content);
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, content, "utf-8");
}

export async function writeJsonFile<T>(path: string, data: T): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

export async function writeAtomic(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  const tempPath = join(tmpdir(), `atomic-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await writeFile(tempPath, content, "utf-8");
  await rename(tempPath, path);
}

export async function ensureDir(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error;
    }
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function getFileStats(path: string): Promise<Stats> {
  return stat(path);
}

export async function getFileSize(path: string): Promise<number> {
  const stats = await stat(path);
  return stats.size;
}

export async function deleteFile(path: string): Promise<void> {
  await unlink(path);
}

export function getProjectRoot(): string {
  return join(import.meta.dir, "..", "..", "..");
}

export function getTemplatesDir(): string {
  return join(getProjectRoot(), "templates");
}

export function getSourcesDir(): string {
  return join(getProjectRoot(), "sources");
}

export function getIndexesDir(): string {
  return join(getProjectRoot(), "indexes");
}

export function getSiteContentDir(): string {
  return join(getProjectRoot(), "site", "content");
}

export function getInboxDir(): string {
  return join(getProjectRoot(), "inbox");
}

export function getCacheDir(): string {
  return join(getProjectRoot(), ".cache");
}
