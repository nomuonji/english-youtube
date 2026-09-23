# Animation-first English — new channel direction

Status: **candidate format, selected editorial direction** (2026-09-23). The user asked to make animation the basis of the English-learning channel. This document governs new format development. The older news-first episode contract and published/reviewed renderers remain reproducible; their automatic READY/APPROVED workflow is not reused for this new lesson type yet.

## Viewer promise

Watch a short animated situation, understand one useful English expression in context, then use it in a different situation. The animation carries the meaning. Captions and Japanese support clarify one point at a time.

The first audience is Japanese-speaking intermediate learners, around B1–B2. Each lesson has one target phrase that a viewer can say naturally in a real situation. Avoid obscure idioms chosen only for novelty and single-word vocabulary lists without a situation.

## Episode grammar

1. **See the problem:** action starts immediately; a character has a concrete goal.
2. **Hear the phrase in context:** natural English narration/dialogue names what happened.
3. **Notice:** highlight the reusable chunk and give one short meaning cue. Japanese appears once if needed.
4. **See a consequence or solution:** the animation moves the story forward.
5. **Transfer:** show the same phrase working in a second, distinct situation.
6. **Speak:** one clean chance to say the chunk aloud, with enough silence to do so.
7. **Recall:** present a new situation before revealing the answer.

The learner should not have to pause a static card to understand the lesson. The phrase remains tied to an action, object or change in the world. Keep English speech primary. The first pilot uses a delivery problem and then a software launch problem to teach “run into a snag”. Those situations are illustrative fiction, not news footage.

## Formats and factory

- **Horizontal main video:** build a connected 4–6 minute story from several expression arcs, each with a new situation and a later recall. Do not stretch one phrase to fill the whole video.
- **Short cut:** one complete expression arc can be adapted to a 30–60 second vertical short. Keep the meaning, speaking and recall beats; do not just crop a landscape frame.
- **Factory input:** lesson JSON defines the target phrase, spoken lines, story world, actions and practice holds. TTS supplies measured speech duration. The compiler produces frame timing; Remotion renders the animation. A scene pack draws the world and its actions.
- **Expansion:** add world packs and visual actions as reusable components. The teaching sequence and timing contract stay shared. A new lesson should choose a world that makes its target meaning visible rather than forcing every phrase into the same road-obstacle metaphor.

## Candidate pilot

`fixtures/animation-english/run-into-a-snag.json` is the first pilot. `src/animation-english/` renders it; `scripts/build_animation_english_props.ts` combines lesson data with measured speech timing. The preview uses the existing Edge TTS pilot synthesizer and is for format review. Production speech should use the repository's established Kokoro pipeline after this lesson contract is connected to it.

Reproduce the local preview:

```text
python scripts/synthesize_v3_edge.py fixtures/animation-english/run-into-a-snag.json public/generated/animation-english/audio public/generated/animation-english/timing.json
npx tsx scripts/build_animation_english_props.ts fixtures/animation-english/run-into-a-snag.json public/generated/animation-english/timing.json generated/animation-english/audio work/animation-english/pilot-props.json
python scripts/generate_bgm.py work/animation-english/pilot-props.json public/generated/animation-english/bgm.wav
npx tsx scripts/build_animation_english_props.ts fixtures/animation-english/run-into-a-snag.json public/generated/animation-english/timing.json generated/animation-english/audio work/animation-english/pilot-props.json generated/animation-english/bgm.wav
npx remotion render src/animation-english/index.tsx AnimationEnglishLesson out/animation-english-snag-pilot.mp4 --props=work/animation-english/pilot-props.json --scale=0.6666667 --codec=h264 --crf=20
```

The manual GitHub Actions workflow `animation-english-preview.yml` builds a 540p review video and contact sheet from the same lesson JSON. It uploads an artifact; it does not publish to YouTube. On Windows, add `--browser-executable "C:\Program Files\Google\Chrome\Application\chrome.exe"` if Remotion's bundled browser fails to launch.

After a successful main-branch preview workflow, Pages mirrors the candidate at `/review-animation-english/`. This is a review surface, not a publication gate.

## Kinetic comparison candidate

`AnimationEnglishKinetic` is a second renderer for the same lesson JSON, measured narration, and duration. It uses a stronger opening, larger phrase moments, visible beat progression, a response timer for speak/recall, and short semantic sound cues generated by `scripts/generate_sfx.py`. It does not assign a score to a prerecorded viewer response. The original `AnimationEnglishLesson` render remains available as candidate A.

The preview workflow renders both versions and puts them side by side at `/review-animation-english/`. To reproduce candidate B locally after generating the pilot props and sound cues:

```text
python scripts/generate_sfx.py
npx remotion render src/animation-english/index.tsx AnimationEnglishKinetic out/animation-english-kinetic-pilot.mp4 --props=work/animation-english/pilot-props.json --scale=0.6666667 --codec=h264 --crf=21
```

This is a visual treatment over the shared teaching sequence. A future long-form episode can use the same beat vocabulary across several expression arcs. Judge the comparison by whether the situation and phrase become easier to remember without compromising the speaking and recall windows. No candidate is promoted to a production default by this experiment.

The full-lesson motion-rich candidate, with separately composed horizontal and vertical renders, is described in `docs/JUICY_ANIMATION_ENGLISH.md`. It uses the same measured lesson data and is review-only.

This candidate is independent of the `news-first-v3.0` stable pin and the in-progress V5 experiments. Do not add a `READY.json` or `APPROVED.json` for this lesson type until the new review and publishing path is explicitly implemented and checked. Publishing still requires a reviewed final artifact and explicit user approval.

## Review questions

- Can a viewer infer the meaning from the animation before the definition appears?
- Is the English phrase heard, seen, spoken and recalled without repetitive filler?
- Is the transfer situation genuinely different from the first story?
- Are the voice, on-screen words and character action synchronized?
- Is the screen readable at 720p, and does the voice remain clear?

The pilot is a short format test. Passing it does not establish long-form pacing. Review a multi-arc representative segment before changing the daily production pipeline.
