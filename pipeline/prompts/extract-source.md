You are extracting structured knowledge from a raw source document for the Last Z: Survival Shooter wiki.

## Task

Read the raw source content and produce a structured extraction with:
1. A neutral summary (max 120 words)
2. Claims organized by topic (using ONLY existing topic paths from the provided taxonomy)
3. Key quotes preserved verbatim with attribution
4. Unverified/low-confidence claims flagged
5. Contradictions with existing knowledge noted

## Rules

- Every claim must include a reference marker from the raw content (timestamp, comment ID, etc.) when available
- Use existing topic paths EXACTLY — never invent new paths
- If content doesn't fit any existing topic, list it under `proposedNewTopics` in frontmatter with a justification
- A claim can appear under multiple topics — duplicate verbatim, don't cross-reference
- Preserve timestamps inline: `[at 2:34]` for video, `[comment abc123]` for Reddit
- Never fabricate claims not supported by the raw content
- Mark uncertain claims explicitly: `(author uncertain)`, `(unverified)`, etc.
- If the raw content mentions a patch version, include it in `patchContext` in frontmatter

## Output format

Follow the extraction.md schema exactly with all required sections in order:
- Frontmatter (sourceId, topics, proposedNewTopics, confidence, patchContext)
- # Summary
- # Claims by topic (## topic sub-headers)
- # Key quotes
- # Unverified / low-confidence claims
- # Contradictions with existing knowledge
- # Extractor notes
