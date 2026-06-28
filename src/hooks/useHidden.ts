// ---------------------------------------------------------------------------
// Teams/players are embedded in match documents, not standalone records, so
// "deleting" one from Home can only mean "stop suggesting/showing it for me".
// Tracked client-side (localStorage) as a per-user exclude-list.
// ---------------------------------------------------------------------------

const norm = (s: string) => s.trim().toLowerCase();

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...set]));
}

const teamsKey = (uid: string) => `mo:hidden-teams:${uid}`;
const playersKey = (uid: string) => `mo:hidden-players:${uid}`;

export function isTeamHidden(uid: string, name: string): boolean {
  return readSet(teamsKey(uid)).has(norm(name));
}

export function hideTeam(uid: string, name: string): void {
  const set = readSet(teamsKey(uid));
  set.add(norm(name));
  writeSet(teamsKey(uid), set);
}

export function isPlayerHidden(uid: string, name: string): boolean {
  return readSet(playersKey(uid)).has(norm(name));
}

export function hidePlayer(uid: string, name: string): void {
  const set = readSet(playersKey(uid));
  set.add(norm(name));
  writeSet(playersKey(uid), set);
}
