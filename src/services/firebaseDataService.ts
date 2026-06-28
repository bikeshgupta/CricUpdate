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
import type { Match, Squad, Tournament } from '../scoring/types';
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
const squadDoc = (id: string) => doc(db!, 'squads', id);
const tournamentDoc = (id: string) => doc(db!, 'tournaments', id);

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

  async createSquad(squad) {
    await setDoc(squadDoc(squad.id), squad as DocumentData);
  },

  async updateSquad(squad) {
    await setDoc(squadDoc(squad.id), squad as DocumentData);
  },

  async deleteSquad(id) {
    await deleteDoc(squadDoc(id));
  },

  async listMySquads(uid) {
    const q = query(collection(db!, 'squads'), where('ownerUid', '==', uid));
    const snap = await getDocs(q);
    const squads: Squad[] = [];
    snap.forEach((d) => squads.push(d.data() as Squad));
    return squads.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async createTournament(tournament) {
    await setDoc(tournamentDoc(tournament.id), tournament as DocumentData);
  },

  async getTournament(id) {
    const snap = await getDoc(tournamentDoc(id));
    return snap.exists() ? (snap.data() as Tournament) : null;
  },

  async updateTournament(tournament) {
    await setDoc(tournamentDoc(tournament.id), tournament as DocumentData);
  },

  async listMyTournaments(uid) {
    const q = query(collection(db!, 'tournaments'), where('ownerUid', '==', uid));
    const snap = await getDocs(q);
    const tournaments: Tournament[] = [];
    snap.forEach((d) => tournaments.push(d.data() as Tournament));
    return tournaments.sort((a, b) => b.createdAt - a.createdAt);
  },

  async listMatchesByTournament(tournamentId) {
    const q = query(collection(db!, 'matches'), where('tournamentId', '==', tournamentId));
    const snap = await getDocs(q);
    const matches: Match[] = [];
    snap.forEach((d) => matches.push(d.data() as Match));
    return matches.sort((a, b) => b.createdAt - a.createdAt);
  },
};
