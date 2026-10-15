/** A trailing emoji stays on the line of the word before it, never alone on a line of its own. */
export function keepEmoji(text: string): string {
  return text.replace(/ (\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)$/u, " $1");
}
