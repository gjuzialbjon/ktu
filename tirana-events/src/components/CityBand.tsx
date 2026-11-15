import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/lib/theme';

/**
 * The app's signature: a Tirana skyline of apartment blocks with the Pyramid,
 * painted per theme (lit windows at night, soft blocks by the lake, the city's
 * painted facades). Purely decorative, so it is hidden from screen readers.
 */

type Shape =
  | { kind: 'block'; x: number; w: number; h: number; fill: string; stripe?: string; windows: { x: number; y: number; lit: boolean }[] }
  | { kind: 'pyramid'; x: number; w: number; h: number; fill: string };

/** Deterministic PRNG so the skyline is stable across renders. */
function prng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function CityBand({ height = 92 }: { height?: number }) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const groundY = t.band.water ? height - 10 : height - 2;

  const shapes = useMemo<Shape[]>(() => {
    if (width === 0) return [];
    const r = prng(1912); // Tirana became the capital in 1920; close enough for a seed
    const out: Shape[] = [];
    const pyramidAt = width * 0.58;
    let placedPyramid = false;
    let x = 0;
    let i = 0;
    const litChance = t.id === 'nata' ? 0.3 : t.id === 'fasadat' ? 0.55 : 0.4;
    while (x < width) {
      if (!placedPyramid && x >= pyramidAt) {
        const pw = Math.min(78, height * 0.95);
        out.push({ kind: 'pyramid', x, w: pw, h: groundY * 0.62, fill: t.band.blocks[1 % t.band.blocks.length] });
        x += pw + 3;
        placedPyramid = true;
        continue;
      }
      const w = 20 + Math.floor(r() * 26);
      const h = groundY * (0.32 + r() * 0.62);
      const fill = t.band.blocks[i % t.band.blocks.length];
      const top = groundY - h;
      const windows: { x: number; y: number; lit: boolean }[] = [];
      const cols = Math.min(3, Math.floor((w - 6) / 7));
      const rows = Math.min(6, Math.floor((h - 10) / 9));
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          windows.push({ x: x + 5 + col * 7, y: top + 7 + row * 9, lit: r() < litChance });
        }
      }
      const stripe =
        t.id === 'fasadat' && r() < 0.45 ? t.band.blocks[(i + 3) % t.band.blocks.length] : undefined;
      out.push({ kind: 'block', x, w, h, fill, stripe, windows });
      x += w + (t.id === 'fasadat' ? 2 : 3);
      i++;
    }
    return out;
  }, [width, t.id, t.band, groundY, height]);

  return (
    <View
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      style={{ height, width: '100%' }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          {t.band.sun ? (
            <Circle cx={width * 0.84} cy={height * 0.26} r={height * 0.14} fill={t.band.sun} opacity={t.dark ? 0.9 : 1} />
          ) : null}
          {shapes.map((s, idx) => {
            if (s.kind === 'pyramid') {
              const top = groundY - s.h;
              return (
                <Path
                  key={`p${idx}`}
                  d={`M${s.x} ${groundY} L${s.x + s.w * 0.5} ${top} L${s.x + s.w} ${groundY} Z`}
                  fill={s.fill}
                  stroke={t.id === 'fasadat' ? t.c.text : 'none'}
                  strokeWidth={t.id === 'fasadat' ? 2 : 0}
                />
              );
            }
            const top = groundY - s.h;
            return (
              <G key={`b${idx}`}>
                <Rect
                  x={s.x}
                  y={top}
                  width={s.w}
                  height={s.h}
                  fill={s.fill}
                  stroke={t.id === 'fasadat' ? t.c.text : 'none'}
                  strokeWidth={t.id === 'fasadat' ? 1.5 : 0}
                />
                {s.stripe ? <Rect x={s.x} y={top + s.h * 0.55} width={s.w} height={s.h * 0.18} fill={s.stripe} /> : null}
                {s.windows.map((w, wi) => (
                  <Rect
                    key={wi}
                    x={w.x}
                    y={w.y}
                    width={3}
                    height={4}
                    fill={w.lit ? t.band.window : t.band.windowOff}
                  />
                ))}
              </G>
            );
          })}
          {t.band.water ? (
            <Rect x={0} y={groundY} width={width} height={height - groundY} fill={t.band.water} />
          ) : (
            <Rect x={0} y={groundY} width={width} height={2} fill={t.c.border} />
          )}
        </Svg>
      )}
    </View>
  );
}
