#!/bin/bash
# Roda no sandbox do Higgsfield. uso: ingest.sh lista.tsv  (id_do_drive<TAB>nome)
# Baixa do Drive (gdown, fallback curl), gera proxy 720p + folha de 12 frames com timecode, apaga o original.
# Pré-requisitos no sandbox: pip install gdown; fonte Montserrat-SemiBold em /home/user/fonts; pastas orig/ proxy/ sheets/ meta/.
cd /home/user/escuna
while IFS=$'\t' read -r id name <&3; do
  [ -z "$id" ] && continue
  base="${name%.*}"
  if [ ! -f "proxy/$base.mp4" ]; then
    echo "START $name $(date +%T)" >> ingest.log
    ok=0
    for try in 1 2; do
      timeout 300 python3 -m gdown -q -O "orig/$name" "$id" </dev/null >/dev/null 2>>ingest.err && [ -s "orig/$name" ] && { ok=1; break; }
      rm -f "orig/$name"; sleep 5
      timeout 300 curl -sSL -o "orig/$name" "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t" </dev/null 2>>ingest.err && [ "$(stat -c %s "orig/$name")" -gt 1000000 ] && { ok=1; break; }
      rm -f "orig/$name"; sleep 10
    done
    [ $ok = 1 ] || { echo "FAIL dl $name" >> ingest.log; continue; }
    ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate:format=duration -of csv=p=0 "orig/$name" > "meta/$base.txt" 2>&1
    ffmpeg -nostdin -v error -y -i "orig/$name" -vf "scale='if(gt(iw,ih),1280,-2)':'if(gt(iw,ih),-2,1280)'" -r 30 -c:v libx264 -preset veryfast -crf 22 -c:a aac -b:a 96k -movflags +faststart "proxy/$base.mp4" </dev/null 2>>ingest.err
    rm -f "orig/$name"
  fi
  if [ ! -f "sheets/$base.jpg" ]; then
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "proxy/$base.mp4")
    ffmpeg -nostdin -v error -y -i "proxy/$base.mp4" -vf "fps=12/$dur,scale=320:-2,drawtext=fontfile=/home/user/fonts/Montserrat-SemiBold.ttf:text='%{pts\:hms}':fontsize=22:fontcolor=white:box=1:boxcolor=black@0.5:x=8:y=8,tile=4x3" -frames:v 1 -q:v 5 "sheets/$base.jpg" </dev/null 2>>ingest.err
  fi
  echo "OK $name $(date +%T)" >> ingest.log
done 3< "$1"
echo "DONE $1 $(date +%T)" >> ingest.log
