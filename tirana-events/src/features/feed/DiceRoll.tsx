import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Text';
import type { EventItem } from '@ktu/shared';
import { useI18n } from '@/lib/i18n';
import { useEventFacts } from '@/features/event/useEventFacts';
import { hapticTap } from '@/lib/haptics';
import { makeStyles, radius, useTheme } from '@/lib/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { CardTitle } from '@/components/ui';
import { EventPhoto } from '@/components/EventPhoto';

/** Where the die starts: the dice emoji on the "Hidh zarin" button, in window coordinates. */
export interface DiceOrigin {
  x: number;
  y: number;
}

const DIE = 76;
const ARC_HEIGHT = 170;
const FLIGHT_MS = 720;
const HOLD_MS = 650;
const native = Platform.OS !== 'web';

/** Pip positions on a 3×3 grid (0 = top-left … 8 = bottom-right) for each face. */
const FACES: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
const randomFace = () => 1 + Math.floor(Math.random() * 6);

/** Promise wrapper so the sequence reads top to bottom; resolves false if interrupted. */
const play = (a: Animated.CompositeAnimation) =>
  new Promise<boolean>((resolve) => a.start(({ finished }) => resolve(finished)));
const ease = (v: Animated.Value, toValue: number, duration: number, easing = Easing.out(Easing.quad)) =>
  Animated.timing(v, { toValue, duration, easing, useNativeDriver: native });

/**
 * The surprise roll: the die jumps out of the button, tumbles across the screen,
 * lands with a squash and a hop, turns into the picked event's card, and taps it.
 * Tapping anywhere skips straight to the event. Reduced motion: the card just fades in.
 */
export function DiceRoll({
  event,
  origin,
  onOpen,
}: {
  event: EventItem;
  origin: DiceOrigin;
  /** called exactly once, by the auto-tap or a skip */
  onOpen: (event: EventItem) => void;
}) {
  const { t } = useI18n();
  const facts = useEventFacts(event);
  const theme = useTheme();
  const s = useStyles();
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const cx = width / 2;
  const cy = height / 2 - 40;

  const [flight] = useState(() => new Animated.Value(0)); // 0 at the button → 1 landed
  const [backdrop] = useState(() => new Animated.Value(0));
  const [squash] = useState(() => new Animated.Value(0));
  const [hop] = useState(() => new Animated.Value(0));
  const [dieOut] = useState(() => new Animated.Value(0));
  const [card] = useState(() => new Animated.Value(0));
  const [press] = useState(() => new Animated.Value(0));
  const [face, setFace] = useState(5);
  const opened = useRef(false);

  const open = () => {
    if (opened.current) return;
    opened.current = true;
    onOpen(event);
  };

  useEffect(() => {
    let cancelled = false;
    let flicker: ReturnType<typeof setInterval> | undefined;
    const all = [flight, backdrop, squash, hop, dieOut, card, press];

    (async () => {
      // read the setting directly: the hook's first value can arrive after this effect runs
      const reduce = reduceMotion || (await AccessibilityInfo.isReduceMotionEnabled().catch(() => false));
      if (cancelled) return;
      if (reduce) {
        dieOut.setValue(1); // keep the die hidden
        await play(Animated.parallel([ease(backdrop, 1, 200), ease(card, 1, 200)]));
        await play(Animated.delay(HOLD_MS));
        if (!cancelled) open();
        return;
      }

      // 1. jump out of the button and tumble in an arc, the face flicking as it spins
      flicker = setInterval(() => setFace(randomFace()), 85);
      if (!(await play(Animated.parallel([ease(backdrop, 1, 240), ease(flight, 1, FLIGHT_MS, Easing.inOut(Easing.quad))]))))
        return;

      // 2. land: settle on a face, squash, hop once
      clearInterval(flicker);
      setFace(randomFace());
      hapticTap();
      if (
        !(await play(
          Animated.parallel([
            // a timed overshoot instead of a spring: a loose spring keeps wobbling for over a second
            Animated.sequence([ease(squash, 1, 70), ease(squash, 0, 260, Easing.out(Easing.back(3)))]),
            Animated.sequence([ease(hop, 1, 170), ease(hop, 0, 300, Easing.bounce)]),
          ]),
        ))
      )
        return;

      // 3. the die gives way to the event it picked
      AccessibilityInfo.announceForAccessibility(`${t.dice_says} ${event.title}`);
      if (
        !(await play(
          Animated.parallel([
            ease(dieOut, 1, 200),
            Animated.spring(card, {
              toValue: 1,
              friction: 7,
              tension: 120,
              // settle as soon as the motion is invisible, not when it is mathematically still
              restDisplacementThreshold: 0.01,
              restSpeedThreshold: 0.05,
              useNativeDriver: native,
            }),
          ]),
        ))
      )
        return;

      // 4. hold so it can be read, then tap it like a finger would
      if (!(await play(Animated.delay(HOLD_MS)))) return;
      if (!(await play(Animated.sequence([ease(press, 1, 90), ease(press, 0, 140)])))) return;
      if (!cancelled) open();
    })();

    return () => {
      cancelled = true;
      if (flicker) clearInterval(flicker);
      all.forEach((v) => v.stopAnimation());
    };
    // runs once per roll; the component is remounted for each new roll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The flight path: a parabola from the button to the landing spot, sampled so the
  // linear interpolation between points reads as a smooth arc.
  const steps = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
  const dx = origin.x - cx;
  const dy = origin.y - cy;
  const translateX = flight.interpolate({ inputRange: [0, 1], outputRange: [dx, 0] });
  const arcY = flight.interpolate({
    inputRange: steps,
    outputRange: steps.map((p) => dy * (1 - p) - 4 * ARC_HEIGHT * p * (1 - p)),
  });
  const translateY = Animated.add(arcY, hop.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }));
  const rotate = flight.interpolate({ inputRange: [0, 1], outputRange: ['-20deg', '1080deg'] });
  const scale = Animated.multiply(
    flight.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    dieOut.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }),
  );
  const scaleX = squash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const scaleY = squash.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] });

  const cardScale = Animated.multiply(
    card.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 1 : 0.55, 1] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }),
  );
  const cardOpacity = card.interpolate({ inputRange: [0, 0.35], outputRange: [0, 1], extrapolate: 'clamp' });
  const cardWidth = Math.min(300, width - 48);

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={open}>
      <Pressable style={StyleSheet.absoluteFill} onPress={open} accessibilityRole="button" accessibilityLabel={t.dice_skip}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.c.bg, opacity: Animated.multiply(backdrop, 0.94) }]} />

        {!reduceMotion && (
          <Animated.View
            pointerEvents="none"
            style={[
              s.dieSlot,
              { left: cx - DIE / 2, top: cy - DIE / 2 },
              { opacity: dieOut.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
              { transform: [{ translateX }, { translateY }, { rotate }, { scale }, { scaleX }, { scaleY }] },
            ]}
          >
            <Die face={face} />
          </Animated.View>
        )}

        <Animated.View
          pointerEvents="none"
          style={[
            s.cardSlot,
            { width: cardWidth, left: cx - cardWidth / 2, top: cy - 150 },
            { opacity: cardOpacity, transform: [{ scale: cardScale }] },
          ]}
        >
          <Text style={s.says}>{t.dice_says}</Text>
          <View style={s.card}>
            <EventPhoto event={event} style={s.photo} iconSize={44} />
            <View style={s.body}>
              <Text style={s.when}>{facts.when}</Text>
              <CardTitle size={21}>
                {event.title}
              </CardTitle>
              <Text style={s.venue}>
                {facts.where}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/** A drawn die in the theme's main action colour; pips on a 3×3 grid. */
function Die({ face }: { face: number }) {
  const s = useStyles();
  const pips = FACES[face] ?? FACES[5];
  return (
    <View style={s.die}>
      {Array.from({ length: 9 }, (_, i) => (
        <View key={i} style={s.cell}>
          {pips.includes(i) && <View style={s.pip} />}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    dieSlot: { position: 'absolute', width: DIE, height: DIE },
    die: {
      width: DIE,
      height: DIE,
      borderRadius: 18,
      padding: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: t.c.primary,
      borderWidth: Math.max(t.outline, 1.5),
      borderColor: t.c.primary,
      boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
    },
    cell: { width: '33.33%', height: '33.33%', alignItems: 'center', justifyContent: 'center' },
    pip: { width: 11, height: 11, borderRadius: 6, backgroundColor: t.c.onPrimary },
    cardSlot: { position: 'absolute', gap: 10 },
    says: { color: t.c.text, fontSize: 16, fontWeight: '700' },
    card: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.lg,
      overflow: 'hidden',
      boxShadow: '0 14px 36px rgba(0,0,0,0.18)',
    },
    photo: { width: '100%', height: 150 },
    body: { padding: 14, gap: 4 },
    when: { color: t.c.textDim, fontSize: 14, fontWeight: '700' },
    venue: { color: t.c.textDim, fontSize: 14 },
  }),
);
