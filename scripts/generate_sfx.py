#!/usr/bin/env python3
import math, os, random, struct, wave
from pathlib import Path

SR=48000
OUT=Path("public/generated/sfx")
OUT.mkdir(parents=True,exist_ok=True)

def write(name,samples):
    peak=max(1e-9,max(abs(x) for x in samples))
    scale=.72/peak
    with wave.open(str(OUT/name),"wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        frames=b"".join(struct.pack("<h",int(max(-1,min(1,x*scale))*32767)) for x in samples)
        w.writeframes(frames)

def env(i,n,attack=.05,release=.35):
    t=i/max(1,n-1)
    a=min(1,t/max(attack,1e-6))
    r=min(1,(1-t)/max(release,1e-6))
    return min(a,r)

# Soft chapter rise/whoosh: filtered noise + low sine, ~0.85s.
n=int(SR*.85); rng=random.Random(17); vals=[]; lp=0.0
for i in range(n):
    t=i/SR; noise=rng.uniform(-1,1); lp=lp*.92+noise*.08
    sweep=math.sin(2*math.pi*(95+180*t*t)*t)
    vals.append((lp*.42+sweep*.25)*env(i,n,.08,.28))
write("chapter-whoosh.wav",vals)

# Phrase ping: two gentle sine partials, ~0.42s.
n=int(SR*.42); vals=[]
for i in range(n):
    t=i/SR; e=env(i,n,.01,.55)
    vals.append((math.sin(2*math.pi*660*t)*.38+math.sin(2*math.pi*990*t)*.18)*e)
write("phrase-ping.wav",vals)

# Check cue: low click + short confirmation tone, ~0.34s.
n=int(SR*.34); vals=[]
for i in range(n):
    t=i/SR; click=(rng.uniform(-1,1)*.22 if t<.025 else 0)
    tone=math.sin(2*math.pi*520*t)*.28*env(i,n,.02,.5)
    vals.append(click+tone)
write("check-cue.wav",vals)

print(f"generated {len(list(OUT.glob('*.wav')))} sfx in {OUT}")
