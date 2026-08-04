import { describe, it, expect } from "vitest";
import { seededDerangement } from "./Exercises";
import { budgetFor, CONSOLIDATION } from "./session";

/**
 * The matching grid must never hand out a free pair.
 *
 * The gloss column used to be a plain shuffle, with a comment claiming that two
 * independent shuffles meant "a tile and its partner never share a row". They do
 * not: a random permutation of n items leaves one fixed point on average. It went
 * unnoticed while grids held four pairs and became obvious at six — a live grid
 * showed בֵּן opposite "son" and בְּעַד opposite "behind, about" at the same time.
 */
describe("the gloss column is deranged, not just shuffled", () => {
  /** Every grid size the review and consolidation budgets can ask for. */
  const sizes = new Set(
    [0, 5, 13, 41, 101, 500].map((backlog) => budgetFor(backlog).gridSize).concat(CONSOLIDATION.gridSize, 3),
  );

  it("leaves nothing in its own row, at every grid size, for any seed", () => {
    for (const n of sizes) {
      const ids = Array.from({ length: n }, (_, i) => `w${i}`);
      for (let s = 0; s < 500; s++) {
        const out = seededDerangement(ids, `grid-${n}-${s}`);
        const fixed = out.filter((id, i) => id === ids[i]);
        expect(fixed, `size ${n}, seed ${s}`).toEqual([]);
      }
    }
  });

  it("is still a permutation — no word lost, none duplicated", () => {
    const ids = Array.from({ length: 6 }, (_, i) => `w${i}`);
    for (let s = 0; s < 200; s++) {
      const out = seededDerangement(ids, `p${s}`);
      expect([...out].sort()).toEqual([...ids].sort());
    }
  });

  it("is deterministic, so the grid does not reshuffle under the learner", () => {
    const ids = ["a", "b", "c", "d", "e", "f"];
    expect(seededDerangement(ids, "same")).toEqual(seededDerangement(ids, "same"));
  });

  it("still varies with the seed", () => {
    const ids = ["a", "b", "c", "d", "e", "f"];
    const orders = new Set(
      Array.from({ length: 20 }, (_, i) => seededDerangement(ids, `s${i}`).join()),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("passes through a list too short to derange", () => {
    expect(seededDerangement([], "x")).toEqual([]);
    expect(seededDerangement(["only"], "x")).toEqual(["only"]);
  });
});
