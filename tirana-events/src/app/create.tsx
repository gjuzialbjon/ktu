import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { makeStyles } from '@/lib/theme';
import { NEIGHBORHOODS } from '@/data/types';
import { Button, Chip } from '@/components/ui';
import { DateTimeField } from '@/components/DateTimeField';
import { Field, FieldError, FieldLabel } from '@/features/create/Field';
import { PhotoField } from '@/features/create/PhotoField';
import { DraftErrors, DraftField, DraftForm, validateDraft } from '@/features/create/validateDraft';

const EMPTY_FORM: DraftForm = {
  title: '',
  description: '',
  venue: '',
  hood: null,
  when: null,
  tags: '',
  price: '',
  photo: null,
};

/** Which error a form field clears when the user edits it. */
const ERROR_FOR: Partial<Record<keyof DraftForm, DraftField>> = {
  title: 'title',
  venue: 'venue',
  hood: 'hood',
  when: 'date',
  tags: 'tags',
  price: 'price',
};

function notify(msg: string) {
  if (Platform.OS === 'web') alert(msg);
  else Alert.alert(msg);
}

export default function CreateEvent() {
  const { t } = useI18n();
  const s = useStyles();
  const { submitDraft } = useStore();
  const router = useRouter();
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<DraftErrors>({});

  const update = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    const errKey = ERROR_FOR[key];
    if (errKey) setErrors((e) => (e[errKey] ? { ...e, [errKey]: undefined } : e));
  };
  const err = (f: DraftField) => (errors[f] ? t[errors[f]] : undefined);

  const onSubmit = () => {
    const result = validateDraft(form, new Date());
    if (!result.ok) {
      setErrors(result.errors);
      notify(t.fix_errors);
      return;
    }
    submitDraft(result.value);
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

        <PhotoField photo={form.photo} onChange={(v) => update('photo', v)} />

        <Field label={t.ev_title} value={form.title} onChange={(v) => update('title', v)} required error={err('title')} />
        <Field label={t.ev_desc} value={form.description} onChange={(v) => update('description', v)} multiline />
        <Field label={t.ev_venue} value={form.venue} onChange={(v) => update('venue', v)} required error={err('venue')} />

        <FieldLabel label={t.ev_hood} required />
        <View style={s.hoodRow}>
          {NEIGHBORHOODS.map((h) => (
            <View key={h} style={{ marginBottom: 8 }}>
              <Chip label={t[`hood_${h}` as const]} active={form.hood === h} onPress={() => update('hood', h)} />
            </View>
          ))}
        </View>
        <FieldError error={err('hood')} />

        <DateTimeField
          dateLabel={t.ev_date}
          timeLabel={t.ev_time}
          value={form.when}
          onChange={(d) => update('when', d)}
          errorDate={err('date')}
          requiredMark
        />
        <Field
          label={t.ev_tags}
          value={form.tags}
          onChange={(v) => update('tags', v)}
          required
          error={err('tags')}
          placeholder="yoga, outdoor"
        />
        <Field
          label={t.ev_price}
          value={form.price}
          onChange={(v) => update('price', v)}
          keyboard="numeric"
          error={err('price')}
          placeholder="700"
        />

        <View style={{ height: 14 }} />
        <Button label={t.submit} onPress={onSubmit} />
      </ScrollView>
    </>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    scroll: { flex: 1, backgroundColor: t.c.bg },
    content: { padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
    hint: { color: t.c.textDim, fontSize: 15, marginBottom: 8 },
    hoodRow: { flexDirection: 'row', flexWrap: 'wrap' },
  }),
);
