import type { Template, TemplateFrontmatter } from "../templates/loader";
import type { Extraction } from "../extract/index";

export interface WriterInput {
  topicPath: string;
  template: Template;
  agentsMd: string;
  extractions: Extraction[];
  existingPage?: string;
}

export interface WriterOutput {
  mdx: string;
  citedSourceIds: string[];
  missingSections: string[];
  warnings: string[];
}

export interface Writer {
  write(input: WriterInput): Promise<WriterOutput>;
}
