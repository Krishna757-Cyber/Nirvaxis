import { useCallback, useEffect, useState } from 'react';

/** Eased count-up that re-runs whenever `target` changes. */
export function useCountUp(target: number, active: boolean, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(2, -6 * p);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

/** Clipboard copy with transient success state. */
export function useCopied(timeout = 1600): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    (text: string) => {
      try {
        navigator.clipboard?.writeText(text);
      } catch {
        /* clipboard unavailable */
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), timeout);
    },
    [timeout],
  );
  return [copied, copy];
}
