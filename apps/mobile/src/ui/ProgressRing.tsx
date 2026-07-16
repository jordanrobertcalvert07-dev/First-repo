import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from './Type';

/** The routine-progress ring on Today. `value` in [0,1]. */
export function ProgressRing({ value, done, total, size = 96 }: { value: number; done: number; total: number; size?: number }) {
  const { colors } = useTheme();
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * value} ${c}`}
          fill="none"
        />
      </Svg>
      <Type token="h2">{done}/{total}</Type>
      <Type token="eyebrow" dim uppercase>actions</Type>
    </View>
  );
}
