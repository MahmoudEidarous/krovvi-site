# Krovvi iPhone app: visual spec for HTML/CSS mockups

Source: `/Users/mahmoudaidaros/Projects/catch8-main`, branch `main`, commit `fd1b1e5` (read 2026-10-01). Every number below comes from that code; `file:line` points at it. Paths are relative to `src/` unless they start with another top folder.

Short names used in references: `agent.tsx` = `src/app/agent.tsx`; `index.tsx` = `src/app/index.tsx`; `[id].tsx` = `src/app/person/[id].tsx`; `_layout.tsx` = `src/app/_layout.tsx`; `i18n.ts` = `src/lib/i18n.ts`; `tokens.ts` / `markdown.ts` / `motion.ts` = `src/theme/…`; `glyph.tsx`, `sheet.tsx`, `press.tsx`, `glass.tsx` = `src/components/…`; `sources.tsx`, `found.tsx`, `cards.tsx`, `actions.tsx`, `native-blocks.tsx` = `src/components/answer/…`.

Computed values assume an iPhone 393 x 852 with safe-area insets top 59, bottom 34.

## 0. Shared foundations

### 0.1 Colours (theme/tokens.ts:12-31)

| token | hex | use |
|---|---|---|
| bg | #0A0A0A | every screen ground (also app.json `backgroundColor`, `userInterfaceStyle: "dark"`) |
| surface | #161615 | cards, sheets, chips |
| surfaceHi | #1F1F1E | raised: user bubble, composer field, pills |
| line | #262625 | hairlines, grabber, quiet disc fills |
| fg | #EDEDEB | main text, the one white control (send disc) |
| soft | #A9A8A2 | quoted words, links, receipt pill text |
| muted | #8F8F8A | labels, nav glyphs, list markers |
| faint | #7A7A74 | timestamps, placeholders, meta lines |
| danger | #C4574F | destructive, failures |

Speaker voice tints (tokens.ts:42-49): #E6DCC8, #C98A62, #B0A89D, #C2A470, #8F7864, #D4B49A. `voice[0]` (#E6DCC8) also marks "Krovvi's pick" in option blocks.

File-type tints (lib/file-face.ts): PDF #E5484D, Spreadsheet #30A46C, Word document #3E7BFA, Presentation #F76B15, Email #F5B940; anything else muted.

### 0.2 Radius, space, type (tokens.ts:51-92)

- radius: card 17, control 11, input 16, composer 26, sheet 22, pill 999.
- space: xs 4, sm 8, md 12, lg 16, xl 24, xxl 32.
- type (size / weight / letterSpacing): display 40/300/-2, title 22/600/-0.8, heading 20/600/-0.6, noteTitle 16/500/-0.3, body 14/400/-0.15, meta 12/400/0, label 13/400/0.
- leading: arabic 1.7, latin 1.45 (multipliers).
- Font: the iOS system font (SF Pro) everywhere. No custom font is loaded. Menlo only for code, math and QR fallback (theme/markdown.ts:439-442, components/answer/code-block.tsx:163).
- Hairline = `StyleSheet.hairlineWidth` (0.33 px on a 3x phone; use 0.5px in CSS).

### 0.3 Motion (theme/motion.ts)

- Curve everywhere: cubic-bezier(0.23, 1, 0.32, 1) (motion.ts:16). No springs.
- Durations: press 110, fade 150, morph 190, enter 240, exit 140, reflow 200 ms (motion.ts:22-35).
- Press feedback: scale to 0.97 on touch-down, 110 ms (components/press.tsx:52-80, motion.ts:77).

### 0.4 Status bar and presentation

- Status bar light content (app/_layout.tsx:252). All screens are full-screen pushes that slide in from the right, ground #0A0A0A (app/_layout.tsx:267-274). The chat (`/agent`) uses these defaults.

### 0.5 Brand marks drawn in the app

**Small K mark** (components/glyph.tsx:46-83). Seven equal dots on a 120-unit canvas, centres in drawing order: (40,28) (40,60) (40,92) (61,45) (82,30) (61,75) (82,90). Static mark dot diameter = 20 units (glyph.tsx:64). At 22 px: unit 0.1833, dot 3.67 px, centres (7.33,5.13) (7.33,11.0) (7.33,16.87) (11.18,8.25) (15.03,5.5) (11.18,13.75) (15.03,16.5).

**Dotted wordmark "krovvi"** (components/glyph.tsx:1446-1466, lib/word-dots.ts). 46 equal dots. In pitch units (one unit = distance between two stem dots):

```js
K = [[0,0],[0,1],[0,2],[0,3],[0,4],[0.875,1.375],[1.75,0.75],[2.625,0.125],[0.875,2.625],[1.75,3.25],[2.625,3.875]]
R = [[0,1],[0,2],[0,3],[0,4],[0.85,1],[1.7,1.2]]
O = 10 points: a = PI/2 + i*2*PI/10 ; [1.5 + 1.5*cos(a), 2.5 - 1.5*sin(a)]
V = [[0,1],[0.42,2],[0.83,3],[1.25,4],[1.67,3],[2.08,2],[2.5,1]]
I = [[0,-0.3],[0,1],[0,2],[0,3],[0,4]]
letter x offsets: K 0, R 3.825, O 6.725, V 10.925, V 14.425, I 18.125
box: x0 -0.6, y0 -0.85, w 19.4, h 5.4 ; dot diameter = 0.8125 * pitch
```

SVG: `viewBox="-0.6 -0.85 19.4 5.4"`, circles r = 0.40625. At pitch 8 (empty chat): 155.2 x 43.2 px, dots 6.5 px.

**K thinking loader** (components/k-thinking.tsx). Same seven centres, dot diameter 16 units (R = 8, k-thinking.tsx:35), default size 32, colour fg unless tinted.
- Each dot rests at opacity 0.22 (k-thinking.tsx:43).
- Keyframes per dot: 0% 0.22, 18% 1, 62% 0.22, 100% 0.22 (k-thinking.tsx:68).
- Cycle 1400 ms, infinite, timing cubic-bezier(0.23,1,0.32,1), delay = index x 140 ms in drawing order (spine top, spine middle, spine bottom, upper arm inner, upper arm outer, lower arm inner, lower arm outer) (k-thinking.tsx:40-42, 69-72).
- Reduce Motion: all seven 0.45 -> 1 -> 0.45 together, 1300 ms ease-in-out (k-thinking.tsx:67-72).
- CSS: `.dot{opacity:.22;animation:k 1400ms cubic-bezier(.23,1,.32,1) infinite}` `@keyframes k{0%{opacity:.22}18%{opacity:1}62%{opacity:.22}100%{opacity:.22}}`, delays 0,140,...,840 ms.

**Arc spinner** (components/spinner.tsx:32-84): a circle with border = max(2, round(size/9)); track = tint at 18% alpha (hex + `2E`), top border = tint; one turn per 800 ms, linear.

### 0.6 Glyphs used in the chat (all drawn in components/glyph.tsx; strokes are flat bars with round ends)

| glyph | look |
|---|---|
| Past (1474) | ring of 8 dots (radius 8/24 of size) around a centre dot, plus one short hand (4.4/24 of size, stroke = weight) rotated 36 deg toward one o'clock. Dot = max(1.6, 2.7*size/24). |
| Cross (218) | two bars size x weight, rotated +45 / -45 deg. |
| Plus (378) | two bars size x weight, crossing. |
| Mic (616) | the "dot mic": open capsule 8x13 (of 24) with border, three dots inside at y 6.2/9/11.8, a U cradle 13 wide from y 11.5, stem to 22.5, base 6.4 wide. |
| ArrowUp (395) | stem from 1 px to size-1 px, two arms 0.46*size at +/-45 deg meeting at the top cap. |
| Copy (817) | two equal rounded squares (page = 0.68*size, radius max(2.5, 0.18*size)), the back one peeking up-right. |
| ShareOut (916) | up arrow (stem 0.58*size, arms 0.42*size) over an open box 0.8*size wide, 0.52*size tall, bottom radii 3. |
| Retry (1528) | 300 deg arc (radius 0.36*size) from one o'clock clockwise, arrowhead arms 0.26*size at the open end, round caps. |
| ThumbDown (components/answer/not-right.tsx:27-40) | Lucide thumbs-down, stroked on a 24 grid, round caps: `M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z` |
| Memory (1284) | a brain in one stroke on a 24 grid plus a filled dot r 1.75 at (12, 11.5): `M12 5A3 3 0 1 0 6.003 5.125A4 4 0 0 0 3.477 10.895A4 4 0 0 0 4.033 17.483A4 4 0 1 0 12 18A4 4 0 1 0 19.967 17.483A4 4 0 0 0 20.523 10.895A4 4 0 0 0 17.997 5.125A3 3 0 1 0 12 5ZM12 5V7.4M12 18V15.6` |
| Globe (1166) | circle (border = weight), an inner vertical ellipse 0.44*size wide, one horizontal bar across the middle. |
| Search (238) | ring 0.72*size (border = weight) at top-left, one dot (max(1.6, 2.7*size/24)) in the lens centre, handle bar 0.36*size rotated 45 deg at bottom-right. The usual live-step icon ("Searching your notes…"). |
| Envelope (1227) | rounded body 0.74*size tall (radius 0.16*size), flap V of two bars 0.56*size rotated +/-28 deg. |
| Check (139) | L of two borders, size x 0.55*size, rotated -45 deg. |
| ChevronRight (121) | square corner (top + right borders) rotated 45 deg. |
| Doc (882) | portrait page 0.78*size wide, radius max(2.5, 0.16*size), two inner bars (full, then 60%). |
| Folder (291) | tab (0.42 x 0.16 of size) on a body (0.66 of size tall), radius 3. |
| Pencil (155) | leaning pencil plus three trail dots on the baseline. |

### 0.7 The bottom sheet (components/sheet.tsx)

- Scrim #000 at 0.6 opacity (sheet.tsx:165-167, 496).
- Panel bg #161615, top corners 22, paddingHorizontal 12, paddingTop 8 (sheet.tsx:499-505); paddingBottom = 34 + 16 = 50; max height 76% of screen = 647.5 px, then it scrolls (sheet.tsx:180).
- Grabber zone paddingVertical 8; grabber 36 x 4, radius 2, #262625 (sheet.tsx:533-534).
- Rises with translateY over 240 ms, leaves over 140 ms (sheet.tsx:124-140).
- `SheetRow`: minHeight 52, row, gap 12, paddingHorizontal 12, radius 11; label 16 / 400 / -0.3 fg; optional hint 12 faint at the right; pressed = #1F1F1E fill at 60% (sheet.tsx:387-430, 560-577). Destructive label #C4574F.
- `SheetHeader`: paddingHorizontal 12, paddingTop 4, paddingBottom 8; title 15 muted, lineHeight 21; detail 12 faint (sheet.tsx:536, 557-558).
- `SheetAction` tiles: row of equal tiles, gap 8, paddingHorizontal 12; each tile height 72, radius 11, bg #1F1F1E, icon then label 11 muted, gap 8 (sheet.tsx:509-530).
- `SheetDivider`: hairline #262625, marginVertical 8, marginHorizontal 12 (sheet.tsx:579-584).

---

## 1. The chat with Krovvi (`app/agent.tsx`)

### 1a. Screen chrome

Layout top to bottom (393 x 852):

| y (px) | what | source |
|---|---|---|
| 0-59 | status bar over #0A0A0A | agent.tsx:4666 |
| 59-99 | nav row, 40 tall | agent.tsx:2409, 4669-4676, 4691 |
| 99-111 | nav bottom padding 12 | agent.tsx:4674 |
| 111-742 | the thread (scrolls) | agent.tsx:2509-2564, 4701 |
| 742-852 | composer block (no keyboard) | agent.tsx:2719, 4901 |

- Ground #0A0A0A (agent.tsx:4666). Top padding = safe top (59) + live lane (0 normally; 36 while a recording, meeting or file-making pill is showing) (agent.tsx:2409, lib/record/live.ts:67, 127-132).
- Nav row: row, centred vertically, space-between, paddingHorizontal 20 (16+4), paddingBottom 12, gap 12 (agent.tsx:4669-4676).
  - Left: the small K mark, 22 px, fg #EDEDEB, alignSelf flex-start, paddingTop 2 (agent.tsx:2418-2425, 4679). It is HIDDEN on an empty chat (opacity 0, shifted down 4) and fades in with the first message over 240 ms (agent.tsx:2382-2391). At y 69-91, x 20-42. There is no text title in the bar.
  - Right, first: history button, a bare glyph in a 40 x 40 box: `Past` 24 px, muted #8F8F8A, weight 1.5 (agent.tsx:2433-2451, 4691). A 7 x 7 fg dot sits at top -1, right -3 of the glyph when another chat has news: steady for an unread answer, breathing opacity 1 -> 0.3 over 1400 ms alternate when another chat is still being written (agent.tsx:2455-2469, 3366-3369, 4682-4690). Centre at (301, 79).
  - Right, last: close, a bare `Cross` 15 px, muted, weight 1.7 in a 40 x 40 box (agent.tsx:2473-2481). Centre at (353, 79).
  - No discs or circles behind the nav glyphs (comment agent.tsx:2427-2432).
- Keyboard: the thread and composer ride up together (KeyboardAvoidingView, offset -34), so with the keyboard up the field's bottom edge sits 16 px above the keys (agent.tsx:2494-2501, 2719).
- AI paused banner: off (`AI_PAUSED = false`, components/ai-paused.tsx:18). Draw nothing.

### 1b. The user's message

- Right-aligned. A bubble holds only the words (agent.tsx:3143-3160, 3314-3325).
- Message column width = 3 x 113 + 12 = 351 px (`PHOTO_TILE` = floor((393 - 40 - 12) / 3) = 113) (agent.tsx:4657, 4709-4716). Its right edge sits at x 373 (20 from the screen edge).
- Bubble: bg surfaceHi #1F1F1E, radius 17 on three corners, bottom-right corner 6 (11 - 5), paddingVertical 10, paddingHorizontal 14, maxWidth 82% of 351 = 287.8 px (agent.tsx:4776-4784). No border.
- Text: 15 px, weight 400, letterSpacing -0.15, colour fg #EDEDEB, no explicit line height (iOS default, about 18 px) (agent.tsx:4785). Aligned to its own script (Arabic right) (agent.tsx:3246, 3317-3320).
- Photos sent with it: square tiles 113 x 113, radius 12, gap 6, three to a row, right-justified, ABOVE the bubble with no box (agent.tsx:3278-3284, 4718-4724, 4791). A photo not yet back from the server shows a #161615 tile with the `Picture` glyph 16 faint (components/sent-photo.tsx:41-49).
- Files sent with it: a full-width card above the bubble: bg #161615, radius 17, paddingVertical 12, paddingHorizontal 14, gap 12; badge 34 x 34, radius 9, bg #1F1F1E holding `Doc` 16 in the file's tint; name 14.5 / 600 / -0.15 fg; kind under it 11 faint, letterSpacing 0.3 ("PDF", "Spreadsheet", "Word document") (agent.tsx:3285-3313, 4729-4749).
- Long-press opens a sheet: "Edit message" (last question only), "Copy" (agent.tsx:3074-3094; i18n.ts:2336, 478).
- Gap between thread rows: 16 (agent.tsx:4701). The thread has no top padding: the first row starts right under the nav (y 111).

### 1c. Krovvi's answer

- Left-aligned, full width of the thread (353 px, x 20-373). No avatar, no name, no label above it, no bubble (agent.tsx:3330-3339).
- Body text: 16 px, weight 400, letterSpacing -0.2, line height 16 x 1.7 = 27.2 px, colour fg #EDEDEB (agent.tsx:4793-4798; theme/markdown.ts:674). The same 27.2 line height is used for English and Arabic.
- Paragraph spacing: marginBottom 12 (theme/markdown.ts:502).
- Bold: weight 600, same fg colour (markdown.ts:503). Italic: italic. Strike: line-through in faint (markdown.ts:504-505).
- Headings (markdown.ts:488-500): H1 22 / 600 / -0.8, marginTop 16, marginBottom 4. H2 20 / 600 / -0.6, marginTop 16, marginBottom 4. H3 16 / 700 / -0.3, marginTop 12, marginBottom 2. H4-H6 12 muted. All keep the 27.2 line height.
- Bullet lists: each item is a row; the bullet is a drawn 5 px circle, muted #8F8F8A, top margin (27.2 - 5) / 2 = 11.1 px, 3 px before it, 12 px after it; item marginBottom 8; list marginBottom 12 (markdown.ts:405-409, 509-514, 542-549).
- Numbered lists: "1." in muted, 16 px, line height 27.2, tabular figures, 10 px after (markdown.ts:390-403, 522-532).
- Checkbox items (`- [ ]`): 14 x 14 box, radius 4, 1.2 px border faint; done = filled soft #A9A8A2 with a 7 px check in bg colour (markdown.ts:374-383, 550-561).
- Links: soft #A9A8A2, underlined (markdown.ts:659). Phone numbers, emails, places and dates are tappable words with a dotted underline that open a sheet (components/answer/sources.tsx:231-253, 858).
- Quote: 2 px left rule #262625, paddingLeft 12, marginVertical 8 (markdown.ts:570-581).
- Inline code: bg #1F1F1E, radius 4, padding 1 / 4, Menlo 15 px (markdown.ts:589-599).
- Rule: hairline #262625, marginVertical 16 (markdown.ts:650-654).
- Holding a paragraph for 380 ms gives it a #161615 ground (radius 11, 8 px wider each side) and opens a sheet with the paragraph as header and four tiles: "Explain this" (K mark), "Go deeper" (Search), "Translate" (Globe), "Copy" (sources.tsx:285-313, 859-867; answer/actions.tsx:314-378; i18n.ts:1404-1406, 1305).
- Under a finished answer, in this order, 8 px apart (answerWrap gap, agent.tsx:4799): connect card(s), question card, "how it was found" line, sources line, memory chip, the action icons (agent.tsx:4056-4190). Each is described in 1e and 1f.
- Action icons row (only after the last word lands; fades in 240 ms): row, gap 16; each icon in a 30 x 26 box (agent.tsx:4116-4176, 4806-4807). Left to right:
  1. `Copy` 14 faint #7A7A74, weight 1.5. After a tap: `Check` 13 soft for 1.6 s.
  2. `ShareOut` 14 faint, weight 1.5.
  3. `ThumbDown` 14 faint, weight 1.5 (soft once marked).
  4. `Retry` 14 faint, weight 1.5 (only on the newest answer, not while running).
  Icon centres at x 35, 81, 127, 173.

### 1d. While Krovvi is thinking

The chat does NOT show the K loader while it works. It shows a working strip under the question (agent.tsx:3693-3849):

- Placement: the question just sent scrolls to 12 px below the top of the thread (y 123) and the space below it is held open ("runway") so the answer grows downward under it (agent.tsx:1743-1797, 4663).
- The strip sits right after the last message: thread gap 16 + marginTop 4. No box, no background (agent.tsx:4825-4834). It rises in: opacity 0 -> 1, translateY 6 -> 0, 320 ms ease-out (agent.tsx:3354-3357, 3787-3797).
- Strip column: paddingVertical 4, gap 6 (agent.tsx:4830-4834). Rows appear only when they have content:
  1. Craft line (when the worker names the kind of job): 11 px faint, letterSpacing 0.3, 15 tall, e.g. "Researching", "Planning", "Writing the minutes" (agent.tsx:3807-3811, 4848-4854; i18n.ts:2340-2355).
  2. Trail of finished steps: up to 7 bare icons 11 px muted in 16 x 16 boxes, gap 10, row 18 tall; each fades in 150 ms (agent.tsx:3816-3828, 4857-4863).
  3. Live row, 26 tall, gap 9 (agent.tsx:3830-3842, 4864-4870):
     - 20 x 20 badge: before any tool, the arc spinner 13 px muted (2 px stroke, track #8F8F8A at 18%, 800 ms per turn). During a tool, that tool's icon at 16 px fg, breathing opacity 1 -> 0.35, 700 ms, ease in-out, reversing (agent.tsx:3582-3596, 3831-3837).
     - Status line: 13 px fg (agent.tsx:4873), drawn word by word (4 px gaps) with a light sweep: each word's opacity = 0.5 + 0.5 x max(0, 1 - |crest - index| / 1.7), crest travels from one word before the line to one past it every 1500 ms, linear, looping (agent.tsx:3608-3652). Reduce Motion: plain still text.
     - Clock at the far right: 12 px faint, tabular, "m:ss" counting from the tap (agent.tsx:3839-3841, 4875; lib/format.ts:20-23).
- Status line copy, in order of what is true (lib/agent/recover.ts:64-74; agent.tsx:3750-3766; i18n.ts:2594-2599):
  - "Reading your question…" (first 15 s with nothing truer)
  - "Sending your photo…" / "Sending 3 photos…"
  - a tool's own line, e.g. "Searching your notes…", "Looking over your week…", "Searching and reading your email…", "Checking your calendar…", "Searching the web…", "Reading what you know about them…", "Keeping what you said…" (i18n.ts:2403-2488)
  - "Writing the answer…" (every tool is back)
  - "Still working on your question…" (after 15 s with nothing new)
  - or the worker's own sentence before a tool call, in its own words.
- After 10 s a second line appears under the strip (fade 240 ms): "You can close the app. It keeps working and you'll get a notification." (notifications on) or "You can close the app. It keeps working." plus a "Notify me" pill (notifications off). Text 12 faint; row gap 12, marginTop 8; pill 28 tall, paddingHorizontal 12, radius 999, bg #1F1F1E, label 13 / 500 fg (agent.tsx:3844-3931, 4836-4846; i18n.ts:2629-2632).
- The strip disappears the moment the first word of the answer arrives (agent.tsx:680-683).
- The send disc becomes a stop: same 34 px white disc with an 11 x 11 square, radius 3, colour #0A0A0A (agent.tsx:2910-2920, 5132).

Where the K loader IS used in the chat: opening a past chat whose turns are still loading shows `KThinking` 22 px, muted #8F8F8A, centred in the thread (agent.tsx:4220-4226); a weather/clock/places card still loading shows it 22 px muted in a 132 px tall card (answer/cards.tsx:112-117); the memory chip's "Saving" line uses it at 11 px (memory/turn-chip.tsx:191-199).

### 1e. Sources and receipts

**Recording cited in a sentence = receipt pill, inline** (components/answer/sources.tsx:418-448, 869-876; lib/receipt-time.ts):
- Preceded by a thin space (U+2009). Pill 20 tall, radius 10, bg #1F1F1E, paddingLeft 4, paddingRight 8, gap 5, maxWidth 220, no border. It sits inside the sentence as an inline view and is raised 4 px (translateY -4) from where React Native puts an inline view, so it reads on the line of the words (sources.tsx:322-328, 869). In CSS the closest equivalent is an inline-flex 20 px box with `vertical-align: middle`; check it against a device screenshot.
- Contents: play triangle (CSS triangle: top/bottom borders 4 transparent, left border 6.5 soft #A9A8A2; marginLeft 3, marginRight 1), then the recording title 12 / 500 soft (one line, truncates), then the second 11 faint tabular: "0:27" (or "1:04:12"), or "from 12:40" when only the chapter start is known, or no clock at all.
- Kinds without seconds (documents, photos, typed notes, links, emails) show their own glyph at 13 px muted instead of the triangle (Doc / Camera / Link / Envelope) and never a clock (sources.tsx:411-415; components/item-glyph.tsx).
- Example: `…the price was 4,200 [▶ Call with Ahmed  0:27] and he wants…`
- The same moment cited twice in one answer shows one pill only (lib/answer/receipt-fold.ts:97-123).
- Tap: opens the recording's player at that second.

**Web source = site pill, inline** (sources.tsx:348-382, 870-872): same 20 px pill: site favicon 13 px (radius 4) or a `Globe` 11 muted, the site name 12 / 500 soft (cut at 26 characters), and "+1" 11 / 500 faint when more pages back the sentence. Tap opens a sheet with the page's image, site, title (18 / 600 / -0.3, lh 24), description (14 soft, lh 20), URL (12 faint), and buttons "Open page" (white pill 46 tall, 15 / 600 dark text, `Outward` arrow) and "Copy link" (46 tall, bg #1F1F1E) (sources.tsx:768-839, 905-933; i18n.ts:1318, 1308).

**Sources line under the answer** (sources.tsx:575-612, 885-892): marginTop 12 (so 20 below the text block), row gap 8. A stack of up to three 22 x 22 squares (radius 7, bg #1F1F1E, 2 px border #0A0A0A, each overlapping the previous by 7) holding favicons 14, a small play triangle for recordings (3.5 / 3.5 / 5.5, soft) and a `Memory` glyph 11 soft for memory lines; then "4 sources" 12.5 / 500 faint (i18n.ts:1316). Tap: a sheet titled "4 sources" (17 / 600 / -0.3) listing rows (paddingVertical 10, hairline under each): a 34 px circle with the mark, a meta line 12 faint ("from a recording · 0:27", "From your memory · about Hazem", the site) and the title 14.5 / 500 fg lh 19 (sources.tsx:626-750, 896-903; i18n.ts:1336-1345).

**"How it was found" line** (components/answer/found.tsx:113-148, 199-207): only when tools ran. Row gap 8: up to four step icons 11 px faint (12 x 12 boxes, gap 5), then "Searched your notes and your email · 14 s" or "Worked for 3 s" in 12.5 faint, then a 7 px chevron faint (i18n.ts:2637-2661). Places are always named in this order: your notes, your memory, your email, your calendar, your Drive, the web, the map; three or more read "your notes, your memory and your email"; time under a minute is "14 s", over it "1 min 20 s" (lib/agent/found.ts:41-70, 135-137). Tap: sheet "What Krovvi did" listing each step with a 30 x 30 badge (radius 9, #1F1F1E) and label 14.5 / 500.

**People in answers**: no face, no chip, no link. A person's name is plain text (bold only when the model writes it in bold). Person-tied UI in the chat is limited to: memory rows "From your memory · about Hazem" in the sources and "Not right" sheets (i18n.ts:1344-1345), memory chip lines such as "Saved: Karim will send the deck" (i18n.ts:2314), and the empty-chat starter lines (1h). No person card exists among the answer cards (answer/cards.tsx:26-53 only knows weather, time, places).

**Not right** (thumb down) opens a sheet: "What is not right?" (17 / 600), "What this answer used" (12 faint) over rows of the memory lines and recordings it rested on, a field "What is true?" (bg #1F1F1E, radius 16, min 88 tall, 16 px text), and a white "Send" button 48 tall (components/answer/not-right.tsx:49-232; i18n.ts:2577-2580).

### 1f. Cards that can appear

Full detail for the three most common:

**1. Draft waiting for a yes ("Before it sends")** (agent.tsx:4415-4578, 4999-5027). Not inside the thread: it sits between the thread and the composer, after the answer ends, and fades in over 240 ms.
- Card: marginHorizontal 20, marginBottom 8, bg #161615, radius 17, paddingVertical 12, paddingHorizontal 16, gap 8. No border.
- Head row (gap 8): title 14 / 500 / -0.3 fg, flex 1: "Before it sends"; then "Valid for 30 minutes" 12 faint; then `Cross` 10 muted.
- Field rows (row, gap 8): label 12 faint, 52 wide, paddingTop 1: "To", "Cc", "Subject"; value 14 soft (2 lines max); the subject value is 14 / 600 fg.
- Body: 14 soft, line height 21, 5 lines then cut (tap expands).
- Actions (row, gap 12, paddingTop 2): "Send it" = white pill bg #EDEDEB, radius 999, paddingVertical 8, paddingHorizontal 24, label 14 / 500 / -0.3 in #0A0A0A; then "Change it" 14 muted, padding 8. While sending the pill reads "Sending…" at 55% opacity.
- Other titles and buttons on the same card (i18n.ts:2665-2710): calendar invite "Before it invites" / "Send the invitations"; event change "Before it tells the guests" / "Send the change"; move "Before it moves" / "Move the event"; cancel "Before it cancels" / "Cancel the event"; doc rewrite "Before it replaces the document" / "Replace it"; delete "Before it deletes" / "Delete it"; share "Before it shares" / "Share it"; rule "Before it keeps this rule" / "Keep it" + "Discard".

**2. Memory chip: what the turn saved (tasks, facts, rules)** (components/memory/turn-chip.tsx:189-359). Under the answer, marginTop 8 (16 below the text).
- Box: bg #161615, radius 11, paddingHorizontal 12, paddingVertical 10, gap 6.
- Each line: row, space-between, gap 8. Left: the small K mark 11 px muted in a 14 px column (paddingTop 3), then the words 13.5 soft, letterSpacing -0.1, line height 19.6. Right: an "Undo" pill: 24 tall, paddingHorizontal 9, radius 999, bg #1F1F1E, `Undo` glyph 9 soft + "Undo" 12 / 500 fg, gap 4.
- After Undo the words go faint with a line-through and the pill becomes "Undone" 12 muted.
- More than three lines: "Show 2 more" 12.5 / 500 muted.
- While saving: KThinking 11 muted + "Saving: …" in muted.
- Copy patterns (i18n.ts:2308-2331): "Saved: Hazem lives in Dubai", "Saved: send the deck for Karim" (a task the owner owes), "Saved: Karim will send the deck" (someone else's), "Done: send the deck for Karim", "Updated: send the deck, now 9 Oct (was 7 Oct)" (future days read as dates; lib/saved-lines.ts:182-185, lib/format.ts:60-69), "Updated: Hazem lives in Dubai (was Cairo)", "From now on: short replies to Hazem", "Not saved: …" with "Try again".

**3. Question with choices** (components/chat-ask-card.tsx:387-452). Ends an answer; marginTop 8.
- Card: bg #161615, radius 22 (17 + 5), paddingHorizontal 16, paddingTop 16, paddingBottom 12, gap 12.
- Question: 17 / 500 / -0.3, line height 24, fg.
- Choices (gap 8): rows minHeight 48, radius 14, bg #1F1F1E, paddingHorizontal 14, paddingVertical 8, gap 11; label 15 / 500 / -0.2 fg; optional detail 12.5 muted, lh 17. A picked row shows `Check` 14 fg at the right; the others dim to 40%.
- "Something else": minHeight 44, gap 9, paddingHorizontal 14: `Pencil` 13 muted + "Something else" 14.5 muted (i18n.ts:2612).
- Several questions: a step line "2 of 3 · Budget" 12.5 / 500 muted with a 28 px back disc (i18n.ts:2615).

One or two lines each for the rest:
- Connect Google card (agent.tsx:4072-4100, 4753-4774): #161615, radius 17, padding 12 / 14, maxWidth 320; 32 px #1F1F1E circle with "G" 15 / 700; "Connect Google" 14.5 / 600 and "Signs you in with Google and comes right back" 11.5 faint; 10 px chevron.
- Weather card (answer/cards.tsx:181-277, 458-509): #161615, radius 17, padding 14 / 16; place 15 / 600; temperature 46 / 400 / -1.5; sky line 14 / 500 soft; "High 31°  ·  Low 22°"; a 64 px #1F1F1E disc with the sky icon 46; hourly strip; six day rows 38 tall with range bars (4 px, #262625 track, soft fill, white now-dot); "MET Norway  ·  Checked at 3 pm" 11 faint.
- Clock card (cards.tsx:283-352): rows with a 10 px sun dot (fg day / muted ring night), place 15 / 600, "Today  ·  2 hours ahead  ·  GMT+2" 12 faint, time 27 / 400 / -0.6 with "pm" 13 muted.
- Places card (cards.tsx:360-451): map picture 176 tall on top, then rows: 22 px white numbered pin, name 15 / 600, "★ 4.6  ·  1.2k reviews  ·  Cafe" 12 faint, address 12.5 muted, a 34 px #1F1F1E disc with the `Marker` glyph.
- Stats block (answer/native-blocks.tsx:38-96, 491-550): one key figure = #161615 card radius 17, title 14 soft, value 36 / 600 / -1.4; several = tiles (#161615, radius 11) value 24 / 600 / -0.8 (20 for three), label 12 faint, trend triangle.
- Steps block (native-blocks.tsx:102-132, 503-513): 22 px numbered discs (#1F1F1E) joined by a 0.67 px #262625 rail; title 15 / 500 lh 22, detail 13.5 soft lh 19; "4 steps · about 25 min" 12 faint.
- Checklist block (native-blocks.tsx:138-196, 515-524): #161615 card radius 11; "2 of 5 ready" + "Tap to tick" 12 faint; 2 px progress line (fg fill); rows with 20 px boxes (radius 6, 1.5 border faint, white fill + dark check when done), text 15 lh 22.
- Links block (native-blocks.tsx:202-287, 526-543): cards #161615 radius 11 with a 108 px thumbnail (video length badge) or a 44 px doc mark; title 15 / 500 lh 20; favicon 12 + "site · date" 12 faint; why 12.5 soft.
- Options block (native-blocks.tsx:337-405, 553-573): one #161615 card radius 17; each option: NAME 12 / 600 uppercase soft (letterSpacing 0.7), headline figure 26 / 600, what 14 soft, detail 15 fg, label/value pairs; the recommended one on #1F1F1E with "Krovvi's pick" in #E6DCC8 and "Why: …".
- Flow block (native-blocks.tsx:421-451, 576-585): #161615 card radius 17 with stacked stage boxes (radius 12; key stage on #1F1F1E), "1 · THE ONE THAT MATTERS" 11 faint uppercase, title 15.5 / 600, thin arrows between.
- Facts block (native-blocks.tsx:457-480, 587-589): #161615 card radius 11, label 13 faint left, value 14.5 fg right, hairlines.
- Callout (answer/blocks.tsx:22-57, 115-133): #161615, radius 11; a 14 px ring mark + "Note" / "Tip" / "Important" / "Warning" (12.5 / 600; warnings in #C4574F).
- Fold (blocks.tsx:70-111, 134-154): #161615 radius 11, 44 tall head "Show all 12 steps" 14 / 500, chevron that turns.
- Table (answer/table-view.tsx:45-81, 316-376): #161615 card radius 11, header 12 / 500 faint, cells 14 lh 19, foot "12 rows · 4 columns" 12 faint with "Open table" 12 soft at the right (i18n.ts:1320, 1350). A comparison table is drawn as the options stack instead, with "3 options" and "See as a table" (i18n.ts:1330, 1349).
- Code (answer/code-block.tsx:139-178): #161615 radius 11, 34 px head with the language 12 / 500 muted and "Copy", code Menlo 12.5 #D9D8D2.
- Picture / gallery (answer/answer-image.tsx), QR card (answer/qr-card.tsx: #161615 radius 17, white paper radius 14), math (Menlo 13 faint), mermaid diagrams.
- File being made (components/making-card.tsx:192-221): above the composer; radius 14, bg #1F1F1E, hairline #262625; a five-dot trail (6 px dots), stage words 14 / 600 ("Writing the file", "Checking every page"), clock 12.5 / 600 soft; title 12.5 faint "Price list · PDF and Word"; when ready, format pills 28 tall (#262625) "PDF", "Word" (i18n.ts:3005-3040).
- Notes it wrote (agent.tsx:4586-4648, 5030-5047): pills above the composer, #161615, radius 999, padding 7 / 14, `Doc` 12 muted + title 12.5 fg (max 260 wide).
- Tapped phone / email / place / date (answer/actions.tsx:131-311): a sheet with the item as header and tiles: "Call", "WhatsApp", "Copy number" / "Write an email", "Copy address" / "Apple Maps", "Google Maps", "Copy address" / a 48 x 52 date tile (month 11 / 600 muted, day 21 / 600) + "Add to calendar", "Remind me".

### 1g. The composer

Position (no keyboard): composer block 742-852; field 20-373 x, 750-802 y (agent.tsx:2719, 4901, 4930-4935).

- Composer wrapper: paddingHorizontal 20, paddingTop 8, paddingBottom = 34 + 16 = 50 (agent.tsx:2719, 4901).
- Field ("Glass", Liquid Glass switched off): bg #1F1F1E, hairline border #262625, radius 26, padding 6 all round, clips its contents (components/glass.tsx:30, 47-54, 71-76; agent.tsx:4930-4935). One line: 52 tall x 353 wide.
- Row inside: row, items aligned to the BOTTOM, gap 8 (agent.tsx:4936):
  1. Plus button: a 44 x 44 touch box pulled in by margins -5 / -2 so it takes 34 x 40 of layout; `Plus` 16 px muted #8F8F8A, weight 1.6; no disc (agent.tsx:2857-2877, 4947-4954). Centre (43, 776).
  2. Text input: flex 1 (257 px), 16 px, letterSpacing -0.15, line height 20, colour fg, paddingVertical 10, paddingHorizontal 8, grows to max 120 tall (agent.tsx:2878-2903, 5109-5118). Placeholder in faint #7A7A74: "Ask, or give it a job" (whole library), "Ask about this note", "Ask about this folder" (i18n.ts:2291, 2399-2400).
  3. Send disc: 34 x 34, radius 17, bg fg #EDEDEB, marginBottom 3 (agent.tsx:5119-5127). Centre (350, 776). Empty field: the dot mic `Mic` 17 px in #0A0A0A, weight 1.6. With text, a photo or a file: `ArrowUp` 14 px #0A0A0A, weight 2. The two cross-fade in place over 190 ms (mic fades out by 55% of the move and shrinks to 0.88; the arrow fades in from 35% and grows from 0.88 to 1) (agent.tsx:2393-2405, 2948-2953). This disc is the one white thing on the screen.
- While typing: only the disc changes (mic -> arrow); the field grows upward line by line, the plus and disc stay on the bottom line.
- While an answer is written: disc shows the stop square (1d). Words typed then show a hint line above the field: "Krovvi is still answering. Send this when it is done, or stop it first." 13 faint, paddingHorizontal 12, paddingBottom 8 (agent.tsx:2769-2777, 5095; i18n.ts:2602).
- Aimed at a folder or recording: a chip above the field: 28 tall, radius 999, bg #161615, paddingLeft 10, paddingRight 4, gap 6; `Folder` or `Doc` 12 muted; "In Lease" / "About Call with Ahmed" 12 / 500 soft; a 9 px cross in a 22 px box (agent.tsx:2723-2765, 4903-4916; i18n.ts:2388-2389).
- Staged photos sit INSIDE the field above the text: a sideways row (gap 8, padding 8 / 8 / 4) of 64 x 64 thumbnails, radius 11, each with an 18 px remove disc rgba(10,10,10,0.78) at top 4 / right 4 holding a 7 px cross (agent.tsx:2814-2846, 4959-4978).
- Attached files sit INSIDE the field above the text: row gap 8, paddingHorizontal 8, paddingTop 8: a 24 px progress ring (2 px stroke, fg, danger on failure) around `Doc` 11 in the file tint (a `Check` 10 when ready); name 13 fg; stage line 11 faint "PDF · Uploading…", "PDF · Reading it…", "PDF · Ready. Ask about it", "PDF · Failed. Remove it and try again" (danger); a 22 px #262625 remove disc with a 9 px cross (components/doc-chip.tsx:34-166; i18n.ts:2297-2300). The send disc drops to 55% opacity while a file is still being read (agent.tsx:5135).
- Voice input (tap the disc with an empty field): the row inside the field becomes the dictation bar, 40 tall, paddingHorizontal 4, gap 8 (components/dictation-bar.tsx:21-130):
  1. Cancel: 34 px disc, bg #262625, `Cross` 13 fg (hidden while the words are being made).
  2. Clock: 12 muted, tabular, min width 30, "0:04"; turns #C4574F in the last 30 s of the 10 minute limit.
  3. Live waveform: flex (about 169 px), 22 tall; 22 bars, 2.5 wide, round ends, colour fg; opacity ramps from 0.32 (left, oldest) to 1 (right, newest); height = 2.5 + level x 19.5; a new sample every 55 ms scrolls the bars left; silence = 2.5 px dots (components/waveform.tsx:38-69, 101-118; dictation-bar.tsx:50-58).
  4. Stop into field: 34 px disc #262625 with a 13 x 13 fg square, radius 3.5 (becomes a 15 px muted spinner while transcribing).
  5. Send: 34 px white disc with `ArrowUp` 13 #0A0A0A (40% while transcribing).
- The plus opens a sheet of plain `SheetRow`s, no icons (agent.tsx:2963-3020; i18n.ts:476-477, 2292, 2391-2393, 2719): "Take photo", "Choose from library", "Attach a file", "About a recording", "About a folder", ("Everything" only when aimed), "What Krovvi can do".
- "What Krovvi can do" opens a sheet: header 13 faint "What Krovvi can do"; 14 rows (paddingHorizontal 12, paddingVertical 12, gap 3, hairlines between): label 16 / 400 / -0.3 fg, example 13.5 soft lh 19 (agent.tsx:3038-3071, 4982-4997; i18n.ts:2723-2780). First rows: "Answers from everything you ever said" / "What am I actually working on these days?"; "Thinks out loud with you" / "Help me think through the shop idea, and push back where I am wrong"; "Turns talk into real work" / "Write this week up as a plan I can act on"; "Reads and sends your email" / "Find the lease contract in my email and summarize it"; "Runs your calendar" / "What does my week look like? Put the dentist in Thursday 5pm".

Failure line (above the composer): bg #161615, radius 11, paddingVertical 12, paddingLeft 16, paddingRight 12, marginHorizontal 20, marginBottom 8; text 14 muted; a "Try again" pill 30 tall (bg #1F1F1E, `Retry` 12 fg + 13 / 500 fg) (agent.tsx:2666-2699, 5063-5085). Example: "The AI Krovvi uses is busy right now. Try again in a minute." (i18n.ts:2558).

Jump-to-newest disc (when scrolled up): 36 px circle, bg #1F1F1E, 1 px border #262625, a down chevron 11 fg; centred, bottom edge at y 710 (agent.tsx:2634-2662, 5050-5061).

### 1h. The empty chat (first open)

Only the wordmark and three lines, nothing else (agent.tsx:4228-4400, 4882-4929):
- No K in the nav (it is hidden until the first message); nav glyphs as in 1a; composer as in 1g with the placeholder "Ask, or give it a job".
- Group centred in the thread area (flex 1, paddingBottom 32): the empty view is 631 - 24 (list bottom padding) - 16 (gap before the empty footer) = 591 tall from y 111, so the group's centre sits at about y 391 (agent.tsx:4701, 4885).
- Dotted wordmark "krovvi" at pitch 8 (155.2 x 43.2 px, 6.5 px dots, fg), marginBottom 40.
- Three lines, gap 26, each a tap target (maxWidth 300, paddingVertical 4, paddingHorizontal 8): text 17 / 500 / -0.3, line height 22, centred, fg. No pills, no borders, no cards.
- When the library knows things, the lines are the person's own, each with a receipt line under it in 12 faint, marginTop 6 (lib/starter-text.ts; i18n.ts:3248-3261). Examples: "What did Ahmed and I settle on Tuesday?" / "Ahmed · Tuesday · 12 min"; "What did we decide about the shop lease?" / "Yesterday · 34 min"; "What is still open from Pricing for Q4?" / "Monday · 21 min". These send on tap.
- Otherwise three plain lines from this pool, rotated by the day (on 1 October 2026 the first three): "Go through everything and tell me what I am actually working on", "What's still open and needs a decision?", "Write me a plan for the next two weeks", "Who am I waiting on, and since when?", "Prep me for tomorrow. What should I walk in knowing?", "My money with people. Who owes what?", "Remind me Thursday at 5 to call the broker", "Summarize this week into one honest page", "Search my email for the contract and check it against what was said" (i18n.ts:2364-2374). These fill the field instead of sending.
- Aimed at a folder or recording: "EARLIER HERE" (12 faint, uppercase, letterSpacing 1.1) and up to two past chats (title 15 soft, time 12 faint), marginTop 32 (agent.tsx:4375-4397, 4919-4929).
- The lines fade and rise 4 px in over 240 ms once known (agent.tsx:4322-4329).
- New installs do not start here: after sign-in they go through the welcome (`app/hello.tsx`) and then Home.

### 1i. Past conversations page (the `Past` glyph) (components/chat-history.tsx:490-1194)

Full-screen overlay, #0A0A0A, paddingTop 59, fades and rises 10 px in. Nav: "Conversations" 20 / 600 / -0.6 with "12 conversations" 12 faint under it; a "New" pill (30 tall, #1F1F1E, `Plus` 11 + "New" 12 / 500); a 34 px #161615 close disc with `Cross` 12 muted. Search field "Search your conversations"; lens chips 30 tall (#161615, on = #262625): "All", "Wrote something", "In folders", "Recordings" with counts. Rows: #161615 cards radius 17, padding 10 / 14, gap 8: title 16 / 500 / -0.3 lh 22 (600 + a 7 px white dot when unread; an 11 px spinner when working), last reply 14 soft one line, meta 12 faint "Working  ·  2:14 pm  ·  In Lease  ·  wrote a note". Shelves "WORKING NOW", "STANDING" 11 faint uppercase. Foot "Hold a conversation to rename or repeat it" (i18n.ts:3265-3326).

### 1j. "Which voice is you?" card (components/voice-ask.tsx)

Not part of the chat screen: it shows on Home's card deck, the People page and a recording's page, after a recording with two or more numbered voices (voice-ask.tsx:27-39). Look (voice-ask.tsx:327-395; i18n.ts:1459-1477):
- Card #161615, radius 22, paddingHorizontal 18, paddingTop 18, paddingBottom 12, gap 12.
- Kind row: a 6 px muted dot + "Your voice" 12.5 / 500 muted.
- Question "Which voice is you?" 19 / 500 / -0.35, lh 27, fg; under it "So what you said, including your own tasks, lands on your card." 13.5 muted lh 19; "In {recording title} · Yesterday" 12 faint.
- One row per voice (gap 8): a pick box (min 52 tall, radius 14, #1F1F1E, padding 8 / 14, gap 11) holding an 8 px dot in the voice tint, the name 13 / 600 in that tint ("Speaker 1" #E6DCC8, "Speaker 2" #C98A62, "Speaker 3" #B0A89D; components/timed-transcript.tsx:79-91), and the clearest quote in curly quotes 14.5 fg lh 20; beside it a 40 px #1F1F1E play disc with a 9 x 12 fg triangle.
- "I'm not in this one" 14.5 / 500 soft, centred, 44 tall.
- Foot: "Stop asking" (left) and "Later" (right), 13 faint.
- After a pick (when offered): "Speaker 2 is you." with "Change", the line "Keep a voice sample of you so Krovvi knows your voice next time? Only yours. Delete it any time in Settings.", and "Not now" / a white "Keep" pill (40 tall, min 88 wide, 15 / 600).

### 1k. How to draw the chat (393 x 852)

**State A, empty chat**
1. Fill #0A0A0A. Status bar 0-59 is iOS's own (light content).
2. Nav: `Past` 24 px #8F8F8A centred at (301, 79); `Cross` 15 px #8F8F8A (stroke 1.7) centred at (353, 79). No K, no title.
3. The wordmark "krovvi" (pitch 8, 155.2 x 43.2, dots 6.5, #EDEDEB) centred horizontally, 40 px above three centred lines (17 / 500 / -0.3, lh 22, #EDEDEB, max 284 px of text, 26 px apart, each with 4 px top and bottom padding; personal lines add a 12 px #7A7A74 receipt 6 px under). Centre the whole group at y ≈ 391.
4. Composer field (20, 750) to (373, 802): radius 26, #1F1F1E, 0.5 px #262625 border. `Plus` 16 px #8F8F8A centred at (43, 776). Placeholder "Ask, or give it a job" 16 px #7A7A74, text starting at x 76, line box 766-786. Send disc centred at (350, 776), 34 px, #EDEDEB, with the dot mic 17 px in #0A0A0A.
5. Nothing below the field: 50 px of ground (34 home-indicator area + 16).

**State B, an answered question**
1. Nav as above plus the K mark 22 px #EDEDEB at x 20-42, y 69-91.
2. User bubble from y 111, right edge x 373, max 287.8 wide, #1F1F1E, corners 17 / 17 / 6 (bottom-right) / 17, padding 10 / 14, text 15 px #EDEDEB.
3. 16 px gap, then the answer at x 20-373: 16 / 27.2 #EDEDEB, paragraphs 12 apart, drawn 5 px #8F8F8A bullets, bold = 600. Receipt pills inline after the claims they back.
4. Under the last line (12 + 8 = 20 px): found line ("Searched your notes · 6 s", 12.5 #7A7A74 with 11 px step icons), then 20 px to the sources line (22 px mark stack + "3 sources"), then 16 px to the memory chip (#161615 box, radius 11), then 8 px to the four action icons (14 px #7A7A74 at x 35 / 81 / 127 / 173).
5. A draft card, when one waits, sits just above the composer (x 20-373, #161615, radius 17) with the white "Send it" pill.
6. Composer as in state A.

**State C, thinking**: question at y 123 (pinned 12 px below the thread top); 24 px below the bubble (gap 16 + marginTop 4 + padding 4), the live row, 26 tall: 13 px arc spinner (#8F8F8A) or the tool icon 16 px, "Searching your notes…" 13 px #EDEDEB with the light sweep, "0:07" 12 px #7A7A74 at the right edge (x 373); the send disc shows an 11 px #0A0A0A square.

**CSS starter**
```css
:root{--bg:#0A0A0A;--surface:#161615;--surface-hi:#1F1F1E;--line:#262625;--fg:#EDEDEB;--soft:#A9A8A2;--muted:#8F8F8A;--faint:#7A7A74;--danger:#C4574F;--ease:cubic-bezier(.23,1,.32,1)}
.screen{background:var(--bg);font-family:-apple-system,"SF Pro Text",system-ui,sans-serif;color:var(--fg)}
.thread{padding:0 20px 24px;display:flex;flex-direction:column;gap:16px}
.bubble{align-self:flex-end;max-width:287.8px;background:var(--surface-hi);border-radius:17px 17px 6px 17px;padding:10px 14px;font-size:15px;letter-spacing:-.15px}
.answer p{font-size:16px;line-height:27.2px;letter-spacing:-.2px;margin:0 0 12px}
.answer strong{font-weight:600}
.answer li{display:flex;gap:12px;margin-bottom:8px}
.answer li::before{content:"";flex:none;width:5px;height:5px;border-radius:50%;background:var(--muted);margin:11.1px 0 0 3px}
.pill{display:inline-flex;align-items:center;gap:5px;height:20px;padding:0 8px 0 4px;border-radius:10px;background:var(--surface-hi);max-width:220px;vertical-align:middle}
.pill .play{width:0;height:0;border-top:4px solid transparent;border-bottom:4px solid transparent;border-left:6.5px solid var(--soft);margin:0 1px 0 3px}
.pill .title{font-size:12px;font-weight:500;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pill .clock{font-size:11px;color:var(--faint);font-variant-numeric:tabular-nums}
.field{margin:0 20px;border-radius:26px;background:var(--surface-hi);border:.5px solid var(--line);padding:6px;display:flex;align-items:flex-end;gap:8px}
.field input{flex:1;font-size:16px;line-height:20px;letter-spacing:-.15px;padding:10px 8px;background:none;border:0;color:var(--fg)}
.field input::placeholder{color:var(--faint)}
.disc{flex:none;width:34px;height:34px;border-radius:17px;background:var(--fg);margin-bottom:3px;display:grid;place-items:center}
.status{font-size:13px;color:var(--fg)} .clock{font-size:12px;color:var(--faint);font-variant-numeric:tabular-nums}
```

---

## 2. Sharing into Krovvi from another app

"About" means a value estimated from SF Pro line heights; the code does not set it.

### 2.1 Which entry point iOS uses
- expo-share-intent is OFF on iOS (`"disableIOS": true` in app.json); it serves Android only (`*/*` filters). iOS uses Krovvi's own share extension, `targets/share` (targets/share/expo-target.config.js:10-11).
- Name in the share sheet: "Krovvi" with the app icon (expo-target.config.js:18).
- Accepts: text, up to 5 web URLs, 1 web page, up to 20 images, 1 movie, up to 20 files (targets/share/Info.plist:11-22).
- A "Save to Krovvi" App Intent writes to the same inbox with no UI except Siri's words: "Saved to Krovvi." / "Saved N to Krovvi." / "Nothing to save." / "Krovvi could not save that." (plugins/with-record-intent.js:92, 121). It appears in Shortcuts, Siri and the Action button.

### 2.2 What the person sees inside WhatsApp, Files, Photos or Safari
The extension never opens Krovvi (expo-target.config.js:8). Every kind of item (WhatsApp export zip, PDF, photo, link) gets the SAME small card; nothing about the item is shown (targets/share/ShareViewController.swift):
- Backdrop: black at alpha 0.001, so the sending app stays fully visible (:24).
- Card: one centred card, #161615 (RGB 0.086, 0.086, 0.082), corner radius 18 (continuous curve), min width 200, padding 18 top and bottom, 24 left and right (:33-35, 49-53). About 200 x 55, centred at (196.5, 426).
- Label: "Saving to Krovvi…", system font 16 medium, #EDEDEB, centred (:40-43). The card fades in over 0.18 s (:55).
- End: the text becomes "Saved to Krovvi" (one item), "Saved N to Krovvi" (several) or "Nothing to save"; it holds 0.7 s, fades out over 0.16 s and the share sheet closes (:162-166). It gives up waiting after 8 s (:80).
- Each item is written as a folder with an item.json into the App Group inbox `Library/Caches/krovvi-inbox`: images, movies, audio, PDFs, file URLs and data as files; other URLs as links; plain text as text (:60-65, 89-155; lib/inbox.ts:16).

### 2.3 When Krovvi is next in front (Home drains the inbox on focus) (index.tsx:1155-1174, 1430-1464)

| shared item | what happens | what the person sees |
|---|---|---|
| Link | saved as a link note (index.tsx:1439-1441, 1366-1386) | list resets to All at the top; toast "Saved. Reading the page." (i18n.ts:275) |
| Text with a URL and under 40 other characters | saved as a link; the other words kept (:1443-1444) | same toast |
| Other text | a written note (:1445, 1389-1401) | toast "Saved." (i18n.ts:276) |
| One file | ingestFile: the note row is made on the phone first (:1455, 1638-1709) | a new card at the top of TODAY; no toast on success |
| Several files | runBatch (:1456, 1504-1600) | the import pill (2.5), then one toast |
| A file Krovvi cannot read | dropped from the inbox silently (:1450) | nothing |

How a file's kind is decided (lib/import.ts:116-126): `.zip` = chat (this is how a WhatsApp "Export Chat" arrives); `.txt` named whatsapp / `_chat` / "chat with" = chat; `.json` named conversations / result / export / chat = chat; pdf, doc(x), ppt(x), key, xls(x), csv, txt, md, eml, epub, html = document; jpg, png, heic… = photo; mov, m4v, webm, mp4 = video; m4a, mp3, wav, opus, ogg… = voice recording.

Toasts on the file path: "Already in your library. Same file, same note." (i18n.ts:383); "Couldn't add that file. Tap the note to retry." (:385); "Could not transcribe. Tap the note to retry." (:396, also used for documents and chats); "No connection right now. Your recording is saved and will transcribe when you're back online." (:397); batch end "N files added." / "N added, M need(s) another look." / "Stopped. N added." (:295-298).

### 2.4 The toast (components/toast.tsx:20-65)
- Toast layer bottom = 34 + 100 = 134 (lib/record/recorder-context.tsx:118, 126); with the toast's 12 margin, the pill's bottom edge is at y 706.
- Pill #1F1F1E, radius 999, padding 10 / 16, max width 88% (345.8); text 14 / 400 / -0.15 #EDEDEB centred; about 37 tall.
- Rises 14 and fades in over 240 ms, stays 2600 ms, fades out over 180 ms.

### 2.5 The import pill (several files at once) (components/import-bar.tsx)
- Absolute at top 59 + 2 = 61, centred, zIndex 40 (:96, 130); Home's content moves down 36 while it shows (index.tsx:2819; lib/record/live.ts:67).
- Pill: row, gap 8, height 28, max width 88%, padding 0 12, radius 999, #1F1F1E, hairline #262625 (:131-145).
- Meter: the pill's own ground fills from the leading edge in #262625, width = done / total, eased over 240 ms (:72-76, 147).
- Dot: 7 x 7 #EDEDEB, resting at opacity 0.45, flashing to 1 at scale 1.3 as each item lands (:81-89, 149).
- Text "Adding your files, 3 of 12" 13 / 600 / -0.2 #EDEDEB tabular (i18n.ts:292; :150); failures add " · 2 failed" 12 / 500 #C4574F (i18n.ts:293; :105-109, 151).
- Stop: `Cross` 10 #8F8F8A, weight 1.7 (:122).

### 2.6 The new card in the Home list
Lands at the top under TODAY (a WhatsApp chat is dated by its last message, so it can land under an earlier day).
- Card base: #161615, radius 17, padding 10 / 14, 361 wide (components/note-card.tsx:410-415; index.tsx:4014-4018).
- While it is sent and read (note-card.tsx:67, 135-136): no title yet for a shared file; stage line = stage words 12 #7A7A74 + detail 12 #8F8F8A tabular, gap 8 (:436-439); progress lane marginTop 4, height 3, radius 1.5, track #1F1F1E with a hairline #262625, fill #EDEDEB from the leading edge (components/progress-lane.tsx:38-68); meta row marginTop 4, minHeight 18, gap 6: the kind glyph 11 #7A7A74 + 12 #7A7A74 tabular text joined by "  ·  " (note-card.tsx:91-101, 215-224, 442-451).
- Stage words (components/becoming.tsx:92-123; i18n.ts:166-186): "Uploading over your connection…" (detail "34% uploaded"), then "Reading it…" (photo, link, chat, document) or "Watching it…" + "About a minute" (video), then "Summarizing…". When slow: "Taking longer than usual" + "It is safe. Krovvi will finish it." Lane fill: upload 4-34%, read 34-90%, summarize 90-97% (becoming.tsx:45-49).
- Ready card by kind:
  - PDF: `Doc` glyph and "Just now  ·  Document"; title 16 / 500 / -0.3, lh 24, #EDEDEB; preview two lines 14 / 400 / -0.15, #A9A8A2, lh 23.8, marginTop 2; no thumbnail (note-card.tsx:269, 343, 350, 427-433; i18n.ts:384).
  - WhatsApp chat: `Bubble` glyph and "<when>  ·  Chat · WhatsApp"; title = the export's file name without "WhatsApp Chat - ", or "WhatsApp chat with A, B, C" (note-card.tsx:342, 354-357; server/src/lib/read/chats.ts:94, 560).
  - Photo: `Picture` glyph and "Photo"; a 52 x 52 thumbnail (radius 10, #1F1F1E) at top 14 / right 14, text keeps 64 clear on that side (note-card.tsx:186-201, 398-406). Three or more plain photos in a run on one day become one photo group (2.7).
  - Link: `Globe` glyph and the domain; a thumbnail when the page has a picture; a video link wears `Film` and a 10 x 12 #EDEDEB play triangle over its thumbnail (note-card.tsx:195-199, 341, 353, 403-404).
  - Failed: title "Could not read this" / "Could not read the document" / "Waiting for connection" / "Krovvi's server is not answering", two-line hint ("It is kept. Tap to try again."), and a "Try again" chip (28 tall, padding 12, radius 999, #1F1F1E, 12 / 600 #EDEDEB) at the end of the meta row (note-card.tsx:137-180, 225-237, 454-462; i18n.ts:187-212).

### 2.7 Photo group (3+ photos together) (components/photo-cluster.tsx)
- Card #161615, radius 17, padding 10, gap 8 (:229). Head: `Picture` 12 #7A7A74 + "12 photos" 12 #7A7A74, gap 6, padding 0 4, minHeight 20 (:201-217, 231-232; i18n.ts:270).
- Grid: rows of 2 or 3 (rows of 2 on top), up to 9 shown; square cells, 3 px gutters, tiles radius 8, #1F1F1E (lib/library/photo-rows.ts:19-29; :226-243). On 393: two across = 169 px tiles, three across ≈ 111.7.
- A photo still on its way: opacity 0.55 with its own 3 px lane at left 8, right 8, bottom 8 (:103-128, 244). Past nine: the ninth tile shows "+N" 22 / 600 / -0.3 #EDEDEB over rgba(10,10,10,0.5) (:129-133, 246-247).

### 2.8 The page a shared item opens to (components/item-screen.tsx)
Photos, videos, links, chats and documents open ItemScreen, not the recording page (app/note/[id].tsx:906-918): the file, its title, its summary, nothing else (item-screen.tsx:33-53).
- Frame #0A0A0A, top padding 59 (+36 with the live lane) (:337, 546).
- Nav: padding 4 top, 8 bottom, 16 sides. Back: 34 disc #161615 with a left chevron 11 #EDEDEB (nav-back.tsx:33-47). Right, gap 8: an Open disc with `Outward` 12 #EDEDEB (when it can be opened) and a Delete disc with `Trash` 14 #8F8F8A (:341-348, 547-548). On 393: Back x 16-50, y 63-97; Open x 301-335; Trash x 343-377.
- Scroll content gap 16, bottom padding 82 (34 + 48) (:352, 551).
- First block, by kind:
  - PDF: a FileCard (components/file-card.tsx:139-154, 193-243): #161615, radius 17, 361 wide; with a first-page image, a 200 px band on #E9E7E1 (page cropped from the top) with a 72 px veil rgba(22,22,21,0.55) along its bottom; foot row (padding 14, gap 12): file name 15 / 500 / -0.3 lh 20 #EDEDEB (cut in the middle), line 12.5 #7A7A74 "PDF · 12 pages" / "PDF · 2.4 MB", verb "Open" 13 #A9A8A2 (i18n.ts:821, 858, 865). Without a page image: a 52 x 64 tile, radius 10, #1F1F1E, "PDF" 11 / 600, letterSpacing 1, uppercase, with a 4 x 4 #EDEDEB dot at top 8 / right 8 (file-card.tsx:147-153, 269-271).
  - WhatsApp chat: a FileCard with no preview and no verb, not tappable: a round 44 x 44 #1F1F1E seat with `Bubble` 18 #EDEDEB; name "WhatsApp" once read ("Chat" before); line = up to 6 participants ("Mona, Ahmed") or "1,234 messages"; no Open disc; the messages are never printed (item-screen.tsx:40-44, 334, 375; file-card.tsx:172-187, 272; i18n.ts:839).
  - Photo: full 393 width on #161615, the photo's own aspect ratio clamped 0.72-1.5 (default 4:3 = 393 x 294.75); tap opens the full-screen viewer (item-screen.tsx:322, 354-367, 556-557).
  - Link: FileCard with a 16:9 image (361 x 203) then the foot (page title, "nytimes.com · 4 min read", "Open"); without a picture the round seat with `Globe` 18. A video link: 16:9 frame, a centred white 56 disc with `Play` 15 #0A0A0A, a duration pill bottom-right (12 in, rgba(10,10,10,0.72), padding 4 / 9, 12 #EDEDEB tabular), verb "Play" (file-card.tsx:155-171, 209-223, 256-260; i18n.ts:866).
- Then: title 24 / 600 / -0.8, lh 30, #EDEDEB, paddingTop 4 (before a title exists: "Reading the document…", "Reading the chat…", "Reading the photo…", "Reading the page…", "Watching the video…") (item-screen.tsx:408-412, 559-560; i18n.ts:847-855); a reading row with `KThinking` 22 #A9A8A2 + the same words 14 #8F8F8A lh 20, gap 12, padding 8 (:422-428, 562-564); a failed block (#161615, radius 17, padding 14, gap 8: "Could not read this" 16 / 500, a cause line 14 #8F8F8A, a white "Try again" pill) (:433-449, 576-579; i18n.ts:872-874); a duplicate row ("Already in your library" / "You saved this before. Open the first copy.") (:451-461; i18n.ts:832, 870); the summary 16 / 400 / -0.2 #EDEDEB, lh 23.2 Latin or 27.2 Arabic, paragraphs 12 apart, "•" bullets #7A7A74, empty = "Add your own notes…" #7A7A74 (item-screen.tsx:316-319, 590; components/note-body.tsx; i18n.ts:797). Video adds "CHAPTERS" rows and an "Every word" row (:476-525).

### 2.9 "What I caught" (components/understood.tsx)
Where: only on a RECORDING's page, as its first block (app/note/[id].tsx:1067-1079, 1202-1203). Not on the PDF, chat, photo or link pages. A shared WhatsApp voice note or any shared audio file becomes a recording (lib/import.ts:117-118), so it gets this block; shared text becomes a written note, which uses it too.

While the recording is read, its page shows the Upload / Write / Summarize ledger (components/becoming.tsx:177-285): 240 wide, centred, gap 12; finished steps 13 #A9A8A2 with a `Check` 11; the current step 21 / 600 / -0.4, lh 30, #EDEDEB ("Writing it down…") with a 3 px lane and "3 of 12 minutes written" 12 #8F8F8A; later steps 13 #7A7A74.

Layout, top to bottom (understood.tsx:473-648; block gap 12, :1020):
1. Heading "WHAT I CAUGHT": 12 / 400, uppercase, letterSpacing 1.1, #7A7A74 (:475-477, 1022, 1103; i18n.ts:948).
2. Card of lines: #161615, radius 17; rows separated by hairlines #262625 inset 16; row padding 12 top, 10 bottom, 16 sides, gap 6 (:1029-1031).
   - Kind tag above each line: "Task", "Decision", "Money", "Date" 11 / 600, letterSpacing 0.4, #7A7A74, marginBottom -2 (:1079, 1105; i18n.ts:950).
   - Line: 15 / 400 / -0.15 #A9A8A2, lh 21.75 (Latin) or 25.5 (Arabic): a bold lead 600 #EDEDEB, ": " in #8F8F8A, then the words (:909, 919-923, 1032-1034). Sub line 13 #8F8F8A lh 18 (:1035).
   - Foot row (wraps, space-between, minHeight 26): left = a play triangle (6 x 7 #7A7A74) + "12:34" 12 #7A7A74 tabular ("from 12:34" for a chapter start), the due word, and an Undo pill on changes (26 tall, padding 10, #1F1F1E, `Undo` 10 #A9A8A2 + "Undo" 12.5 / 500 #EDEDEB); right = three faint dots (15, #7A7A74) in a 26 x 30 target that open "Right" / "Not right" pills (26 tall, padding 11, #1F1F1E, 12.5 / 500), and "Fix" after Not right (:958-1003, 1037-1058; components/verdict.tsx:67-152; i18n.ts:1616-1617).
   - "N more" row: padding 11 / 16, 13 / 500 #8F8F8A; "Show less" when open (:482-498, 1062-1063).
   - Wording (understood.tsx:255-321; i18n.ts:758-777, 1412, 1423): "You owe Lina: send the contract", "Karim owes you: …", "Karim owes Lina: …" with the due date or "Kept" / "Dropped" / "No date"; "Changed: …" / "Corrected: …" with sub "Was: <old>"; "No longer true: …"; "Two things disagree: …" with sub "Krovvi had: …"; "Closed: <action>" with sub "Karim said “…”" / "You said “…”" / "Sent by mail" / "You marked it done"; facts like "**Karim** is the site manager".
3. The "Which voice is you?" card (1j) when asked for this recording (:503-519).
4. Noticed card: #161615, radius 17, padding 11 / 16, gap 3; "Noticed" 12 / 500 #7A7A74; then 15 #A9A8A2 with a bold lead, e.g. "Moved from 22 Sep to 24 Sep. You owe Lina: send the deck", "Due tomorrow. …" (:674-748, 1080-1082; i18n.ts:951-955).
5. Grew line: a 22 px face + "Karim now has 3 things, 1 task due thursday." 14 #8F8F8A (:756-781, 1083-1084).
6. Offer card: #161615, radius 17, padding 13 / 12 / 16, gap 6; "Want this ready before you see Karim next?" 15.5 / 500 / -0.2 lh 21; "What is open with them comes to you before you meet." 13 #8F8F8A; right-aligned "Not now" 14 / 500 #A9A8A2 and a white "Yes" (min 72 wide, 36 tall, radius 18, 15 / 600) (:848-871, 1085-1093; i18n.ts:965-968).
7. Faces of who was there: wrapping row, gap 18; each seat 52 wide: `PersonFace` 34 + name 11 #7A7A74; "New" 10 / 600 #EDEDEB under a new person; up to 6 (:528-554, 1024-1027).
8. "Still open with Karim: send the deck · call the bank": #161615, radius 17, padding 11 / 16, a 22 px face, 14 #A9A8A2 lh 20 with a bold lead (:561-585, 1065-1066).
9. Waiting row: `KThinking` 14 #8F8F8A + "Reading who was there and what was said…" 13 #8F8F8A (:587-592; i18n.ts:755).
10. Question row: #161615, radius 17, padding 12 / 16; "Krovvi asks" (or "Krovvi is not sure about 3 things here") 12 / 500 #7A7A74; the question 15 #EDEDEB lh 21; an "Answer" pill 30 tall, padding 14, #1F1F1E, 13.5 / 600 (:594-618, 1070-1075; i18n.ts:779, 1528, 1940).
With nothing to show the block draws nothing (:382).

`components/working.tsx` (breathing bars) is not imported anywhere on main, so it never appears.

Possible gap (from the code, not run): the inbox is drained only when Home gains focus (index.tsx:1155-1174), not by the app-foreground handler (index.tsx:2181-2214). If Krovvi sits open on Home in the background while the person shares, the item may wait until Home loses and regains focus or the next cold launch.

## 3. Adding things inside the app

**The only door** is the "+" circle at the top right of Home (index.tsx:1307-1309, 2879-2893). The chat composer's own plus opens the chat's attach sheet (1g), not this one.
- 46 x 46, radius 999, #1F1F1E with a hairline #262625 (index.tsx:3993-4000; glass.tsx:30, 71-76); `Plus` 15 #EDEDEB, weight 1.7 (index.tsx:2890-2892). On 393: x 331-377, y 71-117.

**Sheet** (sheet.tsx; see 0.7): scrim #000 0.6; panel #161615, top corners 22, padding 8 top / 12 sides / 50 bottom.
- Title "Add" (`SheetTitle`): 22 / 600 / -0.8, lh 28, #EDEDEB, padding 6 top, 10 bottom, 14 sides (sheet.tsx:537-538; i18n.ts:233).
- Door rows (`SheetDoor`): row, gap 14, padding 11 / 14, radius 11, about 60 tall; icon box 24 x 24; label 16 / 500 / -0.3, lh 20, #EDEDEB; line under it 12.5 #7A7A74, lh 16, up to 2 lines, gap 2; pressed = #1F1F1E fill at 0.6 and scale 0.985 (sheet.tsx:280-321, 544-555).
- Divider: hairline #262625, 8 above and below, 12 in from each side (sheet.tsx:579-584).
- Foot (`SheetFoot`): 12 #7A7A74, padding 12 top, 4 bottom, 14 sides (sheet.tsx:556).

**Rows in order** (index.tsx:3765-3823; copy i18n.ts:233-247). Every glyph 21 px #EDEDEB, weight 1.6. Capture above the line, paste below.

| # | glyph | label | line under it |
|---|---|---|---|
| 1 | Pencil (leaning, tip down-left, three dots on the baseline) | Write a note | A blank page for your own words |
| 2 | Camera (rounded body, small bump on top, filled lens dot) | Take a photo | Read as soon as it is taken |
| 3 | Picture (rounded frame, sun dot top-right, a hill peak) | Photos and videos | Up to twenty at once, a video up to ten minutes |
| 4 | FileIn (open tray, arrowhead down into it, a dot above) | Choose files | PDF, Word, slides, sheets, email |
| | hairline divider | | |
| 5 | Link (two rounded capsules on the diagonal) | Paste a link | A page is read, a video is watched |
| 6 | TextLines (three dot-and-bar lines, the last bar short) | Paste text | What is on the clipboard becomes a note |

Foot: "From any other app, share to Krovvi." (i18n.ts:247). Glyph code: glyph.tsx:155-215, 1109-1159, 1622-1701, 1728-1765. Total panel height about 528 (8 + 20 + 44 + 240 + 16 + 120 + 30 + 50), so its top edge sits at about y 324.

What each row does: Write opens a blank note page 260 ms after the sheet closes; Take a photo opens the camera; Photos and videos opens the library (up to 20, video exported at 640 x 480); Choose files opens the Files picker; Paste a link opens the link sheet; Paste text saves the clipboard at once with the toast "Saved." or "Nothing on the clipboard." (index.tsx:1252-1415, 2604-2621, 3771-3823; i18n.ts:276-277).

**Link sheet** (index.tsx:3824-3834; components/add-sheets.tsx), riding above the keyboard:
- Header "Save a link" 15 #8F8F8A lh 21 (sheet.tsx:536, 557; i18n.ts:249). Body padding 8 top, 16 sides, gap 12 (add-sheets.tsx:141).
- Preview card: row, gap 12, #161615, radius 17, padding 14 (same as the panel, so its edge does not show); a 38 px #1F1F1E disc with `Globe` 16 (#7A7A74 empty, #EDEDEB once a link reads; `Film` 16 for YouTube, TikTok, Instagram, X, Facebook, Vimeo); title 16 / 500 / -0.3 ("https://" in #7A7A74 when empty, else the domain in #EDEDEB); hint 12 #7A7A74: "A page, a video, a thread, anything with an address" / "Krovvi will read it and keep what it says" / "Krovvi will watch it and keep what it says" (add-sheets.tsx:24, 78-87, 146-149; i18n.ts:250-255).
- Field: #161615, radius 16, padding 0 14; input 14 #EDEDEB, padding 14 vertical, placeholder "https://"; a "Paste" word 12 #A9A8A2 when the clipboard holds a link and the field is empty (add-sheets.tsx:91-121, 154-158).
- "Save": full-width white pill, padding 14, 14 / 600 #0A0A0A, at 35% until the text reads as a link; saving shows "Saved. Reading the page." (add-sheets.tsx:123-135, 160-163).

**Sort sheet** (from Home's Sort circle) (index.tsx:3740-3760): header "Sort by"; rows "Newest first", "Oldest first", "A to Z", "Z to A" (16 / 400 #EDEDEB, minHeight 52) with hairlines between; the current one wears `Check` 12 #EDEDEB (i18n.ts:445-449).

## 4. A person's page (`app/person/[id].tsx`)

Files (basenames in the references below): `app/person/[id].tsx`, `components/person-face.tsx`, `lib/letter-dots.ts`, `components/rhythm.tsx`, `lib/person-brief.ts`, `components/person/{open-with,stand-dates,old-version,matters,open-questions,thinks,done-lists}.tsx`, `components/{promise-line,promise-ring,finished-line,verdict,kept-card,moved-card,sheet,toast,nav-back}.tsx`. Copy from `lib/i18n.ts`.

### 4.1 Screen chrome
- A pushed page (slide from the right, swipe back), no native header, ground #0A0A0A (_layout.tsx:267-274; [id].tsx:1044).
- Top padding = safe top + live lane = 59 (95 with the 36 px lane) ([id].tsx:805; lib/record/live.ts:67, 127-132).
- Nav row: paddingHorizontal 16, paddingTop 4, paddingBottom 8, ends pushed apart ([id].tsx:1047).
  - Back (left): disc 34 x 34, radius 17, #161615, with a chevron "<" 11 px, stroke 1.6, #EDEDEB (nav-back.tsx:47; glyph.tsx:86-118). Label "Back" (i18n.ts:156).
  - Menu (right, once loaded): the same 34 px #161615 disc with three dots 3.5 x 3.5 (radius 2), #EDEDEB, 3 px apart ([id].tsx:1048-1050). Label "More about this card" (i18n.ts:1145).
  - On 393 x 852: both at y 63-97; Back x 16-50, Menu x 343-377.
- Scroll body: starts at y 105, paddingHorizontal 16 ([id].tsx:1054), bottom padding 34 + 32 = 66 ([id].tsx:836). Card column 361 px (x 16-377). No dock, no composer, no tab bar.

### 4.2 Head (who)
Column aligned LEFT (not centred), gap 12, paddingHorizontal 4, paddingTop 4 ([id].tsx:1055). Text starts at x 20.

1. **Face, 68 px** ([id].tsx:839). Never a photo: a #1F1F1E disc with the name's first letter drawn in dots in the person's own colour (person-face.tsx:46-63).
   - Colour: `h = (h*31 + charCode) >>> 0` over the full name, then `voice[h % 6]` (person-face.tsx:23-27). Checked: Sara Nabil #D4B49A, Sara #C98A62, Mona #D4B49A, Karim #B0A89D, Omar #C2A470, Lena #E6DCC8, Hana #8F7864, Ahmed #D4B49A, Hazem #C2A470.
   - Letters: Latin = 5 x 7 dot capitals; Arabic on a Kufi grid with the same 7 rows (letter-dots.ts:22-80).
   - Geometry, face 30 px or larger: pitch = size x 0.56 / 6, dot radius = pitch x 0.37, ink centred on the disc. Under 30 px: pitch = size x 0.64 / 6, radius = pitch x 0.42 (person-face.tsx:31-44).
   - At 68: pitch 6.347, dot radius 2.35 (diameter 4.70). For a 5-wide letter, first column x 21.31, first row y 14.96; ink 30.1 x 42.8.
   - Ready-made "S" at 68 (15 circles, r 2.35): (27.7,15.0) (34.0,15.0) (40.3,15.0) (46.7,15.0) (21.3,21.3) (21.3,27.7) (27.7,34.0) (34.0,34.0) (40.3,34.0) (46.7,40.3) (46.7,46.7) (21.3,53.0) (27.7,53.0) (34.0,53.0) (40.3,53.0).
   - Other alphabets: the plain letter in the tint, SF 600 at size x 0.44 (29.9 at 68) on the same disc (person-face.tsx:49-54, 66-67).
   - On screen: x 20-88, y 109-177.
2. **Name**: 28 / 700, letterSpacing -0.9, #EDEDEB, marginTop 2 ([id].tsx:1057). About y 191-224.
3. **Role line** (if any): Krovvi's story role, or the first live fact with the name taken off ("Sara is head of design at X" becomes "Head of design at X"). 15 / 400, letterSpacing -0.15, #A9A8A2, marginTop -8 (4 px under the name) ([id].tsx:302, 841, 1058; fact-text.ts:23-38).
4. **Aliases** (if any): joined with " · ", 12 px #7A7A74, marginTop -8 ([id].tsx:842, 1059).
5. **Strip** (not on your own card): column, gap 7, full width ([id].tsx:1142-1144).
   - Rhythm: 26 dots, one per week, oldest left, newest right; 7 px dots, 4.6 px gaps, 297 px total ([id].tsx:845; people.ts:594). Inks by level 0-3: #2A2A28, #5A5955, #A9A8A2, #EDEDEB (rhythm.tsx:16).
   - Cap line: 12.5 px, line height 17, #7A7A74 ([id].tsx:1060), parts joined with " · ": "38 talks since March", "last today", "12 emails", "Next meeting 3 Oct" (i18n.ts:1262-1264, 1053). Someone never talked with starts "Came up 3 times" (i18n.ts:1062).
   - Your own card shows instead: "This card is you. Krovvi knows your name when it hears it." (i18n.ts:1143).
   - On screen: dots about y 258-265, cap line about y 272-289.

### 4.3 Action pills
Wrapping row, gap 8, paddingTop 16, paddingHorizontal 4 ([id].tsx:1066); about y 305-341.
- Pill: height 36, radius 18, paddingHorizontal 15, gap 7, #161615; text 14 / 500 #EDEDEB. White pill: #EDEDEB with text 14 / 600 #0A0A0A ([id].tsx:1067-1070).
- In order:
  1. Only when opened from a meeting card: white "Record this meeting" with the dot mic 13 px #0A0A0A (i18n.ts:2803; [id].tsx:855-870).
  2. The white pill: "Ask about {first}" (e.g. "Ask about Sara") led by the small K mark 12 px in #0A0A0A (i18n.ts:1210). Tap opens the chat asking "What's going on with {name}? Where do we stand, and what's open between us?" (i18n.ts:1211). Own card: white "What Krovvi knows" (i18n.ts:982). Public figure: grey "Move to your people" (i18n.ts:1144).
  3. Grey "Add" with a 10 px plus (stroke 1.8) (i18n.ts:1212; [id].tsx:903-915).
- Public cards add: "Someone you hear about. Kept out of your people." 12.5 px #7A7A74 (i18n.ts:1142; [id].tsx:917, 1061).

### 4.4 Card changes with Undo (only after a merge or split)
Rows baseline-aligned, gap 12: words 12.5 px lh 17 #7A7A74 ("Merged with {name} · Monday", "\"{title}\" moved to a card of its own · Today"), and an "Undo" text link 12.5 px #A9A8A2 ([id].tsx:920-943, 1062-1064, 1084; i18n.ts:1158-1159, 1420).

### 4.5 Shared section look
- Label row: baseline-aligned, paddingHorizontal 4, paddingTop 24, paddingBottom 10 ([id].tsx:1081). Heading 13 / 600 #8F8F8A; plain note 12 #7A7A74; tappable note 12.5 #A9A8A2 ([id].tsx:1082-1084).
- Card: #161615, radius 17, clipped; no border, no shadow ([id].tsx:1086).
- Divider: hairline #262625, inset 14 both sides ([id].tsx:1087).
- Line row: top-aligned, gap 11, paddingHorizontal 14, paddingVertical 12 ([id].tsx:1089). One-line row about 44.5 tall; content x 30-363.
  - Mark slot 11 wide ([id].tsx:1115): a solid right-pointing triangle 6 wide x 7 tall, #7A7A74, 7 px down ([id].tsx:1101-1111); invisible (opacity 0) when it cannot play ([id].tsx:1113); or the source kind's glyph at 11 px #8F8F8A, 4 px down (Envelope mail, K chat, Doc document, Camera photo, Link link) ([id].tsx:376, 1116; item-glyph.tsx:6-23).
  - Words: gap 3; main 14.5 px, lh 20.5, letterSpacing -0.1, #EDEDEB ([id].tsx:1090-1091); sub 12.5 px lh 17 #7A7A74 ([id].tsx:1096).
  - Right column (gap 2): day 12 px #7A7A74, 2 px down, tabular ([id].tsx:1098-1099); optional tag 11 / 500, letterSpacing 0.2, #7A7A74: "disputed", "this once", "said as a maybe" ([id].tsx:1100; i18n.ts:1102-1104). A line the owner typed says "you" instead of a day (i18n.ts:1069).
- The person's name is taken off the front of each line ([id].tsx:379). Tap plays the recording at that second (or opens the mail or chat); hold 380 ms opens Correct ([id].tsx:356-368).

### 4.6 Sections, top to bottom (order fixed by person-brief.ts:59; empty ones draw nothing)
1. **"What others said about {first}"** (i18n.ts:1183): only for someone in your circle you never met; max 6 lines with sub "Said by {who}" (person-brief.ts:67, 161-165; i18n.ts:1184).
2. **"Where things stand"** (i18n.ts:1182), note "Hold to fix" (i18n.ts:1228): max 4 lines; decisions, choices and goals first (person-brief.ts:65, 121-154). Optional draft row "Ready to send: {title}" with a 7 px #EDEDEB dot in the mark slot and an 8 px chevron ([id].tsx:440-465, 1125-1126; i18n.ts:1185).
3. **"Dates"** (i18n.ts:2909): max 4 ahead. A triangle (or a 5 px #7A7A74 dot), a when line 12.5 / 600 #8F8F8A tabular ("Website launch · 12 Oct · 3:00 pm"), the text, and "Was 5 Oct" / "Two sources disagree on this" in 12.5 #7A7A74 (stand-dates.tsx:30, 48, 65, 91-94; i18n.ts:2910, 2912).
4. **"{first} has the old version"** (i18n.ts:1190): box padding 14 / 12 / 10, gap 8; sentence like "You told Mona the launch was October 5 (14 Sep). It is now October 12."; two receipts in 12.5 #8F8F8A ("Said 14 Sep", "Now: Karim, Today"); two buttons (min 42 tall, radius 14): white "Tell {first}" and grey "Not needed"; foot "No more of these" (old-version.tsx:255-286; i18n.ts:1191-1204).
5. **"New since you last looked"** (i18n.ts:1186): only after an earlier visit, max 6; head 12 / 500 #7A7A74 ("Updated · Today"; also "New", "No longer true", "Corrected", "Back", "New task", "Date moved", "Done", "Dropped"); "Was: {old}" 13 px lh 18 #A9A8A2; an "Undo" link ([id].tsx:475, 1095, 1119-1123; i18n.ts:1187-1188).
6. **"Between you"** (i18n.ts:1049): open tasks with this person.
   - Optional cards above: "Did it happen?" (#161615, radius 22, padding 18 / 18 / 16, gap 12; a 20 px face + name, the question 19 / 500 lh 27 like "Did you send the deck?", an evidence box on #0A0A0A radius 14, answers min 48 tall radius 14: white "Yes, kept", then "Not yet", "Moved", "Not needed", "Something else"; foot "Not sure" / "Skip") (kept-card.tsx:425-432; i18n.ts:614-616, 652, 1456, 1520, 1523). "Something it depends on moved" card with "Move to {day}" (white), "Ask {first}", "Fine as is", "Another day" (moved-card.tsx:225-324; i18n.ts:624-636).
   - List card. Promise row: paddingHorizontal 14, paddingVertical 12, gap 11 (promise-line.tsx:90). Ring 15 px, 2 px down: open = 1.5 border #8F8F8A; late = #C98A62 border with a 5.1 px #C98A62 dot; over a week late = dashed #C98A62; kept = filled #EDEDEB with a dark check; dropped = #4A4A47 border with a 7.5 x 1.5 bar #6A6A66 (promise-ring.tsx:23-50). Text in body style, up to 3 lines: the doer in bold 600, then ": action", then " for {name}", e.g. "**You**: send the revised deck for Sara", "**Sara**: share the Q4 budget" (promise-line.tsx:67-73, 94, 97; i18n.ts:500, 1136). Right: 12 px #7A7A74 tabular (max 130 wide); late in #C98A62 / 500 ("2 days late", i18n.ts:558); "Today" / "Tomorrow" in #EDEDEB / 500 (promise-line.tsx:100-102; promises.ts:550-559). Optional aside 12.5 lh 17 #A9A8A2 ("Sara asked for more time (Monday)") (open-with.tsx:192-193; i18n.ts:644, 649-651).
7. **"Matters"** (i18n.ts:1257): max 3; rows centred, gap 11, padding 14 / 12; a 12 px receipt slot; name 14.5 / 600 lh 20; newest line in body style (2 lines); meta 12.5 #7A7A74 ("Came up Monday"); 8 px chevron (matters.tsx:331-341; matter-view.ts:107-112; i18n.ts:1258).
8. **"Open questions"** (i18n.ts:1250): padding 14 / 12, gap 6; triangle, the question, meta "From {title}, {day}" 12.5 #7A7A74; when settled, a block 17 px in: "Settled Monday by Karim" 12.5 #A9A8A2, the quote 13.5 lh 19 #A9A8A2, an Undo pill 26 tall #1F1F1E (open-questions.tsx:260-274; i18n.ts:1251-1252).
9. **"Krovvi’s read"** card (curly apostrophe, i18n.ts:1209), no label row: marginTop 18, padding 16, #161615, radius 17; head "Krovvi’s read" 13 / 600 #8F8F8A and "Updated today" 12 #7A7A74; story 15.5 px lh 23, letterSpacing -0.15, #EDEDEB, 8 px below; optional watch line after a hairline (12 px above and below): a 7 px #EDEDEB dot (6 px down), gap 10, text 13.5 lh 19.5 #A9A8A2 ([id].tsx:1072-1079; i18n.ts:1180; person-brief.ts:305).
10. **"What Krovvi thinks"** (i18n.ts:1233): padding 14 / 12 / 10, gap 6; the reading in body style; foot meta 12.5 #7A7A74 ("Supported · Inferred from 3 conversations"); "What it rests on · 3" 12.5 / 500 #8F8F8A with a turning chevron (thinks.tsx:184, 272-285; i18n.ts:1234-1248).
11. **"Done"** and **"Dropped"** (i18n.ts:1217-1218): 5 shown then "Show 3 more" 13 / 500 #8F8F8A; optional first row "Everything you promised Sara since 3 Aug is done (4)." with a "Not this" pill; done rows with the kept ring and "said 14 Sep · done Monday · by the day given · Sara confirmed it"; dropped rows struck through in #8F8F8A (done-lists.tsx:44, 219-231; i18n.ts:1219-1224).
12. **"Decided together"** (i18n.ts:1226): max 3 rows ([id].tsx:638-664).
13. **"Last time"** (i18n.ts:1089), note "Monday · 42 min": title row with the waveform glyph 15 px #8F8F8A in an 18 px column (five columns of 1.6 px dots, 2/4/6/3/4 tall), title 14.5 / 500; then quote rows in #A9A8A2 ([id].tsx:670-709; glyph.tsx:985-1022; i18n.ts:2079).
14. **"What you know"** (i18n.ts:1227; own card "Where you stand", i18n.ts:1106), note "Hold to fix": remaining live lines (person-brief.ts:321-324).
15. **"Together"** (i18n.ts:1091): 5 rows, link note "See all 12" / "Show less" (i18n.ts:1229-1230); each row: waveform glyph, recording title (one line), sub `talked · “We can move it to the 12th”` ("talked", "mentioned", "met"), day at right ([id].tsx:724-776; i18n.ts:1129-1131).
16. **"Used to be · 2"** fold (i18n.ts:1231): text 13 #7A7A74 with a 9 px chevron; open rows #8F8F8A with "Now: {new}" and "until {day}" ([id].tsx:779-799, 1129-1130; i18n.ts:1067, 1105).

### 4.7 Loading, missing, little known
- Loading: the K loader at 30 px, fg, centred, 32 px below the nav ([id].tsx:829-832, 1051); dots 4 px, centres (10,7) (10,15) (10,23) (15.25,11.25) (20.5,7.5) (15.25,18.75) (20.5,22.5). Waits up to 2.5 s for the summary ([id].tsx:93).
- Missing: "This card is gone." 14 px #8F8F8A, padding 24, centred ([id].tsx:834, 1052; i18n.ts:1075).
- Little known: no special empty state; head, pills, and whatever sections have rows (e.g. face, name, "Came up 1 time · last today", pills, one "Together" row).

### 4.8 Sheets and toasts from this page
- Sheet look: see 0.7. Input field #1F1F1E radius 16, 16 px text; submit pill #EDEDEB, padding 10 / 18, 14 / 600 #0A0A0A, 40% when empty (sheet.tsx:586-602).
- Menu (⋯): header = the name; rows "This is me", "A public figure", "Same person as…", divider, "Not a person" (red). Public card: "Someone I know". Own card: "This is not me", "Same person as…" ([id].tsx:965-977; i18n.ts:1146-1151).
- Same person as: search "Search your people"; rows with a 30 px face + name, padding 10, gap 12, list max 320 tall ([id].tsx:979-1001, 1132-1135; i18n.ts:1152-1153).
- Add: "Tell Krovvi about {first}", placeholder "e.g. my partner at the company", "Save" (i18n.ts:1213, 1072, 1070).
- Correct (hold a line): "Not right?", placeholder "What is true instead (optional)", "Save the correction", then red "It was never true" (i18n.ts:1097-1100).
- Not this person (hold a Together row): "Not {name} in this recording?" with red "Not this person" (i18n.ts:1154-1155).
- Toast: centred pill #1F1F1E, padding 10 / 16, max 88% wide, 14 px #EDEDEB, 12 px above the bottom, rises 14 px, stays 2.6 s (toast.tsx:20, 40, 56-65). E.g. "Keeping it. It shows here in a moment.", "Corrected. Krovvi will not use it again." (i18n.ts:1071, 1101).

### 4.9 How to draw a typical person ("Sara Nabil")
1. 393 x 852 on #0A0A0A, light status bar (59).
2. Nav: Back disc at (16,63) 34 x 34 #161615 with an 11 px "<" (1.6, #EDEDEB); ⋯ disc at (343,63) with three 3.5 px dots, 3 apart.
3. Face at (20,109), 68 px: #1F1F1E disc, the 15-dot "S" above in #D4B49A.
4. "Sara Nabil" at y ≈ 191 (28 / 700 / -0.9 #EDEDEB); "Head of design at Vodafone" under it (15 #A9A8A2).
5. 26 rhythm dots (7 px, 4.6 gaps) at y ≈ 258, brighter toward the right; "38 talks since March · last today · 12 emails" (12.5 #7A7A74).
6. Pills at y ≈ 305: white "Ask about Sara" with the 12 px dark K, grey "+ Add".
7. "Where things stand" / "Hold to fix" label at y ≈ 365; card from y ≈ 391 (x 16-377): three line rows (triangle, 14.5 / 20.5 text, "Monday" / "14 Sep" / "Today"), hairlines inset 14.
8. "Between you": open ring "**You**: send the revised deck for Sara" / "Thursday"; late ring "**Sara**: share the Q4 budget" / "2 days late" in #C98A62.
9. "Krovvi’s read" card, then "What Krovvi thinks", "Last time", "Together" as above. The first screen ends around the read card.

## 5. The home screen (`app/index.tsx`)

### 5.1 Frame
- Ground #0A0A0A (:3976), light status bar. No header, no title, no greeting (:2824-2828).
- Content starts at y 59; it moves down 36 while a recording, meeting, making or import pill uses the lane (:2819).

### 5.2 Top row (y 71-117)
- Row: marginTop 12, 16 at the sides, gap 8 (:3982-3988).
- Search capsule (components/search-field.tsx:136-198): height 46, radius 16, #1F1F1E, hairline #262625, padding 0 14, gap 10; `Search` 15 (#7A7A74 empty, #8F8F8A with text); text 14 / 400 / -0.15 #EDEDEB; placeholder #7A7A74 "Search everything you've said" (i18n.ts:225; screens 390 wide or more get the full text, index.tsx:370, 2840); inside a folder "Search in <folder>"; a clear button once typed (17 px #7A7A74 disc with `Cross` 9 #0A0A0A).
- Sort circle: 46 x 46, same flat ground, `Sort` 15 #8F8F8A (three left-aligned bars at 100 / 66 / 33%); only when the library has notes (index.tsx:2854-2877; glyph.tsx:516-524).
- Plus circle: section 3.
- Horizontal positions: with notes, capsule 16-269 (253 wide), Sort 277-323, Plus 331-377. New account: capsule 16-323 (307 wide), Plus 331-377.

### 5.3 Lens row (y 123-167)
- Shown when there is anything to pick; hidden while a search is typed (index.tsx:2790, 2903).
- Horizontal scroll, marginTop 6; items 44 tall, padding 0 8, gap 10; first word at x 16 (components/lens-row.tsx:182-192).
- Words 15 / 500 / -0.2 #8F8F8A; the selected word #EDEDEB with a 5 x 5 #EDEDEB dot 8 below it, centred (fades and grows in over 120 ms); count after the word 12 #7A7A74 tabular (lens-row.tsx:145-169, 195-210).
- Order: "All", "Folders" (with `Folder` 13 and a count), then only the kinds the library holds, with counts: "Photos", "Recordings", "Files", "Links", "Video", "Chats", "Written" (index.tsx:222-231, 2350-2364; i18n.ts:259-266). A 40 px fade into #0A0A0A covers the right edge when more lenses are off screen (lens-row.tsx:175, 185-187).

### 5.4 List (from y 167)
- FlashList, padding 12 top, 16 sides, 150 bottom; rows 8 apart; cards 361 wide; pull to refresh tint #8F8F8A (index.tsx:339-342, 2958, 4014-4020).
- Header stack (each conditional, index.tsx:2959-3297):
  1. AI-paused notice: off since 2026-10-01 (ai-paused.tsx:18).
  2. Recent searches (only with the field focused and empty).
  3. The ask stack (padding 12 top, 16 between cards, :4100):
     - Morning capsule: pill, #161615, hairline #262625, padding 12 / 16, marginBottom 12; one line 14 / 600 #EDEDEB "Yesterday: <headline>" or "Yesterday, told back: 3 recordings"; `ChevronRight` 8 #7A7A74 (:2985-3004, 4032-4045; i18n.ts:2093, 2157).
     - The deck (hidden inside a search or a folder): one card whole on top, the next two as plates beneath. Head line 26 tall: the card's label 13 / 500 #7A7A74 ("Krovvi is asking", "About you", "Your Google", "Your day", "ChatGPT and Claude", "Two things disagree") and "N more" 12.5 / 500 #8F8F8A at the right. Plates inset 10 and 20 each side, showing 30 and 10 below the top card, colours #121211 and #0E0E0D, radius 22; the first plate shows the next card's line 12.5 #7A7A74 (components/deck.tsx:81-87, 360-381, 427-494).
     - Offer card: #161615, radius 22, padding 14 / 12 / 18, gap 10; title 17 / 500 / -0.3 lh 24; body 14.5 #8F8F8A lh 21; pills 34 tall, padding 13 (main white with 13.5 / 500 #0A0A0A text, other #1F1F1E) (components/welcome-card.tsx:77-99).
     - Question card: same ground, padding 18 / 18 / 12; a dot or a 20 px face + the kind 12.5 / 500 #8F8F8A; question 19 / 500 / -0.35 lh 27; reason 13.5 #8F8F8A; a quote block on #0A0A0A radius 14; answer rows 48 tall, radius 14, #1F1F1E (white when picked) (components/krovvi-asks.tsx:645-735).
  4. Noted / Closed / Filed lines: #161615, radius 17, 16 in from each side (components/suggestion.tsx:150-168).
  5. Inside a folder: the folder name 20 / 600 / -0.6, an "Add" pill (24 tall, #1F1F1E, `Plus` 9 + 12 / 500), a 22 px #7A7A74 exit disc with `Cross` 9 #0A0A0A (index.tsx:3242-3295, 4058-4088).
- Rows:
  - Shelf labels "PINNED", "TODAY", "YESTERDAY", "LAST 7 DAYS", "LAST 30 DAYS", then months ("AUGUST 2025"): 11 / 400 #7A7A74, uppercase, letterSpacing 1, padding 8 top / 2 bottom / 4 sides (index.tsx:4105-4113, 4300; lib/format.ts:142-156).
  - Note cards (2.6). A ready recording's meta reads "10:40 pm  ·  4:12"; recordings and written notes wear no kind glyph. A full card is about 116 tall; a short "compact" take shows no preview, about 66 tall (index.tsx:2427). Pinned: #1F1F1E with a hairline and `Pin` 13 #A9A8A2 at the end of the meta row (note-card.tsx:238-240, 419-423).
  - First card position with no deck: shelf label at about y 207, first card at about y 230.
  - Footer hint (only with 1-3 notes, after the first recording): "Hold a note for folders and sharing. Swipe it to file or delete it." 12 #7A7A74 centred (index.tsx:3330-3331, 4115-4121; i18n.ts:335).
- Empty and waiting states, centred, 96 above, 24 sides, gap 12 (index.tsx:3303-3318, 4123):
  - Not read yet: `KThinking` 30 (:3921-3927).
  - New account: "Press and talk" 20 / 600 / -0.6 #EDEDEB; "Anything on your mind. Krovvi writes it down and notes what you promised. Hold the button to type instead." 14 / 400 #8F8F8A lh 22 (:4124-4125; i18n.ts:344-346). With no lens row, the title's top is at about y 245.
  - Load failed: "Your notes did not load" / "Check your connection. Anything you record now is kept on this phone and sent when you are back online." / a "Try again" pill (min 44 tall, padding 24, #1F1F1E, 14 / 500) (:3934-3953, 4128-4137; i18n.ts:374-375).
  - Search finds nothing: "Nothing found" / "Try a different word. Arabic matches with or without the hamza." (i18n.ts:340-341).

### 5.5 Dock (verified: index.tsx:257-258, 3510-3660, 4189-4291)
- Absolute at the bottom; the list scrolls under it; nothing is painted behind it except the bar (index.tsx:3491, 4189).
- Island: 12 in from each side, marginBottom max(34 - 10, 8) = 24 (:3518, 4193). Its box is 104 tall: the 66 bar + 38 of room for the floating button (BAR_H 66, NOTCH 76; :257-258, 4195).
- Bar: 369 x 66, radius 30, #1F1F1E, hairline #262625 (:4196-4209). On screen x 12-381, y 762-828.
- Doors: two each side of an 88 px gap held for the record button (NOTCH + 12, :4232); each side 140.5 wide, doors spread evenly (:4222-4227). Each door: icon over label, gap 4, padding 8 vertical, min width 56 (:4228). Icons 19 #8F8F8A in a 19 x 19 slot; labels 11 / 500, letterSpacing 0.1, #8F8F8A (:4231-4233).
  - Left: "Memory" (`Memory` brain with a centre dot; opens /memory) and "Tasks" (`Loop`: six dots on a ring, the 10 o'clock dot at 0.3 while anything is owed, whole when nothing is; opens /promises) (:3539-3580; glyph.tsx:1281-1296, 1955-1986).
  - Right: "Krovvi" (the seven-dot K; opens the chat, scoped to the folder when inside one) and "Settings" (`Sliders`: two rails with filled knobs, weight 1.6) (:3590-3658; glyph.tsx:46-83, 576-608).
  - Labels: i18n.ts:284, 287, 547, 977. (The comment at index.tsx:3514-3516 still says "Write" and "Chat"; the code draws Memory and Krovvi.)
  - Approximate door centres: Memory x 49.5, Tasks x 115, Krovvi x 278, Settings x 343.5; icons about y 777-796, labels about y 800-813.
- Tasks badge: #EDEDEB pill at top -5, left 15 of the icon, height 17, radius 9, width 17 / 23 / 29 for 1 / 2 / 3 characters ("99+" past 99); text 10 / 700 #0A0A0A tabular (:233-236, 3569-3575, 4259-4269).
- Krovvi dot: 7 x 7 #EDEDEB at top -2, right -4 of the K; steady when an answer is unread; fades 1 <-> 0.3 over 1400 ms while an answer is being written (:359-362, 3620-3638, 4235-4243).
- Record button (components/record-button.tsx): slot 9 down inside the island so the button's centre lies on the bar's top edge (index.tsx:4246-4252). A 58 x 58 #EDEDEB disc with two shadows (outer #000 0.5, radius 16, offset 0 10; inner #000 0.4, radius 5, offset 0 3) (record-button.tsx:178-200). Mark: the dot mic 27 px #0A0A0A, weight 1.9 (:25, 161-163). On screen x 167.5-225.5, y 733-791, centre (196.5, 762). Press scale 0.94; holding 350 ms opens Write instead (:149-155). Before the first recording ever: two 70 x 70 1 pt #EDEDEB rings scale 1 -> 1.85 at peak opacity 0.35 and 0.25, 1400 ms a pass, three passes, starting 1.1 s and 1.8 s after load (:65-94, 211-222).
- Slot above the bar (8 above the island, index.tsx:3494-3506, 4190):
  - "Record your first note" card (once, only while the library holds items but no recording): #161615, hairline, radius 17, padding 12 / 24, gap 3, marginBottom 12, centred; five still bars (3 wide; heights 5, 14, 24, 10, 6; gap 3; #EDEDEB); title 16 / 500 / -0.3; "Tap and talk. Krovvi writes it up." 13 #8F8F8A lh 18.85; bottom edge y 704 (components/first-take.tsx:42-147; i18n.ts:350-351).
  - Action Button tip (first days, after a real recording): #161615, hairline, radius 17, 16 in each side; "Action Button · iPhone 15 Pro and later" 12.5 / 500 #8F8F8A; "One press starts a recording: Settings, Action Button, Shortcut, then Krovvi." 14.5 #EDEDEB lh 20; `Cross` 10 (components/action-tip.tsx:92-133; i18n.ts:3557-3558).
- With the search field focused, the dock slides down 170 and fades over 190 ms (index.tsx:2772-2782).

### 5.6 Recording (after tapping the record button)
- Stage: covers Home in #0A0A0A; content centred between y 59 and y 678 (852 - 174) (:3358-3366, 4139-4147). Home behind it fades and shrinks to 0.97 over 240 ms (:2637-2640, 2691-2694).
- Collapse chevron: down (`ChevronRight` 11 #8F8F8A turned 90 deg) in a 44 x 28 target at y 61 (:3381-3397, 4175-4177).
- Timer "0:12": 64 / 200 / -3, lh 70, #EDEDEB, tabular (:3402-3404, 4149-4156).
- Status line in a 22 px slot, crossfading 150 ms: 14 #7A7A74 (#EDEDEB while it hears speech): "Say something…", "Hearing you", "Paused", "Sounds like you're done", "Marked 0:42" (:3408-3443, 4157-4161; i18n.ts:353-363).
- Saved line: 12 #7A7A74 tabular, "Saved on this phone as you go" / "Saved on this phone, sent up to 10:00" (i18n.ts:355-356).
- Marks: tapping anywhere marks a moment; each adds a 6 x 6 #EDEDEB dot to a row, gap 7; until the first mark ever, "Tap anywhere to mark a moment" 13 #7A7A74, 24 below the wave (:3372-3377, 3455-3475, 4163-4172).
- Wave: 345 wide (24 in each side); 54 bars, 3 wide, up to 156 tall, #EDEDEB; opacity 0.32 (left) to 1 (right); a new sample every 55 ms; silence as 3 pt dots (waveform.tsx:26-29, 53, 150-161). About: timer top y 196, wave y 386-542.
- Dock while recording: the bar and four doors fade out; the button grows to 64 with a 21 x 21 stop square (radius 6, #0A0A0A; about 18 visible after scaling) inside a 1 pt #262625 ring about 87 across; Discard (left) and Pause (right) rise 33 to line up: 52 discs, radius 26, #161615; `Cross` 15 #8F8F8A; `Pause` 15 #EDEDEB (or `Play` when held); Discard x 88.5-140.5, Pause x 252.5-304.5, both centred at y 762 (index.tsx:268, 2709-2715, 2765-2768, 3661-3705, 4272-4291; record-button.tsx:30-31, 103-135, 201-210).
- "Done" pill after a silence: white, radius 999, padding 13 / 24, `Check` 12 #0A0A0A (weight 2.2) + "Done" 14 / 600 #0A0A0A (:3871-3908, 4178-4188).
- Stage closed but still recording: a capsule at y 61, 28 tall, on every screen: #1F1F1E with a hairline, padding 12, gap 8; a 7 pt #EDEDEB dot that grows with the voice; the clock 13 / 600 / -0.2; "Paused" / "Waiting for the mic" 12 / 500 #8F8F8A (components/live-pill.tsx:113-136; i18n.ts:3406-3407).

### 5.7 A brand-new account, top to bottom
The search capsule (307 wide) and the Plus circle (no Sort, no lens row); the K loader, then "Press and talk" with its line; the dock with the record button rippling three times. No offers, no questions, no first-take card, no tip (index.tsx:2790, 2805-2808, 2854; lib/home-asks.ts:62-63, 82-84).

## 6. iOS surfaces (app.json plugins, `targets/`, `plugins/with-record-intent.js`, `lib/quick-actions.ts`)

Krovvi ships two app extensions and one Swift file compiled into the app. The share extension "Krovvi" (`targets/share`) is the share-sheet entry (expo-share-intent is off on iOS). A widget extension (`targets/recording-activity`, display name "Krovvi", iOS 16.2+) holds the recording and meeting Live Activities with Dynamic Island, four widgets (Record, Tasks, Next, Ask) and an iOS 18 control. A config plugin adds two App Intents for Siri, Shortcuts, Spotlight and the Action button, and expo-quick-actions adds three long-press icon actions. All share the App Group `group.com.delvnco.catch8` (app.json). Widgets draw on a gradient from #131312 (top left) to #0A0A0A (bottom right) with a 1 pt top line of #EDEDEB at 5%; eyebrows are 11 semibold, tracking 0.8, #8F8F8A (targets/recording-activity/KrovviKit.swift:119-131, 354-365).

- Share sheet: the "Krovvi" icon, then the card "Saving to Krovvi…" -> "Saved to Krovvi" / "Saved N to Krovvi" / "Nothing to save" (2.2).
- Record widget (small, lock-screen circular, inline). Gallery name "سجّل · Record", description "سجّل بضغطة واحدة · One tap starts recording."; opens krovvi://record. Small: K mark 15 #7A7A74 top-left, a 56 white record disc (inner 20), a dot wave in #A9A8A2. Circular: a 44 ring (stroke 2) around a 17 dot. Inline: mic.fill + "Record" (RecordButtonWidget.swift:45-99).
- Tasks widget (small, medium, large, lock rectangular). Gallery "المهام · Tasks", "… · Tick them off without opening the app."; opens krovvi://promises. Header "TASKS" and "4 open" ("4" on small); 3 / 4 / 7 rows: a tickable circle (iOS 17+), the task 13 #EDEDEB, due 10.5 #7A7A74 (#C4574F when late). Empty: a 32 white check disc and "All clear". Lock screen: "TASKS · 4" and two tasks (TasksWidget.swift:112-230).
- Next widget (medium, large, lock rectangular). Gallery "الجاي · Next", "… · Who is next, and what is still open with them."; "NEXT" and "in 25 min"; a 26 face, the name 16 semibold, "· title" 13 #8F8F8A; the last thing said 12.5 #A9A8A2; "Still open: …". Empty: "Nothing booked today", a 34 record disc, "Tap to record instead" (NextWidget.swift:95-232).
- Ask widget (small, medium). Gallery "اسأل · Ask", "… · A real question from your own week, one tap from its answer."; the word Krovvi in dots and a real question from the person's week with its source; empty: "What's on your mind?" (AskWidget.swift:100-141).
- Recording Live Activity (#0A0A0A): lock screen = K mark 20, state word 14.5 semibold ("Recording", "On hold", "Recording paused"), a clock at 32, a 48-bar wave 31 tall; buttons 34 tall, radius 11: "Hold" (#1F1F1E) + "Stop" (white); held: "Resume" (white) + "Stop"; mic taken by a call: "Open Krovvi" with "A call took the microphone. Tap to resume where you left off." Dynamic Island: compact = 5-bar wave left, clock 13 semibold right; minimal = a 9 pt dot (a ring when paused); expanded = K 18, state word, clock 27, wave and the same buttons (RecordingActivity.swift:100-334; i18n.ts:3433-3438).
- Meeting Live Activity: the meeting title, "Krovvi is taking notes" or "Off the record", buttons "Mark" and "Pause" / "Resume" (MeetingActivity.swift).
- iOS 18 control: "Krovvi" with mic.fill for Control Center, the lock-screen corner buttons and the Action button; opens krovvi://record (RecordControl.swift:19-29; Intents.swift:123-133).
- Siri / Shortcuts / Spotlight (with-record-intent.js:24-151): "Record a note" (short title "Record", mic.fill; phrases "Record a note in Krovvi", "Record in Krovvi", "New note in Krovvi" + two Arabic) and "Save to Krovvi" (short title "Save", tray.and.arrow.down.fill; takes text, a link or files; phrases "Save to Krovvi", "Save this to Krovvi" + one Arabic).
- Widget buttons that run without opening the app: "Hold the recording", "Resume the recording", "Stop the recording", "Tick off a task" (Intents.swift:42-110).
- Quick actions (long-press the app icon): "Record" (mic.fill), "Write" (square.and.pencil), "Krovvi" (text.bubble) (lib/quick-actions.ts:30-50; i18n.ts:284-290).
