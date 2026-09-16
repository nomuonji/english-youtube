# V3 Japanese Tech Explainer — experimental remake profile

Status: review-only experiment for `2026-09-15-ai-power-project`.

This profile exists because the v2/news-first English-learning treatment failed visual/content review for this episode. It must not be routed through the English-learning renderer or fixture preview path.

## Hard requirements

- Japanese narration only.
- No English quiz, grammar explanation, vocabulary teaching, shadowing, retrieval, or learning cards.
- Use only real sourced facts and explicit source-backed inference. No fictional/imaginary examples.
- Target length: 90–120 seconds.
- Hook the AI electricity bottleneck within the first 5 seconds.
- Full-screen factual B-roll and motion graphics are primary visuals. White lesson-card UI is prohibited.
- A meaningful visual change or motion beat should occur roughly every 4 seconds.
- BGM must be clearly perceptible under narration; use transition/data SFX sparingly.
- Main facts for this episode come from the existing Reuters/IEA evidence already stored in the production manifest.

## Storyboard

The review storyboard is stored in:

`episodes/2026-09-15-ai-power-project/v3.json`

Flow:

1. AI's next bottleneck may be electricity.
2. Reuters / SB Energy IPO news peg.
3. IEA: 485 TWh in 2025 → 950 TWh in 2030; about 3% of global demand.
4. Digital scaling vs. grid construction speed mismatch.
5. Grid/equipment/supply-chain/connection bottlenecks.
6. Investor takeaway: evaluate transmission capacity, power contracts, connection timing, and generation plans.

## Renderer / audio

- Remotion composition: `TechExplainerV3`
- Japanese voice: Edge TTS `ja-JP-KeitaNeural`
- TTS duration is measured from encoded audio with ffprobe.
- B-roll: licensed Wikimedia Commons video, query-driven and cached per unique concept.
- BGM/SFX: deterministic local synthesis; narration remains dominant.
- Review workflow: `.github/workflows/v3-preview.yml`

## Boundary

Do not generalize this profile to all channel production until the user accepts the v3 review video. Existing v2/news-first production remains intact in main until that decision.
