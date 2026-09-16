# V3 English News Explainer — experimental review profile

Status: review-only experiment for `2026-09-15-ai-power-project`.

The channel remains an English-learning product. V3 is not a pivot away from English learning; it is a pivot away from *lesson-like presentation*.

## North star

**Watch a compelling real tech/business story in English, understand it with light Japanese support, and incidentally acquire reusable English.**

The story is primary. English learning is embedded in the viewing experience instead of interrupting it.

## Hard requirements

- English narration is the main audio throughout the story.
- Japanese is support only: compact translation/subtitle text and short glosses.
- No fictional or imaginary examples.
- No beginner multiple-choice quiz, grammar lecture, long vocabulary card, or mid-story lesson interruption.
- Use real sourced facts and clearly separated source-backed inference.
- Target length: 90–120 seconds for this review artifact.
- Hook the AI electricity bottleneck within the first 5 seconds.
- Full-screen factual B-roll and motion graphics are primary visuals. White lesson-card UI is prohibited.
- A meaningful visual/motion beat should occur roughly every 4–6 seconds.
- BGM must be perceptible under narration; transition/data SFX stay restrained.
- Subtitles use a persistent bottom gradient, not a box that mounts/unmounts on every line. This specifically avoids the previous caption-box flicker.
- Main facts for this episode come from the existing Reuters/IEA evidence already stored in the production manifest.

## Story structure

The review storyboard is stored in:

`episodes/2026-09-15-ai-power-project/v3.json`

Flow:

1. Hook: AI's next bottleneck may be electricity.
2. Reuters / SB Energy IPO news peg.
3. IEA: 485 TWh in 2025 → 950 TWh in 2030; roughly 3% of global demand.
4. Digital scaling vs. grid construction speed mismatch.
5. Grid / equipment / supply-chain / connection bottlenecks.
6. Business takeaway: evaluate transmission capacity, power contracts, connection timing, and generation plans.
7. Short `English Replay` after the story: three reusable B2–C1 news/business expressions taken from the actual narration.
8. Outro.

## English Replay

Replay exists only after the story. It is intentionally short and contains no quiz.

Current anchors:

- `power availability can constrain ...`
- `account for roughly ...`
- `become part of the same ...`

Each anchor is replayed in a real sentence with a one-line Japanese gloss. Do not turn this block into a grammar class.

## Renderer / audio

- Remotion composition: `TechExplainerV3`
- English voice: Edge TTS `en-US-GuyNeural` for this experiment.
- TTS duration is measured from encoded audio with ffprobe.
- B-roll: curated, licensed Wikimedia Commons media. Loose search matching is prohibited because it previously produced semantically wrong footage.
- BGM/SFX: deterministic local synthesis; narration remains dominant.
- Review workflow: `.github/workflows/v3-preview.yml`

## Boundary

Do not generalize this profile to all production until the user accepts the review video. Existing `news-first` production remains intact in `main` until that decision.
