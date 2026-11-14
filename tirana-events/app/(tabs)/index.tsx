import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { Category } from '../../lib/types';
import { colors } from '../../lib/theme';
import { Chip } from '../../components/ui';
import { EventCard } from '../../components/EventCard';

const CATEGORIES: Category[] = [
  'community',
  'music',
  'nightlife',
  'culture',
  'sports',
  'business',
  'food',
  'outdoors',
];

export default function Feed() {
  const { t } = useI18n();
  const { events } = useStore();
  const router = useRouter();
  const params = useLocalSearchParams<{ tag?: string }>();
  const tag = typeof params.tag === 'string' && params.tag.length > 0 ? params.tag : null;
  const [cat, setCat] = useState<Category | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const { width } = useWindowDimensions();
  // Responsive grid: 1 column on phones, 2 on tablets, 3 on wide screens.
  const cols = width >= 1280 ? 3 : width >= 768 ? 2 : 1;
  // Fixed card width so a lone card (one result, or a short last row) keeps its
  // column size instead of stretching across the whole page.
  const GAP = 16;
  const contentWidth = Math.min(width, cols > 1 ? 1280 : 640) - 32;
  const itemWidth = (contentWidth - GAP * (cols - 1)) / cols;

  const clearTag = () => router.setParams({ tag: '' });

  const list = useMemo(
    () =>
      events.filter(
        (e) =>
          (!cat || e.category === cat) &&
          (!freeOnly || e.priceType === 'free') &&
          (!tag || e.tags.includes(tag)),
      ),
    [events, cat, freeOnly, tag],
  );

  const catLabel = (c: Category) => t[`cat_${c}` as const];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        key={cols} // numColumns can't change on the fly; remount on breakpoint change
        data={list}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? styles.columnGap : undefined}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <View style={cols > 1 ? { width: itemWidth } : undefined}>
            <EventCard event={item} />
          </View>
        )}
        contentContainerStyle={[styles.listContent, cols > 1 && styles.listContentWide]}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.h1}>{t.feed_title}</Text>
                <Text style={styles.sub}>{t.feed_subtitle(events.length)}</Text>
              </View>
              <Pressable style={styles.addBtn} onPress={() => router.push('/create')}>
                <Text style={styles.addBtnText}>＋</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              <Chip label={t.all} active={!cat && !freeOnly && !tag} onPress={() => { setCat(null); setFreeOnly(false); if (tag) clearTag(); }} />
              <Chip label={t.free} active={freeOnly} onPress={() => setFreeOnly((v) => !v)} />
              {CATEGORIES.map((c) => (
                <Chip key={c} label={catLabel(c)} active={cat === c} onPress={() => setCat(cat === c ? null : c)} />
              ))}
            </ScrollView>
            {tag && (
              <Pressable style={styles.tagFilter} onPress={clearTag}>
                <Text style={styles.tagFilterText}>#{tag}</Text>
                <Text style={styles.tagFilterX}>✕</Text>
              </Pressable>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: 16, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' },
  listContentWide: { maxWidth: 1280 },
  columnGap: { gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  h1: { color: colors.text, fontSize: 26, fontWeight: '900' },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 2 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#10131A', fontSize: 22, fontWeight: '800', marginTop: -2 },
  chips: { marginBottom: 16, flexGrow: 0 },
  tagFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 16,
    marginTop: -4,
  },
  tagFilterText: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  tagFilterX: { color: colors.accent, fontSize: 13, fontWeight: '900' },
});
