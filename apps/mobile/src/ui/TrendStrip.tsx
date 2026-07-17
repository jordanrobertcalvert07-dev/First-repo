import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/** A compact per-day trend strip: filled = done, outlined = due but missed, a small
 * faint dot = not due that day. Trend, not shame — a run of outlines isn't styled
 * as an error, just as history. */
export function TrendStrip({ trend }: { trend: { day: string; due: boolean; done: boolean }[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
      {trend.map((t) => {
        if (!t.due) {
          return (
            <View key={t.day} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          );
        }
        return (
          <View
            key={t.day}
            style={{
              width: 8, height: 8, borderRadius: 2.5,
              backgroundColor: t.done ? colors.primary : 'transparent',
              borderWidth: t.done ? 0 : 1.3,
              borderColor: colors.primary,
            }}
          />
        );
      })}
    </View>
  );
}
