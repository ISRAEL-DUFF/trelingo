import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db } from "@/db";
import { getLeeches, getRecentEvents, getStats } from "@/db/repo";
import { retentionRate, adaptiveNewCardLimit, DEFAULT_CONFIG } from "@/srs/engine";
import { useCourse, useCourseContent } from "@/state/useCourse";
import { morphemeLabel } from "@/content/course";
import { ScriptWord } from "@/components/ScriptWord";
import { Empty, TopBar } from "@/components/ui";

export function StatsScreen() {
  const { wordById, families } = useCourseContent();
  const morpheme = morphemeLabel(useCourse());
  const data = useLiveQuery(async () => {
    const [stats, events, leeches] = await Promise.all([
      getStats(),
      getRecentEvents(7),
      getLeeches(),
    ]);
    return {
      stats,
      retention: retentionRate(events, 7),
      newCardLimit: adaptiveNewCardLimit(events),
      leeches,
      reviewsThisWeek: events.length,
    };
  }, []);

  const cards = useLiveQuery(() => db.srsCards.toArray(), []);

  if (!data) return <div className="empty">Loading…</div>;
  const { stats } = data;

  const tiles = [
    { label: "Day streak", value: stats.streak.current, hint: `best ${stats.streak.longest}` },
    { label: "XP", value: stats.xp },
    { label: "Units done", value: stats.unitsCompleted },
    { label: "Words seen", value: stats.counts.total },
    { label: `${morpheme.Many} met`, value: `${stats.familiesSeen} / ${families.length}` },
    { label: "Known well", value: stats.known, hint: "interval ≥ 21d" },
  ];

  return (
    <div className="screen">
      <TopBar left={<span className="small">Progress</span>} />

      <div
        className="pad"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}
      >
        {tiles.map((t) => (
          <div key={t.label} className="card card--flat center" style={{ padding: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>{t.value}</div>
            <div className="small muted">{t.label}</div>
            {t.hint && (
              <div className="small muted" style={{ opacity: 0.7, fontSize: 11 }}>
                {t.hint}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pad-x stack">
        <div className="card">
          <div className="row row--between">
            <span className="label">7-day retention</span>
            <span style={{ fontWeight: 700 }}>
              {data.retention === null ? "—" : `${Math.round(data.retention * 100)}%`}
            </span>
          </div>
          <p className="small muted" style={{ marginTop: 6, lineHeight: 1.55 }}>
            {data.retention === null
              ? "Review some cards and this starts tracking how much you're actually retaining."
              : data.newCardLimit < DEFAULT_CONFIG.newCardsPerDay
                ? `Recall has been shaky, so new words are being introduced more slowly (${data.newCardLimit}/day) until it recovers.`
                : data.newCardLimit > DEFAULT_CONFIG.newCardsPerDay
                  ? `Recall is strong, so you're getting more new words (${data.newCardLimit}/day).`
                  : `Introducing ${data.newCardLimit} new words a day.`}
          </p>
          <p className="small muted" style={{ marginTop: 4 }}>
            {data.reviewsThisWeek} review{data.reviewsThisWeek === 1 ? "" : "s"} this week ·{" "}
            {stats.totalReviews} all time
          </p>
        </div>

        <div className="card">
          <span className="label">Queue right now</span>
          <div className="row" style={{ gap: 16, marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "var(--attention)" }}>
                {stats.counts.due}
              </div>
              <div className="small muted">due</div>
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "var(--gold)" }}>
                {stats.counts.new}
              </div>
              <div className="small muted">new</div>
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "var(--sage)" }}>
                {(cards ?? []).filter((c) => c.state === "review").length}
              </div>
              <div className="small muted">in review</div>
            </div>
          </div>
        </div>

        {data.leeches.length > 0 && (
          <div className="card">
            <span className="label">Sticking points</span>
            <p className="small muted" style={{ marginTop: 6, lineHeight: 1.55 }}>
              These have been forgotten {DEFAULT_CONFIG.leechThreshold}+ times. Worth learning
              deliberately rather than waiting for them to come round again.
            </p>
            <div className="stack" style={{ marginTop: 10 }}>
              {data.leeches.map((c) => {
                const w = wordById.get(c.wordId);
                if (!w) return null;
                return (
                  <div key={c.wordId} className="row row--between">
                    <ScriptWord word={w.text} highlight={w.morphology?.highlight} size={22} showHighlight />
                    <span className="small muted">
                      {w.gloss} · {c.lapses} lapses
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Link
          to="/assessment"
          className="card card--flat"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="row row--between">
            <div>
              <div style={{ fontWeight: 600 }}>Reading fluency check</div>
              <div className="small muted">Timed read of a verse, with comprehension questions.</div>
            </div>
            <span className="muted">›</span>
          </div>
        </Link>

        {stats.counts.total === 0 && (
          <Empty icon="📊" title="Nothing to measure yet" hint="Complete a unit to start tracking." />
        )}
      </div>
    </div>
  );
}
