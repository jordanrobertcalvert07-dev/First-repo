import React, { useState } from 'react';
import { Modal, View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import type { VitalEntry, NewVitalEntry } from '../storage/vitals';

interface Props {
  entry?: VitalEntry;
  onCancel: () => void;
  onSave: (input: NewVitalEntry) => void;
  onDelete?: () => void;
}

const toNum = (s: string): number | null => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export function VitalsComposer({ entry, onCancel, onSave, onDelete }: Props) {
  const { colors, radius } = useTheme();
  const [weight, setWeight] = useState(entry?.weightLb != null ? String(entry.weightLb) : '');
  const [hr, setHr] = useState(entry?.restingHr != null ? String(entry.restingHr) : '');
  const [systolic, setSystolic] = useState(entry?.systolic != null ? String(entry.systolic) : '');
  const [diastolic, setDiastolic] = useState(entry?.diastolic != null ? String(entry.diastolic) : '');
  const [note, setNote] = useState(entry?.note ?? '');

  const hasAnything = weight.trim() || hr.trim() || systolic.trim() || diastolic.trim() || note.trim();

  const save = () => {
    if (!hasAnything) return;
    onSave({
      weightLb: toNum(weight), restingHr: toNum(hr), systolic: toNum(systolic), diastolic: toNum(diastolic),
      note: note.trim(),
    });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.head}>
          <Type token="h2" style={{ flex: 1 }}>{entry ? 'Edit entry' : 'New vitals entry'}</Type>
          <Pressable onPress={onCancel} hitSlop={10} accessibilityLabel="Cancel">
            <Icon name="close" size={22} color={colors.textDim} />
          </Pressable>
        </View>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Weight (lb)</Type>
            <TextInput
              value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="—"
              placeholderTextColor={colors.textDim}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Resting HR</Type>
            <TextInput
              value={hr} onChangeText={setHr} keyboardType="numeric" placeholder="—"
              placeholderTextColor={colors.textDim}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            />
          </View>
        </View>

        <View style={[styles.row2, { marginTop: 16 }]}>
          <View style={{ flex: 1 }}>
            <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Systolic</Type>
            <TextInput
              value={systolic} onChangeText={setSystolic} keyboardType="numeric" placeholder="—"
              placeholderTextColor={colors.textDim}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Diastolic</Type>
            <TextInput
              value={diastolic} onChangeText={setDiastolic} keyboardType="numeric" placeholder="—"
              placeholderTextColor={colors.textDim}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            />
          </View>
        </View>

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Note (optional)</Type>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Anything else worth noting…"
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
            style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.sm, opacity: hasAnything ? 1 : 0.5 }]}
          >
            <Type token="label" color={colors.onPrimary} style={{ textAlign: 'center' }}>{entry ? 'Save' : 'Add entry'}</Type>
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
  row2: { flexDirection: 'row', gap: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  notesInput: { minHeight: 70 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, justifyContent: 'center' },
  deleteBtn: { borderWidth: 1, borderColor: 'transparent' },
});
