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

// The active provider. Swap this import for `firebaseDataService` later.
import { mockDataService } from './mockDataService';

export const dataService: DataService = mockDataService;
