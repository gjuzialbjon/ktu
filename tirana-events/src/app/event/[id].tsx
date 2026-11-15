import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { areaName, cityName } from '@/data/cities';
import { spotsLeft } from '@/data/events';
import { CATEGORY_EMOJI, makeStyles, radius, useTheme } from '@/lib/theme';
import { firstName, formatWhen, joinNames } from '@/lib/format';
import { Avatar, Button, Chip, Display, Emoji, TagRow } from '@/components/ui';
import { EventPhoto } from '@/components/EventPhoto';
import { track } from '@/lib/analytics';
import { hapticSuccess } from '@/lib/haptics';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { ACTION_BAR_SPACE, ActionBar } from '@/features/event/ActionBar';
import { Comments } from '@/features/event/Comments';
import { FaqList } from '@/features/event/FaqList';
import { openInMaps, shareEvent } from '@/features/event/actions';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const s = useStyles();
  const { t, lang } = useI18n();
  const { events, people, profile, rsvps, join, cancel, comments, addComment } = useStore();
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardVisible();

  const event = events.find((e) => e.id === id);
  if (!event) {
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

  const rsvp = rsvps[event.id];
  const going = people.filter((p) => event.goingUserIds.includes(p.id));
  const friendsGoing = going.filter((p) => profile.follows.includes(p.id));
  const when = formatWhen(event.startsAt, lang, t.today, t.tomorrow);
  // name the city too: plans and shared links can point at events outside your city
  const hood = `${areaName(event.city, event.neighborhood, lang)}, ${cityName(event.city, lang)}`;
  const eventComments = comments.filter((c) => c.eventId === event.id);
  const totalGoing = going.length + (rsvp ? 1 : 0);
  const spots = spotsLeft(event, !!rsvp);

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
            <EventPhoto event={event} style={s.img} emojiSize={64} />
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']} style={s.fade} />
            <View style={s.badges}>
              <View style={[s.catBubble, { backgroundColor: theme.cat[event.category] }]}>
                <Emoji size={19}>{CATEGORY_EMOJI[event.category]}</Emoji>
              </View>
              {event.isSponsored && <Chip label={t.sponsored} tone="sponsored" />}
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

          <View style={s.infoBox}>
            <Row label={t.when} value={when} />
            <Row label={t.where} value={`${event.venueName}, ${hood}`} link={t.open_map} onLink={() => openInMaps(event)} />
            <Row label={t.organizer} value={event.organizer.name + (event.organizer.verified ? ' ✓' : '')} />
            {spots != null && <Row label="" value={t.capacity_left(spots)} />}
          </View>

          {/* once you're going, the pass (QR for ticketed events) lives in the page; actions live in the bar */}
          {rsvp && (
            <View style={[s.rsvpBox, { marginTop: 16 }]}>
              <Text style={s.rsvpTitle}>{t.youre_going}</Text>
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
              </View>
            </>
          )}

          <Comments comments={eventComments} onSend={(text) => addComment(event.id, text)} />
        </ScrollView>

        {/* steps aside while the keyboard is up, so it never covers the comment box */}
        {!keyboardOpen && (
          <ActionBar
            event={event}
            rsvp={rsvp}
            onShare={() => shareEvent(event, t.share_msg(event.title, when, event.venueName))}
            onJoin={() => {
              join(event.id);
              hapticSuccess();
            }}
            onCancel={() => cancel(event.id)}
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
      <Text style={s.rowValue}>
        {value}
        {link ? (
          <Text style={s.rowLink} onPress={onLink} accessibilityRole="link">
            {'  '}
            {link}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    scroll: { flex: 1, backgroundColor: t.c.bg },
    missing: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', gap: 14, padding: 24, backgroundColor: t.c.bg },
    missingText: { color: t.c.textDim, fontSize: 16 },
    content: { padding: 16, paddingBottom: 64, maxWidth: 680, width: '100%', alignSelf: 'center' },
    img: { width: '100%', height: 250, borderRadius: radius.lg, backgroundColor: t.c.surfaceAlt },
    fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, borderRadius: radius.lg },
    badges: { position: 'absolute', top: 12, left: 12, right: 4, flexDirection: 'row', alignItems: 'center' },
    catBubble: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
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
    rowValue: { color: t.c.text, flex: 1, fontSize: 14 },
    rowLink: { color: t.c.text, fontWeight: '700', textDecorationLine: 'underline' },
    section: { marginTop: 26, marginBottom: 10 },
    boxTitle: { color: t.c.text, fontSize: 15, fontWeight: '700' },
    desc: { color: t.c.text, fontSize: 16, lineHeight: 24, opacity: 0.9 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 8 },
    bullet: { color: t.c.text, fontSize: 15, lineHeight: 22, flex: 1 },
    avatars: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    rsvpBox: {
      backgroundColor: t.c.surface,
      borderColor: t.c.free,
      borderWidth: 2,
      borderRadius: radius.md,
      padding: 16,
      gap: 12,
    },
    rsvpTitle: { color: t.c.text, fontWeight: '700', fontSize: 17 },
    qrBox: { alignItems: 'center', gap: 8, paddingVertical: 4 },
    qrWrap: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: radius.sm },
    code: { color: t.c.text, fontSize: 20, fontWeight: '800', letterSpacing: 2 },
    payNote: { color: t.c.textDim, fontSize: 14, textAlign: 'center' },
  }),
);
