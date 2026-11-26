import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { makeStyles, radius, useTheme } from '@/lib/theme';

/** Labelled text input with a required mark and an inline error that never shifts the text. */
export function Field({
  label,
  value,
  onChange,
  multiline,
  keyboard,
  required,
  error,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboard?: 'numeric';
  required?: boolean;
  error?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const theme = useTheme();
  const s = useFieldStyles();
  return (
    <>
      <FieldLabel label={label} required={required} />
      <TextInput
        style={[s.input, multiline && s.multiline, !!error && s.inputError]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboard}
        placeholder={placeholder}
        maxLength={maxLength}
        placeholderTextColor={theme.c.textDim}
        accessibilityLabel={required ? `${label}, *` : label}
      />
      <FieldError error={error} />
    </>
  );
}

export function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  const s = useFieldStyles();
  return (
    <Text style={s.label}>
      {label}
      {required && <Text style={s.req}> *</Text>}
    </Text>
  );
}

export function FieldError({ error }: { error?: string }) {
  const s = useFieldStyles();
  return error ? <Text style={s.errorText}>{error}</Text> : null;
}

export const useFieldStyles = makeStyles((t) =>
  StyleSheet.create({
    label: { color: t.c.text, fontSize: 14, fontWeight: '500', marginTop: 16, marginBottom: 8 },
    req: { color: t.c.danger, fontSize: 14, fontWeight: '600' },
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
    multiline: { minHeight: 96, textAlignVertical: 'top' },
    // thicker error border eats into the padding, so the text never moves when an error appears
    inputError: { borderColor: t.c.danger, borderWidth: 2, padding: 12 - (2 - Math.min(t.outline, 2)) },
    errorText: { color: t.c.danger, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  }),
);
