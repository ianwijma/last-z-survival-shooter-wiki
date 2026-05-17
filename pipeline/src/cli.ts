import { Command } from "commander";

const program = new Command();

program
  .name("pipeline")
  .description("Last Z Wiki AI Pipeline")
  .version("0.1.0");

// Template commands (Layer 1)
const templateCmd = program.command("template").description("Template management commands");

templateCmd
  .command("new <path>")
  .description("Scaffold a new template from its category default")
  .option("--from-extractions", "Draft template using extractions tagged with matching topic")
  .action((path: string, options: { fromExtractions?: boolean }) => {
    console.log(`Not yet implemented: template new ${path}${options.fromExtractions ? " --from-extractions" : ""}`);
    process.exit(0);
  });

templateCmd
  .command("check")
  .description("Lint all templates for valid frontmatter, category references, and orphans")
  .action(() => {
    console.log("Not yet implemented: template check");
    process.exit(0);
  });

templateCmd
  .command("rename <oldPath> <newPath>")
  .description("Rename a template and update all references")
  .action((oldPath: string, newPath: string) => {
    console.log(`Not yet implemented: template rename ${oldPath} ${newPath}`);
    process.exit(0);
  });

// Ingest commands (Layer 2, fetch step)
const ingestCmd = program.command("ingest").description("Source ingestion commands");

ingestCmd
  .command("youtube <url>")
  .description("Fetch YouTube video transcript and metadata")
  .option("--force", "Re-fetch even if source exists")
  .option("--no-extract", "Skip auto-extraction after fetch")
  .action((url: string) => {
    console.log(`Not yet implemented: ingest youtube ${url}`);
    process.exit(0);
  });

ingestCmd
  .command("wiki <url>")
  .description("Fetch and clean wiki page content")
  .option("--force", "Re-fetch even if source exists")
  .option("--no-extract", "Skip auto-extraction after fetch")
  .action((url: string) => {
    console.log(`Not yet implemented: ingest wiki ${url}`);
    process.exit(0);
  });

ingestCmd
  .command("reddit <url>")
  .description("Fetch Reddit thread and top comments")
  .option("--force", "Re-fetch even if source exists")
  .option("--no-extract", "Skip auto-extraction after fetch")
  .action((url: string) => {
    console.log(`Not yet implemented: ingest reddit ${url}`);
    process.exit(0);
  });

ingestCmd
  .command("steam <url>")
  .description("Fetch Steam community post or news")
  .option("--force", "Re-fetch even if source exists")
  .option("--no-extract", "Skip auto-extraction after fetch")
  .action((url: string) => {
    console.log(`Not yet implemented: ingest steam ${url}`);
    process.exit(0);
  });

ingestCmd
  .command("official <url>")
  .description("Fetch official developer communication")
  .option("--force", "Re-fetch even if source exists")
  .option("--no-extract", "Skip auto-extraction after fetch")
  .action((url: string) => {
    console.log(`Not yet implemented: ingest official ${url}`);
    process.exit(0);
  });

ingestCmd
  .command("inbox")
  .description("Process all files in inbox/ directory")
  .option("--force", "Re-process even if source exists")
  .option("--no-extract", "Skip auto-extraction after fetch")
  .action(() => {
    console.log("Not yet implemented: ingest inbox");
    process.exit(0);
  });

ingestCmd
  .command("image <path>")
  .description("Ingest a single image file")
  .option("--force", "Re-process even if source exists")
  .option("--no-extract", "Skip auto-extraction after fetch")
  .action((path: string) => {
    console.log(`Not yet implemented: ingest image ${path}`);
    process.exit(0);
  });

// Extract commands (Layer 2, LLM step)
const extractCmd = program.command("extract").description("Run LLM extraction on sources");

extractCmd
  .argument("[sourceId]", "Source ID to extract (e.g., youtube/abc123)")
  .option("--stale", "Extract only sources with stale or missing extractions")
  .option("--all", "Force re-extract all sources")
  .action((sourceId: string | undefined, options: { stale?: boolean; all?: boolean }) => {
    if (sourceId) {
      console.log(`Not yet implemented: extract ${sourceId}`);
    } else if (options.stale) {
      console.log("Not yet implemented: extract --stale");
    } else if (options.all) {
      console.log("Not yet implemented: extract --all");
    } else {
      console.log("Not yet implemented: extract (requires sourceId, --stale, or --all)");
    }
    process.exit(0);
  });

program
  .command("reextract <sourceId>")
  .description("Force re-extract a single source")
  .action((sourceId: string) => {
    console.log(`Not yet implemented: reextract ${sourceId}`);
    process.exit(0);
  });

// Index commands (deterministic, no LLM)
program
  .command("index")
  .description("Rebuild all index files from filesystem")
  .action(() => {
    console.log("Not yet implemented: index");
    process.exit(0);
  });

program
  .command("audit")
  .description("Verify integrity of sources, templates, and pages")
  .action(() => {
    console.log("Not yet implemented: audit");
    process.exit(0);
  });

// Plan command (Layer 2 → Layer 1 feedback loop)
program
  .command("plan")
  .description("Run curator to generate coverage report")
  .action(() => {
    console.log("Not yet implemented: plan");
    process.exit(0);
  });

// Write commands (Layer 3)
const writeCmd = program.command("write").description("Generate wiki pages from templates");

writeCmd
  .argument("[topicPath]", "Topic path to write (e.g., weapons/m4a1)")
  .option("--all", "Regenerate all pages that have templates")
  .option("--all-stale", "Regenerate only stale pages")
  .option("--writer <type>", "Writer implementation: sdk or opencode", "sdk")
  .option("--model <id>", "Override FORMAT model for this run")
  .option("--dry-run", "Print which pages would be written without writing")
  .action((topicPath: string | undefined, options: { all?: boolean; allStale?: boolean; writer?: string; model?: string; dryRun?: boolean }) => {
    if (topicPath) {
      console.log(`Not yet implemented: write ${topicPath}`);
    } else if (options.all) {
      console.log("Not yet implemented: write --all");
    } else if (options.allStale) {
      console.log("Not yet implemented: write --all-stale");
    } else {
      console.log("Not yet implemented: write (requires topicPath, --all, or --all-stale)");
    }
    process.exit(0);
  });

program
  .command("rewrite")
  .description("Force regenerate pages regardless of staleness")
  .option("--all", "Regenerate all pages")
  .option("--writer <type>", "Writer implementation: sdk or opencode", "sdk")
  .option("--model <id>", "Override FORMAT model for this run")
  .option("--dry-run", "Print which pages would be written without writing")
  .action((options: { all?: boolean; writer?: string; model?: string; dryRun?: boolean }) => {
    if (options.all) {
      console.log("Not yet implemented: rewrite --all");
    } else {
      console.log("Not yet implemented: rewrite (requires --all)");
    }
    process.exit(0);
  });

// Combined / convenience commands
program
  .command("refresh")
  .description("Run full pipeline: ingest, extract stale, index, write stale")
  .action(() => {
    console.log("Not yet implemented: refresh");
    process.exit(0);
  });

program
  .command("affected <sourceId>")
  .description("List pages that cite the given source")
  .action((sourceId: string) => {
    console.log(`Not yet implemented: affected ${sourceId}`);
    process.exit(0);
  });

program.parse();
