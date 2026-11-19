#!/bin/zsh
# Takes the app's screens for krovvi.com from a simulator that is already up with the Krovvi development build on a
# running Metro (19 November 2026: the site shows today's app, taken at the phone's own 3x). One call, one thing:
#
#   zsh take.sh still <name> <path?query> [seconds=6]          a page opened, then its picture
#   zsh take.sh ask   <name> <path?query> [seconds=9]          filmed from the moment the page opens (a chat that types by itself)
#   zsh take.sh tap   <name> <path?query> "<label>" [seconds=7] [wait=7]   its picture, then a film of one tap and what follows
#   zsh take.sh run   <name> <path?query> [seconds=6] [wait=6]  its picture, then a film of it running by itself
#   zsh take.sh tapxy <name> <path?query> <x> <y> [seconds=7] [wait=7]   the same, the tap at a place in points
#   zsh take.sh frame <key> "<label>"                           where a control sits now, into frames.json
#   zsh take.sh labels                                          every label on screen, to find one to tap
#
# A lab-site scene says its clock in a label nobody sees ("site-clock 18:12"); the status bar is set to it before any
# picture is taken, so the phone's time and the chat's time agree. Raw files go to $RAW (kept outside /tmp); nothing is
# sized or cut here (cut.sh does that). Every outside command has a time limit.
set -u
HERE=${0:A:h}
UDID=${UDID:-97AB0E15-60CE-435B-BCAC-A9C613E3CCAA}
RAW=${RAW:-$HOME/.krovvi/site19/raw}
IDB=${IDB:-$HOME/Library/Python/3.9/bin/idb}
mkdir -p "$RAW"
T() { local secs=$1; shift; perl -e 'alarm shift; exec @ARGV' "$secs" "$@"; }
UI() { T 60 python3 "$HERE/idb_ui.py" "$UDID" "$@"; }
say() { print -r -- "[take] $*"; }
bar() { T 15 xcrun simctl status_bar "$UDID" override --time "$1" --dataNetwork wifi --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 --batteryState discharging --batteryLevel 100 >/dev/null 2>&1; }
visit() { T 20 xcrun simctl openurl "$UDID" "krovvi:///$1"; }
shot() { T 30 xcrun simctl io "$UDID" screenshot --type=png "$RAW/$1.png" >/dev/null 2>&1 && say "picture $1" || say "NO picture for $1"; }
# The scene's own clock, read off the screen; nothing for a page that says none.
clock() {
  local c
  c=$(T 25 "$IDB" ui describe-all --udid "$UDID" 2>/dev/null | grep -o 'site-clock [0-9][0-9]:[0-9][0-9]' | head -1 | awk '{print $2}')
  [[ -n $c ]] && { bar "$c"; say "clock $c"; }
}
REC=""
rec() { T 600 xcrun simctl io "$UDID" recordVideo --codec h264 --force "$RAW/$1.mov" >/dev/null 2>&1 & REC=$!; sleep 0.9; }
endrec() {
  [[ -z $REC ]] && return
  # the recorder is the child of the time limit's own process: both are asked to finish
  pkill -INT -P $REC 2>/dev/null; kill -INT $REC 2>/dev/null
  for i in {1..40}; do kill -0 $REC 2>/dev/null || break; sleep 0.25; done
  kill -9 $REC 2>/dev/null; wait $REC 2>/dev/null; REC=""; sleep 0.4
}
trap endrec EXIT INT TERM

what=${1:-}; name=${2:-}; url=${3:-}
case $what in
  labels) UI labels ;;
  still)
    visit "$url"; sleep 2.5; clock; sleep ${4:-6}; shot "$name" ;;
  ask)
    # once unfilmed for the clock; then away to an empty chat until it surely stands; then filmed from the open. The
    # second open carries one more word (&again=), so the page is made afresh and its chat types from the start.
    visit "$url"; sleep 3; clock; [[ $url == lab-site* ]] || bar "$(date +%H:%M)"
    visit "lab-site?scene=card&card=none&home=0&n=$RANDOM"; sleep 4.5
    rec "$name"; sleep 0.4; visit "$url&again=$RANDOM"; sleep ${4:-12}; endrec; shot "$name-end" ;;
  tap)
    visit "$url"; sleep 2.5; clock; sleep ${6:-7}; shot "$name"
    T 25 "$IDB" ui describe-all --udid "$UDID" >"$RAW/$name.labels.json" 2>/dev/null
    rec "$name"; sleep 0.6
    UI tap "$4" >/dev/null || say "missed the tap on '$4' in $name"
    sleep ${5:-7}; endrec; shot "$name-end" ;;
  run)
    visit "$url"; sleep 2.5; clock; sleep ${5:-6}; shot "$name"
    rec "$name"; sleep ${4:-6}; endrec; shot "$name-end" ;;
  tapxy)
    # a tap at a place on the screen, in points, for something a label cannot reach (a step inside a card, a board's column)
    visit "$url"; sleep 2.5; clock; sleep ${7:-7}; shot "$name"
    rec "$name"; sleep 0.6
    T 20 "$IDB" ui tap --udid "$UDID" "$4" "$5" >/dev/null 2>&1 || say "missed the tap in $name"
    sleep ${6:-7}; endrec; shot "$name-end" ;;
  frame)
    # where a control sits, kept for the site's own taps over the picture: frame <key> "<label>"
    f=$(UI frame "$url" 2>/dev/null) || { say "no frame for $url"; exit 0; }
    python3 -c "import json,os,sys; p=sys.argv[1]; d=json.load(open(p)) if os.path.exists(p) else {}; d[sys.argv[2]]=json.loads(sys.argv[3]); json.dump(d,open(p,'w'),indent=1)" "$RAW/frames.json" "$name" "$f"; say "frame $name" ;;
  *) print "usage: take.sh still|ask|tap|tapxy|run|frame|labels ..."; exit 2 ;;
esac
