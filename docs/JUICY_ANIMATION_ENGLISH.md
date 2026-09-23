# Motion-rich animated English candidate

Status: **candidate C for review**, 2026-09-24.

The [reference clip](https://x.com/nickfromlater/status/2102504454721347822) was supplied as a bar for motion quality and sensory feedback. Its card subject was not the request. Candidate C applies the underlying techniques to the entire existing English lesson: anticipation, impact, overshoot, camera response, secondary particles, light, rhythm, and meaningful sound. It keeps the delivery and software launch situations. It does not use the reference's art or audio.

## Full lesson motion grammar

| Learning beat | Visual action | Audio cue |
| --- | --- | --- |
| Story setup | Moving vehicle, speed lines, approaching problem | Music establishes pace |
| Obstacle | Barrier impact, camera shake, color flash, debris, phrase pop | Road hit |
| Notice | Phrase scales in, highlighted word, meaning underlined | Phrase glint |
| Resolution | Route draws across the city, motion accelerates | Route sweep |
| Transfer | Software launch error glitches in, same phrase appears | Glitch |
| Speak | Phrase remains readable; response bar and waveform start after the measured voice ends | Practice ping |
| Recall | New situation and a visible response window; answer stays hidden | Practice ping |
| Answer | Phrase and confirmation arrive with one final burst | Answer burst |

The effect triggers come from the lesson's `mode`, `action`, and measured `speechFrames`. The lesson phrase, meaning, captions, scene timing, voice, and story illustrations remain data driven. The user does not receive a fake score for an answer the prerecorded video cannot observe. High-motion effects pause around the meaning and response windows so the words remain readable.

`src/animation-english/JuicyLessonVideo.tsx` renders the full 38.8-second fixture in both 16:9 and 9:16, with separate positioning for captions and motion events. `scripts/generate_juicy_audio.py` creates original music and six semantic cues. The GitHub Actions preview builds both sizes, normalizes audio, and updates `/review-animation-english/`. This is a comparison candidate, not a production publishing version.

Reproduce after generating the regular lesson narration and measured props:

```text
python scripts/generate_juicy_audio.py work/animation-english/pilot-props.json public/generated/animation-english
npx remotion render src/animation-english/index.tsx AnimationEnglishJuicyWide out/animation-english-juicy-wide.mp4 --props=work/animation-english/pilot-props.json --scale=0.5 --codec=h264 --crf=21
npx remotion render src/animation-english/index.tsx AnimationEnglishJuicyShort out/animation-english-juicy-short.mp4 --props=work/animation-english/pilot-props.json --scale=0.5 --codec=h264 --crf=21
```

The next factory improvement is to add world/action packs for new stories while keeping this motion grammar shared. The current `street` and `office` packs demonstrate a complete expression arc; a new expression should choose illustrations that convey its meaning rather than reusing a road obstacle automatically.
