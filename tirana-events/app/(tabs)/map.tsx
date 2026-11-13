import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useI18n } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { CATEGORY_META, colors } from '../../lib/theme';
import { EventItem } from '../../lib/types';
import { formatWhen } from '../../lib/format';
import { track } from '../../lib/analytics';

/**
 * Stylized vector map of central Tirana (not to scale).
 * Real lat/lng are projected onto the canvas, so pins sit roughly where
 * the events are: lake park south, Skanderbeg square center-north,
 * Dajti off to the east, Kombinat south-west.
 */
const BOUNDS = { latMin: 41.3, latMax: 41.345, lngMin: 19.77, lngMax: 19.875 };
const W = 360;
const H = 420;

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * W;
  const y = H - ((lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin)) * H;
  return { x: Math.max(14, Math.min(W - 14, x)), y: Math.max(14, Math.min(H - 14, y)) };
}

export default function MapScreen() {
  const { t, lang } = useI18n();
  const { events } = useStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pins = useMemo(
    () =>
      events
        .filter((e) => e.lat != null && e.lng != null)
        .map((e) => ({ event: e, ...project(e.lat as number, e.lng as number) })),
    [events],
  );

  const selected = pins.find((p) => p.event.id === selectedId)?.event ?? null;
  const mapWidth = Math.min(width - 32, 640);
  const mapHeight = (mapWidth / W) * H;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>{t.map}</Text>
        <Text style={styles.sub}>{t.map_subtitle}</Text>

        <View style={[styles.mapCard, { width: mapWidth, height: mapHeight }]}>
          <Svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${W} ${H}`}>
            {/* ground */}
            <Rect x={0} y={0} width={W} height={H} fill={colors.card} />

            {/* Parku i Madh + lake (south center) */}
            <Path
              d="M150 290 Q 230 270 280 300 Q 300 350 250 385 Q 180 400 140 370 Q 120 320 150 290 Z"
              fill="#1B2E26"
            />
            <Path d="M175 315 Q 225 300 255 325 Q 260 355 225 365 Q 180 365 170 340 Z" fill="#16303E" />

            {/* Lana river, west → east */}
            <Path
              d="M0 250 Q 90 235 180 245 Q 270 255 360 235"
              stroke="#16303E"
              strokeWidth={7}
              fill="none"
            />

            {/* main boulevard, north → south */}
            <Path d="M196 60 L 196 300" stroke={colors.border} strokeWidth={9} />
            {/* Rruga e Kavajës, towards west */}
            <Path d="M196 160 L 20 196" stroke={colors.border} strokeWidth={6} />
            {/* Rruga e Elbasanit, towards south-east */}
            <Path d="M196 185 L 340 270" stroke={colors.border} strokeWidth={5} />
            {/* Rruga e Durrësit, towards north-west */}
            <Path d="M196 150 L 40 70" stroke={colors.border} strokeWidth={6} />
            {/* ring */}
            <Path
              d="M100 110 Q 196 70 300 115 Q 330 190 290 260 Q 196 300 110 255 Q 70 180 100 110 Z"
              stroke={colors.border}
              strokeWidth={3}
              fill="none"
              opacity={0.6}
            />

            {/* Skanderbeg square */}
            <Circle cx={196} cy={150} r={13} fill={colors.cardAlt} stroke={colors.border} strokeWidth={2} />
            <SvgText x={196} y={132} fontSize={9} fill={colors.textDim} textAnchor="middle" fontWeight="bold">
              SKËNDERBEJ
            </SvgText>
            <SvgText x={212} y={345} fontSize={9} fill="#3F6E5A" textAnchor="middle" fontWeight="bold">
              PARKU I MADH
            </SvgText>
            <SvgText x={330} y={300} fontSize={9} fill={colors.textDim} textAnchor="middle" fontWeight="bold">
              DAJTI →
            </SvgText>

            {/* pins */}
            {pins.map(({ event, x, y }) => {
              const meta = CATEGORY_META[event.category];
              const isSel = event.id === selectedId;
              return (
                <G key={event.id} onPress={() => setSelectedId(isSel ? null : event.id)}>
                  {/* generous invisible hit area */}
                  <Circle cx={x} cy={y} r={20} fill="transparent" />
                  {isSel && <Circle cx={x} cy={y} r={16} fill={meta.color} opacity={0.25} />}
                  <Circle cx={x} cy={y} r={isSel ? 11 : 9} fill={meta.color} stroke={colors.bg} strokeWidth={2.5} />
                  <SvgText x={x} y={y + 3.5} fontSize={isSel ? 11 : 9} textAnchor="middle">
                    {meta.emoji}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>

        <Text style={styles.disclaimer}>{t.stylized_map}</Text>

        {selected && <MapPreviewCard event={selected} onOpen={() => {
          track('event_viewed', { eventId: selected.id, source: 'map', tags: selected.tags });
          router.push(`/event/${selected.id}`);
        }} when={formatWhen(selected.startsAt, lang, t.today, t.tomorrow)} />}

        {/* legend */}
        <View style={styles.legend}>
          {Object.entries(CATEGORY_META).map(([cat, meta]) => (
            <View key={cat} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: meta.color }]} />
              <Text style={styles.legendText}>
                {meta.emoji} {t[`cat_${cat as keyof typeof CATEGORY_META}` as const]}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MapPreviewCard({ event, when, onOpen }: { event: EventItem; when: string; onOpen: () => void }) {
  const meta = CATEGORY_META[event.category];
  const { t } = useI18n();
  return (
    <Pressable style={[styles.preview, { borderColor: meta.color }]} onPress={onOpen}>
      <Text style={[styles.previewCat, { color: meta.color }]}>
        {meta.emoji} {t[`cat_${event.category}` as const].toUpperCase()}
      </Text>
      <Text style={styles.previewTitle}>{event.title}</Text>
      <Text style={styles.previewMeta}>
        {when} · 📍 {event.venueName} ·{' '}
        {event.priceType === 'free' ? t.free : `${event.ticketPriceLek} Lekë`}
      </Text>
      <Text style={[styles.previewOpen, { color: meta.color }]}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48, alignItems: 'center' },
  h1: { color: colors.text, fontSize: 26, fontWeight: '900', alignSelf: 'flex-start' },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 2, marginBottom: 14, alignSelf: 'flex-start' },
  mapCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimer: { color: colors.textDim, fontSize: 11, marginTop: 8, alignSelf: 'center' },
  preview: {
    marginTop: 14,
    width: '100%',
    maxWidth: 640,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  previewCat: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  previewTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  previewMeta: { color: colors.textDim, fontSize: 13 },
  previewOpen: { position: 'absolute', right: 14, top: 14, fontSize: 20, fontWeight: '900' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
    width: '100%',
    maxWidth: 640,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.textDim, fontSize: 12 },
});
