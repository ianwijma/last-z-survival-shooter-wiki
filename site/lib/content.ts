import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = join(process.cwd(), "content");

export interface PageEntry {
  slug: string;
  frontmatter: Record<string, unknown>;
}

export async function allPages(): Promise<PageEntry[]> {
  const pages: PageEntry[] = [];

  async function walk(dir: string, prefix: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, `${prefix}${entry.name}/`);
      } else if (entry.name.endsWith(".mdx")) {
        const slug = `${prefix}${entry.name.replace(/\.mdx$/, "")}`;
        const content = await readFile(fullPath, "utf-8");
        const { data } = matter(content);
        pages.push({ slug, frontmatter: data });
      }
    }
  }

  await walk(CONTENT_DIR, "/");
  return pages;
}

export function matchesQuery(
  frontmatter: Record<string, unknown>,
  query: Record<string, string | number | boolean | Array<string | number>>
): boolean {
  return Object.entries(query).every(([key, value]) => {
    const pageValue = frontmatter[key];
    if (Array.isArray(value)) {
      return (
        Array.isArray(pageValue) &&
        value.every((v) => pageValue.includes(v))
      );
    }
    return pageValue === value;
  });
}
