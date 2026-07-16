import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';

/** Placeholder for sections not yet built out (Phases 2–8). */
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
      <Type token="h1">{title}</Type>
      <Type token="body" dim style={{ textAlign: 'center' }}>
        This section arrives in a later phase. The skeleton, sun engine, and capture flow are live now.
      </Type>
    </Card>
  );
}

/** Shown on the web build for phone-only sections (Medical, Substances). */
export function LockedScreen({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="lock" size={26} color={colors.primary} />
      </View>
      <Type token="h2">{title} is phone-only</Type>
      <Type token="body" dim style={{ textAlign: 'center', maxWidth: 360 }}>
        For privacy, this section stays on your phone and never syncs to the browser. Open LifeLike on your phone to view it.
      </Type>
    </Card>
  );
}
