import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { syncState, sync, type SyncState } from "@/sync/sync";
import { useSession } from "@/state/session";

export function useSyncState(): SyncState {
  const [state, setState] = useState(syncState.get());
  useEffect(() => syncState.subscribe(setState), []);
  return state;
}

/**
 * A quiet status line, not a modal.
 *
 * Offline is a normal state for this app, so it is reported as information
 * ("saved on this device") rather than as an error the learner must resolve.
 */
export function SyncIndicator() {
  const state = useSyncState();
  const user = useSession((s) => s.user);

  if (!user) {
    return (
      <div className="pad-x" style={{ marginTop: 12 }}>
        <Link
          to="/auth"
          className="banner banner--info"
          style={{ textDecoration: "none", display: "flex" }}
        >
          <span>💾</span>
          <span>
            Progress is saved on this device only. <strong>Create an account</strong> to sync it.
          </span>
        </Link>
      </div>
    );
  }

  if (state.status === "offline") {
    return (
      <div className="pad-x" style={{ marginTop: 12 }}>
        <div className="banner banner--warn">
          <span>📴</span>
          <span>
            Offline — everything still works.
            {state.pendingCount > 0 && ` ${state.pendingCount} review(s) will sync later.`}
          </span>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="pad-x" style={{ marginTop: 12 }}>
        <div className="banner banner--error">
          <span>⚠️</span>
          <span>Sync failed. Your progress is safe on this device.</span>
          <button className="btn btn--ghost" style={{ minHeight: 0 }} onClick={() => void sync()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return null;
}
