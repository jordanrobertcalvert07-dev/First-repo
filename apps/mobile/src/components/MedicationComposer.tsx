import React, { useState } from 'react';
import { Modal, View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import type { Medication, NewMedication } from '../storage/medical';

interface Props {
  medication?: Medication;
  onCancel: () => void;
  onSave: (input: NewMedication) => void;
  onDelete?: () => void;
}

export function MedicationComposer({ medication, onCancel, onSave, onDelete }: Props) {
  const { colors, radius } = useTheme();
  const [name, setName] = useState(medication?.name ?? '');
  const [dosage, setDosage] = useState(medication?.dosage ?? '');
  const [notes, setNotes] = useState(medication?.notes ?? '');

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, dosage: dosage.trim(), notes: notes.trim() });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.head}>
          <Type token="h2" style={{ flex: 1 }}>{medication ? 'Edit medication' : 'New medication'}</Type>
          <Pressable onPress={onCancel} hitSlop={10} accessibilityLabel="Cancel">
            <Icon name="close" size={22} color={colors.textDim} />
          </Pressable>
        </View>

        <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Name</Type>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Mirtazapine"
          placeholderTextColor={colors.textDim}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
        />

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Dosage</Type>
        <TextInput
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g. 15mg, nightly"
          placeholderTextColor={colors.textDim}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
        />

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Notes (optional)</Type>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Prescribing doctor, purpose, side effects to watch for…"
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
            style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.sm, opacity: name.trim() ? 1 : 0.5 }]}
          >
            <Type token="label" color={colors.onPrimary} style={{ textAlign: 'center' }}>{medication ? 'Save' : 'Add medication'}</Type>
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
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, justifyContent: 'center' },
  deleteBtn: { borderWidth: 1, borderColor: 'transparent' },
});
