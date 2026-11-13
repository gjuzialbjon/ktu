import React from 'react';
import { ColorValue, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { colors } from '../../lib/theme';

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t.feed_title, tabBarIcon: ({ color }) => <TabIcon glyph="⌂" color={color} /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: t.map, tabBarIcon: ({ color }) => <TabIcon glyph="⌖" color={color} /> }}
      />
      <Tabs.Screen
        name="my-events"
        options={{ title: t.my_events, tabBarIcon: ({ color }) => <TabIcon glyph="✓" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t.profile, tabBarIcon: ({ color }) => <TabIcon glyph="◉" color={color} /> }}
      />
    </Tabs>
  );
}
