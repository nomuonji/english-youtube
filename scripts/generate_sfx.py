#!/usr/bin/env python3
import math, random, struct, wave
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

rng=random.Random(17)

# Chapter transition: short broadband rise with a low body.
n=int(SR*.72); vals=[]; lp=0.0
for i in range(n):
    t=i/SR; noise=rng.uniform(-1,1); lp=lp*.90+noise*.10
    sweep=math.sin(2*math.pi*(100+240*t*t)*t)
    vals.append((lp*.46+sweep*.26)*env(i,n,.06,.24))
write("chapter-whoosh.wav",vals)

# Hook impact: restrained low hit + short bright edge, designed for the first claim rather than a trailer boom.
n=int(SR*.55); vals=[]
for i in range(n):
    t=i/SR
    low=math.sin(2*math.pi*(78-20*min(t/.55,1))*t)*math.exp(-t*6.2)
    edge=(rng.uniform(-1,1)*math.exp(-t*18.0))
    vals.append(low*.62+edge*.12)
write("hook-impact.wav",vals)

# Metric reveal: compact tonal hit for number/count-up moments.
n=int(SR*.38); vals=[]
for i in range(n):
    t=i/SR; e=env(i,n,.006,.62)
    vals.append((math.sin(2*math.pi*390*t)*.32+math.sin(2*math.pi*585*t)*.18+math.sin(2*math.pi*780*t)*.08)*e)
write("metric-hit.wav",vals)

# English replay cue.
n=int(SR*.42); vals=[]
for i in range(n):
    t=i/SR; e=env(i,n,.01,.55)
    vals.append((math.sin(2*math.pi*660*t)*.38+math.sin(2*math.pi*990*t)*.18)*e)
write("phrase-ping.wav",vals)

# Legacy listening-check cue; kept for old v2.1 manifests.
n=int(SR*.34); vals=[]
for i in range(n):
    t=i/SR; click=(rng.uniform(-1,1)*.22 if t<.025 else 0)
    tone=math.sin(2*math.pi*520*t)*.28*env(i,n,.02,.5)
    vals.append(click+tone)
write("check-cue.wav",vals)

print(f"generated {len(list(OUT.glob('*.wav')))} sfx in {OUT}")
