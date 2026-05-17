# AGENTS.md — Last Z: Survival Shooter Wiki

This file defines the rules and conventions for AI agents working on this wiki.
Read this file first before making any changes to the repository.

---

## 1. Site-Wide Writing Rules

### Tone and Voice

- **Neutral and factual.** The wiki is an encyclopedia, not a blog.
- **Encyclopedic style.** Write in third person. Avoid "you", "we", "I".
- **No editorializing.** Never describe something as "broken", "overpowered",
  "useless", or "meta" unless directly quoting a source.
- **Concise.** Prefer tables for numeric data. Keep prose minimal.

### Citation Format

All claims must be cited using the `<SourceCite>` component:

```mdx
The M4A1 has a base reload time of 3.1 seconds <SourceCite id="youtube/abc123xyz" />.
```

Citations appear inline, immediately after the claim they support.

### Prohibited Behaviors

- **No unsourced claims.** Every factual statement must have a citation.
- **No speculation.** If sources don't support a claim, don't make it.
- **No "broken/overpowered" editorializing.** Quote sources directly if they
  use these terms.
- **No guessing.** If a stat is unknown, write `—` in tables or explicitly
  state "unknown" in prose.

---

## 2. Pipeline Command Reference

### Template Commands (Layer 1)

| Command | Description |
|---------|-------------|
| `bun pipeline template new <path>` | Scaffold a new template from its category default |
| `bun pipeline template new <path> --from-extractions` | Scaffold using LLM to draft from extractions |
| `bun pipeline template check` | Lint all templates for valid frontmatter and references |
| `bun pipeline template rename <old> <new>` | Rename a template and update all references |

### Ingest Commands (Layer 2, fetch step)

| Command | Description |
|---------|-------------|
| `bun pipeline ingest youtube <url>` | Fetch YouTube transcript and metadata |
| `bun pipeline ingest wiki <url>` | Fetch and clean wiki page content |
| `bun pipeline ingest reddit <url>` | Fetch Reddit thread and top comments |
| `bun pipeline ingest steam <url>` | Fetch Steam Community/News content |
| `bun pipeline ingest official <url>` | Fetch official dev communications |
| `bun pipeline ingest inbox` | Batch process files in inbox/ directory |
| `bun pipeline ingest image <path>` | Ingest a single image file |

### Extract Commands (Layer 2, LLM step)

| Command | Description |
|---------|-------------|
| `bun pipeline extract <sourceId>` | Run LLM extraction on one source |
| `bun pipeline extract --stale` | Extract all sources with missing or stale extractions |
| `bun pipeline extract --all` | Force re-extract every source |
| `bun pipeline reextract <sourceId>` | Force re-extract a single source |

### Index Commands (deterministic, no LLM)

| Command | Description |
|---------|-------------|
| `bun pipeline index` | Rebuild all indexes from filesystem scan |
| `bun pipeline audit` | Verify integrity of sources, templates, and pages |

### Plan Command (Layer 2 → Layer 1 feedback)

| Command | Description |
|---------|-------------|
| `bun pipeline plan` | Run curator to produce coverage report |

### Write Commands (Layer 3)

| Command | Description |
|---------|-------------|
| `bun pipeline write <topicPath>` | Regenerate a single page |
| `bun pipeline write --all` | Regenerate all pages |
| `bun pipeline write --all-stale` | Regenerate only stale pages |
| `bun pipeline rewrite --all` | Force regenerate all pages |

### Combined Commands

| Command | Description |
|---------|-------------|
| `bun pipeline refresh` | Re-fetch, re-extract stale, re-index, re-write stale |
| `bun pipeline affected <sourceId>` | List pages that cite the given source |

---

## 3. Standard Workflow Recipes

### Recipe A — Ingest new video and update affected pages

```
1. bun pipeline ingest youtube <url>
   (auto-extracts; uses EXTRACT model; one-time cost)
2. bun pipeline index
3. bun pipeline plan
   → read indexes/coverage.md; check for new proposed topics
4. If new topics worth covering:
     bun pipeline template new <path> --from-extractions
     (review and edit the generated template body)
5. bun pipeline write --all-stale
6. git status; stage changes; propose commit message to user
```

### Recipe B — Update wiki for a new season

```
1. Ask user for sources (YouTube URLs, official posts, etc.).
2. For each: bun pipeline ingest <type> <url>
3. bun pipeline index && bun pipeline plan
4. Review coverage.md with the user. Create templates for each
   approved new topic: bun pipeline template new seasons/season-N --from-extractions
5. Edit template bodies if needed based on user guidance.
6. bun pipeline write --all-stale
7. Summarize the change and request review.
```

### Recipe C — Style/tone refactor

```
1. Edit AGENTS.md (tone/voice rules).
2. bun pipeline rewrite --all
   (uses FORMAT model only; cheap; no extraction cost)
3. Spot-check a few pages; commit if satisfied.
```

---

## 4. Safety Rules

The following behaviors are prohibited without explicit user consent:

- **No force re-extraction without user consent.** `pipeline extract --all` or
  `pipeline reextract --all` cost real money (tens of dollars for a large
  corpus). Always ask before running these commands.

- **No hand-edits to generated files.** The following files are pipeline-owned
  and will be overwritten:
  - `site/content/**/*.mdx` (except inside `:protected:` blocks)
  - `site/content/**/_meta.js`
  - `indexes/**/*`

- **No git force-push.** Never force-push to any branch, especially main.

- **No rewrites of main branch history.** Never rebase or reset commits on main.

- **No deletion of `sources/**` without explicit user instruction.**

- **No PR creation without user go-ahead.** Branch and commit freely, but
  `gh pr create` only when the user explicitly approves.

- **Never commit secrets.** Files like `.env`, credentials, or API-key-bearing
  config must never be committed. Standard .gitignore hygiene applies.

- **Never modify AGENTS.md without confirmation.** Changes to this file have
  wiki-wide consequences via the rewrite flow. Always confirm with the user
  before modifying.
