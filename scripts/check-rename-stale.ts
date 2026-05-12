// Repo-wide grep smoke for stale rename literals introduced by the
// scenario-character-voices initiative. The scenario purity check
// only validates imports; this script catches string literals in
// prompts, describe blocks, route docs, and tests that may slip past
// a renaming pass.
//
// Excludes:
//   - docs/work/initiatives/ — historical initiative records keep
//     their original tokens by design (see content.md decision 4.4).
//   - node_modules and .git.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src", "scripts"];
const STALE_TOKENS = ["dan-door-checked", "danDoorChecked"];
const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".mjs", ".cjs", ".js", ".jsx", ".json"];
const SELF_PATH_SUFFIX = "scripts/check-rename-stale.ts";

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else if (ALLOWED_EXTENSIONS.some((ext) => full.endsWith(ext))) {
      yield full;
    }
  }
}

const violations: { file: string; line: number; token: string; text: string }[] = [];

for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (file.endsWith(SELF_PATH_SUFFIX)) continue;
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const token of STALE_TOKENS) {
        if (line.includes(token)) {
          violations.push({ file, line: i + 1, token, text: line.trim() });
        }
      }
    }
  }
}

if (violations.length === 0) {
  console.log(`Rename smoke OK: no stale ${STALE_TOKENS.join(" / ")} literals under ${ROOTS.join(", ")}`);
  process.exit(0);
}

console.error("Rename smoke found stale literals:");
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.token}]  ${v.text}`);
}
process.exit(1);
