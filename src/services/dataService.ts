// ---------------------------------------------------------------------------
// The single contract the whole UI talks to. Backed by Firebase (Auth +
// Firestore onSnapshot). `backendReady` is true only when the VITE_FIREBASE_*
// env vars are configured; the app shows a setup notice otherwise.
// ---------------------------------------------------------------------------

import type { Match, Rsvp, Squad, Tournament } from '../scoring/types';

export interface AppUser {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  isAnonymous: boolean;
}

export interface DataService {
  // --- auth (Google) ---
  signInWithGoogle(): Promise<AppUser>;
  signOut(): Promise<void>;
  getCurrentUser(): AppUser | null;
  onAuthChange(cb: (user: AppUser | null) => void): () => void;

  // --- matches ---
  createMatch(match: Match): Promise<void>;
  getMatch(id: string): Promise<Match | null>;
  updateMatch(match: Match): Promise<void>;
  deleteMatch(id: string): Promise<void>;
  /** Live subscription. Returns an unsubscribe fn. */
  subscribeMatch(id: string, cb: (match: Match | null) => void): () => void;
  listMyMatches(uid: string): Promise<Match[]>;
  /** Every match in the app — backs the public player-stats directory. */
  listAllMatches(): Promise<Match[]>;

  // --- player profiles (claimable stat cards) ---
  getPlayerProfile(nameKey: string): Promise<PlayerProfile | null>;
  isHandleAvailable(handle: string): Promise<boolean>;
  claimPlayerProfile(nameKey: string, displayName: string, handle: string, uid: string): Promise<void>;

  // --- squads (reusable player pools) ---
  createSquad(squad: Squad): Promise<void>;
  updateSquad(squad: Squad): Promise<void>;
  deleteSquad(id: string): Promise<void>;
  listMySquads(uid: string): Promise<Squad[]>;

  // --- tournaments ---
  createTournament(tournament: Tournament): Promise<void>;
  getTournament(id: string): Promise<Tournament | null>;
  updateTournament(tournament: Tournament): Promise<void>;
  listMyTournaments(uid: string): Promise<Tournament[]>;
  /** Matches tagged with this tournament, newest first. */
  listMatchesByTournament(tournamentId: string): Promise<Match[]>;

  // --- RSVPs (against a 'planning' match) ---
  addRsvp(rsvp: Rsvp): Promise<void>;
  /** Live subscription, oldest first. Returns an unsubscribe fn. */
  subscribeRsvps(matchId: string, cb: (rsvps: Rsvp[]) => void): () => void;
}

export interface PlayerProfile {
  nameKey: string;
  name: string;
  handle: string;
  claimedByUid: string;
  claimedAt: number;
}

import { firebaseEnabled } from '../firebase/config';
import { firebaseDataService } from './firebaseDataService';

/** True when Firebase is configured (VITE_FIREBASE_* env vars present). */
export const backendReady = firebaseEnabled;

export const dataService: DataService = firebaseDataService;
