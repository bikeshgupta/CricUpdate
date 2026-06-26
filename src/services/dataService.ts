// ---------------------------------------------------------------------------
// The single contract the whole UI talks to. Today it is backed by an in-memory
// / localStorage mock (`mockDataService`). Later, a `firebaseDataService` can
// implement this same interface (Auth + Firestore onSnapshot) and the provider
// swap is a one-liner — no UI changes.
// ---------------------------------------------------------------------------

import type { Match } from '../scoring/types';

export interface AppUser {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  isAnonymous: boolean;
}

export interface DataService {
  // --- auth (faked for now: one click signs in a dummy user) ---
  signInWithGoogle(): Promise<AppUser>;
  signOut(): Promise<void>;
  getCurrentUser(): AppUser | null;
  onAuthChange(cb: (user: AppUser | null) => void): () => void;

  // --- matches ---
  createMatch(match: Match): Promise<void>;
  getMatch(id: string): Promise<Match | null>;
  updateMatch(match: Match): Promise<void>;
  /** Live subscription. Returns an unsubscribe fn. */
  subscribeMatch(id: string, cb: (match: Match | null) => void): () => void;
  listMyMatches(uid: string): Promise<Match[]>;
}

// Provider auto-selection: use real Firebase when VITE_FIREBASE_* env vars are
// configured, otherwise fall back to the in-memory mock (local demo).
import { firebaseEnabled } from '../firebase/config';
import { mockDataService } from './mockDataService';
import { firebaseDataService } from './firebaseDataService';

export const usingFirebase = firebaseEnabled;

export const dataService: DataService = firebaseEnabled ? firebaseDataService : mockDataService;
