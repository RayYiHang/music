/**
 * True when this bundle runs in the desktop-lyrics window (`#/desktoplyrics`).
 *
 * The lyrics window loads the same React bundle as the main window. It is a
 * read-only consumer of player state pushed over IPC (SyncProgress / Play /
 * Pause): it must not create its own audio element, run FM/network init,
 * persist player state to localStorage (it would race with the main
 * window's writes), or echo IPC events back to the main process.
 *
 * Computed once at module load — location.hash never changes for a given
 * window instance (the main window opens at `/`, the lyrics window at
 * `#/desktoplyrics`).
 */
export const isLyricsWindow =
  typeof window !== 'undefined' && window.location?.hash?.startsWith('#/desktoplyrics')
