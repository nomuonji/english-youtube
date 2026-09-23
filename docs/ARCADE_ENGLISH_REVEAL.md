# Arcade English reveal — visual quality candidate

Status: **opening candidate for review**, 2026-09-23.

The visual bar is the [retro game card reveal reference](https://x.com/nickfromlater/status/2102504454721347822): one event grows into a physical card flip, light, fragments, and a resolved screen. The reference is inspiration for motion density and staging. Its art, UI, music, and sound are not used here.

## Learning use

The first 13 seconds of the `run into a snag` pilot now have a third candidate. A delivery moves toward its destination; a road barrier falls; the phrase appears as a discovery card; the card face supplies the meaning. The card is not a reward for an unobserved viewer action. This is a visual mnemonic for the story's vocabulary.

The voice, phrase, and measured TTS timing remain the same as candidates A and B. Candidate C is deliberately a representative opening rather than a new full 39-second episode. The next editorial decision is whether this level of art and motion helps comprehension enough to justify expanding the visual system to transfer, speaking, and recall.

## Factory components

- `ArcadeRevealVideo.tsx` is a frame-deterministic renderer. It reads the existing lesson contract and measured scene frames. The phrase, meaning, voice, and timing are data, not authored into the animation.
- `PixelRoom`, `DeliverySprite`, `RuneCard`, and `Burst` form the initial world pack and reveal grammar. `RuneCard` and `Burst` can be reused with another target phrase; a new story needs an appropriate world/action pack.
- `generate_arcade_audio.py` creates the original chiptune bed and reveal cue from the measured preview length. No third-party music or sound asset is included.
- Two Remotion compositions render the same opening as 16:9 and 9:16. The vertical layout is repositioned, not cropped from the horizontal video.
- GitHub Actions renders both sizes, normalizes audio, and uploads videos and contact sheets. Pages includes them in `/review-animation-english/` alongside A and B. There is no YouTube publishing path for this candidate.

After generating the normal pilot props and narration:

```text
python scripts/generate_arcade_audio.py work/animation-english/pilot-props.json public/generated/animation-english
npx remotion render src/animation-english/index.tsx AnimationEnglishArcadeWide out/animation-english-arcade-wide.mp4 --props=work/animation-english/pilot-props.json --scale=0.5 --codec=h264 --crf=21
npx remotion render src/animation-english/index.tsx AnimationEnglishArcadeShort out/animation-english-arcade-short.mp4 --props=work/animation-english/pilot-props.json --scale=0.5 --codec=h264 --crf=21
```

Review whether the delivery and road closure are clear before the phrase card appears, whether the reveal lands with the spoken phrase, whether the meaning stays readable, and whether the music and effect leave the narration clear. If the opening passes, carry the same visual grammar through a full expression arc before using it in a multi-arc long-form episode.
