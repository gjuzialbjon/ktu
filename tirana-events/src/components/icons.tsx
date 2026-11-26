import React from 'react';
import { View } from 'react-native';
import type { Category } from '@ktu/shared';
import type { LucideIcon } from 'lucide-react-native';
import UsersRound from 'lucide-react-native/icons/users-round';
import Guitar from 'lucide-react-native/icons/guitar';
import Disc3 from 'lucide-react-native/icons/disc-3';
import Drama from 'lucide-react-native/icons/drama';
import Volleyball from 'lucide-react-native/icons/volleyball';
import BriefcaseBusiness from 'lucide-react-native/icons/briefcase-business';
import UtensilsCrossed from 'lucide-react-native/icons/utensils-crossed';
import Leaf from 'lucide-react-native/icons/leaf';
import Sun from 'lucide-react-native/icons/sun';
import Moon from 'lucide-react-native/icons/moon';
import CloudSun from 'lucide-react-native/icons/cloud-sun';
import CloudMoon from 'lucide-react-native/icons/cloud-moon';
import Cloud from 'lucide-react-native/icons/cloud';
import CloudFog from 'lucide-react-native/icons/cloud-fog';
import CloudDrizzle from 'lucide-react-native/icons/cloud-drizzle';
import CloudRain from 'lucide-react-native/icons/cloud-rain';
import Snowflake from 'lucide-react-native/icons/snowflake';
import CloudLightning from 'lucide-react-native/icons/cloud-lightning';
import Luggage from 'lucide-react-native/icons/luggage';
import Hand from 'lucide-react-native/icons/hand';
import Coins from 'lucide-react-native/icons/coins';
import MoonStar from 'lucide-react-native/icons/moon-star';
import type { WeatherKind } from '@/features/weather/weather';

/**
 * One icon language for the whole app: lucide line icons at one stroke, coloured like the
 * text beside them. Emoji are not used as icons anywhere (they draw differently on every
 * phone and read as decoration); categories keep their colour through a dot or a ring.
 */
export const ICON_STROKE = 2;

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  community: UsersRound,
  music: Guitar,
  nightlife: Disc3,
  culture: Drama,
  sports: Volleyball,
  business: BriefcaseBusiness,
  food: UtensilsCrossed,
  outdoors: Leaf,
};

const WEATHER_ICON: Record<WeatherKind, LucideIcon> = {
  clear: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
};

export function weatherIcon(kind: WeatherKind, isDay: boolean): LucideIcon {
  if (!isDay && kind === 'clear') return Moon;
  if (!isDay && kind === 'partly') return CloudMoon;
  return WEATHER_ICON[kind];
}

export type CollectionIconName = 'luggage' | 'hand' | 'leaf' | 'coins' | 'moon';

export const COLLECTION_ICON: Record<CollectionIconName, LucideIcon> = {
  luggage: Luggage,
  hand: Hand,
  leaf: Leaf,
  coins: Coins,
  moon: MoonStar,
};

/** The weather's line icon, or an empty box of the same size while it loads (nothing moves). */
export function WeatherIcon({
  kind,
  isDay = true,
  size,
  color,
}: {
  kind?: WeatherKind;
  isDay?: boolean;
  size: number;
  color: string;
}) {
  if (!kind) return <View style={{ width: size, height: size }} />;
  return <Icon as={weatherIcon(kind, isDay)} size={size} color={color} />;
}

/** A line icon at the app's stroke. Decorative: the text beside it carries the meaning. */
export function Icon({ as: As, size = 18, color }: { as: LucideIcon; size?: number; color: string }) {
  // hidden from screen readers on the wrapper: the SVG itself does not take these props on web
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <As size={size} color={color} strokeWidth={ICON_STROKE} />
    </View>
  );
}
