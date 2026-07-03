// Shared between SecretConsole.astro (issues the token after a real
// anagram+"chi" login) and divine-lore.astro (verifies it before rendering).
// This is not real security -- it's a static site, so anyone reading the
// bundled JS can reproduce this function -- it just raises the bar from
// "paste one obvious sessionStorage command" to "read the source, understand
// the checksum, and satisfy the same 'chi' constraint as the real puzzle."
export const TOKEN_KEY = 'divineLoreToken';

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

export function isValidToken(token: string | null): boolean {
  if (!token) return false;
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const providedChecksum = token.slice(dotIndex + 1);
  if (!payload.includes('chi')) return false;
  return checksum(payload) === providedChecksum;
}
