import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

/** Emoji ignore tint colors, so the active tab also gets size and full opacity. */
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ fontSize: focused ? 23 : 20, opacity: focused ? 1 : 0.55 }}
    >
      {emoji}
    </Text>
  );
}

export default function TabsLayout() {
  const { t } = useI18n();
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.c.surface,
          borderTopColor: theme.c.border,
          borderTopWidth: theme.outline,
          height: 64,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.c.text,
        tabBarInactiveTintColor: theme.c.textDim,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t.feed_title, tabBarIcon: ({ focused }) => <TabIcon emoji="🏙️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: t.map, tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="my-events"
        options={{ title: t.my_events, tabBarIcon: ({ focused }) => <TabIcon emoji="🎟️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t.profile, tabBarIcon: ({ focused }) => <TabIcon emoji="😎" focused={focused} /> }}
      />
    </Tabs>
  );
}
