import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useI18n } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { CATEGORY_EMOJI, makeStyles, radius, useTheme } from '../../lib/theme';
import { firstName, formatWhen, initials, joinNames, lekToEur } from '../../lib/format';
import { Avatar, Button, Chip, Display, Emoji, TagRow } from '../../components/ui';
import { track } from '../../lib/analytics';
import { FaqItem } from '../../lib/types';
import { EventPhoto } from '../../components/EventPhoto';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const s = useStyles();
  const { t, lang } = useI18n();
  const { events, people, profile, rsvps, join, cancel, comments, addComment } = useStore();
  const [draft, setDraft] = useState('');

  const event = events.find((e) => e.id === id);
  if (!event) {
    return (
      <View style={s.center}>
        <Text style={{ color: theme.c.textDim }}>404</Text>
      </View>
    );
  }

  const rsvp = rsvps[event.id];
  const going = people.filter((p) => event.goingUserIds.includes(p.id));
  const friendsGoing = going.filter((p) => profile.follows.includes(p.id));
  const when = formatWhen(event.startsAt, lang, t.today, t.tomorrow);
  const hood = t[`hood_${event.neighborhood}` as const];
  const eventComments = comments.filter((c) => c.eventId === event.id);
  const totalGoing = going.length + (rsvp ? 1 : 0);
  const spotsLeft = event.capacity != null ? event.capacity - event.goingUserIds.length - (rsvp ? 1 : 0) : null;

  const onShare = async () => {
    track('share_card_created', { eventId: event.id, tags: event.tags });
    try {
      await Share.share({
        message: t.share_msg(event.title, when, event.venueName) + `tiranaevents://event/${event.id}`,
      });
      track('share_completed', { eventId: event.id });
    } catch {
      // user dismissed the share sheet
    }
  };

  const onMap = () => {
    const q = encodeURIComponent(`${event.venueName}, Tirana`);
    Linking.openURL(
      Platform.select({ ios: `maps:0,0?q=${q}`, default: `https://www.google.com/maps/search/?api=1&query=${q}` }),
    ).catch(() => {});
  };

  const onSend = () => {
    addComment(event.id, draft);
    setDraft('');
  };

  return (
    <>
      <Stack.Screen options={{ title: event.title }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
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
            <Row label={t.where} value={`${event.venueName}, ${hood}`} link={t.open_map} onLink={onMap} />
            <Row label={t.organizer} value={event.organizer.name + (event.organizer.verified ? ' ✓' : '')} />
            {spotsLeft != null && <Row label="" value={t.capacity_left(Math.max(spotsLeft, 0))} />}
          </View>

          {/* Primary action, with the payment promise stated before the tap */}
          <View style={{ marginTop: 16, gap: 8 }}>
            {rsvp ? (
              <View style={s.rsvpBox}>
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
                <Button label={t.cancel_rsvp} tone="ghost" onPress={() => cancel(event.id)} />
              </View>
            ) : (
              <>
                {event.priceType === 'ticketed' && event.ticketPriceLek ? (
                  <Text style={s.payPromise}>
                    {t.price_door(event.ticketPriceLek)}
                    {lang === 'en' ? `  ${t.eur_hint(lekToEur(event.ticketPriceLek))}` : ''}
                  </Text>
                ) : null}
                <Button label={event.priceType === 'free' ? t.im_going : t.reserve} onPress={() => join(event.id)} />
              </>
            )}
            <Button label={t.share} tone="ghost" onPress={onShare} />
          </View>

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
              {event.faq.map((f) => (
                <FaqRow key={f.q} item={f} />
              ))}
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

          <Display size={20} style={s.section}>
            {t.comments_title(eventComments.length)}
          </Display>
          <View style={{ gap: 10 }}>
            {eventComments.map((c) => (
              <View key={c.id} style={[s.comment, c.isOrganizer && s.commentOrg]}>
                <View style={s.commentHead}>
                  <View style={s.commentAvatar}>
                    <Text style={s.commentInitials}>{initials(c.author)}</Text>
                  </View>
                  <Text style={s.commentAuthor}>{c.author}</Text>
                  {c.isOrganizer && (
                    <View style={s.orgBadge}>
                      <Text style={s.orgBadgeText}>{t.organizer_badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={s.commentText}>{c.text}</Text>
              </View>
            ))}
          </View>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={t.comment_placeholder}
              placeholderTextColor={theme.c.textDim}
              accessibilityLabel={t.comment_placeholder}
              multiline
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.send}
              style={[s.sendBtn, !draft.trim() && { opacity: 0.4 }]}
              onPress={onSend}
              disabled={!draft.trim()}
            >
              <Text style={s.sendText}>{t.send}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const s = useStyles();
  return (
    <Pressable
      style={s.faqRow}
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <View style={s.faqHead}>
        <Text style={s.faqQ}>{item.q}</Text>
        <Text style={s.faqToggle}>{open ? '−' : '+'}</Text>
      </View>
      {open && <Text style={s.faqA}>{item.a}</Text>}
    </Pressable>
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
    content: { padding: 16, paddingBottom: 64, maxWidth: 680, width: '100%', alignSelf: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.c.bg },
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
    payPromise: { color: t.c.text, fontSize: 15, fontWeight: '600' },
    section: { marginTop: 26, marginBottom: 10 },
    boxTitle: { color: t.c.text, fontSize: 15, fontWeight: '700' },
    desc: { color: t.c.text, fontSize: 16, lineHeight: 24, opacity: 0.9 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 8 },
    bullet: { color: t.c.text, fontSize: 15, lineHeight: 22, flex: 1 },
    faqRow: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      padding: 14,
      marginBottom: 8,
    },
    faqHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    faqQ: { color: t.c.text, fontSize: 15, fontWeight: '700', flex: 1 },
    faqToggle: { color: t.c.text, fontSize: 22, fontWeight: '700' },
    faqA: { color: t.c.textDim, fontSize: 15, lineHeight: 22, marginTop: 10 },
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
    comment: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      padding: 12,
      gap: 6,
    },
    commentOrg: { backgroundColor: t.c.surfaceAlt },
    commentHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    commentAvatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: t.c.surfaceAlt,
      borderColor: t.c.border,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentInitials: { color: t.c.textDim, fontSize: 10, fontWeight: '800' },
    commentAuthor: { color: t.c.text, fontSize: 14, fontWeight: '700' },
    orgBadge: { backgroundColor: t.c.text, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
    orgBadgeText: { color: t.c.bg, fontSize: 11, fontWeight: '700' },
    commentText: { color: t.c.text, fontSize: 15, lineHeight: 21, opacity: 0.9 },
    inputRow: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-end' },
    input: {
      flex: 1,
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      color: t.c.text,
      padding: 12,
      fontSize: 15,
      minHeight: 48,
      maxHeight: 120,
    },
    sendBtn: {
      backgroundColor: t.c.primary,
      borderRadius: radius.md,
      paddingHorizontal: 18,
      minHeight: 48,
      justifyContent: 'center',
    },
    sendText: { color: t.c.onPrimary, fontWeight: '800', fontSize: 15 },
  }),
);
