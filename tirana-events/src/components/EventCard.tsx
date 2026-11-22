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
import { LikeSave } from '@/features/event/LikeSave';
import { AvatarStack, Chip, Display, Emoji, Sticker } from '@/components/ui';
import { track } from '@/lib/analytics';
import { useHoverLift } from '@/hooks/useHoverLift';
import { EventPhoto } from '@/components/EventPhoto';

/** Room kept free at the footer's right for the like/save buttons laid over it. */
const LIKE_SAVE_W = 96;

/** Turnout below this reads as negative social proof, so it is hidden. */
const MIN_COUNT_SHOWN = 3;

export function EventCard({ event, popular }: { event: EventItem; popular?: boolean }) {
  const theme = useTheme();
  const s = useStyles();
  const hover = useHoverLift();
  const { t } = useI18n();
  const { people, profile, rsvps } = useStore();

  const going = people.filter((p) => event.goingUserIds.includes(p.id));
  const friends = going.filter((p) => profile.follows.includes(p.id));
  const joined = !!rsvps[event.id];
  const { when, where, askToJoin, isPrivate } = useEventFacts(event);
  // only worth showing when a visitor could join; Albanian-only is the default
  const foreign = foreignLangsOf(event);
  const langLine = foreign.length > 0 ? t.lang_list(spokenLangs(event).map((l) => t.lang_name[l])) : null;
  const langCodes = foreign.length > 0 ? foreign.map((l) => LANG_CODE[l]).join(' ') : null;

  return (
    <View style={s.pressable}>
    <Link
      href={`/event/${event.id}`}
      asChild
      onPress={() => track('event_viewed', { eventId: event.id, source: 'feed', tags: event.tags })}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${event.title}, ${when}, ${where}`}
        {...hover.handlers}
        style={s.link}
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
                  {event.source === 'platform' && <Chip label={`✨ ${t.badge_platform}`} />}
                  {askToJoin && <Sticker tone={1} tilt={-4} size={17}>{isPrivate ? t.badge_private : t.badge_ask}</Sticker>}
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
                    {where}
                  </Text>
                  {langCodes && (
                    <Text style={s.langs} accessibilityLabel={t.a11y_langs(langLine ?? '')}>
                      {langCodes}
                    </Text>
                  )}
                </View>
                {/* footer pinned to the bottom so it lines up across a row of equal-height cards */}
                <View style={[s.footer, { paddingRight: LIKE_SAVE_W }]}>
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
      {/* a sibling of the link, not inside it: on web a tap here must not also open the event */}
      <View style={s.likeSave}>
        <LikeSave event={event} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    // flex: 1 down the chain lets a card fill the row height its grid cell stretches to
    pressable: { marginBottom: 18, flex: 1 },
    link: { flex: 1 },
    likeSave: { position: 'absolute', right: 8, bottom: 4 },
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
      borderColor: 'transparent',
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
    body: { flex: 1, padding: 14, gap: 6 },
    // fixed height: cards with and without a turnout row stay the same size
    footer: { marginTop: 'auto', paddingTop: 6, height: 38, justifyContent: 'center' },
    when: { color: t.c.text, fontSize: 14, fontWeight: '700' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    meta: { color: t.c.textDim, fontSize: 14, flexShrink: 1 },
    langs: {
      marginLeft: 'auto',
      color: t.c.textDim,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      borderWidth: 1,
      borderColor: t.c.border,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    countRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    count: { color: t.c.textDim, fontSize: 13 },
  }),
);
