import React, { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { colors, radius } from '../lib/theme';
import { Button } from '../components/ui';
import { DateTimeField } from '../components/DateTimeField';

type FieldName = 'title' | 'venue' | 'date' | 'tags' | 'price';
type Errors = Partial<Record<FieldName, string>>;

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);
}

export default function CreateEvent() {
  const { t } = useI18n();
  const { submitDraft } = useStore();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [venue, setVenue] = useState('');
  const [when, setWhen] = useState<Date | null>(null);
  const [tags, setTags] = useState('');
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const clearError = (f: FieldName) =>
    setErrors((e) => (e[f] ? { ...e, [f]: undefined } : e));

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

  const validate = (): { startsAt: string; tagList: string[]; priceNum?: number } | null => {
    const next: Errors = {};

    if (!title.trim()) next.title = t.err_required;
    else if (title.trim().length < 5) next.title = t.err_title_short;

    if (!venue.trim()) next.venue = t.err_required;

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
    if (Object.values(next).some(Boolean) || !startsAt) return null;
    return { startsAt, tagList, priceNum };
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.hint}>{t.create_hint}</Text>

        <Text style={styles.label}>{t.ev_photo}</Text>
        <Pressable style={styles.photoBox} onPress={pickPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <Text style={styles.photoHint}>📷 {t.ev_photo_hint}</Text>
          )}
        </Pressable>
        {photo && (
          <Pressable onPress={() => setPhoto(null)}>
            <Text style={styles.photoRemove}>{t.ev_photo_remove}</Text>
          </Pressable>
        )}

        <Field label={t.ev_title} value={title} onChange={(v) => { setTitle(v); clearError('title'); }} required error={errors.title} />
        <Field label={t.ev_desc} value={desc} onChange={setDesc} multiline />
        <Field label={t.ev_venue} value={venue} onChange={(v) => { setVenue(v); clearError('venue'); }} required error={errors.venue} />
        <DateTimeField
          dateLabel={t.ev_date}
          timeLabel={t.ev_time}
          value={when}
          onChange={(d) => { setWhen(d); clearError('date'); }}
          errorDate={errors.date}
          requiredMark
        />
        <Field label={t.ev_tags} value={tags} onChange={(v) => { setTags(v); clearError('tags'); }} required error={errors.tags} placeholder="yoga, outdoor" />
        <Field label={t.ev_price} value={price} onChange={(v) => { setPrice(v); clearError('price'); }} keyboard="numeric" error={errors.price} placeholder="700" />

        <View style={{ height: 10 }} />
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
  return (
    <>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.req}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && { minHeight: 90, textAlignVertical: 'top' },
          !!error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboard}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
      />
      {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
  hint: { color: colors.textDim, fontSize: 14, marginBottom: 8 },
  label: { color: colors.textDim, fontSize: 13, fontWeight: '700', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  req: { color: colors.accent, fontSize: 13, fontWeight: '900' },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  inputError: { borderColor: colors.accent, borderWidth: 1.5 },
  errorText: { color: colors.accent, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  photoBox: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoHint: { color: colors.textDim, fontSize: 15 },
  photoRemove: { color: colors.accent, fontSize: 13, fontWeight: '700', marginTop: 6 },
});
