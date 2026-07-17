import React from 'react';
import { View, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/** A 1-5 felt-sense rating. Read-only unless `onChange` is given. */
export function MoodDots({ value, onChange, size = 8 }: { value: number | null; onChange?: (v: number | null) => void; size?: number }) {
  const { colors } = useTheme();
  const dots = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {dots.map((d) => {
        const on = value != null && d <= value;
        const Dot = (
          <View
            style={{
              width: size, height: size, borderRadius: size / 2,
              backgroundColor: on ? colors.primary : 'transparent',
              borderWidth: on ? 0 : 1.3,
              borderColor: colors.textDim,
            }}
          />
        );
        if (!onChange) return <View key={d}>{Dot}</View>;
        return (
          <Pressable
            key={d}
            hitSlop={8}
            onPress={() => onChange(value === d ? null : d)}
            accessibilityRole="button"
            accessibilityLabel={`Mood ${d} of 5`}
          >
            {Dot}
          </Pressable>
        );
      })}
    </View>
  );
}
