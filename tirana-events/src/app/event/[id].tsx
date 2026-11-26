import React, { useState } from 'react';
import { Rail } from '@/components/Rail';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { MIN_RATINGS_SHOWN, autoAccepts, isWomenOnly, canRate, eventEndMs, spotsLeft, hiddenTopicOf, isIn, sharedInterests, similarEvents, type EventItem } from '@ktu/shared';
import { makeStyles, radius, space, useTheme } from '@/lib/theme';
import Venus from 'lucide-react-native/icons/venus';
import Sprout from 'lucide-react-native/icons/sprout';
import Repeat from 'lucide-react-native/icons/repeat';
import BadgeCheck from 'lucide-react-native/icons/badge-check';
import { CATEGORY_ICON, Icon } from '@/components/icons';
import { HOST_RATINGS_PUBLIC } from '@/data/flags';
import { firstName, joinNames } from '@/lib/format';
import { HideTopicsSheet } from '@/features/profile/HideTopicsSheet';
import { EventStats } from '@/features/event/EventStats';
import { Program } from '@/features/event/Program';
import { PARTNERS_LIVE, findOffer, findPartner } from '@/data/partners';
import { useEventFacts } from '@/features/event/useEventFacts';
import { LikeSave } from '@/features/event/LikeSave';
import { StoryCard } from '@/components/StoryCard';
import { useNow } from '@/hooks/useNow';
import { Avatar, Button, Chip, Display, Hand, HostBadge, Sticker, TagRow } from '@/components/ui';
import { EventPhoto } from '@/components/EventPhoto';
import { track } from '@/lib/analytics';
import { hapticSuccess } from '@/lib/haptics';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { ACTION_BAR_SPACE, ActionBar } from '@/features/event/ActionBar';
import { Comments } from '@/features/event/Comments';
import { RateEvent } from '@/features/rating/RateEvent';
import { FaqList } from '@/features/event/FaqList';
import { openInMaps, shareEvent } from '@/features/event/actions';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events } = useStore();

  const event = events.find((e) => e.id === id);
  if (!event) return <Missing />;
  return <EventPage event={event} />;
}

function Missing() {
  const router = useRouter();
  const s = useStyles();
  const { t } = useI18n();
  // stale share link, or an event that was taken down
  return (
    <View style={s.missing}>
      <Stack.Screen options={{ title: '' }} />
      <Display size={26}>{t.not_found_title}</Display>
      <Text style={s.missingText}>{t.not_found_body}</Text>
      <Button label={t.go_home} onPress={() => router.replace('/')} />
    </View>
  );
}

function EventPage({ event }: { event: EventItem }) {
  const router = useRouter();
  const theme = useTheme();
  const s = useStyles();
  const { t, lang } = useI18n();
  const { events, people, goersOf, profile, rsvps, join, requestJoin, cancel, comments, addComment, standings } = useStore();
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardVisible();
  const nowMs = useNow();
  const facts = useEventFacts(event);

  const rsvp = rsvps[event.id];
  // faces only of people who share their plans with you (their own choice); the count is everyone
  const going = goersOf(event);
  const friendsGoing = going.filter((p) => profile.follows.includes(p.id));
  const youreIn = isIn(rsvp);
  // after it ends, the "you're in" box becomes "how was it?" for a week
  const rateNow = canRate(event, rsvp, new Date(nowMs));
  // a host's average, once enough people rated, and only when it is good: like the trusted
  // badge, a weak record sinks the host in the feed rather than being shown on the page
  const hostStanding = event.source !== 'platform' ? standings[event.organizer.id] : undefined;
  const hostRating =
    HOST_RATINGS_PUBLIC && hostStanding && hostStanding.ratings >= MIN_RATINGS_SHOWN && hostStanding.ratingAvg >= 4
      ? { avg: hostStanding.ratingAvg.toFixed(1).replace('.', lang === 'sq' ? ',' : '.'), n: hostStanding.ratings }
      : null;
  const { when, hidden } = facts;
  // name the city too: plans and shared links can point at events outside your city
  const where = hidden ? t.hidden_where(facts.areaWithCity) : `${event.venueName}, ${facts.areaWithCity}`;
  const eventComments = comments.filter((c) => c.eventId === event.id);
  const totalGoing = event.goingUserIds.length + (youreIn ? 1 : 0);
  // people going whose names you may not see, shown only as "+N"
  const unnamed = event.goingUserIds.length - going.length;
  const spots = spotsLeft(event, youreIn);
  const shared = facts.askToJoin ? sharedInterests(event, profile.interests) : [];
  const host = event.facilitatorId ? people.find((p) => p.id === event.facilitatorId) : undefined;
  const offer = PARTNERS_LIVE ? findOffer(event.offerId) : undefined;
  const partner = offer ? findPartner(offer.partnerId) : undefined;
  // "similar" never suggests a topic you hid
  const similar = similarEvents(
    event,
    events.filter((e) => !hiddenTopicOf(e, profile.hidden)),
    nowMs,
  );
  const [hideOpen, setHideOpen] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: event.title }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingBottom: ACTION_BAR_SPACE + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View>
            <EventPhoto event={event} style={s.img} iconSize={64} />
            {/* the shade is for photos; a flat poster colour needs none (it would show an edge) */}
            {event.coverImage ? <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']} style={s.fade} /> : null}
            <View style={s.badges}>
              <View style={s.hostBadge}>
                <HostBadge host={event.organizer} size={32} />
              </View>
              {event.isSponsored && <Chip label={t.sponsored} tone="sponsored" />}
              {facts.askToJoin && (
                <Sticker tone={1} tilt={-4} size={19}>
                  {facts.isPrivate ? t.badge_private : t.badge_ask}
                </Sticker>
              )}
              <View style={{ flex: 1 }} />
              <Chip
                label={event.priceType === 'free' ? t.free : `${event.ticketPriceLek} L`}
                tone={event.priceType === 'free' ? 'free' : 'default'}
              />
            </View>
          </View>

          {event.photoCredit ? <Text style={s.credit}>{event.photoCredit}</Text> : null}
          <Text style={s.whenTop}>{when}</Text>
          <Display size={30}>{event.title}</Display>
          {/* trust line, like a route's "Expert ★4.8": what it is, who it suits, and your like/save */}
          <View style={s.trustRow}>
            <View style={[s.catPill, { borderColor: theme.cat[event.category] }]}>
              <Icon as={CATEGORY_ICON[event.category]} size={16} color={theme.c.text} />
              <Text style={s.catPillText}>{t[`cat_${event.category}` as const]}</Text>
            </View>
            {isWomenOnly(event) && (
              <View style={[s.catPill, { borderColor: theme.sticker[3], backgroundColor: theme.sticker[3] }]}>
                <Icon as={Venus} size={16} color="#2A2233" />
                <Text style={[s.catPillText, { color: '#2A2233' }]}>{t.badge_women}</Text>
              </View>
            )}
            {event.tags.includes('beginner-friendly') && (
              <View style={[s.catPill, { borderColor: theme.c.free, backgroundColor: theme.c.free }]}>
                <Icon as={Sprout} size={16} color={theme.c.onFree} />
                <Text style={[s.catPillText, { color: theme.c.onFree }]}>{t.level_beginner}</Text>
              </View>
            )}
            {/* a series that keeps coming back: say how often, and that this is one of many */}
            {event.series && (
              <View
                style={[s.catPill, { borderColor: theme.c.border }]}
                accessible
                accessibilityLabel={t.a11y_series(t.repeat_name[event.series.repeat], event.series.edition)}
              >
                <Icon as={Repeat} size={16} color={theme.c.text} />
                <Text style={s.catPillText}>{t.repeat_name[event.series.repeat]}</Text>
              </View>
            )}
            {/* only ever a positive mark: a weaker standing is never shown to attendees */}
            {event.source !== 'platform' && standings[event.organizer.id]?.tier === 'trusted' && (
              <View style={[s.catPill, { borderColor: theme.c.border }]}>
                <Icon as={BadgeCheck} size={16} color={theme.c.text} />
                <Text style={s.catPillText}>{t.host_trusted}</Text>
              </View>
            )}
            {hostRating && (
              <View
                style={[s.catPill, { borderColor: theme.c.border }]}
                accessible
                accessibilityLabel={t.a11y_host_rating(hostRating.avg, hostRating.n)}
              >
                <Text style={s.catPillText}>{t.host_rating(hostRating.avg, hostRating.n)}</Text>
              </View>
            )}
            <View style={{ marginLeft: 'auto' }}>
              <LikeSave event={event} size={22} />
            </View>
          </View>

          {friendsGoing.length > 0 && (
            <View style={[s.friendsPill, { backgroundColor: theme.c.social }]}>
              <Text style={[s.friendsText, { color: theme.c.onSocial }]}>
                {t.friends_going_short(
                  joinNames(
                    friendsGoing.map((f) => firstName(f.name)),
                    t.and_word,
                  ),
                  friendsGoing.length,
                )}
              </Text>
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <TagRow
              tags={event.tags}
              onTagPress={(tag) => {
                track('tag_filtered', { tag, source: 'detail' });
                router.push({ pathname: '/', params: { tag } });
              }}
            />
          </View>

          <EventStats event={event} hidden={hidden} spots={spots} going={totalGoing} nowMs={nowMs} />

          <View style={s.infoBox}>
            <Row
              label={t.where}
              value={where}
              link={hidden ? undefined : t.open_map}
              onLink={hidden ? undefined : () => openInMaps(event)}
            />
            <Row label={t.organizer} value={event.organizer.name + (event.organizer.verified ? ' ✓' : '')} />
            {host && <Row label={t.host} value={host.name} />}
            {hidden && <Text style={s.hiddenNote}>{t.hidden_note}</Text>}
          </View>

          {shared.length > 0 && !youreIn && (
            <Text style={s.shared}>
              {(autoAccepts(event, profile.interests) ? t.shared_interests_auto : t.shared_interests)(
                shared.map((x) => t.tag(x)).join(', '),
              )}
            </Text>
          )}

          {event.source === 'platform' && (
            <View style={s.platform}>
              {host ? <Avatar user={host} highlight size={40} /> : null}
              <Text style={s.platformText}>{t.platform_note}</Text>
            </View>
          )}

          {offer && partner && (
            <View style={s.offerBox}>
              <Hand size={22}>{t.offer_title}</Hand>
              <Text style={s.offerText}>
                {offer.text[lang]} {t.offer_at(partner.name)}
              </Text>
            </View>
          )}

          {/* once you're going, the pass (QR for ticketed events) lives in the page; actions live in the bar */}
          {rsvp && !youreIn && (
            <View style={[s.rsvpBox, s.pendingBox, { marginTop: 16 }]}>
              <Text style={s.rsvpTitle}>{t.requested} ⏳</Text>
              <Text style={s.payNote}>{t.request_sent_note}</Text>
            </View>
          )}
          {rateNow && (
            <View style={{ marginTop: 16 }}>
              <RateEvent event={event} />
            </View>
          )}
          {youreIn && rsvp && !rateNow && (
            <View style={[s.rsvpBox, { marginTop: 16 }]}>
              <Text style={s.rsvpTitle}>{t.youre_going}</Text>
              {/* who can see you're going: starts at "nobody" until you choose in the profile */}
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${t.going_seen_by[profile.showGoing]} ${t.going_seen_change}`}
                onPress={() => router.push('/profile')}
                style={({ pressed }) => [s.seenBy, pressed && { opacity: 0.7 }]}
              >
                <Text style={s.seenByText}>
                  {t.going_seen_by[profile.showGoing]} <Text style={s.seenByLink}>{t.going_seen_change}</Text>
                </Text>
              </Pressable>
              {rsvp.reservationCode && (
                <View style={s.qrBox}>
                  <View style={s.qrWrap}>
                    <QRCode value={rsvp.reservationCode} size={128} backgroundColor="#FFFFFF" color="#000000" />
                  </View>
                  <Text style={s.code}>{rsvp.reservationCode}</Text>
                  <Text style={s.payNote}>{t.pay_at_door(event.ticketPriceLek ?? 0)}</Text>
                </View>
              )}
            </View>
          )}

          <Display size={20} style={s.section}>
            {t.about}
          </Display>
          <Text style={s.desc}>{event.description}</Text>

          <Program event={event} hidden={hidden} />

          {event.goodToKnow && event.goodToKnow.length > 0 && (
            <View style={[s.infoBox, { marginTop: 18 }]}>
              <Text style={s.boxTitle}>{t.good_to_know}</Text>
              {event.goodToKnow.map((g) => (
                <View key={g} style={s.bulletRow}>
                  <View style={[s.bulletDot, { backgroundColor: theme.cat[event.category] }]} />
                  <Text style={s.bullet}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {event.faq && event.faq.length > 0 && (
            <>
              <Display size={20} style={s.section}>
                {t.faq_title}
              </Display>
              <FaqList items={event.faq} />
            </>
          )}

          {totalGoing > 0 && (
            <>
              <Display size={20} style={s.section}>
                {t.going_count(totalGoing)}
              </Display>
              <View style={s.avatars}>
                {going.map((u) => (
                  <Avatar key={u.id} user={u} highlight={profile.follows.includes(u.id)} size={36} />
                ))}
                {unnamed > 0 && (
                  <View style={s.moreGoing} accessibilityLabel={t.a11y_going_unnamed(unnamed)}>
                    <Text style={s.moreGoingText}>+{unnamed}</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {similar.length > 0 && (
            <>
              <Display size={20} style={s.section}>
                {t.similar_title}
              </Display>
              <Rail style={s.rail}>
                {similar.map((e) => (
                  <StoryCard key={e.id} event={e} source="similar" size="sm" />
                ))}
              </Rail>
            </>
          )}

          <Comments comments={eventComments} onSend={(text) => addComment(event.id, text)} />

          {/* quiet, at the end: the moment you see a chess event is when you know you never want chess */}
          {event.tags.length > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setHideOpen(true)}
              hitSlop={8}
              style={({ pressed }) => [s.hideLink, pressed && { opacity: 0.6 }]}
            >
              <Text style={s.hideLinkText}>{t.hide_like_this}</Text>
            </Pressable>
          )}
          <HideTopicsSheet visible={hideOpen} onClose={() => setHideOpen(false)} tags={event.tags} />
        </ScrollView>

        {/* steps aside while the keyboard is up, so it never covers the comment box */}
        {!keyboardOpen && (
          <ActionBar
            event={event}
            rsvp={rsvp}
            onShare={() => shareEvent(event, t.share_msg(event.title, when, hidden ? facts.area : event.venueName))}
            onJoin={() => {
              join(event.id);
              hapticSuccess();
            }}
            onAsk={() => {
              requestJoin(event.id);
              hapticSuccess();
            }}
            onCancel={() => cancel(event.id)}
            ended={nowMs >= eventEndMs(event)}
          />
        )}
      </KeyboardAvoidingView>
    </>
  );
}

function Row({ label, value, link, onLink }: { label: string; value: string; link?: string; onLink?: () => void }) {
  const s = useStyles();
  return (
    <View style={s.row}>
      {label ? <Text style={s.rowLabel}>{label}</Text> : null}
      <View style={s.rowBody}>
        <Text style={s.rowValue}>{value}</Text>
        {/* its own line: a full 44px target, not a few words inside the address */}
        {link ? (
          <Pressable accessibilityRole="link" onPress={onLink} style={s.rowLinkHit}>
            <Text style={s.rowLink}>{link}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    scroll: { flex: 1, backgroundColor: t.c.bg },
    trustRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm, marginTop: 10 },
    catPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 32,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 2,
    },
    catPillText: { color: t.c.text, fontSize: 13, fontWeight: '500' },
    hideLink: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: 24 },
    hideLinkText: { color: t.c.textDim, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
    missing: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', gap: 14, padding: 24, backgroundColor: t.c.bg },
    missingText: { color: t.c.textDim, fontSize: 16 },
    content: { padding: 16, paddingBottom: 64, maxWidth: 680, width: '100%', alignSelf: 'center' },
    img: { width: '100%', height: 250, borderRadius: radius.lg, backgroundColor: t.c.surfaceAlt },
    fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, borderRadius: radius.lg },
    badges: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    hostBadge: { marginRight: 2 },
    credit: { color: t.c.textDim, fontSize: 11, marginTop: 6 },
    whenTop: { color: t.c.textDim, fontSize: 15, fontWeight: '700', marginTop: 16, marginBottom: 4 },
    friendsPill: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginTop: 10,
    },
    friendsText: { fontSize: 14, fontWeight: '700' },
    infoBox: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      padding: 14,
      gap: 9,
      marginTop: 16,
    },
    row: { flexDirection: 'row', gap: 8 },
    rowLabel: { color: t.c.textDim, width: 96, fontSize: 14 },
    rowBody: { flex: 1 },
    rowValue: { color: t.c.text, fontSize: 14 },
    rowLinkHit: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
    rowLink: { color: t.c.text, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
    section: { marginTop: 26, marginBottom: 10 },
    boxTitle: { color: t.c.text, fontSize: 15, fontWeight: '700' },
    desc: { color: t.c.text, fontSize: 16, lineHeight: 24, opacity: 0.9 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 8 },
    bullet: { color: t.c.text, fontSize: 15, lineHeight: 22, flex: 1 },
    avatars: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    moreGoing: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreGoingText: { color: t.c.textDim, fontSize: 13, fontWeight: '700' },
    seenBy: { minHeight: 44, justifyContent: 'center' },
    seenByText: { color: t.c.textDim, fontSize: 14, lineHeight: 20 },
    seenByLink: { color: t.c.text, fontWeight: '700', textDecorationLine: 'underline' },
    rsvpBox: {
      backgroundColor: t.c.surface,
      borderColor: t.c.free,
      borderWidth: 2,
      borderRadius: radius.md,
      padding: 16,
      gap: 12,
    },
    hiddenNote: { color: t.c.textDim, fontSize: 13, lineHeight: 18, marginTop: 2 },
    shared: { color: t.c.social, fontSize: 14, fontWeight: '700', marginTop: 12 },
    platform: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 16,
      padding: 14,
      borderRadius: radius.md,
      backgroundColor: t.c.surfaceAlt,
    },
    platformText: { color: t.c.text, fontSize: 14, lineHeight: 20, flex: 1 },
    offerBox: {
      marginTop: 16,
      padding: 14,
      borderRadius: radius.md,
      backgroundColor: t.c.sponsored,
      gap: 4,
      transform: [{ rotate: '-0.6deg' }],
    },
    offerText: { color: t.c.onSponsored, fontSize: 15, fontWeight: '700', lineHeight: 21 },
    pendingBox: { borderColor: t.c.border, borderStyle: 'dashed' },
    rail: { marginHorizontal: -16, paddingLeft: 16 },
    rsvpTitle: { color: t.c.text, fontWeight: '700', fontSize: 17 },
    qrBox: { alignItems: 'center', gap: 8, paddingVertical: 4 },
    qrWrap: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: radius.sm },
    code: { color: t.c.text, fontSize: 20, fontWeight: '600', letterSpacing: 2 },
    payNote: { color: t.c.textDim, fontSize: 14, textAlign: 'center' },
  }),
);
