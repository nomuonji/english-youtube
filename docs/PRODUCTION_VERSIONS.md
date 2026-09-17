# Production experience versions

Production behavior is versioned independently from `schemaVersion`.

- `schemaVersion` = data-contract shape.
- `formatProfile` = editorial family such as `news-first`.
- `experienceVersion` = immutable combination of visual language, caption behavior, learning UX, audio treatment, and duration policy used to render a production episode.

## Stable default

`news-first-v3.0`

Status: **stable**

This is the accepted long-form baseline derived from the approved AI-power v3 visual pilot.

Contract:

- news-first story remains primary;
- English narration + compact Japanese support;
- dark cinematic canvas;
- full-bleed factual B-roll / editorial imagery where available;
- persistent compact bilingual lower-third;
- animated metric / chain / compare / timeline visuals;
- no repeated fade-to-black between scenes;
- short English Replay after the story;
- 5–6.5 minute production target (300–390 seconds), approximately 650–850 spoken words;
- voice-first BGM/SFX mix.

## Active candidate

`news-first-v4.0-candidate`

Status: **candidate — not the production default**

Goal: move from “well-produced learning news” toward an English-language faceless mini-documentary while keeping comprehension support and an end-of-story English payoff.

Candidate contract:

- the same 5–6.5 minute long-form target as v3.0;
- story/evidence first rather than visual-template first;
- factual B-roll, editorial images, charts and source labels behave as evidence, not decoration;
- normal caption state is English-first;
- Japanese appears selectively at difficult moments, learning-point anchors, the hook, and important turns instead of being permanently duplicated under every line;
- visual changes follow meaning changes rather than a fixed fast-cut timer;
- final learning block is framed as `YOU JUST HEARD`, using phrases already encountered in the story;
- v3.0 remains fully renderable and stays stable unless the user explicitly promotes v4 after review.

The A/B workflow renders v3.0 and v4.0 from the same derived long-form manifest, shared narration timing, shared media assets, BGM and SFX so format differences can be judged without topic or source changes.

See `docs/V4_DOCUMENTARY_CANDIDATE.md`.

## Immutability rule

Once an `experienceVersion` has produced a reviewed or published episode, its behavior is frozen.

Do **not** silently improve the renderer, timings, caption style, learning UX, audio mix, or duration policy behind an existing version ID. A change that can materially affect viewer experience must create a new version, for example:

- `news-first-v3.1` for a small candidate iteration;
- `news-first-v4.0-candidate` for a substantial redesign.

The old version remains renderable so a new candidate can be compared against it or rolled back.

## Promotion rule

A newly created version starts as `candidate`. It does not become the stable default merely because it is newer.

Promotion requires explicit user acceptance after review. Only then update `STABLE_EXPERIENCE_VERSION` in `src/experience/versions.ts` and this document.

## Manifest pinning

Every new ordinary `kind: "production"` + `formatProfile: "news-first"` manifest must explicitly contain the current stable pin:

```json
{
  "formatProfile": "news-first",
  "experienceVersion": "news-first-v3.0"
}
```

Experimental manifests may explicitly pin a registered candidate version, but normal scheduled production must not use a candidate before promotion.

The pinned version is part of the manifest hash, so READY / APPROVED artifacts remain tied to the exact production experience that was reviewed.

Historical manifests that predate this field are not rewritten. Compatibility fallback exists only to preserve them.

## Experiment workflow

When trying an improvement:

1. Add a new `experienceVersion`; never reuse an existing ID.
2. Keep the previous stable version intact.
3. Render stable and candidate against the same or comparable source material.
4. Compare the actual review outputs, not just code or screenshots.
5. If accepted, promote it to stable default.
6. If rejected, leave stable unchanged and retire or keep the candidate for reference.

This allows visual and learning-design evolution without assuming that every change is an improvement.
