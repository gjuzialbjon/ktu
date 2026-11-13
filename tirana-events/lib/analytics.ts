/**
 * Analytics boundary. v1 logs locally; swap `send` for PostHog capture later.
 * Tag data is logged from day one so future recommendations have history.
 */
export function track(event: string, props?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log(`[analytics] ${event}`, props ?? {});
  }
  // TODO(posthog): posthog.capture(event, props)
}
