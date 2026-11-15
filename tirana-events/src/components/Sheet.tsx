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
      <Pressable style={s.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={t.close} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={s.grabber} />
        {children}
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(27,20,40,0.32)' },
    sheet: {
      backgroundColor: t.c.bg,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      paddingHorizontal: 16,
      paddingTop: 10,
      gap: 12,
      maxHeight: '85%',
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
    },
    grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.c.border },
  }),
);
