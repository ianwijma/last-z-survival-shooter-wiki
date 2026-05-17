import type { Template } from "../templates/loader";

export interface MetaEntry {
  key: string;
  title: string;
  display?: "hidden";
  theme?: Record<string, unknown>;
}

export async function generateMetaJs(templates: Template[], directory: string): Promise<void> {
  throw new Error("Not yet implemented: generateMetaJs");
}

export function buildMetaEntries(templates: Template[]): MetaEntry[] {
  throw new Error("Not yet implemented: buildMetaEntries");
}
