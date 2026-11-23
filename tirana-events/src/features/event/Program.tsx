import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { EventItem } from '@ktu/shared';
import { useI18n } from '@/lib/i18n';
import { makeStyles, space, useTheme } from '@/lib/theme';
import { Display } from '@/components/ui';
import { formatDuration, programStops } from './stats';

const MARK = 30;
const TIME_W = 52;
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * The evening as waypoints on a route: A where you meet, 1, 2… what happens, B how it ends,
 * joined by a line. While the exact time is hidden (ask to join) it shows "+45m" from the start.
 */
export function Program({ event, hidden }: { event: EventItem; hidden: boolean }) {
  const { t } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const stops = programStops(event);
  if (stops.length === 0) return null;
  const accent = theme.cat[event.category];
  return (
    <View style={s.wrap}>
      <Display size={20}>{t.program_title}</Display>
      <Text style={s.note}>{t.program_note}</Text>
      <View style={s.list}>
        {/* the route line, behind the marks */}
        <View style={[s.line, { backgroundColor: accent }]} />
        {stops.map((p) => {
          const end = p.mark === 'A' || p.mark === 'B';
          return (
            <View key={p.mark} style={s.row}>
              <Text style={s.time}>{hidden ? (p.min === 0 ? '0m' : `+${formatDuration(p.min)}`) : hhmm(p.at)}</Text>
              <View
                style={[
                  s.mark,
                  end
                    ? { backgroundColor: theme.c.text, borderColor: theme.c.text }
                    : { backgroundColor: theme.c.surface, borderColor: accent },
                ]}
              >
                <Text style={[s.markText, { color: end ? theme.c.bg : theme.c.text }]}>{p.mark}</Text>
              </View>
              <Text style={s.text}>{p.text}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { marginTop: space.xl },
    note: { color: t.c.textDim, fontSize: 14, marginTop: 2 },
    list: { marginTop: space.md, gap: space.md },
    // centred under the marks: time column + gap + half a mark
    line: { position: 'absolute', left: TIME_W + space.md + MARK / 2 - 1.5, top: MARK / 2, bottom: MARK / 2, width: 3, borderRadius: 2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: MARK },
    time: { width: TIME_W, color: t.c.text, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
    mark: {
      width: MARK,
      height: MARK,
      borderRadius: MARK / 2,
      borderWidth: 2.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    markText: { fontSize: 13, fontWeight: '800' },
    text: { flex: 1, color: t.c.text, fontSize: 15, lineHeight: 21 },
  }),
);
