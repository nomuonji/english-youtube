# Implementation Plan

## Phase 1 — Foundation

Goal: one fixture episode can be viewed in browser and rendered in GitHub Actions.

Build:

- TypeScript + React + Remotion project
- `EpisodeManifest` runtime validator (Zod generated/kept in sync with JSON schema)
- one `NewsEnglishVideo` composition
- base typography/design tokens
- persistent English caption renderer
- scene dispatcher
- fixture episode

Initial Scene Library:

- `cold_open`
- `narrative`
- `number_reveal`
- `cause_effect`
- `comparison`
- `english_lens`
- `chunk_breakdown`
- `listening_challenge`
- `recap`

Do not build every planned scene type before the first full episode works.

## Phase 2 — Remote development preview

Build a Vite static app using `@remotion/player`.

Features:

- fixture/episode selector
- play/pause/seek
- current scene display
- jump-to-scene navigation
- show manifest id + git SHA
- optional 50%/75%/100% scale controls

Deploy through GitHub Pages.

Acceptance criterion:

> A repository commit can be visually reviewed from a browser without cloning the repo.

## Phase 3 — GitHub Actions render

Add two workflows.

### `preview-render.yml`

Triggers:

- manual `workflow_dispatch`
- optionally pull requests touching `src/`, `fixtures/`, `episodes/`

Behavior:

- npm ci
- validate manifest
- render selected range at lower resolution/scale
- generate representative screenshots/contact sheet
- upload preview artifacts

### `production-render.yml`

Triggers:

- manual approval initially
- scheduled/agent automation later

Behavior:

- validate immutable manifest
- resolve TTS/assets
- render full 1920x1080
- generate captions/metadata
- upload artifacts
- publish only when explicitly enabled

## Phase 4 — Information UI Scene Library

Add based on real episode needs:

- `timeline`
- `map`
- `entity_profile`
- `quote`
- `before_after`
- `process`
- `prediction`
- `counterpoint`
- `what_next`

Each new scene must have edge-case fixtures.

## Phase 5 — Agent generation pipeline

Split generation into explicit stages rather than one giant prompt:

```text
candidate discovery
 -> candidate scoring
 -> research
 -> claim/source map
 -> story beats
 -> narration
 -> learning-point selection
 -> scene planning
 -> manifest assembly
 -> QA/repair
```

Why: failures can be repaired locally without regenerating the whole episode, and research can be audited independently from writing.

## Phase 6 — TTS and timing

Reuse lessons from `legal-english` / `error-english`, but timing should be manifest-derived.

Preferred model:

- narration is split by scene
- TTS generated per scene or semantic clip
- actual audio duration determines scene minimum duration
- scene component can add visual hold time but not truncate speech
- captions are timestamped from TTS/alignment output

Do not let the content agent hardcode Remotion frame numbers.

## Phase 7 — Scheduled production

Only after several manually reviewed episodes.

Scheduled run:

1. agent generates candidate/research/manifest
2. validators run
3. preview render runs
4. automated QA runs
5. production render runs
6. upload may remain approval-gated until quality is stable

## Phase 8 — Feedback loop

Archive YouTube performance by episode and by editorial features where available:

- topic category
- editorial mode
- opening type
- scene mix
- duration
- learning intervention count
- CTR
- first-30-sec retention
- average percentage viewed
- returning viewers

Use performance to adjust editorial selection and opening strategy, not to let the agent rewrite design code every day.
