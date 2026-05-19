// =============================================================================
// src/lib/logger.ts
// =============================================================================
// Centralized application logger. Gates every output on `import.meta.env.DEV`
// so production builds stay quiet by default.
//
// Why a wrapper instead of bare `console.*`:
//   1. **Production quiet**: bare console calls leak debug info to end-user
//      dev tools and waste bandwidth on serialization.
//   2. **Single integration point**: when we wire Sentry / LogRocket /
//      whatever error-tracking service, only this file changes. Every
//      consumer just keeps calling `log.error("...")`.
//   3. **Searchable**: greppable by name (`log.error`) without false
//      positives on documentation that mentions `console.error`.
//
// Convention:
//   - `error`  — unexpected failures the user should know about (toast)
//   - `warn`   — recoverable anomalies, dev sentinels (e.g. auth fallback)
//   - `info`   — high-signal trace points (audit logs, mutation previews)
//   - `debug`  — low-level diagnostics (state dumps, render counts)
//
// Future: route `error` calls through Sentry while keeping the bare
// console output for local debugging.
// =============================================================================

const isDev = import.meta.env.DEV;

export const log = {
  error: (...args: unknown[]): void => {
    if (isDev) {
      console.error(...args);
    }
    // TODO: pipe through Sentry/LogRocket here once we wire it.
  },
  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console -- the wrapper IS the
      // sanctioned place to bridge dev-time console.info usage.
      console.info(...args);
    }
  },
  debug: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console -- same as info above.
      console.debug(...args);
    }
  },
};
