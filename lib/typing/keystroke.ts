import type { TypingState } from "@/lib/atoms/game";

export function deleteRange(typedChars: string[], from: number, to: number): string[] {
  return [...typedChars.slice(0, from), ...typedChars.slice(to)];
}

export function applyPrintableKeystroke(
  prev: TypingState,
  text: string,
  cursorIndex: number,
  char: string,
  now: number,
  sessionMode: boolean,
): TypingState {
  const startedAt = prev.startedAt ?? now;
  const nextTyped = [...prev.typedChars];
  if (cursorIndex < nextTyped.length) {
    nextTyped[cursorIndex] = char;
  } else {
    nextTyped.push(char);
  }
  const newIndex = cursorIndex + 1;
  const newFurthest = Math.max(prev.furthestIndex, newIndex);

  const wasCorrect =
    cursorIndex < prev.typedChars.length && prev.typedChars[cursorIndex] === text[cursorIndex];
  const isCorrect = char === text[cursorIndex];
  let correctKeystrokes = prev.correctKeystrokes;
  if (wasCorrect && !isCorrect) correctKeystrokes--;
  if (!wasCorrect && isCorrect) correctKeystrokes++;

  const finished = !sessionMode && nextTyped.length >= text.length;

  return {
    ...prev,
    startedAt,
    cursorIndex: newIndex,
    furthestIndex: newFurthest,
    typedChars: nextTyped,
    totalKeystrokes: prev.totalKeystrokes + 1,
    correctKeystrokes,
    finishedAt: finished ? now : null,
  };
}

export function applyNewlineKeystroke(
  prev: TypingState,
  text: string,
  cursorIndex: number,
  char: string,
  now: number,
): TypingState {
  const startedAt = prev.startedAt ?? now;
  const nextTyped = [...prev.typedChars];
  if (cursorIndex < nextTyped.length) {
    nextTyped[cursorIndex] = char;
  } else {
    nextTyped.push(char);
  }
  const newIndex = cursorIndex + 1;
  const newFurthest = Math.max(prev.furthestIndex, newIndex);

  const wasCorrect =
    cursorIndex < prev.typedChars.length && prev.typedChars[cursorIndex] === text[cursorIndex];
  const isCorrect = char === text[cursorIndex];
  let correctKeystrokes = prev.correctKeystrokes;
  if (wasCorrect && !isCorrect) correctKeystrokes--;
  if (!wasCorrect && isCorrect) correctKeystrokes++;

  const finished = nextTyped.length >= text.length;

  return {
    ...prev,
    startedAt,
    cursorIndex: newIndex,
    furthestIndex: newFurthest,
    typedChars: nextTyped,
    totalKeystrokes: prev.totalKeystrokes + 1,
    correctKeystrokes,
    finishedAt: finished ? now : null,
  };
}

export function canTypeAtCursor(
  cursorIndex: number,
  textLength: number,
  sessionMode: boolean,
): boolean {
  if (sessionMode && cursorIndex >= textLength) return false;
  return true;
}

export function canCompleteLine(typedLength: number, textLength: number): boolean {
  return textLength > 0 && typedLength >= textLength;
}
