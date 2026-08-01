import "@testing-library/jest-dom/vitest";

// jsdom has no IndexedDB and no speechSynthesis. Individual test files that need
// them stub them explicitly; this file only wires up DOM matchers so that a
// missing global surfaces as a clear error rather than a silent pass.
