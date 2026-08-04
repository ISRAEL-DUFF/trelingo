import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { contentFor } from "@/content";
import { setActiveCourse } from "@/content/course";

/**
 * The scan round, driven through the real screen.
 *
 * Two things here cannot be checked by testing `targets.ts` alone, and both
 * would be silent failures:
 *
 *   - the TRANSLATION must stay hidden while the clock runs. "and he went down
 *     to Joppa" hands over every answer without reading a word of Hebrew.
 *   - three taps on three occurrences of one lexeme must advance its card ONCE.
 *     Recording each tap would walk the interval as though three days had
 *     passed, which is the same massed-practice bug the lesson screen guards.
 */

const recordReview = vi.fn(async () => {});
const addXp = vi.fn(async () => {});
const touchStreak = vi.fn(async () => {});
/** Chapter 1 finished, so the descent verses are in scope. */
const completedUnitIds = vi.fn(async () =>
  contentFor("jonah")
    .units.filter((u) => u.sectionId === "jonah-1")
    .map((u) => u.id),
);

vi.mock("@/db/repo", () => ({
  getCompletedUnitIds: () => completedUnitIds(),
  recordReview: (...a: unknown[]) => recordReview(...(a as [])),
  addXp: (...a: unknown[]) => addXp(...(a as [])),
  touchStreak: () => touchStreak(),
}));
vi.mock("@/sync/sync", () => ({ sync: () => Promise.resolve() }));
vi.mock("@/state/useCourse", async () => {
  const { contentFor: real } = await import("@/content");
  return { useCourseContent: () => real("jonah") };
});

const { ScanScreen } = await import("./ScanScreen");
const { scanScope, scanTargets } = await import("./targets");

const renderScan = () =>
  render(
    <MemoryRouter initialEntries={["/scan/jonah-1"]}>
      <Routes>
        <Route path="/scan/:sectionId" element={<ScanScreen />} />
        <Route path="/" element={<div>path</div>} />
      </Routes>
    </MemoryRouter>,
  );

const chapterOneTargets = () => {
  const c = contentFor("jonah");
  return scanTargets(c, scanScope(c, new Set(c.units.map((u) => u.id)), "jonah-1"));
};

/**
 * Open on a chosen root.
 *
 * The screen starts at a RANDOM point in the rotation, so that scanning the
 * same chapter twice is not the same game. Pinning `Math.random` is how a test
 * asks for a specific round without clicking through the others.
 */
function openOn(familyId: string) {
  const targets = chapterOneTargets();
  const index = targets.findIndex((t) => t.familyId === familyId);
  expect(index, `${familyId} is not a chapter-1 target`).toBeGreaterThanOrEqual(0);
  vi.spyOn(Math, "random").mockReturnValue(index / 1000);
  return targets[index]!;
}

beforeEach(() => {
  setActiveCourse("jonah");
  vi.clearAllMocks();
});
afterEach(() => vi.restoreAllMocks());

describe("a scan round", () => {
  it("prompts with a MEANING, never with the letters to look for", async () => {
    renderScan();
    // Showing ירד would make this a visual search anyone could win without
    // knowing any Hebrew.
    const heading = await screen.findByText(/Find every place the text says/);
    expect(heading).toBeTruthy();
    for (const t of chapterOneTargets()) expect(screen.queryByText(t.letters), t.letters).toBeNull();
  });

  it("hides the translation while the clock runs, and shows it afterwards", async () => {
    const user = userEvent.setup();
    renderScan();
    await user.click(await screen.findByRole("button", { name: /Start the clock/ }));

    // JPS 1917 for Jonah 1:3 — the answer key, in English.
    expect(screen.queryByText(/went down to Joppa/)).toBeNull();

    await user.click(await screen.findByRole("button", { name: /Give up/ }));
    await waitFor(() => expect(screen.getByText(/went down to Joppa/)).toBeTruthy());
  });

  it("advances a lexeme's card ONCE however many times it is found", async () => {
    const target = openOn("ירד"); // the descent motif: וַיֵּרֶד · וַיֵּרֶד · יָרַד
    const user = userEvent.setup();
    renderScan();
    expect(await screen.findByText("“to go down”")).toBeTruthy();
    await user.click(await screen.findByRole("button", { name: /Start the clock/ }));

    const c = contentFor("jonah");
    expect(target.hits).toHaveLength(3);

    for (const h of target.hits) {
      const token = c.passageById.get(h.passageId)!.tokens[h.tokenIndex]!;
      const buttons = screen.getAllByRole("button", { name: token.text });
      await user.click(buttons[0]!);
    }

    // Three taps, three occurrences, one lexeme — one write.
    await waitFor(() => expect(recordReview).toHaveBeenCalledTimes(1));
    expect(recordReview).toHaveBeenCalledWith("h3381", 2);
  });

  it("does not credit a wrong tap, and counts it", async () => {
    openOn("ירד");
    const user = userEvent.setup();
    renderScan();
    await user.click(await screen.findByRole("button", { name: /Start the clock/ }));

    // A word in a scanned verse that is not the target.
    const wrong = contentFor("jonah").passageById.get("jonah-1-1")!.tokens[0]!;
    await user.click(screen.getAllByRole("button", { name: wrong.text })[0]!);

    expect(recordReview).not.toHaveBeenCalled();
    expect(screen.getByText(/0\/3/)).toBeTruthy();

    await user.click(await screen.findByRole("button", { name: /Give up/ }));
    await waitFor(() => expect(screen.getByText(/1 wrong tap\./)).toBeTruthy());
  });

  it("offers nothing to scan when no unit is finished", async () => {
    completedUnitIds.mockResolvedValueOnce([]);
    renderScan();
    expect(await screen.findByText(/Nothing to scan yet/)).toBeTruthy();
  });
});
