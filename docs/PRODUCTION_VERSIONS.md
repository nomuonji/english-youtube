# Production experience versions

Production behavior is versioned independently from `schemaVersion`.

- `schemaVersion` = data-contract shape.
- `formatProfile` = editorial family such as `news-first`.
- `experienceVersion` = immutable combination of visual language, caption behavior, learning UX, audio treatment, and duration policy used to render a production episode.

## Stable comparison baseline

`news-first-v3.0`

Status: **stable baseline, but not considered a satisfactory final format**

This is the long-form baseline retained because direct review judged it better than the v4 candidate. It should be treated as a rollback/comparison reference rather than a quality target.

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

## Retired candidate

`news-first-v4.0-candidate`

Status: **retired — rejected after direct A/B review**

The candidate attempted to move from “learning news” toward a faceless mini-documentary with evidence-led visuals and adaptive Japanese support. In the rendered result it remained too static, too template-like, too dark, and visually underpowered. It did not feel like a compelling normal YouTube documentary, and v3.0 was judged the less-bad option.

The v4 renderer and review artifact remain available only as a comparison/history reference. Do not promote it and do not reuse it as the base for another incremental styling pass.

The next redesign should change the production model itself rather than tune the same scene-template system. In particular, it should move toward shot-list-first editorial construction: source screenshots, footage, charts, maps, crops, callouts, kinetic type, and bespoke per-beat composition, with templates limited mainly to branding/captions rather than determining the whole scene.

## Immutability rule

Once an `experienceVersion` has produced a reviewed or published episode, its behavior is frozen.

Do **not** silently improve the renderer, timings, caption style, learning UX, audio mix, or duration policy behind an existing version ID. A change that can materially affect viewer experience must create a new version.

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
6. If rejected, leave stable unchanged and retire the candidate with the review reason recorded.

This allows visual and learning-design evolution without assuming that every change is an improvement.
