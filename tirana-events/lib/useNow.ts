import { useEffect, useState } from 'react';

/**
 * The current time as React state, refreshed on an interval. Components read
 * this instead of calling Date.now() during render, which keeps renders pure
 * and lets "Tonight" roll over to tomorrow while the app stays open.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
