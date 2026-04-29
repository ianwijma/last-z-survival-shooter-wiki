# Last Z: Survival Shooter Wiki — Design Specification

**Date:** 2026-04-29
**Status:** Draft for review
**Authors:** Ian (project owner) + OpenCode (brainstorming collaborator)

---

## 1. Goals & Non-Goals

### 1.1 Goals

- **Consolidate scattered community knowledge** about *Last Z: Survival Shooter* into one high-quality, continuously-maintained wiki.
- **Use AI to extract and format content** from disparate sources (YouTube videos, community wikis, Reddit threads, Steam forums, official developer communications, personal notes, screenshots, game data) so manual effort is concentrated on curation and review, not transcription.
- **Keep cost low and content regeneratable**: expensive LLM work is done once per unique source and cached; formatting/writing uses cheap models and can be re-run freely.
- **Make every claim in the wiki traceable** to a specific source. Any human or LLM auditor can follow the chain: page → template intent → extracted facts → raw source → original URL.
- **Human-in-the-loop by default.** Every change reaches the live wiki via a pull request you review.
- **Support two execution drivers** from day one:
  - **Manual CLI** — you run pipeline commands explicitly.
  - **OpenCode agent** — OpenCode orchestrates the same commands in response to high-level prompts.
- **Ship static HTML** that deploys free on Cloudflare Pages (with GitHub Pages as fallback).
- **Fully version-controlled knowledge base**: templates, extractions, raw sources, and generated pages all committed to Git, giving a full audit trail via commit history.

### 1.2 Non-Goals (for this design)

- **No live database.** No SQLite, no Postgres, no key-value store. Filesystem + Git only.
- **No server-side runtime.** The deployed wiki is pure static HTML/CSS/JS. No Node server in production.
- **No scheduled automation in MVP.** Pipelines are run on demand locally. Scheduled ingest is a later-phase nice-to-have.
- **No user accounts, edit-in-browser, or public contributions** on the wiki itself. Contributions happen via Git/PRs.
- **No Discord ingestion in MVP.** ToS and token-management complexity deferred indefinitely.
- **No datamining MVP commitment.** Included as an optional later phase pending legal/feasibility review.
- **No multi-language support in MVP.** English only. i18n is a Nextra-native feature we can enable later.
- **No interactive game tools in MVP** (damage calculators, loadout planners). Possible later via React components.

### 1.3 Design principles

- **Evidence before assertion.** The wiki never makes a claim that isn't traceable to a cited source. When sources are missing, pages say so explicitly.
- **Cost discipline.** The expensive LLM pass (extraction) runs at most once per unique source content. The cheap LLM pass (writing) is regenerable for effectively free.
- **Deterministic plumbing, AI where it adds value.** File I/O, indexing, git operations, and scaffolding are pure TypeScript. LLM calls are isolated to extraction, writing, and curator planning.
- **Filesystem as the source of truth.** No runtime state. Every artifact is a committed file.
- **Human controls structure; AI fills content.** Templates (authored by you) define what pages exist and what they should cover. Extractions and writing are AI-assisted.

---

## 2. Three-Layer Architecture

The wiki is built from three explicit, independently-auditable layers. Each layer has a single responsibility and a clear interface to the next.

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1 — INTENT (human-authored)                           │
│                                                             │
│ templates/                                                  │
│   Human-written .md files with YAML frontmatter             │
│   defining what pages should exist, their sections,         │
│   source mode, and authoring guidance.                      │
│                                                             │
│   Filesystem layout IS the wiki taxonomy.                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│ LAYER 2 — FACTS (LLM-extracted, cached)                     │
│                                                             │
│ sources/                                                    │
│   One folder per ingested source, containing:               │
│     - source.json     (metadata + contentHash)              │
│     - raw.*           (cleaned raw content)                 │
│     - extraction.md   (structured, topic-tagged claims)     │
│                                                             │
│   Extractions are the source-of-truth for facts.            │
│   Run by EXPENSIVE model. Cached by contentHash.            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│ LAYER 3 — OUTPUT (LLM-composed, regenerable)                │
│                                                             │
│ site/content/                                               │
│   MDX files rendered by Nextra into static HTML.            │
│   Generated from: template (intent) × cited extractions     │
│     (facts) × AGENTS.md (style). Run by CHEAP model.        │
│                                                             │
│   Always regeneratable from layers 1 and 2.                 │
└─────────────────────────────────────────────────────────────┘
```

**Key properties:**

- **Each layer can be rebuilt from the one above it.** Delete `site/content/` and regenerate from templates + extractions at low cost. Delete `sources/*/extraction.md` files and regenerate from `raw.*` files (higher cost, but still deterministic). Delete `raw.*` files and you'd need to re-fetch from the original URLs (highest cost, time-dependent).
- **Each layer is committed to Git.** Full audit trail via diffs. A reviewer looking at any generated page can trace its lineage through committed artifacts.
- **Each layer has a distinct update cadence.** Templates change when you redesign the wiki. Extractions change when sources are added or re-fetched. Pages change every time anything upstream changes — but their regeneration is cheap.

### 2.1 Data flow — ingestion to page

```
external source (YouTube, wiki, Reddit, image, note)
        │
        │  Ingester (deterministic TypeScript; per source type)
        │    - fetch raw content
        │    - clean / normalize (Readability for HTML, yt-dlp for video)
        │    - compute contentHash
        ▼
sources/<type>/<id>/source.json + raw.<ext>
        │
        │  Extractor (EXPENSIVE LLM; once per unique contentHash)
        │    - input: raw.* + extraction prompt
        │    - output: structured extraction.md
        │    - tagged with topic paths matching templates/
        ▼
sources/<type>/<id>/extraction.md
        │
        │  Indexer (deterministic; rebuilds indexes/ from fs)
        ▼
indexes/sources-to-pages.jsonl
indexes/pages-to-sources.jsonl
indexes/coverage.md (optional, from curator)
        │
        │  Writer (CHEAP LLM; runs on demand or when upstream changes)
        │    - input: template + cited extractions + AGENTS.md
        │    - output: MDX page content
        ▼
site/content/<path>.mdx
        │
        │  Next.js + Nextra build (deterministic)
        ▼
site/out/  →  Cloudflare Pages
```

---

## 3. Folder Layout

The repository is a monorepo containing the wiki site, the AI pipeline, and all knowledge artifacts. Every committed directory below has a specific, single-responsibility purpose.

```
last-z-survival-shooter-wiki/
├── AGENTS.md                      # site-wide rules (style, tone, citation format, house rules)
├── README.md
├── package.json                   # bun workspace root
├── bun.lock
├── tsconfig.base.json
├── .env.example                   # required env vars (OPENROUTER_API_KEY, YOUTUBE_API_KEY, ...)
├── .gitignore
│
├── .github/
│   └── workflows/
│       └── build-and-deploy.yml   # Next.js static export → Cloudflare Pages (only CI in MVP)
│
├── docs/                          # project documentation (not wiki content)
│   └── superpowers/
│       ├── specs/                 # design specs like this one
│       └── plans/                 # implementation plans (writing-plans output)
│
├── templates/                     # LAYER 1: COMMITTED — human-authored intent
│   ├── _category/
│   │   ├── weapons.md             # category default: sections, source mode, voice hints
│   │   ├── enemies.md
│   │   ├── seasons.md
│   │   ├── maps.md
│   │   ├── mechanics.md
│   │   ├── strategies.md
│   │   └── lore.md
│   ├── index.md                   # brief for site landing page
│   ├── weapons/
│   │   ├── index.md               # category landing page brief
│   │   ├── m4a1.md
│   │   └── ak47.md
│   ├── enemies/
│   ├── maps/
│   ├── seasons/
│   │   ├── index.md
│   │   └── season-3/
│   │       ├── index.md
│   │       └── events.md
│   ├── mechanics/
│   ├── strategies/
│   └── lore/
│
├── sources/                       # LAYER 2: COMMITTED — ingested source-of-truth
│   ├── index.jsonl                # canonical source registry (one line per source)
│   ├── youtube/
│   │   └── <videoId>/
│   │       ├── source.json        # metadata + contentHash + extractor info
│   │       ├── raw.txt            # cleaned transcript
│   │       └── extraction.md      # structured, topic-tagged claims
│   ├── wikis/
│   │   └── <urlHash>/
│   │       ├── source.json
│   │       ├── raw.md             # Readability-cleaned HTML → markdown
│   │       └── extraction.md
│   ├── reddit/
│   │   └── <threadId>/
│   │       ├── source.json
│   │       ├── raw.json           # thread + top comments
│   │       └── extraction.md
│   ├── steam/
│   │   └── <postId>/{source.json,raw.md,extraction.md}
│   ├── official/
│   │   └── <postId>/{source.json,raw.md,extraction.md}
│   ├── inbox/
│   │   └── <noteId>/{source.json,raw.md,extraction.md}
│   └── images/
│       └── <imageHash>/
│           ├── source.json        # originalFilename, assetPath, addedAt, contentHash
│           ├── raw.png            # (or a reference to site/public/media/...)
│           └── extraction.md      # vision LLM: description, OCR, inferred claims
│
├── indexes/                       # COMMITTED — auto-derived from templates + sources
│   ├── sources-to-pages.jsonl     # {sourceId, pages: [pagePath, ...]}
│   ├── pages-to-sources.jsonl     # {pagePath, sources: [sourceId, ...]}
│   ├── templates-to-sources.jsonl # {templatePath, sources: [sourceId, ...]}
│   └── coverage.md                # curator output (gap report)
│
├── site/                          # LAYER 3: Next.js + Nextra v4 app
│   ├── package.json               # workspace member
│   ├── next.config.mjs            # output: 'export' → static HTML
│   ├── theme.config.tsx           # Nextra docs theme config
│   ├── tsconfig.json
│   ├── content/                   # Nextra content root (GENERATED, committed)
│   │   ├── _meta.js               # auto-generated from templates
│   │   ├── index.mdx
│   │   ├── weapons/
│   │   │   ├── _meta.js
│   │   │   ├── index.mdx
│   │   │   ├── m4a1.mdx
│   │   │   └── _drafting-notes.md # gap notes for the writer (committed; see §13)
│   │   └── ...
│   ├── components/                # React components used in MDX
│   │   ├── Aggregation.tsx        # build-time query over page graph
│   │   ├── SourceCite.tsx         # inline citation renderer
│   │   ├── Screenshot.tsx         # responsive image embed (see §11.4)
│   │   └── StatBlock.tsx          # tabular weapon/enemy stats
│   ├── lib/
│   │   └── content.ts             # build-time page graph helpers (allPages, etc.)
│   ├── public/
│   │   └── media/                 # screenshots + static assets
│   └── out/                       # next build output (GITIGNORED)
│
├── pipeline/                      # AI pipeline (TypeScript/Bun)
│   ├── package.json               # workspace member
│   ├── tsconfig.json
│   ├── src/
│   │   ├── cli.ts                 # commander-based entry point
│   │   ├── config.ts              # env loading, model preset selection
│   │   ├── llm/
│   │   │   ├── openrouter.ts      # @openrouter/ai-sdk-provider setup
│   │   │   ├── models.ts          # EXTRACT / FORMAT / VISION / FALLBACK presets
│   │   │   └── schemas.ts         # Zod schemas for structured output
│   │   ├── ingest/
│   │   │   ├── youtube.ts
│   │   │   ├── wikis.ts
│   │   │   ├── reddit.ts
│   │   │   ├── steam.ts
│   │   │   ├── official.ts
│   │   │   ├── inbox.ts
│   │   │   └── image.ts
│   │   ├── extract/
│   │   │   ├── source-extractor.ts  # text sources → extraction.md
│   │   │   └── vision-extractor.ts  # images → extraction.md
│   │   ├── templates/
│   │   │   ├── loader.ts          # read + merge template with category default
│   │   │   ├── scaffolder.ts      # `template new`, incl. --from-extractions
│   │   │   └── linter.ts          # `template check`: frontmatter, orphans, drift
│   │   ├── write/
│   │   │   ├── writer.ts          # Writer interface
│   │   │   ├── sdk-writer.ts      # AI SDK generateText + tools implementation
│   │   │   ├── opencode-writer.ts # invokes `opencode run` headless
│   │   │   └── meta.ts            # auto-generate site/content/**/_meta.js
│   │   ├── plan/
│   │   │   └── curator.ts         # gap reporter → indexes/coverage.md
│   │   ├── index/
│   │   │   └── builder.ts         # rebuild indexes/ from filesystem
│   │   └── util/
│   │       ├── fs.ts              # read/write helpers, atomic writes
│   │       ├── hash.ts            # contentHash (sha256)
│   │       └── git.ts             # branch, commit, optional gh CLI invocation
│   └── prompts/                   # versioned prompt templates (.md)
│       ├── extract-source.md
│       ├── extract-image.md
│       ├── write-page.md
│       └── curator.md
│
├── inbox/                         # COMMITTED — drop notes/screenshots here
│   └── .gitkeep                   #   processed by `pipeline ingest inbox`
│
└── .cache/                        # GITIGNORED — only transient fetch artifacts
    └── .gitkeep                   #   (e.g., yt-dlp temp files, pre-processed binaries)
```

### 3.1 Directory rationale

| Directory | Layer | Committed? | Authored by | Consumed by |
|---|---|---|---|---|
| `templates/` | Intent | Yes | Human (with AI assist) | Writer, Curator |
| `sources/` | Facts | Yes | Ingester + Extractor | Writer, Curator, humans |
| `indexes/` | Derived | Yes | `pipeline index` | Curator, Writer, humans |
| `site/content/` | Output | Yes | Writer | Next.js build, readers |
| `site/components/` | Output infra | Yes | Human | Next.js build |
| `site/public/media/` | Output assets | Yes | Human (via inbox flow) | Next.js build |
| `site/out/` | Build artifact | **No** | `next build` | Cloudflare Pages deploy |
| `pipeline/` | Tooling | Yes | Human (with AI assist) | CLI, OpenCode |
| `inbox/` | Input staging | Yes | Human | `pipeline ingest inbox` |
| `.cache/` | Scratch | **No** | Ingesters | Ingesters only |

**Rationale notes:**

- **`site/content/` is committed** even though it's generated, because it makes PR reviews concrete (reviewers see the actual page diff, not just "the writer produced something"). It also means the site can be built and served without running the pipeline at all.
- **`indexes/` is committed** for the same reason: reviewers can inspect the provenance graph directly in the PR instead of running a script.
- **`sources/<type>/<id>/raw.*` is committed** to make extractions auditable: an LLM reviewer can compare `raw.txt` against `extraction.md` and flag distortions. Text transcripts are small; repo growth is acceptable. Binary images live under `site/public/media/` (not duplicated in `sources/images/`).
- **`inbox/` is committed** — notes/screenshots you drop in are part of the knowledge base and should be versioned. Once processed, the pipeline leaves them there (they become the `raw.*` artifact for their source entry).
- **`.cache/` is gitignored** and should contain only transient fetch artifacts that would be wasteful to commit (e.g., yt-dlp download buffers, pre-Readability HTML dumps). Anything the pipeline needs long-term lives under `sources/`.
- **No `data/` directory in MVP.** Structured game data tables (typed weapon stats, enemy spawn tables) are a deferred decision (see §15).

---

## 4. Template Format (Layer 1)

Templates are the human-authored spec for the wiki. They answer two questions per page:

1. **Should this page exist?** — determined by whether a template file exists at the corresponding path.
2. **What should it cover and how?** — determined by the template's frontmatter (machine-readable config) and body (free-form authoring brief).

### 4.1 Template file anatomy

```markdown
---
# REQUIRED fields
title: M4A1
category: weapons

# OPTIONAL structural fields (inherited from _category/ default if omitted)
slug: weapons/m4a1           # defaults to filesystem path; override for renames
order: 10                    # sidebar ordering (used by _meta.js generator)
label: M4A1                  # sidebar label (defaults to title)
hidden: false                # if true, page built but hidden from sidebar

# OPTIONAL content fields
sections:                    # ordered list of sections the writer must emit
  - overview
  - stats
  - attachments
  - recommended-loadouts
  - notable-patches
  - sources                  # always last; renders citation list

# OPTIONAL source control
sources:
  mode: auto                 # auto | whitelist | exclude
  # include: [youtube/abc123, wikis/def456]  # when mode is whitelist
  # exclude: [reddit/xyz789]                  # when mode is exclude

# OPTIONAL taxonomy hints for extractions
topicTags:                   # additional topic paths that feed this page
  - weapons/m4a1             # (inferred from slug if omitted)
  - mechanics/reload-speed   # include facts about reload speed in this page

# OPTIONAL aggregations (see §10)
aggregations: []

# OPTIONAL metadata
seasonAdded: 1               # when this entity was introduced; used by season pages
addedToWiki: 2026-04-29
---

# Authoring intent

The M4A1 is a mid-tier assault rifle. The page should emphasize:

- Baseline stats vs competitors (AK47, SCAR)
- How Fast Mag attachments change viability
- Common meta loadouts

If sources disagree on damage numbers, show both values with patch version
annotations. Keep prose under 600 words total; data belongs in tables.

## Section hints

### stats
Table format. Columns: damage, reload time, magazine, fire rate, effective range.
If a stat is unknown, write `—`; never guess.

### recommended-loadouts
Group loadouts by playstyle (aggressive, ranged, defensive). Cite the source
for each loadout (YouTube video + timestamp, or Reddit thread).

### notable-patches
Only list patches that changed this weapon's stats. One-line per change with
patch version and citation.
```

### 4.2 Frontmatter reference

| Field | Type | Required? | Description |
|---|---|---|---|
| `title` | string | yes | Page title (also used as sidebar label if `label` omitted) |
| `category` | string | yes | Must match a file in `templates/_category/` |
| `slug` | string | no | Route path; defaults to filesystem location under `templates/` |
| `order` | number | no | Sidebar ordering; lower first. Default: alphabetical |
| `label` | string | no | Sidebar label override |
| `hidden` | boolean | no | Hide from sidebar/search; default false |
| `sections` | string[] | no | Ordered sections; inherited from category default if omitted |
| `sources.mode` | enum | no | `auto` (default), `whitelist`, `exclude` |
| `sources.include` | string[] | conditional | Required when `mode: whitelist` |
| `sources.exclude` | string[] | conditional | Required when `mode: exclude` |
| `topicTags` | string[] | no | Additional topic paths (beyond slug) whose facts feed this page |
| `aggregations` | Aggregation[] | no | See §10 |
| `seasonAdded` | number | no | Season when entity was introduced; used by season aggregations |
| `addedToWiki` | ISO date | no | Informational; auto-filled by `template new` |

### 4.3 Category defaults

Each file in `templates/_category/<category>.md` defines defaults for all pages declaring that `category`. Example:

```markdown
---
# templates/_category/weapons.md
sections:
  - overview
  - stats
  - attachments
  - variants
  - recommended-loadouts
  - notable-patches
  - sources
sources:
  mode: auto
---

# Category voice hints

All weapon pages should be neutral, stat-forward, and concise. Lead with
what the weapon does well; follow with caveats. Never editorialize meta
("broken", "overpowered") unless quoting a source directly. Always show
numeric stats in tables, not prose.
```

**Inheritance rules:**

1. A per-page template merges over its category default field-by-field (not deep-merge — each frontmatter field is either overridden fully or inherited).
2. The category's body content is **context the writer always sees** when writing any page in that category. Per-page bodies extend, not replace, the category brief.
3. Empty per-page templates (frontmatter only) are valid and fully inherit. This supports the "sketch the wiki upfront" workflow.

### 4.4 Authoring workflows

Three ways to create templates:

| Workflow | Command | When |
|---|---|---|
| **Scaffold from category default** | `bun pipeline template new weapons/m4a1` | You know a page should exist and what category |
| **Scaffold from extractions** | `bun pipeline template new seasons/season-3 --from-extractions` | Extractions mention a topic but no template exists; cheap LLM drafts a brief for you to edit |
| **Hand-authored** | `touch templates/lore/origin.md` + edit | When the brief is very specific |

All three produce the same artifact type; scaffolders just reduce typing.

---

## 5. Extraction Format (Layer 2)

The extraction layer turns raw, messy, time-variant source material into structured, topic-tagged, auditable knowledge. Every ingested source produces exactly three committed files in `sources/<type>/<id>/`:

1. **`source.json`** — metadata and provenance (what, when, how, hash).
2. **`raw.<ext>`** — cleaned raw content (transcript, readable HTML-to-markdown, JSON dump, image bytes).
3. **`extraction.md`** — the structured LLM output. This is the source-of-truth for facts.

### 5.1 `source.json` schema

```json
{
  "id": "youtube/abc123xyz",
  "type": "youtube",
  "url": "https://www.youtube.com/watch?v=abc123xyz",
  "title": "Best M4A1 Loadout 2026 — Season 3 Tier List",
  "author": "SurvivorPro",
  "publishedAt": "2026-04-15T00:00:00Z",
  "fetchedAt": "2026-04-29T10:22:04Z",
  "contentHash": "sha256:0a3b1c...",
  "rawPath": "raw.txt",
  "rawBytes": 48721,
  "extraction": {
    "path": "extraction.md",
    "model": "anthropic/claude-sonnet-4",
    "extractorVersion": "v1",
    "extractedAt": "2026-04-29T10:23:11Z",
    "inputContentHash": "sha256:0a3b1c...",
    "status": "ok"
  },
  "ingesterVersion": "v1",
  "notes": ""
}
```

**Field semantics:**

| Field | Purpose |
|---|---|
| `id` | `<type>/<stableId>` — matches the folder name. Stable across re-fetches. |
| `type` | One of `youtube`, `wikis`, `reddit`, `steam`, `official`, `inbox`, `images`. |
| `url` | Canonical source URL. For `inbox`/`images`, a local reference. |
| `contentHash` | `sha256` over the normalized `raw.*` content. Used for caching. |
| `extraction.inputContentHash` | The `contentHash` that was input to the extractor. If this differs from `contentHash` on re-ingest, the extractor must re-run. |
| `extraction.status` | `ok` / `failed` / `stale`. `stale` = source has been re-ingested but extractor hasn't re-run. |
| `extractorVersion` | Bumped when the extraction prompt changes materially. Enables forced re-extraction. |
| `ingesterVersion` | Bumped when the ingester's normalization logic changes. |

### 5.2 `extraction.md` schema (text sources)

```markdown
---
sourceId: youtube/abc123xyz
sourceUrl: https://www.youtube.com/watch?v=abc123xyz
sourceType: youtube
sourceTitle: "Best M4A1 Loadout 2026 — Season 3 Tier List"
sourceAuthor: SurvivorPro
sourceDate: 2026-04-15
extractedAt: 2026-04-29T10:23:11Z
extractedWith: anthropic/claude-sonnet-4
extractorVersion: v1
inputContentHash: sha256:0a3b1c...
topics:
  - weapons/m4a1
  - mechanics/reload-speed
  - seasons/season-3
proposedNewTopics:
  - path: mechanics/heat-system
    justification: "Author describes a new 'overheat' mechanic not in any existing topic."
confidence: high
patchContext: "1.4.1"
---

# Summary

One neutral paragraph summarizing what the source covers. Written by the
extractor. Max ~120 words.

# Claims by topic

## weapons/m4a1
- Base reload time: 3.1s [at 1:22]
- With Fast Mag I: 2.7s [at 2:15]
- With Fast Mag II: 2.3s [at 2:34]
- Magazine size: 30 [at 0:45]
- Base damage per shot: 28 [at 5:10] (author uncertain — says "I think")

## mechanics/reload-speed
- Fast Mag stacks additively with reload perks [at 4:10]

## seasons/season-3
- Season 3 introduces a new overheat mechanic affecting sustained fire [at 6:03]

# Key quotes

> "Fast Mag II brings M4 reload down to two point three, which is honestly broken"
> — SurvivorPro [2:34]

# Unverified / low-confidence claims

- "5% damage buff in hotfix 1.4.2" — author mentions, does not cite source [6:45]

# Contradictions with existing knowledge

- None detected at extraction time.

# Extractor notes

- Transcript contained timestamps; preserved in citations.
- Patch version 1.4.1 referenced explicitly in intro.
```

**Section contract:** every `extraction.md` MUST contain these sections in this order, even if some are empty:

| Section | Required | If empty |
|---|---|---|
| Frontmatter | yes | n/a |
| `# Summary` | yes | Write "No summary." |
| `# Claims by topic` | yes | List at least the topics in frontmatter, each with "No claims." if source had none |
| `# Key quotes` | yes | "No notable quotes." |
| `# Unverified / low-confidence claims` | yes | "None." |
| `# Contradictions with existing knowledge` | yes | "None detected at extraction time." |
| `# Extractor notes` | yes | "None." |

The strict structure makes extractions parseable by the writer without further LLM calls (it can grep by `## <topic>` to find relevant claims).

### 5.3 `extraction.md` schema (images)

Images use the same frontmatter + body shape, with an adjusted section list:

```markdown
---
sourceId: images/a9c2b1d4
sourceUrl: file://inbox/2026-04-29-loadout-screenshot.png
sourceType: images
sourceTitle: "Loadout screen — M4A1 with Fast Mag II"
sourceDate: 2026-04-29
extractedAt: 2026-04-29T10:45:02Z
extractedWith: google/gemini-2.5-pro
extractorVersion: v1
inputContentHash: sha256:...
topics:
  - weapons/m4a1
  - ui/loadout-screen
assetPath: site/public/media/screenshots/m4a1-fastmag.png
confidence: high
---

# Summary
Loadout configuration screen showing M4A1 with Fast Mag II attachment equipped
at level 12 character.

# Scene description
Split-pane UI: left shows 3D weapon model, right shows stat panel and
attachment slots. Background: in-menu dark gradient.

# OCR text
- Weapon name: "M4A1"
- Damage: 28
- Reload: 2.3s
- Magazine: 30
- Attachment: "Fast Mag II"
- Character level: 12

# Claims by topic

## weapons/m4a1
- Reload time with Fast Mag II displayed as 2.3s (confirms youtube/abc123xyz claim)
- Damage value displayed as 28

## ui/loadout-screen
- Loadout screen shows weapon model, stats panel, and attachment grid.

# Inferred UI state
- Character level 12.
- Attachment slot 2 filled with Fast Mag II; others empty.

# Unverified / low-confidence observations
- None.

# Extractor notes
- Numbers read cleanly; high OCR confidence.
```

### 5.4 Extraction caching and re-runs

The caching policy is content-addressed:

```
if exists(sources/<id>/extraction.md)
   AND source.json.extraction.inputContentHash == source.json.contentHash
   AND source.json.extraction.extractorVersion == current extractor version
then
   skip extraction (use cached)
else
   run extractor, update extraction.md and source.json
```

**Re-extraction triggers:**

1. **Source content changed** (`pipeline ingest` re-fetched and `contentHash` differs). Automatic.
2. **Extractor prompt updated** (`extractorVersion` bumped in `pipeline/src/extract/source-extractor.ts`). Triggered by `bun pipeline reextract --all` or incrementally.
3. **Manual force** (`bun pipeline reextract <sourceId>`). For debugging or single-source re-runs.

### 5.5 Topic tagging rules

The extractor is prompted with the current taxonomy (derived from scanning `templates/**/*.md` paths) and instructed:

1. Use existing topic paths **exactly** when applicable. Example: if `templates/weapons/m4a1.md` exists, use `weapons/m4a1`, not `weapons/m4` or `m4a1`.
2. If content doesn't fit any existing template path, emit it under `proposedNewTopics` in frontmatter with a 1-sentence `justification`. Never invent topics silently.
3. A claim can be listed under multiple topics — duplicate it verbatim in each relevant `## <topic>` section rather than cross-referencing.
4. Timestamps (YouTube) or reference markers (Reddit comment IDs, image coordinates) MUST be preserved inline with claims whenever the raw content supplies them.

Curator (§9) aggregates `proposedNewTopics` across all extractions and surfaces them in `indexes/coverage.md` for human approval.

### 5.6 Per-source-type normalization

Each ingester produces a canonical `raw.<ext>` shape suitable for its type:

| Source type | `raw.*` format | Normalization |
|---|---|---|
| `youtube` | `raw.txt` | yt-dlp auto-subs (VTT → plain text with `[mm:ss]` timestamp prefixes per line) |
| `wikis` | `raw.md` | `fetch` → Mozilla Readability → Turndown (HTML → markdown) |
| `reddit` | `raw.json` | Public `.json` endpoint; kept as JSON (thread + top-20 comments by score) |
| `steam` | `raw.md` | Steam Community/News API JSON → rendered markdown |
| `official` | `raw.md` | RSS item or scraped HTML → Readability → markdown |
| `inbox` | `raw.md` or `raw.txt` | Copied verbatim from the `inbox/` file; light frontmatter stripped |
| `images` | `raw.png` | Image bytes (original or re-encoded PNG/JPEG/WebP) |

The extractor always reads `raw.*` — never the original URL. This guarantees that re-running extraction is deterministic against a committed input.

---

## 6. Pipeline Command Reference

All pipeline commands are exposed via a single CLI entry point: `bun pipeline <cmd>` (package.json script that runs `bun run pipeline/src/cli.ts`). Commands are organized by the layer they operate on.

Conventions:
- Commands are **idempotent** wherever possible; re-running should produce no diff if nothing changed.
- Commands emit a one-line summary to stdout on success (e.g., `extracted 3 sources; 12 new claims added`).
- Commands never push to remote or open PRs without an explicit `--pr` flag (MVP: flag not implemented; branch only).
- Every command writes to stdout only; progress logs go to stderr.
- Exit codes: `0` success, `1` expected failure (e.g., missing source), `2` unexpected error.

### 6.1 Template commands (Layer 1)

```
bun pipeline template new <path>
  Scaffold a new template from its category default.
  Inputs:   <path>  e.g. weapons/m4a1 or seasons/season-3/events
  Outputs:  templates/<path>.md (frontmatter only; body from category default voice hints)
  Errors:   Template already exists; category default missing for inferred category.

bun pipeline template new <path> --from-extractions
  Scaffold using the CHEAP LLM, drafting both frontmatter and body from extractions
  already tagged with the matching topic.
  Inputs:   <path>
  Outputs:  templates/<path>.md with suggested sections + prose brief
  Errors:   No extractions match the topic (suggests ingesting sources first).

bun pipeline template check
  Lint all templates: valid frontmatter, valid category reference, no orphan
  templates (template whose topic has no matching extractions — warning only),
  no near-duplicate paths.
  Outputs:  stdout report; non-zero exit if any errors (not warnings).

bun pipeline template rename <old-path> <new-path>
  Deterministic rename. Moves templates/<old>.md → templates/<new>.md,
  rewrites references in extraction.md frontmatter (topics, proposedNewTopics),
  rewrites generated pages' frontmatter slug, rewrites indexes/.
  Outputs:  one-line summary of files touched.
```

### 6.2 Ingest commands (Layer 2, fetch step)

```
bun pipeline ingest youtube <url>
  Fetch transcript + metadata, compute contentHash, write sources/youtube/<id>/
  source.json + raw.txt. Does NOT run extraction (see §6.3).
  Skips if sources/youtube/<id>/source.json exists with same contentHash.

bun pipeline ingest wiki <url>
  Fetch + Readability clean + Turndown. Write sources/wikis/<urlHash>/.

bun pipeline ingest reddit <url>
  Fetch JSON. Write sources/reddit/<threadId>/.

bun pipeline ingest steam <url>
  Fetch via Steam News API. Write sources/steam/<postId>/.

bun pipeline ingest official <url>
  Fetch RSS item or HTML. Write sources/official/<postId>/.

bun pipeline ingest inbox
  Watch-free batch processor for inbox/. For each file:
    - text/markdown → sources/inbox/<noteId>/
    - image → sources/images/<hash>/ (also copies to site/public/media/)
  Files are left in inbox/ for re-processing if needed.

bun pipeline ingest image <path>
  Single-image ingest. Computes hash, places under sources/images/<hash>/,
  copies to site/public/media/, writes source.json.

Options common to all ingest commands:
  --force          Re-fetch even if source.json exists with matching URL.
  --no-extract     Only fetch; skip auto-extraction afterward (default is to
                   auto-extract for convenience; override with this flag).
```

### 6.3 Extract commands (Layer 2, LLM step)

```
bun pipeline extract <sourceId>
  Run EXPENSIVE LLM extraction on one source. Cache-aware.
  Writes sources/<id>/extraction.md and updates source.json.extraction.

bun pipeline extract --stale
  Run extraction on every source where extraction is missing or stale
  (inputContentHash differs, or extractorVersion differs).

bun pipeline extract --all
  Force re-extract every source regardless of cache state.

bun pipeline reextract <sourceId>
  Alias for extract --force on one source.
```

### 6.4 Index commands (deterministic, no LLM)

```
bun pipeline index
  Rebuild indexes/ from scratch by scanning:
    - templates/**/*.md frontmatter
    - sources/**/extraction.md frontmatter
    - site/content/**/*.mdx frontmatter
  Outputs:
    indexes/sources-to-pages.jsonl
    indexes/pages-to-sources.jsonl
    indexes/templates-to-sources.jsonl
  Also (re)generates site/content/**/_meta.js from template order/label/hidden.

bun pipeline audit
  Verify integrity:
    - Every page's frontmatter.sources[] resolves to existing sources/<id>/.
    - Every template's topic has ≥1 matching extraction (warn if missing).
    - No orphan extractions (extraction whose topic has no template — warn).
    - No duplicate source URLs under different sourceIds.
    - raw.* file size matches source.json.rawBytes.
  Non-zero exit on integrity errors; zero on warnings only.
```

### 6.5 Plan command (Layer 2 → Layer 1 feedback loop)

```
bun pipeline plan
  Run the CURATOR (cheap LLM). Produces indexes/coverage.md:
    - Proposed new topics from extractions' proposedNewTopics.
    - Topics referenced in extractions but lacking templates.
    - Templates lacking extractions (sparse pages warning).
    - Stale pages (source re-extracted since page last generated).
    - Empty stubs (template exists, page not yet written).
    - Near-duplicate template paths.
  Advisory only — makes no filesystem changes beyond writing coverage.md.
```

### 6.6 Write commands (Layer 3)

```
bun pipeline write <topicPath>
  Regenerate one page. Reads templates/<path>.md + category default +
  AGENTS.md + cited extractions (filtered by topicTags/sources.mode) → emits
  site/content/<path>.mdx.
  Uses the configured FORMAT model (cheap).

bun pipeline write --all
  Regenerate every page that has a template.

bun pipeline write --all-stale
  Regenerate only pages where any input (template, extraction, AGENTS.md)
  is newer than the output page's lastGeneratedAt frontmatter.

bun pipeline rewrite --all
  Force regenerate every page regardless of staleness.
  Intended for AGENTS.md style/tone changes or bulk format migrations.

Options:
  --writer <sdk|opencode>   Select Writer implementation. Default: sdk.
  --model <id>              Override FORMAT model for this run.
  --dry-run                 Print which pages would be written; do not write.
```

### 6.7 Combined / convenience commands

```
bun pipeline refresh
  Shortcut pipeline:
    1. pipeline ingest <all registered live sources>  (re-fetch)
    2. pipeline extract --stale
    3. pipeline index
    4. pipeline write --all-stale
  Intended for "catch up on everything that might have changed."

bun pipeline affected <sourceId>
  Lists pages that cite the given source (via indexes/sources-to-pages.jsonl).
  Read-only.
```

### 6.8 Command grouping summary

| Group | Commands | LLM cost | Side effects |
|---|---|---|---|
| Template | `template new`, `template check`, `template rename` | Optional (cheap for `--from-extractions`) | Writes `templates/`, occasionally `sources/` frontmatter |
| Ingest | `ingest <type>` | None | Writes `sources/<type>/<id>/source.json`, `raw.*` |
| Extract | `extract`, `reextract` | **Expensive** (cached) | Writes `sources/<id>/extraction.md`, updates `source.json` |
| Index | `index`, `audit` | None | Writes `indexes/`, `site/content/**/_meta.js` |
| Plan | `plan` | Cheap | Writes `indexes/coverage.md` |
| Write | `write`, `rewrite` | Cheap | Writes `site/content/**/*.mdx` |
| Combined | `refresh`, `affected` | Varies | Chains the above |

---

## 7. LLM Tier Strategy

Every LLM call in this system is routed through `@openrouter/ai-sdk-provider` so we have one API key, one dependency, and can swap models per call. The design pins three named model **tiers** rather than specific model IDs, so we can change underlying models without touching pipeline code.

### 7.1 Model tiers

Defined in `pipeline/src/llm/models.ts`:

```ts
export type ModelTier = "EXTRACT" | "FORMAT" | "VISION" | "FALLBACK";

export const MODEL_PRESETS: Record<ModelTier, string> = {
  // EXTRACT — Runs once per unique source contentHash. Quality > cost.
  // Target: strong reasoning, good at structured output, preserves verbatim quotes.
  EXTRACT:  process.env.MODEL_EXTRACT  ?? "anthropic/claude-sonnet-4",

  // FORMAT — Runs every page write, many times per wiki update. Cost > quality.
  // Target: cheap, fast, good at following strict markdown templates.
  FORMAT:   process.env.MODEL_FORMAT   ?? "google/gemini-2.5-flash",

  // VISION — Runs once per unique image. Needs image input capability.
  // Target: strong OCR + scene understanding.
  VISION:   process.env.MODEL_VISION   ?? "google/gemini-2.5-pro",

  // FALLBACK — Used when FORMAT is rate-limited or returns malformed output
  //            after N retries. Slightly more capable and/or different provider.
  FALLBACK: process.env.MODEL_FALLBACK ?? "anthropic/claude-haiku-4",
};
```

**Every LLM call site in the codebase references a tier constant, never a raw model string.** Changing providers is one environment variable. Benchmarking is a matter of setting `MODEL_FORMAT=<candidate>` and running `pipeline rewrite --all --dry-run` on a fixed input set.

### 7.2 Per-command tier usage

| Command | Tier | Cost profile | Cached? |
|---|---|---|---|
| `ingest <type>` | none | $0 | — (content-hash dedupe) |
| `extract`, `reextract` | `EXTRACT` (text) / `VISION` (images) | **High** per source | **Yes** — by `inputContentHash` + `extractorVersion` |
| `template new --from-extractions` | `FORMAT` | Low | No (one-shot scaffolder) |
| `write`, `rewrite` | `FORMAT` | Low per page | No (cheap to repeat) |
| `plan` (curator) | `FORMAT` | Low (one run over all extractions) | No |

### 7.3 Cost model — worked example

Assumptions for illustration (April 2026 OpenRouter pricing, rough):
- `EXTRACT` ≈ $3/M input, $15/M output tokens.
- `FORMAT` ≈ $0.08/M input, $0.30/M output tokens.
- `VISION` ≈ $1.25/M input (plus per-image fee), $5/M output.

Per-source costs (order of magnitude):

| Operation | Input size | Output size | Cost |
|---|---|---|---|
| Extract one 20-min YouTube video (~8k tokens transcript) | 8k + 2k prompt | 3k structured extraction | ~$0.08 |
| Extract one 500-word Reddit thread | 2k + 2k | 1.5k | ~$0.04 |
| Extract one screenshot (vision) | image + 1.5k prompt | 1.5k | ~$0.02 + image fee |
| Write one page (cheap model, 3 extractions cited) | 6k context | 1.5k MDX | ~$0.001 |
| Regenerate full wiki (100 pages) | 100 × 6k | 100 × 1.5k | ~$0.10–$0.20 |
| Re-extract full source corpus (50 sources) | 50 × 10k | 50 × 2.5k | ~$5–$8 |

**Implication:** onboarding ~50 sources costs around $5–10 once. Iterating on `AGENTS.md` tone and regenerating the entire wiki costs pennies and can be done repeatedly without guilt.

### 7.4 Structured output strategy

The `EXTRACT` tier uses Vercel AI SDK's `generateObject` with a Zod schema **only for the frontmatter portion** of `extraction.md`. The body (Summary, Claims by topic, etc.) is generated as markdown via `generateText` in the same call, constrained by a strict prompt that references the required section headings.

Why this split:
- Frontmatter needs strict typing (topic paths, model IDs, hashes) — `generateObject` + Zod catches malformed output before it hits disk.
- Body is free-form prose and would be painful to schematize. Prompt-level constraints plus a post-processing validator (checks for required `## Section` headings) are sufficient.

The `FORMAT` tier uses `generateText` end-to-end (no `generateObject`) — writing MDX is a text-completion task, and Zod-validating generated MDX has no benefit.

### 7.5 Retry and fallback behavior

Each LLM call site in the pipeline is wrapped by a single helper `callLLM()` with this policy:

1. Attempt with the named tier's primary model.
2. On rate-limit / 5xx / timeout: exponential backoff, up to 3 retries.
3. On malformed output (schema validation fail): 1 retry with stricter prompt prefix.
4. On persistent failure: retry once with `FALLBACK` model.
5. On continued failure: abort command with non-zero exit, leave partial work under `.cache/partial/<runId>.json` for debugging.

Pipeline commands never silently succeed with missing/malformed LLM output.

---

## 8. Page Generation Flow

This section describes how a template becomes a rendered `site/content/<path>.mdx` file, including how the writer handles missing or conflicting evidence.

### 8.1 Lifecycle states

A page exists in one of five states at any time:

```
  ┌──────────────┐
  │ UNTEMPLATED  │  No templates/<path>.md file.
  └──────┬───────┘  (Surfaced by curator if extractions mention the topic.)
         │ template new
         ▼
  ┌──────────────┐
  │    STUB      │  Template exists; no site/content/<path>.mdx.
  └──────┬───────┘
         │ write
         ▼
  ┌──────────────┐
  │   WRITTEN    │  Page exists and is up-to-date.
  └──────┬───────┘
         │ template, source, or AGENTS.md updated after lastGeneratedAt
         ▼
  ┌──────────────┐
  │    STALE     │  Page exists but inputs are newer.
  └──────┬───────┘
         │ write (or write --all-stale, or rewrite)
         ▼
  back to WRITTEN

  ORPHAN — site/content/<path>.mdx exists without a matching template.
           Flagged by `pipeline audit`; must be deleted or have a template added.
```

Every state transition is driven by an explicit pipeline command. There is no background process.

### 8.2 Generated page frontmatter

Every `site/content/<path>.mdx` has frontmatter auto-managed by the writer. Example:

```yaml
---
title: M4A1
category: weapons
slug: weapons/m4a1
sources:
  - youtube/abc123xyz
  - wikis/def456
  - images/a9c2b1d4
lastGeneratedAt: 2026-04-29T10:52:17Z
generatorVersion: v1
generatorModel: google/gemini-2.5-flash
templateHash: sha256:ab7c...
agentsHash: sha256:91de...
sourceHashes:
  youtube/abc123xyz: sha256:0a3b1c...
  wikis/def456: sha256:2f8e4a...
  images/a9c2b1d4: sha256:7c1b9d...
---
```

**Why these fields:**

- `sources` — the cited source IDs, used by `indexes/pages-to-sources.jsonl` and by `SourceCite` component at render time.
- `lastGeneratedAt` — compared against source / template / AGENTS.md mtimes for staleness detection.
- `templateHash`, `agentsHash`, `sourceHashes` — content hashes of all inputs at generation time. Enables precise staleness check: a page is stale if any hash differs from current. More reliable than mtime (survives `git clone`).
- `generatorVersion` — bump when the writer's prompt or logic changes materially; forces regen.

Frontmatter is **authoritative and machine-managed**. Hand-edits to generated page frontmatter will be overwritten on next `write`. (Prose body edits are *also* overwritten — see §8.5 for the override pattern.)

### 8.3 Writer input composition

For a given `<topicPath>`, the writer assembles its prompt context in this order:

```
1. AGENTS.md                                   (site-wide rules)
2. templates/_category/<category>.md           (category default brief + voice)
3. templates/<topicPath>.md                    (per-page brief; merges over category)
4. Relevant extractions, filtered:
     - template.sources.mode == "auto":
         all extractions whose topics[] contains <topicPath>
         OR template.topicTags[]
     - template.sources.mode == "whitelist":
         only extractions in template.sources.include[]
     - template.sources.mode == "exclude":
         same as "auto", then subtract extractions in template.sources.exclude[]
5. For context: existing site/content/<topicPath>.mdx, if any (enables writer
   to preserve human-ratified sections — see §8.5).
```

The writer prompt (stored in `pipeline/prompts/write-page.md`) instructs the model to:
- Emit each section named in `template.sections[]` in order.
- Cite sources inline using the `<SourceCite id="<sourceId>" />` component (rendered by Nextra at build).
- Never introduce claims unsupported by the cited extractions.
- When a section has no supporting claims, emit the placeholder block (§8.4).
- Write the final `## Sources` section as a formatted list of all cited sources.

### 8.4 Missing-source behavior

When the writer encounters a section in `template.sections[]` that has no supporting claims across any cited extraction, it emits:

```markdown
## Recommended loadouts

> **No sources available yet.** This section is awaiting more community
> or official sources covering recommended loadouts for this weapon.
>
> *If you have a source, add it via `bun pipeline ingest <type> <url>` and
> run `bun pipeline write weapons/m4a1`.*
```

Additionally, the writer appends a line to `site/content/<parentDir>/_drafting-notes.md` (created if missing):

```markdown
## 2026-04-29 — weapons/m4a1
- Section `recommended-loadouts` has no supporting extractions. Need sources.
- Section `notable-patches` has only 1 supporting claim; thin coverage.
```

`_drafting-notes.md` files are **committed** alongside pages — they're part of the audit trail and surface gaps to human reviewers during PR review. They are excluded from the Nextra content collection so they don't render as pages (see §11.2).

### 8.5 Preserving human edits to generated pages

Generated prose is overwritten on every `write` by default. To preserve human-authored content through regeneration, the writer respects **protected blocks**:

```mdx
<!-- :protected:start editorial-note -->

This section was written by hand after community feedback; do not regenerate.

<!-- :protected:end editorial-note -->
```

The writer, when reading an existing page as context (step 5 of §8.3), extracts protected blocks and re-emits them **verbatim in place** after regenerating the surrounding prose. The block's `name` (e.g. `editorial-note`) must be unique within a page; the writer logs a warning if it cannot locate the same-named block in its output.

This is intentionally minimal:
- No merge algorithm, no heuristic "is this paragraph still valid."
- Protected blocks are the only durable island of human authorship within a generated page.
- If you need substantial human-authored prose, prefer to edit the **template body** (which always influences regeneration) rather than the page.

### 8.6 Stub creation

`pipeline stub` is intentionally *not* a command in this design — stubs are just template files. The mechanical equivalent is:

```bash
bun pipeline template new weapons/m4a1          # creates templates/weapons/m4a1.md
bun pipeline write weapons/m4a1                 # creates site/content/weapons/m4a1.mdx
```

If you want to commit a template without writing the page yet, simply commit the template and skip the `write` step. The page will appear in curator's output (§9) as an "empty stub awaiting fill."

### 8.7 Writer implementations

Two concrete `Writer` implementations ship in MVP, both conforming to:

```ts
interface Writer {
  write(input: {
    topicPath: string;
    template: Template;          // merged with category default
    agentsMd: string;
    extractions: Extraction[];   // already filtered by sources.mode
    existingPage?: string;       // raw mdx, for protected block preservation
  }): Promise<{
    mdx: string;                 // the complete page body (frontmatter auto-added)
    citedSourceIds: string[];    // for frontmatter + indexes
    missingSections: string[];   // sections that triggered the placeholder block
    warnings: string[];          // protected block mismatches, etc.
  }>;
}
```

**`SdkWriter`** — `generateText` via OpenRouter + a small local tool set (read adjacent pages, list available components). One-shot per page. Default.

**`OpenCodeWriter`** — shells out to `opencode run --prompt-file ...` with a prompt referencing `AGENTS.md` and the assembled context. Uses OpenCode's agent loop. Slower, potentially higher quality on complex pages.

Selection: `bun pipeline write <path> --writer sdk|opencode`. Default `sdk`.

Both writers produce the same frontmatter shape; the only difference is the prose body quality/characteristics.

---

## 9. Curator & Coverage

The Curator is the only LLM-assisted planner in the system, and it produces **advisory output only** — it never mutates templates, sources, or pages. Its purpose is to close the feedback loop between the facts layer (extractions) and the intent layer (templates), surfacing gaps in both directions.

### 9.1 Purpose

After the switch to templates-first architecture (§4), the classic "what pages should exist?" question is answered by the filesystem. The Curator's role is narrower and more useful:

1. **Propose new topics** that extractions suggest but templates don't cover.
2. **Flag sparse coverage** — templates with no supporting extractions (page would be empty or speculative).
3. **Detect stale pages** — where upstream inputs have changed since the page was last generated.
4. **Flag empty stubs** — templates that exist but haven't been `write`ten.
5. **Detect taxonomy drift** — near-duplicate template paths, inconsistent topic naming in extractions.

The output is a single markdown file, `indexes/coverage.md`, designed to be read by humans in PR review and by OpenCode agents as context when the user asks "what should we work on next?"

### 9.2 When to run

```bash
bun pipeline plan
```

- Always safe: read-only apart from writing `indexes/coverage.md`.
- Cheap: one `FORMAT` model call per "topic cluster" the curator identifies, plus deterministic scans. Typical total cost: <$0.10 per run for a wiki with ~50 sources.
- Idempotent: running twice in a row with no intervening changes produces the same output.

### 9.3 `coverage.md` format

```markdown
---
generatedAt: 2026-04-29T11:04:00Z
generatorModel: google/gemini-2.5-flash
generatorVersion: v1
templatesScanned: 47
sourcesScanned: 52
pagesScanned: 47
---

# Coverage report

_Advisory only. Run `bun pipeline template new <path>` or edit templates/
manually to act on suggestions._

## Proposed new topics

Extractions emit `proposedNewTopics` when the extractor sees content that
doesn't fit any existing template path. Topics listed here have been proposed
by 2+ independent extractions.

### seasons/season-3  (4 proposing sources)

- youtube/abc123: "Season 3 everything you need to know"
- youtube/def456: "Season 3 meta tier list"
- reddit/xyz789: "Season 3 mega thread"
- official/post-442: "Season 3 patch notes"

**Suggested action:** `bun pipeline template new seasons/season-3 --from-extractions`

**Suggested outline (curator guess):** Overview · Timeline · Theme · New
Weapons · New Enemies · Map Changes · Limited-Time Events · Meta Shifts · Sources

### mechanics/heat-system  (2 proposing sources)

- youtube/abc123: section around overheat mechanic
- youtube/def456: mentions overheat timing

**Suggested action:** `bun pipeline template new mechanics/heat-system --from-extractions`

## Single-source proposed topics (low signal)

These topics were proposed by only one extraction. Consider ingesting more
sources before templating, or dismiss if the source is unreliable.

- `weapons/experimental-smg` — from youtube/ghi789 only.

## Templates without extractions

Templates exist but no extraction tags their topic. The generated page will
contain only the `No sources available yet` placeholder for every section.

- `templates/weapons/legendary-sword.md` — no extractions tagged `weapons/legendary-sword`.
  **Suggested action:** ingest sources, or remove template.

## Thin coverage (1 source only)

Page can be written but will be single-sourced. Consider finding corroboration.

- `weapons/scar` — only `youtube/jkl012` supports this topic.

## Stale pages

Page's inputs have changed since `lastGeneratedAt`.

- `weapons/m4a1` — source `youtube/abc123` re-extracted 2026-04-26, page last
  generated 2026-04-22.
  **Suggested action:** `bun pipeline write weapons/m4a1`

- 4 pages stale due to AGENTS.md modification on 2026-04-28.
  **Suggested action:** `bun pipeline write --all-stale`

## Empty stubs

Templates exist; no generated page yet.

- `templates/strategies/endgame.md` — committed 2026-04-20, no page.
  **Suggested action:** `bun pipeline write strategies/endgame`

## Near-duplicate template paths

Pairs that may be the same topic written two ways. Curator uses fuzzy string
match plus semantic similarity.

- `templates/mechanics/heat.md` ↔ `templates/mechanics/heat-system.md`  (similarity 0.89)
  **Suggested action:** `bun pipeline template rename mechanics/heat mechanics/heat-system`

## Extraction topic-tag drift

Topics mentioned in extractions that don't match any template path exactly
(but do fuzzy-match one). Potential typos from the extractor that should be
corrected.

- Extractions tagged `weapons/m4` (3 sources) but template path is `weapons/m4a1`.
  **Suggested action:** hand-edit extraction frontmatter, or adjust extractor
  prompt examples.

## Summary

- **Act on now:** 2 proposed topics strongly recommended, 1 rename, 5 stale pages.
- **Watch:** 3 thin-coverage templates, 1 single-source proposed topic.
- **No action:** system is otherwise consistent.
```

### 9.4 Curator inputs

The curator reads (no LLM calls for this step):

```
templates/**/*.md                     → set of valid template paths and categories
sources/**/extraction.md frontmatter  → set of (sourceId, topics[], proposedNewTopics[])
site/content/**/*.mdx frontmatter     → set of (pagePath, lastGeneratedAt, sourceHashes)
indexes/*.jsonl                       → precomputed joins (refreshed by `pipeline index`)
AGENTS.md mtime + hash                → input for staleness detection
```

These are aggregated into a compact "state summary" JSON structure (typically under 20KB) and passed to the curator LLM along with the curator prompt (`pipeline/prompts/curator.md`). The LLM's job is narrow: cluster proposed new topics, suggest outlines, and generate the fuzzy-match similarity flags and prose narrative.

Deterministic sections of the report (stale pages, empty stubs, templates-without-extractions) are computed in TypeScript with no LLM involvement and stitched in after the LLM pass.

### 9.5 Curator output handling

The curator writes exactly one file: `indexes/coverage.md`. It is **committed** alongside other index files. Its contents are overwritten on every `plan` run — previous versions live only in git history.

PR workflows can reference this file during review to understand what gaps a given ingestion / extraction left open. A natural human loop:

```
bun pipeline ingest youtube <new video>   # also auto-extracts
bun pipeline index
bun pipeline plan                         # updates coverage.md
# review coverage.md — decide which proposed topics to template
bun pipeline template new seasons/season-3 --from-extractions
bun pipeline write --all-stale
git add -A && git commit -m "Add Season 3 coverage"
```

---

## 10. Aggregations

Aggregations solve the "season/patch/event page" problem: how do pages that summarize other pages stay current without being regenerated every time something they reference changes? The answer is **build-time queries** over the Nextra page graph, rendered by a custom `<Aggregation>` React component.

### 10.1 The core tension

Consider the Season 3 page. It should list every weapon introduced in Season 3, every enemy, the map changes, and so on. Two approaches:

| Approach | Pros | Cons |
|---|---|---|
| **Materialize at write time** — writer bakes the list into MDX | Self-contained; MDX is readable as plain text | Adding a new weapon with `seasonAdded: 3` requires regenerating the Season 3 page; easy to drift stale |
| **Build-time query** — MDX emits `<Aggregation query={{seasonAdded:3}} />` that Next.js resolves at build | Always current; no regen dependency | Requires a custom React component; MDX is slightly less "plain text" |

This design chooses **build-time query** for aggregations. Prose (Overview, Theme, Meta shifts) is still LLM-written from extractions. Only *lists* derived from frontmatter are computed.

### 10.2 Template declaration

A template declares aggregations in its frontmatter:

```yaml
---
title: Season 3
category: seasons
sections:
  - overview
  - timeline
  - theme
  - aggregations            # placeholder; replaced by the writer with all aggregation blocks
  - meta-shifts
  - sources
aggregations:
  - id: new-weapons
    title: "New Weapons This Season"
    description: "Weapons introduced in Season 3."
    query:
      category: weapons
      seasonAdded: 3
    render: grid
    sort: title
  - id: new-enemies
    title: "New Enemies"
    query:
      category: enemies
      seasonAdded: 3
    render: list
  - id: map-changes
    title: "Map Changes"
    query:
      category: maps
      seasonModifiedIn: 3
    render: list
    empty: "No map changes recorded for Season 3."
---
```

**Aggregation field semantics:**

| Field | Type | Required? | Description |
|---|---|---|---|
| `id` | string | yes | Unique within this template; used as React key |
| `title` | string | yes | Heading rendered above the aggregation |
| `description` | string | no | Optional short prose before the list |
| `query` | object | yes | Frontmatter-field equality filter over all pages |
| `render` | enum | no | `list` (default), `grid`, `table` |
| `sort` | string | no | Frontmatter field to sort by; default `title` |
| `limit` | number | no | Truncate to N; default unlimited |
| `empty` | string | no | Message shown when query returns zero results; default "No matching pages." |

The `query` object is an **equality map** over frontmatter fields. Multi-value matching is handled like this:

```yaml
query:
  category: weapons
  seasonAdded: 3          # single value: exact match
  tags: [assault-rifle]   # array value: page.tags must include all listed values
```

This keeps the query surface small and debuggable. Complex filtering is out of MVP scope.

### 10.3 Writer behavior for aggregations

When a template has `aggregations` in frontmatter and `- aggregations` in `sections`, the writer emits an MDX block like this at the `aggregations` position:

```mdx
## New Weapons This Season

Weapons introduced in Season 3.

<Aggregation id="new-weapons"
             query={{ category: "weapons", seasonAdded: 3 }}
             render="grid"
             sort="title"
             empty="No matching pages." />

## New Enemies

<Aggregation id="new-enemies"
             query={{ category: "enemies", seasonAdded: 3 }}
             render="list"
             sort="title"
             empty="No matching pages." />

## Map Changes

<Aggregation id="map-changes"
             query={{ category: "maps", seasonModifiedIn: 3 }}
             render="list"
             sort="title"
             empty="No map changes recorded for Season 3." />
```

The writer does **not** inline any content from the queried pages — that's the component's job at build time. The writer's only responsibility around aggregations is to faithfully translate template declarations into `<Aggregation>` JSX.

Aggregation declarations never consume extraction facts. They're purely a view over other pages' frontmatter.

### 10.4 `<Aggregation>` component contract

The component lives at `site/components/Aggregation.tsx`. Implementation sketch:

```tsx
// Resolves at Next.js build time — no client-side runtime query.
import { allPages } from "@/lib/content";   // typed page index, built from Nextra content
import Link from "next/link";

interface AggregationProps {
  id: string;
  query: Record<string, string | number | boolean | Array<string | number>>;
  render?: "list" | "grid" | "table";
  sort?: string;
  limit?: number;
  empty?: string;
}

export function Aggregation({ id, query, render = "list", sort = "title", limit, empty }: AggregationProps) {
  const matches = allPages
    .filter(page => matchesQuery(page.frontmatter, query))
    .sort(bySortKey(sort))
    .slice(0, limit);

  if (matches.length === 0) {
    return <p className="aggregation-empty">{empty ?? "No matching pages."}</p>;
  }

  // render: list | grid | table — omitted for brevity
  return <AggregationRenderer render={render} pages={matches} />;
}
```

`allPages` is a build-time-computed array of `{ slug, frontmatter }` for every MDX file under `site/content/`. It is produced by a small helper in `site/lib/content.ts` that scans the content directory at build time using Nextra's page tree API.

### 10.5 Consequences of this design

- **Adding a new weapon page tagged `seasonAdded: 3` automatically appears on the Season 3 page at the next deploy** — no pipeline regeneration required. This is the primary win.
- **Renaming frontmatter fields requires careful coordination** (e.g., switching from `seasonAdded` to `introducedSeason` needs updates to every template that uses it in a query). Worth discipline; field names should be stable.
- **The component is build-time only.** No runtime JavaScript is shipped to the reader for the query — just the rendered HTML. Keeps pages fast.
- **Aggregation render logic is versioned in the site, not the pipeline.** Styling and layout changes happen in `site/components/Aggregation.tsx` and are reflected on next build, no writer re-run needed.

---

## 11. Nextra Integration

The site layer is a Next.js 15 + Nextra v4 application configured for **static export** to Cloudflare Pages. This section covers the Next.js / Nextra specifics the pipeline must respect or interoperate with.

### 11.1 Static export configuration

`site/next.config.mjs`:

```js
import nextra from "nextra";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
  defaultShowCopyCode: true,
  search: { codeblocks: false }   // FlexSearch over prose only
});

export default withNextra({
  output: "export",               // pure static HTML to out/
  images: { unoptimized: true },  // required for output: 'export'
  basePath: process.env.WIKI_BASE_PATH ?? "",
  trailingSlash: true,            // Cloudflare Pages friendliest
  reactStrictMode: true,
});
```

Key choices:

- **`output: "export"`** — produces pure static HTML in `site/out/`. No Node server required at runtime. Cloudflare Pages auto-detects and serves.
- **`images.unoptimized: true`** — Next.js image optimization needs a runtime; disabled for static export. Image variant generation is handled at pipeline-ingest time (see §11.4).
- **`basePath`** — configurable via env var. Empty string for Cloudflare Pages root domain; can be `/last-z-wiki` if deployed to a GitHub Pages project path.
- **`trailingSlash: true`** — Cloudflare Pages handles directory-style URLs cleanly; avoids 307 redirect loops seen under some Pages configurations.

### 11.2 Content collection layout

Nextra v4 uses an App Router content directory. The pipeline writes MDX into this tree:

```
site/content/
├── _meta.js                           # top-level sidebar spec
├── index.mdx                          # landing page (from templates/index.md)
├── weapons/
│   ├── _meta.js                       # auto-generated from template frontmatter
│   ├── index.mdx                      # from templates/weapons/index.md
│   ├── m4a1.mdx                       # from templates/weapons/m4a1.md
│   ├── ak47.mdx
│   └── _drafting-notes.md             # gap notes; excluded from content (see below)
├── enemies/
│   ├── _meta.js
│   └── ...
└── ...
```

**Files excluded from the Nextra content collection** (won't appear as pages or in search):

- Any file whose name starts with `_` (Nextra convention) — covers `_meta.js` and `_drafting-notes.md`.
- Any file listed in `contentDirExclude` of `next.config.mjs` (reserved hook; empty in MVP).

The pipeline's writer always writes `_drafting-notes.md` with the leading underscore — the exclusion is automatic.

### 11.3 `_meta.js` auto-generation

Nextra reads `_meta.js` per directory to control sidebar order, labels, and visibility. The pipeline **owns these files**; hand-edits will be overwritten.

Generation is done by `bun pipeline index` (§6.4). Algorithm:

```
for each directory D under site/content/:
  pages = [mdx files directly under D]
  for each page:
    key   = filename without .mdx extension (e.g. "m4a1")
    meta  = {
      title: template.label ?? template.title,
      display: template.hidden ? "hidden" : undefined,
      theme: { ... }  // per-category accents if configured
    }
    order = template.order ?? Infinity   (infinity == alphabetical tail)

  sort pages by (order asc, key alpha asc)
  write D/_meta.js as `export default { ... }` in sorted order
```

Example generated `_meta.js`:

```js
// GENERATED by pipeline index — do not edit.
// To change ordering or labels, edit the corresponding templates/<path>.md frontmatter.
export default {
  "index":    { title: "Overview" },
  "m4a1":     { title: "M4A1" },
  "ak47":     { title: "AK-47" },
  "scar":     { title: "SCAR" },
  "legendary-sword": { title: "Legendary Sword", display: "hidden" }
};
```

Top-level `site/content/_meta.js` is generated from the category directories, ordered by each category's `order` field in `templates/_category/<cat>.md` frontmatter:

```js
// GENERATED
export default {
  "index": { title: "Home", theme: { breadcrumb: false } },
  "weapons":    { title: "Weapons" },
  "enemies":    { title: "Enemies" },
  "maps":       { title: "Maps" },
  "mechanics":  { title: "Mechanics" },
  "seasons":    { title: "Seasons" },
  "strategies": { title: "Strategies" },
  "lore":       { title: "Lore" }
};
```

### 11.4 Image handling

`output: "export"` disables Next.js's runtime image optimization. The pipeline pre-generates image variants at ingest time so MDX can reference optimized assets directly.

Pipeline behavior for `bun pipeline ingest image <path>` (and the inbox image flow):

1. Compute SHA-256 content hash of the file.
2. Copy the original to `site/public/media/<hash>/original.<ext>`.
3. Generate three variants with `sharp`:
   - `site/public/media/<hash>/thumb.webp` (max 320px wide, quality 80)
   - `site/public/media/<hash>/md.webp` (max 800px wide, quality 82)
   - `site/public/media/<hash>/lg.webp` (max 1600px wide, quality 85)
4. Write `sources/images/<hash>/source.json` with `assetPaths` pointing at all variants.
5. Run vision extraction (§5.3).

MDX pages reference images via a thin wrapper component:

```mdx
<Screenshot id="a9c2b1d4" alt="M4A1 loadout screen showing Fast Mag II equipped" />
```

The `<Screenshot>` component (`site/components/Screenshot.tsx`) resolves the hash against `site/public/media/<hash>/` and emits a responsive `<picture>` element with WebP + fallback. This keeps MDX readable (no long asset paths) and centralizes the responsive logic.

Images that live in repository but are **not** backed by a `sources/images/<hash>/` entry (e.g., decorative assets in `site/public/decor/`) use plain `<img>` and are not processed by the pipeline.

### 11.5 Search

Nextra v4 ships with built-in FlexSearch indexing over MDX content. In MVP:

- Search is enabled with default config.
- Codeblocks are excluded from the index (`search: { codeblocks: false }`) — the wiki is content, not reference docs for code.
- `_meta.js` and `_drafting-notes.md` are excluded automatically via the `_` prefix.
- Upgrade path to Pagefind is left open for a future phase if FlexSearch relevance proves insufficient; no architectural coupling prevents the swap.

### 11.6 Cloudflare Pages deployment

The only CI workflow in MVP: `.github/workflows/build-and-deploy.yml`.

```yaml
name: Build and deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run --cwd site build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: last-z-survival-shooter-wiki
          directory: site/out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

The workflow:
- Does **not** run any pipeline commands. Deployment is purely Nextra build + upload.
- Does not run the pipeline's LLM calls. LLM work happens locally before commit.
- Runs on every push to `main`. PR previews are handled by Cloudflare Pages' automatic preview deployment (triggered on any branch push when linked to the repo).

GitHub Pages fallback: swap the `Deploy to Cloudflare Pages` step for the standard `actions/deploy-pages@v4` flow. Set `basePath` appropriately via env.

---

## 12. OpenCode-as-Driver Mode

The pipeline is designed to be driven in two equivalent ways: a human running CLI commands directly, or OpenCode orchestrating those same commands in response to a high-level prompt. This section specifies how OpenCode (or any similar agent) interacts with the pipeline, and what invariants the pipeline exposes to make agent-driven use reliable.

### 12.1 Design invariant

**There is no agent-specific code path in the pipeline.** Every action OpenCode takes is a regular CLI command, file read, or file edit that a human could do identically. The only "agent mode" artifact is `AGENTS.md` itself — a document instructing the agent on conventions.

This keeps the pipeline honest: anything an agent does is reproducible and auditable by running the same commands manually.

### 12.2 `AGENTS.md` — the agent contract

`AGENTS.md` lives at the repository root and is the first file any agent (OpenCode, Claude Code, Gemini CLI, etc.) is expected to read. It defines:

1. **Site-wide writing rules** — tone, voice, citation format, prohibited behaviors.
2. **Pipeline command reference** — short summary of every command (references §6 of this spec for the authoritative version).
3. **Standard workflows** — canonical recipes for common operations.
4. **Safety rules** — commands that must never be run autonomously, files that must never be hand-edited.

The file is committed and versioned. Changes to `AGENTS.md` are themselves stale-triggering inputs for page regeneration (see `agentsHash` in §8.2).

### 12.3 Standard workflow recipes

`AGENTS.md` defines canonical recipes that OpenCode can follow verbatim. Three worth spelling out here:

**Recipe A — Ingest new video and update affected pages:**
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

**Recipe B — Update wiki for a new season:**
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

**Recipe C — Style/tone refactor:**
```
1. Edit AGENTS.md (tone/voice rules).
2. bun pipeline rewrite --all
   (uses FORMAT model only; cheap; no extraction cost)
3. Spot-check a few pages; commit if satisfied.
```

These recipes are not hardcoded in the pipeline — they are *documentation* OpenCode reads. Any of them can be executed by a human identically.

### 12.4 Safety rules for agents

`AGENTS.md` prohibits the following agent behaviors:

- **No force re-extraction without user consent.** `pipeline extract --all` or `pipeline reextract --all` cost real money (tens of dollars for a large corpus). The agent must ask before running them.
- **No hand-edits to generated files.** `site/content/**/*.mdx` (except inside `:protected:` blocks), `site/content/**/_meta.js`, and `indexes/**/*` are pipeline-owned. Edits there will be overwritten.
- **No git force-push, no rewrites of main branch history, no deletion of `sources/**`** without explicit user instruction.
- **No PR creation without the user's go-ahead.** Branch and commit freely; `gh pr create` only when the user says so.
- **Never commit files that may contain secrets.** `.env`, credentials, API-key-bearing config. Standard .gitignore hygiene applies.
- **Never modify `AGENTS.md` itself in response to a style complaint** without confirming the change is intentional with the user — it has wiki-wide consequences via the rewrite flow.

### 12.5 What OpenCode provides that manual mode doesn't

The pipeline is complete without OpenCode. But OpenCode shortens the loop for these cases:

- **Natural-language entry points.** "Update the wiki for Season 3" is a single prompt instead of the multi-command recipe B.
- **Research + ingest fusion.** OpenCode can web-search for relevant Season 3 sources, propose them, and run ingestion on approval — cutting out manual URL gathering.
- **Context-aware template editing.** After `template new --from-extractions`, OpenCode can read the generated brief, compare against the user's stated intent, and suggest edits.
- **Review assistance.** OpenCode can diff the candidate commit, summarize the changes, and explicitly list new claims for human verification.

### 12.6 Invocation pattern

When `--writer opencode` is set, the `OpenCodeWriter` implementation invokes:

```bash
opencode run \
  --prompt-file pipeline/prompts/write-page.md \
  --context-file templates/<path>.md \
  --context-file AGENTS.md \
  --context-file <each cited extraction.md> \
  --output-file site/content/<path>.mdx \
  --model $MODEL_FORMAT \
  --no-network
```

`--no-network` prevents the agent from reaching beyond the provided context mid-write. The `write-page.md` prompt explicitly instructs the agent to produce exactly one file (the MDX page) and to never modify other files.

This keeps OpenCode-driven writing as deterministic as SDK-driven writing for the individual-page operation. OpenCode's broader agentic capabilities (multi-file edits, tool use) come into play only at the orchestration level, driven by the user's natural-language prompt to OpenCode — not inside the `write` step itself.

---

## 13. Trust, Review & Audit Model

The wiki is publishing content derived from AI-assisted extraction and writing, so every change reaching production must be reviewable, traceable, and reversible. This section specifies how that is enforced operationally.

### 13.1 Review gate: pull request on `main`

- The `main` branch is the source of truth for what's deployed.
- All changes — template edits, source ingestions, extraction updates, generated page rewrites — land on `main` via pull request, reviewed by a human.
- Direct pushes to `main` are discouraged but not technically blocked in MVP (single-maintainer repo). A branch protection rule requiring PR + review can be enabled any time without changing the pipeline.
- The GitHub Action builds and deploys on every push to `main`. Cloudflare Pages' preview-URL-per-branch feature is used for PR previews automatically (no config needed beyond linking the repo in CF Pages).

### 13.2 What lives in a single PR

A typical "ingest one YouTube video" PR contains, all in one review:

```
sources/youtube/<id>/source.json               (new)
sources/youtube/<id>/raw.txt                   (new)
sources/youtube/<id>/extraction.md             (new — the expensive LLM output)
sources/index.jsonl                            (one line appended)
indexes/sources-to-pages.jsonl                 (updated)
indexes/pages-to-sources.jsonl                 (updated)
indexes/coverage.md                            (updated)
templates/<possibly-new-paths>.md              (if new topics accepted)
site/content/<affected-pages>.mdx              (regenerated)
site/content/**/_meta.js                       (if template order/label changed)
site/content/**/_drafting-notes.md             (if missing-source gaps flagged)
```

All of these are text diffs. A reviewer can, within a single PR, see: the raw transcript, the structured extraction (and compare its claims to the raw), the updated coverage report, the new templates, the changed page prose, and the gap notes. End-to-end traceability in one review.

### 13.3 Committed vs gitignored

| Committed | Gitignored |
|---|---|
| `templates/**` | `site/out/**` (next build output) |
| `sources/**` (including `raw.*`, `extraction.md`, `source.json`) | `site/.next/**` |
| `indexes/**` | `.cache/**` |
| `site/content/**` (including `_drafting-notes.md`, `_meta.js`) | `node_modules/**` |
| `site/components/**`, `site/public/**`, `site/lib/**` | `.env`, `.env.local` |
| `pipeline/**` | `*.log` |
| `AGENTS.md`, `README.md`, `docs/**` | `.opencode/**` (local opencode session data, if any) |
| `inbox/**` (note/screenshot source materials) | `bun.lock` **is** committed |
| `package.json`, `tsconfig*.json`, `next.config.mjs`, `.github/**` | |

Rationale reminders:
- `site/content/**/*.mdx` is committed despite being generated, so reviews show the actual page diff and so the site is buildable without running the pipeline.
- `_drafting-notes.md` is committed so gaps persist across runs and are visible in PRs.
- `inbox/**` is committed because dropped notes/screenshots are authored content, not scratch data. Once ingested, inbox files *stay* there (they are the source material).

### 13.4 Auditable claim chain

For any statement on any generated page, a reviewer can trace:

```
page line in site/content/weapons/m4a1.mdx
   └── <SourceCite id="youtube/abc123xyz" /> or prose reference
         └── sources/youtube/abc123xyz/extraction.md
               └── "## weapons/m4a1" section, specific claim
                     └── [timestamp 2:34] in sources/youtube/abc123xyz/raw.txt
                           └── source.json.url → original YouTube video
```

Each step is a committed file in the repository. No runtime lookups, no external databases. `pipeline audit` (§6.4) mechanically verifies that every link in this chain is valid.

### 13.5 Auditor workflows

**Human auditor reviewing a PR:**
1. Open the PR diff.
2. Read `extraction.md` changes; for any surprising claim, open the adjacent `raw.txt` / `raw.md` / `raw.json` and locate the evidence.
3. Read `site/content/**/*.mdx` diffs; check that new prose corresponds to claims in cited extractions.
4. Read `indexes/coverage.md` to see any gaps the writer flagged.
5. Read `_drafting-notes.md` for explicit gap notes.
6. Approve or request changes.

**LLM auditor** (future, optional — not implemented in MVP):
A `pipeline audit-llm` command could ask a cheap model to verify, for a sample of claims, that the cited extraction supports the claim. Deferred to a later phase.

### 13.6 Reversibility

Every change is a git commit. Recovery procedures:

- **Bad extraction committed** → `git revert` the commit; `source.json.extraction.status` reverts to prior state; `pipeline extract <id>` regenerates from the (unchanged) `raw.txt`.
- **Bad page write** → `git revert`; or `pipeline write <path>` re-runs from current inputs.
- **AGENTS.md change produced bad tone across wiki** → `git revert` that commit; `pipeline rewrite --all` regenerates with the reverted rules.
- **Accidentally deleted a template** → `git checkout <commit> -- templates/<path>.md`.
- **Source URL broke (404 upstream)** → `raw.txt` is still in the repo; extractions and pages continue to function on committed content.

The absence of external state (no DB, no live API dependencies during build) means the entire wiki is reproducible from any commit of the repository.

### 13.7 Secret management

- `.env` and `.env.local` are gitignored.
- `.env.example` is committed with the list of required variable names and stub values.
- Required secrets (MVP):
  - `OPENROUTER_API_KEY` — for pipeline LLM calls
  - `YOUTUBE_API_KEY` — for YouTube metadata (title, author, publishedAt); transcripts come via yt-dlp without auth
  - `REDDIT_USER_AGENT` — not a secret but required by Reddit's public API ToS
- Cloudflare Pages deploy secrets (`CF_API_TOKEN`, `CF_ACCOUNT_ID`) live in GitHub Actions repository secrets, never in the repo.

---

## 14. Phased Roadmap

The build is divided into phases that each produce a working, reviewable increment. Each phase is small enough to scope a single implementation plan against, and ships something usable at the end.

### Phase 0 — Skeleton (~½ day)

**Goal:** repository scaffolded, empty wiki deployed, knowledge layer types defined.

**Deliverables:**
- `package.json` bun workspace root; `site/` and `pipeline/` workspace members created.
- Next.js 15 + Nextra v4 initialized in `site/`; default theme config; single placeholder home page renders.
- `next.config.mjs` configured for static export; `bun run --cwd site build` produces `site/out/`.
- `.github/workflows/build-and-deploy.yml` wired to Cloudflare Pages; empty wiki deploys on first push to `main`.
- `templates/_category/` with category default files (weapons, enemies, maps, mechanics, seasons, strategies, lore) — frontmatter + voice-hint bodies.
- `templates/index.md` for the landing page brief.
- 2–3 hand-crafted seed templates as style references (e.g., one weapon, one enemy, one mechanic).
- `AGENTS.md` v0 with site-wide rules, pipeline command summary, standard workflow recipes.
- `pipeline/` skeleton with `cli.ts` (empty commands), `llm/openrouter.ts`, `llm/models.ts`, typed schemas in `llm/schemas.ts` for `Source`, `Extraction`, `Template`.
- `.env.example` with required variable names.
- One hand-crafted example `extraction.md` per source type, for testing the writer against.

**Acceptance:** visit the deployed Cloudflare Pages URL and see a live (empty) site with category nav in the sidebar. `bun pipeline --help` lists all planned commands (stubs only).

### Phase 1 — YouTube vertical slice (~1–2 days)

**Goal:** end-to-end ingest → extract → write for a single YouTube video, producing a merge-ready PR branch.

**Deliverables:**
- `pipeline/src/ingest/youtube.ts` — yt-dlp + YouTube Data API integration.
- `pipeline/src/extract/source-extractor.ts` — generic text-source extractor; prompt in `pipeline/prompts/extract-source.md`.
- `pipeline/src/write/sdk-writer.ts` — SDK writer with tool set (read adjacent pages, list components).
- `pipeline/src/util/git.ts` — branch + commit helpers.
- Writer prompt in `pipeline/prompts/write-page.md`.
- Hash-based caching implemented; re-running `ingest` on the same URL is a no-op.
- `pipeline index` rebuilds indexes from filesystem scan.

**Acceptance:**
```
bun pipeline ingest youtube https://www.youtube.com/watch?v=<real video about m4a1>
bun pipeline template new weapons/m4a1 --from-extractions
# edit the generated template body if needed
bun pipeline write weapons/m4a1
bun pipeline index
git status
```
Produces: a branch containing source files, an extraction, a template, one generated page, and updated indexes. All reviewable as one PR. Page renders correctly in `bun run --cwd site dev`.

### Phase 1.5 — Curator + scaffolders (~½ day)

**Goal:** close the gap-feedback loop; make "what's missing?" answerable from the CLI.

**Deliverables:**
- `pipeline/src/plan/curator.ts` — implements §9.
- `pipeline/src/templates/scaffolder.ts` — `template new` and `template new --from-extractions`.
- `pipeline/src/templates/linter.ts` — `template check`.
- `indexes/coverage.md` generation wired up.

**Acceptance:** ingest 3–4 sources that propose a new topic (e.g., Season 3). Run `pipeline plan`. The coverage report flags the new topic, suggests a template path and outline. Accept the suggestion via `template new --from-extractions`. `pipeline write` produces a coherent page.

### Phase 2 — Images + inbox (~1 day)

**Goal:** screenshot-driven updates; hands-off inbox processing.

**Deliverables:**
- `pipeline/src/ingest/inbox.ts` and `pipeline/src/ingest/image.ts`.
- `pipeline/src/extract/vision-extractor.ts` with prompt in `pipeline/prompts/extract-image.md`.
- `sharp` integration for variant generation.
- `site/components/Screenshot.tsx` component.
- `AGENTS.md` updated with screenshot-citation conventions.

**Acceptance:** drop a gameplay screenshot into `inbox/`. Run `pipeline ingest inbox`. It gets hashed, variants generated, moved to `site/public/media/`, vision-extracted, and registered. `pipeline write --all-stale` pulls the screenshot's claims into the relevant page with a `<Screenshot>` embed.

### Phase 3 — OpenCode-as-driver mode (~½ day)

**Goal:** `--writer opencode` works end-to-end; natural-language orchestration is a documented workflow.

**Deliverables:**
- `pipeline/src/write/opencode-writer.ts` — shells out to `opencode run` with appropriate flags.
- `AGENTS.md` expanded with full recipe library.
- Brief side-by-side comparison of SDK vs OpenCode writer outputs on 2–3 pages; decision on default codified in `AGENTS.md`.

**Acceptance:** run `bun pipeline write weapons/m4a1 --writer opencode`. Output is structurally equivalent to SDK writer output. Also: prompt OpenCode via its CLI with "update the wiki for Season 3 using [URL list]" and observe recipe B (§12.3) executing with appropriate user confirmations.

### Phase 4 — Additional sources (priority order, ~1 day each)

Each sub-phase adds one source ingester + wires it into `pipeline ingest`. Priority:

1. **Community wikis** (`ingest wiki <url>`): highest volume of existing info; Readability + Turndown already well-trodden.
2. **Reddit** (`ingest reddit <url>`): public JSON endpoint, no auth; thread + top-20 comments.
3. **Steam** (`ingest steam <url>`): News API for patch notes and dev posts.
4. **Official dev sources** (`ingest official <url>`): RSS-first where available, HTML fallback.
5. **Datamining** — deferred; see §15.

Each source gets its own acceptance test: one real URL of that type ingests, extracts, and feeds into at least one generated page.

### Phase 5 — Maintenance tooling (~1 day)

**Goal:** long-running wiki hygiene commands.

**Deliverables:**
- `pipeline audit` — implements §6.4 audit.
- `pipeline verify-citations` — HTTP HEAD on every committed source URL; reports broken links.
- `pipeline refresh` — combined re-fetch + re-extract-stale + re-write-stale flow.
- `pipeline affected <sourceId>` — read-only source-to-pages lookup.

**Acceptance:** on a wiki with ~20 ingested sources, `pipeline audit` completes with zero errors; `pipeline verify-citations` flags any broken upstream URLs; `pipeline refresh` produces a clean branch.

### Phase 6 — Nice-to-haves (no time commitment)

Deferred until earlier phases produce real-world friction worth addressing:

- Scheduled GitHub Action for periodic `pipeline refresh` (weekly cadence).
- Pagefind swap-in if FlexSearch search relevance is weak.
- Interactive MDX components (damage calculators, loadout planner).
- Structured game data tables under `data/*.yaml` + MDX helpers.
- LLM-assisted audit (`pipeline audit-llm`) verifying claim-to-evidence alignment.
- i18n support via Nextra's built-in mechanism.
- Datamining ingest (if/when game files are accessible and ToS permits).

### 14.1 Phasing principle

**Every phase produces a mergeable PR that improves the live wiki.** No phase is "internal-only scaffolding that must be completed before anything is useful." Phase 0 deploys a working empty site. Phase 1 produces a real page from a real video. By the end of Phase 2, the full authoring loop (video → screenshot → page) works. Later phases broaden the input surface without blocking any earlier capability.

---

## 15. Open Questions & Deferred Decisions

This section captures deliberate deferrals — decisions that we chose not to settle in MVP but that will need resolution as the wiki grows. Each item includes the current position, the trigger that should prompt revisiting it, and the options that will be on the table.

### 15.1 Structured game data tables (`data/*.yaml`)

**Current position:** not in MVP. Weapon stats, enemy HP, spawn tables live as prose and tables inside each entity's MDX page, authored by the writer from extraction claims.

**Trigger to revisit:** when the same stat (e.g. M4A1 reload time) needs to be referenced from three or more pages (weapon page, season page, patch notes page, strategy guide) and keeping them in sync becomes painful.

**Options on the table:**
- Typed YAML under `data/weapons.yaml`, `data/enemies.yaml`, etc., with a Zod schema. MDX imports via a helper and renders stat blocks.
- Embed structured data in each page's frontmatter and expose it via aggregations.
- Keep doing prose-in-MDX indefinitely if the pain never materializes.

### 15.2 Datamining ingest

**Current position:** not in MVP. Not currently a supported source type.

**Trigger to revisit:** if/when the game's data files are accessible, parseable, and the developer's ToS permits redistribution of extracted values.

**Options on the table:**
- Custom parser producing structured YAML under `sources/datamine/<version>/` with `raw.*` + `extraction.md`.
- Datamine as a sub-type of `inbox` — you hand-craft extractions from datamining tools and feed them in as notes.
- Avoid entirely if ToS forbids; rely on developer-published stats and community corroboration.

### 15.3 Discord ingestion

**Current position:** not in MVP. Deferred indefinitely.

**Trigger to revisit:** if/when a well-moderated community Discord becomes a primary source for patch discussion not surfaced elsewhere.

**Options on the table:**
- A one-shot scraper using a user/bot token with explicit server admin consent; scrapes to `raw.json`; otherwise behaves like any other source.
- Manual inbox flow: you copy relevant messages into a note and ingest via `inbox`.

### 15.4 Scheduled automation

**Current position:** not in MVP. Pipelines are local-run only. Only CI workflow is build + deploy on push to `main`.

**Trigger to revisit:** when you find yourself running `pipeline refresh` weekly on the same cadence, manually.

**Options on the table:**
- Scheduled GitHub Action running `pipeline refresh` + opening a PR with the resulting diff. Requires storing `OPENROUTER_API_KEY` as an Actions secret.
- Run locally on a personal cron; keeps API key off GitHub.
- Stay manual; the benefit of scheduled ingest is narrow if new sources are discovered by the user rather than pulled.

### 15.5 LLM-assisted audit

**Current position:** `pipeline audit` is deterministic only (link integrity, hash integrity, orphan detection).

**Trigger to revisit:** after Phase 4, when the wiki has enough scale that manual spot-checking of claim-to-evidence alignment is impractical.

**Options on the table:**
- `pipeline audit-llm` — cheap model samples N claims per page, verifies each against its cited extraction, reports suspected hallucinations.
- Quarterly full audit as a batch job.
- Rely on human PR review indefinitely.

### 15.6 Pagefind vs FlexSearch

**Current position:** FlexSearch (Nextra default).

**Trigger to revisit:** if search relevance is poor in practice, or if search needs to cover fields FlexSearch doesn't (e.g. source citations, frontmatter tags).

**Options on the table:**
- Swap to Pagefind — higher quality, small static-index, slightly more CI setup.
- Stick with FlexSearch; tune the index config.

### 15.7 Image repository growth

**Current position:** all images committed under `site/public/media/<hash>/` with generated variants. Original + 3 variants per image.

**Trigger to revisit:** when the repo exceeds ~1 GB, which at ~5 MB per image set is roughly 200 images.

**Options on the table:**
- Migrate images to Cloudflare R2 (cheap object storage); keep metadata and extractions in repo; pre-generate variants at upload time.
- Use Git LFS; slight local-tooling friction but transparent to consumers.
- Aggressively prune unused variants; stay with in-repo storage longer.

### 15.8 Multi-author / public contributions

**Current position:** single-maintainer model. Contributions via GitHub PRs only. No in-browser editing.

**Trigger to revisit:** if/when the project attracts trusted community contributors who want to help maintain without running the pipeline locally.

**Options on the table:**
- GitHub-based: contributors open PRs; you run the pipeline on their branches before merging.
- A limited web submission form that creates inbox entries (notes/screenshots) via a Cloudflare Worker + repo commit. Lowers the contribution barrier.
- Full CMS with user accounts — explicitly rejected in §1.2 non-goals; revisit only if the project's scope shifts.

### 15.9 i18n

**Current position:** English only. Nextra's built-in i18n not enabled.

**Trigger to revisit:** if a community emerges around a non-English language version.

**Options on the table:**
- Enable Nextra i18n; pipeline gains a `--locale` flag; writer translates from extractions into each locale. Expensive to maintain.
- Community-hosted translations outside this repo.
- Stay English-only.

### 15.10 Protected-block model vs full section-level override

**Current position:** human-authored prose in generated pages survives regen only inside `<!-- :protected:start name --><!-- :protected:end name -->` blocks (§8.5). All other prose is overwritten.

**Trigger to revisit:** if "I want to hand-write this section and never have the writer touch it" becomes a frequent need.

**Options on the table:**
- Section-level opt-out: page frontmatter lists `humanAuthored: [recommended-loadouts]`, writer skips those sections entirely.
- Hybrid: protected blocks for small inserts, section opt-out for whole sections.
- Keep protected-blocks-only; push authors toward editing the template brief instead.

---

## 16. Summary

This design establishes a three-layer, Git-native, AI-assisted wiki for *Last Z: Survival Shooter*:

1. **Intent layer** — `templates/` folder, human-authored, filesystem = taxonomy.
2. **Facts layer** — `sources/<type>/<id>/` folders with raw + extracted knowledge, LLM-extracted once per unique content, cached by hash.
3. **Output layer** — `site/content/` MDX files, LLM-composed cheaply from layers above, always regeneratable.

Expensive LLM work (extraction) is rare and cached. Cheap LLM work (writing, curator planning) is frequent and regeneratable. All artifacts are committed to Git for full auditability. Pull-request review gates every change. Next.js + Nextra static export deploys to Cloudflare Pages.

The pipeline exposes a deterministic CLI usable by a human directly or driven by an OpenCode agent following recipes documented in `AGENTS.md`. There is no agent-specific code path; both drivers execute the same commands.

MVP ships in seven phases, each producing a mergeable improvement. Phase 0 deploys an empty site. Phase 1 produces the first real page from a real YouTube video. By Phase 3 the full authoring loop — including image extraction and agent-driven orchestration — is operational.

Open questions and deferrals are cataloged in §15 with explicit triggers for revisiting each one.


