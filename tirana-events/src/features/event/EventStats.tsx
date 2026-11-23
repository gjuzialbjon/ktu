import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { type EventItem, LANG_CODE, spokenLangs } from '@ktu/shared';
import { useI18n } from '@/lib/i18n';
import { makeStyles, radius, space } from '@/lib/theme';
import { Emoji } from '@/components/ui';
import { useWeather } from '@/features/weather/useWeather';
import { weatherEmoji } from '@/features/weather/weather';
import { durationMin, formatDuration, weatherAt } from './stats';

/** Same rule as the cards: a turnout this small is left out. */
const MIN_GOING_SHOWN = 3;
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * The event's numbers at a glance, like a route's stats card: big value, small label,
 * always a 2×2 grid (how long, entry, spots or turnout, languages). For events in the next
 * ~12 hours a weather strip shows the forecast for that hour; its row is there from the first
 * frame (decided by the clock, not by the network), so the forecast arriving moves nothing.
 */
export function EventStats({
  event,
  hidden,
  spots,
  going,
  nowMs,
}: {
  event: EventItem;
  /** exact time still hidden (ask to join): no start time, no hourly weather */
  hidden: boolean;
  spots: number | null;
  going: number;
  nowMs: number;
}) {
  const { t } = useI18n();
  const s = useStyles();
  const start = new Date(event.startsAt);
  const lasts = durationMin(event);

  const starts = { value: hidden ? '🔒' : hhmm(start), label: t.stat_starts };
  // a small turnout reads as "nobody is going", so below MIN_GOING_SHOWN the start time takes its place
  const turnout =
    spots != null
      ? { value: String(spots), label: t.stat_spots }
      : going >= MIN_GOING_SHOWN || lasts == null
        ? { value: String(going), label: t.stat_going }
        : starts;
  const cells: { value: string; label: string }[] = [
    lasts != null ? { value: formatDuration(lasts), label: t.stat_lasts } : starts,
    {
      value: event.priceType === 'free' ? t.free : `${event.ticketPriceLek ?? ''} L`,
      label: t.stat_entry,
    },
    turnout,
    { value: spokenLangs(event).map((l) => LANG_CODE[l]).join(' '), label: t.languages_label },
  ];

  const ahead = start.getTime() - nowMs;
  const showWeather = !hidden && ahead >= 0 && ahead <= 12 * 3600_000;

  return (
    <View style={s.card}>
      <View style={s.grid}>
        {cells.map((c) => (
          <View key={c.label} style={s.cell} accessible accessibilityLabel={`${c.label}: ${c.value}`}>
            <Text style={s.value} numberOfLines={1}>
              {c.value}
            </Text>
            <Text style={s.label} numberOfLines={1}>
              {c.label}
            </Text>
          </View>
        ))}
      </View>
      {showWeather && <WeatherStrip event={event} time={hhmm(start)} nowMs={nowMs} />}
    </View>
  );
}

/** Fixed height whatever the state (loading, ok, unavailable). */
function WeatherStrip({ event, time, nowMs }: { event: EventItem; time: string; nowMs: number }) {
  const { t } = useI18n();
  const s = useStyles();
  const state = useWeather(event.city);
  const hour = state.status === 'ok' ? weatherAt(state.data, event.startsAt, new Date(nowMs)) : undefined;
  // night icon after sunset ("HH:MM" strings compare in time order)
  const sun = state.status === 'ok' ? state.data : undefined;
  const isDay = hour && sun?.sunrise && sun.sunset ? hour.time >= sun.sunrise && hour.time < sun.sunset : true;
  return (
    <View style={s.weather}>
      <Emoji size={20}>{hour ? weatherEmoji(hour.kind, isDay) : '·'}</Emoji>
      <Text style={s.weatherTemp}>{hour ? `${hour.temp}°` : '–'}</Text>
      {hour && hour.rainChance >= 20 ? <Text style={s.weatherRain}>{t.weather_rain_short(hour.rainChance)}</Text> : null}
      <Text style={s.weatherLabel}>{t.weather_at(time)}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    card: {
      marginTop: space.lg,
      backgroundColor: t.c.surface,
      borderRadius: radius.lg,
      borderWidth: t.outline,
      borderColor: t.c.border,
      overflow: 'hidden',
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: '50%', paddingVertical: space.md, paddingHorizontal: space.lg, gap: 2 },
    value: { color: t.c.text, fontFamily: t.font, fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
    label: { color: t.c.textDim, fontSize: 13, fontWeight: '600' },
    weather: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      height: 48,
      paddingHorizontal: space.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.c.border,
      backgroundColor: t.c.surfaceAlt,
    },
    weatherTemp: { color: t.c.text, fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'], minWidth: 36 },
    weatherRain: { color: t.c.social, fontSize: 13, fontWeight: '700' },
    weatherLabel: { color: t.c.textDim, fontSize: 13, fontWeight: '600', marginLeft: 'auto' },
  }),
);
