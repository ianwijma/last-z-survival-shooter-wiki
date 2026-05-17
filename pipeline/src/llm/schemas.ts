import { z } from "zod";

export const SourceType = z.enum([
  "youtube",
  "wikis",
  "reddit",
  "steam",
  "official",
  "inbox",
  "images",
]);

export const ExtractionStatus = z.enum(["ok", "failed", "stale"]);

export const ExtractionMetaSchema = z.object({
  path: z.string(),
  model: z.string(),
  extractorVersion: z.string(),
  extractedAt: z.string(),
  inputContentHash: z.string(),
  status: ExtractionStatus,
});

export const SourceSchema = z.object({
  id: z.string(),
  type: SourceType,
  url: z.string(),
  title: z.string().optional(),
  author: z.string().optional(),
  publishedAt: z.string().optional(),
  fetchedAt: z.string(),
  contentHash: z.string(),
  rawPath: z.string(),
  rawBytes: z.number().optional(),
  extraction: ExtractionMetaSchema.optional(),
  ingesterVersion: z.string(),
  notes: z.string().optional(),
});

export type Source = z.infer<typeof SourceSchema>;
export type SourceTypeValue = z.infer<typeof SourceType>;

export const ProposedNewTopicSchema = z.object({
  path: z.string(),
  justification: z.string(),
});

export const ExtractionFrontmatterSchema = z.object({
  sourceId: z.string(),
  sourceUrl: z.string(),
  sourceType: SourceType,
  sourceTitle: z.string().optional(),
  sourceAuthor: z.string().optional(),
  sourceDate: z.string().optional(),
  extractedAt: z.string(),
  extractedWith: z.string(),
  extractorVersion: z.string(),
  inputContentHash: z.string(),
  topics: z.array(z.string()),
  proposedNewTopics: z.array(ProposedNewTopicSchema).optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  patchContext: z.string().optional(),
  assetPath: z.string().optional(),
});

export type ExtractionFrontmatter = z.infer<typeof ExtractionFrontmatterSchema>;

export const SourcesModeSchema = z.enum(["auto", "whitelist", "exclude"]);

export const SourcesConfigSchema = z.object({
  mode: SourcesModeSchema.default("auto"),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
});

export const AggregationQuerySchema = z.record(
  z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))])
);

export const AggregationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  query: AggregationQuerySchema,
  render: z.enum(["list", "grid", "table"]).optional(),
  sort: z.string().optional(),
  limit: z.number().optional(),
  empty: z.string().optional(),
});

export type Aggregation = z.infer<typeof AggregationSchema>;

export const TemplateFrontmatterSchema = z.object({
  title: z.string(),
  category: z.string(),
  slug: z.string().optional(),
  order: z.number().optional(),
  label: z.string().optional(),
  hidden: z.boolean().optional(),
  sections: z.array(z.string()).optional(),
  sources: SourcesConfigSchema.optional(),
  topicTags: z.array(z.string()).optional(),
  aggregations: z.array(AggregationSchema).optional(),
  seasonAdded: z.number().optional(),
  addedToWiki: z.string().optional(),
});

export type TemplateFrontmatter = z.infer<typeof TemplateFrontmatterSchema>;

export const PageFrontmatterSchema = z.object({
  title: z.string(),
  category: z.string(),
  slug: z.string(),
  sources: z.array(z.string()),
  lastGeneratedAt: z.string(),
  generatorVersion: z.string(),
  generatorModel: z.string(),
  templateHash: z.string(),
  agentsHash: z.string(),
  sourceHashes: z.record(z.string()).optional(),
});

export type PageFrontmatter = z.infer<typeof PageFrontmatterSchema>;
