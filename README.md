# CricUpdate

A simple, ad-free, low-friction cricket match organizer & live scorer. Spin up a
casual or corporate match, do an animated toss, and score it **ball by ball** —
with the real-world quirks (configurable wides/no-balls, gender-based wide rules,
mid-match player changes, and correcting the last entry).

> **Phase 1 — UI-first build with mock data.** "Continue with Google" is faked and
> matches live in `localStorage`. The data layer sits behind a single
> `dataService` interface so a real Firebase backend (Auth + Firestore) can be
> swapped in later with no UI changes.

## Stack
- **React + TypeScript + Vite**, installable **PWA**
- **Tailwind CSS** — dense, divider-based dark UI (GitHub/Linear-inspired:
  `#0D1117` background, `#161B22` surface, `#2F81F7` accent), compact type,
  44px controls, no gradients/shadows
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
