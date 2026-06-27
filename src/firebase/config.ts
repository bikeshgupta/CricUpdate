// ---------------------------------------------------------------------------
// Firebase initialization. Driven entirely by Vite env vars (VITE_FIREBASE_*).
// When no config is present (e.g. local demo), `firebaseEnabled` is false and
// the app falls back to the in-memory mock data service — no crash.
// ---------------------------------------------------------------------------

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

if (firebaseEnabled) {
  app = initializeApp(config);
  authInstance = getAuth(app);
  dbInstance = initializeFirestore(app, {
    // Store match objects with optional fields (ball.shot, wicketType, …)
    // without stripping undefined by hand.
    ignoreUndefinedProperties: true,
    // Auto-detect when the default streaming transport is blocked (some mobile /
    // corporate networks) and fall back to long-polling, so onSnapshot live
    // updates keep flowing without a manual page refresh.
    experimentalAutoDetectLongPolling: true,
  });
}

export const auth = authInstance;
export const db = dbInstance;
