import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SCENARIO_DIR = "src/server/quest/scenario";
const FORBIDDEN_PATTERNS = [
  /from\s+["'].*\.\.\/engine/,
  /from\s+["'].*\/engine\//,
  /from\s+["'].*\/providers/,
  /from\s+["'].*claude/i,
  /from\s+["'].*elevenlabs/i,
];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else if (full.endsWith(".ts")) {
      yield full;
    }
  }
}

const violations: { file: string; line: number; text: string; rule: string }[] = [];

for (const file of walk(SCENARIO_DIR)) {
  const content = readFileSync(file, "utf-8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({ file, line: i + 1, text: line.trim(), rule: pattern.source });
        break;
      }
    }
  }
}

if (violations.length === 0) {
  console.log(`Scenario purity OK: no forbidden imports in ${SCENARIO_DIR}`);
  process.exit(0);
}

console.error(`Scenario purity violations:`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  ${v.text}  (matched: ${v.rule})`);
}
process.exit(1);
