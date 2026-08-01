# Shoresh — frontend

A mobile-first PWA for learning **Biblical** Hebrew through the triliteral root system.
Implements the client side of [`../spec.md`](../spec.md), Phases 1–8, against a **fully mocked API**.

```bash
npm install
npm run dev        # http://localhost:5173
```

No backend needed. The API is intercepted in-browser by MSW and answered by a stateful
mock server that persists to `localStorage`.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with the mock API |
| `npm run build` | Typecheck + production build |
| `npm test` | Full suite (214 tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run validate:content` | Content schema + root-index validation only |

---

## The one thing to understand first

Niqqud (Hebrew vowel points) are Unicode **combining marks**. They occupy their own code
points but belong to the consonant before them. Iterating a pointed word naively yields
marks as if they were letters, which silently misaligns every index-based operation.

The original prototype had this bug: `root: [0,1,2]` on בָּרָא highlighted **bet + qamats +
dagesh** instead of the root ב־ר־א.

Everything in this codebase indexes by **letter cluster**, never by code point
([`src/lib/hebrew.ts`](src/lib/hebrew.ts)). The content schema refuses to parse a word whose
root indices don't land on real consonants, and the content test asserts for all 44 words
that the highlighted letters are actually a subsequence of the declared root. That class of
error cannot reach a learner without failing the build.

---

## Architecture

```
src/
  lib/hebrew.ts        Letter clustering, niqqud stripping + fading. Read this first.
  srs/engine.ts        SM-2 scheduler. Pure functions, no clock, no storage.
  content/             Schema (zod) + 12 units, 44 words, 30 roots, 6 passages.
  api/                 types.ts is the wire contract; client.ts is the only fetch caller.
  mocks/               The fake backend. Delete this directory when the real API lands.
  db/                  Dexie (IndexedDB). Every UI read/write goes here, never to network.
  sync/                Delta sync: push events, pull derived state.
  features/            Screens, one directory per spec phase area.
```

### Local-first, sync-second

The UI never awaits the network. All reads and writes hit Dexie; sync is a background
reconciliation. If sync never runs, the app still works completely — that is what makes
offline real rather than aspirational.

### Event-sourced SRS (spec §5.2)

Card state is **derived**, never synced as a mutable object. The client pushes immutable
`ReviewLogEntry` events; the server derives card state from the full stream using the same
`deriveCard()` the client uses. Two devices reviewing offline converge instead of clobbering
each other, because there is no "which copy wins" decision to make.

On sync the client **adopts the server's derived cards, then replays its own unsynced events
on top**. This is what makes a reinstall work: a fresh device has no local log, so rebuilding
purely from local data would silently produce zero SRS state.

---

## Swapping in a real backend

1. Point `VITE_API_BASE_URL` at the real API.
2. Set `VITE_USE_MOCK_API=false` (or delete the `startMockServer()` call in
   [`src/main.tsx`](src/main.tsx)).
3. Delete `src/mocks/` and `public/mockServiceWorker.js`, and remove the `/dev` route.

No call site changes. [`src/api/types.ts`](src/api/types.ts) is the sole description of the
wire format — make the real API satisfy that file and the UI is unaffected. The mock handlers
are the reference behaviour for the sync endpoints in particular.

```bash
# .env.local
VITE_API_BASE_URL=https://api.example.com
VITE_USE_MOCK_API=false
```

### Endpoints the backend must provide

`POST /auth/{signup,login,oauth,refresh,logout}` · `GET|PATCH|DELETE /me` · `GET /me/export` ·
`POST /sync/review-logs` · `GET /sync/state` · `POST /sync/progress` · `GET /audio/manifest` ·
`GET /leagues/current` · `GET /gems` · `POST /gems/spend` · `POST /streak/freeze` ·
`GET /placement/test` · `POST /placement/submit` · `GET|POST|DELETE /decks` ·
`GET|POST /assessments` · `POST /notifications/subscribe` · `PATCH /notifications/prefs`

---

## Testing the unhappy paths

Visit **`/dev`** (also linked from Settings). It drives the mock server's simulated network:

- **Offline** — requests reject as a transport failure, so the client raises `NetworkError`
  and the UI shows "offline", not "error". Lessons and reviews keep working.
- **Latency** slider — makes loading states actually visible.
- **Failure rate** — random 503s to exercise retry and error handling.
- **Wipe this device** — clears IndexedDB. With an account, sync restores everything. This
  is the multi-device story in one button.

---

## Known trade-offs

**Service worker.** A page can only be controlled by one service worker per scope. While the
backend is mocked, that slot belongs to MSW's worker — that is what makes the API mocks real
HTTP interception rather than a stubbed client. The Workbox PWA service worker is configured
and built, but only registers when `VITE_ENABLE_PWA_SW=true`. The manifest, icons and install
metadata always ship. Offline still works because all state lives in Dexie, not in an
HTTP cache. **Once the real backend lands and `src/mocks/` is deleted, turn the flag on and
the precaching service worker takes over.**

**Audio is synthesised.** No recordings exist yet. The manifest fetch and per-word URLs go
through the API exactly as they will with a real CDN (so that data path is exercised now),
but playback falls back to the Web Speech API and is labelled as synthetic in the UI. The
pronunciation-variant selector is stored and sent, but does not yet change how anything
sounds.

**Icons are placeholders.** Generated procedurally (a stylised shin). Replace
`public/icons/*.png` before any real launch.

**Content needs a specialist's eye.** Root indices and referential integrity are
machine-verified, but judgement calls are not. See **Settings → Content provenance** in the
app, or `CONTENT_REVIEW_NOTES` in [`src/content/index.ts`](src/content/index.ts).

**Not a monorepo.** The spec calls for Turborepo with `packages/shared-types`,
`content-schema` and `srs-engine`. This is a single app as requested. Those three modules are
already isolated with no UI imports (`src/srs`, `src/content`, `src/api/types.ts`) so they can
be lifted into packages without refactoring.

---

## What is deliberately not here

Push notification **delivery** (needs VAPID keys and a server-side scheduled job) — the client
half is implemented: permission handling with the iOS install-first caveat, and local
notification display. LLM-based translation grading is out of scope per spec §4 Phase 8;
free-text grading is fuzzy matching that returns **uncertain** and asks the learner to
self-assess rather than risk mis-grading a defensible answer.
