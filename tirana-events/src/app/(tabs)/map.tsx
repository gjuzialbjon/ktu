import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { CATEGORY_EMOJI, makeStyles, radius, useTheme } from '@/lib/theme';
import { Category, EventItem } from '@/data/types';
import { formatWhen } from '@/lib/format';
import { track } from '@/lib/analytics';
import { Display, Emoji } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { MAP_H, MAP_W, project } from '@/features/map/project';

const W = MAP_W;
const H = MAP_H;
const PIN_HIT = 44;

export default function MapScreen() {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { events } = useStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = useNow();

  const pins = useMemo(
    () =>
      events
        .filter((e) => e.lat != null && e.lng != null && new Date(e.startsAt).getTime() > now - 3600_000)
        .map((e) => ({ event: e, ...project(e.lat as number, e.lng as number) })),
    [events, now],
  );

  const selected = pins.find((p) => p.event.id === selectedId)?.event ?? null;
  const mapWidth = Math.min(width - 32, 640);
  const mapHeight = (mapWidth / W) * H;
  const scale = mapWidth / W; // viewBox units → points
  const m = theme.map;
  const roadW = theme.id === 'fasadat' ? 3 : 7;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.headerBlock}>
          <Display size={30}>{t.map}</Display>
          <Text style={s.sub}>{t.map_subtitle}</Text>
        </View>

        <View style={[s.mapCard, { width: mapWidth, height: mapHeight }]}>
          <Svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${W} ${H}`}>
            <Rect x={0} y={0} width={W} height={H} fill={m.ground} />
            {/* Parku i Madh and the lake */}
            <Path d="M150 290 Q 230 270 280 300 Q 300 350 250 385 Q 180 400 140 370 Q 120 320 150 290 Z" fill={m.park} />
            <Path d="M175 315 Q 225 300 255 325 Q 260 355 225 365 Q 180 365 170 340 Z" fill={m.water} />
            {/* Lana river */}
            <Path d="M0 250 Q 90 235 180 245 Q 270 255 360 235" stroke={m.water} strokeWidth={7} fill="none" />
            {/* boulevard and main roads */}
            <Path d="M196 60 L 196 300" stroke={m.road} strokeWidth={roadW + 2} />
            <Path d="M196 160 L 20 196" stroke={m.road} strokeWidth={roadW} />
            <Path d="M196 185 L 340 270" stroke={m.road} strokeWidth={roadW - 1} />
            <Path d="M196 150 L 40 70" stroke={m.road} strokeWidth={roadW} />
            <Path
              d="M100 110 Q 196 70 300 115 Q 330 190 290 260 Q 196 300 110 255 Q 70 180 100 110 Z"
              stroke={m.road}
              strokeWidth={2.5}
              fill="none"
              opacity={0.7}
            />
            {/* Skanderbeg square */}
            <Circle cx={196} cy={150} r={13} fill={m.ground} stroke={m.road} strokeWidth={2.5} />
            <SvgText x={196} y={131} fontSize={9} fill={m.label} textAnchor="middle" fontWeight="bold">
              Skënderbej
            </SvgText>
            <SvgText x={212} y={300} fontSize={9} fill={m.label} textAnchor="middle" fontWeight="bold">
              Parku i Madh
            </SvgText>
            <SvgText x={322} y={300} fontSize={9} fill={m.label} textAnchor="middle" fontWeight="bold">
              Dajti →
            </SvgText>

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
                    stroke={theme.id === 'fasadat' ? theme.c.text : m.ground}
                    strokeWidth={2.5}
                  />
                  <SvgText x={x} y={y + 3.5} fontSize={isSel ? 11 : 9} textAnchor="middle">
                    {CATEGORY_EMOJI[event.category]}
                  </SvgText>
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
            when={formatWhen(selected.startsAt, lang, t.today, t.tomorrow)}
            onOpen={() => {
              track('event_viewed', { eventId: selected.id, source: 'map', tags: selected.tags });
              router.push(`/event/${selected.id}`);
            }}
          />
        )}

        <View style={s.legend}>
          {(Object.keys(CATEGORY_EMOJI) as Category[]).map((cat) => (
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

function MapPreviewCard({ event, when, onOpen }: { event: EventItem; when: string; onOpen: () => void }) {
  const theme = useTheme();
  const s = useStyles();
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t.a11y_open_event(event.title)}
      style={[s.preview, { borderColor: theme.cat[event.category] }]}
      onPress={onOpen}
    >
      <View style={s.previewHead}>
        <Emoji size={18}>{CATEGORY_EMOJI[event.category]}</Emoji>
        <Text style={s.previewWhen}>{when}</Text>
      </View>
      <Display size={19}>{event.title}</Display>
      <Text style={s.previewMeta}>
        {event.venueName}, {t[`hood_${event.neighborhood}` as const]}. {event.priceType === 'free' ? t.free : `${event.ticketPriceLek} Lekë`}
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
