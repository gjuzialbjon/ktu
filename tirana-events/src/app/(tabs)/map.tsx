import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, G } from 'react-native-svg';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { makeStyles, radius, useTheme } from '@/lib/theme';
import { CATEGORY_ICON, Icon } from '@/components/icons';
import { Category, EventItem, CITIES, cityName, canSeeDetails } from '@ktu/shared';
import { track } from '@/lib/analytics';
import { CardTitle, Display } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { MAP_H, MAP_W, project } from '@/features/map/project';
import { MapBackdrop } from '@/features/map/MapBackdrop';
import { useEventFacts } from '@/features/event/useEventFacts';
import { TopBar } from '@/components/TopBar';

const W = MAP_W;
const H = MAP_H;
const PIN_HIT = 44;

export default function MapScreen() {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { cityEvents: events, profile, rsvps } = useStore();
  const city = CITIES[profile.city];
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = useNow();

  const pins = useMemo(
    () =>
      events
        // ask-to-join events keep their spot to themselves until you are in: no pin
        .filter(
          (e) =>
            e.lat != null &&
            e.lng != null &&
            new Date(e.startsAt).getTime() > now - 3600_000 &&
            canSeeDetails(e, rsvps[e.id]),
        )
        .map((e) => ({ event: e, ...project(e.lat as number, e.lng as number, city.bounds) })),
    [events, now, city.bounds, rsvps],
  );

  const selected = pins.find((p) => p.event.id === selectedId)?.event ?? null;
  const mapWidth = Math.min(width - 32, 640);
  const mapHeight = (mapWidth / W) * H;
  const scale = mapWidth / W; // viewBox units → points
  const m = theme.map;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.headerBlock}>
          <TopBar />
          <Display size={30} style={{ marginTop: 8 }}>{t.map}</Display>
          <Text style={s.sub}>{t.map_subtitle}</Text>
        </View>

        <View style={[s.mapCard, { width: mapWidth, height: mapHeight }]}>
          <Svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${W} ${H}`}>
            <MapBackdrop
              city={city}
              theme={theme}
              cityLabel={cityName(city.id, lang)}
              waterLabel={city.water ? (city.water.kind === 'sea' ? t.map_sea : t.map_lake) : undefined}
            />

            {pins.map(({ event, x, y }) => {
              const color = theme.cat[event.category];
              const isSel = event.id === selectedId;
              return (
                <G key={event.id}>
                  {isSel && <Circle cx={x} cy={y} r={17} fill={color} opacity={0.3} />}
                  <Circle
                    cx={x}
                    cy={y}
                    r={isSel ? 12 : 10}
                    fill={color}
                    stroke={m.ground}
                    strokeWidth={2.5}
                  />
                </G>
              );
            })}
          </Svg>
          {/* Hit targets as real Pressables over the drawing: SVG onPress leaks touch-responder
              props onto web <g> elements, and has no accessible name. 44pt targets, centred on each pin. */}
          {pins.map(({ event, x, y }) => {
            const isSel = event.id === selectedId;
            return (
              <Pressable
                key={event.id}
                onPress={() => setSelectedId(isSel ? null : event.id)}
                accessibilityRole="button"
                accessibilityLabel={event.title}
                accessibilityState={{ selected: isSel }}
                style={[s.pinHit, { left: x * scale - PIN_HIT / 2, top: y * scale - PIN_HIT / 2 }]}
              />
            );
          })}
        </View>

        <Text style={s.disclaimer}>{t.stylized_map}</Text>

        {selected && (
          <MapPreviewCard
            event={selected}
            onOpen={() => {
              track('event_viewed', { eventId: selected.id, source: 'map', tags: selected.tags });
              router.push(`/event/${selected.id}`);
            }}
          />
        )}

        <View style={s.legend}>
          {(Object.keys(CATEGORY_ICON) as Category[]).map((cat) => (
            <View key={cat} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: theme.cat[cat] }]} />
              <Text style={s.legendText}>{t[`cat_${cat}` as const]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MapPreviewCard({ event, onOpen }: { event: EventItem; onOpen: () => void }) {
  const theme = useTheme();
  const s = useStyles();
  const { t } = useI18n();
  const { when, where } = useEventFacts(event);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t.a11y_open_event(event.title)}
      style={[s.preview, { borderColor: theme.cat[event.category] }]}
      onPress={onOpen}
    >
      <View style={s.previewHead}>
        <Icon as={CATEGORY_ICON[event.category]} size={18} color={theme.c.text} />
        <Text style={s.previewWhen}>{when}</Text>
      </View>
      <CardTitle size={18}>{event.title}</CardTitle>
      <Text style={s.previewMeta}>
        {where}. {event.priceType === 'free' ? t.free : `${event.ticketPriceLek} Lekë`}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.c.bg },
    content: { padding: 16, paddingBottom: 48, alignItems: 'center' },
    headerBlock: { alignSelf: 'stretch', maxWidth: 640, width: '100%', marginBottom: 14, gap: 2 },
    sub: { color: t.c.textDim, fontSize: 15 },
    mapCard: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: t.outline, borderColor: t.c.border },
    pinHit: { position: 'absolute', width: PIN_HIT, height: PIN_HIT, borderRadius: PIN_HIT / 2 },
    disclaimer: { color: t.c.textDim, fontSize: 12, marginTop: 8 },
    preview: {
      marginTop: 14,
      width: '100%',
      maxWidth: 640,
      backgroundColor: t.c.surface,
      borderWidth: 2,
      borderRadius: radius.md,
      padding: 14,
      gap: 4,
    },
    previewHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    previewWhen: { color: t.c.text, fontSize: 14, fontWeight: '700' },
    previewMeta: { color: t.c.textDim, fontSize: 14 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18, width: '100%', maxWidth: 640 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { color: t.c.textDim, fontSize: 13 },
  }),
);
