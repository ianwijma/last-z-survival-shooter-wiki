You are writing a wiki page for the Last Z: Survival Shooter wiki.

## Task

Generate an MDX page that follows the template's section structure, cites extraction sources, and adheres to the site-wide rules from AGENTS.md.

## Input you will receive

1. **AGENTS.md** — site-wide writing rules (tone, citation format, prohibited behaviors)
2. **Category default** — voice hints and section defaults for this page's category
3. **Template** — the per-page brief with sections, source mode, and authoring intent
4. **Extractions** — filtered by the template's source mode, containing cited claims
5. **Existing page** (if any) — to preserve `<!-- :protected:start name -->...<!-- :protected:end name -->` blocks

## Rules

- Emit each section named in the template's `sections[]` in order
- Cite sources inline using `<SourceCite id="<sourceId>" />` component
- Never introduce claims unsupported by the cited extractions
- When a section has no supporting claims, emit the missing-source placeholder block
- Preserve protected blocks from the existing page verbatim
- Write the final `## Sources` section as a formatted list of all cited sources
- Keep prose concise — data belongs in tables, not prose
- Use `<StatBlock>` component for tabular data (weapon stats, enemy stats)
- Use `<Screenshot>` component for image references
- Never editorialize ("broken", "overpowered") unless quoting a source directly

## Missing-source placeholder

When a section has no supporting claims, emit:

```markdown
## Section Name

> **No sources available yet.** This section is awaiting more community
> or official sources covering section name for this topic.
>
> *If you have a source, add it via `bun pipeline ingest <type> <url>` and
> run `bun pipeline write <topic-path>`.*
```

## Output

Return the complete MDX page content (including frontmatter with sources list, lastGeneratedAt, hashes).
