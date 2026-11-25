import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Theme, makeStyles, radius, useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import { formatDate } from '@/lib/format';

/**
 * Cross-platform date + time picking.
 * - web: the browser's native <input type="date"> / <input type="time">
 * - iOS: inline compact DateTimePicker
 * - Android: tap a field -> system dialog
 */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInputValue(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// react-native-web lets us render real DOM elements for native browser pickers.
// Guarded require: the module only exists in web bundles.
let createDomElement: ((type: string, props: Record<string, unknown>) => React.ReactElement) | null = null;
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  createDomElement = require('react-native-web').unstable_createElement;
}

const domInputStyle = (t: Theme) => ({
  backgroundColor: t.c.surface,
  color: t.c.text,
  border: `1px solid ${t.c.border}`,
  borderRadius: 14,
  padding: 12,
  fontSize: 16,
  fontFamily: 'inherit',
  colorScheme: t.dark ? 'dark' : 'light', // browser calendar/time popups follow the theme
  width: '100%',
  boxSizing: 'border-box',
});

export function DateTimeField({
  dateLabel,
  timeLabel,
  value,
  onChange,
  errorDate,
  errorTime,
  requiredMark,
}: {
  dateLabel: string;
  timeLabel: string;
  /** null until the user picked both parts at least once */
  value: Date | null;
  onChange: (d: Date) => void;
  errorDate?: string;
  errorTime?: string;
  requiredMark?: boolean;
}) {
  const { lang } = useI18n();
  const t = useTheme();
  const styles = useStyles();
  const [androidShow, setAndroidShow] = useState<'date' | 'time' | null>(null);
  const current = value ?? defaultStart();

  function defaultStart(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    return d;
  }

  const setDatePart = (picked: Date) => {
    const next = new Date(current);
    next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    onChange(next);
  };

  const setTimePart = (picked: Date) => {
    const next = new Date(current);
    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    onChange(next);
  };

  const label = (text: string) => (
    <Text style={styles.label}>
      {text}
      {requiredMark && <Text style={styles.req}> *</Text>}
    </Text>
  );

  // ---------- web: real browser inputs ----------
  if (Platform.OS === 'web' && createDomElement) {
    return (
      <View style={styles.rowWrap}>
        <View style={styles.col}>
          {label(dateLabel)}
          {createDomElement('input', {
            type: 'date',
            value: value ? toDateInputValue(value) : '',
            min: toDateInputValue(new Date()),
            onChange: (e: { target: { value: string } }) => {
              const [y, m, d] = e.target.value.split('-').map(Number);
              if (!y) return;
              const picked = new Date(current);
              picked.setFullYear(y, m - 1, d);
              setDatePart(picked);
            },
            style: { ...domInputStyle(t), borderColor: errorDate ? t.c.danger : t.c.border },
          })}
          {errorDate ? <Text style={styles.errorText}>⚠ {errorDate}</Text> : null}
        </View>
        <View style={styles.col}>
          {label(timeLabel)}
          {createDomElement('input', {
            type: 'time',
            value: value ? toTimeInputValue(value) : '',
            onChange: (e: { target: { value: string } }) => {
              const [h, min] = e.target.value.split(':').map(Number);
              if (Number.isNaN(h)) return;
              const picked = new Date(current);
              picked.setHours(h, min, 0, 0);
              setTimePart(picked);
            },
            style: { ...domInputStyle(t), borderColor: errorTime ? t.c.danger : t.c.border },
          })}
          {errorTime ? <Text style={styles.errorText}>⚠ {errorTime}</Text> : null}
        </View>
      </View>
    );
  }

  // ---------- iOS: inline compact pickers ----------
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.rowWrap}>
        <View style={styles.col}>
          {label(dateLabel)}
          <View style={[styles.iosBox, !!errorDate && styles.boxError]}>
            <DateTimePicker
              value={current}
              mode="date"
              display="compact"
              minimumDate={new Date()}
              themeVariant={t.dark ? 'dark' : 'light'}
              onChange={(_e, d) => d && setDatePart(d)}
            />
          </View>
          {errorDate ? <Text style={styles.errorText}>⚠ {errorDate}</Text> : null}
        </View>
        <View style={styles.col}>
          {label(timeLabel)}
          <View style={[styles.iosBox, !!errorTime && styles.boxError]}>
            <DateTimePicker
              value={current}
              mode="time"
              display="compact"
              themeVariant={t.dark ? 'dark' : 'light'}
              onChange={(_e, d) => d && setTimePart(d)}
            />
          </View>
          {errorTime ? <Text style={styles.errorText}>⚠ {errorTime}</Text> : null}
        </View>
      </View>
    );
  }

  // ---------- Android: tap fields -> system dialogs ----------
  return (
    <View style={styles.rowWrap}>
      <View style={styles.col}>
        {label(dateLabel)}
        <Pressable
          style={[styles.pickBox, !!errorDate && styles.boxError]}
          onPress={() => setAndroidShow('date')}
        >
          <Text style={value ? styles.pickText : styles.pickPlaceholder}>
            {value
              ? formatDate(value, lang, true)
              : '--.--'}
          </Text>
        </Pressable>
        {errorDate ? <Text style={styles.errorText}>⚠ {errorDate}</Text> : null}
      </View>
      <View style={styles.col}>
        {label(timeLabel)}
        <Pressable
          style={[styles.pickBox, !!errorTime && styles.boxError]}
          onPress={() => setAndroidShow('time')}
        >
          <Text style={value ? styles.pickText : styles.pickPlaceholder}>
            {value ? toTimeInputValue(value) : '--:--'}
          </Text>
        </Pressable>
        {errorTime ? <Text style={styles.errorText}>⚠ {errorTime}</Text> : null}
      </View>
      {androidShow && (
        <DateTimePicker
          value={current}
          mode={androidShow}
          display="default"
          minimumDate={androidShow === 'date' ? new Date() : undefined}
          onChange={(_e, d) => {
            const which = androidShow;
            setAndroidShow(null);
            if (!d) return; // dismissed
            if (which === 'date') setDatePart(d);
            else setTimePart(d);
          }}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
  rowWrap: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  label: {
    color: t.c.textDim,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  req: { color: t.c.danger, fontSize: 13, fontWeight: '900' },
  iosBox: {
    backgroundColor: t.c.surface,
    borderColor: t.c.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 6,
    alignItems: 'flex-start',
  },
  pickBox: {
    backgroundColor: t.c.surface,
    borderColor: t.c.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  boxError: { borderColor: t.c.danger, borderWidth: 1.5 },
  pickText: { color: t.c.text, fontSize: 16 },
  pickPlaceholder: { color: t.c.textDim, fontSize: 16 },
  errorText: { color: t.c.danger, fontSize: 13, fontWeight: '600', marginTop: 4 },
}),
);
