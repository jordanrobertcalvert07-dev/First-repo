import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { TrendStrip } from '../ui/TrendStrip';
import { AddRoutineSheet } from '../components/AddRoutineSheet';
import {
  TIME_BLOCKS, TIME_BLOCK_LABEL, isDoneOn, isDueOn, computeStreak, recentTrend, toDayKey, cadenceLabel,
  type RoutineAction, type NewAction,
} from '../storage/routines';

function ActionRow({ action, onToggle, onRemove, last }: { action: RoutineAction; onToggle: () => void; onRemove: () => void; last: boolean }) {
  const { colors } = useTheme();
  const { routineCompletions } = useAppState();
  const today = new Date();
  const done = isDoneOn(routineCompletions, action.id, toDayKey(today));
  const streak = useMemo(() => computeStreak(action, routineCompletions, today), [action, routineCompletions]);
  const trend = useMemo(() => recentTrend(action, routineCompletions, today, 14), [action, routineCompletions]);

  return (
    <View style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        style={[styles.check, { borderColor: colors.primary, backgroundColor: done ? colors.primary : 'transparent' }]}
      >
        {done && <Icon name="check" size={13} color={colors.onPrimary} />}
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Type token="body" style={done ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined}>
          {action.title}
        </Type>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Type token="mono" dim>{cadenceLabel(action.cadence)}</Type>
          {streak > 0 && (
            <Type token="mono" color={colors.primary}>· {streak}d streak</Type>
          )}
        </View>
        <View style={{ marginTop: 6 }}>
          <TrendStrip trend={trend} />
        </View>
      </View>
      <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={`Remove ${action.title}`} style={{ padding: 4 }}>
        <Icon name="close" size={16} color={colors.textDim} />
      </Pressable>
    </View>
  );
}

export function RoutineScreen({ wide }: { wide: boolean }) {
  const { colors, radius } = useTheme();
  const { routineActions, addRoutineAction, toggleRoutineToday, removeRoutineAction } = useAppState();
  const [adding, setAdding] = useState(false);
  const today = new Date();

  const blocks = TIME_BLOCKS.map((tb) => ({
    tb,
    actions: routineActions.filter((a) => a.timeBlock === tb),
  })).filter((b) => b.actions.length > 0);

  const dueTodayCount = routineActions.filter((a) => isDueOn(a, today)).length;

  const save = async (input: NewAction) => {
    await addRoutineAction(input);
    setAdding(false);
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Type token="h1">Routine</Type>
        <Type token="body" dim style={{ marginTop: 4 }}>
          {routineActions.length === 0 ? 'No routines yet' : `${dueTodayCount} due today across ${routineActions.length} routine${routineActions.length === 1 ? '' : 's'}`}
        </Type>
      </View>
      <Pressable onPress={() => setAdding(true)} style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
        <Icon name="plus" size={16} color={colors.onPrimary} />
        <Type token="label" color={colors.onPrimary}>Add routine</Type>
      </Pressable>
    </View>
  );

  const body = blocks.length === 0 ? (
    <Card style={{ alignItems: 'center', paddingVertical: 44, gap: 8 }}>
      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="routine" size={22} color={colors.textDim} />
      </View>
      <Type token="h3">Nothing set up yet</Type>
      <Type token="body" dim style={{ textAlign: 'center', maxWidth: 340 }}>
        Add a routine for something you want to do daily, on weekdays, or on your own schedule — mornings,
        evenings, whenever it belongs.
      </Type>
    </Card>
  ) : (
    <View style={wide ? styles.grid : undefined}>
      {blocks.map(({ tb, actions }) => (
        <Card key={tb} style={wide ? styles.gridItem : undefined}>
          <Type token="eyebrow" dim uppercase>{TIME_BLOCK_LABEL[tb]}</Type>
          <View style={{ marginTop: 4 }}>
            {actions.map((a, i) => (
              <ActionRow
                key={a.id}
                action={a}
                last={i === actions.length - 1}
                onToggle={() => toggleRoutineToday(a.id)}
                onRemove={() => removeRoutineAction(a)}
              />
            ))}
          </View>
        </Card>
      ))}
    </View>
  );

  return (
    <View style={{ gap: 16 }}>
      {header}
      {body}
      {adding && <AddRoutineSheet onCancel={() => setAdding(false)} onSave={save} />}
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13 },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridItem: { flexBasis: '48%', flexGrow: 1, minWidth: 320 },
});
