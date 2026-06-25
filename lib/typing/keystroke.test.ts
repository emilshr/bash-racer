import assert from "node:assert/strict";
import { initialTypingState } from "@/lib/atoms/game";
import {
  applyNewlineKeystroke,
  applyPrintableKeystroke,
  canCompleteLine,
  canTypeAtCursor,
} from "./keystroke";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok ${name}`);
  } catch (err) {
    console.error(`fail ${name}`);
    throw err;
  }
}

test("canTypeAtCursor blocks over-typing in session mode", () => {
  assert.equal(canTypeAtCursor(5, 5, true), false);
  assert.equal(canTypeAtCursor(4, 5, true), true);
  assert.equal(canTypeAtCursor(5, 5, false), true);
});

test("canCompleteLine requires full length", () => {
  assert.equal(canCompleteLine(4, 5), false);
  assert.equal(canCompleteLine(5, 5), true);
  assert.equal(canCompleteLine(0, 0), false);
});

test("applyPrintableKeystroke increments correct keystrokes", () => {
  const text = "ls";
  const afterFirst = applyPrintableKeystroke(initialTypingState, text, 0, "l", 1000, false);
  assert.equal(afterFirst.correctKeystrokes, 1);
  assert.equal(afterFirst.typedChars.join(""), "l");

  const afterSecond = applyPrintableKeystroke(afterFirst, text, 1, "x", 1100, false);
  assert.equal(afterSecond.correctKeystrokes, 1);
  assert.equal(afterSecond.totalKeystrokes, 2);
});

test("applyPrintableKeystroke finishes single-line mode", () => {
  const text = "a";
  const next = applyPrintableKeystroke(initialTypingState, text, 0, "a", 1000, false);
  assert.equal(next.finishedAt, 1000);
});

test("applyPrintableKeystroke does not finish session mode", () => {
  const text = "a";
  const next = applyPrintableKeystroke(initialTypingState, text, 0, "a", 1000, true);
  assert.equal(next.finishedAt, null);
});

test("applyNewlineKeystroke handles newline input", () => {
  const text = "a\nb";
  const afterA = applyPrintableKeystroke(initialTypingState, text, 0, "a", 1000, false);
  const next = applyNewlineKeystroke(afterA, text, 1, "\n", 1100);
  assert.equal(next.typedChars[1], "\n");
  assert.equal(next.cursorIndex, 2);
});

console.log("All keystroke tests passed");
