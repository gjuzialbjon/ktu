import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import Svg, { Path } from 'react-native-svg';
import { makeStyles, radius, useTheme } from '@/lib/theme';
import { initials } from '@/lib/format';
import { Organizer, PublicUser } from '@ktu/shared';
import { useI18n } from '@/lib/i18n';

/** Decorative emoji: hidden from screen readers so labels read cleanly. */
export function Emoji({ children, size = 16 }: { children: string; size?: number }) {
  return (
    <Text
      style={{ fontSize: size }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {children}
    </Text>
  );
}

/** Drawn chevron for disclosure controls; points down when closed, up when open. */
export function Chevron({ open, color, size = 12 }: { open: boolean; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
      <Path
        d="M2.5 4.5 L6 8 L9.5 4.5"
        stroke={color}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Heading text in the theme's display face. */
export function Display({
  children,
  size = 24,
  color,
  numberOfLines,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  numberOfLines?: number;
  style?: object;
}) {
  const t = useTheme();
  return (
    <Text
      accessibilityRole="header"
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={1.4}
      style={[
        { fontFamily: t.font, fontSize: size, lineHeight: Math.round(size * 1.15), color: color ?? t.c.text },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/**
 * The name of an event or list on a card: Onest bold, set a touch tight. Young Serif is a
 * display face and turns clumsy stacked two or three lines deep in a narrow card, so it stays
 * on section and page headings (`Display`).
 */
export function CardTitle({
  children,
  size,
  color,
  numberOfLines,
  style,
}: {
  children: React.ReactNode;
  size: number;
  color?: string;
  numberOfLines?: number;
  style?: object;
}) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={1.3}
      style={[
        {
          fontWeight: '800',
          fontSize: size,
          lineHeight: Math.round(size * 1.2),
          letterSpacing: -0.3,
          color: color ?? t.c.text,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/**
 * Handwritten words, for key words in app copy (never event copy). Use sparingly:
 * one per screen region at most, so it still feels like a note someone left.
 */
export function Hand({
  children,
  size = 22,
  color,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: object;
}) {
  const t = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      style={[{ fontFamily: t.hand, fontSize: size, lineHeight: Math.round(size * 1.1), color: color ?? t.c.text }, style]}
    >
      {children}
    </Text>
  );
}

/**
 * A handwritten note on a slip of coloured paper, a little crooked, like a sticker
 * stuck on by hand. `tone` picks the paper from the theme's sticker colours.
 */
export function Sticker({
  children,
  tone = 0,
  tilt = -3,
  size = 20,
  style,
}: {
  children: React.ReactNode;
  tone?: number;
  tilt?: number;
  size?: number;
  style?: object;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: t.sticker[tone % t.sticker.length],
          paddingHorizontal: 10,
          paddingTop: 1,
          paddingBottom: 3,
          borderRadius: 6,
          transform: [{ rotate: `${tilt}deg` }],
          boxShadow: '0 1px 0 rgba(0,0,0,0.06), 0 3px 8px rgba(40,30,60,0.10)',
        },
        style,
      ]}
    >
      <Hand size={size} color="#2A2233">
        {children}
      </Hand>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  tone = 'default',
  emoji,
  accessibilityLabel,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'sponsored' | 'free';
  emoji?: string;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const s = useStyles();
  const bg = tone === 'sponsored' ? t.c.sponsored : tone === 'free' ? t.c.free : active ? t.c.text : t.c.surface;
  const fg = tone === 'sponsored' ? t.c.onSponsored : tone === 'free' ? t.c.onFree : active ? t.c.bg : t.c.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected: !!active } : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={6}
      android_ripple={{ color: t.dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)', foreground: true }}
      style={({ pressed }) => [
        s.chip,
        { backgroundColor: bg, borderColor: active || tone !== 'default' ? bg : t.c.border },
        pressed && { opacity: 0.8 },
      ]}
    >
      {emoji ? <Emoji size={14}>{emoji}</Emoji> : null}
      <Text style={[s.chipText, { color: fg }]}>{label}</Text>
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
  const t = useTheme();
  const s = useStyles();
  const { t: tr } = useI18n();
  return (
    <View style={s.tagRow}>
      {tags.map((tag) => {
        const active = tag === activeTag;
        return (
          <Pressable
            key={tag}
            disabled={!onTagPress}
            onPress={() => onTagPress?.(tag)}
            accessibilityRole={onTagPress ? 'link' : 'text'}
            accessibilityLabel={onTagPress ? tr.a11y_tag(tag) : `#${tag}`}
            // the visual pill is small; the touch area reaches ~44px
            hitSlop={{ top: 11, bottom: 11, left: 4, right: 4 }}
            style={({ pressed }) => [
              s.tag,
              active && { backgroundColor: t.c.text },
              onTagPress && pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[s.tagText, active && { color: t.c.bg }]}>#{tag}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Avatar({ user, highlight, size = 30 }: { user: PublicUser; highlight?: boolean; size?: number }) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={user.name}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: highlight ? 2.5 : 1.5,
        borderColor: highlight ? t.c.social : t.c.border,
        backgroundColor: t.c.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text style={{ color: t.c.textDim, fontSize: size * 0.36, fontWeight: '700' }}>{initials(user.name)}</Text>
      )}
    </View>
  );
}

/**
 * Who runs the event, top-left on every event card: their photo or logo, or their initials.
 * A rounded square, never a circle, so it can't be mistaken for a friend who is going (people
 * are round). The ring takes the category colour, so the kind of event still shows at a glance.
 * Decorative for screen readers: each card names the host in its own label.
 */
export function HostBadge({ host, ring, size = 36 }: { host: Organizer; ring: string; size?: number }) {
  const t = useTheme();
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        borderWidth: 2.5,
        borderColor: ring,
        backgroundColor: t.c.surface,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {host.avatarUrl ? (
        <Image source={{ uri: host.avatarUrl }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text maxFontSizeMultiplier={1} style={{ color: t.c.text, fontSize: Math.round(size * 0.36), fontWeight: '800' }}>
          {initials(host.name)}
        </Text>
      )}
    </View>
  );
}

export function AvatarStack({ users, follows, size = 28 }: { users: PublicUser[]; follows: string[]; size?: number }) {
  const sorted = [...users].sort((a, b) => Number(follows.includes(b.id)) - Number(follows.includes(a.id)));
  return (
    <View style={{ flexDirection: 'row' }}>
      {sorted.slice(0, 5).map((u, i) => (
        <View key={u.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}>
          <Avatar user={u} highlight={follows.includes(u.id)} size={size} />
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
  const t = useTheme();
  const s = useStyles();
  const bg = tone === 'primary' ? t.c.primary : tone === 'success' ? t.c.free : 'transparent';
  const fg = tone === 'primary' ? t.c.onPrimary : tone === 'success' ? t.c.onFree : t.c.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: t.dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)', foreground: true }}
      style={({ pressed }) => [
        s.btn,
        {
          backgroundColor: bg,
          borderColor: tone === 'ghost' ? t.c.border : bg,
          borderWidth: tone === 'ghost' ? t.outline : 0,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: t.outline,
      marginRight: 8,
      overflow: 'hidden',
    },
    chipText: { fontSize: 14, fontWeight: '600' },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: {
      backgroundColor: t.c.surfaceAlt,
      borderRadius: radius.sm,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    tagText: { color: t.c.textDim, fontSize: 12, fontWeight: '600' },
    btn: {
      borderRadius: radius.md,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      overflow: 'hidden',
    },
    btnText: { fontWeight: '700', fontSize: 16 },
  }),
);
