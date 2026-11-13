import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';
import { EventCard } from '../../components/EventCard';

export default function MyEvents() {
  const { t } = useI18n();
  const { events, rsvps } = useStore();
  const now = new Date().toISOString();

  const mine = events.filter((e) => rsvps[e.id]);
  const upcoming = mine.filter((e) => e.startsAt >= now);
  const past = mine.filter((e) => e.startsAt < now);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={upcoming}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EventCard event={item} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<Text style={styles.h1}>{t.my_events}</Text>}
        ListEmptyComponent={<Text style={styles.empty}>{t.no_events}</Text>}
        ListFooterComponent={
          past.length > 0 ? (
            <View>
              <Text style={styles.section}>{t.past}</Text>
              {past.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' },
  h1: { color: colors.text, fontSize: 26, fontWeight: '900', marginBottom: 16 },
  section: { color: colors.text, fontSize: 18, fontWeight: '800', marginVertical: 12 },
  empty: { color: colors.textDim, fontSize: 15, marginTop: 20 },
});
