import { Link } from "react-router-dom";
import { Empty, TopBar } from "@/components/ui";
import { gamesByLanguage, type GameMeta } from "./registry";
import { useGameProgress } from "./progress";

/**
 * The games gallery.
 *
 * Grouped by LANGUAGE rather than by track, because a Greek drill on the
 * article is worth playing whether you arrived from Mark or from Attic prose.
 * A learner's active track does not filter this list and is not meant to.
 *
 * The line under the heading is doing real work. Everything else in the app
 * feeds the review queue; these do not, and a player who assumes otherwise
 * would be quietly wasting study time. Saying so once, plainly, is cheaper than
 * a badge on every card.
 */
export function GamesScreen() {
  const groups = gamesByLanguage();

  return (
    <div className="screen">
      <TopBar left={<span className="small">Games</span>} />
      <div className="pad stack">
        <p className="small muted" style={{ lineHeight: 1.6, margin: 0 }}>
          Play anything, any time — nothing here is locked behind a lesson. These sit outside the
          review queue: they will not schedule cards or move your due count.
        </p>

        {groups.length === 0 ? (
          <Empty icon="🎲" title="No games yet" hint="They will appear here as they are added." />
        ) : (
          groups.map((g) => (
            <section key={g.language} className="stack" style={{ gap: 8 }}>
              <span className="label">{g.label}</span>
              {g.games.map((game) => (
                <GameTile key={game.id} game={game} />
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * One card in the gallery.
 *
 * Split out from the list purely because it now reads progress, and a hook
 * cannot be called inside a map.
 */
function GameTile({ game }: { game: GameMeta }) {
  const progress = useGameProgress(game.id);

  /*
   * Three states, and the middle one is the whole reason this exists: a player
   * who stopped halfway should see WHERE they stopped from the gallery, before
   * committing to opening the game.
   *
   * `null` renders nothing rather than "not started" — the read is a tick or
   * two away and flashing the wrong state at somebody who finished the game is
   * worse than showing the line a moment late.
   */
  /*
   * Order matters, and the obvious order is wrong. Checking `completed` first
   * would hide a replay in progress behind a tick; checking `furthest` first
   * showed "5 of 5 verses" to somebody who had just finished, because the
   * counter sits at the end until they start again. Mid-run wins, then the
   * tick, then nothing.
   */
  const total = game.count;
  const midRun =
    progress !== null && total !== undefined && progress.furthest > 0 && progress.furthest < total;
  const status =
    progress === null
      ? null
      : midRun
        ? `${progress.furthest} of ${total} ${game.countUnit}${progress.furthest === 1 ? "" : "s"}`
        : progress.completed
          ? "finished"
          : null;

  return (
    <Link to={game.path} className="card game-tile">
      <span className="game-tile__icon" aria-hidden>
        {game.icon}
      </span>
      <span className="game-tile__body">
        <span className="game-tile__head">
          <span className="game-tile__name">{game.title}</span>
          {game.scriptTitle && (
            // Script and language follow the game, not the tile — a Hebrew
            // title set in the Greek stack and announced as Greek is wrong
            // twice over.
            <span
              className={`game-tile__script game-tile__script--${game.language}`}
              lang={game.language === "hebrew" ? "he" : "grc"}
              dir={game.language === "hebrew" ? "rtl" : undefined}
            >
              {game.scriptTitle}
            </span>
          )}
        </span>
        <span className="small muted game-tile__blurb">{game.blurb}</span>
        <span className="small muted game-tile__meta">
          {/* A game with no fixed length simply does not claim one. */}
          {game.count !== undefined && (
            <>
              {game.count} {game.countUnit}
              {game.count === 1 ? "" : "s"}
              {" · "}
            </>
          )}
          {game.source === "authored" ? "written for the game" : "drawn from the corpus"}
          {status && (
            <>
              {" · "}
              <span className="game-tile__status">
                {status === "finished" ? "✓ finished" : status}
              </span>
            </>
          )}
        </span>
      </span>
      <span className="muted" aria-hidden>
        ›
      </span>
    </Link>
  );
}
