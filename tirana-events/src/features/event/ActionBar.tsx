import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Share2 from 'lucide-react-native/icons/share-2';
import type { EventItem, Rsvp } from '@/data/types';
import { isIn, joinModeOf } from '@/data/access';
import { useI18n } from '@/lib/i18n';
import { lekToEur } from '@/lib/format';
import { makeStyles, useTheme } from '@/lib/theme';
import { Button } from '@/components/ui';

/** Height the scroll content must leave free so its end is not hidden under the bar. */
export const ACTION_BAR_SPACE = 112;

/**
 * Sticky bottom bar in thumb reach: share, price, and the one main action.
 * Once you are in, it shows your status and a quiet way out.
 */
export function ActionBar({
  event,
  rsvp,
  onShare,
  onJoin,
  onAsk,
  onCancel,
}: {
  event: EventItem;
  rsvp: Rsvp | undefined;
  onShare: () => void;
  onJoin: () => void;
  /** ask-to-join events: send a request instead of joining */
  onAsk: () => void;
  onCancel: () => void;
}) {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const price =
    event.priceType === 'ticketed' && event.ticketPriceLek
      ? t.price_door(event.ticketPriceLek) + (lang === 'en' ? `  ${t.eur_hint(lekToEur(event.ticketPriceLek))}` : '')
      : t.free;

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={s.inner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.share}
          onPress={onShare}
          style={({ pressed }) => [s.shareBtn, pressed && { opacity: 0.7 }]}
        >
          <Share2 color={theme.c.text} size={22} strokeWidth={2} />
        </Pressable>
        {rsvp ? (
          <>
            <Text style={s.status} numberOfLines={2}>
              {isIn(rsvp) ? t.youre_going : `${t.requested} ⏳`}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [s.ghost, pressed && { opacity: 0.7 }]}
            >
              <Text style={s.ghostText}>{isIn(rsvp) ? t.cancel_rsvp : t.withdraw}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={s.price} numberOfLines={2}>
              {price}
            </Text>
            <View style={s.cta}>
              {joinModeOf(event) === 'open' ? (
                <Button label={event.priceType === 'free' ? t.im_going : t.reserve} onPress={onJoin} />
              ) : (
                <Button label={t.ask_to_join} onPress={onAsk} />
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    bar: {
      backgroundColor: t.c.surface,
      borderTopWidth: Math.max(StyleSheet.hairlineWidth, t.outline - 1),
      borderTopColor: t.c.border,
      paddingTop: 10,
      paddingHorizontal: 16,
    },
    inner: { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: 680, width: '100%', alignSelf: 'center' },
    shareBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: t.outline,
      borderColor: t.c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    price: { flex: 1, color: t.c.text, fontSize: 14, fontWeight: '600' },
    status: { flex: 1, color: t.c.text, fontSize: 15, fontWeight: '700' },
    cta: { minWidth: 150 },
    ghost: {
      minHeight: 44,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderRadius: 999,
      borderWidth: t.outline,
      borderColor: t.c.border,
    },
    ghostText: { color: t.c.text, fontWeight: '600', fontSize: 14 },
  }),
);
