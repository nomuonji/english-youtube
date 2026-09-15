#!/usr/bin/env python3
import json, math, struct, sys, wave
from pathlib import Path

props_path=Path(sys.argv[1] if len(sys.argv)>1 else "public/generated/render-props.json")
out_path=Path(sys.argv[2] if len(sys.argv)>2 else "public/generated/bgm.wav")
props=json.loads(props_path.read_text(encoding="utf-8"))
resolved=props.get("resolved",props)
fps=float(resolved.get("fps",30))
frames=int(resolved.get("durationFrames",fps*450))
duration=max(1.0,frames/fps+1.0)
sr=16000
n=int(duration*sr)
out_path.parent.mkdir(parents=True,exist_ok=True)
# Quiet, warm, non-melodic pad. Chords change slowly so speech remains dominant.
chords=[(110.00,164.81,220.00),(98.00,146.83,196.00),(87.31,130.81,174.61),(98.00,146.83,220.00)]
with wave.open(str(out_path),"wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    block=bytearray()
    for i in range(n):
        t=i/sr
        chord=chords[int(t//16)%len(chords)]
        # Slow breathing envelope + very soft pulse, no percussion.
        breathe=0.70+0.18*math.sin(2*math.pi*t/8.0)
        pulse=0.88+0.08*math.sin(2*math.pi*t/2.0)
        v=0.0
        for j,f in enumerate(chord):
            v += math.sin(2*math.pi*f*t + j*0.7)/(j+2)
            v += 0.24*math.sin(2*math.pi*(f/2)*t + j*0.4)/(j+2)
        # Gentle high shimmer far below narration.
        v += 0.08*math.sin(2*math.pi*329.63*t)
        fade=min(1.0,t/2.5,max(0.0,(duration-t)/3.0))
        s=max(-1.0,min(1.0,v*0.085*breathe*pulse*fade))
        block += struct.pack('<h',int(s*32767))
        if len(block)>=65536:
            w.writeframesraw(block); block.clear()
    if block:w.writeframesraw(block)
print(json.dumps({"ok":True,"output":str(out_path),"durationSeconds":round(duration,3),"sampleRate":sr}))
