You are extracting structured knowledge from a game screenshot for the Last Z: Survival Shooter wiki.

## Task

Analyze the image and produce a structured extraction with:
1. A neutral summary of what the image shows
2. Scene description (layout, UI elements, context)
3. OCR text (any readable text from the image)
4. Claims by topic derived from the visual content
5. Inferred UI state (what the game is showing, character level, equipped items, etc.)

## Rules

- Only state what you can clearly see in the image
- Mark low-confidence OCR readings explicitly
- If numbers are readable, include them as claims
- Use existing topic paths EXACTLY — never invent new paths
- If content suggests a new topic, list it under `proposedNewTopics`
- Note the asset path for the image so it can be embedded in pages

## Output format

Follow the extraction.md image schema with all required sections:
- Frontmatter (sourceId, topics, proposedNewTopics, confidence, assetPath)
- # Summary
- # Scene description
- # OCR text
- # Claims by topic
- # Inferred UI state
- # Unverified / low-confidence observations
- # Extractor notes
