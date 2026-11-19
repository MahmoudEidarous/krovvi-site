#!/bin/zsh
# Takes again every screen krovvi.com shows, in one run of about twelve minutes, then sizes and cuts them.
#
#   zsh scripts/app-shots/all.sh                 everything, into ~/.krovvi/site19/raw, then public/app/purple
#   UDID=<simulator> RAW=<folder> zsh scripts/app-shots/all.sh
#
# Before it: a simulator booted with the Krovvi development build, opened on a Metro that serves an app worktree at
# today's main holding this folder's lab-site.tsx as src/app/lab-site.tsx (the bench page; never committed in the app's
# repository), the phone on 24-hour time (defaults write -g AppleICUForce24HourTime -bool YES, then a restart) and the
# development build's floating button off (defaults write com.delvnco.catch8 EXDevMenuShowFloatingActionButton -bool NO).
# Start the app afresh just before this run: Days reads the phone's own date, and a lab-site scene moves the app's clock
# for as long as it stays open under the pages after it.
#
# Each line is one picture or film (take.sh); the names are the ones the page asks for (src/components/home/home.tsx)
# and cut.mjs serves (its USED list). Other colours: start the app in that look first (any bench's &look=ocean-light),
# run this with RAW set to a folder of that colour's own, then node cut.mjs --raw <folder> --theme ocean.
set -u
HERE=${0:A:h}
cd "$HERE"
t() { zsh take.sh "$@" 2>&1 | grep -v '^$'; }
R=$(date +%s)

# the real day first: Days, and the tap that opens a day's own page
t still warm-days "days-bench?lang=en" 5
t tapxy days "days-bench?lang=en&r=$R" 200 660 6 7

# one scene unfilmed: the first chat after a start can keep the launcher's light status bar
t still warm "lab-site?scene=card&card=day" 4

# the hero: its picture, where its three answers sit, and each answer's film
t still hero "lab-site?scene=hero&pick=great&run=${R}h&clock=18:12" 6
t frame hero-great "answer: it went great"; t frame hero-okay "answer: it was okay"; t frame hero-low "answer: not great, honestly"
t tap hero-great "lab-site?scene=hero&pick=great&run=${R}g&clock=18:12" "answer: it went great" 7 6
t tap hero-okay "lab-site?scene=hero&pick=okay&run=${R}o&clock=18:12" "answer: it was okay" 7 6
t tap hero-low "lab-site?scene=hero&pick=low&run=${R}l&clock=18:12" "answer: not great, honestly" 7 6

# a friend first, and the day the bank says yes (the ending)
t ask vent "lab-site?scene=vent&clock=19:24" 11
t tap checkin "lab-site?scene=checkin&run=${R}c&clock=20:05" "answer: honestly, tired" 8 6
t ask memory "lab-site?scene=memory&clock=13:05" 12
t ask news "lab-site?scene=news&clock=18:40" 12
t ask flame "lab-site?scene=day&clock=18:40" 12

# just say it: one card under a reply each; three of them move (a step ticked, a glass added, the timer running)
for c in sleep reading meal fitness money study; do t still "card-$c" "lab-site?scene=card&card=$c" 5; done
t tapxy card-skin "lab-site?scene=card&card=skin" 244 480 5 5
t tapxy card-water "lab-site?scene=card&card=water" 153 515 5 5
t run card-focus "lab-site?scene=card&card=focus" 7 5

# the whole picture: an app's own page, one person's alone, on a day near today; and the apps that are a page of their own
t still page-money "lab-site?scene=page&kind=spending&state=rich-en" 7
t still page-food "lab-site?scene=page&kind=food&state=rich-en" 7
t still page-health "lab-site?scene=page&kind=health&state=rich-en" 7
t still page-study "lab-apps?app=study&lang=en" 7
t still page-habits "lab-apps?app=habits&lang=en" 7
t still page-todo "lab-apps?app=todo&lang=en" 7
t still page-library "lab-own?app=library&lang=en" 7

# it plays: each game in the middle of a round
for g in chess four five sudoku fleet hunt higher groups trivia countries; do t still "game-$g-mid" "lab-play?scene=$g-mid&run=$R" 6; done

node cut.mjs
