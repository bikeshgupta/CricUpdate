// ---------------------------------------------------------------------------
// MOCK data service — UI-first build with no real backend.
//
//  * "Continue with Google" is faked: one call signs in a fixed dummy user.
//  * Matches live in localStorage so a reload restores state.
//  * subscribeMatch uses BroadcastChannel + storage events, so opening the same
//    match link in a second tab gives *real* live ball-by-ball updates — a
//    faithful preview of the eventual Firestore behaviour.
//
// Everything here is isolated and disposable: when Firebase is wired in, delete
// this file + src/mocks and point dataService at firebaseDataService.
// ---------------------------------------------------------------------------

import type { Match } from '../scoring/types';
import type { AppUser, DataService } from './dataService';
import { sampleMatches, DUMMY_USER } from '../mocks/sampleData';

const USER_KEY = 'cricupdate:user';
const MATCH_PREFIX = 'cricupdate:match:';
const SEED_KEY = 'cricupdate:seeded';

const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cricupdate') : null;

function matchKey(id: string) {
  return MATCH_PREFIX + id;
}

function readMatch(id: string): Match | null {
  const raw = localStorage.getItem(matchKey(id));
  return raw ? (JSON.parse(raw) as Match) : null;
}

function writeMatch(match: Match) {
  localStorage.setItem(matchKey(match.id), JSON.stringify(match));
  channel?.postMessage({ type: 'match', id: match.id });
}

function seedOnce() {
  if (localStorage.getItem(SEED_KEY)) return;
  for (const m of sampleMatches) writeMatch(m);
  localStorage.setItem(SEED_KEY, '1');
}

const authListeners = new Set<(u: AppUser | null) => void>();

function currentUser(): AppUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AppUser) : null;
}

export const mockDataService: DataService = {
  async signInWithGoogle() {
    seedOnce();
    localStorage.setItem(USER_KEY, JSON.stringify(DUMMY_USER));
    authListeners.forEach((cb) => cb(DUMMY_USER));
    return DUMMY_USER;
  },

  async signOut() {
    localStorage.removeItem(USER_KEY);
    authListeners.forEach((cb) => cb(null));
  },

  getCurrentUser() {
    return currentUser();
  },

  onAuthChange(cb) {
    authListeners.add(cb);
    cb(currentUser());
    return () => authListeners.delete(cb);
  },

  async createMatch(match) {
    writeMatch(match);
  },

  async getMatch(id) {
    seedOnce();
    return readMatch(id);
  },

  async updateMatch(match) {
    writeMatch(match);
  },

  subscribeMatch(id, cb) {
    // Seed demo matches so a shared link resolves even in a fresh browser.
    seedOnce();
    cb(readMatch(id));

    const onChannel = (e: MessageEvent) => {
      if (e.data?.type === 'match' && e.data.id === id) cb(readMatch(id));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === matchKey(id)) cb(readMatch(id));
    };
    channel?.addEventListener('message', onChannel);
    window.addEventListener('storage', onStorage);
    return () => {
      channel?.removeEventListener('message', onChannel);
      window.removeEventListener('storage', onStorage);
    };
  },

  async listMyMatches(uid) {
    seedOnce();
    const matches: Match[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(MATCH_PREFIX)) {
        const m = JSON.parse(localStorage.getItem(key)!) as Match;
        if (m.ownerUid === uid) matches.push(m);
      }
    }
    return matches.sort((a, b) => b.createdAt - a.createdAt);
  },
};
