# MatchOn — by SymPal games

A clean, ad-free, low-friction cricket match organizer & live scorer. Spin up a
casual or corporate match, do the toss, and score it **ball by ball** — with the
real-world quirks (configurable wides/no-balls, mid-match player changes, and
correcting the last entry) — then share a live link anyone can follow.

> **Backend:** real **Firebase** (Google sign-in + Firestore + live `onSnapshot`)
> when `VITE_FIREBASE_*` env vars are set; otherwise an in-memory mock so local
> development works with no setup. Both sit behind one `dataService` interface, so
> the UI never changes. See **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**.

## Stack
- **React + TypeScript + Vite**, installable **PWA**
- **Firebase** — Auth (Google), Firestore storage, real-time live sharing
- **Tailwind CSS** — dense, divider-based dark UI (`#0D1117` bg, `#161B22`
  surface, teal `#16A085` accent), compact type, no gradients/shadows
- **Framer Motion** — subtle 150ms fade/slide transitions, coin-flip toss
- **Zustand** — match state; **Vitest** — scoring-engine tests

## Architecture
The heart is a **pure scoring engine** (`src/scoring/`). The authoritative data is
an append-only `BallEvent[]` log; the full scorecard is *derived* by replaying it
(`computeInnings`). This keeps every cricket rule in one tested place and makes
**edit-last-ball** and **undo** trivial — just change the array and recompute.

```
src/
  scoring/    types, engine (computeInnings), match helpers, engine.test.ts
  services/   dataService interface + mockDataService (localStorage, faked auth)
  mocks/      dummy user + sample matches (delete when Firebase lands)
  store/      authStore, matchStore (records balls, edit/undo, transitions)
  components/ Scorecard, ScoringPad, CoinToss, TossFlow, Summary, …
  screens/    Login, Home, MatchSetup, LiveMatch
```

## Develop
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # scoring engine unit tests
npm run build    # type-check + production build
```

## Features
- Add two teams + players (name + gents/ladies category), set overs and rules
- Animated toss → choose bat/bowl → pick openers & bowler
- Ball-by-ball scoring: runs, wides, no-balls, byes, leg-byes, all wicket types
- Configurable rules: wide/no-ball runs, re-bowl, free hit, **no runs on wide for
  ladies**, allow running on wides
- Correct the last delivery, undo, add a late player, swap batter/bowler
- Full two-innings match with chase target, required run rate, and auto result
- Live match scorecard + shareable `/match/{id}` link (real cross-tab live updates
  in this mock; cross-device arrives with the cloud backend)

## Later pass — Firebase
Implement `src/services/firebaseDataService.ts` against the same `DataService`
interface (Auth + Firestore `onSnapshot`), point `dataService` at it, delete the
mocks, and add real Google sign-in + match-creation gating and Firestore rules
(public read, owner-only write).
