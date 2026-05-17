# Last Z: Survival Shooter Wiki

A community-maintained, AI-assisted wiki for **Last Z: Survival Shooter**.

## Architecture

Three-layer, Git-native, AI-assisted wiki:

1. **Intent layer** — `templates/` (human-authored page specs)
2. **Facts layer** — `sources/` (LLM-extracted knowledge from ingested sources)
3. **Output layer** — `site/content/` (LLM-composed MDX pages)

See the [design specification](docs/superpowers/specs/2026-04-29-wiki-design.md) for full details.

## Quick Start

```bash
bun install

bun run dev          # Start Next.js dev server
bun pipeline --help  # Show pipeline CLI commands
bun run build        # Build static site for deployment
```

## Pipeline

The pipeline ingests sources (YouTube, wikis, Reddit, Steam, official, images), extracts structured knowledge, and generates wiki pages.

```bash
bun pipeline ingest youtube <url>     # Ingest a YouTube video
bun pipeline extract <sourceId>       # Run extraction on a source
bun pipeline index                    # Rebuild indexes
bun pipeline write --all-stale        # Regenerate stale pages
bun pipeline plan                     # Show coverage gaps
```

See `AGENTS.md` for the full command reference and workflow recipes.

## Environment

Copy `.env.example` to `.env` and fill in required keys:

```bash
cp .env.example .env
```

Required: `OPENROUTER_API_KEY`, `YOUTUBE_API_KEY`

## Deployment

Static HTML deployed to Cloudflare Pages via GitHub Actions on push to `main`.

## Contributing

Contributions via GitHub pull requests. See `AGENTS.md` for conventions and safety rules.
