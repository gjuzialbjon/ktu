import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { EventItem } from '@/data/types';
import { useI18n } from '@/lib/i18n';
import { makeStyles, space, useTheme } from '@/lib/theme';
import { Display } from '@/components/ui';
import { StoryCard } from '@/components/StoryCard';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { track } from '@/lib/analytics';

const CARD_GAP = 12; // StoryCard's own right margin
/** it moves on by itself every few seconds, until you touch it */
const AUTO_MS = 4000;
const DOT = 8;
const DOT_SLOT = 18;
/** a column at least this wide shows the picks side by side instead of one at a time */
const GRID_2 = 600;
const GRID_3 = 900;

/**
 * "Mos i humb": the few events worth leading with, one full-width card at a time.
 * It moves on by itself every few seconds and stops for good (this visit) the moment you
 * interact: touch, swipe, a dot, or a trackpad/wheel scroll on web. With reduced motion on it
 * still moves on, but jumps instead of sliding. The dots sit beside the heading (no extra row)
 * and never change size, only colour and scale, so nothing around them moves.
 *
 * On a wide screen (web on a computer, tablets) one card stretched across the page looks empty,
 * so the first 2–3 picks sit side by side instead: no carousel, no dots, nothing moving.
 */
export function HighlightsCarousel({ title, events, maxWidth }: { title: string; events: EventItem[]; maxWidth: number }) {
  const { t } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const colW = Math.min(width, maxWidth) - space.lg * 2;
  const cols = colW >= GRID_3 ? 3 : colW >= GRID_2 ? 2 : 1;
  const cardW = colW;
  const step = cardW + CARD_GAP;
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  // once you interact it never moves by itself again (this visit)
  const stopped = useRef(false);
  // our own last scroll, from → to: positions inside that range (incl. the settling events after
  // it lands) are ours; a scroll anywhere else (trackpad, wheel, keyboard) is you
  const own = useRef<{ from: number; to: number } | null>(null);
  const offset = useRef(0);
  const n = events.length;

  const goTo = (i: number) => {
    own.current = { from: offset.current, to: i * step };
    ref.current?.scrollTo({ x: i * step, animated: !reduceMotion });
  };
  const stop = () => {
    stopped.current = true;
  };

  useEffect(() => {
    if (n < 2 || cols > 1) return;
    const id = setInterval(() => {
      if (stopped.current) {
        clearInterval(id);
        return;
      }
      const x = ((indexRef.current + 1) % n) * step;
      own.current = { from: offset.current, to: x };
      ref.current?.scrollTo({ x, animated: !reduceMotion });
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [reduceMotion, n, step, cols]);

  if (n === 0) return null;
  if (cols > 1) {
    const shown = events.slice(0, cols);
    // StoryCard keeps a CARD_GAP right margin; the row gives the last one back
    const w = Math.floor((colW - CARD_GAP * (cols - 1)) / cols);
    return (
      <View style={s.wrap}>
        <View style={s.head}>
          <Display size={19} style={{ flexShrink: 1 }}>
            {title}
          </Display>
        </View>
        <View style={s.grid}>
          {shown.map((e) => (
            <StoryCard key={e.id} event={e} source="highlights" size="wide" width={w} />
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <Display size={19} style={{ flexShrink: 1 }}>
          {title}
        </Display>
        {n > 1 && (
          <View style={s.dots} accessibilityRole="tablist">
            {events.map((e, i) => {
              const on = i === index;
              return (
                <Pressable
                  key={e.id}
                  // tabs carry "selected", so a screen reader knows which card is showing
                  accessibilityRole="tab"
                  accessibilityLabel={t.a11y_slide(i + 1, n)}
                  aria-selected={on}
                  hitSlop={{ top: 12, bottom: 12 }}
                  onPress={() => {
                    stop();
                    track('highlight_dot', { index: i });
                    goTo(i);
                  }}
                  style={s.dotSlot}
                >
                  <View
                    style={[
                      s.dot,
                      { backgroundColor: on ? theme.c.text : theme.c.border, transform: [{ scale: on ? 1.25 : 1 }] },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.rail}
        contentContainerStyle={s.railContent}
        snapToInterval={step}
        decelerationRate="fast"
        disableIntervalMomentum
        scrollEventThrottle={32}
        onScrollBeginDrag={stop}
        onTouchStart={stop}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          offset.current = x;
          const o = own.current;
          const ours = o != null && x >= Math.min(o.from, o.to) - 2 && x <= Math.max(o.from, o.to) + 2;
          if (!ours) stop();
          const i = Math.max(0, Math.min(n - 1, Math.round(x / step)));
          if (i !== indexRef.current) {
            indexRef.current = i;
            setIndex(i);
          }
        }}
      >
        {events.map((e) => (
          <StoryCard key={e.id} event={e} source="highlights" size="wide" width={cardW} />
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    wrap: { gap: 2 },
    head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    dots: { flexDirection: 'row', marginLeft: 'auto' },
    dotSlot: { width: DOT_SLOT, height: 24, alignItems: 'center', justifyContent: 'center' },
    dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
    rail: { flexGrow: 0, marginHorizontal: -space.lg },
    grid: { flexDirection: 'row', marginRight: -CARD_GAP },
    railContent: { paddingHorizontal: space.lg },
  }),
);
