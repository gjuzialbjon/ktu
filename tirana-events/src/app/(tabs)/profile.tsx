import EyeOff from 'lucide-react-native/icons/eye-off';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { THEMES, THEME_ORDER, ThemeId, makeStyles, radius, useTheme } from '@/lib/theme';
import { Avatar, Chip, Display } from '@/components/ui';
import { DevTools } from '@/features/dev/DevTools';
import { CAN_PICK_CITY, GENDERS, GOING_VISIBILITIES, LIVE_CITIES, cityName } from '@ktu/shared';
import { HideTopicsSheet } from '@/features/profile/HideTopicsSheet';

export default function Profile() {
  const { t, lang, setLang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { events, people, profile, toggleFollow, setName, setShowGoing, setGender, setCity, toggleInterest, toggleHidden } = useStore();
  const [hideOpen, setHideOpen] = useState(false);
  // every tag in use, most common first, plus anything the user picked that is no longer in use
  const tagChoices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) for (const tag of e.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    const common = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag).slice(0, 24);
    return [...new Set([...profile.interests, ...common])];
  }, [events, profile.interests]);
  // the hide sheet offers every topic in use (plus whatever is already hidden), likes excluded
  const hideChoices = useMemo(() => {
    const all = new Set<string>(profile.hidden);
    for (const e of events) for (const tag of e.tags) all.add(tag);
    return [...all].filter((tag) => !profile.interests.includes(tag)).sort();
  }, [events, profile.hidden, profile.interests]);

  const themeName = (id: ThemeId) => t[`theme_${id}` as const];
  const themeDesc = (id: ThemeId) => t[`theme_desc_${id}` as const];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <Display size={30}>{profile.name.trim() || t.profile}</Display>

        <Text style={s.label}>{t.your_name}</Text>
        <TextInput
          style={s.input}
          value={profile.name}
          onChangeText={setName}
          accessibilityLabel={t.your_name}
          placeholder={t.your_name_ph}
          placeholderTextColor={theme.c.textDim}
        />

        {/* only when more than one city is live (data/cities.ts LIVE_CITIES) */}
        {CAN_PICK_CITY && (
          <>
            <Text style={s.label}>{t.city}</Text>
            <Text style={s.hint}>{t.city_hint}</Text>
            <View style={s.wrapRow} accessibilityRole="radiogroup">
              {LIVE_CITIES.map((c) => (
                <View key={c} style={{ marginBottom: 8 }}>
                  <Chip label={cityName(c, lang)} active={profile.city === c} onPress={() => setCity(c, 'profile')} />
                </View>
              ))}
            </View>
          </>
        )}

        <View style={s.labelRow}>
          <Text style={[s.label, { marginTop: 0, marginBottom: 0 }]}>{t.interests}</Text>
        </View>
        <Text style={s.hint}>{t.interests_hint}</Text>
        <View style={s.wrapRow}>
          {tagChoices.map((tag) => (
            <View key={tag} style={{ marginBottom: 8 }}>
              <Chip label={t.tag(tag)} active={profile.interests.includes(tag)} onPress={() => toggleInterest(tag)} />
            </View>
          ))}
        </View>

        <Text style={s.label}>{t.hidden_title}</Text>
        <Text style={s.hint}>{t.hidden_hint}</Text>
        <View style={s.wrapRow}>
          {profile.hidden.length === 0 && <Text style={[s.hint, { marginRight: 12 }]}>{t.hidden_none}</Text>}
          {profile.hidden.map((tag) => (
            <View key={tag} style={{ marginBottom: 8 }}>
              <Chip
                icon={EyeOff}
                label={`${t.tag(tag)}  ✕`}
                active
                accessibilityLabel={t.a11y_unhide(t.tag(tag))}
                onPress={() => toggleHidden(tag)}
              />
            </View>
          ))}
          <View style={{ marginBottom: 8 }}>
            <Chip label={`+ ${t.hidden_add}`} onPress={() => setHideOpen(true)} />
          </View>
        </View>
        <HideTopicsSheet visible={hideOpen} onClose={() => setHideOpen(false)} tags={hideChoices} />

        {/* everyone starts at "nobody"; counts are always shown, names and faces only by choice */}
        <Text style={s.label}>{t.going_vis_title}</Text>
        <Text style={s.hint}>{t.going_vis_hint}</Text>
        <View style={s.wrapRow} accessibilityRole="radiogroup">
          {GOING_VISIBILITIES.map((v) => (
            <View key={v} style={{ marginBottom: 8 }}>
              <Chip label={t.going_vis[v]} active={profile.showGoing === v} onPress={() => setShowGoing(v)} />
            </View>
          ))}
        </View>

        {/* private: decides only whether women-only events reach this person; never shown or tracked */}
        <Text style={s.label}>{t.gender_title}</Text>
        <Text style={s.hint}>{t.gender_hint}</Text>
        <View style={s.wrapRow} accessibilityRole="radiogroup">
          {GENDERS.map((g) => (
            <View key={g} style={{ marginBottom: 8 }}>
              <Chip label={t.gender_name[g]} active={profile.gender === g} onPress={() => setGender(g)} />
            </View>
          ))}
        </View>

        <Text style={s.label}>{t.theme}</Text>
        <View style={s.themes} accessibilityRole="radiogroup">
          {THEME_ORDER.map((id) => {
            const th = THEMES[id];
            const active = theme.id === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${themeName(id)}: ${themeDesc(id)}`}
                onPress={() => theme.setThemeId(id)}
                style={[
                  s.themeCard,
                  { backgroundColor: th.c.bg, borderColor: active ? theme.c.text : th.c.border, borderWidth: active ? 3 : th.outline },
                ]}
              >
                {/* each card previews its own palette and heading face */}
                <View style={s.swatches}>
                  {th.band.blocks.slice(0, 4).map((col, i) => (
                    <View
                      key={i}
                      style={[
                        s.swatch,
                        { backgroundColor: col, height: 16 + ((i * 7) % 16), borderColor: 'transparent' },
                      ]}
                    />
                  ))}
                  <View style={[s.swatch, { backgroundColor: th.c.social, height: 22 }]} />
                </View>
                <Text style={{ fontFamily: th.font, fontSize: 18, color: th.c.text }}>{themeName(id)}</Text>
                <Text style={{ fontSize: 12, color: th.c.textDim }}>{themeDesc(id)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.label}>{t.language}</Text>
        <View style={s.row}>
          <Chip label="Shqip" active={lang === 'sq'} onPress={() => setLang('sq')} />
          <Chip label="English" active={lang === 'en'} onPress={() => setLang('en')} />
        </View>

        <Text style={s.label}>{t.people_you_know}</Text>
        <View style={{ gap: 10 }}>
          {people.map((p) => {
            const followed = profile.follows.includes(p.id);
            return (
              <View key={p.id} style={s.personRow}>
                <View style={s.personLeft}>
                  <Avatar user={p} highlight={followed} size={40} />
                  <Text style={s.personName}>{p.name}</Text>
                </View>
                <Chip label={followed ? t.following : t.follow} active={followed} onPress={() => toggleFollow(p.id)} />
              </View>
            );
          })}
        </View>

        {/* development builds only: never reaches the store */}
        {__DEV__ && <DevTools />}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.c.bg },
    content: { padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
    label: { color: t.c.textDim, fontSize: 14, fontWeight: '700', marginTop: 24, marginBottom: 10 },
    input: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      color: t.c.text,
      padding: 12,
      fontSize: 16,
      minHeight: 48,
    },
    themes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    themeCard: { flexBasis: '45%', flexGrow: 1, borderRadius: radius.md, padding: 12, gap: 4, minHeight: 120 },
    swatches: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 32, marginBottom: 6 },
    swatch: { width: 12, borderWidth: 1 },
    row: { flexDirection: 'row' },
    wrapRow: { flexDirection: 'row', flexWrap: 'wrap' },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 10 },
    hint: { color: t.c.textDim, fontSize: 14, marginTop: -4, marginBottom: 10 },
    personRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    personLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    personName: { color: t.c.text, fontSize: 16, fontWeight: '600' },
  }),
);
