import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { EventItem } from '@/data/types';
import { CATEGORY_EMOJI, makeStyles, radius, useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { firstName, joinNames } from '@/lib/format';
import { useEventFacts } from '@/features/event/useEventFacts';
import { Emoji } from '@/components/ui';
import { track } from '@/lib/analytics';
import { useHoverLift } from '@/hooks/useHoverLift';
import { EventPhoto } from '@/components/EventPhoto';

/** Tall photo tile for the "Tonight" rail — the Instagram-story shape people already scroll. */
export function StoryCard({ event, source }: { event: EventItem; source: string }) {
  const theme = useTheme();
  const s = useStyles();
  const hover = useHoverLift();
  const { t } = useI18n();
  const { people, profile } = useStore();
  const friends = people.filter((p) => event.goingUserIds.includes(p.id) && profile.follows.includes(p.id));
  const { when, askToJoin } = useEventFacts(event);

  return (
    <Link
      href={`/event/${event.id}`}
      asChild
      onPress={() => track('event_viewed', { eventId: event.id, source, tags: event.tags })}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${event.title}, ${when}`}
        {...hover.handlers}
        style={s.pressable}
      >
        {({ pressed }) => (
          <Animated.View
            style={[
              s.card,
              { boxShadow: hover.shadow, transform: [{ translateY: hover.translateY }, { scale: pressed ? 0.97 : 1 }] },
              hover.focusRing,
            ]}
          >
            <View style={s.clip}>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: hover.photoScale }] }]}>
                <EventPhoto event={event} style={StyleSheet.absoluteFill} emojiSize={56} />
              </Animated.View>
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.88)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[s.bubble, { backgroundColor: theme.cat[event.category] }]}>
                <Emoji size={18}>{CATEGORY_EMOJI[event.category]}</Emoji>
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
              <View style={s.bottom}>
                <Text style={s.when}>{when}</Text>
                <Text style={[s.title, { fontFamily: theme.font }]} numberOfLines={3} maxFontSizeMultiplier={1.3}>
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
    pressable: { marginRight: 12, paddingTop: 6, paddingBottom: 14 },
    card: {
      width: 200,
      height: 280,
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
    badge: { position: 'absolute', top: 15, right: 10, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    bottom: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 5 },
    when: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    title: { color: '#FFFFFF', fontSize: 19, lineHeight: 23 },
    friends: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, maxWidth: '100%' },
    friendsText: { fontSize: 12, fontWeight: '700' },
  }),
);
