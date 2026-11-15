import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { EventItem } from '@/data/types';
import { CATEGORY_EMOJI, makeStyles, radius, useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { firstName, formatWhen, joinNames, lekToEur } from '@/lib/format';
import { AvatarStack, Chip, Display, Emoji, TagRow } from '@/components/ui';
import { track } from '@/lib/analytics';
import { useHoverLift } from '@/hooks/useHoverLift';
import { EventPhoto } from '@/components/EventPhoto';

/** Turnout below this reads as negative social proof, so it is hidden. */
const MIN_COUNT_SHOWN = 3;

export function EventCard({ event, popular }: { event: EventItem; popular?: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const s = useStyles();
  const hover = useHoverLift();
  const { t, lang } = useI18n();
  const { people, profile, rsvps } = useStore();

  const going = people.filter((p) => event.goingUserIds.includes(p.id));
  const friends = going.filter((p) => profile.follows.includes(p.id));
  const joined = !!rsvps[event.id];
  const hood = t[`hood_${event.neighborhood}` as const];
  const when = formatWhen(event.startsAt, lang, t.today, t.tomorrow);

  return (
    <Link
      href={`/event/${event.id}`}
      asChild
      onPress={() => track('event_viewed', { eventId: event.id, source: 'feed', tags: event.tags })}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${event.title}, ${when}, ${event.venueName}`}
        {...hover.handlers}
        style={s.pressable}
      >
        {({ pressed }) => (
          <Animated.View
            style={[
              s.card,
              {
                boxShadow: hover.shadow,
                transform: [{ translateY: hover.translateY }, { scale: pressed ? 0.985 : 1 }],
              },
              hover.focusRing,
            ]}
          >
            <View style={s.clip}>
              <View style={s.photo}>
                <Animated.View style={{ transform: [{ scale: hover.photoScale }] }}>
                  <EventPhoto event={event} style={s.img} />
                </Animated.View>
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']} style={s.fade} />

                <View style={s.topRow}>
                  <View style={[s.catBubble, { backgroundColor: theme.cat[event.category] }]}>
                    <Emoji size={17}>{CATEGORY_EMOJI[event.category]}</Emoji>
                  </View>
                  {event.isSponsored && <Chip label={t.sponsored} tone="sponsored" />}
                  {popular && <Chip label={t.popular} tone="sponsored" />}
                  <View style={{ flex: 1 }} />
                  <Chip
                    label={event.priceType === 'free' ? t.free : `${event.ticketPriceLek} L`}
                    tone={event.priceType === 'free' ? 'free' : 'default'}
                  />
                </View>

                {friends.length > 0 && !joined && (
                  <View style={s.friendsOnPhoto}>
                    <AvatarStack users={friends} follows={profile.follows} size={26} />
                    <View style={[s.friendsPill, { backgroundColor: theme.c.social }]}>
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
                  </View>
                )}
                {joined && (
                  <View style={s.friendsOnPhoto}>
                    <View style={[s.friendsPill, { backgroundColor: theme.c.free }]}>
                      <Text style={[s.friendsText, { color: theme.c.onFree }]}>{t.youre_going}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={s.body}>
                <Text style={s.when}>{when}</Text>
                <Display size={20} numberOfLines={2}>
                  {event.title}
                </Display>
                <View style={s.metaRow}>
                  <View style={[s.dot, { backgroundColor: theme.cat[event.category] }]} />
                  <Text style={s.meta} numberOfLines={1}>
                    {event.venueName}, {hood}
                  </Text>
                </View>
                {event.priceType === 'ticketed' && event.ticketPriceLek ? (
                  <Text style={s.meta}>
                    {t.price_door(event.ticketPriceLek)}
                    {lang === 'en' ? `  ${t.eur_hint(lekToEur(event.ticketPriceLek))}` : ''}
                  </Text>
                ) : null}
                {/* footer pinned to the bottom so tags line up across a row of equal-height cards */}
                <View style={s.footer}>
                  <TagRow
                    tags={event.tags.slice(0, 3)}
                    onTagPress={(tag) => {
                      track('tag_filtered', { tag, source: 'card' });
                      router.push({ pathname: '/', params: { tag } });
                    }}
                  />
                  {friends.length === 0 && going.length >= MIN_COUNT_SHOWN && (
                    <View style={s.countRow}>
                      <AvatarStack users={going} follows={profile.follows} size={24} />
                      <Text style={s.count}>{t.going_count(going.length)}</Text>
                    </View>
                  )}
                </View>
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
    // flex: 1 down the chain lets a card fill the row height its grid cell stretches to
    pressable: { marginBottom: 18, flex: 1 },
    card: {
      backgroundColor: t.c.surface,
      borderRadius: radius.lg,
      borderWidth: t.outline,
      borderColor: t.c.border,
      flex: 1,
    },
    // the shadow lives on the card; clipping happens one layer in so it is not cut off
    clip: { flex: 1, borderRadius: radius.lg - t.outline, overflow: 'hidden' },
    photo: { overflow: 'hidden' },
    img: { width: '100%', height: 180, backgroundColor: t.c.surfaceAlt },
    fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
    topRow: { position: 'absolute', top: 10, left: 10, right: 2, flexDirection: 'row', alignItems: 'center' },
    catBubble: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      borderWidth: t.outline,
      borderColor: t.id === 'fasadat' ? t.c.text : 'transparent',
    },
    friendsOnPhoto: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    friendsPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 1 },
    friendsText: { fontSize: 13, fontWeight: '700' },
    body: { flex: 1, padding: 14, gap: 7 },
    footer: { marginTop: 'auto', paddingTop: 2, gap: 8 },
    when: { color: t.c.text, fontSize: 14, fontWeight: '700' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    meta: { color: t.c.textDim, fontSize: 14, flexShrink: 1 },
    countRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    count: { color: t.c.textDim, fontSize: 13 },
  }),
);
