/**
 * One place for diagnostics. Every message carries a scope ("store", "share", …)
 * so a dev console can be filtered, and every caught error goes through
 * `log.error`, which is the single hook for a crash reporter (Sentry) later.
 *
 *   const log = createLogger('store');
 *   log.warn('dropped corrupt key', { key });
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (msg: string, data?: unknown) => void;
  info: (msg: string, data?: unknown) => void;
  warn: (msg: string, data?: unknown) => void;
  error: (msg: string, error?: unknown, data?: unknown) => void;
}

/** Replaced in production by a crash reporter; tests can swap it to assert on errors. */
let reporter: (scope: string, msg: string, error: unknown, data?: unknown) => void = () => {};

export function setErrorReporter(fn: typeof reporter): void {
  reporter = fn;
}

function emit(level: Level, scope: string, msg: string, extra: unknown[]): void {
  if (!__DEV__ && level === 'debug') return;
  const line = `[${scope}] ${msg}`;
  const args = extra.filter((x) => x !== undefined);
  (level === 'debug' ? console.log : console[level])(line, ...args);
}

export function createLogger(scope: string): Logger {
  return {
    debug: (msg, data) => emit('debug', scope, msg, [data]),
    info: (msg, data) => emit('info', scope, msg, [data]),
    warn: (msg, data) => emit('warn', scope, msg, [data]),
    error: (msg, error, data) => {
      emit('error', scope, msg, [error, data]);
      reporter(scope, msg, error, data);
    },
  };
}
