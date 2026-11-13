import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius } from '../lib/theme';
import { initials } from '../lib/format';
import { PublicUser } from '../lib/types';

export function Chip({
  label,
  active,
  onPress,
  tone = 'default',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'sponsored' | 'free';
}) {
  const toneStyle: ViewStyle =
    tone === 'sponsored'
      ? { backgroundColor: colors.goldSoft, borderColor: colors.gold }
      : tone === 'free'
        ? { backgroundColor: colors.greenSoft, borderColor: colors.green }
        : active
          ? { backgroundColor: colors.accentSoft, borderColor: colors.accent }
          : { backgroundColor: colors.card, borderColor: colors.border };
  const textColor =
    tone === 'sponsored' ? colors.gold : tone === 'free' ? colors.green : active ? colors.accent : colors.textDim;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.chip, toneStyle]}>
      <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function TagRow({
  tags,
  onTagPress,
  activeTag,
}: {
  tags: string[];
  /** when set, tags become tappable (used to filter the feed) */
  onTagPress?: (tag: string) => void;
  activeTag?: string | null;
}) {
  return (
    <View style={styles.tagRow}>
      {tags.map((t) => {
        const active = t === activeTag;
        return (
          <Pressable
            key={t}
            disabled={!onTagPress}
            onPress={() => onTagPress?.(t)}
            style={({ pressed }) => [
              styles.tag,
              active && styles.tagActive,
              onTagPress && pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.tagText, (active || !!onTagPress) && styles.tagTextLink, active && styles.tagTextActive]}>
              #{t}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Avatar({ user, highlight }: { user: PublicUser; highlight?: boolean }) {
  return (
    <View
      style={[
        styles.avatar,
        { borderColor: highlight ? colors.accent : colors.border, backgroundColor: highlight ? colors.accentSoft : colors.cardAlt },
      ]}
    >
      <Text style={{ color: highlight ? colors.accent : colors.textDim, fontSize: 11, fontWeight: '700' }}>
        {initials(user.name)}
      </Text>
    </View>
  );
}

export function AvatarStack({ users, follows }: { users: PublicUser[]; follows: string[] }) {
  const sorted = [...users].sort((a, b) => Number(follows.includes(b.id)) - Number(follows.includes(a.id)));
  return (
    <View style={{ flexDirection: 'row' }}>
      {sorted.slice(0, 6).map((u, i) => (
        <View key={u.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar user={u} highlight={follows.includes(u.id)} />
        </View>
      ))}
    </View>
  );
}

export function Button({
  label,
  onPress,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'ghost' | 'success';
}) {
  const bg = tone === 'primary' ? colors.accent : tone === 'success' ? colors.green : 'transparent';
  const fg = tone === 'ghost' ? colors.textDim : '#10131A';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: tone === 'ghost' ? colors.border : bg, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagActive: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent },
  tagText: { color: colors.textDim, fontSize: 12 },
  tagTextLink: { color: '#8FB8E8' },
  tagTextActive: { color: colors.accent, fontWeight: '700' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
