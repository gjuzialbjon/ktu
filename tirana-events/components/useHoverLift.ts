import { useEffect, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { useTheme } from '../lib/theme';
import { useReducedMotion } from '../lib/useReducedMotion';

/**
 * Shared hover/focus treatment for event cards: one short ease-out lift with a
 * soft shadow, and a slow photo zoom inside the card's frame. Keyboard focus
 * gets the same lift plus a visible ring. With reduced motion, nothing moves;
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

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, reduce ? 0 : -5] });
  const photoScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, reduce ? 1 : 1.06] });

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
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
    translateY,
    photoScale,
    shadow,
    focusRing,
  };
}
