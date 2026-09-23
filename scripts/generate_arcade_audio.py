#!/usr/bin/env python3
"""Create original, deterministic chiptune cues for the Arcade English preview."""

import json
import math
import random
import struct
import sys
import wave
from pathlib import Path

SR = 48000
props_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("work/animation-english/pilot-props.json")
out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("public/generated/animation-english")
props = json.loads(props_path.read_text(encoding="utf-8"))
notice_index = next(i for i, scene in enumerate(props["scenes"]) if scene["mode"] == "notice")
notice = props["scenes"][notice_index]
preview_frames = notice["startFrame"] + notice["durationFrames"]
seconds = preview_frames / props["fps"] + 0.15
reveal_at = props["scenes"][notice_index - 1]["startFrame"] / props["fps"]
out_dir.mkdir(parents=True, exist_ok=True)


def save(path, samples, peak=0.55):
    maximum = max(1e-8, max(abs(v) for v in samples))
    gain = min(1.0, peak / maximum)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v * gain)) * 32767)) for v in samples))


def tone(hz, t):
    return math.sin(2 * math.pi * hz * t)


def pulse(hz, t, width=0.25):
    return 1.0 if (t * hz) % 1 < width else -1.0


# A sparse 8-bit bed: low pulse bass, quiet arpeggio and crisp ticks.
beat = 60 / 112
roots = [110.0, 130.81, 98.0, 146.83]
bed = []
for i in range(int(seconds * SR)):
    t = i / SR
    step = int(t / (beat / 2))
    root = roots[(step // 8) % len(roots)]
    phase = (t % (beat / 2)) / (beat / 2)
    bass = pulse(root, t, 0.46) * (1 - phase) ** 2 * 0.105
    arp_hz = root * [2, 2.5, 3, 4][step % 4]
    arp = pulse(arp_hz, t, 0.18) * (1 - phase) ** 3 * 0.042
    tick = (1 - (t % beat) / beat) ** 17 * tone(1700, t) * 0.022
    transition = 1.0 - 0.16 * math.exp(-((t - reveal_at) / 0.24) ** 2)
    fade = min(1.0, t / 0.15, max(0.0, (seconds - t) / 0.2))
    bed.append((bass + arp + tick) * transition * fade)
save(out_dir / "arcade-bgm.wav", bed, 0.23)

# Layered reveal: short low hit, pitch sweep, bright arpeggio and pixel noise.
rng = random.Random(9724)
effect = []
for i in range(int(1.25 * SR)):
    t = i / SR
    boom = tone(78 - 22 * min(t, 1), t) * math.exp(-t * 7) * 0.45
    sweep = tone(220 + 1050 * min(t / 0.48, 1) ** 2, t) * math.exp(-t * 3.5) * 0.16
    sparkle_step = int(t / 0.12)
    sparkle_freq = [392, 494, 587, 784, 988, 1175, 1568, 1976][min(sparkle_step, 7)]
    sparkle = tone(sparkle_freq, t) * math.exp(-(t % 0.12) * 20) * 0.1 if t > 0.1 else 0
    crackle = rng.uniform(-1, 1) * math.exp(-t * 13) * 0.08
    effect.append(boom + sweep + sparkle + crackle)
save(out_dir / "arcade-reveal.wav", effect, 0.62)
print(json.dumps({"durationSeconds": round(seconds, 2), "outputDir": str(out_dir), "assets": 2}))
