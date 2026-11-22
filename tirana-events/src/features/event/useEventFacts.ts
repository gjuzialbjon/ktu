import type { EventItem } from '@/data/types';
import { areaName, cityName } from '@/data/cities';
import { canSeeDetails, dayPartOf, joinModeOf, visibilityOf } from '@/data/access';
import { useStore } from '@/data/store';
import { useI18n } from '@/lib/i18n';
import { formatDay, formatWhen } from '@/lib/format';

export interface EventFacts {
  /** exact time, or "Saturday, evening" while hidden */
  when: string;
  /** the same with a short weekday ("Mër, 25 nën, 20:00") for small cards */
  whenShort: string;
  /** "Venue, Area", or "Somewhere in Area" while hidden */
  where: string;
  area: string;
  /** "Area, City" (event page: plans and shared links can point at another city) */
  areaWithCity: string;
  hidden: boolean;
  askToJoin: boolean;
  isPrivate: boolean;
}

/**
 * The one place that decides how an event's time and place are shown. Every card,
 * rail, map preview and the event page read from here, so an ask-to-join event
 * cannot leak its exact place or time through a component that forgot the rule.
 */
export function useEventFacts(event: EventItem): EventFacts {
  const { t, lang } = useI18n();
  const { rsvps } = useStore();
  const hidden = !canSeeDetails(event, rsvps[event.id]);
  const area = areaName(event.city, event.neighborhood, lang);
  const part = dayPartOf(event.startsAt);
  const whenOf = (short: boolean) =>
    hidden
      ? `${formatDay(event.startsAt, lang, t.today, t.tomorrow, short)}, ${short ? t.part_short[part] : t[`part_${part}` as const]}`
      : formatWhen(event.startsAt, lang, t.today, t.tomorrow, short);
  return {
    when: whenOf(false),
    whenShort: whenOf(true),
    where: hidden ? t.hidden_where(area) : `${event.venueName}, ${area}`,
    area,
    areaWithCity: `${area}, ${cityName(event.city, lang)}`,
    hidden,
    askToJoin: joinModeOf(event) !== 'open',
    isPrivate: visibilityOf(event) === 'private',
  };
}
