import { describe, it, expect } from "vitest";
import {
  DAY_MS,
  DEFAULT_CONFIG,
  adaptiveNewCardLimit,
  buildReviewQueue,
  daysBetween,
  deriveCard,
  dueCounts,
  isDue,
  newCard,
  previewIntervals,
  retentionRate,
  scheduleCard,
  startOfLocalDay,
  type ReviewEvent,
  type Rating,
  type SrsCard,
} from "./engine";

// A fixed local-noon reference so tests never straddle a midnight boundary.
const T0 = new Date(2026, 0, 15, 12, 0, 0).getTime();
const at = (dayOffset: number, hour = 12) =>
  new Date(2026, 0, 15 + dayOffset, hour, 0, 0).getTime();

describe("day arithmetic", () => {
  it("treats any time on the same calendar day as the same day", () => {
    expect(startOfLocalDay(at(0, 0))).toBe(startOfLocalDay(at(0, 23)));
    expect(daysBetween(at(0, 23), at(1, 1))).toBe(1);
  });

  it("counts days across a month boundary", () => {
    const jan31 = new Date(2026, 0, 31, 9).getTime();
    const feb2 = new Date(2026, 1, 2, 9).getTime();
    expect(daysBetween(jan31, feb2)).toBe(2);
  });
});

describe("scheduleCard — the SM-2 ladder", () => {
  it("walks 1 → 3 → interval*ease on successive Good ratings", () => {
    let c = newCard("w");
    c = scheduleCard(c, 2, T0);
    expect(c.intervalDays).toBe(1);
    c = scheduleCard(c, 2, at(1));
    expect(c.intervalDays).toBe(3);
    c = scheduleCard(c, 2, at(4));
    expect(c.intervalDays).toBe(Math.round(3 * 2.5)); // 8
    expect(c.state).toBe("review");
  });

  it("makes Hard differ from Good on the very first review", () => {
    const base = newCard("w");
    const good = scheduleCard(base, 2, T0);
    const hard = scheduleCard(base, 1, T0);
    expect(hard.ease).toBeLessThan(good.ease);
    // Both floor at 1 day, but ease has already diverged — the button is not a no-op.
    expect(hard.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it("raises ease on Easy and lowers it on Hard", () => {
    const c = newCard("w");
    expect(scheduleCard(c, 3, T0).ease).toBeGreaterThan(DEFAULT_CONFIG.startingEase);
    expect(scheduleCard(c, 1, T0).ease).toBeLessThan(DEFAULT_CONFIG.startingEase);
  });

  it("never lets ease fall below the floor, however many failures", () => {
    let c = newCard("w");
    for (let i = 0; i < 50; i++) c = scheduleCard(c, 0, at(i));
    expect(c.ease).toBe(DEFAULT_CONFIG.minEase);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("caps the interval so a card cannot vanish for years", () => {
    let c = newCard("w");
    for (let i = 0; i < 40; i++) c = scheduleCard(c, 3, at(i * 30));
    expect(c.intervalDays).toBeLessThanOrEqual(DEFAULT_CONFIG.maxIntervalDays);
  });

  it("re-queues an Again card for the same day", () => {
    let c = scheduleCard(newCard("w"), 2, T0);
    c = scheduleCard(c, 0, at(1));
    expect(c.intervalDays).toBe(0);
    expect(isDue(c, at(1))).toBe(true);
  });
});

describe("lapses and leeches", () => {
  it("does not count failing a new card as a lapse", () => {
    // Fumbling a card you have never successfully recalled is not forgetting.
    let c = newCard("w");
    c = scheduleCard(c, 0, T0);
    expect(c.lapses).toBe(0);
    expect(c.state).toBe("learning");
  });

  it("counts a lapse only once the card has graduated to review", () => {
    let c = newCard("w");
    c = scheduleCard(c, 2, T0); // -> review
    c = scheduleCard(c, 0, at(1)); // -> lapsed, 1 lapse
    expect(c.lapses).toBe(1);
    expect(c.state).toBe("lapsed");
  });

  it("flags a leech at the configured threshold", () => {
    let c = newCard("w");
    let day = 0;
    for (let i = 0; i < DEFAULT_CONFIG.leechThreshold; i++) {
      c = scheduleCard(c, 2, at(day++)); // graduate
      c = scheduleCard(c, 0, at(day++)); // then fail
    }
    expect(c.lapses).toBe(DEFAULT_CONFIG.leechThreshold);
    expect(c.isLeech).toBe(true);
  });
});

describe("deriveCard — event sourcing (spec §5.2)", () => {
  const events: ReviewEvent[] = [
    { wordId: "a", rating: 2, reviewedAt: at(0) },
    { wordId: "a", rating: 1, reviewedAt: at(1) },
    { wordId: "b", rating: 0, reviewedAt: at(1) },
    { wordId: "a", rating: 3, reviewedAt: at(5) },
  ];

  it("reproduces the same card as applying the events in order", () => {
    let manual = newCard("a");
    manual = scheduleCard(manual, 2, at(0));
    manual = scheduleCard(manual, 1, at(1));
    manual = scheduleCard(manual, 3, at(5));
    expect(deriveCard("a", events)).toEqual(manual);
  });

  it("is order-independent — two devices syncing shuffled logs converge", () => {
    const shuffled = [events[3]!, events[1]!, events[2]!, events[0]!];
    expect(deriveCard("a", shuffled)).toEqual(deriveCard("a", events));
  });

  it("ignores events belonging to other words", () => {
    expect(deriveCard("b", events).wordId).toBe("b");
    expect(deriveCard("b", events).lapses).toBe(0);
  });

  it("returns a pristine new card when there is no history", () => {
    expect(deriveCard("zzz", events)).toEqual(newCard("zzz"));
  });
});

describe("buildReviewQueue", () => {
  const mk = (over: Partial<SrsCard> & { wordId: string }): SrsCard => ({
    ...newCard(over.wordId),
    ...over,
  });

  it("returns a stable snapshot that does not shrink as cards are rated", () => {
    // This is the regression guard for the prototype bug where the session
    // re-read a live due-list and silently skipped every other card.
    const cards = ["a", "b", "c", "d"].map((id) =>
      mk({ wordId: id, state: "review", dueAt: at(-1), intervalDays: 1 }),
    );
    const queue = buildReviewQueue(cards, T0);
    expect(queue.map((c) => c.wordId)).toEqual(["a", "b", "c", "d"]);

    // Rating every card must not mutate the queue we are iterating.
    queue.forEach((c) => scheduleCard(c, 2, T0));
    expect(queue).toHaveLength(4);
  });

  it("puts lapsed cards before ordinary due cards", () => {
    const cards = [
      mk({ wordId: "ok", state: "review", dueAt: at(-1) }),
      mk({ wordId: "lapsed", state: "lapsed", dueAt: at(0) }),
    ];
    expect(buildReviewQueue(cards, T0)[0]!.wordId).toBe("lapsed");
  });

  it("orders due cards by how overdue they are", () => {
    const cards = [
      mk({ wordId: "recent", state: "review", dueAt: at(0) }),
      mk({ wordId: "ancient", state: "review", dueAt: at(-30) }),
    ];
    expect(buildReviewQueue(cards, T0).map((c) => c.wordId)).toEqual(["ancient", "recent"]);
  });

  it("caps new cards at the daily limit and appends them after reviews", () => {
    const cards = [
      mk({ wordId: "due", state: "review", dueAt: at(-1) }),
      ...Array.from({ length: 30 }, (_, i) => mk({ wordId: `n${i}` })),
    ];
    const q = buildReviewQueue(cards, T0, { newCardLimit: 5 });
    expect(q).toHaveLength(6);
    expect(q[0]!.wordId).toBe("due");
    expect(q.filter((c) => c.state === "new")).toHaveLength(5);
  });

  it("excludes not-yet-due cards", () => {
    const cards = [mk({ wordId: "future", state: "review", dueAt: at(5) })];
    expect(buildReviewQueue(cards, T0, { includeNew: false })).toHaveLength(0);
  });

  it("counts a card due later the same day as due now", () => {
    const card = mk({ wordId: "x", state: "review", dueAt: at(0, 23) });
    expect(isDue(card, at(0, 1))).toBe(true);
  });
});

describe("dueCounts", () => {
  it("separates new, due and leech counts", () => {
    const cards: SrsCard[] = [
      { ...newCard("a") },
      { ...newCard("b"), state: "review", dueAt: at(-1) },
      { ...newCard("c"), state: "review", dueAt: at(9) },
      { ...newCard("d"), state: "lapsed", dueAt: at(-1), isLeech: true },
    ];
    expect(dueCounts(cards, T0)).toEqual({ due: 2, new: 1, leeches: 1, total: 4 });
  });
});

describe("adaptive pacing (spec §4 Phase 7)", () => {
  const events = (n: number, againFraction: number): ReviewEvent[] =>
    Array.from({ length: n }, (_, i) => ({
      wordId: `w${i}`,
      rating: (i < n * againFraction ? 0 : 2) as Rating,
      reviewedAt: at(-1),
    }));

  it("holds the baseline when there is too little signal", () => {
    expect(adaptiveNewCardLimit(events(5, 0.9), DEFAULT_CONFIG, 7, T0)).toBe(
      DEFAULT_CONFIG.newCardsPerDay,
    );
  });

  it("slows down hard when the learner is drowning", () => {
    const limit = adaptiveNewCardLimit(events(100, 0.5), DEFAULT_CONFIG, 7, T0);
    expect(limit).toBeLessThan(DEFAULT_CONFIG.newCardsPerDay);
    expect(limit).toBeGreaterThanOrEqual(2);
  });

  it("speeds up when recall is very strong", () => {
    expect(adaptiveNewCardLimit(events(100, 0.02), DEFAULT_CONFIG, 7, T0)).toBeGreaterThan(
      DEFAULT_CONFIG.newCardsPerDay,
    );
  });

  it("ignores events outside the rolling window", () => {
    const stale: ReviewEvent[] = Array.from({ length: 100 }, (_, i) => ({
      wordId: `w${i}`,
      rating: 0 as Rating,
      reviewedAt: at(-90),
    }));
    expect(adaptiveNewCardLimit(stale, DEFAULT_CONFIG, 7, T0)).toBe(DEFAULT_CONFIG.newCardsPerDay);
  });
});

describe("retentionRate", () => {
  it("is null with no data rather than a misleading zero", () => {
    expect(retentionRate([], 7, T0)).toBeNull();
  });

  it("counts any non-Again rating as successful recall", () => {
    const evts: ReviewEvent[] = [
      { wordId: "a", rating: 0, reviewedAt: at(-1) },
      { wordId: "b", rating: 1, reviewedAt: at(-1) },
      { wordId: "c", rating: 2, reviewedAt: at(-1) },
      { wordId: "d", rating: 3, reviewedAt: at(-1) },
    ];
    expect(retentionRate(evts, 7, T0)).toBe(0.75);
  });
});

describe("previewIntervals", () => {
  it("gives each rating button a distinct, human-readable projection", () => {
    const c = scheduleCard(scheduleCard(newCard("w"), 2, T0), 2, at(1));
    const p = previewIntervals(c, at(4));
    expect(p[0]).toBe("today");
    expect(p[3]).not.toBe(p[2]);
    expect(Object.values(p).every((s) => s.length > 0)).toBe(true);
  });

  it("formats long intervals in months and years", () => {
    const mature: SrsCard = { ...newCard("w"), state: "review", repetitions: 9, intervalDays: 200, ease: 2.5 };
    expect(previewIntervals(mature, T0)[2]).toMatch(/mo|yr/);
  });
});

describe("purity", () => {
  it("never mutates the card it is given", () => {
    const c = newCard("w");
    const snapshot = structuredClone(c);
    scheduleCard(c, 3, T0);
    expect(c).toEqual(snapshot);
  });

  it("is deterministic across repeated calls", () => {
    const c = newCard("w");
    expect(scheduleCard(c, 2, T0)).toEqual(scheduleCard(c, 2, T0));
  });

  it("does not read the ambient clock", () => {
    // dueAt must derive from the passed timestamp, not Date.now().
    const c = scheduleCard(newCard("w"), 2, T0);
    expect(c.dueAt).toBe(startOfLocalDay(T0) + 1 * DAY_MS);
  });
});
