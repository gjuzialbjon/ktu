import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import X from 'lucide-react-native/icons/x';
import { PROGRAM_LAST_MIN, PROGRAM_MAX, PROGRAM_STEP_MIN, PROGRAM_TEXT_MAX, type ProgramStop } from '@ktu/shared';
import { Text, TextInput } from '@/components/Text';
import { Icon } from '@/components/icons';
import { useI18n } from '@/lib/i18n';
import { makeStyles, radius, space, useTheme } from '@/lib/theme';
import { formatDuration } from '@/features/event/stats';
import { FieldError, FieldLabel, useFieldStyles } from './Field';

/** A, 1, 2… B: the same marks the event page draws, so the host sees what people will see. */
export const markOf = (i: number, count: number) => (i === 0 ? 'A' : count > 1 && i === count - 1 ? 'B' : String(i));

/**
 * The optional "how the evening goes" section of the create form. Closed until the host asks
 * for it; each step is a time after the start (moved in 15-minute steps) and one short line.
 * Rows stay in the order they were written while typing (nothing jumps under a finger) and
 * are sorted by time when the event is sent.
 */
export function ProgramField({
  rows,
  onChange,
  error,
}: {
  rows: ProgramStop[];
  onChange: (rows: ProgramStop[]) => void;
  error?: string;
}) {
  const { t } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const f = useFieldStyles();

  const set = (i: number, patch: Partial<ProgramStop>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const shift = (i: number, by: number) =>
    set(i, { min: Math.max(0, Math.min(PROGRAM_LAST_MIN, rows[i].min + by)) });
  const add = () => {
    const last = rows[rows.length - 1]?.min ?? 0;
    onChange([...rows, { min: Math.min(PROGRAM_LAST_MIN, last + 30), text: '' }]);
  };

  return (
    <>
      <FieldLabel label={t.ev_program} />
      <Text style={s.hint}>{t.ev_program_hint}</Text>

      {rows.length === 0 ? (
        <AddLink label={t.ev_program_add} onPress={() => onChange([{ min: 0, text: '' }, { min: 60, text: '' }])} />
      ) : (
        <View style={s.list}>
          {rows.map((r, i) => {
            const mark = markOf(i, rows.length);
            const end = mark === 'A' || mark === 'B';
            const placeholder = i === 0 ? t.ev_program_ph_first : mark === 'B' ? t.ev_program_ph_last : t.ev_program_ph;
            return (
              <View key={i} style={s.row}>
                <View style={s.head}>
                  <View
                    style={[
                      s.mark,
                      end
                        ? { backgroundColor: theme.c.text, borderColor: theme.c.text }
                        : { backgroundColor: theme.c.surface, borderColor: theme.c.primary },
                    ]}
                  >
                    <Text style={[s.markText, { color: end ? theme.c.bg : theme.c.text }]}>{mark}</Text>
                  </View>
                  <StepButton
                    icon={Minus}
                    label={t.a11y_program_earlier(mark)}
                    disabled={r.min <= 0}
                    onPress={() => shift(i, -PROGRAM_STEP_MIN)}
                  />
                  {/* fixed width for the longest label in either language, so the buttons never move */}
                  <Text style={s.time} accessibilityLiveRegion="polite">
                    {r.min === 0 ? t.program_at_start : `+${formatDuration(r.min)}`}
                  </Text>
                  <StepButton
                    icon={Plus}
                    label={t.a11y_program_later(mark)}
                    disabled={r.min >= PROGRAM_LAST_MIN}
                    onPress={() => shift(i, PROGRAM_STEP_MIN)}
                  />
                  <View style={{ flex: 1 }} />
                  <StepButton icon={X} label={t.a11y_program_remove(mark)} onPress={() => onChange(rows.filter((_, j) => j !== i))} />
                </View>
                <TextInput
                  style={[f.input, s.input]}
                  value={r.text}
                  onChangeText={(text) => set(i, { text })}
                  maxLength={PROGRAM_TEXT_MAX}
                  placeholder={placeholder}
                  placeholderTextColor={theme.c.textDim}
                  accessibilityLabel={t.a11y_program_text(mark)}
                />
              </View>
            );
          })}
          {rows.length < PROGRAM_MAX && <AddLink label={t.ev_program_add_stop} onPress={add} />}
        </View>
      )}
      <FieldError error={error} />
    </>
  );
}

function StepButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: typeof Plus;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.step, pressed && { opacity: 0.7 }, disabled && { opacity: 0.35 }]}
    >
      <Icon as={icon} size={18} color={theme.c.text} />
    </Pressable>
  );
}

function AddLink({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.add, pressed && { opacity: 0.7 }]}
    >
      <Icon as={Plus} size={18} color={theme.c.text} />
      <Text style={s.addText}>{label}</Text>
    </Pressable>
  );
}

const MARK = 28;

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    hint: { color: t.c.textDim, fontSize: 13, marginTop: -4, marginBottom: space.sm },
    list: { gap: space.md },
    row: {
      gap: space.sm,
      padding: space.md,
      borderRadius: radius.md,
      borderWidth: t.outline,
      borderColor: t.c.border,
      backgroundColor: t.c.surfaceAlt,
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    mark: {
      width: MARK,
      height: MARK,
      borderRadius: MARK / 2,
      borderWidth: 2.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: space.xs,
    },
    markText: { fontSize: 13, fontWeight: '600' },
    step: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    time: { width: 96, textAlign: 'center', color: t.c.text, fontSize: 15, fontWeight: '500' },
    input: { marginBottom: 0 },
    add: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      alignSelf: 'flex-start',
      minHeight: 44,
      paddingRight: space.sm,
    },
    addText: { color: t.c.text, fontSize: 15, fontWeight: '500', textDecorationLine: 'underline' },
  }),
);
