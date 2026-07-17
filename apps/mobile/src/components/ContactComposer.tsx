import React, { useState } from 'react';
import { Modal, View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import {
  CADENCE_PRESETS, type ContactCategory, type Contact, type NewContact,
} from '../storage/contacts';

interface Props {
  contact?: Contact;
  onCancel: () => void;
  onSave: (input: NewContact) => void;
  onDelete?: () => void;
}

export function ContactComposer({ contact, onCancel, onSave, onDelete }: Props) {
  const { colors, radius } = useTheme();
  const [name, setName] = useState(contact?.name ?? '');
  const [category, setCategory] = useState<ContactCategory>(contact?.category ?? 'personal');
  const [supportNetwork, setSupportNetwork] = useState(contact?.supportNetwork ?? false);
  const [reachOutDays, setReachOutDays] = useState<number | null>(contact?.reachOutDays ?? null);
  const [notes, setNotes] = useState(contact?.notes ?? '');

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, category, supportNetwork, reachOutDays, notes: notes.trim() });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.head}>
          <Type token="h2" style={{ flex: 1 }}>{contact ? 'Edit contact' : 'New contact'}</Type>
          <Pressable onPress={onCancel} hitSlop={10} accessibilityLabel="Cancel">
            <Icon name="close" size={22} color={colors.textDim} />
          </Pressable>
        </View>

        <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Name</Type>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sam Rivera"
          placeholderTextColor={colors.textDim}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
        />

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Category</Type>
        <View style={styles.row}>
          {(['personal', 'professional'] as ContactCategory[]).map((c) => {
            const on = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
              >
                <Type token="label" color={on ? colors.onPrimary : colors.text}>{c === 'personal' ? 'Personal' : 'Professional'}</Type>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setSupportNetwork((v) => !v)}
            style={[styles.chip, styles.supportChip, { borderColor: colors.border, backgroundColor: supportNetwork ? colors.primary : colors.surfaceAlt }]}
          >
            <Icon name="heart" size={14} color={supportNetwork ? colors.onPrimary : colors.textDim} />
            <Type token="label" color={supportNetwork ? colors.onPrimary : colors.text}>Support network</Type>
          </Pressable>
        </View>

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Reach-out cadence</Type>
        <View style={styles.row}>
          {CADENCE_PRESETS.map((p) => {
            const on = p.days === reachOutDays;
            return (
              <Pressable
                key={p.label}
                onPress={() => setReachOutDays(p.days)}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
              >
                <Type token="label" color={on ? colors.onPrimary : colors.text}>{p.label}</Type>
              </Pressable>
            );
          })}
        </View>

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Notes (optional)</Type>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything worth remembering…"
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
            <Type token="label" color={colors.onPrimary} style={{ textAlign: 'center' }}>{contact ? 'Save' : 'Add contact'}</Type>
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
  supportChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, justifyContent: 'center' },
  deleteBtn: { borderWidth: 1, borderColor: 'transparent' },
});
