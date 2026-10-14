# Krovvi iPhone app, the night look ("Deep"): visual spec for the web kit

Source: `~/Projects/catch8-1`, `origin/main` at commit `272d7cc5` (read 2026-10-14 through `git archive`, never a checkout). Krovvi talking first (the why line, the one tap answers, the folded stack) is read from `bc25b1a3` (branch `t1/fm-phone`, which `origin/main` reached on 2026-10-14 at 02:43). Every number below comes from that code; `file:line` points at it. Paths are relative to `src/` unless they start with another top folder. The web kit that draws all of it is `src/components/deep/*` in this repo; its dev page is `/dev/deep` (noindex).

Short names: `agent.tsx` = `src/app/agent.tsx`; `reply.tsx` = `src/components/answer/reply.tsx`; `apps-screen.tsx` = `src/components/apps/apps-screen.tsx`; `tokens.ts`, `pane.ts`, `motion.ts`, `markdown.ts` = `src/theme/...`; `glyph.tsx`, `dotted.tsx`, `sheet.tsx`, `plus-sheet.tsx`, `k-thinking.tsx`, `chat-time.tsx`, `chat-sky.tsx`, `krovvi-dock.tsx`, `dictation-bar.tsx`, `doc-chip.tsx`, `glow.ts` = `src/components/...`; `look.ts`, `figure.tsx`, `native-blocks.tsx`, `blocks.tsx`, `table-view.tsx` = `src/components/answer/...`; `krovvi-message.tsx`, `krovvi-stack.tsx` = `src/components/...` at bc25b1a3; bricks = `src/components/screen/bricks/*`; `i18n.ts` = `src/lib/i18n.ts`.

Computed values assume the site's phone canvas: 393 x 852 points, safe area top 59, bottom 34 (an iPhone 15/16 with the Dynamic Island). The real captures in `catch8-1/design/` are 390 x 844 (insets 47 and 34); positions measured from them differ by those amounts and nothing else.

Nothing in the app moves with a spring except the reaction badge; every other motion is one curve, `cubic-bezier(0.23, 1, 0.32, 1)` (motion.ts:16).

## 0. Foundations

### 0.1 Colours (tokens.ts:17-65)

| token | value | use |
|---|---|---|
| bg | #030303 | the apps' night: every page that is not the sky (tokens.ts:19) |
| surface | #0E0E10 | the pane on the night (tokens.ts:21) |
| surfaceHi | #18181A | raised inside a pane; the reaction badge; a doc chip's way out (tokens.ts:23) |
| line | #1C1C1E | hairline between rows (tokens.ts:25) |
| fg | #EDEDEB | words, the one bright control (tokens.ts:26) |
| fg2 | #D9D8D3 | top bar glyphs, the + glyph, sheet labels (tokens.ts:28) |
| soft | #A9A8A2 | quoted words, a screen's name, timeline details (tokens.ts:32) |
| muted | #8F8F8A | labels, notes, Ask Krovvi (tokens.ts:33) |
| faint | #7A7A74 | placeholders, the verbs under an answer, the date line's time (tokens.ts:37) |
| danger | #C4574F | destructive (tokens.ts:41) |
| sky | #010101 | the home and the chat under the stars (tokens.ts:43) |
| star ground | #020202 | what the stars stand on (sky/stars.tsx:39) |
| edge | rgba(255,255,255,0.07) | a pane's hairline on the night (tokens.ts:49) |
| glass | rgba(30,30,33,0.58) | a pane over the stars: bubbles, cards, round buttons (tokens.ts:52) |
| glassEdge | rgba(255,255,255,0.085) | its hairline (tokens.ts:53) |
| glassSolid | #121214 | the glass as one solid colour (tokens.ts:56) |
| sheet | rgba(22,22,25,0.97) | a sheet (tokens.ts:58) |
| sheetEdge | rgba(255,255,255,0.12) | its hairline (tokens.ts:59) |
| tile | rgba(255,255,255,0.08) | a tile, a round, a quiet button inside a sheet (tokens.ts:62) |

Answer inks (look.ts:24-38): pick #E6DCC8 (bone), up #8CC59A, down #E5876B, warm #E3AE62, cold #8DB8D6, track rgba(237,237,235,0.12). Screen inks (screen/parts.tsx:34-55): dot off rgba(237,237,235,0.12), raised rgba(255,255,255,0.06) with edge rgba(255,255,255,0.075), chosen ground rgba(230,220,200,0.12), brass #C2A470.

Speaker inks, also a person's letter tint (tokens.ts:76-83; person-face.tsx:23-27, hashed `h = h * 31 + charCode`, unsigned, mod 6): #E6DCC8, #C98A62, #B0A89D, #C2A470, #8F7864, #D4B49A.

App colours: Library #A58CFF, Recording #FF6B5E, Meetings #5E9BFF (lib/apps.ts:45); Nutrition #8CC59A, Money #E3B062, To-do #E6DCC8, Fitness #EE9068, Habits #B7A6EC, Kitchen #C3CF73, Health #EC8FA3, Plans #86B9E0, Trips #6FC9B9, Watch #D796D6 (supabase/functions/_shared/objects/apps.ts:69-189).

File faces (lib/file-face.ts:7-23): PDF #E5484D, Spreadsheet #30A46C, Word document #3E7BFA, Presentation #F76B15, Email #F5B940; anything else muted.

### 0.2 Radius, space, type

- radius (tokens.ts:85-94): card 20, control 11, input 16, composer 26, sheet 36, pill 999. Floating sheets use 40 (sheet.tsx:601).
- space (tokens.ts:97-104): xs 4, sm 8, md 12, lg 16, xl 24, xxl 32.
- The chat's words (answer-style.ts:28-35): 17 points, line 25 (17 x 1.45, rounded), tracking -0.2, ink fg. Krovvi's answer, its bubbles and the person's bubbles all wear it. Arabic: line 29.
- The answer pieces' scale (look.ts:45-58), size / line / weight / tracking: display 40/46/300/-1.4 (tabular), figure 24/29/300/-0.8 (tabular), title 17/22/600/-0.3, body 15/21/400/-0.15, label 13/18/500/0, meta 12/16/400/0.
- A unit beside a figure (figure.tsx:20-24): display 20/400/-0.2, figure 14/400/0, body 13/400/0, all muted.
- Font: the system font (SF Pro). A text with no line height takes the font's own (CSS `normal`).
- Hairline: `StyleSheet.hairlineWidth`, one device pixel on a 3x phone = 1/3 point (the kit uses 0.333px).

### 0.3 Motion (motion.ts)

- Curve: cubic-bezier(0.23, 1, 0.32, 1) (motion.ts:16, tokens.ts:130). No springs.
- Durations (motion.ts:22-35): press 110, fade 150, morph 190, enter 240, exit 140, reflow 200 ms. Stagger 40 ms, up to 7 (motion.ts:71-74).
- Press: scale 0.97 (motion.ts:77); app tiles 0.95 (apps-screen.tsx:472); the dock 0.98, its mic 0.92 (krovvi-dock.tsx:103, 124).

### 0.4 Glass and light

- A pane over the stars (pane.ts:27-34): glass fill, 20 corners, one hairline of glassEdge, clipped. A round button (pane.ts:36-41): the same fill and hairline, size and radius the caller's.
- No blur anywhere: "the app has none" (tokens.ts:51). Liquid Glass is off (glass.tsx:30); the Glass fallback is surfaceHi with a hairline of line (glass.tsx:71-76), which the composer overrides.
- A lit dot's light (glow.ts:27-36): `radial-gradient(circle closest-side, tint at s, tint at 0.32 s 45%, transparent 100%)` on a view 3 times the dot, s = 0.5 by default. Never a shadow.

### 0.5 What iOS draws differently from Chrome (measured, not in the code)

- Emoji: Apple Color Emoji stands larger on the phone. In `krovvi-asks-first-2026-10-14/fm-first-en.png` the 🙂 after 17 point words is 19 points wide (16.3 in Chrome at the same size) and the 🎉 in a 14 point choice is 18 (14.3 in Chrome); both stand about 1.6 points further from the word before them. The kit sets emoji at 1.17 em (17 point words) or 1.26 em (14 and 13 point words) with 0.08 em before an emoji that follows a space (`emo()` in chat.tsx, `.dk-emo` in deep.css), in Chrome only: Safari and every iPhone browser draw emoji with Core Text as the app does, so `@supports (font: -apple-system-body)` turns the correction off there. To check on the iPhone: the 🙂 in a bubble should be about 19 points wide.
- Text: Chrome on a Mac draws the same SF Pro a hair thinner than iOS; iOS Safari draws it as the app does.

## 1. The chat screen (agent.tsx)

### 1.1 Layout, top to bottom

- Screen ground: sky #010101 with the stars over it (agent.tsx:7673, chat-sky.tsx:56-63). The kit paints nothing: the sky is the `sky` slot.
- Top bar starts at the safe area (agent.tsx:4198: `paddingTop: insets.top + lane`, lane 0 unless a take or a call is live). On the canvas: 59.
- Thread from the bar's foot to the composer's top.
- Composer at the foot.

### 1.2 The top bar (agent.tsx:4199-4268, styles 7680-7709)

- Row, centred, space-between, gap 12, side padding 16 (THREAD_SIDE, answer-style.ts:52), 12 under it (7680-7687). Height 40 + 12.
- Left: the heading (flex 1, 7688) holds Krovvi's K at 22 points (4236), aligned to the start, 2 above it (7697). The K: seven dots of 20 units on a 120 square, centres (40,28) (40,60) (40,92) (61,45) (82,30) (61,75) (82,90) (glyph.tsx:301-339); at 22: dot 3.67. It fades in and rises 4 when the chat starts (agent.tsx:4004-4011, 240 ms).
- Right, in this order: Share (share-button.tsx:42, ShareOut 19 fg2 weight 1.5), History (4157, Past 21 fg2 1.5), Close (4258, Cross 14 fg2 1.7). Each in a 40 round of glass, radius 20 (7709). Share arrives with a 220 ms fade once the chat has an answer (share-button.tsx:30).
- History's news point: 7 x 7, radius 4, fg, top -1, right -3 (7700-7708); while another chat is working it breathes over 1400 ms, alternate (4162-4176).
- Home's variant (not drawn by the kit): the apps button at the left, the chat's name in the middle, History and New on the right (4203-4219).

### 1.3 The thread (agent.tsx:7719, 7660-7669, 4381-4395)

- Padding: 16 at the sides, 14 on top (BADGE_ROOM, room for a reaction badge 13 over a bubble), 24 under the last row (space.xl). Rows 16 apart (space.lg).
- The foot of the list (the runway, 4381-4395) is always there and holds the working dots, so the last message rests 16 + 24 over the composer.
- A short chat stands at the top; a long one opens at its end (the kit: `display: flex; flex-direction: column-reverse` on the viewport and `margin-bottom: auto` on the column).
- The person's rows align to the end (7724); a group of their bubbles is 4 apart (7741).

### 1.4 Krovvi's turn (reply.tsx, agent.tsx:6322-6489)

- The turn is held 18 off the side its star stands on (reply.tsx:78, 929), its pieces 8 apart (agent.tsx:7806).
- The star (reply.tsx:270-296, 955-966): a 19 x 19 light, `radial-gradient(circle closest-side, ivory 0%, ivory 24%, rgba(237,237,235,0.5) 30%, rgba(237,237,235,0.16) 55%, transparent 100%)`, the 5 point dot inside it. Left -25 (-18 - 7), top 3 (round((25 - 5) / 2) - 7): the dot's edge on the thread's 16 point edge, on the middle of the first line. It stands only by an answer's plain words, never by a bubble. Landing while the person watches, it blooms: scale 0.2, 1.3 at 60%, 1, over 420 ms (reply.tsx:95-96).
- Plain words (markdown.ts:480-600): paragraph 17/25 with 16 under it, the last one too; bold fg 600; bullets a 5 point muted dot, 3 before it and 12 after, centred on the first line (marginTop 10), items 10 apart, the list 16 under; headings 23/30, 20/26, 18/24 semibold (28 over the first two, 22 over the third).
- Bubbles (reply.tsx:936-939, 918-922, 69-70): Krovvi's glass, 20 corners all round, one hairline, padding 7 over, 8 under, 14 at the sides, at most 82% of the turn's width, 4 apart, 10 from a bubble down to the answer's words. A bubble of one line is 40 tall. Arrival: 180 ms fade and a 6 point rise (reply.tsx:91-93), a fade alone under Reduce Motion.
- The verbs under a finished answer (agent.tsx:6418-6489, 7651-7653, 7817-7818): Copy, Share, Not right (thumb down), Try again (the newest answer only), React (a face with a +, reply-menu.tsx:548-579). Glyphs 16, faint, weight 1.5, each in a 32 x 28 box, 16 apart, the row reaching out 8 so the first glyph stands on the words' edge. Copied: a tick, 15, soft. The row fades in over 240 ms when an answer settles (5583-5612); a reopened chat shows it at once.
- Krovvi at work (reply.tsx:582-601, 946-953; agent.tsx:5964-5989): a glass bubble 58 wide and one line tall (40), in Krovvi's column (18 in), holding the K thinking at 22 points with each dot in its own light. It fades in over 150 ms. The K thinking (k-thinking.tsx:33-108): dots of 16 units (2.93 at 22) in a light 2.6 times that (7.6), `radial-gradient(circle closest-side, tint 0%, tint 36%, tint at 0.42 44%, tint at 0.12 68%, transparent 100%)`; each dot runs 0.32 to 1 (scale 1.28) at 18% and back to 0.32 by 62%, 1400 ms a pass, 140 ms apart, in the order a hand draws the K. Under Reduce Motion the seven breathe together, 0.5 to 1, 1300 ms.

### 1.5 The person's side (reply.tsx:791-899, 968-1027)

- Bubble: rgba(255,255,255,0.09), no edge, corners 21 with the one toward their side 7 (21 when more of theirs follow), the same padding and words as Krovvi's bubbles, at most 82%.
- Krovvi's reaction: a 28 point badge, 2 point ring of the sky's black, surfaceHi, 13 over the bubble's top and 11 past its inner edge, the emoji at 14; it springs from 0.6 (300 ms, damping 0.6) as it lands.
- The date line (chat-time.tsx:17-66): over a message an hour or more after the last one, or on another day. Two hairlines of edge running to the sides, 10 from the words; the words 12 points, tracking 0.1, faint, the day muted and semibold ("Today 6:36 pm"). 16 under it.

### 1.6 Krovvi talking first (krovvi-message.tsx and krovvi-stack.tsx at bc25b1a3)

- The why line (krovvi-message.tsx:39-84, 221-222): a 12 point faint glyph by the kind of thing (a bubble for a chat, a calendar for an event, people, an envelope for mail, the mic for a recording, Krovvi's K for an object, a page otherwise), 6 to the words, words 13 points muted, one line. 2 over and under, 8 under it, then the turn's 8.
- Its words: Krovvi's bubbles, as above ("Hey! Today was the Northline interview, right?", "How did it go? 🙂").
- One tap answers (krovvi-message.tsx:181-218, 225-243): pills 34 tall, 14 at the sides, round, dark glass with one hairline, 8 apart, wrapping, 12 under the bubbles; words 14 points semibold, tracking -0.2, fg. Picked: ivory fill, the words in bg; the others step back to 0.4. The row leaves with a 140 ms fade once anything follows. Strings (i18n.ts at bc25b1a3): "It went great 🎉", "It was okay", "Not great" (the capture shows the model's own "Not great, honestly").
- The folded stack (krovvi-stack.tsx:263-264): a line 12 under the turn's words, 13 points muted ("Later 👌", "All 3 answered", "Answered already").

### 1.7 The composer (agent.tsx:4547-4848, styles 7860-8105)

- Around it: 16 at the sides, 8 over, the home bar's room plus 16 under (34 + 16 = 50 on the canvas) (4548, 7860).
- The field (7893-7901): radius 28, rgba(26,26,29,0.62), a hairline of rgba(255,255,255,0.1), padding 8, clipped. 56 tall at one line. Waiting on an answer to Krovvi's question, its edge is rgba(194,164,112,0.5) and the placeholder says "Answer Krovvi" (7903, 4770).
- Its row (7904): bottom-aligned, gap 8, so the discs ride the last line as the field grows.
- The + (7917-7937, 4719-4723): a 44 box with -2 margins, holding a 40 disc of rgba(255,255,255,0.08) with a hairline of rgba(255,255,255,0.12); the Plus glyph 20, fg2, weight 1.67.
- The words (8071-8080, 7656-7657): 17 points, tracking -0.2, line 22, 9 over and under, 8 at the sides; up to six lines, then it scrolls. Placeholder in faint (4771); caret and selection ivory (4774). Placeholder strings (i18n.ts:2659, 2764, 2991, 4080): "Ask, or give it a job"; "Ask about this note"; "Answer Krovvi"; the first chat's "Say it your way".
- The disc (8082-8090, 4826-4840): 40 across, ivory. Empty: the mic, 20, bg. With something to send: the arrow, 16, bg, weight 2. The two cross-fade in place. While Krovvi works: a 13 x 13 stop square, radius 3.5, bg (8098). Attachments still loading: 0.55 (8101).
- The mic (glyph.tsx:545-573): a solid capsule `M8.5 5.3 a3.5 3.5 0 0 1 7 0 v5.4 a3.5 3.5 0 0 1 -7 0 z` with three holes of radius 1.05 at (12, 5.3), (12, 8.1), (12, 10.9), filled even-odd, and the cradle, stem and foot `M4.9 10.4 a7.1 7.1 0 0 0 14.2 0 M12 17.5 v3.6 M8.7 21.1 h6.6` as one line 1.9 units wide, round ends, on the 24 square.
- Dictating (dictation-bar.tsx:21-130): the row becomes 40 tall, 4 in, gap 8: a 34 round of tile with a 13 point cross (fg, 1.7) to throw it away; the clock, 12 points muted tabular, at least 30 wide; the voice, 22 bars 2.5 wide spread across, newest on the right, fainter to the left (0.32 to 1), a silent sample a 2.5 point dot, up to 22 tall, a sample every 55 ms; a 34 round of tile with a 13 x 13 ivory square (stop into the box); a 34 ivory disc with the arrow, 13, weight 1.9 (send).
- Staged photos (7941-7960): a row 8 apart, 8 in, 8 over, 4 under; each 64 x 64, radius 11, with an 18 point remove disc of rgba(3,3,3,0.78) at its top right (4, 4) holding a 7 point cross. Each fades in on landing.
- An attached file (doc-chip.tsx:81-125, 141-166): 8 in and 8 over; a 24 point ring (2 point stroke, the track at 18%) filling through the stages, the page glyph 11 in the file's colour inside it, a tick once ready; the name 13 points fg, its line 11 points muted ("PDF · Uploading…", "Reading it…", "Ready. Ask about it", i18n.ts:2665-2667); a 22 point surfaceHi disc with a 9 point cross.

### 1.8 The sky and the reading veil (chat-sky.tsx:17-18, sky/stars.tsx:131-142)

- The chat's stars are the home's sky. Over them, where words are read, a veil of the ground: clear to 18% of the screen's height, rgba(2,2,2,0.667) from 24% to 80%, clear again from 86% (the stars keep a third of their light in the band). The kit exports it as `READING_VEIL`, a CSS gradient, and `ReadingVeil`.
- The sky itself (lib/sky/stars.ts DEPTH): far 143 stars per 100,000 square points, radius 0.35 to 0.6, alpha 0.07 to 0.22, 2.2 points a minute; mid 38.5, 0.6 to 0.95, 0.22 to 0.55, 4; near 9.1, 1 to 1.55, 0.55 to 0.9, 7, with a glow 4.2 times the star at 0.32 of its light. Drawn at most 15 times a second and still while the thread scrolls.

## 2. The home (apps-screen.tsx, krovvi-dock.tsx)

- Ground: the sky with its stars, up behind the status bar (apps-screen.tsx:200-206). The content starts at the safe area (app/index.tsx:3094; `topInset` 0).
- The top row (570-592): 48 tall, 16 at the sides, the way to Settings at the end: a 44 tile, radius 11 (15 x 44 / 60), washed in the person's tint (the tile formula below), its edge in it, the person's first letter in dots at 40 points with no ground (person-face.tsx:54-71). With no name yet: Krovvi's K at 18.
- The day (586-587, 634-635): 24 at the sides, 4 under the row; the weekday 40 points, weight 300, tracking -1.6, fg; the date 17 points, tracking -0.2, rgba(237,237,235,0.80) over the sky, 2 under it ("Saturday", "10 October"). 32 under the date. The weather line at the end of this row is left out by the kit, by the brief.
- The grid (85, 194, 596): four to a row, each cell floor((393 - 48) / 4) = 86 wide, 24 under each cell.
- A tile (81-82, 599-620, 651-665): 60 x 60, radius 15, clipped. Over the sky it is washed in its app's colour: fill rgb(8 + 0.16 r, 8 + 0.16 g, 9 + 0.16 b), edge the colour at 0.34, one hairline. Its mark 36 points (three fifths of the tile, 528) in the app's colour: Recording the mic; the others in dots (below).
- The name (623-631): 7 under the tile, 12 points, tracking -0.1, #F2F1EC over the sky, at most 82 wide, with the words' soft shadow (sky/on.ts:22: 0 0.5 3.5 rgba(0,0,0,0.7)). What an app holds under it ("1 of 5 today"): 10.5 points tabular, rgba(228,226,218,0.84), 1 under the name.
- Something new inside: a 9 point ivory dot at the tile's top corner, 2.5 out (622, 502).
- The marks in dots (dotted.tsx:23-127, lib/dots.ts): every stroke of the mark's path becomes round dots 2.16 units across, spaced as near 3.05 as divides the stroke evenly, with one on each end and each corner (a turn sharper than 35 degrees); dots nearer than 0.62 of the gap are thinned; dots set by hand are 1.18 times as big. The paths drawn for dots are DOT_PATHS and OWN_DOTS (dotted.tsx:103-121); Trips wears the folded map since 10 October 17:44 (a6339b67), not the plane of the 10 October pictures. The kit's dots were worked out by emulating Skia's path parser and contour measure (arcs as conics of at most 120 degrees, curves cut until flat within 0.5, lengths along those chords) and match the app's tiles dot for dot (`src/components/deep/mark-dots.ts`).
- Krovvi's bar (krovvi-dock.tsx:53-61, 85-178; sky/on.ts:18-21): 16 at the sides and max(34 - 6, 12) = 28 over the foot; 58 tall, radius 29; rgba(18,18,20,0.62) over the stars (rgba(18,18,20,0.94) over a page), a hairline of rgba(255,255,255,0.09); 16 in at its start and 18 at its end, gap 12. Krovvi's K at 26 in a 30 box; "Ask Krovvi" 16 points, tracking -0.2, muted; the mic in a 40 ivory disc reaching 9 past the padding, the mic 20 in bg. When Krovvi has written something unseen, its first words take the place of "Ask Krovvi" in fg and a 9 point dot with a 2 point #121214 ring sits on the K (top -1, right -3).

## 3. Sheets (sheet.tsx, plus-sheet.tsx, share/share-sheet.tsx)

- The frame (sheet.tsx:205-290, 599-663): floats 8 in from the sides and the foot, corners 40, fill sheet, one hairline of sheetEdge, clipped; 14 inside at the sides, 8 over, max(34 - 8, 16) = 26 under. The grabber: a 36 x 4 pill of rgba(255,255,255,0.2), 8 over and under. At most 76% of the screen. It rises from below its place over 240 ms and leaves in 140; the scrim is black at 0.6, fading with it.
- A sheet's title (sheet.tsx:334-342, 669-670): 20 points semibold, tracking -0.5, line 25; 4 in, 4 over, 16 under.
- The + sheet (plus-sheet.tsx:32-128): no title. Four in a row, 8 apart, 4 over and under, each an even share of the row: a 60 round of tile with a hairline of sheetEdge, the icon 28 with its line 2.22 (1.9 of 24 units); the name 8 under it, 13 points, tracking -0.1, fg2. Camera, Photos, Files, and Record (only where the chat is Home) in recording's red: rgba(255,107,94,0.12) with a rgba(255,107,94,0.35) edge, the mic in #FF6B5E. A full tray or a take already rolling dims a round to 0.4. Strings (i18n.ts:4086-4097): "Camera", "Photos", "Files", "Record", "Recording now".
- The share sheet (share-sheet.tsx:224-328): 16 at the sides, 12 between its parts. "Share this chat"; the card: the sky's black, corners 20, a hairline of glassEdge, 14 in and over, its own still faint sky (seed 23, three quarters of the light), the chat's name 17 points semibold, tracking -0.4, then a box 12 under it, round(min(340, 0.36 x screen)) = 307 tall, scrolling the chat, a 56 point fade to the black at its foot; one line, 13 points on 18, muted, centred ("Anyone with the link can see this chat as it is now."; once shared, "Shared · opened 3 times, last 6:14 pm"); Share link: 52 tall, radius 26, ivory, the ShareOut glyph 17 and the words 16 semibold, tracking -0.2, in bg; once shared, "Turn off link" 14 points medium muted under it.
- The chat in the box (share/chat-copy.tsx:213-232, 346-385): the person's words in their bubbles on the right, Krovvi's answer 8 under them (its words start at the box's edge, so its star is clipped), 16 under each exchange; the time centred with no rules, 12 points faint, the day muted semibold, 16 under it.

## 4. Screens inside answers (components/screen, answer pieces)

- The card (screen.tsx:180-230, 355-369; parts.tsx:17-31): Krovvi's glass, corners 20, as wide as the turn (393 - 32 - 18 = 343), 4 over and 16 under. Its name: 13 on 18, semibold, soft, 16 at the sides, 14 from the top; a label after it, 500, muted, after "  ·  ". Its body: 16 at the sides and foot, 10 under the name (16 with none). Bricks 20 apart (inputs 18). It arrives fading up 6 points.
- A brick's label (parts.tsx:92-112): 13 on 18, 500, muted, 8 over the brick, a value across from it.
- number (bricks/number.tsx): the label, then the figure at display (40 on 46, light) or figure size, sized down to fit, with a unit small beside it; the note under it 4 lower as a Trend (13 point words, muted, or a 4/4/6 triangle and the words in up or down ink); up to three small figures under a hairline 16 lower, 14 over them, 12 apart with a hairline between.
- stats (native-blocks.tsx:62-193, 914-935): two to six figures, two to a row for two or four, three otherwise. A cell: 14 at the sides, 12 over, 14 under, its parts 2 apart: the label 13/18 500 muted, the figure 2 lower, the note 4 lower (12 point words, 500). Hairlines between cells and rows. Every figure of the grid is set at the size the longest fits its cell at (`fitSize`, look-data.ts:53-69: digits 0.62 em, separators 0.3, capitals 0.68, letters 0.56; never under 15). In a screen the outer cells give up their side padding; on its own it is a card of its own, 4 over and 16 under ("Rent 18,000 a month").
- rows (bricks/rows.tsx): rows at least 44 tall, 12 over and under (2 at the list's ends), gap 12; title 15/21 medium fg, detail 13/18 regular muted 1 under, note 12/16 muted 3 under; the value across in 15 point semibold tabular figures, a currency or unit before or after it small and muted; hairlines of line from the words' edge to the card's edge; a 48 point thumbnail (radius 11, rgba(255,255,255,0.06)) when any row has a picture; Krovvi's pick: a 6 point bone dot, "Krovvi's pick" 12 point semibold bone, 3 over the title, its value in bone. Rows rise in 45 ms apart, 320 ms each.
- table (table-view.tsx:199-240, 380-396, 850-885): header 13/18 semibold muted, 2 over and 8 under it, a hairline under; cells 16/22, tracking -0.2, 13 at their sides and 11 over and under (the outer sides 0 in a screen, the last row 2 under); the first column 500; numbers at the far side, tabular; a hairline between rows; a Total row set apart by a rule twice the hairline in muted ink and a 600 face; the picked row in bone, 600, with a 6 point bone dot 5 before its name.
- progress (bricks/progress.tsx): the figure and "of $600" (13 point muted), then 14 lower a row of 5 point dots spread end to end with at most 10 between centres, unlit at rgba(237,237,235,0.12), lit in ivory up to the share (round(share x count)), the last lit dot glowing (a light 3 times the dot at 0.5); the even pace a column of four 3 point soft dots in the gap nearest it, 20 tall, its word under it ("Today", 12 point medium muted, 6 under the row); the verdict 12 under: a 4.5/4.5/7 triangle and "$600 under an even pace", the amount semibold in up or down ink, the words 13 points soft. A small whole is one dot per unit (at most 14 across, 10 apart): done ivory, the last done glowing, waiting a 1.5 point faint ring; they fill in 90 ms apart, 420 ms each.
- timeline (bricks/timeline.tsx:262-298): a day's name 13/18 semibold soft, 8 under it, 18 between days; a row: the time column (13 point 500 soft tabular, the half of the day muted, 2 down), 12 to a 14 wide spine (a 10 point ring of 1.5 muted, 5 down; a 2 point rail of line under it, 4 lower), 12 to the words: title 15/21 semibold fg, detail 13/18 soft, place 12/16 muted after an 11 point marker, 4 lower; 16 under each item but the last.
- checklist (bricks/checklist.tsx:33-34, 263-292): a 22 point box, corners 7, 1.5 muted edge, 12 before the words; items 11 over and under (6 over the first), at least 44 tall; words 15 on 22; a hint 13 muted; done: the box ivory with a tick, the words struck through in muted; the count at the label's end, 12 point medium muted ("2 left").
- The Tip callout (blocks.tsx:23-61, 120-141): Krovvi's glass, 16 at the sides, 12 over, 4 over and 16 under it; a 14 point ring of 1.3 holding a 4 point dot, 7 to "Tip" (13 on 18, semibold, tracking 0.1, soft), 4 over the words, which are the answer's own and end on their paragraph's 16. Its words (i18n.ts:1501): Note, Tip, Important, Warning, Careful.

## 5. The icons (glyph.tsx)

Every icon is drawn on a 24 unit square from round boxes (a box's line on its centre line, a corner round only where both its sides are drawn, a side that stops in the open cut flat), three-quarter rings open at the top, straight pieces with round ends and at most one of the brand's dots (2.7 units, never under 1.6 points). The table (glyph.tsx:233-298) is copied as it is into `src/components/deep/glyphs.tsx`. The sizes used:

| where | icon | size | weight | ink |
|---|---|---|---|---|
| top bar | shareOut / past / cross | 19 / 21 / 14 | 1.5 / 1.5 / 1.7 | fg2 |
| composer | plus | 20 | 1.67 | fg2 |
| composer | mic / arrowUp | 20 / 16 | 1.9 units / 2 | bg |
| under an answer | copy, shareOut, retry | 16 | 1.5 | faint |
| under an answer | thumb down (not-right.tsx:27-40) | 16 | 1.5 | faint |
| under an answer | react (face and +) | 17 | 1.5 | faint |
| why line | bubble, calendar, people, envelope, doc | 12 | 1.4 to 1.5 | faint |
| + sheet | camera, picture, fileIn, mic | 28 | 2.22 | fg, recording red |
| dictation | cross / arrowUp | 13 / 13 | 1.7 / 1.9 | fg / bg |

## 6. English strings

- Chat: "Ask, or give it a job"; "Answer Krovvi"; "Krovvi is typing" (screen readers); "Try again"; "Today", "Yesterday", "Tomorrow"; weekdays Sunday to Saturday; months January to December, short Jan to Dec; "AM", "PM" (i18n.ts:132-147, 2659-2991).
- Files: "Uploading…", "Reading it…", "Ready. Ask about it" (i18n.ts:2665-2667).
- First moves (i18n.ts at bc25b1a3): "It went great 🎉", "It was okay", "Not great"; "Not now"; "Later 👌"; "1 of 3".
- Home: "Ask Krovvi"; Library, Recording, Meetings, To-do; Nutrition, Money, Fitness, Habits, Kitchen, Health, Plans, Trips, Watch (i18n.ts:4114-4165; core apps.ts).
- Sheets: "Camera", "Photos", "Files", "Record", "Recording now"; "Share this chat", "Anyone with the link can see this chat as it is now.", "Share link", "Turn off link" (lib/share/words.ts:20-28).
- Screens: "Krovvi's pick"; "Today"; " under an even pace", " over an even pace" (progress.tsx:21-29).

## 7. What the kit does not draw yet

- The web reading pile (web-reading.tsx), the web source chip inside an answer ("propertyfinder.eg +1"), cards and link rails, charts, sliders and inputs inside screens, the Money and To-do pages, the reply menu, History, the first chat's guest top, the stack of Krovvi's questions as cards (krovvi-stack.tsx), the recording capsule and the island.
