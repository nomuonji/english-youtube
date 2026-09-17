# V5 shot-first experiment and fast PDCA loop

`news-first-v5.0-candidate` is an experimental production experience. It is **not stable** and must not replace `news-first-v3.0` without explicit review and promotion.

## Why V5 exists

The direct v3/v4 A/B review exposed a structural failure: both versions behaved like animated slide decks. A scene selected one reusable layout, the layout stayed on screen for too long, media behaved as decoration, and changes in information did not reliably produce changes in visual grammar.

V5 changes the unit of editing from **scene** to **shot**.

A scene remains an editorial/story unit. A shot is now the visual unit. One scene can contain several shots, each with its own:

- start/duration;
- editorial purpose (`cold-open`, `broll`, `evidence`, `metric`, `mechanism`, `contrast`, etc.);
- media search query and selected asset;
- crop/focus and camera motion;
- headline/source treatment;
- English-only or selective Japanese caption mode.

The renderer consumes a shot plan rather than choosing one screen template for the entire scene.

## Fast-loop rule

Do **not** render a complete 5–6.5 minute V5 video while the visual grammar is still being designed.

The default loop is:

1. derive the same long-form editorial cut used by the stable baseline;
2. synthesize/reuse measured narration timing;
3. build a shot plan;
4. fetch media for the opening shots;
5. run static-slide regression guardrails;
6. render only the opening **36 seconds**;
7. create a 3×3 contact sheet;
8. review the rough cut;
9. change one meaningful visual hypothesis and repeat.

Only after the opening grammar is acceptable should work expand to representative middle/end windows and then a full episode.

## Fail-fast guardrails

The fast-loop checker is not a quality score and does not decide whether a video is good. It only blocks obvious regressions that already failed in v3/v4.

For the opening window it currently checks:

- at least six distinct shots;
- average shot duration is not excessively long;
- no single shot exceeds the static-shot ceiling;
- sufficient real media coverage when assets were fetched;
- selective Japanese support does not become a permanent bilingual answer track;
- text-heavy shots do not dominate the whole opening;
- media queries are not all duplicates.

A passing gate means “worth looking at”, not “approved”.

## Review surface

After a successful main run, the latest rough cut is exposed at:

`/review-v5/`

The page intentionally contains only:

- opening rough-cut video;
- contact sheet;
- a few structural loop metrics.

It does not imply publication approval or stable promotion.

## PDCA discipline

Each iteration should change a small number of hypotheses. Prefer edits such as:

- opening evidence appears sooner;
- source proof occupies more screen area;
- reduce text-only shots;
- change one shot family from typography to footage;
- make Japanese support more selective;
- shorten an overlong shot;
- change the sequence of evidence rather than polishing colors.

Do not spend a cycle on small cosmetic changes when the shot sequence itself is weak.

The recommended review order is:

1. first 8 seconds: would a normal YouTube viewer keep watching?
2. first 36 seconds: does it feel edited, or like UI/slides?
3. media: does footage/image carry meaning, or merely decorate narration?
4. information rhythm: does each new claim create a visual reason to keep looking?
5. language UX: is English primary while Japanese remains a brief semantic anchor?

## Promotion path

V5 remains candidate until all of the following happen:

1. opening rough cut is explicitly accepted as worth extending;
2. representative middle/end windows are reviewed;
3. a full 5–6.5 minute candidate is rendered and reviewed;
4. only then, if explicitly requested, V5 may replace the stable experience version.

At no point does “newer” mean “better”.
