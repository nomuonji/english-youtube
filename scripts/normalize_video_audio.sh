#!/usr/bin/env bash
set -euo pipefail

video="${1:?usage: normalize_video_audio.sh <video.mp4>}"
target_i="${TARGET_LUFS:--16}"
# loudnorm controls the PCM signal before AAC encoding. AAC can create
# inter-sample overshoot, so keep additional pre-encode headroom. On the
# production narration fixture, -4.5 dBTP lands at about -1.4 dBTP after AAC.
pre_encode_tp="${PRE_ENCODE_TRUE_PEAK:--4.5}"
target_lra="${TARGET_LRA:-7}"

if [ ! -s "$video" ]; then
  echo "Video not found or empty: $video" >&2
  exit 2
fi

for bin in ffmpeg ffprobe; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "$bin is required" >&2
    exit 2
  fi
done

case "$video" in
  *.mp4) normalized="${video%.mp4}.normalized.mp4" ;;
  *) normalized="${video}.normalized.mp4" ;;
esac

echo "[audio-normalize] target: I=${target_i} LUFS, pre-AAC TP=${pre_encode_tp} dBFS, LRA=${target_lra} LU"

# Keep the rendered H.264 stream bit-for-bit and normalize only the narration.
# 48 kHz mono matches the generated speech path and avoids loudnorm's internal
# oversampling rate leaking into the output container.
ffmpeg -hide_banner -loglevel error -y \
  -i "$video" \
  -map 0:v:0 -map 0:a:0 \
  -c:v copy \
  -af "loudnorm=I=${target_i}:TP=${pre_encode_tp}:LRA=${target_lra}" \
  -c:a aac -b:a 192k -ar 48000 -ac 1 \
  -movflags +faststart \
  "$normalized"

mv "$normalized" "$video"

# Print a compact post-codec loudness report into Actions logs for review.
ffmpeg -hide_banner -nostats -i "$video" \
  -filter_complex ebur128=peak=true -f null - 2>&1 \
  | awk '/Integrated loudness:/{capture=1} capture{print} /True peak:/{peak=1} peak && /Peak:/{print; exit}'

ffprobe -v error \
  -show_entries format=duration:stream=codec_type,codec_name,sample_rate,channels \
  -of default=noprint_wrappers=1 "$video"
