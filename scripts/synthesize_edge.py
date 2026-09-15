#!/usr/bin/env python3
"""Prototype zero-key TTS provider using Microsoft's Edge speech endpoint via edge-tts.

This is intentionally an adapter, not a permanent provider contract. It emits 48 kHz
mono WAV clips plus word-derived utterance/chunk sample boundaries for the TS compiler.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import os
import re
import subprocess
import sys
import wave
from pathlib import Path
from typing import Any

import edge_tts

SAMPLE_RATE = 48_000
VOICE = os.environ.get("EDGE_TTS_VOICE", "en-US-AriaNeural")
RATE = os.environ.get("EDGE_TTS_RATE", "-5%")
TOKEN_RE = re.compile(r"[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)?")


def norm_token(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def source_tokens(text: str) -> list[str]:
    return [norm_token(item) for item in TOKEN_RE.findall(text) if norm_token(item)]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def ticks_to_samples(ticks: int) -> int:
    # Edge metadata uses 100 ns ticks.
    return round((ticks / 10_000_000) * SAMPLE_RATE)


def wav_samples(path: Path) -> int:
    with wave.open(str(path), "rb") as handle:
        if handle.getframerate() != SAMPLE_RATE or handle.getnchannels() != 1:
            raise RuntimeError(f"Unexpected WAV format: {path}")
        return handle.getnframes()


def run_ffmpeg(args: list[str]) -> None:
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


async def synthesize_mp3(text: str, output: Path) -> list[dict[str, Any]]:
    boundaries: list[dict[str, Any]] = []
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    with output.open("wb") as handle:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                handle.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                boundaries.append({
                    "text": chunk["text"],
                    "offset": int(chunk["offset"]),
                    "duration": int(chunk["duration"]),
                })
    if not boundaries:
        raise RuntimeError("edge-tts returned no WordBoundary metadata")
    return boundaries


def map_boundaries(scene: dict[str, Any], utterance_by_id: dict[str, dict[str, Any]], boundaries: list[dict[str, Any]], total_samples: int) -> list[dict[str, Any]]:
    expected: list[tuple[str, int, str]] = []
    for utterance_id in scene["utteranceIds"]:
        utterance = utterance_by_id[utterance_id]
        for chunk_index, chunk in enumerate(utterance["chunks"]):
            for token in source_tokens(chunk):
                expected.append((utterance_id, chunk_index, token))

    observed: list[tuple[int, str]] = []
    for index, boundary in enumerate(boundaries):
        token = norm_token(str(boundary["text"]))
        if token:
            observed.append((index, token))

    if [x[2] for x in expected] != [x[1] for x in observed]:
        exp = " ".join(x[2] for x in expected)
        got = " ".join(x[1] for x in observed)
        raise RuntimeError(
            f"WordBoundary alignment failed for {scene['id']}\nexpected: {exp}\nobserved: {got}"
        )

    groups: dict[str, dict[int, list[int]]] = {}
    for (utterance_id, chunk_index, _), (boundary_index, _) in zip(expected, observed, strict=True):
        groups.setdefault(utterance_id, {}).setdefault(chunk_index, []).append(boundary_index)

    resolved: list[dict[str, Any]] = []
    for utterance_id in scene["utteranceIds"]:
        utterance = utterance_by_id[utterance_id]
        chunk_ranges: list[tuple[int, int]] = []
        for chunk_index in range(len(utterance["chunks"])):
            indices = groups[utterance_id][chunk_index]
            first = boundaries[indices[0]]
            last = boundaries[indices[-1]]
            start = ticks_to_samples(first["offset"])
            end = ticks_to_samples(last["offset"] + last["duration"])
            chunk_ranges.append((max(0, start), min(total_samples, end)))
        resolved.append({
            "utteranceId": utterance_id,
            "startSample": chunk_ranges[0][0],
            "endSample": chunk_ranges[-1][1],
            "chunkBoundariesSamples": [item[0] for item in chunk_ranges],
            "chunkEndSamples": [item[1] for item in chunk_ranges],
        })
    return resolved


async def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: synthesize_edge.py <manifest.json> <output-dir> [public-prefix]")
    manifest_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    public_prefix = sys.argv[3] if len(sys.argv) > 3 else "generated"
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    utterance_by_id = {item["id"]: item for item in manifest["utterances"]}

    clips: list[dict[str, Any]] = []
    utterance_location: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
    for scene in manifest["scenes"]:
        if scene["role"] == "retrieval" or not scene["utteranceIds"]:
            continue
        utterances = [utterance_by_id[item] for item in scene["utteranceIds"]]
        text = " ".join(item["text"] for item in utterances)
        clip_id = f"speech-{scene['id']}"
        mp3_path = output_dir / f"{clip_id}.mp3"
        wav_path = output_dir / f"{clip_id}.wav"
        boundaries = await synthesize_mp3(text, mp3_path)
        run_ffmpeg(["-i", str(mp3_path), "-ar", str(SAMPLE_RATE), "-ac", "1", "-c:a", "pcm_s16le", str(wav_path)])
        mp3_path.unlink(missing_ok=True)
        samples = wav_samples(wav_path)
        mapped = map_boundaries(scene, utterance_by_id, boundaries, samples)
        clip = {
            "clipId": clip_id,
            "sceneId": scene["id"],
            "path": f"{public_prefix}/{wav_path.name}",
            "sha256": sha256_file(wav_path),
            "sampleRate": SAMPLE_RATE,
            "samples": samples,
            "utterances": mapped,
        }
        clips.append(clip)
        for item in mapped:
            utterance_location[item["utteranceId"]] = (clip, item)

    for scene in manifest["scenes"]:
        if scene["role"] != "retrieval" or scene["visual"]["type"] != "retrieval":
            continue
        source_id = scene["visual"]["sourceUtteranceId"]
        source_clip, source_utterance = utterance_location[source_id]
        start_sample = int(source_utterance["startSample"])
        end_sample = int(source_utterance["endSample"])
        samples = max(1, end_sample - start_sample)
        clip_id = f"retrieval-{scene['id']}"
        wav_path = output_dir / f"{clip_id}.wav"
        start_sec = start_sample / SAMPLE_RATE
        duration_sec = samples / SAMPLE_RATE
        source_path = output_dir / Path(source_clip["path"]).name
        run_ffmpeg([
            "-ss", f"{start_sec:.9f}", "-i", str(source_path), "-t", f"{duration_sec:.9f}",
            "-ar", str(SAMPLE_RATE), "-ac", "1", "-c:a", "pcm_s16le", str(wav_path),
        ])
        actual_samples = wav_samples(wav_path)
        source = utterance_by_id[source_id]
        relative_chunk_starts = [max(0, int(value) - start_sample) for value in source_utterance["chunkBoundariesSamples"]]
        relative_chunk_ends = [min(actual_samples, max(0, int(value) - start_sample)) for value in source_utterance["chunkEndSamples"]]
        clips.append({
            "clipId": clip_id,
            "sceneId": scene["id"],
            "path": f"{public_prefix}/{wav_path.name}",
            "sha256": sha256_file(wav_path),
            "sampleRate": SAMPLE_RATE,
            "samples": actual_samples,
            "utterances": [{
                "utteranceId": source_id,
                "startSample": 0,
                "endSample": actual_samples,
                "chunkBoundariesSamples": relative_chunk_starts,
                "chunkEndSamples": relative_chunk_ends,
            }],
        })

    timing = {
        "version": "1.0.0",
        "provider": "edge-tts",
        "providerVersion": getattr(edge_tts, "__version__", "7.2.1"),
        "voice": VOICE,
        "rate": RATE,
        "sampleRate": SAMPLE_RATE,
        "clips": clips,
    }
    timing_path = output_dir / "tts-timing.json"
    timing_path.write_text(json.dumps(timing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "provider": "edge-tts", "voice": VOICE, "clips": len(clips), "timing": str(timing_path)}))


if __name__ == "__main__":
    asyncio.run(main())
