import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useI18n } from '@/lib/i18n';
import { makeStyles, useTheme } from '@/lib/theme';

const FINE = '(hover: hover) and (pointer: fine)';
const hasMouse = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.matchMedia?.(FINE).matches;

/** True on the web with a mouse: rows there cannot be swiped, so they get arrow buttons. */
function useMouse() {
  const [mouse, setMouse] = useState(hasMouse);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(FINE);
    const on = () => setMouse(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return mouse;
}

/**
 * A horizontal row you swipe on a phone. With a mouse (web on a computer) it also shows round
 * ‹ › buttons over its edges, each only while there is more to see that way. The buttons float
 * over the cards, so showing or hiding them moves nothing.
 */
export function Rail({
  style,
  children,
  compact,
  ...scroll
}: Omit<ScrollViewProps, 'horizontal' | 'onScroll' | 'onLayout' | 'onContentSizeChange'> & {
  /** smaller buttons, for a row of chips */
  compact?: boolean;
}) {
  const { t } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const mouse = useMouse();
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [m, setM] = useState({ x: 0, w: 0, content: 0 });
  const canBack = m.x > 4;
  const canFwd = m.w > 0 && m.x + m.w < m.content - 4;
  const page = (dir: 1 | -1) => {
    const x = Math.max(0, Math.min(m.content - m.w, m.x + dir * m.w * 0.8));
    ref.current?.scrollTo({ x, animated: true });
  };
  const arrow = (dir: 1 | -1, show: boolean) => {
    const Icon = dir < 0 ? ChevronLeft : ChevronRight;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dir < 0 ? t.a11y_rail_prev : t.a11y_rail_next}
        onPress={() => page(dir)}
        disabled={!show}
        // hidden, not removed: the row never changes size, the button just fades
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          s.arrow,
          dir < 0 ? s.left : s.right,
          compact && s.compact,
          { opacity: show ? (pressed ? 0.75 : 1) : 0 },
          hovered && show && { transform: [{ scale: 1.06 }] },
        ]}
        pointerEvents={show ? 'auto' : 'none'}
      >
        <Icon size={compact ? 18 : 22} color={theme.c.text} strokeWidth={2.4} />
      </Pressable>
    );
  };
  return (
    <View style={style}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setM((p) => (p.w === w ? p : { ...p, w }));
        }}
        onContentSizeChange={(content) => setM((p) => (p.content === content ? p : { ...p, content }))}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          // only re-render when an arrow would appear or disappear
          setM((p) => ((p.x > 4) === (x > 4) && (p.x + p.w < p.content - 4) === (x + p.w < p.content - 4) ? p : { ...p, x }));
        }}
        {...scroll}
      >
        {children}
      </ScrollView>
      {mouse && arrow(-1, canBack)}
      {mouse && arrow(1, canFwd)}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    arrow: {
      position: 'absolute',
      top: '50%',
      marginTop: -20,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.c.surface,
      borderWidth: t.outline,
      borderColor: t.c.border,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    compact: { width: 32, height: 32, borderRadius: 16, marginTop: -16 },
    left: { left: 8 },
    right: { right: 8 },
  }),
);
