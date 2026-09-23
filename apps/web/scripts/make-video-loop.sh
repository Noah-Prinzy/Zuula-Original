#!/usr/bin/env bash
# Turns a stock clip into a small, seamless background loop for RouteBackdrop
# (public/videos/): 720p, 24 fps, greyscale, no audio. Writes <output>.mp4 (H.264, faststart)
# and <output>.webm (VP9) next to it; RouteBackdrop offers the WebM first, then the MP4.
#
# Seamless: it cuts LENGTH + FADE seconds starting at START, then crossfades the last FADE
# seconds into the first ones. The result is LENGTH seconds long and its last frame leads
# straight back into its first, so the loop point never shows.
#
# Usage:  scripts/make-video-loop.sh <input> <output.mp4> [start=1] [length=6] [fade=1]
# Needs ffmpeg with libx264 (https://ffmpeg.org/download.html); FFMPEG=/path/to/ffmpeg to pick one.
#
# Pick START where the motion is steady (no camera shake, no cut in the clip). Repetitive
# motion (a press, pages turning) loops best; 5–8 s is plenty behind the auth card.
# Aim for well under 1 MB each; if bigger, raise CRF (MP4) or WEBM_CRF (e.g. CRF=32 WEBM_CRF=44 …).
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

# The crossfade is fade (alpha) + overlay rather than xfade, so it runs on any ffmpeg build.
"${FFMPEG:-ffmpeg}" -hide_banner -y -ss "$start" -t "$segment" -i "$in" -an \
  -filter_complex "\
[0:v]scale=-2:720:flags=lanczos,fps=24,hue=s=0,format=yuv420p,split[a][b];\
[a]trim=start=$fade,setpts=PTS-STARTPTS[body];\
[b]trim=end=$fade,setpts=PTS-STARTPTS,format=yuva420p,fade=t=in:st=0:d=$fade:alpha=1,setpts=PTS+$offset/TB[head];\
[body][head]overlay=eof_action=pass,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf "$crf" -profile:v high -pix_fmt yuv420p \
  -movflags +faststart "$out"

webm="${out%.mp4}.webm"
"${FFMPEG:-ffmpeg}" -hide_banner -y -i "$out" -an \
  -c:v libvpx-vp9 -b:v 0 -crf "${WEBM_CRF:-40}" -row-mt 1 -deadline good -cpu-used 2 "$webm"

ls -lh "$out" "$webm"
