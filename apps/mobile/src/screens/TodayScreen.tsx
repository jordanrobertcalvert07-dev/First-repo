import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { ProgressRing } from '../ui/ProgressRing';

const EXAMPLES = [
  'slept about five hours, woke up twice, weird dreams, took my meds around eight, smoked around ten',
  'went for a 30 minute walk and drank 2 litres of water',
  'felt anxious this afternoon, mood about 4, journaled for a bit',
];

function Chip({ label, warn }: { label: string; warn?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: warn ? colors.primary : colors.accent }]} />
      <Type token="caption">{label}</Type>
    </View>
  );
}

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
  const { colors, greeting, phaseTitle, phaseSub } = useTheme();
  const { recent, doneCount, totalCount } = useAppState();
  const now = new Date();
  const clock = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const accentWord = greeting.match(/morning|afternoon|evening/i)?.[0];

  const glance = (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <ProgressRing value={doneCount / totalCount} done={doneCount} total={totalCount} />
        <View style={{ flex: 1, minWidth: 0, gap: 10 }}>
          <Type token="eyebrow" dim uppercase>{phaseTitle}</Type>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Chip label={`${recent.length + 3} logged`} />
            <Chip label={`${totalCount - doneCount} outstanding`} warn />
          </View>
          <Type token="caption" dim>You're most of the way through today. Wind-down and evening meds are still open.</Type>
        </View>
      </View>
    </Card>
  );

  const outstanding = (
    <Card>
      <Type token="eyebrow" dim uppercase>Outstanding</Type>
      <Type token="h3" style={{ marginTop: 4, marginBottom: 6 }}>Still to do</Type>
      {[['Evening medication', '9:00 PM'], ['Wind-down routine', 'before bed'], ['Sleep journal', 'on waking']].map(([t, m], i, a) => (
        <View key={t} style={[styles.todo, i < a.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={[styles.check, { borderColor: colors.primary }]} />
          <View>
            <Type token="body">{t}</Type>
            <Type token="mono" dim>{m}</Type>
          </View>
        </View>
      ))}
    </Card>
  );

  const next = (
    <Card>
      <Type token="eyebrow" dim uppercase>Next up</Type>
      <Type token="h3" style={{ marginTop: 4 }}>Evening medication</Type>
      <Type token="caption" dim style={{ marginTop: 2, marginBottom: 10 }}>9:00 PM · part of your wind-down</Type>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip label="reminder on" />
        <Chip label="adherence tracked" warn />
      </View>
    </Card>
  );

  const recentCard = (
    <Card>
      <Type token="eyebrow" dim uppercase>Recently logged</Type>
      <Type token="h3" style={{ marginTop: 4, marginBottom: 6 }}>Today's river</Type>
      {recent.map((l, i) => (
        <LogRow key={l.id} icon={l.icon} title={l.section} detail={l.detail} last={i === recent.length - 1} />
      ))}
    </Card>
  );

  const lockNote = (
    <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={[styles.lk, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name="lock" size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Type token="label">Medical & Substances</Type>
        <Type token="caption" dim style={{ marginTop: 2 }}>
          Phone-only. These sections stay on your phone and never sync to the browser.
        </Type>
      </View>
    </Card>
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

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingHorizontal: 4 }}>
        {EXAMPLES.map((ex, i) => (
          <Pressable key={i} onPress={() => onExample(ex)} style={[styles.ex, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
            <Type token="caption" dim numberOfLines={1}>“{ex.length > 34 ? ex.slice(0, 34) + '…' : ex}”</Type>
          </Pressable>
        ))}
      </View>

      {wide ? (
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.6, gap: 16 }}>
            {glance}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>{next}</View>
              <View style={{ flex: 1 }}>{outstanding}</View>
            </View>
            {recentCard}
          </View>
          <View style={{ flex: 1, gap: 16 }}>{lockNote}</View>
        </View>
      ) : (
        <>
          {glance}
          {outstanding}
          {next}
          {recentCard}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rowIco: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  todo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5 },
  ex: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, maxWidth: '100%' },
  lk: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
