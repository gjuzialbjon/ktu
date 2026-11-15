import React, { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { makeStyles, radius, useTheme } from '../lib/theme';
import { NEIGHBORHOODS, Neighborhood } from '../lib/types';
import { Button, Chip, Emoji } from '../components/ui';
import { DateTimeField } from '../components/DateTimeField';

type FieldName = 'title' | 'venue' | 'hood' | 'date' | 'tags' | 'price';
type Errors = Partial<Record<FieldName, string>>;

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);
}

export default function CreateEvent() {
  const { t } = useI18n();
  const s = useStyles();
  const { submitDraft } = useStore();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [venue, setVenue] = useState('');
  const [hood, setHood] = useState<Neighborhood | null>(null);
  const [when, setWhen] = useState<Date | null>(null);
  const [tags, setTags] = useState('');
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const clearError = (f: FieldName) => setErrors((e) => (e[f] ? { ...e, [f]: undefined } : e));

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.5,
      base64: true, // data-URL persists across restarts, unlike blob/file URIs on web
    });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    setPhoto(a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri);
  };

  const notify = (msg: string) => {
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert(msg);
    }
  };

  const validate = (): { startsAt: string; tagList: string[]; priceNum?: number; hood: Neighborhood } | null => {
    const next: Errors = {};

    if (!title.trim()) next.title = t.err_required;
    else if (title.trim().length < 5) next.title = t.err_title_short;

    if (!venue.trim()) next.venue = t.err_required;
    if (!hood) next.hood = t.err_required;

    let startsAt: string | null = null;
    if (!when) next.date = t.err_required;
    else if (when.getTime() < Date.now()) next.date = t.err_date_past;
    else startsAt = when.toISOString();

    const tagList = parseTags(tags);
    if (tagList.length < 1 || tagList.length > 6) next.tags = t.err_tags;

    let priceNum: number | undefined;
    if (price.trim()) {
      const n = Number(price.trim());
      if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) next.price = t.err_price;
      else priceNum = n;
    }

    setErrors(next);
    if (Object.values(next).some(Boolean) || !startsAt || !hood) return null;
    return { startsAt, tagList, priceNum, hood };
  };

  const onSubmit = () => {
    const ok = validate();
    if (!ok) {
      notify(t.fix_errors);
      return;
    }
    submitDraft({
      title: title.trim(),
      description: desc.trim(),
      venueName: venue.trim(),
      neighborhood: ok.hood,
      startsAt: ok.startsAt,
      tags: ok.tagList.slice(0, 6),
      ticketPriceLek: ok.priceNum,
      coverImage: photo ?? undefined,
    });
    notify(t.submitted);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t.create_event }} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={s.hint}>{t.create_hint}</Text>

        <Text style={s.label}>{t.ev_photo}</Text>
        <Pressable
          style={s.photoBox}
          onPress={pickPhoto}
          accessibilityRole="button"
          accessibilityLabel={photo ? t.ev_photo : t.ev_photo_hint}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={s.photo} />
          ) : (
            <View style={s.photoEmpty}>
              <Emoji size={22}>📷</Emoji>
              <Text style={s.photoHint}>{t.ev_photo_hint}</Text>
            </View>
          )}
        </Pressable>
        {photo && (
          <Pressable onPress={() => setPhoto(null)} accessibilityRole="button" hitSlop={10}>
            <Text style={s.photoRemove}>{t.ev_photo_remove}</Text>
          </Pressable>
        )}

        <Field
          label={t.ev_title}
          value={title}
          onChange={(v) => {
            setTitle(v);
            clearError('title');
          }}
          required
          error={errors.title}
        />
        <Field label={t.ev_desc} value={desc} onChange={setDesc} multiline />
        <Field
          label={t.ev_venue}
          value={venue}
          onChange={(v) => {
            setVenue(v);
            clearError('venue');
          }}
          required
          error={errors.venue}
        />

        <Text style={s.label}>
          {t.ev_hood}
          <Text style={s.req}> *</Text>
        </Text>
        <View style={s.hoodRow}>
          {NEIGHBORHOODS.map((h) => (
            <View key={h} style={{ marginBottom: 8 }}>
              <Chip
                label={t[`hood_${h}` as const]}
                active={hood === h}
                onPress={() => {
                  setHood(h);
                  clearError('hood');
                }}
              />
            </View>
          ))}
        </View>
        {errors.hood ? <Text style={s.errorText}>{errors.hood}</Text> : null}

        <DateTimeField
          dateLabel={t.ev_date}
          timeLabel={t.ev_time}
          value={when}
          onChange={(d) => {
            setWhen(d);
            clearError('date');
          }}
          errorDate={errors.date}
          requiredMark
        />
        <Field
          label={t.ev_tags}
          value={tags}
          onChange={(v) => {
            setTags(v);
            clearError('tags');
          }}
          required
          error={errors.tags}
          placeholder="yoga, outdoor"
        />
        <Field
          label={t.ev_price}
          value={price}
          onChange={(v) => {
            setPrice(v);
            clearError('price');
          }}
          keyboard="numeric"
          error={errors.price}
          placeholder="700"
        />

        <View style={{ height: 14 }} />
        <Button label={t.submit} onPress={onSubmit} />
      </ScrollView>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  keyboard,
  required,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboard?: 'numeric';
  required?: boolean;
  error?: string;
  placeholder?: string;
}) {
  const theme = useTheme();
  const s = useStyles();
  return (
    <>
      <Text style={s.label}>
        {label}
        {required && <Text style={s.req}> *</Text>}
      </Text>
      <TextInput
        style={[s.input, multiline && { minHeight: 96, textAlignVertical: 'top' }, !!error && s.inputError]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboard}
        placeholder={placeholder}
        placeholderTextColor={theme.c.textDim}
        accessibilityLabel={required ? `${label}, *` : label}
      />
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    scroll: { flex: 1, backgroundColor: t.c.bg },
    content: { padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
    hint: { color: t.c.textDim, fontSize: 15, marginBottom: 8 },
    label: { color: t.c.text, fontSize: 14, fontWeight: '700', marginTop: 16, marginBottom: 7 },
    req: { color: t.c.danger, fontSize: 14, fontWeight: '800' },
    input: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      color: t.c.text,
      padding: 12,
      fontSize: 16,
      minHeight: 48,
      marginBottom: 4,
    },
    // thicker error border eats into the padding, so the text never moves when an error appears
    inputError: { borderColor: t.c.danger, borderWidth: 2, padding: 12 - (2 - Math.min(t.outline, 2)) },
    errorText: { color: t.c.danger, fontSize: 14, fontWeight: '600', marginBottom: 4 },
    hoodRow: { flexDirection: 'row', flexWrap: 'wrap' },
    photoBox: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderStyle: 'dashed',
      borderRadius: radius.md,
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    photo: { width: '100%', height: '100%' },
    photoEmpty: { alignItems: 'center', gap: 6 },
    photoHint: { color: t.c.textDim, fontSize: 15 },
    photoRemove: { color: t.c.text, fontSize: 14, fontWeight: '700', marginTop: 8, textDecorationLine: 'underline' },
  }),
);
