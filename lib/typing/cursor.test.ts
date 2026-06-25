import assert from "node:assert/strict";
import {
  clampCursor,
  clampCursorToLine,
  findPrevWordStart,
  getCurrentLineEnd,
  getCurrentLineStart,
  getLineBounds,
  getNextLineStart,
  indexFromLineColumn,
  moveVertical,
  shiftErrorIndices,
} from "./cursor";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok ${name}`);
  } catch (err) {
    console.error(`fail ${name}`);
    throw err;
  }
}

test("clampCursor", () => {
  assert.equal(clampCursor(-1, 5), 0);
  assert.equal(clampCursor(3, 5), 3);
  assert.equal(clampCursor(10, 5), 5);
});

test("findPrevWordStart", () => {
  const text = "echo hello world";
  assert.equal(findPrevWordStart(text, 16), 11);
  assert.equal(findPrevWordStart(text, 11), 5);
  assert.equal(findPrevWordStart(text, 5), 0);
});

test("getLineBounds", () => {
  const text = "line1\nline22\nline3";
  assert.deepEqual(getLineBounds(text, 8), { lineStart: 6, lineEnd: 12 });
  assert.deepEqual(getLineBounds(text, 0), { lineStart: 0, lineEnd: 5 });
});

test("getCurrentLineStart and getCurrentLineEnd", () => {
  const text = "ls -la\ngrep foo";
  assert.equal(getCurrentLineStart(text, 8), 7);
  assert.equal(getCurrentLineEnd(text, 8), 15);
});

test("getNextLineStart", () => {
  const text = "ls -la\ngrep foo";
  assert.equal(getNextLineStart(text, 3), 7);
  assert.equal(getNextLineStart(text, 10), 15);
});

test("clampCursorToLine", () => {
  const text = "ls -la\ngrep foo";
  assert.equal(clampCursorToLine(0, text, 7, 10), 7);
  assert.equal(clampCursorToLine(20, text, 0, 6), 6);
  assert.equal(clampCursorToLine(4, text, 0, 10), 4);
});

test("indexFromLineColumn", () => {
  const text = "ab\ncde\nf";
  assert.equal(indexFromLineColumn(text, 1, 2), 5);
  assert.equal(indexFromLineColumn(text, 2, 10), 8);
});

test("moveVertical preserves column", () => {
  const text = "short\nlongerline\nx";
  assert.equal(moveVertical(text, 8, "up", 20), 2);
  assert.equal(moveVertical(text, 2, "down", 20), 8);
});

test("shiftErrorIndices", () => {
  const shifted = shiftErrorIndices(new Set([1, 3, 5]), 2, 2);
  assert.deepEqual([...shifted].sort(), [1, 3]);
});

console.log("All cursor tests passed");
