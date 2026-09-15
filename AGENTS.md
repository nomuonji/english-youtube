# AGENTS.md

## Purpose

This repository generates long-form current-affairs explainer videos for Japanese English learners.

A scheduled content agent is expected to make editorial decisions every run while preserving the visual/learning system defined in code.

## Non-negotiable operating model

Daily episode generation is **manifest-driven**.

The agent may create/update episode data under `episodes/` and research/generation metadata. It must not modify production React/CSS/Remotion components during an ordinary scheduled episode run.

If the current Scene Library cannot express an editorial idea, record a `scene_library_request` in the episode report instead of adding ad-hoc code.

## Daily run sequence

1. Discover current stories.
2. Generate multiple candidate questions.
3. Score candidates using `docs/EDITORIAL_SYSTEM.md`.
4. Select one story only after verifying source depth.
5. Research from multiple trustworthy sources.
6. Build claim/source mapping.
7. Decide the editorial mode: `explainer`, `timeline`, or `two_sides`.
8. Write a 3–6 beat story arc.
9. Draft clear English narration.
10. Select reusable English learning points that naturally occur in the narration.
11. Select Scene Library components based on the information being explained.
12. Generate `EpisodeManifest` JSON.
13. Validate it against `schemas/episode.schema.json`.
14. Run editorial QA.
15. Commit episode files.
16. Trigger/allow preview rendering.

## Research rules

- Prefer primary sources and high-quality independent reporting.
- Use at least 3 sources where reasonably possible.
- Record publication dates/times.
- Distinguish article publication date from event date.
- Clearly mark forecasts, estimates and disputed claims.
- Never invent a source, quote, statistic or event.
- Never rely on a single partisan/advocacy source for a contested claim.
- For political or contested topics, represent material viewpoints fairly and attribute claims.
- Do not quote long passages from sources.

## Editorial rules

The video is an explainer first, English-learning product second.

Do not begin with:

- a channel greeting
- a vocabulary list
- a grammar lesson
- "Today we will learn..."

Do begin with:

- a concrete tension/surprising fact
- the episode's central question
- a reason to keep watching

The final episode should normally be 8–12 minutes.

## English rules

Default comprehension target: B1–B2.

Use difficult vocabulary when it is authentic and useful, then support it with Text UI.

Learning points must:

- appear naturally in the story first
- be reusable outside the episode
- be limited in number
- never stop the story for a long classroom-style explanation

Japanese should be used selectively as a micro-gloss or structural aid, not as permanent full translation subtitles.

## Scene selection rules

Use the Scene Library semantically.

Examples:

- time progression -> `timeline`
- geographical relationship -> `map`
- causality -> `cause_effect`
- competing values -> `comparison`
- key metric -> `number_reveal`
- structure of a difficult sentence -> `chunk_breakdown`

Do not rotate scene types mechanically.

Avoid:

- more than two identical scene types consecutively
- unnecessary visual effects
- giant paragraphs on screen
- text animation that adds no information

## Manifest invariants

Every episode manifest must include:

- stable episode id
- generation timestamp
- topic
- central question
- editorial mode
- source metadata
- claims linked to source ids
- ordered scenes
- narration for narrative scenes
- explicit learning points
- title candidates
- thumbnail-text candidates

Every scene must have a stable id.

No arbitrary HTML, CSS or JavaScript is allowed in manifests.

## Output directory

Use:

```text
episodes/YYYY-MM-DD-slug/
  manifest.json
  research.json
  script.txt
  captions.json        # generated later when timings are known
  assets.json          # generated/resolved later
  render.json          # generated after render
```

## Failure behavior

Do not force an episode if:

- sources are too weak
- the story cannot support the target duration
- facts remain materially uncertain
- the topic is mainly clickbait with little explanatory value
- the story requires visual footage to work and cannot be made understandable with the available information UI

In such cases, select the next candidate.

## Code evolution

Changes to Scene Library, design tokens, rendering, workflows or schema are engineering work, not daily editorial work.

They should be made separately and tested against fixture episodes before being used for scheduled production.
