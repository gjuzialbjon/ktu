import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Comment } from '@/data/types';
import { useI18n } from '@/lib/i18n';
import { initials } from '@/lib/format';
import { makeStyles, radius, useTheme } from '@/lib/theme';
import { Display } from '@/components/ui';

/** Questions and chat under an event; organizer replies are marked. Owns its draft text. */
export function Comments({ comments, onSend }: { comments: Comment[]; onSend: (text: string) => void }) {
  const { t } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const [draft, setDraft] = useState('');
  const canSend = draft.trim().length > 0;

  return (
    <>
      <Display size={20} style={s.title}>
        {t.comments_title(comments.length)}
      </Display>
      <View style={{ gap: 10 }}>
        {comments.map((c) => (
          <View key={c.id} style={[s.comment, c.isOrganizer && s.commentOrg]}>
            <View style={s.head}>
              <View style={s.avatar}>
                <Text style={s.initials}>{initials(c.author)}</Text>
              </View>
              <Text style={s.author}>{c.author}</Text>
              {c.isOrganizer && (
                <View style={s.orgBadge}>
                  <Text style={s.orgBadgeText}>{t.organizer_badge}</Text>
                </View>
              )}
            </View>
            <Text style={s.text}>{c.text}</Text>
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
          style={[s.sendBtn, !canSend && { opacity: 0.4 }]}
          onPress={() => {
            onSend(draft);
            setDraft('');
          }}
          disabled={!canSend}
        >
          <Text style={s.sendText}>{t.send}</Text>
        </Pressable>
      </View>
    </>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    title: { marginTop: 26, marginBottom: 10 },
    comment: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      padding: 12,
      gap: 6,
    },
    commentOrg: { backgroundColor: t.c.surfaceAlt },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: t.c.surfaceAlt,
      borderColor: t.c.border,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: { color: t.c.textDim, fontSize: 10, fontWeight: '800' },
    author: { color: t.c.text, fontSize: 14, fontWeight: '700' },
    orgBadge: { backgroundColor: t.c.text, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
    orgBadgeText: { color: t.c.bg, fontSize: 11, fontWeight: '700' },
    text: { color: t.c.text, fontSize: 15, lineHeight: 21, opacity: 0.9 },
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
