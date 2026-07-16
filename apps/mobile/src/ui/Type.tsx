import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import type { TypeToken } from '@lifelike/core';
import { useTheme } from '../theme/ThemeProvider';

interface Props extends TextProps {
  token?: TypeToken;
  color?: string;
  dim?: boolean;
  uppercase?: boolean;
}

/** Text that always draws from the shared type scale and the live theme colors. */
export function Type({ token = 'body', color, dim, uppercase, style, ...rest }: Props) {
  const t = useTheme();
  const spec = t.typeScale[token];
  const resolved = color ?? (dim ? t.colors.textDim : t.colors.text);
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: spec.family,
          fontSize: spec.size,
          lineHeight: spec.line,
          letterSpacing: spec.tracking,
          color: resolved,
        },
        uppercase ? { textTransform: 'uppercase' } : null,
        style,
      ]}
    />
  );
}
