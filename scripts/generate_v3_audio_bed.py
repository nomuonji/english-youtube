#!/usr/bin/env python3
import json, math, random, struct, sys, wave
from pathlib import Path

props_path=Path(sys.argv[1] if len(sys.argv)>1 else "public/generated/v3/render-props.json")
out_dir=Path(sys.argv[2] if len(sys.argv)>2 else "public/generated/v3")
props=json.loads(props_path.read_text(encoding="utf-8"))
frames=int(props["timing"]["durationFrames"]);fps=float(props["timing"].get("fps",30));duration=frames/fps+1.0
sr=48000
out_dir.mkdir(parents=True,exist_ok=True);(out_dir/"sfx").mkdir(parents=True,exist_ok=True)

def write_wav(path,samples,peak=.72):
    mx=max(1e-9,max(abs(x) for x in samples));scale=peak/mx
    with wave.open(str(path),"wb") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr)
        block=bytearray()
        for x in samples:
            block+=struct.pack("<h",int(max(-1,min(1,x*scale))*32767))
            if len(block)>=65536:w.writeframesraw(block);block.clear()
        if block:w.writeframesraw(block)

def env(i,n,a=.02,r=.25):
    t=i/max(1,n-1);return min(1,t/max(a,1e-6),(1-t)/max(r,1e-6))

# 92 BPM dark electronic pulse: low drone + syncopated pluck + restrained noise hats.
bpm=92.0;beat=60/bpm;n=int(duration*sr);rng=random.Random(31);samples=[];lp=0.0
notes=[55.0,55.0,65.41,49.0]
for i in range(n):
    t=i/sr;bar=int(t/(beat*4));root=notes[bar%len(notes)]
    bass=(math.sin(2*math.pi*root*t)*.42+math.sin(2*math.pi*(root*2)*t)*.12)
    beat_pos=(t%beat)/beat
    kick=math.sin(2*math.pi*(48+38*(1-beat_pos))*t)*math.exp(-beat_pos*15) if beat_pos<.32 else 0
    eighth=(t%(beat/2))/(beat/2);pluck=math.sin(2*math.pi*(root*4)*t)*math.exp(-eighth*9)
    noise=rng.uniform(-1,1);lp=.94*lp+.06*noise;hat=(noise-lp)*math.exp(-eighth*18)
    shimmer=.06*math.sin(2*math.pi*(root*6)*t+.7)
    fade=min(1,t/1.5,max(0,(duration-t)/2.0))
    samples.append((bass*.33+kick*.22+pluck*.10+hat*.025+shimmer)*fade)
write_wav(out_dir/"bgm.wav",samples,.62)

# Hook impact.
n=int(sr*.75);vals=[]
for i in range(n):
    t=i/sr;e=env(i,n,.005,.55);sub=math.sin(2*math.pi*(62-22*t)*t)*.75;click=(rng.uniform(-1,1)*.20 if t<.035 else 0);vals.append((sub+click)*e)
write_wav(out_dir/"sfx"/"impact.wav",vals,.78)

# Transition whoosh.
n=int(sr*.48);vals=[];lp=0
for i in range(n):
    t=i/sr;noise=rng.uniform(-1,1);lp=.90*lp+.10*noise;sweep=math.sin(2*math.pi*(140+700*t*t)*t);vals.append((lp*.34+sweep*.10)*env(i,n,.04,.28))
write_wav(out_dir/"sfx"/"whoosh.wav",vals,.64)

# Data rise: ascending clean tones.
n=int(sr*.82);vals=[]
for i in range(n):
    t=i/sr;e=env(i,n,.01,.35);freq=420+520*(t/.82);vals.append((math.sin(2*math.pi*freq*t)*.28+math.sin(2*math.pi*freq*2*t)*.08)*e)
write_wav(out_dir/"sfx"/"data-rise.wav",vals,.58)
print(json.dumps({"ok":True,"durationSeconds":round(duration,3),"bgm":str(out_dir/"bgm.wav")}))
