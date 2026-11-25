import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { CITIES, cityName } from '@ktu/shared';
import {
  PARTNER_EMOJI,
  Partner,
  STAMP_GOAL,
  STAMP_REWARD_PERCENT,
  findPartner,
  partnersIn,
  stampProgress,
} from '@/data/partners';
import { makeStyles, radius, space, useTheme } from '@/lib/theme';
import { Display, Emoji, Hand, Sticker } from '@/components/ui';
import { TopBar } from '@/components/TopBar';
import { MAP_H, MAP_W, project } from '@/features/map/project';
import { MapBackdrop } from '@/features/map/MapBackdrop';
import { hapticSuccess } from '@/lib/haptics';

const PIN_HIT = 44;

/**
 * Partners: places that do something nice for people who show up. A stamp card
 * (one stamp per partner, five different partners → a bigger discount) gives a
 * reason to try new places, and the map shows where they are.
 */
export default function Offers() {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { profile, stamps, collectStamp } = useStore();
  const { width } = useWindowDimensions();
  const city = CITIES[profile.city];
  const partners = useMemo(() => partnersIn(profile.city), [profile.city]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const progress = stampProgress(stamps);
  // stamps count across cities: the card is yours, not the city's
  const stampedPartners = Object.keys(stamps)
    .map(findPartner)
    .filter((p): p is Partner => !!p)
    .slice(0, STAMP_GOAL);

  const mapWidth = Math.min(width - 32, 640);
  const mapHeight = (mapWidth / MAP_W) * MAP_H * 0.8;
  const scale = mapWidth / MAP_W;
  const pins = partners.map((p) => ({ partner: p, ...project(p.lat, p.lng, city.bounds) }));
  const ordered = selectedId
    ? [...partners].sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId))
    : partners;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <TopBar />
        <Display size={30} style={{ marginTop: 8 }}>
          {t.offers_title}
        </Display>
        <Text style={s.sub}>{t.offers_sub}</Text>

        {/* the stamp card */}
        <View style={s.card} accessible accessibilityLabel={t.a11y_stamp(progress.count, STAMP_GOAL)}>
          <Sticker tone={2} tilt={-4} size={22} style={s.cardSticker}>
            {t.stamp_note}
          </Sticker>
          <View style={s.stamps}>
            {Array.from({ length: STAMP_GOAL }, (_, i) => {
              const p = stampedPartners[i];
              return (
                <View
                  key={i}
                  style={[
                    s.stamp,
                    p
                      ? { backgroundColor: theme.sticker[i % theme.sticker.length], borderStyle: 'solid', transform: [{ rotate: `${(i % 2 ? 6 : -7)}deg` }] }
                      : null,
                  ]}
                >
                  {p ? <Emoji size={22}>{PARTNER_EMOJI[p.kind]}</Emoji> : <Text style={s.stampNum}>{i + 1}</Text>}
                </View>
              );
            })}
          </View>
          <Text style={s.cardText}>
            {progress.unlocked
              ? t.stamp_unlocked(STAMP_REWARD_PERCENT)
              : t.stamp_body(progress.count, STAMP_GOAL, STAMP_REWARD_PERCENT)}
          </Text>
        </View>

        {partners.length === 0 ? (
          <Text style={s.sub}>{t.no_partners(cityName(profile.city, lang))}</Text>
        ) : (
          <>
            <View style={[s.map, { width: mapWidth, height: mapHeight }]}>
              <Svg width={mapWidth} height={mapHeight} viewBox={`0 ${MAP_H * 0.1} ${MAP_W} ${MAP_H * 0.8}`}>
                <MapBackdrop
                  city={city}
                  theme={theme}
                  cityLabel={cityName(city.id, lang)}
                  waterLabel={city.water ? (city.water.kind === 'sea' ? t.map_sea : t.map_lake) : undefined}
                />
                {pins.map(({ partner, x, y }) => {
                  const sel = partner.id === selectedId;
                  const done = !!stamps[partner.id];
                  return (
                    <G key={partner.id}>
                      {sel && <Circle cx={x} cy={y} r={19} fill={theme.c.primary} opacity={0.3} />}
                      <Circle
                        cx={x}
                        cy={y}
                        r={sel ? 13 : 11}
                        fill={done ? theme.sticker[2] : theme.c.surface}
                        stroke={theme.c.primary}
                        strokeWidth={2.5}
                      />
                      <SvgText x={x} y={y + 4} fontSize={sel ? 12 : 10} textAnchor="middle">
                        {PARTNER_EMOJI[partner.kind]}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>
              {pins.map(({ partner, x, y }) => (
                <Pressable
                  key={partner.id}
                  accessibilityRole="button"
                  accessibilityLabel={partner.name}
                  accessibilityState={{ selected: partner.id === selectedId }}
                  onPress={() => setSelectedId(partner.id === selectedId ? null : partner.id)}
                  style={[
                    s.pinHit,
                    { left: x * scale - PIN_HIT / 2, top: (y - MAP_H * 0.1) * scale - PIN_HIT / 2 },
                  ]}
                />
              ))}
            </View>
            <Text style={s.disclaimer}>{t.stylized_map}</Text>

            <View style={s.list}>
              {ordered.map((p) => (
                <PartnerCard
                  key={p.id}
                  partner={p}
                  selected={p.id === selectedId}
                  stamped={!!stamps[p.id]}
                  onCheckIn={() => {
                    hapticSuccess();
                    collectStamp(p.id);
                  }}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PartnerCard({
  partner,
  selected,
  stamped,
  onCheckIn,
}: {
  partner: Partner;
  selected: boolean;
  stamped: boolean;
  onCheckIn: () => void;
}) {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  return (
    <View style={[s.partner, selected && { borderColor: theme.c.primary }]}>
      <View style={s.partnerHead}>
        <View style={s.partnerIcon}>
          <Emoji size={22}>{PARTNER_EMOJI[partner.kind]}</Emoji>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.partnerName}>{partner.name}</Text>
          <Text style={s.partnerBlurb}>{partner.blurb[lang]}</Text>
        </View>
      </View>
      {partner.offers.map((o) => (
        <View key={o.id} style={s.offerRow}>
          <Hand size={24} color={theme.c.primary}>
            -{o.percent}%
          </Hand>
          <Text style={s.offerText}>{o.text[lang]}</Text>
        </View>
      ))}
      <View style={s.checkRow}>
        <Pressable
          accessibilityRole="button"
          disabled={stamped}
          onPress={onCheckIn}
          style={({ pressed }) => [
            s.checkBtn,
            stamped ? { backgroundColor: theme.c.free } : { backgroundColor: theme.c.primary },
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={[s.checkText, { color: stamped ? theme.c.onFree : theme.c.onPrimary }]}>
            {stamped ? t.checked_in : t.check_in}
          </Text>
        </Pressable>
        {!stamped && <Text style={s.demo}>{t.check_in_demo}</Text>}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.c.bg },
    content: { padding: space.lg, paddingBottom: space.xxxl, maxWidth: 672, width: '100%', alignSelf: 'center' },
    sub: { color: t.c.textDim, fontSize: 15, marginTop: 2, marginBottom: space.lg },
    card: {
      backgroundColor: t.c.surface,
      borderRadius: radius.lg,
      borderWidth: t.outline,
      borderColor: t.c.border,
      padding: space.lg,
      paddingTop: space.xl,
      gap: space.md,
      marginTop: space.sm,
      marginBottom: space.xl,
    },
    cardSticker: { position: 'absolute', top: -14, left: 14 },
    stamps: { flexDirection: 'row', justifyContent: 'space-between', gap: space.xs },
    stamp: {
      flex: 1,
      maxWidth: 58,
      aspectRatio: 1,
      borderRadius: 999,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: t.c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stampNum: { color: t.c.textDim, fontSize: 16, fontWeight: '700' },
    cardText: { color: t.c.text, fontSize: 15, lineHeight: 21 },
    map: {
      alignSelf: 'center',
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: t.outline,
      borderColor: t.c.border,
    },
    pinHit: { position: 'absolute', width: PIN_HIT, height: PIN_HIT, borderRadius: PIN_HIT / 2 },
    disclaimer: { color: t.c.textDim, fontSize: 12, marginTop: space.sm, textAlign: 'center' },
    list: { gap: space.md, marginTop: space.lg },
    partner: {
      backgroundColor: t.c.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: t.c.border,
      padding: space.lg,
      gap: space.sm,
    },
    partnerHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    partnerIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: t.c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    partnerName: { color: t.c.text, fontSize: 17, fontWeight: '700' },
    partnerBlurb: { color: t.c.textDim, fontSize: 14 },
    offerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    offerText: { color: t.c.text, fontSize: 15, flex: 1 },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xs },
    checkBtn: { minHeight: 44, paddingHorizontal: space.lg, borderRadius: 999, justifyContent: 'center' },
    checkText: { fontSize: 15, fontWeight: '700' },
    demo: { color: t.c.textDim, fontSize: 12, flex: 1 },
  }),
);
