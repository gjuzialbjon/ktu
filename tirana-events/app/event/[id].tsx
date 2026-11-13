import React, { useState } from 'react';
import {
  Image,
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
import { Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useI18n } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { CATEGORY_META, colors, radius } from '../../lib/theme';
import { formatWhen, initials } from '../../lib/format';
import { Avatar, Button, Chip, TagRow } from '../../components/ui';
import { track } from '../../lib/analytics';
import { FaqItem } from '../../lib/types';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const { events, people, profile, rsvps, join, cancel, comments, addComment } = useStore();
  const [draft, setDraft] = useState('');

  const event = events.find((e) => e.id === id);
  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textDim }}>404</Text>
      </View>
    );
  }

  const meta = CATEGORY_META[event.category];
  const rsvp = rsvps[event.id];
  const going = people.filter((p) => event.goingUserIds.includes(p.id));
  const friendsGoing = going.filter((p) => profile.follows.includes(p.id));
  const when = formatWhen(event.startsAt, lang, t.today, t.tomorrow);
  const eventComments = comments.filter((c) => c.eventId === event.id);
  const spotsLeft =
    event.capacity != null ? event.capacity - event.goingUserIds.length - (rsvp ? 1 : 0) : null;

  const onShare = async () => {
    track('share_card_created', { eventId: event.id, tags: event.tags });
    const url = `tiranaevents://event/${event.id}`;
    try {
      await Share.share({ message: t.share_msg(event.title, when, event.venueName) + url });
      track('share_completed', { eventId: event.id });
    } catch {
      // user dismissed the share sheet
    }
  };

  const onMap = () => {
    const q = encodeURIComponent(`${event.venueName}, Tirana`);
    Linking.openURL(
      Platform.select({
        ios: `maps:0,0?q=${q}`,
        default: `https://www.google.com/maps/search/?api=1&query=${q}`,
      }),
    ).catch(() => {});
  };

  const onSend = () => {
    addComment(event.id, draft);
    setDraft('');
  };

  return (
    <>
      <Stack.Screen options={{ title: event.title }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View>
            <Image source={{ uri: event.coverImage }} style={styles.img} />
            <LinearGradient colors={['transparent', 'rgba(14,17,22,0.95)']} style={styles.fade} />
            <View style={styles.badges}>
              {event.isSponsored && <Chip label={t.sponsored} tone="sponsored" />}
              <Chip
                label={event.priceType === 'free' ? t.free : `${event.ticketPriceLek} Lekë`}
                tone={event.priceType === 'free' ? 'free' : 'default'}
              />
            </View>
            <View style={styles.overImg}>
              <Text style={[styles.catLine, { color: meta.color }]}>
                {meta.emoji} {t[`cat_${event.category}` as const].toUpperCase()}
              </Text>
              <Text style={styles.title}>{event.title}</Text>
            </View>
          </View>

          <TagRow tags={event.tags} />

          <View style={styles.infoBox}>
            <Row label={t.when} value={when} />
            <Row label={t.where} value={`${event.venueName} — ${event.address}`} link={t.open_map} onLink={onMap} />
            <Row label={t.organizer} value={event.organizer.name + (event.organizer.verified ? ' ✓' : '')} />
            {spotsLeft != null && <Row label="" value={t.capacity_left(Math.max(spotsLeft, 0))} />}
          </View>

          <Text style={styles.section}>{t.about}</Text>
          <Text style={styles.desc}>{event.description}</Text>

          {event.goodToKnow && event.goodToKnow.length > 0 && (
            <View style={[styles.infoBox, { marginTop: 20 }]}>
              <Text style={[styles.sectionInline, { color: meta.color }]}>✦ {t.good_to_know}</Text>
              {event.goodToKnow.map((g) => (
                <Text key={g} style={styles.bullet}>
                  •  {g}
                </Text>
              ))}
            </View>
          )}

          {event.faq && event.faq.length > 0 && (
            <>
              <Text style={styles.section}>{t.faq_title}</Text>
              {event.faq.map((f) => (
                <FaqRow key={f.q} item={f} accent={meta.color} />
              ))}
            </>
          )}

          <Text style={styles.section}>
            {t.going_count(going.length + (rsvp ? 1 : 0))}
            {friendsGoing.length > 0
              ? ` · ${t.friends_going}: ${friendsGoing.map((f) => f.name).join(', ')}`
              : ''}
          </Text>
          <View style={styles.avatars}>
            {going.map((u) => (
              <Avatar key={u.id} user={u} highlight={profile.follows.includes(u.id)} />
            ))}
          </View>

          {rsvp ? (
            <View style={styles.rsvpBox}>
              <Text style={styles.rsvpTitle}>{t.youre_going}</Text>
              {rsvp.reservationCode && (
                <View style={styles.qrBox}>
                  <QRCode value={rsvp.reservationCode} size={120} backgroundColor="transparent" color={colors.text} />
                  <Text style={styles.code}>{rsvp.reservationCode}</Text>
                  <Text style={styles.payNote}>{t.pay_at_door(event.ticketPriceLek ?? 0)}</Text>
                </View>
              )}
              <Button label={t.cancel_rsvp} tone="ghost" onPress={() => cancel(event.id)} />
            </View>
          ) : (
            <Button label={event.priceType === 'free' ? t.im_going : t.reserve} onPress={() => join(event.id)} />
          )}

          <View style={{ height: 12 }} />
          <Button label={t.share} tone="ghost" onPress={onShare} />

          {/* Questions & comments */}
          <Text style={styles.section}>{t.comments_title(eventComments.length)}</Text>
          <View style={{ gap: 10 }}>
            {eventComments.map((c) => (
              <View key={c.id} style={[styles.comment, c.isOrganizer && styles.commentOrg]}>
                <View style={styles.commentHead}>
                  <View style={[styles.commentAvatar, c.isOrganizer && { borderColor: meta.color }]}>
                    <Text style={styles.commentInitials}>{initials(c.author)}</Text>
                  </View>
                  <Text style={styles.commentAuthor}>{c.author}</Text>
                  {c.isOrganizer && (
                    <View style={[styles.orgBadge, { backgroundColor: meta.color }]}>
                      <Text style={styles.orgBadgeText}>{t.organizer_badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={t.comment_placeholder}
              placeholderTextColor={colors.textDim}
              multiline
            />
            <Pressable style={[styles.sendBtn, !draft.trim() && { opacity: 0.4 }]} onPress={onSend} disabled={!draft.trim()}>
              <Text style={styles.sendText}>{t.send}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function FaqRow({ item, accent }: { item: FaqItem; accent: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable style={styles.faqRow} onPress={() => setOpen((v) => !v)}>
      <View style={styles.faqHead}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Text style={[styles.faqToggle, { color: accent }]}>{open ? '−' : '+'}</Text>
      </View>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </Pressable>
  );
}

function Row({ label, value, link, onLink }: { label: string; value: string; link?: string; onLink?: () => void }) {
  return (
    <View style={styles.row}>
      {label ? <Text style={styles.rowLabel}>{label}</Text> : null}
      <Text style={styles.rowValue}>
        {value}
        {link ? (
          <Text style={{ color: colors.accent }} onPress={onLink}>
            {'  '}
            {link}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 64, maxWidth: 640, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  img: { width: '100%', height: 240, borderRadius: radius.lg, backgroundColor: colors.cardAlt },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 130, borderRadius: radius.lg },
  badges: { position: 'absolute', top: 12, left: 12, flexDirection: 'row' },
  overImg: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  catLine: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 2 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  infoBox: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    gap: 8,
    marginTop: 14,
  },
  row: { flexDirection: 'row', gap: 8 },
  rowLabel: { color: colors.textDim, width: 90, fontSize: 14 },
  rowValue: { color: colors.text, flex: 1, fontSize: 14 },
  section: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  sectionInline: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  desc: { color: colors.textDim, fontSize: 15, lineHeight: 22 },
  bullet: { color: colors.text, fontSize: 14, lineHeight: 22 },
  faqRow: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
  },
  faqHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  faqQ: { color: colors.text, fontSize: 15, fontWeight: '700', flex: 1 },
  faqToggle: { fontSize: 22, fontWeight: '900' },
  faqA: { color: colors.textDim, fontSize: 14, lineHeight: 21, marginTop: 10 },
  avatars: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 20 },
  rsvpBox: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 16,
    gap: 12,
  },
  rsvpTitle: { color: colors.green, fontWeight: '800', fontSize: 16 },
  qrBox: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  code: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  payNote: { color: colors.textDim, fontSize: 13, textAlign: 'center' },
  comment: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    gap: 6,
  },
  commentOrg: { backgroundColor: colors.cardAlt },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInitials: { color: colors.textDim, fontSize: 9, fontWeight: '800' },
  commentAuthor: { color: colors.text, fontSize: 13, fontWeight: '800' },
  orgBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  orgBadgeText: { color: '#10131A', fontSize: 10, fontWeight: '900' },
  commentText: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-end' },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    padding: 12,
    fontSize: 15,
    minHeight: 46,
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  sendText: { color: '#10131A', fontWeight: '900', fontSize: 15 },
});
