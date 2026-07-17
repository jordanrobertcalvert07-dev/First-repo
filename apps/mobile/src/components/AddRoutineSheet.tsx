import React, { useState } from 'react';
import { Modal, View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { TIME_BLOCKS, TIME_BLOCK_LABEL, type TimeBlock, type Cadence, type NewAction } from '../storage/routines';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
type CadenceKind = Cadence['type'];
const CADENCE_LABEL: Record<CadenceKind, string> = {
  daily: 'Daily', weekdays: 'Weekdays', everyNDays: 'Every N days', specificDays: 'Specific days',
};

interface Props {
  onCancel: () => void;
  onSave: (input: NewAction) => void;
}

export function AddRoutineSheet({ onCancel, onSave }: Props) {
  const { colors, radius } = useTheme();
  const [title, setTitle] = useState('');
  const [timeBlock, setTimeBlock] = useState<TimeBlock>('morning');
  const [cadenceKind, setCadenceKind] = useState<CadenceKind>('daily');
  const [everyN, setEveryN] = useState(2);
  const [days, setDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));

  const toggleDay = (d: number) => setDays((prev) => {
    const next = new Set(prev);
    if (next.has(d)) next.delete(d); else next.add(d);
    return next;
  });

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    let cadence: Cadence;
    if (cadenceKind === 'daily') cadence = { type: 'daily' };
    else if (cadenceKind === 'weekdays') cadence = { type: 'weekdays' };
    else if (cadenceKind === 'everyNDays') cadence = { type: 'everyNDays', n: Math.max(1, everyN), anchor: new Date().toISOString().slice(0, 10) };
    else cadence = { type: 'specificDays', days: [...days] };
    onSave({ title: trimmed, timeBlock, cadence });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.head}>
          <Type token="h2" style={{ flex: 1 }}>New routine</Type>
          <Pressable onPress={onCancel} hitSlop={10} accessibilityLabel="Cancel">
            <Icon name="close" size={22} color={colors.textDim} />
          </Pressable>
        </View>

        <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Title</Type>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Stretch, take vitamins, journal"
          placeholderTextColor={colors.textDim}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
        />

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Time block</Type>
        <View style={styles.row}>
          {TIME_BLOCKS.map((tb) => {
            const on = tb === timeBlock;
            return (
              <Pressable
                key={tb}
                onPress={() => setTimeBlock(tb)}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
              >
                <Type token="label" color={on ? colors.onPrimary : colors.text}>{TIME_BLOCK_LABEL[tb]}</Type>
              </Pressable>
            );
          })}
        </View>

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Repeats</Type>
        <View style={styles.row}>
          {(Object.keys(CADENCE_LABEL) as CadenceKind[]).map((k) => {
            const on = k === cadenceKind;
            return (
              <Pressable
                key={k}
                onPress={() => setCadenceKind(k)}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
              >
                <Type token="label" color={on ? colors.onPrimary : colors.text}>{CADENCE_LABEL[k]}</Type>
              </Pressable>
            );
          })}
        </View>

        {cadenceKind === 'everyNDays' && (
          <View style={[styles.row, { alignItems: 'center', marginTop: 12 }]}>
            <Pressable onPress={() => setEveryN((n) => Math.max(1, n - 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
              <Type token="h3">–</Type>
            </Pressable>
            <Type token="body" style={{ minWidth: 90, textAlign: 'center' }}>every {everyN} day{everyN === 1 ? '' : 's'}</Type>
            <Pressable onPress={() => setEveryN((n) => n + 1)} style={[styles.stepBtn, { borderColor: colors.border }]}>
              <Type token="h3">+</Type>
            </Pressable>
          </View>
        )}

        {cadenceKind === 'specificDays' && (
          <View style={[styles.row, { marginTop: 12 }]}>
            {DAY_LABELS.map((label, i) => {
              const on = days.has(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i)}
                  style={[styles.dayDot, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
                >
                  <Type token="label" color={on ? colors.onPrimary : colors.text}>{label}</Type>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={[styles.btn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 }]}>
            <Type token="label" style={{ textAlign: 'center' }}>Cancel</Type>
          </Pressable>
          <Pressable
            onPress={save}
            style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.sm, opacity: title.trim() ? 1 : 0.5 }]}
          >
            <Type token="label" color={colors.onPrimary} style={{ textAlign: 'center' }}>Add routine</Type>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, alignSelf: 'center', width: '100%', maxWidth: 520,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, padding: 20,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  stepBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, justifyContent: 'center' },
});
