// ---------------------------------------------------------------------------
// Matches a user joined via share code but doesn't own. Kept client-side
// (localStorage) so they keep showing up on that user's Home screen.
// ---------------------------------------------------------------------------

const key = (uid: string) => `mo:followed:${uid}`;

export function getFollowedIds(uid: string): string[] {
  try {
    const raw = localStorage.getItem(key(uid));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addFollowedId(uid: string, matchId: string): void {
  const ids = getFollowedIds(uid).filter((id) => id !== matchId);
  ids.unshift(matchId);
  localStorage.setItem(key(uid), JSON.stringify(ids.slice(0, 50)));
}

export function removeFollowedId(uid: string, matchId: string): void {
  const ids = getFollowedIds(uid).filter((id) => id !== matchId);
  localStorage.setItem(key(uid), JSON.stringify(ids));
}
