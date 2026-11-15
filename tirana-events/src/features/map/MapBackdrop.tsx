import React from 'react';
import { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { City } from '@/data/cities';
import type { Theme } from '@/lib/theme';
import { MAP_H as H, MAP_W as W } from './project';

/**
 * What the pins sit on. Tirana has a hand-drawn map with its landmarks; every other
 * city gets the same visual language from its data: its sea or lake, a few main
 * roads and its name. Draw a city by hand by adding a case here.
 */
export function MapBackdrop({
  city,
  theme,
  cityLabel,
  waterLabel,
}: {
  city: City;
  theme: Theme;
  cityLabel: string;
  waterLabel?: string;
}) {
  const m = theme.map;
  const roadW = 7;
  return (
    <>
      <Rect x={0} y={0} width={W} height={H} fill={m.ground} />
      {city.id === 'tirana' ? <Tirana theme={theme} roadW={roadW} /> : <Generic city={city} theme={theme} roadW={roadW} />}
      <SvgText x={W - 14} y={24} fontSize={12} fill={m.label} textAnchor="end" fontWeight="bold">
        {cityLabel}
      </SvgText>
      {waterLabel && city.water && (
        <SvgText
          x={city.water.side === 'south' ? W / 2 : 24}
          y={city.water.side === 'south' ? H - 22 : H / 2}
          fontSize={11}
          fill={m.label}
          textAnchor="middle"
          fontStyle="italic"
          opacity={0.75}
        >
          {waterLabel}
        </SvgText>
      )}
    </>
  );
}

/** The original hand-drawn Tirana: Lana, the boulevard, the ring road, the park and lake. */
function Tirana({ theme, roadW }: { theme: Theme; roadW: number }) {
  const m = theme.map;
  return (
    <>
      <Path d="M150 290 Q 230 270 280 300 Q 300 350 250 385 Q 180 400 140 370 Q 120 320 150 290 Z" fill={m.park} />
      <Path d="M175 315 Q 225 300 255 325 Q 260 355 225 365 Q 180 365 170 340 Z" fill={m.water} />
      <Path d="M0 250 Q 90 235 180 245 Q 270 255 360 235" stroke={m.water} strokeWidth={7} fill="none" />
      <Path d="M196 60 L 196 300" stroke={m.road} strokeWidth={roadW + 2} />
      <Path d="M196 160 L 20 196" stroke={m.road} strokeWidth={roadW} />
      <Path d="M196 185 L 340 270" stroke={m.road} strokeWidth={roadW - 1} />
      <Path d="M196 150 L 40 70" stroke={m.road} strokeWidth={roadW} />
      <Path
        d="M100 110 Q 196 70 300 115 Q 330 190 290 260 Q 196 300 110 255 Q 70 180 100 110 Z"
        stroke={m.road}
        strokeWidth={2.5}
        fill="none"
        opacity={0.7}
      />
      <Circle cx={196} cy={150} r={13} fill={m.ground} stroke={m.road} strokeWidth={2.5} />
      <SvgText x={196} y={131} fontSize={9} fill={m.label} textAnchor="middle" fontWeight="bold">
        Skënderbej
      </SvgText>
      <SvgText x={212} y={300} fontSize={9} fill={m.label} textAnchor="middle" fontWeight="bold">
        Parku i Madh
      </SvgText>
      <SvgText x={322} y={300} fontSize={9} fill={m.label} textAnchor="middle" fontWeight="bold">
        Dajti →
      </SvgText>
    </>
  );
}

const WATER: Record<NonNullable<City['water']>['side'], string> = {
  west: 'M0 0 L 52 0 Q 70 80 58 160 Q 46 240 64 320 Q 72 380 58 420 L 0 420 Z',
  south: 'M0 362 Q 90 344 180 362 Q 270 380 360 356 L 360 420 L 0 420 Z',
  southwest: 'M0 0 L 46 0 Q 62 120 52 220 Q 80 320 200 360 Q 290 380 360 386 L 360 420 L 0 420 Z',
};

/** A believable small-city layout: water from the city's data, a main crossroads, a ring. */
function Generic({ city, theme, roadW }: { city: City; theme: Theme; roadW: number }) {
  const m = theme.map;
  return (
    <>
      <Path d="M230 70 Q 300 60 320 120 Q 300 170 240 160 Q 210 120 230 70 Z" fill={m.park} opacity={0.8} />
      <Path d="M150 30 L 205 400" stroke={m.road} strokeWidth={roadW + 2} />
      <Path d="M40 210 L 350 175" stroke={m.road} strokeWidth={roadW} />
      <Path
        d="M120 120 Q 200 95 270 140 Q 295 210 255 270 Q 185 300 125 260 Q 95 190 120 120 Z"
        stroke={m.road}
        strokeWidth={2.5}
        fill="none"
        opacity={0.7}
      />
      <Circle cx={183} cy={196} r={11} fill={m.ground} stroke={m.road} strokeWidth={2.5} />
      {city.water && <Path d={WATER[city.water.side]} fill={m.water} />}
    </>
  );
}
