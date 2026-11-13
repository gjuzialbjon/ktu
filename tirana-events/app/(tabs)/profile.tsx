import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { colors, radius } from '../../lib/theme';
import { Avatar, Chip } from '../../components/ui';

export default function Profile() {
  const { t, lang, setLang } = useI18n();
  const { people, profile, toggleFollow, setName } = useStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>{t.profile}</Text>

        <Text style={styles.label}>{t.your_name}</Text>
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={setName}
          placeholder="…"
          placeholderTextColor={colors.textDim}
        />

        <Text style={styles.label}>{t.language}</Text>
        <View style={styles.row}>
          <Chip label="Shqip" active={lang === 'sq'} onPress={() => setLang('sq')} />
          <Chip label="English" active={lang === 'en'} onPress={() => setLang('en')} />
        </View>

        <Text style={styles.label}>{t.people_you_know}</Text>
        <View style={{ gap: 10 }}>
          {people.map((p) => {
            const followed = profile.follows.includes(p.id);
            return (
              <View key={p.id} style={styles.personRow}>
                <View style={styles.personLeft}>
                  <Avatar user={p} highlight={followed} />
                  <Text style={styles.personName}>{p.name}</Text>
                </View>
                <Chip label={followed ? t.following : t.follow} active={followed} onPress={() => toggleFollow(p.id)} />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
  h1: { color: colors.text, fontSize: 26, fontWeight: '900', marginBottom: 16 },
  label: { color: colors.textDim, fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    padding: 12,
    fontSize: 16,
  },
  row: { flexDirection: 'row' },
  personRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  personLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  personName: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
