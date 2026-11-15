import React from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// per-icon paths: the package root would bundle all ~1,600 icons (Metro does not tree-shake)
import Building2 from 'lucide-react-native/icons/building-2';
import MapIcon from 'lucide-react-native/icons/map';
import Ticket from 'lucide-react-native/icons/ticket';
import User from 'lucide-react-native/icons/user';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

type IconComponent = typeof Building2;

/** One stroke family for the whole bar; the active tab gets a heavier stroke, like native tab bars. */
function tabIcon(Icon: IconComponent) {
  function TabBarIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    // our tint colors are plain strings; ColorValue also admits platform color objects
    return <Icon color={typeof color === 'string' ? color : undefined} size={24} strokeWidth={focused ? 2.4 : 1.8} />;
  }
  return TabBarIcon;
}

/**
 * React Navigation's default bar is 49pt + inset: 5 + 28 (icon slot) + 5 leaves ~10pt
 * for the label, which clips 11pt text on phones with no home indicator (iPhone SE).
 * A custom height replaces the default and is NOT inset-adjusted, so add the inset back;
 * the bar itself pads the bottom by the inset. Insets are known on the first frame,
 * so this does not shift.
 */
const BAR_CONTENT = 56; // item pads 5 + icon slot 28 + label 2 + 14 + 5, with ~2pt to spare

export default function TabsLayout() {
  const { t } = useI18n();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.c.surface,
          borderTopColor: theme.c.border,
          borderTopWidth: theme.outline,
          height: BAR_CONTENT + insets.bottom + theme.outline,
        },
        tabBarActiveTintColor: theme.c.text,
        tabBarInactiveTintColor: theme.c.textDim,
        // fixed lineHeight: the label box never depends on font metrics, and large text cannot grow the bar
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11, lineHeight: 14, marginTop: 2 },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.feed_title, tabBarIcon: tabIcon(Building2) }} />
      <Tabs.Screen name="map" options={{ title: t.map, tabBarIcon: tabIcon(MapIcon) }} />
      <Tabs.Screen
        name="my-events"
        options={{ title: t.my_events, tabBarLabel: t.tab_mine, tabBarIcon: tabIcon(Ticket) }}
      />
      <Tabs.Screen name="profile" options={{ title: t.profile, tabBarIcon: tabIcon(User) }} />
    </Tabs>
  );
}
