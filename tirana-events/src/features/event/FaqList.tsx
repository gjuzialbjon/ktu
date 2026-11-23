import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FaqItem } from '@ktu/shared';
import { makeStyles, radius } from '@/lib/theme';

/** Organizer FAQ: each question expands in place. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <>
      {items.map((f) => (
        <FaqRow key={f.q} item={f} />
      ))}
    </>
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const s = useStyles();
  return (
    <Pressable
      style={s.row}
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <View style={s.head}>
        <Text style={s.q}>{item.q}</Text>
        <Text style={s.toggle}>{open ? '−' : '+'}</Text>
      </View>
      {open && <Text style={s.a}>{item.a}</Text>}
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    row: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      padding: 14,
      marginBottom: 8,
    },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    q: { color: t.c.text, fontSize: 15, fontWeight: '700', flex: 1 },
    toggle: { color: t.c.text, fontSize: 22, fontWeight: '700' },
    a: { color: t.c.textDim, fontSize: 15, lineHeight: 22, marginTop: 10 },
  }),
);
