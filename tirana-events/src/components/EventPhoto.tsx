import React, { useState } from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';
import { EventItem } from '@/data/types';
import { CATEGORY_EMOJI, useTheme } from '@/lib/theme';
import { Emoji } from '@/components/ui';

/**
 * An event's cover. Bundled assets and picker URIs both work; when there is no
 * photo, or it fails to load, the slot shows the category's color and emoji so
 * a card never looks broken.
 */
export function EventPhoto({
  event,
  style,
  emojiSize = 44,
  emojiPlacement = 'center',
}: {
  event: EventItem;
  style?: StyleProp<ImageStyle>;
  emojiSize?: number;
  /** watermark: upper right and faded, for tiles whose text sits over the photo */
  emojiPlacement?: 'center' | 'watermark';
}) {
  const t = useTheme();
  const src = event.coverImage;
  // remember which source failed, so a new photo for the same card gets a fresh try
  const [failedSrc, setFailedSrc] = useState<string | ImageSourcePropType | null>(null);

  if (src == null || failedSrc === src) {
    return (
      <View
        style={[
          style as StyleProp<ViewStyle>,
          { backgroundColor: t.cat[event.category] },
          emojiPlacement === 'center'
            ? { alignItems: 'center', justifyContent: 'center' }
            : { alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: '22%', paddingRight: '9%' },
        ]}
      >
        <View style={emojiPlacement === 'watermark' ? { opacity: 0.55, transform: [{ rotate: '-8deg' }] } : null}>
          <Emoji size={emojiSize}>{CATEGORY_EMOJI[event.category]}</Emoji>
        </View>
      </View>
    );
  }

  return (
    <Image
      // only strings need wrapping; a require() asset is already a source (number natively, object on web)
      source={typeof src === 'string' ? { uri: src } : src}
      style={style}
      onError={() => setFailedSrc(src)}
      accessibilityIgnoresInvertColors
    />
  );
}
