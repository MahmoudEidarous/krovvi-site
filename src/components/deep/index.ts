/**
 * The Deep kit: today's Krovvi app screens (the night look, chat first),
 * drawn at the app's own numbers for the site's phones. See
 * docs/app-visual-spec-deep.md for every number and where it comes from, and
 * /dev/deep for every piece.
 */

export { C, INK, VOICE, HAIR, RADIUS, EASE, TIME, FACE, ANSWER, FONT, SCREEN, THREAD_SIDE, STAR_ROOM, alpha, tileWash, personTint } from "./tokens";
export { Icon, Check, KrovviK, Mic, ArrowUp, More, ThumbDown, ReactGlyph, K_DOTS, type IconName, type GlyphProps } from "./glyphs";
export { DottedMark, type MarkName } from "./marks";
export { DeepFace } from "./face";
export {
  DeepChat,
  StatusBar,
  TopBar,
  ReadingVeil,
  READING_VEIL,
  Turn,
  KrovviStar,
  STAR_LIGHT,
  KrovviText,
  P,
  B,
  Bullets,
  KrovviBubbles,
  Working,
  KThinking,
  MyBubble,
  DateLine,
  ActionsRow,
  MoveHeader,
  Choices,
  StackLine,
  Composer,
  emo,
  type Piece,
  type Act,
  type MoveKind,
  type Attachment,
} from "./chat";
export { AppsHome, AppTile, SettingsTile, Dock, APPS, type AppId } from "./home";
export { Sheet, SheetTitle, PlusSheet, ShareSheet, ShareTurn, ShareDate } from "./sheets";
export {
  BrickScreen,
  BrickNumber,
  BrickStats,
  BrickRows,
  BrickTable,
  BrickProgress,
  BrickTimeline,
  BrickChecklist,
  Callout,
  Figure,
  Trend,
  COLUMN,
  BRICK_WIDTH,
  SCREEN_GAP,
  type Stat,
  type Small,
  type RowItem,
  type TimelineDay,
} from "./bricks";
export { AppPage, PageGroup, TaskItem, AddItem } from "./page";
export {
  GameHead,
  GameFolded,
  GameQuiet,
  GameBright,
  GAME_PANE,
  TwoTruths,
  ThisOrThat,
  GuessStep,
  GuessWon,
  GuessQuestion,
  Trivia,
  EmojiRiddle,
  GameShelf,
  ThinkingMark,
  type Truth,
  type Pair,
  type PairSide,
  type TriviaQuestion,
  type GameKind,
} from "./games";
export { AskCard, AskStack, AskFold, AnswerBar } from "./asks";
