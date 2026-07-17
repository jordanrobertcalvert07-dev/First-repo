import React, { useState } from 'react';
import { Modal, View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import type { RoutineAction } from '../storage/routines';
import type { GoalTimeframe, Goal, NewGoal } from '../storage/goals';

interface Props {
  goal?: Goal;
  routineActions: RoutineAction[];
  onCancel: () => void;
  onSave: (input: NewGoal) => void;
  onDelete?: () => void;
}

export function GoalComposer({ goal, routineActions, onCancel, onSave, onDelete }: Props) {
  const { colors, radius } = useTheme();
  const [title, setTitle] = useState(goal?.title ?? '');
  const [timeframe, setTimeframe] = useState<GoalTimeframe>(goal?.timeframe ?? 'short');
  const [notes, setNotes] = useState(goal?.notes ?? '');
  const [linked, setLinked] = useState<Set<string>>(new Set(goal?.linkedActionIds ?? []));

  const toggleLinked = (id: string) => setLinked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({ title: trimmed, timeframe, notes: notes.trim(), linkedActionIds: [...linked] });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.head}>
          <Type token="h2" style={{ flex: 1 }}>{goal ? 'Edit goal' : 'New goal'}</Type>
          <Pressable onPress={onCancel} hitSlop={10} accessibilityLabel="Cancel">
            <Icon name="close" size={22} color={colors.textDim} />
          </Pressable>
        </View>

        <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Title</Type>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Run a 10k"
          placeholderTextColor={colors.textDim}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
        />

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Timeframe</Type>
        <View style={styles.row}>
          {(['short', 'long'] as GoalTimeframe[]).map((t) => {
            const on = t === timeframe;
            return (
              <Pressable
                key={t}
                onPress={() => setTimeframe(t)}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
              >
                <Type token="label" color={on ? colors.onPrimary : colors.text}>{t === 'short' ? 'Short-term' : 'Long-term'}</Type>
              </Pressable>
            );
          })}
        </View>

        {routineActions.length > 0 && (
          <>
            <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Linked habits (optional)</Type>
            <View style={styles.row}>
              {routineActions.map((a) => {
                const on = linked.has(a.id);
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => toggleLinked(a.id)}
                    style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
                  >
                    <Type token="label" color={on ? colors.onPrimary : colors.text}>{a.title}</Type>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Notes (optional)</Type>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Why this goal matters, or what success looks like…"
          placeholderTextColor={colors.textDim}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.notesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
        />

        <View style={styles.actions}>
          {onDelete ? (
            <Pressable onPress={onDelete} style={[styles.btn, styles.deleteBtn]}>
              <Type token="label" color={colors.textDim} style={{ textAlign: 'center' }}>Delete</Type>
            </Pressable>
          ) : (
            <Pressable onPress={onCancel} style={[styles.btn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 }]}>
              <Type token="label" style={{ textAlign: 'center' }}>Cancel</Type>
            </Pressable>
          )}
          <Pressable
            onPress={save}
            style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.sm, opacity: title.trim() ? 1 : 0.5 }]}
          >
            <Type token="label" color={colors.onPrimary} style={{ textAlign: 'center' }}>{goal ? 'Save' : 'Add goal'}</Type>
          </Pressable>
        </View>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  sheet: {
    width: '100%', maxWidth: 560,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, padding: 20,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  notesInput: { minHeight: 80 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, justifyContent: 'center' },
  deleteBtn: { borderWidth: 1, borderColor: 'transparent' },
});
