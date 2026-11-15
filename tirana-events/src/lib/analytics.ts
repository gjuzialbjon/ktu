import { createLogger } from './log';

const log = createLogger('analytics');

/**
 * Analytics boundary. v1 logs locally; swap the body for PostHog capture later.
 * Tag data is logged from day one so future recommendations have history.
 */
export function track(event: string, props?: Record<string, unknown>): void {
  log.debug(event, props ?? {});
  // TODO(posthog): posthog.capture(event, props)
}
