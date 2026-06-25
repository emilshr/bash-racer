export function clampCursor(index: number, typedLength: number): number {
  return Math.max(0, Math.min(index, typedLength));
}

export function findPrevWordStart(text: string, index: number): number {
  if (index <= 0) return 0;
  let i = index - 1;
  while (i > 0 && /\s/.test(text[i]!)) i--;
  while (i > 0 && !/\s/.test(text[i - 1]!)) i--;
  return i;
}

export function getLineBounds(text: string, index: number): { lineStart: number; lineEnd: number } {
  const clamped = Math.max(0, Math.min(index, text.length));
  let lineStart = clamped;
  while (lineStart > 0 && text[lineStart - 1] !== "\n") lineStart--;
  let lineEnd = clamped;
  while (lineEnd < text.length && text[lineEnd] !== "\n") lineEnd++;
  return { lineStart, lineEnd };
}

export function getCurrentLineStart(text: string, index: number): number {
  return getLineBounds(text, index).lineStart;
}

export function getCurrentLineEnd(text: string, index: number): number {
  return getLineBounds(text, index).lineEnd;
}

export function getNextLineStart(text: string, index: number): number {
  const { lineEnd } = getLineBounds(text, index);
  if (lineEnd >= text.length) return text.length;
  return lineEnd + 1;
}

export function clampCursorToLine(
  index: number,
  text: string,
  lineLockIndex: number,
  typedLength: number,
): number {
  const lineEnd = getCurrentLineEnd(text, Math.max(index, lineLockIndex));
  const min = lineLockIndex;
  const max = Math.min(typedLength, lineEnd);
  return Math.max(min, Math.min(index, max));
}

export function getLineColumn(text: string, index: number): { line: number; column: number } {
  const { lineStart } = getLineBounds(text, index);
  return { line: text.slice(0, lineStart).split("\n").length - 1, column: index - lineStart };
}

export function indexFromLineColumn(text: string, line: number, column: number): number {
  const lines = text.split("\n");
  const targetLine = Math.max(0, Math.min(line, lines.length - 1));
  let offset = 0;
  for (let i = 0; i < targetLine; i++) offset += lines[i]!.length + 1;
  const lineLen = lines[targetLine]!.length;
  return offset + Math.min(column, lineLen);
}

export function moveVertical(
  text: string,
  index: number,
  direction: "up" | "down",
  maxIndex: number,
): number {
  const { line, column } = getLineColumn(text, index);
  const targetLine = direction === "up" ? line - 1 : line + 1;
  if (targetLine < 0) return 0;
  const totalLines = text.split("\n").length;
  if (targetLine >= totalLines) return maxIndex;
  return clampCursor(indexFromLineColumn(text, targetLine, column), maxIndex);
}

export function shiftErrorIndices(
  errors: Set<number>,
  from: number,
  count: number,
): Set<number> {
  const next = new Set<number>();
  for (const idx of errors) {
    if (idx < from) next.add(idx);
    else if (idx >= from + count) next.add(idx - count);
  }
  return next;
}
