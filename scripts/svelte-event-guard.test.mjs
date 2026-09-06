import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const hook = readFileSync(
  new URL("../.githooks/pre-commit", import.meta.url),
  "utf8",
);
const pattern = hook.match(
  /rg --files-with-matches --glob '\*\.svelte' '([^']+)'/,
)?.[1];
assert.ok(pattern, "test must exercise the actual pre-commit expression");

const cases = [
  ["CSS disabled selector", "button:disabled { opacity: 0.5; }", false],
  [
    "CSS compound selector",
    "button:not(:disabled):hover { color: inherit; }",
    false,
  ],
  ["CSS animation property", "animation:none;", false],
  ["runes click handler", "<button onclick={run}>Run</button>", false],
  ["capture handler", "<input oninputcapture={observe} />", false],
  ["legacy click handler", "<button on:click={run}>Run</button>", true],
  ["legacy multiline input", "<input\n  on:input={run}\n/>", true],
  ["legacy modifier", "<form on:submit|preventDefault={run}>", true],
  ["legacy forwarded event", "<button on:click>Run</button>", true],
  ["legacy component event", "<Widget on:change={run} />", true],
];

for (const [name, input, expected] of cases) {
  test(`AI-IMP-203: ${name}`, () => {
    const result = spawnSync("rg", ["--quiet", "--regexp", pattern], {
      input,
      encoding: "utf8",
    });
    assert.ifError(result.error);
    assert.ok(result.status === 0 || result.status === 1, result.stderr);
    assert.equal(result.status === 0, expected);
  });
}
