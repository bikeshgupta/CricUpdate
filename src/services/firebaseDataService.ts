// ---------------------------------------------------------------------------
// Real backend: Firebase Auth (Google) + Firestore (storage + live sync).
// Implements the same DataService contract as the mock, so the UI is unchanged.
// ---------------------------------------------------------------------------

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { Match } from '../scoring/types';
import type { AppUser, DataService } from './dataService';

function mapUser(u: User | null): AppUser | null {
  if (!u) return null;
  return {
    uid: u.uid,
    name: u.displayName ?? u.email?.split('@')[0] ?? 'Player',
    email: u.email ?? undefined,
    photoURL: u.photoURL ?? undefined,
    isAnonymous: u.isAnonymous,
  };
}

const matchDoc = (id: string) => doc(db!, 'matches', id);

export const firebaseDataService: DataService = {
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth!, provider);
    return mapUser(result.user)!;
  },

  async signOut() {
    await fbSignOut(auth!);
  },

  getCurrentUser() {
    return mapUser(auth!.currentUser);
  },

  onAuthChange(cb) {
    return onAuthStateChanged(auth!, (u) => cb(mapUser(u)));
  },

  async createMatch(match) {
    await setDoc(matchDoc(match.id), match as DocumentData);
  },

  async getMatch(id) {
    const snap = await getDoc(matchDoc(id));
    return snap.exists() ? (snap.data() as Match) : null;
  },

  async updateMatch(match) {
    await setDoc(matchDoc(match.id), match as DocumentData);
  },

  subscribeMatch(id, cb) {
    return onSnapshot(
      matchDoc(id),
      (snap) => cb(snap.exists() ? (snap.data() as Match) : null),
      () => cb(null),
    );
  },

  async listMyMatches(uid) {
    const q = query(collection(db!, 'matches'), where('ownerUid', '==', uid));
    const snap = await getDocs(q);
    const matches: Match[] = [];
    snap.forEach((d) => matches.push(d.data() as Match));
    return matches.sort((a, b) => b.createdAt - a.createdAt);
  },
};
