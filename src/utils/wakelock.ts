export function wrapWithWakeLock<Args extends unknown[], T>(
  fn: (...a: Args) => Promise<T>,
) {
  return async (...a: Args) => {
    let wakeLock = null;

    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen').catch(() => {
        /* Do nothing */
      });
    }

    return fn(...a).finally(() => {
      wakeLock?.release().catch(() => {
        /* Do nothing */
      });
    });
  };
}
