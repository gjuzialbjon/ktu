import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { makeStyles, space } from '@/lib/theme';
import { Button, Chip, Display } from '@/components/ui';
import { Sheet } from '@/components/Sheet';

/**
 * Pick topics you never want in your feed. Used from the profile (all topics) and from
 * an event page (just that event's topics: the moment you see a chess event is when you
 * know you do not want chess). Taps apply right away; hidden topics show as selected.
 */
export function HideTopicsSheet({ visible, onClose, tags }: { visible: boolean; onClose: () => void; tags: string[] }) {
  const { t } = useI18n();
  const s = useStyles();
  const { profile, toggleHidden } = useStore();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Display size={22}>{t.hidden_sheet_title}</Display>
      <Text style={s.hint}>{t.hidden_sheet_hint}</Text>
      <ScrollView contentContainerStyle={s.wrap}>
        {tags.map((tag) => {
          const hidden = profile.hidden.includes(tag);
          return (
            <Chip
              key={tag}
              emoji={hidden ? '🙈' : undefined}
              label={`#${tag}`}
              active={hidden}
              onPress={() => toggleHidden(tag)}
            />
          );
        })}
      </ScrollView>
      <View style={{ marginTop: space.sm }}>
        <Button label={t.hidden_done} onPress={onClose} />
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    hint: { color: t.c.textDim, fontSize: 14, marginTop: -4 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  }),
);
