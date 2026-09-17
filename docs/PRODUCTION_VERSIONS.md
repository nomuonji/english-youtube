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

## Immutability rule

Once an `experienceVersion` has produced a reviewed or published episode, its behavior is frozen.

Do **not** silently improve the renderer, timings, caption style, learning UX, audio mix, or duration policy behind an existing version ID. A change that can materially affect viewer experience must create a new version, for example:

- `news-first-v3.1` for a small candidate iteration;
- `news-first-v4.0` for a substantial redesign.

The old version remains renderable so a new candidate can be compared against it or rolled back.

## Promotion rule

A newly created version starts as `candidate`. It does not become the stable default merely because it is newer.

Promotion requires explicit user acceptance after review. Only then update `STABLE_EXPERIENCE_VERSION` in `src/experience/versions.ts` and this document.

## Manifest pinning

Every new `kind: "production"` + `formatProfile: "news-first"` manifest must explicitly contain:

```json
{
  "formatProfile": "news-first",
  "experienceVersion": "news-first-v3.0"
}
```

The pinned version is part of the manifest hash, so READY / APPROVED artifacts remain tied to the exact production experience that was reviewed.

Historical manifests that predate this field are not rewritten. Compatibility fallback exists only to preserve them.

## Experiment workflow

When trying an improvement:

1. Add a new `experienceVersion`; never reuse an existing ID.
2. Keep the previous stable version intact.
3. Render the candidate through the review flow.
4. Compare candidate and stable output on the same or comparable source material.
5. If accepted, promote it to stable default.
6. If rejected, leave stable unchanged and retire or keep the candidate for reference.

This allows visual and learning-design evolution without assuming that every change is an improvement.
