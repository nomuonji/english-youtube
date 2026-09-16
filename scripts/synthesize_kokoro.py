#!/usr/bin/env python3
"""Generate exact sample-timed scene speech with local Kokoro ONNX.

Each semantic chunk is synthesized separately, then concatenated into one
scene-level WAV. Chunk boundaries therefore come from actual generated sample
positions, never word-count or fixed-duration estimates. Synthesized chunks are
cached by text + Kokoro configuration so READY retries and APPROVED renders do
not need to run inference again for unchanged narration.
"""
from __future__ import annotations

import hashlib
import importlib.metadata
import json
import os
import sys
from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

VOICE = os.environ.get("KOKORO_VOICE", "af_sarah")
SPEED = float(os.environ.get("KOKORO_SPEED", "1.00"))
LANG = os.environ.get("KOKORO_LANG", "en-us")
MODEL_PATH = Path(os.environ.get("KOKORO_MODEL_PATH", ".cache/kokoro/kokoro-v1.0.int8.onnx"))
VOICES_PATH = Path(os.environ.get("KOKORO_VOICES_PATH", ".cache/kokoro/voices-v1.0.bin"))
CHUNK_CACHE_DIR = Path(os.environ.get("KOKORO_CHUNK_CACHE_DIR", ".cache/kokoro-chunks"))
# News-first pacing: preserve real semantic boundaries without creating the
# stop-start rhythm of a drill video. Future content should also prefer fewer,
# meaningful chunks rather than splitting a sentence only for timing.
CHUNK_PAUSE_MS = int(os.environ.get("KOKORO_CHUNK_PAUSE_MS", "70"))
UTTERANCE_PAUSE_MS = int(os.environ.get("KOKORO_UTTERANCE_PAUSE_MS", "220"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def silence(sample_rate: int, milliseconds: int) -> np.ndarray:
    return np.zeros(round(sample_rate * milliseconds / 1000), dtype=np.float32)


def save_wav(path: Path, samples: np.ndarray, sample_rate: int) -> None:
    sf.write(path, samples.astype(np.float32, copy=False), sample_rate, subtype="PCM_16")


def chunk_cache_path(text: str, provider_version: str) -> Path:
    payload = json.dumps(
        {
            "provider": "kokoro-onnx",
            "providerVersion": provider_version,
            "voice": VOICE,
            "speed": SPEED,
            "lang": LANG,
            "text": text,
        },
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return CHUNK_CACHE_DIR / f"{hashlib.sha256(payload).hexdigest()}.wav"


def synthesize_chunk(kokoro: Kokoro, text: str, provider_version: str) -> tuple[np.ndarray, int, bool]:
    cache_path = chunk_cache_path(text, provider_version)
    if cache_path.exists():
        audio, sample_rate = sf.read(cache_path, dtype="float32", always_2d=False)
        audio = np.asarray(audio, dtype=np.float32).reshape(-1)
        if audio.size:
            return audio, int(sample_rate), True
        cache_path.unlink(missing_ok=True)

    audio, sample_rate = kokoro.create(text, voice=VOICE, speed=SPEED, lang=LANG)
    audio = np.asarray(audio, dtype=np.float32).reshape(-1)
    if audio.size == 0:
        raise RuntimeError("Kokoro returned empty audio")

    CHUNK_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    temp_path = cache_path.with_name(f"{cache_path.name}.{os.getpid()}.tmp.wav")
    save_wav(temp_path, audio, int(sample_rate))
    os.replace(temp_path, cache_path)
    return audio, int(sample_rate), False


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: synthesize_kokoro.py <manifest.json> <output-dir> [public-prefix]")
    manifest_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    public_prefix = sys.argv[3] if len(sys.argv) > 3 else "generated"
    output_dir.mkdir(parents=True, exist_ok=True)
    CHUNK_CACHE_DIR.mkdir(parents=True, exist_ok=True)

    if not MODEL_PATH.exists() or not VOICES_PATH.exists():
        raise FileNotFoundError(f"Kokoro model assets missing: {MODEL_PATH} / {VOICES_PATH}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    utterance_by_id = {item["id"]: item for item in manifest["utterances"]}
    provider_version = importlib.metadata.version("kokoro-onnx")
    kokoro = Kokoro(str(MODEL_PATH), str(VOICES_PATH))

    clips: list[dict[str, Any]] = []
    utterance_location: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
    bundle_sample_rate: int | None = None
    cache_hits = 0
    cache_misses = 0

    for scene in manifest["scenes"]:
        if scene["role"] == "retrieval" or not scene["utteranceIds"]:
            continue

        clip_id = f"speech-{scene['id']}"
        wav_path = output_dir / f"{clip_id}.wav"
        pieces: list[np.ndarray] = []
        cursor = 0
        timed_utterances: list[dict[str, Any]] = []

        for utterance_index, utterance_id in enumerate(scene["utteranceIds"]):
            utterance = utterance_by_id[utterance_id]
            chunk_starts: list[int] = []
            chunk_ends: list[int] = []
            utterance_start = cursor

            for chunk_index, chunk in enumerate(utterance["chunks"]):
                audio, sample_rate, cache_hit = synthesize_chunk(kokoro, chunk, provider_version)
                cache_hits += int(cache_hit)
                cache_misses += int(not cache_hit)
                if audio.size == 0:
                    raise RuntimeError(f"Kokoro returned empty audio for {utterance_id}:{chunk_index}")
                if bundle_sample_rate is None:
                    bundle_sample_rate = int(sample_rate)
                elif bundle_sample_rate != int(sample_rate):
                    raise RuntimeError(f"Kokoro sample rate changed: {bundle_sample_rate} -> {sample_rate}")

                chunk_starts.append(cursor)
                pieces.append(audio)
                cursor += int(audio.size)
                chunk_ends.append(cursor)

                is_last_chunk = chunk_index == len(utterance["chunks"]) - 1
                is_last_utterance = utterance_index == len(scene["utteranceIds"]) - 1
                pause_ms = 0
                if not is_last_chunk:
                    pause_ms = CHUNK_PAUSE_MS
                elif not is_last_utterance:
                    pause_ms = UTTERANCE_PAUSE_MS
                if pause_ms:
                    gap = silence(int(sample_rate), pause_ms)
                    pieces.append(gap)
                    cursor += int(gap.size)

            timed_utterances.append({
                "utteranceId": utterance_id,
                "startSample": utterance_start,
                "endSample": chunk_ends[-1],
                "chunkBoundariesSamples": chunk_starts,
                "chunkEndSamples": chunk_ends,
            })

        if bundle_sample_rate is None:
            raise RuntimeError("Kokoro produced no audio")
        scene_audio = np.concatenate(pieces)
        save_wav(wav_path, scene_audio, bundle_sample_rate)
        clip = {
            "clipId": clip_id,
            "sceneId": scene["id"],
            "path": f"{public_prefix}/{wav_path.name}",
            "sha256": sha256_file(wav_path),
            "sampleRate": bundle_sample_rate,
            "samples": int(scene_audio.size),
            "utterances": timed_utterances,
        }
        clips.append(clip)
        for timed in timed_utterances:
            utterance_location[timed["utteranceId"]] = (clip, timed)

    if bundle_sample_rate is None:
        raise RuntimeError("No speech clips generated")

    # Legacy v2.1 compatibility only. News-first manifests contain no retrieval scenes.
    for scene in manifest["scenes"]:
        if scene["role"] != "retrieval" or scene["visual"]["type"] != "retrieval":
            continue
        source_id = scene["visual"]["sourceUtteranceId"]
        source_clip, source_timing = utterance_location[source_id]
        source_path = output_dir / Path(source_clip["path"]).name
        source_audio, source_rate = sf.read(source_path, dtype="float32", always_2d=False)
        if int(source_rate) != bundle_sample_rate:
            raise RuntimeError(f"Retrieval source rate mismatch for {source_id}")
        source_audio = np.asarray(source_audio, dtype=np.float32).reshape(-1)
        start = int(source_timing["startSample"])
        end = int(source_timing["endSample"])
        retrieval_audio = source_audio[start:end]
        if retrieval_audio.size == 0:
            raise RuntimeError(f"Empty retrieval slice for {source_id}")

        clip_id = f"retrieval-{scene['id']}"
        wav_path = output_dir / f"{clip_id}.wav"
        save_wav(wav_path, retrieval_audio, bundle_sample_rate)
        chunk_starts = [int(value) - start for value in source_timing["chunkBoundariesSamples"]]
        chunk_ends = [int(value) - start for value in source_timing["chunkEndSamples"]]
        clips.append({
            "clipId": clip_id,
            "sceneId": scene["id"],
            "path": f"{public_prefix}/{wav_path.name}",
            "sha256": sha256_file(wav_path),
            "sampleRate": bundle_sample_rate,
            "samples": int(retrieval_audio.size),
            "utterances": [{
                "utteranceId": source_id,
                "startSample": 0,
                "endSample": int(retrieval_audio.size),
                "chunkBoundariesSamples": chunk_starts,
                "chunkEndSamples": chunk_ends,
            }],
        })

    timing = {
        "version": "1.0.0",
        "provider": "kokoro-onnx",
        "providerVersion": provider_version,
        "voice": VOICE,
        "speed": SPEED,
        "sampleRate": bundle_sample_rate,
        "clips": clips,
    }
    timing_path = output_dir / "tts-timing.json"
    timing_path.write_text(json.dumps(timing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "ok": True,
        "provider": "kokoro-onnx",
        "providerVersion": provider_version,
        "voice": VOICE,
        "speed": SPEED,
        "sampleRate": bundle_sample_rate,
        "clips": len(clips),
        "cacheHits": cache_hits,
        "cacheMisses": cache_misses,
        "timing": str(timing_path),
    }))


if __name__ == "__main__":
    main()
