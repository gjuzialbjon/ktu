import React, { createContext, useContext } from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextStyle } from 'react-native';
import { BODY_FONT } from '@/lib/theme';

/**
 * Text and TextInput that set Onest, the body face, at the right weight.
 *
 * Custom fonts ship one file per weight, and Android ignores `fontWeight` on them (it fakes
 * bold instead), so the weight in a style picks the file here. Styles keep writing
 * `fontWeight: '600'` as usual. A style that names its own `fontFamily` (headings, the
 * handwritten face) is left alone.
 *
 * Weights step down one notch on purpose: 700 and 600 both render semibold, 800+ bold, so
 * labels and chips stop shouting and headings (Young Serif) carry the hierarchy.
 */
export function bodyFont(weight: TextStyle['fontWeight']): string {
  switch (String(weight ?? '400')) {
    case '500':
      return BODY_FONT.medium;
    case '600':
    case '700':
    case 'bold':
      return BODY_FONT.semibold;
    case '800':
    case '900':
      return BODY_FONT.bold;
    default:
      return BODY_FONT.regular;
  }
}

function withBodyFont<S>(style: S, nested = false): S | TextStyle[] {
  const flat = (StyleSheet.flatten(style as TextStyle) ?? {}) as TextStyle;
  if (flat.fontFamily) return style;
  // a word inside a line keeps the line's face and weight unless it asks for its own
  if (nested && flat.fontWeight == null) return style;
  return [style as TextStyle, { fontFamily: bodyFont(flat.fontWeight), fontWeight: 'normal' }];
}

const InText = createContext(false);

// React 19: `ref` is an ordinary prop, so it passes straight through with the rest.
export function Text({ style, children, ...rest }: React.ComponentProps<typeof RNText>) {
  const nested = useContext(InText);
  return (
    <RNText {...rest} style={withBodyFont(style, nested)}>
      {nested ? children : <InText.Provider value>{children}</InText.Provider>}
    </RNText>
  );
}

export function TextInput({ style, ...rest }: React.ComponentProps<typeof RNTextInput>) {
  return <RNTextInput {...rest} style={withBodyFont(style)} />;
}
