import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { RATING_ISSUES, NOTE_MAX, type EventItem, type RatingIssue } from '@ktu/shared';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { makeStyles, radius, useTheme } from '@/lib/theme';
import { Button, Chip } from '@/components/ui';

/**
 * "Si ishte?": stars, optional problems for the team, an optional private note. Everything is on
 * screen from the start (the send button waits for stars), so nothing moves while you fill it in.
 * Once sent it folds to a thank-you with your stars and a way to change them (ratings.ts).
 */
export function RateEvent({ event, showTitle = false }: { event: EventItem; showTitle?: boolean }) {
  const { t } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { ratings, rate } = useStore();
  const mine = ratings[event.id];
  const [editing, setEditing] = useState(!mine);
  const [stars, setStars] = useState<number>(mine?.stars ?? 0);
  const [issues, setIssues] = useState<RatingIssue[]>(mine?.issues ?? []);
  const [note, setNote] = useState(mine?.note ?? '');

  const toggleIssue = (i: RatingIssue) => setIssues((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  const send = () => {
    if (stars < 1) return;
    rate(event.id, stars, issues, note);
    setEditing(false);
  };

  if (!editing && mine) {
    return (
      <View style={s.box}>
        {showTitle && <Text style={s.event}>{event.title}</Text>}
        <View style={s.doneRow}>
          <Text style={s.doneStars} accessibilityLabel={t.a11y_stars(mine.stars)}>
            {'★'.repeat(mine.stars)}
            <Text style={{ color: theme.c.border }}>{'★'.repeat(5 - mine.stars)}</Text>
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={s.change}>
            <Text style={s.changeText}>{t.rate_change}</Text>
          </Pressable>
        </View>
        <Text style={s.hint}>{t.rate_thanks}</Text>
      </View>
    );
  }

  return (
    <View style={s.box}>
      {/* in a list the section heading asks the question; each card names its event */}
      {showTitle ? <Text style={s.event}>{event.title}</Text> : <Text style={s.title}>{t.rate_title}</Text>}
      <Text style={s.hint}>{t.rate_hint}</Text>
      <View style={s.starsRow} accessibilityRole="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ checked: stars === n }}
            accessibilityLabel={t.a11y_stars(n)}
            onPress={() => setStars(n)}
            style={({ pressed }) => [s.star, pressed && { transform: [{ scale: 0.92 }] }]}
          >
            <Text style={[s.starText, { color: n <= stars ? theme.c.text : theme.c.border }]}>★</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>{t.rate_issues_label}</Text>
      <View style={s.wrap}>
        {RATING_ISSUES.map((i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Chip label={t.rate_issue[i]} active={issues.includes(i)} onPress={() => toggleIssue(i)} />
          </View>
        ))}
      </View>

      <TextInput
        style={s.input}
        value={note}
        onChangeText={setNote}
        maxLength={NOTE_MAX}
        multiline
        placeholder={t.rate_note_ph}
        placeholderTextColor={theme.c.textDim}
        accessibilityLabel={t.rate_note_ph}
      />
      {/* the label stays the same; until stars are picked the button just waits */}
      <View style={{ opacity: stars ? 1 : 0.45 }} aria-disabled={!stars}>
        <Button label={t.rate_send} onPress={send} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    box: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      padding: 16,
      gap: 10,
    },
    title: { color: t.c.text, fontSize: 18, fontWeight: '600' },
    event: { color: t.c.text, fontSize: 17, fontWeight: '700' },
    hint: { color: t.c.textDim, fontSize: 14, lineHeight: 20 },
    starsRow: { flexDirection: 'row', gap: 4 },
    star: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    starText: { fontSize: 36, lineHeight: 42 },
    label: { color: t.c.textDim, fontSize: 14, fontWeight: '700', marginTop: 4 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap' },
    input: {
      backgroundColor: t.c.bg,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      color: t.c.text,
      padding: 12,
      fontSize: 15,
      minHeight: 72,
      textAlignVertical: 'top',
    },
    doneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    doneStars: { color: t.c.text, fontSize: 26, letterSpacing: 2 },
    change: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 8 },
    changeText: { color: t.c.text, fontWeight: '700', textDecorationLine: 'underline', fontSize: 15 },
  }),
);
