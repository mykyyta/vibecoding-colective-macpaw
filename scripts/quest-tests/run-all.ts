// Runs all quest test suites sequentially. Each suite logs its own result.
// Top-level await in each *.test.ts runs all assertions on import.

await import("./state.test.js");
await import("./transitions.test.js");
await import("./classifier.test.js");
await import("./language.test.js");
await import("./brain.test.js");

console.log("All quest tests passed.");
