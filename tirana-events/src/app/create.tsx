import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Stack, useRouter } from 'expo-router';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { makeStyles } from '@/lib/theme';
import { CAN_PICK_CITY, CITIES, LIVE_CITIES, CityId, areaName, cityName, ALL_LANGS, ENTRY_CHOICES, REPEATS, canHostWomenOnly, type Audience } from '@ktu/shared';
import Repeat from 'lucide-react-native/icons/repeat';
import { Button, Chip } from '@/components/ui';
import { DateTimeField } from '@/components/DateTimeField';
import { Field, FieldError, FieldLabel } from '@/features/create/Field';
import { PhotoField } from '@/features/create/PhotoField';
import { ProgramField } from '@/features/create/ProgramField';
import { DraftErrors, DraftField, DraftForm, TITLE_MAX, validateDraft } from '@/features/create/validateDraft';

type FormState = Omit<DraftForm, 'city'>;

const AUDIENCES: readonly Audience[] = ['all', 'women'];

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  venue: '',
  hood: null,
  when: null,
  tags: '',
  price: '',
  photo: null,
  langs: ['sq'],
  repeat: null,
  entry: 'open',
  audience: 'all',
  program: [],
};

/** Which error a form field clears when the user edits it. */
const ERROR_FOR: Partial<Record<keyof FormState, DraftField>> = {
  title: 'title',
  venue: 'venue',
  hood: 'hood',
  when: 'date',
  tags: 'tags',
  price: 'price',
  program: 'program',
};

function notify(msg: string) {
  if (Platform.OS === 'web') alert(msg);
  else Alert.alert(msg);
}

export default function CreateEvent() {
  const { t, lang } = useI18n();
  const s = useStyles();
  const { submitDraft, profile } = useStore();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  // Only an explicit pick is stored; otherwise follow the profile's city live. (Copying it
  // into state at mount would freeze the pre-hydration default on a direct web load.)
  const [pickedCity, setPickedCity] = useState<CityId | null>(null);
  const city = pickedCity ?? profile.city;
  const [errors, setErrors] = useState<DraftErrors>({});

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    const errKey = ERROR_FOR[key];
    if (errKey) setErrors((e) => (e[errKey] ? { ...e, [errKey]: undefined } : e));
  };
  const pickCity = (next: CityId) => {
    if (next === city) return;
    setPickedCity(next);
    setForm((f) => ({ ...f, hood: null })); // areas belong to the previous city
  };
  const err = (f: DraftField) => (errors[f] ? t[errors[f]] : undefined);

  const onSubmit = () => {
    const result = validateDraft({ ...form, city }, new Date());
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

        <Field label={t.ev_title} value={form.title} onChange={(v) => update('title', v)} required error={err('title')} maxLength={TITLE_MAX} />
        <Field label={t.ev_desc} value={form.description} onChange={(v) => update('description', v)} multiline />
        <Field label={t.ev_venue} value={form.venue} onChange={(v) => update('venue', v)} required error={err('venue')} />

        {CAN_PICK_CITY && (
          <>
            <FieldLabel label={t.ev_city} required />
            <View style={s.hoodRow}>
              {LIVE_CITIES.map((c) => (
                <View key={c} style={{ marginBottom: 8 }}>
                  <Chip label={cityName(c, lang)} active={city === c} onPress={() => pickCity(c)} />
                </View>
              ))}
            </View>
          </>
        )}

        <FieldLabel label={t.ev_hood} required />
        <View style={s.hoodRow}>
          {CITIES[city].areas.map(({ id }) => (
            <View key={id} style={{ marginBottom: 8 }}>
              <Chip label={areaName(city, id, lang)} active={form.hood === id} onPress={() => update('hood', id)} />
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
        <ProgramField rows={form.program} onChange={(v) => update('program', v)} error={err('program')} />
        <Field
          label={t.ev_tags}
          value={form.tags}
          onChange={(v) => update('tags', v)}
          required
          error={err('tags')}
          placeholder="yoga, outdoor"
        />
        <FieldLabel label={t.ev_langs} />
        <Text style={s.fieldHint}>{t.ev_langs_hint}</Text>
        <View style={s.hoodRow}>
          {ALL_LANGS.map((l) => {
            const on = form.langs.includes(l);
            return (
              <View key={l} style={{ marginBottom: 8 }}>
                <Chip
                  label={t.lang_name[l]}
                  active={on}
                  // keep at least one: an event has to be in some language
                  onPress={() =>
                    update('langs', on ? (form.langs.length > 1 ? form.langs.filter((x) => x !== l) : form.langs) : [...form.langs, l])
                  }
                />
              </View>
            );
          })}
        </View>

        <FieldLabel label={t.ev_repeat} />
        <Text style={s.fieldHint}>{t.ev_repeat_hint}</Text>
        <View style={s.hoodRow}>
          <View style={{ marginBottom: 8 }}>
            <Chip label={t.repeat_once} active={form.repeat == null} onPress={() => update('repeat', null)} />
          </View>
          {REPEATS.map((r) => (
            <View key={r} style={{ marginBottom: 8 }}>
              <Chip icon={Repeat} label={t.repeat_name[r]} active={form.repeat === r} onPress={() => update('repeat', r)} />
            </View>
          ))}
        </View>

        <FieldLabel label={t.ev_entry} />
        {/* the hint names what the current choice does, so the host knows before publishing */}
        <Text style={s.fieldHint}>{t.ev_entry_hint[form.entry]}</Text>
        <View style={s.hoodRow} accessibilityRole="radiogroup">
          {ENTRY_CHOICES.map((c) => (
            <View key={c} style={{ marginBottom: 8 }}>
              <Chip label={t.ev_entry_name[c]} active={form.entry === c} onPress={() => update('entry', c)} />
            </View>
          ))}
        </View>

        {canHostWomenOnly(profile.gender) ? (
          <>
            <FieldLabel label={t.ev_audience} />
            <Text style={s.fieldHint}>{t.ev_audience_hint[form.audience]}</Text>
            <View style={s.hoodRow} accessibilityRole="radiogroup">
              {AUDIENCES.map((a) => (
                <View key={a} style={{ marginBottom: 8 }}>
                  <Chip label={t.ev_audience_name[a]} active={form.audience === a} onPress={() => update('audience', a)} />
                </View>
              ))}
            </View>
          </>
        ) : profile.gender == null || profile.gender === 'unsaid' ? (
          // only a woman can open a women-only space; someone who has not said learns where to
          <>
            <FieldLabel label={t.ev_audience} />
            <Text style={[s.fieldHint, { marginBottom: 16 }]}>{t.ev_audience_need_profile}</Text>
          </>
        ) : null}

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
    fieldHint: { color: t.c.textDim, fontSize: 13, marginTop: -4, marginBottom: 8 },
    hoodRow: { flexDirection: 'row', flexWrap: 'wrap' },
  }),
);
