import { unpackStore, writeStore } from './obfuscate';

// Shared between StarfieldBackground.astro (advances the count and reveals the
// clues) and SecretConsole.astro (reads it, to have the gatekeeper acknowledge
// a player who followed the star clues here).
//
// `progress` = number of completed mini-game rounds (trophies), 0..PROGRESS_MAX.
// It is the only persisted mini-game value; the score tally (game.total) stays
// in-memory. This is NOT security -- editing it in storage only spoils your own
// clue hunt; the /divine-lore/ gate verifies its own token independently.
export const CLUE_STORAGE_KEY = 'starfieldProgress';
/** Namespace for the obfuscated wrapper around the stored value. */
export const CLUE_STORAGE_NS = 'starClues';
export const PROGRESS_MAX = 10; // no reason to count rounds past the last reward

// Clamped read. try/catch guards Safari private mode (localStorage throws on
// access) -- same pattern as SecretConsole's penalty store.
export function loadProgress(): number {
  let raw: string | null;
  try {
    raw = localStorage.getItem(CLUE_STORAGE_KEY);
  } catch {
    return 0;
  }
  // Counts written before the wrapper existed were a bare number; still accepted
  // so nobody's trophy count resets, and the next save rewrites it wrapped.
  const text = unpackStore(CLUE_STORAGE_NS, raw) ?? (raw !== null && /^\d+$/.test(raw.trim()) ? raw : null);
  const n = parseInt(text ?? '', 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, PROGRESS_MAX);
}

export function saveProgress(n: number): void {
  writeStore(CLUE_STORAGE_NS, CLUE_STORAGE_KEY, String(n));
}
