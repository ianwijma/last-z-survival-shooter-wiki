import type { Template } from "./loader";

export interface ScaffoldOptions {
  path: string;
  fromExtractions?: boolean;
}

export async function scaffoldTemplate(options: ScaffoldOptions): Promise<Template> {
  throw new Error("Not yet implemented: scaffoldTemplate");
}
