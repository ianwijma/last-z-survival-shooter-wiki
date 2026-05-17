import type { TemplateFrontmatter } from "../llm/schemas";

export interface Template {
  path: string;
  frontmatter: TemplateFrontmatter;
  body: string;
}

export async function loadTemplate(path: string): Promise<Template> {
  throw new Error("Not yet implemented: loadTemplate");
}

export async function loadAllTemplates(): Promise<Template[]> {
  throw new Error("Not yet implemented: loadAllTemplates");
}

export function mergeWithCategoryDefault(template: Template, categoryDefault: Template): Template {
  throw new Error("Not yet implemented: mergeWithCategoryDefault");
}
