#!/bin/zsh
# Takes again every app screen krovvi.com shows, in one run, from the real Krovvi app on the iOS simulator.
#
#   zsh scripts/app-shots/capture.sh                          every scene, in purple
#   ONLY="hero vent" zsh scripts/app-shots/capture.sh         just those scenes (names below)
#   THEMES="purple ocean coral mono" zsh scripts/...          in each of the app's colours
#   FILMS=0 zsh scripts/app-shots/capture.sh                  pictures only, no films (quicker)
#
# What it shows is the app's own screens holding made-up conversations: the bench pages lab-site (the site's scenes,
# kept here as scripts/app-shots/lab-site.tsx and copied into the app worktree's src/app; a development-only page that is
# not in the app repository) and lab-minute (the first minute). Nothing is drawn by the site: every phone on the page is a picture or a film of the app. The look is
# the light one, in each colour asked for.
#
# Scenes: hero (Krovvi's check-in after the interview, and its reply to each of the three one-tap answers), vent,
# checkin, play, memory, friends, help (split, meals, money, trip, gift, todo) and hello (the first minute).
#
# Needs: Xcode's simulator with the Krovvi development build installed, Metro (started here on PORT if it is not
# running, from APP_DIR with its .env.local, never committed and never printed), idb (pip install fb-idb, plus
# brew install idb_companion), ffmpeg, cwebp and sqlite3.
# Writes: public/app/<colour>/*.webp and *.mp4, and public/app/shots.json (what was taken, film lengths, and where the
# hero's three answers sit on the screen, for the site's own taps over the picture).
# Every outside command has a hard time limit, so a stuck simulator never holds the run. It leaves Metro and the
# simulator as it found them.

set -u
setopt pipe_fail 2>/dev/null

HERE=${0:A:h}
SITE=${HERE:h:h}
APP_REPO=${APP_REPO:-$HOME/Projects/catch8-1}
APP_DIR=${APP_DIR:-$HOME/Projects/catch8-site-shots}
APP_REF=${APP_REF:-release/all}
APP_MODULES=${APP_MODULES:-$HOME/Projects/catch8-look/node_modules}
ENV_FROM=${ENV_FROM:-$HOME/Projects/catch8-main/.env.local}
UDID=${UDID:-A820AEF4-ABED-4A74-8B1A-6A72F7A58913}
PORT=${PORT:-8092}
THEMES=${THEMES:-purple}
FILMS=${FILMS:-1}
OUT_ROOT=${OUT_ROOT:-$SITE/public/app}
RAW=${RAW:-$(mktemp -d /tmp/krovvi-app-shots.XXXXXX)}
ONLY=${ONLY:-}
BUNDLE=com.delvnco.catch8
WIDTH=780 # 2x the phone's 390 points
mkdir -p "$OUT_ROOT" "$RAW"
say() { print -r -- "[app-shots] $*"; }
want() { [[ -z $ONLY || " $ONLY " == *" $1 "* ]]; }
# every outside command runs under a hard time limit (macOS has no `timeout`)
T() { local secs=$1; shift; perl -e 'alarm shift; exec @ARGV' "$secs" "$@"; }
UI() { T 60 python3 "$HERE/idb_ui.py" "$UDID" "$@"; }

# Each scene's time of day, so a film shot at night still reads right: the app's clock (lab-site &clock) and the
# status bar both show it.
typeset -A CLOCK=(hero 18:12 vent 19:24 checkin 20:05 play 21:40 memory 13:05 friends 12:30
  split 10:15 meals 17:45 money 20:30 trip 19:10 gift 12:20 todo 8:05 hello 9:41)
twelve() { local h=${1%%:*} m=${1##*:}; h=$((10#$h % 12)); (( h == 0 )) && h=12; print -r -- "$h:$m"; }

# ---------- the app's code, the simulator, Metro ----------
if [[ ! -d $APP_DIR ]]; then
  say "making the app worktree $APP_DIR at $APP_REF"
  T 120 git -C "$APP_REPO" worktree add --detach "$APP_DIR" "$APP_REF" || exit 1
fi
# the site's bench page is kept here (scripts/app-shots/lab-site.tsx) and put in the app worktree when it is missing
[[ -f $APP_DIR/src/app/lab-site.tsx ]] || cp "$HERE/lab-site.tsx" "$APP_DIR/src/app/lab-site.tsx"
# The sign-in gate leaves development benches open without an account only when they are on its list
# (src/lib/cloud/account-rules.ts OPEN_ROUTES): the site's two benches join it here, in this worktree only.
RULES="$APP_DIR/src/lib/cloud/account-rules.ts"
if [[ -f $RULES ]] && ! grep -q "'/lab-site'" "$RULES"; then
  T 20 python3 -c "import sys; p=sys.argv[1]; s=open(p).read(); a=\"'/shopping']\"; s=s.replace(a, \"'/shopping', '/lab-site', '/lab-minute']\", 1); open(p,'w').write(s)" "$RULES"
fi
[[ -e $APP_DIR/node_modules ]] || ln -s "$APP_MODULES" "$APP_DIR/node_modules"
# Metro reads the app's public settings from .env.local (never committed): copied, never printed.
[[ -f $APP_DIR/.env.local ]] || cp "$ENV_FROM" "$APP_DIR/.env.local"

BOOTED_HERE=0
if ! T 30 xcrun simctl list devices booted | grep -q "$UDID"; then
  say "booting the simulator"
  T 120 xcrun simctl boot "$UDID" && BOOTED_HERE=1
  T 180 xcrun simctl bootstatus "$UDID" -b >/dev/null
fi

METRO_PID=""
if lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  # a Metro that was already running may not see files changed since it started (the bench, the gate's list)
  say "using the Metro already on $PORT: if the bench changed since it started, stop it and run this again"
else
  say "starting Metro on $PORT"
  # --clear: a Metro cache from another worktree on the same node_modules can hand the app a page map without the bench
  (cd "$APP_DIR" && EXPO_NO_TELEMETRY=1 CI=1 exec npx expo start --dev-client --port $PORT --clear </dev/null >"$RAW/metro.log" 2>&1) &
  METRO_PID=$!
  for i in {1..120}; do T 5 curl -s -o /dev/null "http://localhost:$PORT/status" && break; sleep 1; done
fi

REC=""
endrec() { # stops a recording, and never waits on it for long
  [[ -z $REC ]] && return
  kill -INT $REC 2>/dev/null
  for i in {1..40}; do kill -0 $REC 2>/dev/null || break; sleep 0.25; done
  kill -9 $REC 2>/dev/null; wait $REC 2>/dev/null; REC=""; sleep 0.3
}
finish() {
  endrec
  [[ -n $METRO_PID ]] && { say "stopping Metro"; pkill -f "expo start --dev-client --port $PORT" 2>/dev/null; kill $METRO_PID 2>/dev/null; }
  T 15 xcrun simctl status_bar "$UDID" clear 2>/dev/null
  (( BOOTED_HERE )) && { say "shutting the simulator down"; T 60 xcrun simctl shutdown "$UDID"; }
}
trap finish EXIT INT TERM

bar() { T 15 xcrun simctl status_bar "$UDID" override --time "$(twelve $1)" --dataNetwork wifi --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 --batteryState discharging --batteryLevel 100; sleep 0.3; }

# The look is read once as the app starts (theme/look-boot.ts), from its own store: write it, then start the app.
launch() {
  local theme=$1
  say "starting the app in $theme, light"
  T 20 xcrun simctl terminate "$UDID" $BUNDLE 2>/dev/null
  T 20 xcrun simctl ui "$UDID" appearance light
  local data db
  data=$(T 20 xcrun simctl get_app_container "$UDID" $BUNDLE data) || { say "the app is not installed on $UDID"; exit 1; }
  db="$data/Documents/SQLite/ExpoSQLiteStorage"
  mkdir -p "${db:h}"
  T 20 sqlite3 "$db" "CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL); INSERT OR REPLACE INTO storage (key, value) VALUES ('krovvi.look.v1', '{\"theme\":\"$theme\",\"mode\":\"light\"}');"
  sleep 1
  T 20 xcrun simctl openurl "$UDID" "exp+catch8://expo-development-client/?url=http%3A%2F%2Flocalhost%3A$PORT"
  # a first bundle can take minutes; the app is ready once its chat's bar is on screen (a signed-in Home), or the first
  # minute's Tap to say hi (a new person's Home)
  local ok=0
  for i in {1..60}; do
    sleep 4
    WAIT=1 UI frame "add to your chat" >/dev/null 2>&1 && { ok=1; break; }
    WAIT=1 UI frame "say hi" >/dev/null 2>&1 && { ok=1; break; }
  done
  (( ok )) || say "the chat never showed: going on anyway"
  sleep 3
  # one scene first, unfilmed: the first page after a start can keep the launcher's light status bar
  bar 11:58; T 20 xcrun simctl openurl "$UDID" "krovvi:///lab-site?scene=vent&clock=11:58"; sleep 6
}

visit() { bar $2; T 20 xcrun simctl openurl "$UDID" "krovvi:///$1"; }
shot() { T 30 xcrun simctl io "$UDID" screenshot "$RAW/$1.png" >/dev/null 2>&1 || say "no picture for $1"; }
rec() {
  (( FILMS )) || return
  xcrun simctl io "$UDID" recordVideo --codec h264 --force "$RAW/$1.mov" >/dev/null 2>&1 &
  REC=$!
  sleep 0.8
}
# One of Krovvi's one-tap answers, filmed: the screen as it stands, then the tap and everything after it.
tapscene() { # name query label seconds
  local name=$1 query=$2 label=$3 secs=$4
  visit "$query" ${CLOCK[$5]}; sleep 7; shot "$name"
  rec "$name"; sleep 0.6
  UI tap "$label" >/dev/null || say "missed the tap on '$label' in $name"
  sleep $secs; endrec; shot "$name-end"
}
# A message sent as the screen opens, filmed from the moment it stands.
askscene() { # name query seconds clock
  rec "$1"; visit "$2" ${CLOCK[$4]}; sleep $3; endrec; shot "$1-end"
}

# ---------- pictures and films for the web ----------
webp() { # a screenshot, 2x for a phone 390 points wide
  T 60 ffmpeg -v error -y -i "$1" -vf "scale=$WIDTH:-2:flags=lanczos" "$RAW/_w.png" && T 60 cwebp -quiet -q 86 -m 6 "$RAW/_w.png" -o "$2"
}
# When the picture first moves, and when it last settles, from the film itself.
moves() { T 120 ffmpeg -hide_banner -i "$1" -vf "freezedetect=n=0.0006:d=0.3" -map 0:v -f null - 2>&1 | grep -E "freeze_(start|end)" | sed -E 's/.*(freeze_(start|end)): ([0-9.]+).*/\1 \3/'; }
film() { # name, how it starts: "tap" trims to just before the first move, "ask" skips the screen sliding in
  local name=$1 how=$2 in="$RAW/$1.mov"
  [[ -f $in ]] || return
  local ev start=0 end
  ev=$(moves "$in")
  local first_end=$(print -r -- "$ev" | awk '$1=="freeze_end"{print $2; exit}')
  local last_start=$(print -r -- "$ev" | awk '$1=="freeze_start"{s=$2} $1=="freeze_end"{s=""} END{print s}')
  local dur=$(T 30 ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
  [[ -z $dur ]] && return
  if [[ $how == tap && -n $first_end ]]; then start=$(( first_end > 0.35 ? first_end - 0.35 : 0 )); fi
  # an ask film opens on the screen before it: it starts the moment the chat stands
  [[ $how == ask && -n $first_end ]] && start=$(( first_end + 0.1 ))
  end=${last_start:-$dur}; end=$(( end + 0.5 < dur ? end + 0.5 : dur ))
  T 300 ffmpeg -v error -y -ss $start -to $end -i "$in" -vf "fps=30,scale=$WIDTH:-2:flags=lanczos,format=yuv420p" \
    -c:v libx264 -preset slow -crf 22 -profile:v high -movflags +faststart -an "$OUT/$name.mp4" || return
  T 60 ffmpeg -v error -y -ss $start -i "$in" -frames:v 1 "$RAW/_first.png" && webp "$RAW/_first.png" "$OUT/$name.webp"
  local len=$(T 30 ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$name.mp4")
  FILMED[$name]=$len
  say "film $name: ${len}s"
}
still() { [[ -f $RAW/$1.png ]] && webp "$RAW/$1.png" "$OUT/$1.webp" && STILLS+=($1); }

RUN=$(date +%s)
FRAMES="$RAW/frames.json"
print -r -- "{}" >"$FRAMES"
frame_of() { # remembers where an element sits, for the site's own taps over the picture
  local key=$1 label=$2 f
  f=$(UI frame "$label" 2>/dev/null) || return
  python3 -c "import json,sys; p=sys.argv[1]; d=json.load(open(p)); d[sys.argv[2]]=json.loads(sys.argv[3]); json.dump(d,open(p,'w'))" "$FRAMES" "$key" "$f"
}

for THEME in ${=THEMES}; do
  OUT="$OUT_ROOT/$THEME"; mkdir -p "$OUT"
  typeset -A FILMED=(); STILLS=()
  rm -f "$RAW"/*.png(N) "$RAW"/*.mov(N)
  launch "$THEME"

  if want hero; then
    for pick label in great "answer: it went great" okay "answer: it was okay" low "answer: not great, honestly"; do
      visit "lab-site?scene=hero&pick=$pick&run=$RUN$THEME$pick&clock=${CLOCK[hero]}" ${CLOCK[hero]}; sleep 7
      if [[ $pick == great ]]; then
        shot hero
        frame_of hero-great "answer: it went great"; frame_of hero-okay "answer: it was okay"; frame_of hero-low "answer: not great, honestly"
      fi
      rec "hero-$pick"; sleep 0.6
      UI tap "$label" >/dev/null || say "missed the tap on $label"
      sleep 7; endrec; shot "hero-$pick-end"
    done
  fi
  want vent && askscene vent "lab-site?scene=vent&clock=${CLOCK[vent]}" 9 vent
  want checkin && tapscene checkin "lab-site?scene=checkin&run=$RUN${THEME}c&clock=${CLOCK[checkin]}" "answer: honestly, tired" 8 checkin
  want play && tapscene play "lab-site?scene=play&run=$RUN${THEME}p&clock=${CLOCK[play]}" "you wake up at 6 every day" 8 play
  want memory && askscene memory "lab-site?scene=memory&clock=${CLOCK[memory]}" 10 memory
  want friends && askscene friends "lab-site?scene=friends&clock=${CLOCK[friends]}" 10 friends
  if want help; then
    for task in split meals money trip gift todo; do
      visit "lab-site?scene=help&task=$task&clock=${CLOCK[$task]}" ${CLOCK[$task]}; sleep 10; shot "help-$task"
    done
  fi
  if want hello; then
    # the first minute (lab-minute): a new person's empty chat, Tap to say hi, and Krovvi's first hello. A site scene at
    # the same time first, so the app's clock reads the status bar's time when the hello is stamped
    visit "lab-site?scene=vent&clock=${CLOCK[hello]}" ${CLOCK[hello]}; sleep 4
    visit "lab-minute?lang=en" ${CLOCK[hello]}; sleep 6; shot hello
    rec hello; sleep 0.6
    UI tap "say hi" >/dev/null || say "missed the tap on say hi"
    sleep 12; endrec; shot hello-end
  fi

  # the pictures and films, for the web
  still hero
  for pick in great okay low; do (( FILMS )) && film "hero-$pick" tap; still "hero-$pick-end"; done
  for s in vent memory friends; do (( FILMS )) && film $s ask; still "$s-end"; done
  for s in checkin play hello; do (( FILMS )) && film $s tap; still "$s"; still "$s-end"; done
  for task in split meals money trip gift todo; do still "help-$task"; done
  # a film's first frame is a picture too
  for n in ${(k)FILMED}; do [[ -f $OUT/$n.webp ]] && STILLS+=($n); done

  # shots.json: merged into what is there, so a run of a few scenes or colours keeps the rest
  python3 - "$OUT_ROOT/shots.json" "$THEME" "$FRAMES" "${(j:,:)${(@)STILLS}}" "${(j:,:)${(@kv)FILMED}}" <<'PY'
import json, os, sys, time
path, theme, frames_path, stills, films = sys.argv[1:6]
old = json.load(open(path)) if os.path.exists(path) else {}
themes = old.get('themes', {})
mine = themes.get(theme, {})
got = sorted(set(mine.get('stills', [])) | set(s for s in stills.split(',') if s))
pairs = [p for p in films.split(',') if p]
newf = {pairs[i]: round(float(pairs[i + 1]), 2) for i in range(0, len(pairs) - 1, 2)}
themes[theme] = {'stills': got, 'films': {**mine.get('films', {}), **newf}}
frames = {**old.get('frames', {}), **json.load(open(frames_path))}
json.dump({'taken': time.strftime('%Y-%m-%d %H:%M'), 'screen': [390, 844], 'themes': themes, 'frames': frames}, open(path, 'w'), indent=2)
PY
  say "done: $OUT"
done
ls -la "$OUT_ROOT"/*/ | head -80
