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
  deleteDoc,
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
import type { AppUser, DataService, PlayerProfile } from './dataService';

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
const profileDoc = (nameKey: string) => doc(db!, 'playerProfiles', nameKey);
const handleDoc = (handle: string) => doc(db!, 'handles', handle);

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

  async deleteMatch(id) {
    await deleteDoc(matchDoc(id));
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

  async listAllMatches() {
    const snap = await getDocs(collection(db!, 'matches'));
    const matches: Match[] = [];
    snap.forEach((d) => matches.push(d.data() as Match));
    return matches.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getPlayerProfile(nameKey) {
    const snap = await getDoc(profileDoc(nameKey));
    return snap.exists() ? (snap.data() as PlayerProfile) : null;
  },

  async isHandleAvailable(handle) {
    const snap = await getDoc(handleDoc(handle));
    return !snap.exists();
  },

  async claimPlayerProfile(nameKey, displayName, handle, uid) {
    const profile: PlayerProfile = { nameKey, name: displayName, handle, claimedByUid: uid, claimedAt: Date.now() };
    await setDoc(handleDoc(handle), { uid, claimedAt: profile.claimedAt });
    await setDoc(profileDoc(nameKey), profile as DocumentData);
  },
};
