import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { EventItem, LANG_CODE, foreignLangsOf, isWomenOnly, spokenLangs } from '@ktu/shared';
import { makeStyles, radius, useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { firstName, joinNames } from '@/lib/format';
import { useEventFacts } from '@/features/event/useEventFacts';
import { CardTitle, HostBadge } from '@/components/ui';
import { track } from '@/lib/analytics';
import { NO_BROWSER_OUTLINE, useHoverLift } from '@/hooks/useHoverLift';
import { EventPhoto } from '@/components/EventPhoto';

/**
 * Sizes, so a rail can trade drama for density:
 * - wide: the featured card at the top of home. Short and wide, about one per screen with the next peeking in.
 * - sm: browsing rails (for you, by category, similar). About 2.3 per screen width.
 * - md: the original tall story tile.
 */
export type StorySize = 'wide' | 'md' | 'sm';
const SIZES: Record<StorySize, { w: number; h: number; title: number; when: number; lines: number }> = {
  wide: { w: 320, h: 184, title: 21, when: 13, lines: 2 },
  md: { w: 200, h: 280, title: 18, when: 13, lines: 4 },
  sm: { w: 150, h: 196, title: 15, when: 12, lines: 4 },
};

/** Photo tile for rails — the story shape people already scroll. */
export function StoryCard({
  event,
  source,
  size = 'md',
  width,
}: {
  event: EventItem;
  source: string;
  size?: StorySize;
  /** overrides the size's width (the wide card follows the screen) */
  width?: number;
}) {
  const dims = SIZES[size];
  const hostSize = size === 'sm' ? 24 : 28;
  const theme = useTheme();
  const s = useStyles();
  const hover = useHoverLift();
  const { t } = useI18n();
  const { goersOf, profile } = useStore();
  const friends = goersOf(event).filter((p) => profile.follows.includes(p.id));
  const { when, whenShort, askToJoin } = useEventFacts(event);
  const langs = foreignLangsOf(event);
  const langNames = t.lang_list(spokenLangs(event).map((l) => t.lang_name[l]));

  return (
    <Link
      href={`/event/${event.id}`}
      asChild
      onPress={() => track('event_viewed', { eventId: event.id, source, tags: event.tags })}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${event.title}, ${when}, ${t.a11y_hosted_by(event.organizer.name)}${isWomenOnly(event) ? `, ${t.a11y_women_only}` : ''}${langs.length ? `, ${t.a11y_langs(langNames)}` : ''}`}
        {...hover.handlers}
        style={s.pressable}
      >
        {({ pressed }) => (
          <Animated.View
            style={[
              s.card,
              // a floor, not a cap: a long title makes the card taller instead of being cut
              { width: width ?? dims.w, minHeight: dims.h },
              { boxShadow: hover.shadow, transform: [{ translateY: hover.translateY }, { scale: pressed ? 0.97 : 1 }] },
              hover.focusRing,
            ]}
          >
            <View style={s.clip}>
              <View style={StyleSheet.absoluteFill}>
                <EventPhoto event={event} style={StyleSheet.absoluteFill} iconSize={size === 'sm' ? 40 : 56}
                  iconPlacement="watermark"
                />
              </View>
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.88)']}
                style={StyleSheet.absoluteFill}
              />
              {/* one row along the top: the host on the left, the label (and languages under it) on
                  the right. The label is as tall as the host badge, so tops and middles line up. */}
              <View style={s.top}>
                <HostBadge host={event.organizer} size={hostSize} />
                <View style={s.topRight}>
                  {/* one label fits the corner: women-only matters most, then how to get in, then price */}
                  {isWomenOnly(event) ? (
                    <View style={[s.badge, { height: hostSize, backgroundColor: theme.sticker[3] }]}>
                      <Text style={[s.badgeText, { color: '#2A2233' }]}>{t.badge_women}</Text>
                    </View>
                  ) : askToJoin ? (
                    <View style={[s.badge, { height: hostSize, backgroundColor: theme.sticker[1] }]}>
                      <Text style={[s.badgeText, { color: '#2A2233' }]}>{t.badge_ask}</Text>
                    </View>
                  ) : event.priceType === 'free' ? (
                    <View style={[s.badge, { height: hostSize, backgroundColor: theme.c.free }]}>
                      <Text style={[s.badgeText, { color: theme.c.onFree }]}>{t.free}</Text>
                    </View>
                  ) : null}
                  {langs.length > 0 && (
                    <View style={s.langs}>
                      <Text style={s.langsText}>{langs.map((l) => LANG_CODE[l]).join(' ')}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={[s.bottom, { marginTop: hostSize + 46 }]}>
                <View style={s.whenRow}>
                  <View style={[s.dot, { backgroundColor: theme.cat[event.category] }]} />
                  <Text style={[s.when, { fontSize: dims.when }]}>
                    {whenShort}
                  </Text>
                </View>
                <CardTitle size={dims.title} color="#FFFFFF">
                  {event.title}
                </CardTitle>
                {friends.length > 0 && (
                  <View style={[s.friends, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <Text style={[s.friendsText, { color: '#FFFFFF' }]}>
                      {t.friends_going_short(
                        joinNames(
                          friends.map((f) => firstName(f.name)),
                          t.and_word,
                        ),
                        friends.length,
                      )}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Link>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    // vertical padding gives the lift and shadow room inside the horizontal scroller
    // Link asChild needs one flat style; the card draws its own focus ring
    pressable: { marginRight: 12, paddingTop: 6, paddingBottom: 14, ...NO_BROWSER_OUTLINE },
    card: {
      flexGrow: 1, // in a rail every card matches the tallest one
      borderRadius: radius.lg,
      backgroundColor: t.c.surfaceAlt,
      borderWidth: t.outline,
      borderColor: t.c.border,
    },
    // the text sits at the bottom in the flow, so the card grows around it
    clip: { flexGrow: 1, justifyContent: 'flex-end', borderRadius: radius.lg - t.outline, overflow: 'hidden' },
    top: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
    topRight: { alignItems: 'flex-end', gap: 6, flexShrink: 1 },
    badge: { borderRadius: 999, paddingHorizontal: 10, justifyContent: 'center' },
    badgeText: { fontSize: 12, fontWeight: '700' },
    // marginTop (set inline) keeps it clear of the host, badge and languages above
    bottom: { padding: 12, gap: 4 },
    // the category's colour, now that the host has the top-left corner
    whenRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    // centred on the first line of the date, which can wrap on narrow cards
    dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', marginTop: 5 },
    when: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', flexShrink: 1 },
    // which non-Albanian languages work here: a frosted tag so it reads on any photo
    langs: {
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: 'rgba(0,0,0,0.38)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.6)',
    },
    langsText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
    // names wrap to a second line instead of being cut; a softer corner keeps two lines tidy
    friends: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, maxWidth: '100%' },
    friendsText: { fontSize: 12, fontWeight: '700' },
  }),
);
