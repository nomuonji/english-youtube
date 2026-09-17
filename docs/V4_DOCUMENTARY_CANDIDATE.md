# V4 documentary-first candidate

Status: **candidate**. Stable production remains `news-first-v3.0` until explicit user promotion.

## Hypothesis

A stronger format is not “more lesson UI”. It is a faceless English mini-documentary that happens to be unusually learnable for Japanese B2–C1 viewers.

The viewer should feel that they are watching a normal technology/business explainer in English. Japanese support is a safety net, not a permanent second transcript.

## What changes from v3.0

### 1. Evidence-led composition

V3.0 maps scenes to strong reusable visual types. V4 keeps those data structures, but the renderer presents them as documentary evidence rather than UI cards.

Preferred visual rhythm:

```text
source headline / real footage
→ concrete number
→ chart / mechanism
→ map / infrastructure / system
→ contradiction or constraint
→ answer
```

Source publishers are surfaced subtly where claims are being visualized.

### 2. Adaptive Japanese support

Normal story state:

- English caption is primary.
- Japanese is not permanently duplicated below every line.

Japanese appears when it has high comprehension value:

- hook;
- first important turn in complication / answer beats;
- learning-point anchor;
- final replay / recap.

This is intentionally different from the persistent bilingual lower-third in v3.0.

### 3. Meaning-paced visuals

Do not force a cut every N seconds. Hold a chart, source, image or mechanism long enough to understand it. Change the visual when the meaning changes.

Motion should clarify state, causality, magnitude or sequence. Random zooms and decorative activity do not count as retention design.

### 4. English Replay becomes `YOU JUST HEARD`

The end block should feel like a reveal of language already understood through the story:

```text
YOU JUST HEARD
power availability can constrain ...
```

It should not feel like switching into a classroom.

### 5. Same long-form policy

V4 does **not** inherit the old 90–120 second visual-pilot duration.

Target remains:

- 300–390 seconds;
- approximately 650–850 spoken words;
- no padding or repeated explanations to hit duration.

## A/B acceptance test

The experiment uses the same AI-power source story for stable and candidate output.

Both versions share:

- narration text;
- TTS voice and exact measured timing;
- B-roll / editorial assets;
- BGM / SFX sources;
- duration;
- factual claims.

Only the experience renderer and presentation behavior change.

Review questions:

1. Does the first 30 seconds feel more like a real YouTube documentary than a learning product?
2. Can the viewer follow the story without continuously reading Japanese?
3. Do charts, footage and source evidence get enough visual attention?
4. Does the video feel calmer without becoming static?
5. Does `YOU JUST HEARD` feel like a satisfying language payoff rather than a lesson interruption?
6. Would a viewer plausibly watch this even if English learning were not the headline promise?

If the candidate is not clearly better, keep `news-first-v3.0` stable.
