# Animated explainer factory — code-only proof

This is a separate candidate format for `english-youtube`. It combines one clear explanatory diagram with a continuously animated world. It does not change the stable news-first renderer or promote an experience version.

## What is reusable

`src/animated-explainer/` renders an episode from JSON. The factory owns the 16:9 canvas, three-stage layout, stage reveal timing, moving flow, title-to-question change, English captions and optional narration track. Six stage icons are currently drawn with SVG: `server`, `grid`, `power`, `factory`, `process`, `package`. No image asset is needed for this proof.

The content JSON owns the words, icon choices, reveal frames, caption timings, direction of the flow, duration and an optional audio path. The AI-power fixture uses the first 12.5 seconds of the existing measured opening. `process-demo.json` uses different words, icons, timing and flow direction to exercise the same renderer. It is a format fixture, not a news episode.

For a real episode, `scripts/build_animated_explainer.ts` resolves stage and caption cue references against the production pipeline's measured narration props. The storyboard specifies *which* utterance chunk triggers each event; the compiler supplies the actual frame timing and copies the manifest hash into the render config. This avoids estimating subtitle timing from text length.

The current template supports a three-stage causal flow. Other explanation shapes, such as comparisons, branching decisions and timelines, should become additional templates sharing the same cue and media contract. Do not force those stories into three stages.

## Render

```text
npx tsx scripts/build_animated_explainer.ts work/ab-baseline/stable-v3-render-props.json fixtures/animated-explainer/ai-power-storyboard.json work/animated-explainer/ai-power-props.json
npx remotion render src/animated-explainer/index.tsx AnimatedExplainer out/animated-explainer-ai-power-silent.mp4 --props=work/animated-explainer/ai-power-props.json --scale=0.6666667 --codec=h264 --crf=20 --concurrency=4
npx remotion still src/animated-explainer/index.tsx AnimatedExplainer out/animated-explainer-process.png --props=fixtures/animated-explainer/process-demo.json --frame=180 --scale=0.6666667
```

For a voice preview, pass `config.audioSrc` as a path inside `public/`, or mux narration from the exact measured episode audio after rendering. The checked-in fixtures contain no generated audio. Never attach an unrelated voice track to a news claim.

The reviewed 12.5-second proof used the audio track from the stable comparison render packaged with the measured props:

```text
ffmpeg -i out/animated-explainer-ai-power-silent.mp4 -i work/ab-baseline/stable-v3.mp4 -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -t 12.5 -movflags +faststart out/animated-explainer-ai-power.mp4
```

On Windows, pass `--browser-executable "C:\Program Files\Google\Chrome\Application\chrome.exe"` to Remotion if its bundled browser does not launch.

## Limits of the proof

The layout, diagrams, labels and motion are code. The concept image's intricate hand-painted landscape, texture and environmental detail would require authored art assets to match precisely. The code version chooses a cleaner diagram language so labels stay readable at normal video size. This is a 12.5-second opening test, not a completed 5–6.5-minute production episode. It needs actual visual and audio review before extending the format.
