import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import type { PersistedEntry } from '../storage/records';
import { formatRelativeTime } from '../util/relativeTime';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';

function describeEntry(entry: PersistedEntry): string {
  const detail = entry.fields
    .filter((f) => f.value && f.value !== '')
    .slice(0, 2)
    .map((f) => f.value)
    .join(' · ');
  return `${detail || 'logged'} · ${formatRelativeTime(entry.createdAt)}`;
}

const EXAMPLES = [
  'slept about five hours, woke up twice, weird dreams, took my meds around eight',
  'went for a 30 minute walk and drank 2 litres of water',
  'felt anxious this afternoon, mood about 4, journaled for a bit',
];

function LogRow({ icon, title, detail, last }: { icon: string; title: string; detail: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.rowIco, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name={icon} size={16} color={colors.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Type token="body">{title}</Type>
        <Type token="mono" dim>{detail}</Type>
      </View>
    </View>
  );
}

export function TodayScreen({ wide, onExample }: { wide: boolean; onExample: (text: string) => void }) {
  const { colors, greeting, phaseSub } = useTheme();
  const { recent } = useAppState();
  const now = new Date();
  const clock = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const accentWord = greeting.match(/morning|afternoon|evening/i)?.[0];

  const glance = (
    <Card>
      <Type token="eyebrow" dim uppercase>Today, so far</Type>
      <Type token="h3" style={{ marginTop: 4, marginBottom: 4 }}>
        {recent.length === 0 ? 'Nothing logged yet' : `${recent.length} thing${recent.length === 1 ? '' : 's'} logged`}
      </Type>
      <Type token="caption" dim>
        Tell LifeLike about your day using the bar above — say it however it comes out, and you'll get to
        review everything before it's saved.
      </Type>
    </Card>
  );

  const river = (
    <Card>
      <Type token="eyebrow" dim uppercase>Recently logged</Type>
      <Type token="h3" style={{ marginTop: 4, marginBottom: 6 }}>Today's river</Type>
      {recent.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 22, gap: 8 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="today" size={20} color={colors.textDim} />
          </View>
          <Type token="caption" dim style={{ textAlign: 'center' }}>Nothing here yet. Your logged entries will appear as a running river.</Type>
        </View>
      ) : (
        recent.map((l, i) => (
          <LogRow key={l.id} icon={l.icon} title={l.section} detail={describeEntry(l)} last={i === recent.length - 1} />
        ))
      )}
    </Card>
  );

  const lockNote = (
    <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={[styles.lk, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name="lock" size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Type token="label">Medical &amp; Substances</Type>
        <Type token="caption" dim style={{ marginTop: 2 }}>
          Phone-only. These sections stay on your phone and never sync to the browser.
        </Type>
      </View>
    </Card>
  );

  const examples = (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingHorizontal: 4 }}>
      {EXAMPLES.map((ex, i) => (
        <Pressable key={i} onPress={() => onExample(ex)} style={[styles.ex, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
          <Type token="caption" dim numberOfLines={1}>“{ex.length > 34 ? ex.slice(0, 34) + '…' : ex}”</Type>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={{ gap: 14 }}>
      <View style={{ paddingHorizontal: 4, paddingTop: 4 }}>
        <Type token="eyebrow" dim uppercase>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Type>
        <Type token="display" style={{ marginTop: 6 }}>
          {accentWord ? (
            <>
              {greeting.split(accentWord)[0]}
              <Type token="display" color={colors.primary}>{accentWord}</Type>
              {greeting.split(accentWord)[1]}
            </>
          ) : greeting}
        </Type>
        <Type token="body" dim style={{ marginTop: 6 }}>{clock} · {phaseSub}</Type>
      </View>

      {examples}

      {wide ? (
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.6, gap: 16 }}>{glance}{river}</View>
          <View style={{ flex: 1, gap: 16 }}>{lockNote}</View>
        </View>
      ) : (
        <>{glance}{river}</>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rowIco: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  ex: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, maxWidth: '100%' },
  lk: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
