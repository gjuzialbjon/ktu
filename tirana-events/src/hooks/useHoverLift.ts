import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * For the pressable that wraps a card: the card draws its own rounded focus ring, so the
 * browser's square outline is switched off. 'none' is valid CSS that RN's types do not list.
 */
export const NO_BROWSER_OUTLINE = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as ViewStyle;

/**
 * Shared hover/focus treatment for event cards: one short ease-out lift with a
 * soft shadow, and a slow photo zoom inside the card's frame. Keyboard focus
 * (not a click or tap) gets the same lift plus a visible ring. With reduced motion, nothing moves;
 * only the shadow and ring change.
 */
export function useHoverLift() {
  const t = useTheme();
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // held in state, not a ref: one Animated.Value for the component's life, safe to read during render
  const [progress] = useState(() => new Animated.Value(0));
  const active = hovered || focused;

  useEffect(() => {
    const target = active ? 1 : 0;
    if (reduce) {
      progress.setValue(target);
      return;
    }
    Animated.timing(progress, {
      toValue: target,
      duration: active ? 260 : 200,
      easing: Easing.out(Easing.exp),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [active, reduce, progress]);

  // a small lift and a deeper shadow; the photo itself stays still (no zoom on hover)
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, reduce ? 0 : -3] });

  // Offset + soft blur, tinted from the theme's ink rather than flat black on light themes.
  const shadow = active
    ? t.dark
      ? '0px 16px 32px rgba(0, 0, 0, 0.55)'
      : '0px 16px 32px rgba(16, 38, 26, 0.18)'
    : t.dark
      ? '0px 1px 2px rgba(0, 0, 0, 0.35)'
      : '0px 1px 3px rgba(16, 38, 26, 0.08)';

  const focusRing = focused
    ? { outlineColor: t.c.text, outlineWidth: 3, outlineStyle: 'solid' as const, outlineOffset: 3 }
    : null;

  return {
    handlers: {
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
      // the ring is for keyboard users: a click or tap also focuses the card, and should not
      // leave a dark frame around it. On web, ask the browser whether this focus is "visible".
      onFocus: (e: { target?: unknown; nativeEvent?: { target?: unknown } }) => {
        const el = (e?.nativeEvent?.target ?? e?.target) as { matches?: (q: string) => boolean } | undefined;
        setFocused(Platform.OS !== 'web' || !el?.matches || el.matches(':focus-visible'));
      },
      onBlur: () => setFocused(false),
    },
    translateY,
    shadow,
    focusRing,
  };
}
