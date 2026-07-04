// Shared between StarfieldBackground.astro (advances the count and reveals the
// clues) and SecretConsole.astro (reads it, to have the gatekeeper acknowledge
// a player who followed the star clues here).
//
// `progress` = number of completed mini-game rounds (trophies), 0..PROGRESS_MAX.
// It is the only persisted mini-game value; the score tally (game.total) stays
// in-memory. This is NOT security -- editing it in storage only spoils your own
// clue hunt; the /divine-lore/ gate verifies its own token independently.
export const CLUE_STORAGE_KEY = 'starfieldProgress';
export const PROGRESS_MAX = 10; // no reason to count rounds past the last reward

// Clamped read. try/catch guards Safari private mode (localStorage throws on
// access) -- same pattern as SecretConsole's penalty store.
export function loadProgress(): number {
  try {
    const n = parseInt(localStorage.getItem(CLUE_STORAGE_KEY) ?? '', 10);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, PROGRESS_MAX);
  } catch {
    return 0;
  }
}

export function saveProgress(n: number): void {
  try {
    localStorage.setItem(CLUE_STORAGE_KEY, String(n));
  } catch {
    // private mode / storage disabled: progress just won't survive refresh
  }
}
