import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { courses, setActiveCourse, type Course } from "@/content/course";
import { contentFor, hasContent } from "@/content";
import { useActiveCourseId } from "@/state/useCourse";
import { getDueCounts, getProgress } from "@/db/repo";
import { Sheet, TopBar } from "@/components/ui";
import { ScriptWord } from "@/components/ScriptWord";

/**
 * Course picker (D1: Hebrew, Koine and Attic are peers, not tracks).
 *
 * Progress is per course; the streak and XP shown elsewhere are global (D2), so
 * this screen deliberately reports only what actually differs between courses.
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

  // A word in the course's own script, so the card shows what you'd be reading.
  const sample = available ? contentFor(course.id).words[0] : undefined;

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
        {sample && (
          <ScriptWord word={sample.text} size={26} showHighlight={false} course={course} />
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

export function CourseScreen() {
  const navigate = useNavigate();
  const activeId = useActiveCourseId();

  const pick = (course: Course) => {
    setActiveCourse(course.id);
    navigate("/");
  };

  return (
    <div className="screen">
      <TopBar left={<span className="small">Courses</span>} />
      <div className="pad stack">
        <p className="small muted" style={{ margin: 0, lineHeight: 1.6 }}>
          Each course keeps its own path, vocabulary and review queue. Your streak and XP are
          shared across all of them.
        </p>
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} active={c.id === activeId} onPick={() => pick(c)} />
        ))}
      </div>
    </div>
  );
}

/** Compact switcher for the path screen header. */
export function CourseSwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const activeId = useActiveCourseId();

  return (
    <Sheet open={open} onClose={onClose} title="Switch course">
      <h2 className="title h2">Switch course</h2>
      <div className="stack" style={{ marginTop: 12 }}>
        {courses.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            active={c.id === activeId}
            onPick={() => {
              setActiveCourse(c.id);
              onClose();
              navigate("/");
            }}
          />
        ))}
      </div>
    </Sheet>
  );
}
