import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/** Map the app's semantic icon names to Material Community Icons glyphs. */
const GLYPH: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  today: 'home-variant-outline',
  routine: 'checkbox-marked-circle-outline',
  health: 'heart-pulse',
  substances: 'flask-outline',
  journals: 'notebook-outline',
  contacts: 'account-multiple-outline',
  ideas: 'lightbulb-outline',
  goals: 'target',
  more: 'dots-horizontal',
  lock: 'lock-outline',
  moon: 'weather-night',
  pill: 'pill',
  leaf: 'leaf',
  run: 'run',
  'cup-water': 'cup-water',
  drop: 'cup-water',
  pen: 'pencil-outline',
  pencil: 'pencil-outline',
  plus: 'plus',
  mic: 'microphone-outline',
  send: 'arrow-right',
  close: 'close',
  check: 'check',
};

export function Icon({ name, size = 20, color }: { name: string; size?: number; color: string }) {
  return <MaterialCommunityIcons name={GLYPH[name] ?? 'circle-small'} size={size} color={color} />;
}
