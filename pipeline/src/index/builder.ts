import type { Template } from "../templates/loader";
import type { Extraction } from "../extract/index";

export interface SourceToPages {
  sourceId: string;
  pages: string[];
}

export interface PageToSources {
  pagePath: string;
  sources: string[];
}

export interface TemplateToSources {
  templatePath: string;
  sources: string[];
}

export async function buildIndexes(
  templates: Template[],
  extractions: Extraction[]
): Promise<{
  sourcesToPages: SourceToPages[];
  pagesToSources: PageToSources[];
  templatesToSources: TemplateToSources[];
}> {
  throw new Error("Not yet implemented: buildIndexes");
}

export async function writeIndexes(indexes: {
  sourcesToPages: SourceToPages[];
  pagesToSources: PageToSources[];
  templatesToSources: TemplateToSources[];
}): Promise<void> {
  throw new Error("Not yet implemented: writeIndexes");
}
