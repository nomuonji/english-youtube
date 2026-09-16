#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import json
import math
import subprocess
import sys
from pathlib import Path

import edge_tts

FPS = 30


def duration_seconds(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


async def main() -> None:
    spec_path = Path(sys.argv[1] if len(sys.argv) > 1 else "episodes/2026-09-15-ai-power-project/v3.json")
    out_dir = Path(sys.argv[2] if len(sys.argv) > 2 else "public/generated/v3/audio")
    timing_path = Path(sys.argv[3] if len(sys.argv) > 3 else "public/generated/v3/timing.json")
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    out_dir.mkdir(parents=True, exist_ok=True)
    timing_path.parent.mkdir(parents=True, exist_ok=True)

    voice = spec.get("voice", "ja-JP-KeitaNeural")
    rate = spec.get("rate", "+8%")
    pitch = spec.get("pitch", "-2Hz")
    cursor = 0
    resolved = []

    for scene in spec["scenes"]:
        path = out_dir / f"{scene['id']}.mp3"
        communicate = edge_tts.Communicate(
            scene["narrationJa"],
            voice=voice,
            rate=rate,
            pitch=pitch,
            volume="+0%",
        )
        await communicate.save(str(path))
        seconds = duration_seconds(path)
        # A small tail lets a visual land without leaving dead air. Never infer
        # speech timing from text length: duration comes from the encoded audio.
        frames = max(105, math.ceil((seconds + 0.42) * FPS))
        resolved.append({
            "id": scene["id"],
            "startFrame": cursor,
            "durationFrames": frames,
            "speechSeconds": round(seconds, 3),
            "audioPath": f"generated/v3/audio/{path.name}",
        })
        cursor += frames

    payload = {
        "version": "3.0.0",
        "provider": "edge-tts",
        "voice": voice,
        "rate": rate,
        "pitch": pitch,
        "fps": FPS,
        "durationFrames": cursor,
        "durationSeconds": round(cursor / FPS, 3),
        "scenes": resolved,
    }
    timing_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "voice": voice, "scenes": len(resolved), "durationSeconds": payload["durationSeconds"], "timing": str(timing_path)}, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
