# V3 English News Explainer — accepted visual baseline

Status: accepted visual reference for future `news-first` production.

The channel remains an English-learning product. V3 is not a pivot away from English learning; it is a pivot away from *lesson-like presentation*.

## North star

**Watch a compelling real tech/business story in English, understand it with light Japanese support, and incidentally acquire reusable English.**

The story is primary. English learning is embedded in the viewing experience instead of interrupting it.

## Production duration

Future production keeps the established long-form news-first duration:

- target: **5–6.5 minutes (300–390 seconds)**
- typical spoken length: roughly **650–850 words**
- do not pad weak stories merely to reach the range
- if a story cannot support the range with sourced substance, choose a stronger story instead

The accepted `2026-09-15-ai-power-project/v3.json` video is intentionally a **90–120 second visual pilot only**. Its duration must never be copied as the production default. It exists to preserve the approved visual language and pacing feel.

## Hard requirements

- English narration is the main audio throughout the story.
- Japanese is support only: compact translation/subtitle text and short glosses.
- No fictional or imaginary examples.
- No beginner multiple-choice quiz, grammar lecture, long vocabulary card, or mid-story lesson interruption.
- Use real sourced facts and clearly separated source-backed inference.
- Hook the central tension within the first 5–10 seconds and make the central question understandable by roughly 15 seconds.
- Full-screen factual B-roll and motion graphics are primary visuals. White lesson-card UI is prohibited.
- A meaningful visual/motion beat should occur roughly every 3–8 seconds when the narration meaningfully changes.
- BGM must be perceptible under narration; transition/data SFX stay restrained.
- Subtitles use a persistent bottom gradient, not a box that mounts/unmounts on every line.
- Scene changes must not introduce a black flash or full-frame caption flicker.
- Factual footage, editorial imagery, and generated illustration must not be visually misrepresented as one another.

## Visual language to preserve

The accepted pilot establishes the production visual baseline:

- dark cinematic canvas (`#050A10` family)
- full-bleed factual B-roll whenever useful
- enough contrast to recognize the footage itself; do not bury it under a white veil
- strong English headline / key claim, with smaller Japanese comprehension support
- cyan/electric accent for data and structure; red only for risk/tension
- animated metrics, compare cards, chains, timelines, and checklists synchronized to narration
- persistent compact bilingual lower-third
- hard cuts or meaning-driven transitions rather than repeated fade-to-black
- restrained texture/noise for depth, not decoration
- voice-first tech BGM and sparse semantic SFX

The production renderer may evolve, but a redesign must preserve these principles unless the user explicitly approves a new direction.

## Story structure

Production remains `news-first`:

1. Cold hook.
2. What changed / why now.
3. How it works.
4. The catch / constraint / counterpoint.
5. What it means.
6. Short `English Replay` after the story: 1–3 reusable B2–C1 news/business expressions taken from the actual narration.
7. Final takeaway.

The story should remain uninterrupted by dedicated learning cards.

## English Replay

Replay exists only after the story. It is intentionally short and contains no quiz.

For each selected expression:

1. hear it once in context
2. notice the reusable chunk
3. shadow once

Do not turn this block into a grammar class. Avoid long countdowns and repeated playback of the same sentence.

## Pilot reference

The accepted visual pilot is stored in:

`episodes/2026-09-15-ai-power-project/v3.json`

Its dedicated renderer remains:

- Remotion composition: `TechExplainerV3`
- English voice: Edge TTS `en-US-GuyNeural` for the pilot
- curated, licensed Wikimedia Commons B-roll
- deterministic BGM/SFX
- review workflow: `.github/workflows/v3-preview.yml`

This pilot workflow is reference-only. Normal production must use the standard EpisodeManifest / READY / APPROVED pipeline and the 5–6.5 minute duration standard.

## Session-to-session rule

A new agent/session must treat this document together with `AGENTS.md` and `docs/NEWS_FIRST_FORMAT.md` as the production source of truth. Conversation memory is not required to recover the intended format.
