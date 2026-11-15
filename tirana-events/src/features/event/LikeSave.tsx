import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Heart from 'lucide-react-native/icons/heart';
import Bookmark from 'lucide-react-native/icons/bookmark';
import type { EventItem } from '@/data/types';
import { useStore } from '@/data/store';
import { useI18n } from '@/lib/i18n';
import { makeStyles, useTheme } from '@/lib/theme';
import { hapticTap } from '@/lib/haptics';

/**
 * Like (a public nod, counted) and save (private, for later; listed under Plans).
 * Both are quiet icon buttons with 44pt targets; filled when on.
 */
export function LikeSave({ event, size = 20 }: { event: EventItem; size?: number }) {
  const { t } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { likes, saved, toggleLike, toggleSave } = useStore();
  const liked = !!likes[event.id];
  const isSaved = !!saved[event.id];
  const count = (event.likeCount ?? 0) + (liked ? 1 : 0);

  return (
    <View style={s.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={liked ? t.unlike : t.like}
        accessibilityState={{ selected: liked }}
        onPress={() => {
          hapticTap();
          toggleLike(event.id);
        }}
        hitSlop={6}
        style={({ pressed }) => [s.btn, pressed && { transform: [{ scale: 0.9 }] }]}
      >
        <Heart
          color={liked ? theme.c.primary : theme.c.textDim}
          fill={liked ? theme.c.primary : 'transparent'}
          size={size}
          strokeWidth={2}
        />
        {count > 0 ? <Text style={[s.count, liked && { color: theme.c.text }]}>{count}</Text> : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isSaved ? t.unsave : t.save}
        accessibilityState={{ selected: isSaved }}
        onPress={() => {
          hapticTap();
          toggleSave(event.id);
        }}
        hitSlop={6}
        style={({ pressed }) => [s.btn, pressed && { transform: [{ scale: 0.9 }] }]}
      >
        <Bookmark
          color={isSaved ? theme.c.text : theme.c.textDim}
          fill={isSaved ? theme.c.text : 'transparent'}
          size={size}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, minWidth: 40, justifyContent: 'center', paddingHorizontal: 4 },
    count: { color: t.c.textDim, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  }),
);
