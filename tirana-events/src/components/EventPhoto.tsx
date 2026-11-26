import React, { useState } from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';
import { EventItem } from '@ktu/shared';
import { useTheme } from '@/lib/theme';
import { CATEGORY_ICON } from '@/components/icons';

/**
 * An event's cover. Bundled assets and picker URIs both work; when there is no
 * photo, or it fails to load, the slot becomes a flat poster in the category's colour
 * with the category's line icon printed large and faint, so a card never looks broken
 * and never borrows a glossy emoji as its picture.
 */
export function EventPhoto({
  event,
  style,
  iconSize = 44,
  iconPlacement = 'center',
}: {
  event: EventItem;
  style?: StyleProp<ImageStyle>;
  iconSize?: number;
  /** watermark: upper right and faded, for tiles whose text sits over the photo */
  iconPlacement?: 'center' | 'watermark';
}) {
  const t = useTheme();
  const src = event.coverImage;
  // remember which source failed, so a new photo for the same card gets a fresh try
  const [failedSrc, setFailedSrc] = useState<string | ImageSourcePropType | null>(null);

  const CatIcon = CATEGORY_ICON[event.category];
  if (src == null || failedSrc === src) {
    return (
      <View
        style={[
          style as StyleProp<ViewStyle>,
          { backgroundColor: t.cat[event.category] },
          iconPlacement === 'center'
            ? { alignItems: 'center', justifyContent: 'center' }
            : { alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: '22%', paddingRight: '9%' },
        ]}
      >
        <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <CatIcon size={Math.round(iconSize * 1.4)} color="rgba(255,255,255,0.42)" strokeWidth={1.5} />
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
