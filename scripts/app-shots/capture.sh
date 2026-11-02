#!/bin/zsh
# Re-takes every app screen krovvi.com shows, in one run, from the real Krovvi app on the iOS simulator.
#
#   zsh scripts/app-shots/capture.sh            all of them
#   ONLY="hero vent" zsh scripts/app-shots/capture.sh   just those scenes (names below)
#
# What it films is the app's own chat screen holding made-up conversations: the bench page app/lab-site.tsx in the
# app repository (branch site/app-shots), which feeds the real chat, its one-tap answers, its game, its live cards and
# the first chat's opening. Nothing is drawn by the site: every phone on the page is a picture or a film of the app.
#
# Needs: Xcode's simulator with the Krovvi development build installed, Metro (started here if it is not running),
# idb (pip install fb-idb, plus brew install idb_companion), ffmpeg, cwebp and sqlite3.
# Writes: public/app/*.mp4 and *.webp, and public/app/shots.json (lengths, and where the hero's answers sit).
# It leaves the simulator and Metro as it found them.

set -u
setopt pipe_fail 2>/dev/null

HERE=${0:A:h}
SITE=${HERE:h:h}
APP_REPO=${APP_REPO:-$HOME/Projects/catch8-1}
APP_DIR=${APP_DIR:-$HOME/Projects/catch8-site-shots}
APP_BRANCH=${APP_BRANCH:-site/app-shots}
APP_MODULES=${APP_MODULES:-$HOME/Projects/catch8-look/node_modules}
ENV_FROM=${ENV_FROM:-$HOME/Projects/catch8-main/.env.local}
UDID=${UDID:-A820AEF4-ABED-4A74-8B1A-6A72F7A58913}
PORT=${PORT:-8092}
THEME=${THEME:-purple}
OUT=${OUT:-$SITE/public/app}
RAW=${RAW:-$(mktemp -d /tmp/krovvi-app-shots.XXXXXX)}
ONLY=${ONLY:-}
BUNDLE=com.delvnco.catch8
UI=(python3 "$HERE/idb_ui.py" "$UDID")
WIDTH=780 # 2x the phone's 390 points
mkdir -p "$OUT" "$RAW"
say() { print -r -- "[app-shots] $*"; }
want() { [[ -z $ONLY || " $ONLY " == *" $1 "* ]]; }

# ---------- the app's code, the simulator, Metro ----------
if [[ ! -d $APP_DIR ]]; then
  say "making the app worktree $APP_DIR from $APP_BRANCH"
  git -C "$APP_REPO" worktree add "$APP_DIR" "$APP_BRANCH" || exit 1
fi
[[ -e $APP_DIR/node_modules ]] || ln -s "$APP_MODULES" "$APP_DIR/node_modules"
# Metro reads the app's public settings from .env.local (never committed); copied, never printed.
[[ -f $APP_DIR/.env.local ]] || cp "$ENV_FROM" "$APP_DIR/.env.local"

BOOTED_HERE=0
if ! xcrun simctl list devices booted | grep -q "$UDID"; then
  say "booting the simulator"
  xcrun simctl boot "$UDID" && BOOTED_HERE=1
  xcrun simctl bootstatus "$UDID" -b >/dev/null
fi

METRO_PID=""
if ! lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  say "starting Metro on $PORT"
  (cd "$APP_DIR" && EXPO_NO_TELEMETRY=1 npx expo start --dev-client --port $PORT </dev/null >"$RAW/metro.log" 2>&1) &
  METRO_PID=$!
  for i in {1..120}; do curl -s -o /dev/null "http://localhost:$PORT/status" && break; sleep 1; done
fi

finish() {
  [[ -n $METRO_PID ]] && { say "stopping Metro"; pkill -f "expo start --dev-client --port $PORT" 2>/dev/null; kill $METRO_PID 2>/dev/null; }
  xcrun simctl status_bar "$UDID" clear 2>/dev/null
  (( BOOTED_HERE )) && { say "shutting the simulator down"; xcrun simctl shutdown "$UDID"; }
}
trap finish EXIT

clock() { xcrun simctl status_bar "$UDID" override --time "$(date +%-I:%M)" --dataNetwork wifi --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 --batteryState discharging --batteryLevel 100; sleep 0.4; }

# The look is read once as the app starts (theme/look-boot.ts), from its own store: write it, then start the app.
launch() {
  local mode=$1
  say "starting the app in $THEME $mode"
  xcrun simctl terminate "$UDID" $BUNDLE 2>/dev/null
  xcrun simctl ui "$UDID" appearance "$mode"
  local data db
  data=$(xcrun simctl get_app_container "$UDID" $BUNDLE data)
  db="$data/Documents/SQLite/ExpoSQLiteStorage"
  mkdir -p "${db:h}"
  sqlite3 "$db" "CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL); INSERT OR REPLACE INTO storage (key, value) VALUES ('krovvi.look.v1', '{\"theme\":\"$THEME\",\"mode\":\"$mode\"}');"
  sleep 1
  xcrun simctl openurl "$UDID" "exp+catch8://expo-development-client/?url=http%3A%2F%2Flocalhost%3A$PORT"
  # a first bundle can take minutes; the app is ready once its chat's bar is on screen
  for i in {1..90}; do
    sleep 3
    "${UI[@]}" frame "add to your chat" >/dev/null 2>&1 && break
  done
  sleep 3
  # a change of appearance can put the status bar back as it was: the clock is set again once the app stands
  clock
}

visit() { clock; xcrun simctl openurl "$UDID" "krovvi:///$1"; }
shot() { xcrun simctl io "$UDID" screenshot "$RAW/$1.png" >/dev/null 2>&1; }
REC=0
rec() { xcrun simctl io "$UDID" recordVideo --codec h264 --force "$RAW/$1.mov" >/dev/null 2>&1 & REC=$!; sleep 0.6; }
endrec() { kill -INT $REC 2>/dev/null; wait $REC 2>/dev/null; sleep 0.4; }

# A one-tap answer, filmed: the screen as it stands, then the tap and everything after it.
tapfilm() {
  local name=$1 query=$2 label=$3 secs=$4
  visit "$query"; sleep 7; shot "$name"
  rec "$name"; sleep 0.8
  "${UI[@]}" tap "$label" || say "missed the tap on '$label' in $name"
  sleep $secs; endrec; shot "$name-end"
}
# A message sent as the screen opens, filmed from the moment it stands.
askfilm() {
  local name=$1 query=$2 secs=$3
  rec "$name"; visit "$query"; sleep $secs; endrec; shot "$name-end"
}
# A screen as it stands once its answer has landed.
still() { visit "$2"; sleep ${3:-8}; shot "$1"; }

# ---------- the scenes ----------
RUN=$(date +%s)
SHOTS_JSON="$RAW/frames.json"
print -r -- "{}" >"$SHOTS_JSON"
frame_of() { # remembers where an element sits, for the site's own taps over the picture
  local key=$1 label=$2 f
  f=$("${UI[@]}" frame "$label" 2>/dev/null) || return
  python3 -c "import json,sys; p=sys.argv[1]; d=json.load(open(p)); d[sys.argv[2]]=json.loads(sys.argv[3]); json.dump(d,open(p,'w'))" "$SHOTS_JSON" "$key" "$f"
}

want hero || want help && launch light
if want hero; then
  for pick label in great "answer: it went great" okay "answer: it was okay" low "answer: not great, honestly"; do
    visit "lab-site?scene=hero&pick=$pick&run=$RUN$pick"; sleep 7
    [[ $pick == great ]] && { shot hero; frame_of hero-great "answer: it went great"; frame_of hero-okay "answer: it was okay"; frame_of hero-low "answer: not great, honestly"; }
    rec "hero-$pick"; sleep 0.8
    "${UI[@]}" tap "$label" || say "missed the tap on $label"
    sleep 7; endrec; shot "hero-$pick-end"
  done
fi
if want help; then
  for task in split meals money trip gift todo; do still "help-$task" "lab-site?scene=help&task=$task" 9; done
fi

{ want vent || want checkin || want play || want memory || want friends || want hello } && launch dark
want vent && askfilm vent "lab-site?scene=vent" 8
want checkin && tapfilm checkin "lab-site?scene=checkin&run=${RUN}c" "answer: honestly, tired" 7
want play && tapfilm play "lab-site?scene=play&run=${RUN}p" "you wake up at 6 every day" 7
want memory && askfilm memory "lab-site?scene=memory" 9
want friends && askfilm friends "lab-site?scene=friends" 9
if want hello; then
  # The first chat's opening on Home, as a new person meets it (a phone with no account). On a development build a
  # long press on the name plays it again from its first moment (components/first-meeting/guest-top.tsx).
  visit ""; sleep 6
  if "${UI[@]}" frame "sign in to your account" >/dev/null 2>&1; then
    rec hello; sleep 0.8; "${UI[@]}" hold "=krovvi"; sleep 15; endrec; shot hello-end
  else
    say "skipped hello: this simulator's app is signed in, so Home is not the first meeting"
  fi
fi

# ---------- pictures and films for the web ----------
webp() { # a screenshot, 2x for a phone 390 points wide
  ffmpeg -v error -y -i "$1" -vf "scale=$WIDTH:-2:flags=lanczos" "$RAW/_w.png" && cwebp -quiet -q 86 -m 6 "$RAW/_w.png" -o "$2"
}
# When the picture first moves, and when it last settles, from the film itself.
moves() { ffmpeg -hide_banner -i "$1" -vf "freezedetect=n=0.0006:d=0.3" -map 0:v -f null - 2>&1 | grep -E "freeze_(start|end)" | sed -E 's/.*(freeze_(start|end)): ([0-9.]+).*/\1 \3/'; }
film() { # name, how it starts: "tap" trims to just before the first move, "ask" skips the screen sliding in
  local name=$1 how=$2 in="$RAW/$1.mov"
  [[ -f $in ]] || return
  local ev start=0 end
  ev=$(moves "$in")
  local first_end=$(print -r -- "$ev" | awk '$1=="freeze_end"{print $2; exit}')
  local last_start=$(print -r -- "$ev" | awk '$1=="freeze_start"{s=$2} $1=="freeze_end"{s=""} END{print s}')
  local dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
  if [[ $how == tap && -n $first_end ]]; then start=$(( first_end > 0.35 ? first_end - 0.35 : 0 )); fi
  # an ask film opens on the screen before it: it starts the moment the chat stands
  [[ $how == ask && -n $first_end ]] && start=$(( first_end + 0.1 ))
  end=${last_start:-$dur}; end=$(( end + 0.5 < dur ? end + 0.5 : dur ))
  ffmpeg -v error -y -ss $start -to $end -i "$in" -vf "fps=30,scale=$WIDTH:-2:flags=lanczos,format=yuv420p" \
    -c:v libx264 -preset slow -crf 23 -profile:v high -movflags +faststart -an "$OUT/$name.mp4"
  ffmpeg -v error -y -ss $start -i "$in" -frames:v 1 "$RAW/_first.png" && webp "$RAW/_first.png" "$OUT/$name.webp"
  [[ -f $RAW/$name-end.png ]] && webp "$RAW/$name-end.png" "$OUT/$name-end.webp"
  local len=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$name.mp4")
  python3 -c "import json,sys; p=sys.argv[1]; d=json.load(open(p)); d.setdefault('films',{})[sys.argv[2]]=round(float(sys.argv[3]),2); json.dump(d,open(p,'w'))" "$SHOTS_JSON" "$name" "$len"
  say "film $name: ${len}s"
}

[[ -f $RAW/hero.png ]] && webp "$RAW/hero.png" "$OUT/hero.webp"
for pick in great okay low; do film "hero-$pick" tap; done
for task in split meals money trip gift todo; do [[ -f $RAW/help-$task.png ]] && webp "$RAW/help-$task.png" "$OUT/help-$task.webp"; done
film vent ask; film checkin tap; film play tap; film memory ask; film friends ask; film hello tap

# shots.json: merged into what is there, so a run of a few scenes keeps the rest
python3 - "$SHOTS_JSON" "$OUT/shots.json" <<'PY'
import json, os, sys, time
new = json.load(open(sys.argv[1]))
path = sys.argv[2]
old = json.load(open(path)) if os.path.exists(path) else {}
films = {**old.get('films', {}), **new.pop('films', {})}
frames = {**old.get('frames', {}), **new}
json.dump({'taken': time.strftime('%Y-%m-%d %H:%M'), 'screen': [390, 844], 'films': films, 'frames': frames}, open(path, 'w'), indent=2)
PY
say "done: $OUT"
ls -la "$OUT"
