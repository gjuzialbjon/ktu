import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
// Per-weight subpaths: importing the package root bundles every weight (~30 files).
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import { Caveat_700Bold } from '@expo-google-fonts/caveat/700Bold';
import { I18nProvider } from '@/lib/i18n';
import { StoreProvider } from '@/data/store';
import { DEFAULT_THEME, THEMES, ThemeProvider, useTheme } from '@/lib/theme';

// Any render error below this layout shows the crash screen with a retry, instead of a blank app.
export { CrashScreen as ErrorBoundary } from '@/components/CrashScreen';

function ThemedStack() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.c.bg },
          headerTintColor: t.c.text,
          headerTitleStyle: { fontFamily: t.font, fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ title: '' }} />
        <Stack.Screen name="create" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ title: '' }} />
        <Stack.Screen name="+not-found" options={{ title: '' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_800ExtraBold,
    Caveat_700Bold,
  });

  // Hold the first paint until the heading faces are ready (or failed: then the
  // system font is used rather than blocking the app).
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: THEMES[DEFAULT_THEME].c.bg }} />;
  }

  return (
    <I18nProvider>
      <ThemeProvider>
        <StoreProvider>
          <ThemedStack />
        </StoreProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
