import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { courses, tracksOf, setActiveCourse, type Course, type CourseId } from "@/content/course";
import { type Language } from "@/content/language";
import { varietiesByLanguage, type Variety } from "@/content/variety";
import { contentFor, hasContent } from "@/content";
import { useActiveCourseId } from "@/state/useCourse";
import { getDueCounts, getProgress } from "@/db/repo";
import { Sheet, TopBar } from "@/components/ui";
import { ScriptWord } from "@/components/ScriptWord";

/**
 * Choosing what to study, in two steps.
 *
 *   1. Pick a COURSE   — Hebrew, Greek
 *   2. Pick a TRACK    — Shoresh or Jonah / Koine or Attic
 *
 * These were once four peers in one list, which asked a learner to choose
 * between "Shoresh" and "Attic Greek" as though those were the same kind of
 * decision. They are not: the first choice is which language to learn, the
 * second is which way to learn it.
 *
 * Progress is per track; streak and XP are global (D2), so these cards report
 * only what actually differs.
 */
function CourseCard({
  course,
  active,
  onPick,
}: {
  course: Course;
  active: boolean;
  onPick: () => void;
}) {
  const available = hasContent(course.id);

  const stats = useLiveQuery(async () => {
    if (!available) return null;
    const [progress, counts] = await Promise.all([
      getProgress(course.id),
      getDueCounts(Date.now(), course.id),
    ]);
    return { done: progress.length, due: counts.due + counts.new, total: contentFor(course.id).units.length };
  }, [course.id, available]);

  // A word in the track's own script, so the card shows what you'd be reading.
  const sampleText = available ? contentFor(course.id).words[0]?.text : undefined;

  return (
    <button
      className="card"
      onClick={onPick}
      disabled={!available}
      aria-current={active ? "true" : undefined}
      style={{
        textAlign: "start",
        width: "100%",
        borderColor: active ? course.accentColor : undefined,
        borderWidth: active ? 2 : 1,
        opacity: available ? 1 : 0.55,
      }}
    >
      <div className="row row--between">
        <div>
          <div className="row" style={{ gap: 8 }}>
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: course.accentColor,
                display: "inline-block",
              }}
            />
            <span style={{ fontWeight: 700, fontSize: 17 }}>{course.name}</span>
            {active && <span className="tag">current</span>}
          </div>
          <div className="small muted" style={{ marginTop: 4 }}>
            {course.subtitle}
          </div>
        </div>
        {sampleText && (
          <ScriptWord word={sampleText} size={26} showHighlight={false} course={course} />
        )}
      </div>

      <div className="small muted" style={{ marginTop: 10 }}>
        {!available ? (
          "Content in progress — not yet available."
        ) : stats ? (
          <>
            {stats.done} / {stats.total} units
            {stats.due > 0 && ` · ${stats.due} due`}
          </>
        ) : (
          "…"
        )}
      </div>
    </button>
  );
}

/** Step one: a language, with its varieties summarised. */
function LanguageCard({
  language,
  varieties,
  activeTrackId,
  onPick,
}: {
  language: Language;
  varieties: Variety[];
  activeTrackId: CourseId;
  onPick: () => void;
}) {
  const tracks = varieties.flatMap((v) => tracksOf(v.id));
  const holdsActive = tracks.some((t) => t.id === activeTrackId);
  const sample = tracks.find((t) => hasContent(t.id));
  const word = sample ? contentFor(sample.id).words[0]?.text : undefined;

  const due = useLiveQuery(async () => {
    let n = 0;
    for (const t of tracks) {
      if (!hasContent(t.id)) continue;
      const c = await getDueCounts(Date.now(), t.id);
      n += c.due + c.new;
    }
    return n;
  }, [tracks.map((t) => t.id).join()]);

  return (
    <button
      className="card"
      onClick={onPick}
      aria-current={holdsActive ? "true" : undefined}
      style={{
        textAlign: "start",
        width: "100%",
        borderColor: holdsActive ? tracks.find((t) => t.id === activeTrackId)!.accentColor : undefined,
        borderWidth: holdsActive ? 2 : 1,
      }}
    >
      <div className="row row--between">
        <div>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 19 }}>{language.name}</span>
            {holdsActive && <span className="tag">current</span>}
          </div>
          <div className="small muted" style={{ marginTop: 4 }}>
            {varieties.map((v) => v.name).join(" · ")}
          </div>
        </div>
        {word && sample && (
          <ScriptWord word={word} size={28} showHighlight={false} course={sample} />
        )}
      </div>
      <div className="small muted" style={{ marginTop: 10 }}>
        {varieties.length} {varieties.length === 1 ? "variety" : "varieties"}
        {due ? ` · ${due} due` : ""}
        <span aria-hidden style={{ float: "inline-end" }}>›</span>
      </div>
    </button>
  );
}

/** Step two: a variety, with its tracks summarised. */
function VarietyCard({
  variety,
  activeTrackId,
  onPick,
}: {
  variety: Variety;
  activeTrackId: CourseId;
  onPick: () => void;
}) {
  const tracks = tracksOf(variety.id);
  const holdsActive = tracks.some((t) => t.id === activeTrackId);
  const sample = tracks.find((t) => hasContent(t.id));
  const word = sample ? contentFor(sample.id).words[0]?.text : undefined;

  return (
    <button
      className="card"
      onClick={onPick}
      aria-current={holdsActive ? "true" : undefined}
      style={{
        textAlign: "start",
        width: "100%",
        borderColor: holdsActive ? tracks.find((t) => t.id === activeTrackId)!.accentColor : undefined,
        borderWidth: holdsActive ? 2 : 1,
      }}
    >
      <div className="row row--between">
        <div>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 17 }}>{variety.name}</span>
            {holdsActive && <span className="tag">current</span>}
          </div>
          <div className="small muted" style={{ marginTop: 4 }}>
            {variety.subtitle}
          </div>
        </div>
        {word && sample && (
          <ScriptWord word={word} size={26} showHighlight={false} course={sample} />
        )}
      </div>
      <div className="small muted" style={{ marginTop: 10 }}>
        {tracks.length} track{tracks.length === 1 ? "" : "s"}
        <span aria-hidden style={{ float: "inline-end" }}>›</span>
      </div>
    </button>
  );
}

/**
 * Language › Variety › Track, in three steps.
 *
 * `at` is the path walked so far: nothing, a language, or a variety. Only
 * choosing a track commits.
 *
 * A variety holding exactly ONE track selects it directly rather than showing a
 * list of one — Koine and Attic have a single track each today, and making a
 * learner tap through a one-item list to reach them would be ceremony.
 */
function CoursePicker({ onDone }: { onDone: () => void }) {
  const activeId = useActiveCourseId();
  const groups = varietiesByLanguage();
  const activeVariety = courses.find((c) => c.id === activeId)?.variety;

  // Open where the learner already is, so switching within a variety is quick
  // and stepping out is deliberate.
  const [at, setAt] = useState<{ language?: Language; variety?: Variety }>(() => {
    const g = groups.find((x) => x.varieties.some((v) => v.id === activeVariety));
    const v = g?.varieties.find((x) => x.id === activeVariety);
    // Land on the track list only when there is a real choice to make there.
    return v && tracksOf(v.id).length > 1 ? { language: g!.language, variety: v } : {};
  });

  const pickVariety = (language: Language, variety: Variety) => {
    const tracks = tracksOf(variety.id);
    if (tracks.length === 1) {
      setActiveCourse(tracks[0]!.id);
      onDone();
      return;
    }
    setAt({ language, variety });
  };

  // ---- step three: tracks ----
  if (at.variety && at.language) {
    const language = at.language;
    return (
      <>
        <Crumb onBack={() => setAt({ language })}>
          {language.name} › {at.variety.name}
        </Crumb>
        <div className="stack">
          {tracksOf(at.variety.id).map((t) => (
            <CourseCard
              key={t.id}
              course={t}
              active={t.id === activeId}
              onPick={() => {
                setActiveCourse(t.id);
                onDone();
              }}
            />
          ))}
        </div>
      </>
    );
  }

  // ---- step two: varieties ----
  if (at.language) {
    const language = at.language;
    const group = groups.find((g) => g.language.id === language.id)!;
    return (
      <>
        <Crumb onBack={() => setAt({})}>{language.name}</Crumb>
        <div className="stack">
          {group.varieties.map((v) => (
            <VarietyCard
              key={v.id}
              variety={v}
              activeTrackId={activeId}
              onPick={() => pickVariety(language, v)}
            />
          ))}
        </div>
      </>
    );
  }

  // ---- step one: languages ----
  return (
    <>
      <p className="small muted" style={{ margin: "0 0 12px", lineHeight: 1.6 }}>
        Choose a language, then a variety of it, then a track. Each track keeps its own path,
        vocabulary and review queue; your streak and XP are shared.
      </p>
      <div className="stack">
        {groups.map((g) => (
          <LanguageCard
            key={g.language.id}
            language={g.language}
            varieties={g.varieties}
            activeTrackId={activeId}
            onPick={() => setAt({ language: g.language })}
          />
        ))}
      </div>
    </>
  );
}

/** Back link plus where you are, shown above steps two and three. */
function Crumb({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        className="btn btn--ghost"
        style={{ minHeight: 0, padding: "4px 10px" }}
        onClick={onBack}
      >
        <span aria-hidden>‹</span> Back
      </button>
      <div className="small muted" style={{ marginTop: 6 }}>
        {children}
      </div>
    </div>
  );
}

export function CourseScreen() {
  const navigate = useNavigate();
  return (
    <div className="screen">
      <TopBar left={<span className="small">Courses</span>} />
      <div className="pad">
        <CoursePicker onDone={() => navigate("/")} />
      </div>
    </div>
  );
}

/** The same two-step chooser, in a sheet, for the path screen header. */
export function CourseSwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <Sheet open={open} onClose={onClose} title="Choose a course">
      <h2 className="title h2" style={{ marginBottom: 10 }}>
        Choose a course
      </h2>
      <CoursePicker
        onDone={() => {
          onClose();
          navigate("/");
        }}
      />
    </Sheet>
  );
}
