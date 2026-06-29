import assert from "node:assert/strict";
import { createCommandSession } from "@/lib/atoms/game";
import { SESSION_COMMAND_COUNT } from "@/lib/constants/session";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok ${name}`);
  } catch (err) {
    console.error(`fail ${name}`);
    throw err;
  }
}

test("createCommandSession normalizes commands", () => {
  const commands = Array.from({ length: 12 }, (_, i) => `cmd-${i}`);
  const session = createCommandSession(commands);
  assert.equal(session.commands.length, SESSION_COMMAND_COUNT);
  assert.equal(session.activeIndex, 0);
});

test("createCommandSession filters empty strings", () => {
  const session = createCommandSession(["ls", "", "pwd"]);
  assert.deepEqual(session.commands, ["ls", "pwd"]);
});

test("createCommandSession handles empty input", () => {
  const session = createCommandSession([]);
  assert.deepEqual(session.commands, []);
});

console.log("All session tests passed");
