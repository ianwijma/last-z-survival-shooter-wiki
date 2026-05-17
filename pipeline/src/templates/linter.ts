import type { Template } from "./loader";

export interface LintResult {
  errors: string[];
  warnings: string[];
}

export async function lintTemplates(templates: Template[]): Promise<LintResult> {
  throw new Error("Not yet implemented: lintTemplates");
}

export async function checkTemplate(template: Template): Promise<LintResult> {
  throw new Error("Not yet implemented: checkTemplate");
}
