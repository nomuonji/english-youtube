#!/usr/bin/env python3
"""Deterministic original music and semantic effects for the juicy lesson candidate."""

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
duration = props["durationFrames"] / props["fps"] + 0.2
out_dir.mkdir(parents=True, exist_ok=True)


def write(name, values, peak=0.6):
    high = max(1e-8, max(abs(v) for v in values))
    gain = min(1, peak / high)
    with wave.open(str(out_dir / name), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v * gain)) * 32767)) for v in values))


def sine(hz, t):
    return math.sin(2 * math.pi * hz * t)


def pulse(hz, t, width=0.32):
    return 1 if (hz * t) % 1 < width else -1


def env(t, length, attack=0.01, release=0.3):
    return min(1, t / max(attack, 1e-6), (length - t) / max(release, 1e-6))


# A punchier but speech-safe electronic bed. The chord changes follow scene boundaries.
beat = 60 / 126
roots = [110, 123.47, 146.83, 130.81]
scene_starts = [s["startFrame"] / props["fps"] for s in props["scenes"]]
bed = []
for i in range(int(SR * duration)):
    t = i / SR
    scene_index = max(0, sum(t >= start for start in scene_starts) - 1)
    root = roots[scene_index % len(roots)]
    b = (t % beat) / beat
    step = int(t / (beat / 2))
    kick = sine(58 - 18 * min(b * 5, 1), t) * math.exp(-b * 19) * 0.085
    bass = pulse(root, t, .38) * math.exp(-b * 3.8) * 0.042
    arpeggio = sine(root * [2, 2.5, 3, 4][step % 4], t) * math.exp(-((t % (beat / 2)) / (beat / 2)) * 7) * 0.022
    hat = sine(4500, t) * math.exp(-((t % (beat / 2)) / (beat / 2)) * 22) * 0.007
    fade = min(1, t / .18, max(0, (duration - t) / .28))
    bed.append((kick + bass + arpeggio + hat) * fade)
write("juicy-bgm.wav", bed, 0.21)


def effect(name, length, voice, peak=0.62):
    samples = [voice(i / SR, i) * env(i / SR, length, .004, length * .2) for i in range(int(SR * length))]
    write(name, samples, peak)


rng = random.Random(39)
effect("road-hit.wav", .8, lambda t, i: sine(105 - 60 * min(t / .8, 1), t) * math.exp(-t * 6) * .7 + rng.uniform(-1, 1) * math.exp(-t * 18) * .2)
effect("route-sweep.wav", .76, lambda t, i: sine(180 + 950 * (t / .76) ** 2, t) * math.exp(-t * 2) * .25 + sine(640, t) * math.exp(-t * 5) * .08)
effect("glitch.wav", .55, lambda t, i: (pulse(210 + int(t * 22) % 4 * 81, t, .13) * .2 + rng.uniform(-1, 1) * .12) * math.exp(-t * 7))
effect("phrase-glint.wav", .55, lambda t, i: (sine(720, t) + .5 * sine(1080, t) + .25 * sine(1440, t)) * math.exp(-t * 6) * .27)
effect("practice-ping.wav", .32, lambda t, i: (sine(660, t) + .42 * sine(990, t)) * math.exp(-t * 10) * .3)
effect("answer-burst.wav", 1.05, lambda t, i: (sine(130 - 40 * t, t) * math.exp(-t * 6) * .45 + sine(440 + 900 * t, t) * math.exp(-t * 3) * .25 + rng.uniform(-1, 1) * math.exp(-t * 20) * .1))
print(json.dumps({"durationSeconds": round(duration, 2), "assets": 7, "outputDir": str(out_dir)}))
