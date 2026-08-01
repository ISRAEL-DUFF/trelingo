import { describe, it, expect } from "vitest";
import { editDistance, gradeChoice, gradeMatching, gradeParse, gradeTranslation, normalise } from "./grade";

describe("gradeChoice", () => {
  it("is exact and fully confident", () => {
    expect(gradeChoice("a", "a")).toEqual({ verdict: "correct", confidence: 1 });
    expect(gradeChoice("a", "b").verdict).toBe("incorrect");
  });
});

describe("gradeParse", () => {
  const answer = { binyan: "qal", tense: "perfect", person: "3", gender: "m", number: "s" } as const;

  it("requires every asked field to be right", () => {
    const r = gradeParse(answer, answer, ["binyan", "tense", "person", "gender", "number"]);
    expect(r.verdict).toBe("correct");
  });

  it("reports which fields were wrong rather than just failing", () => {
    const r = gradeParse({ ...answer, gender: "f" }, answer, ["person", "gender", "number"]);
    expect(r.verdict).toBe("incorrect");
    expect(r.fields).toEqual({ person: true, gender: false, number: true });
    expect(r.explanation).toContain("2 of 3");
  });

  it("only grades the fields the exercise asked for", () => {
    // binyan is wrong but not asked — must not count against the learner.
    const r = gradeParse({ ...answer, binyan: "piel" }, answer, ["person", "number"]);
    expect(r.verdict).toBe("correct");
  });
});

describe("normalise", () => {
  it("folds case, punctuation and accents", () => {
    expect(normalise("  The LORD’s—shepherd! ")).toBe("the lord s shepherd");
  });
});

describe("editDistance", () => {
  it("counts single-character edits", () => {
    expect(editDistance("shepherd", "shepherd")).toBe(0);
    expect(editDistance("shepherd", "shepard")).toBeLessThanOrEqual(2);
    expect(editDistance("abc", "xyz")).toBe(3);
  });
});

describe("gradeTranslation", () => {
  const acceptable = ["the LORD is my shepherd", "the Lord is my shepherd", "YHWH is my shepherd"];
  const keywords = ["shepherd"];

  it("accepts an exact match", () => {
    expect(gradeTranslation("the LORD is my shepherd", acceptable, keywords).verdict).toBe("correct");
  });

  it("ignores case, punctuation and extra whitespace", () => {
    expect(gradeTranslation("  The Lord is my Shepherd. ", acceptable, keywords).verdict).toBe("correct");
  });

  it("accepts a dropped copula, which Hebrew does not have anyway", () => {
    expect(gradeTranslation("the LORD my shepherd", acceptable, keywords).verdict).toBe("correct");
  });

  it("tolerates a typo rather than punishing it", () => {
    const r = gradeTranslation("the Lord is my shepard", acceptable, keywords);
    expect(r.verdict).not.toBe("incorrect");
  });

  it("returns uncertain — not incorrect — for a defensible near-miss", () => {
    // The whole point of §4 Phase 8: never silently mis-grade an arguable answer.
    const r = gradeTranslation("the LORD tends me", acceptable, keywords);
    expect(r.verdict).toBe("uncertain");
    expect(r.explanation).toBeTruthy();
  });

  it("rejects an answer with no relationship to the key", () => {
    expect(gradeTranslation("in the beginning God created", acceptable, keywords).verdict).toBe(
      "incorrect",
    );
  });

  it("marks an empty answer incorrect without crashing", () => {
    expect(gradeTranslation("   ", acceptable, keywords).verdict).toBe("incorrect");
  });

  it("does not let padding turn a wrong answer into a right one", () => {
    const r = gradeTranslation(
      "shepherd shepherd shepherd shepherd shepherd shepherd",
      acceptable,
      keywords,
    );
    expect(r.verdict).not.toBe("correct");
  });

  it("flags a missing required keyword instead of passing silently", () => {
    const r = gradeTranslation("the LORD is my guide", acceptable, keywords);
    expect(r.verdict).not.toBe("correct");
  });

  it("carries a confidence score on every verdict", () => {
    for (const input of ["the LORD is my shepherd", "the LORD tends me", "nonsense here"]) {
      const r = gradeTranslation(input, acceptable, keywords);
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe("gradeMatching", () => {
  const expected = { qal: "he was great", piel: "he raised", hiphil: "he magnified" };

  it("passes only on a complete match", () => {
    expect(gradeMatching(expected, expected).verdict).toBe("correct");
  });

  it("reports partial matches per key", () => {
    const r = gradeMatching({ ...expected, piel: "he magnified" }, expected);
    expect(r.verdict).toBe("incorrect");
    expect(r.fields).toMatchObject({ qal: true, piel: false });
    expect(r.explanation).toContain("2 of 3");
  });

  it("treats an unanswered key as wrong, not as a crash", () => {
    expect(gradeMatching({}, expected).verdict).toBe("incorrect");
  });
});
