#!/usr/bin/env bash
# Turns a stock clip into a small, seamless background loop for RouteBackdrop
# (public/videos/*.mp4): 720p, 24 fps, greyscale, no audio, H.264 with faststart.
#
# Seamless: it cuts LENGTH + FADE seconds starting at START, then crossfades the last FADE
# seconds into the first ones. The result is LENGTH seconds long and its last frame leads
# straight back into its first, so the loop point never shows.
#
# Usage:  scripts/make-video-loop.sh <input.mp4> <output.mp4> [start=1] [length=6] [fade=1]
# Needs ffmpeg with libx264 (https://ffmpeg.org/download.html).
#
# Pick START where the motion is steady (no camera shake, no cut in the clip). Repetitive
# motion (a press, pages turning) loops best; 5–8 s is plenty behind the auth card.
# Aim for under ~1.5 MB; if it's bigger, raise CRF (e.g. CRF=32 scripts/make-video-loop.sh …).
set -euo pipefail

if [ $# -lt 2 ]; then
  sed -n '2,15p' "$0"
  exit 1
fi

in=$1
out=$2
start=${3:-1}
length=${4:-6}
fade=${5:-1}
crf=${CRF:-30}

segment=$(awk "BEGIN { print $length + $fade }")
offset=$(awk "BEGIN { print $length - $fade }")

ffmpeg -hide_banner -y -ss "$start" -t "$segment" -i "$in" -an \
  -filter_complex "\
[0:v]scale=-2:720:flags=lanczos,fps=24,hue=s=0,format=yuv420p,split[a][b];\
[a]trim=start=$fade,setpts=PTS-STARTPTS[body];\
[b]trim=end=$fade,setpts=PTS-STARTPTS[head];\
[body][head]xfade=transition=fade:duration=$fade:offset=$offset,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf "$crf" -profile:v high -pix_fmt yuv420p \
  -movflags +faststart "$out"

ls -lh "$out"
