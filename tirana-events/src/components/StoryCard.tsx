import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { EventItem } from '@/data/types';
import { CATEGORY_EMOJI, makeStyles, radius, useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { firstName, joinNames } from '@/lib/format';
import { LANG_CODE, foreignLangsOf, spokenLangs } from '@/data/languages';
import { useEventFacts } from '@/features/event/useEventFacts';
import { Emoji } from '@/components/ui';
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
  md: { w: 200, h: 280, title: 19, when: 13, lines: 3 },
  sm: { w: 150, h: 196, title: 16, when: 12, lines: 3 },
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
  const theme = useTheme();
  const s = useStyles();
  const hover = useHoverLift();
  const { t } = useI18n();
  const { people, profile } = useStore();
  const friends = people.filter((p) => event.goingUserIds.includes(p.id) && profile.follows.includes(p.id));
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
        accessibilityLabel={`${event.title}, ${when}${langs.length ? `, ${t.a11y_langs(langNames)}` : ''}`}
        {...hover.handlers}
        style={s.pressable}
      >
        {({ pressed }) => (
          <Animated.View
            style={[
              s.card,
              { width: width ?? dims.w, height: dims.h },
              { boxShadow: hover.shadow, transform: [{ translateY: hover.translateY }, { scale: pressed ? 0.97 : 1 }] },
              hover.focusRing,
            ]}
          >
            <View style={s.clip}>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: hover.photoScale }] }]}>
                <EventPhoto event={event} style={StyleSheet.absoluteFill} emojiSize={size === 'sm' ? 40 : 56}
                  emojiPlacement="watermark"
                />
              </Animated.View>
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.88)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[s.bubble, size === 'sm' && s.bubbleSm, { backgroundColor: theme.cat[event.category] }]}>
                <Emoji size={size === 'sm' ? 15 : 18}>{CATEGORY_EMOJI[event.category]}</Emoji>
              </View>
              {askToJoin ? (
                <View style={[s.badge, { backgroundColor: theme.sticker[1] }]}>
                  <Text style={[s.badgeText, { color: '#2A2233' }]}>{t.badge_ask}</Text>
                </View>
              ) : event.priceType === 'free' && (
                <View style={[s.badge, { backgroundColor: theme.c.free }]}>
                  <Text style={[s.badgeText, { color: theme.c.onFree }]}>{t.free}</Text>
                </View>
              )}
              {langs.length > 0 && (
                // under the free/ask badge when there is one, so the time below never gets cut
                <View style={[s.langs, { top: askToJoin || event.priceType === 'free' ? 46 : 15 }]}>
                  <Text style={s.langsText}>{langs.map((l) => LANG_CODE[l]).join(' ')}</Text>
                </View>
              )}
              <View style={s.bottom}>
                <Text style={[s.when, { fontSize: dims.when }]} numberOfLines={1}>
                  {whenShort}
                </Text>
                <Text
                  style={[s.title, { fontFamily: theme.font, fontSize: dims.title, lineHeight: Math.round(dims.title * 1.2) }]}
                  numberOfLines={dims.lines}
                  maxFontSizeMultiplier={1.3}
                >
                  {event.title}
                </Text>
                {friends.length > 0 && (
                  <View style={[s.friends, { backgroundColor: theme.c.social }]}>
                    <Text style={[s.friendsText, { color: theme.c.onSocial }]} numberOfLines={1}>
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
      borderRadius: radius.lg,
      backgroundColor: t.c.surfaceAlt,
      borderWidth: t.outline,
      borderColor: t.c.border,
    },
    clip: { flex: 1, borderRadius: radius.lg - t.outline, overflow: 'hidden' },
    bubble: {
      position: 'absolute',
      top: 10,
      left: 10,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleSm: { width: 32, height: 32, borderRadius: 16, top: 8, left: 8 },
    badge: { position: 'absolute', top: 15, right: 10, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    bottom: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 5 },
    when: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    // which non-Albanian languages work here: a frosted tag so it reads on any photo
    langs: {
      position: 'absolute',
      right: 10,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: 'rgba(0,0,0,0.38)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.6)',
    },
    langsText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    title: { color: '#FFFFFF', fontSize: 19, lineHeight: 23 },
    friends: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, maxWidth: '100%' },
    friendsText: { fontSize: 12, fontWeight: '700' },
  }),
);
