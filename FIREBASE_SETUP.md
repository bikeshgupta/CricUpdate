# MatchOn — Firebase setup

MatchOn uses Firebase for **Google sign-in**, **Firestore storage**, and
**real-time live score sharing**. The app requires these env vars — until they are
set it shows a short "configure Firebase" notice instead of the app.

## 1. Create a Firebase project
1. Go to <https://console.firebase.google.com> → **Add project**.
2. In the project, open **Build → Authentication → Get started**, then enable the
   **Google** sign-in provider and set a support email.
3. Open **Build → Firestore Database → Create database** (Production mode, pick a
   region).

## 2. Register a Web app
1. Project settings (gear) → **Your apps** → **Web (`</>`)** → register the app.
2. Copy the `firebaseConfig` values into a local `.env` file (see `.env.example`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> `VITE_*` values are embedded in the client bundle — that is expected for
> Firebase web apps. Access is controlled by the Firestore security rules, not by
> hiding the API key.

## 3. Deploy security rules
The rules in `firestore.rules` make matches publicly readable (so share links work
for anyone) while only the owner can write:

```bash
npm i -g firebase-tools
firebase login
firebase use --add        # select your project
firebase deploy --only firestore:rules
```

## 4. Run / deploy
```bash
npm run dev               # local, now using real Firebase
npm run build
firebase deploy --only hosting     # serves dist/ at https://<project>.web.app
```

## 5. Authorized domains
In **Authentication → Settings → Authorized domains**, ensure `localhost` and your
hosting domain (`<project>.web.app`) are listed so Google sign-in popups work.

## How live sharing works
Each match is one Firestore document at `matches/{id}`. The scorer writes a ball;
every viewer subscribed via `onSnapshot` to that document (by opening
`/match/{id}`) receives the update instantly — no refresh, across devices.
