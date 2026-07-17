import React, { useState } from 'react';
import { Modal, View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { MoodDots } from '../ui/MoodDots';
import { JOURNAL_KINDS, JOURNAL_KIND_LABEL, type JournalKind, type JournalEntry, type NewJournalEntry } from '../storage/journals';

interface Props {
  entry?: JournalEntry;
  defaultKind: JournalKind;
  onCancel: () => void;
  onSave: (input: NewJournalEntry) => void;
  onDelete?: () => void;
}

export function JournalComposer({ entry, defaultKind, onCancel, onSave, onDelete }: Props) {
  const { colors, radius } = useTheme();
  const [kind, setKind] = useState<JournalKind>(entry?.kind ?? defaultKind);
  const [body, setBody] = useState(entry?.body ?? '');
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);

  const save = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSave({ kind, body: trimmed, mood });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.head}>
          <Type token="h2" style={{ flex: 1 }}>{entry ? 'Edit entry' : 'New journal entry'}</Type>
          <Pressable onPress={onCancel} hitSlop={10} accessibilityLabel="Cancel">
            <Icon name="close" size={22} color={colors.textDim} />
          </Pressable>
        </View>

        <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Journal</Type>
        <View style={styles.row}>
          {JOURNAL_KINDS.map((k) => {
            const on = k === kind;
            return (
              <Pressable
                key={k}
                onPress={() => setKind(k)}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
              >
                <Type token="label" color={on ? colors.onPrimary : colors.text}>{JOURNAL_KIND_LABEL[k]}</Type>
              </Pressable>
            );
          })}
        </View>

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Entry</Type>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Write however it comes out…"
          placeholderTextColor={colors.textDim}
          multiline
          textAlignVertical="top"
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
        />

        <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Mood (optional)</Type>
        <MoodDots value={mood} onChange={setMood} size={18} />

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
            style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.sm, opacity: body.trim() ? 1 : 0.5 }]}
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
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 140 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, justifyContent: 'center' },
  deleteBtn: { borderWidth: 1, borderColor: 'transparent' },
});
