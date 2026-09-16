#!/usr/bin/env python3
import json, math, random, struct, sys, wave
from pathlib import Path

props_path=Path(sys.argv[1] if len(sys.argv)>1 else "public/generated/render-props.json")
out_path=Path(sys.argv[2] if len(sys.argv)>2 else "public/generated/bgm.wav")
props=json.loads(props_path.read_text(encoding="utf-8"))
resolved=props.get("resolved",props)
fps=float(resolved.get("fps",30))
frames=int(resolved.get("durationFrames",fps*390))
duration=max(1.0,frames/fps+1.0)
sr=16000
n=int(duration*sr)
out_path.parent.mkdir(parents=True,exist_ok=True)

# Deterministic, low-density tech bed: warm pads + soft 92 BPM pulse. Speech stays primary.
chords=[(110.00,164.81,220.00),(98.00,146.83,196.00),(87.31,130.81,174.61),(98.00,146.83,220.00)]
bpm=92.0
beat=60.0/bpm
rng=random.Random(29)
with wave.open(str(out_path),"wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    block=bytearray(); noise_lp=0.0
    for i in range(n):
        t=i/sr
        chord=chords[int(t//12)%len(chords)]
        breathe=0.76+0.12*math.sin(2*math.pi*t/7.5)
        pad=0.0
        for j,f in enumerate(chord):
            pad += math.sin(2*math.pi*f*t+j*.65)/(j+2)
            pad += .20*math.sin(2*math.pi*(f/2)*t+j*.35)/(j+2)
        phase=(t%beat)/beat
        kick=math.sin(2*math.pi*(54+20*(1-phase))*t)*math.exp(-phase*8.5) if phase<.34 else 0.0
        eighth=(t%(beat/2))/(beat/2)
        tick=(1-eighth/.10) if eighth<.10 else 0.0
        noise_lp=noise_lp*.88+rng.uniform(-1,1)*.12
        texture=noise_lp*tick
        fade=min(1.0,t/2.0,max(0.0,(duration-t)/2.5))
        s=(pad*.072*breathe + kick*.026 + texture*.010)*fade
        s=max(-1.0,min(1.0,s))
        block += struct.pack('<h',int(s*32767))
        if len(block)>=65536:
            w.writeframesraw(block); block.clear()
    if block:w.writeframesraw(block)
print(json.dumps({"ok":True,"output":str(out_path),"durationSeconds":round(duration,3),"sampleRate":sr,"bpm":bpm}))
