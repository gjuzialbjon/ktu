import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/lib/i18n';
import { makeStyles, radius } from '@/lib/theme';

/** Bottom sheet: slides up over a dimmed backdrop; tapping the backdrop closes it. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      {/* the dim covers the whole screen, also beside the sheet on wide screens, so nothing
          underneath (like a page's bottom bar) shows through next to it */}
      <View style={s.root}>
        <Pressable style={s.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={t.close} />
        {/* full width, so on a wide screen it covers whatever sits at the bottom of the page;
            the content stays in a readable column */}
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={s.inner}>
            <View style={s.grabber} />
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(27,20,40,0.32)' },
    sheet: {
      backgroundColor: t.c.bg,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      paddingHorizontal: 16,
      paddingTop: 10,
      maxHeight: '85%',
      width: '100%',
    },
    inner: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 12, flexShrink: 1 },
    grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.c.border },
  }),
);
