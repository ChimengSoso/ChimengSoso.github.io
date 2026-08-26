// Shared between SecretConsole.astro (issues the token after a real
// anagram+"chi" login) and divine-lore.astro (verifies it before rendering).
// This is not real security -- it's a static site, so anyone reading the
// bundled JS can reproduce this function -- it just raises the bar from
// "paste one obvious sessionStorage command" to "read the source, understand
// the checksum, and satisfy the same 'chi' constraint as the real puzzle."
export const TOKEN_KEY = 'divineLoreToken';

// The session token above dies with the tab. This one remembers that the puzzle
// was solved at least once, so the home page can keep offering the doors behind
// it (the games section) on later visits without making the player solve it again.
// Same "not real security" caveat: every hidden page is reachable by URL anyway,
// the divine-lore listing being the one deliberate checkpoint.
export const UNLOCKED_KEY = 'divineLoreUnlocked';

function checksum(payload: string): string {
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash * 33) ^ payload.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

export function createToken(username: string): string {
  const payload = username.trim().toLowerCase();
  return `${payload}.${checksum(payload)}`;
}

/** Remember across sessions that this browser solved the console puzzle. */
export function rememberUnlocked(username: string): void {
  try {
    localStorage.setItem(UNLOCKED_KEY, createToken(username));
  } catch {
    // Private mode or a storage-blocked browser: the door just stays hidden.
  }
}

/** Has this browser ever solved the puzzle? Verified with the same checksum. */
export function hasEverUnlocked(): boolean {
  try {
    return isValidToken(localStorage.getItem(UNLOCKED_KEY));
  } catch {
    return false;
  }
}

export function isValidToken(token: string | null): boolean {
  if (!token) return false;
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const providedChecksum = token.slice(dotIndex + 1);
  if (!payload.includes('chi')) return false;
  return checksum(payload) === providedChecksum;
}
