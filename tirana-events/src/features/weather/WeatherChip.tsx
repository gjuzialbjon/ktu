import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { CityId, cityName } from '@ktu/shared';
import { useI18n } from '@/lib/i18n';
import { makeStyles, radius, space, useTheme } from '@/lib/theme';
import { Display } from '@/components/ui';
import { WeatherIcon } from '@/components/icons';
import { Sheet } from '@/components/Sheet';
import { track } from '@/lib/analytics';
import { useWeather } from './useWeather';
import { Weather, WeatherKind, tipFor } from './weather';

/** Fixed, so the temperature arriving late never moves anything; TopBar balances against it. */
export const WEATHER_CHIP_W = 84;

const KIND_KEY = {
  clear: 'wx_clear',
  partly: 'wx_partly',
  cloudy: 'wx_cloudy',
  fog: 'wx_fog',
  drizzle: 'wx_drizzle',
  rain: 'wx_rain',
  snow: 'wx_snow',
  storm: 'wx_storm',
} as const satisfies Record<WeatherKind, string>;

const TIP_KEY = { rain: 'weather_tip_rain', hot: 'weather_tip_hot', cold: 'weather_tip_cold', nice: 'weather_tip_nice' } as const;

/**
 * Top-left of home: icon + temperature, so you know what today is like without leaving
 * the app. Tap for the day. While loading it keeps its size (no layout shift); if the
 * forecast cannot load it stays as a quiet dash rather than disappearing.
 */
export function WeatherChip({ city }: { city: CityId }) {
  const { t, lang } = useI18n();
  const s = useStyles();
  const theme = useTheme();
  const state = useWeather(city);
  const [open, setOpen] = useState(false);
  const w = state.status === 'ok' ? state.data : null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={w ? t.a11y_weather(`${w.temp}°`, t[KIND_KEY[w.kind]]) : t.weather_hours}
        disabled={!w && state.status !== 'error'}
        onPress={() => {
          track('weather_opened', { city });
          setOpen(true);
        }}
        hitSlop={6}
        style={({ pressed }) => [s.chip, pressed && { opacity: 0.8 }]}
      >
        <WeatherIcon kind={w?.kind} isDay={w?.isDay} size={18} color={theme.c.text} />
        <Text style={s.temp}>{w ? `${w.temp}°` : '–'}</Text>
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <Display size={22}>{t.weather_title(cityName(city, lang))}</Display>
        {w ? <WeatherDetails w={w} /> : <Text style={{ color: theme.c.textDim, fontSize: 15 }}>{t.weather_error}</Text>}
        <Text style={s.source}>{t.weather_source}</Text>
      </Sheet>
    </>
  );
}

function WeatherDetails({ w }: { w: Weather }) {
  const { t } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  return (
    <View style={{ gap: space.md }}>
      <View style={s.nowRow}>
        <WeatherIcon kind={w.kind} isDay={w.isDay} size={40} color={theme.c.text} />
        <View style={{ flex: 1 }}>
          <Text style={s.big}>{w.temp}°</Text>
          <Text style={s.dim}>
            {t[KIND_KEY[w.kind]]}. {t.weather_feels(w.feelsLike)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.hiLo}>
            ↑ {w.high}°  ↓ {w.low}°
          </Text>
          <Text style={s.dim}>{t.weather_rain(w.rainChance)}</Text>
        </View>
      </View>

      <View style={s.tip}>
        <Text style={s.tipText}>{t[TIP_KEY[tipFor(w)]]}</Text>
      </View>

      <Text style={s.label}>{t.weather_hours}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {w.hours.map((h) => (
          <View key={h.time} style={s.hour}>
            <Text style={s.hourTime}>{h.time}</Text>
            <WeatherIcon kind={h.kind} size={20} color={theme.c.textDim} />
            <Text style={s.hourTemp}>{h.temp}°</Text>
            {h.rainChance >= 20 ? <Text style={s.hourRain}>{h.rainChance}%</Text> : <Text style={s.hourRain}> </Text>}
          </View>
        ))}
      </ScrollView>

      <View style={s.factRow}>
        {w.sunrise ? <Text style={s.fact}>{t.weather_sunrise(w.sunrise)}</Text> : null}
        {w.sunset ? <Text style={s.fact}>{t.weather_sunset(w.sunset)}</Text> : null}
        <Text style={s.fact}>{t.weather_wind(w.windKmh)}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 44,
      // fixed, not min: the chip must not grow when the forecast arrives ("–" → "-12°"),
      // or the greeting next to it moves
      width: WEATHER_CHIP_W,
      justifyContent: 'center',
      paddingHorizontal: space.sm,
      borderRadius: 999,
      backgroundColor: t.c.surface,
      borderWidth: t.outline,
      borderColor: t.c.border,
    },
    temp: { color: t.c.text, fontSize: 16, fontWeight: '700' },
    nowRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    big: { color: t.c.text, fontWeight: '600', fontSize: 40, lineHeight: 44 },
    dim: { color: t.c.textDim, fontSize: 14 },
    hiLo: { color: t.c.text, fontSize: 15, fontWeight: '700' },
    tip: { backgroundColor: t.sticker[0], borderRadius: radius.md, padding: space.md },
    tipText: { color: '#2A2233', fontSize: 15, fontWeight: '600' },
    label: { color: t.c.textDim, fontSize: 14, fontWeight: '700' },
    hour: {
      alignItems: 'center',
      gap: 2,
      width: 56,
      paddingVertical: space.sm,
      borderRadius: radius.md,
      backgroundColor: t.c.surface,
      borderWidth: t.outline,
      borderColor: t.c.border,
    },
    hourTime: { color: t.c.textDim, fontSize: 12, fontWeight: '600' },
    hourTemp: { color: t.c.text, fontSize: 15, fontWeight: '700' },
    hourRain: { color: t.c.social, fontSize: 11, fontWeight: '700' },
    factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
    fact: { color: t.c.text, fontSize: 14 },
    source: { color: t.c.textDim, fontSize: 11 },
  }),
);
