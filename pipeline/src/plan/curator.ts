import type { Template } from "../templates/loader";
import type { Extraction } from "../extract/index";

export interface CoverageReport {
  generatedAt: string;
  generatorModel: string;
  generatorVersion: string;
  templatesScanned: number;
  sourcesScanned: number;
  pagesScanned: number;
}

export async function runCurator(
  templates: Template[],
  extractions: Extraction[]
): Promise<CoverageReport> {
  throw new Error("Not yet implemented: runCurator");
}

export async function generateCoverageMd(report: CoverageReport): Promise<string> {
  throw new Error("Not yet implemented: generateCoverageMd");
}
