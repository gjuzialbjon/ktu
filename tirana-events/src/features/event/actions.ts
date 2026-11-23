import { Linking, Platform, Share } from 'react-native';
import { type EventItem, cityName } from '@ktu/shared';
import { track } from '@/lib/analytics';
import { createLogger } from '@/lib/log';

const log = createLogger('event');

export const eventDeepLink = (id: string) => `tiranaevents://event/${id}`;

/** Opens the system share sheet. Dismissing it is normal and not logged as an error. */
export async function shareEvent(event: EventItem, message: string): Promise<void> {
  track('share_card_created', { eventId: event.id, tags: event.tags });
  try {
    const res = await Share.share({ message: message + eventDeepLink(event.id) });
    if (res.action === Share.sharedAction) track('share_completed', { eventId: event.id });
  } catch (e) {
    log.warn('share failed', e);
  }
}

/** Apple Maps on iOS, Google Maps everywhere else. */
export function openInMaps(event: EventItem): void {
  const q = encodeURIComponent(`${event.venueName}, ${cityName(event.city, 'en')}, Albania`);
  const url = Platform.select({ ios: `maps:0,0?q=${q}`, default: `https://www.google.com/maps/search/?api=1&query=${q}` });
  Linking.openURL(url).catch((e) => log.warn('could not open maps', { url, e }));
}
