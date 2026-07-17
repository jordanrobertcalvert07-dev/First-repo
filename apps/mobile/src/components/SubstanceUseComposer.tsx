import React, { useState } from 'react';
import { Modal, View, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { MoodDots } from '../ui/MoodDots';
import { SUBSTANCE_LABEL, type Substance, type SubstanceUseEntry, type NewSubstanceUse } from '../storage/substances';

interface Props {
  substance: Substance;
  entry?: SubstanceUseEntry;
  onCancel: () => void;
  onSave: (input: NewSubstanceUse) => void;
  onDelete?: () => void;
}

export function SubstanceUseComposer({ substance, entry, onCancel, onSave, onDelete }: Props) {
  const { colors, radius } = useTheme();
  const [amount, setAmount] = useState(entry?.amount ?? '');
  const [method, setMethod] = useState(entry?.method ?? '');
  const [context, setContext] = useState(entry?.context ?? '');
  const [trigger, setTrigger] = useState(entry?.trigger ?? '');
  const [note, setNote] = useState(entry?.note ?? '');
  const [moodBefore, setMoodBefore] = useState<number | null>(entry?.moodBefore ?? null);
  const [moodAfter, setMoodAfter] = useState<number | null>(entry?.moodAfter ?? null);

  const save = () => {
    onSave({
      substance, amount: amount.trim(), method: method.trim(), context: context.trim(),
      trigger: trigger.trim(), note: note.trim(), moodBefore, moodAfter,
    });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.head}>
          <Type token="h2" style={{ flex: 1 }}>{entry ? 'Edit entry' : `Log ${SUBSTANCE_LABEL[substance]}`}</Type>
          <Pressable onPress={onCancel} hitSlop={10} accessibilityLabel="Cancel">
            <Icon name="close" size={22} color={colors.textDim} />
          </Pressable>
        </View>
        <Type token="caption" dim style={{ marginBottom: 4 }}>Neutral, factual data — for your own reference only.</Type>

        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Amount</Type>
              <TextInput
                value={amount} onChangeText={setAmount} placeholder="optional"
                placeholderTextColor={colors.textDim}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Method</Type>
              <TextInput
                value={method} onChangeText={setMethod} placeholder="optional"
                placeholderTextColor={colors.textDim}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              />
            </View>
          </View>

          <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Context (optional)</Type>
          <TextInput
            value={context} onChangeText={setContext} placeholder="e.g. evening, with friends, alone"
            placeholderTextColor={colors.textDim}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
          />

          <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Trigger (optional)</Type>
          <TextInput
            value={trigger} onChangeText={setTrigger} placeholder="e.g. stress, boredom, social, craving"
            placeholderTextColor={colors.textDim}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
          />

          <View style={styles.row2}>
            <View style={{ flex: 1, marginTop: 16 }}>
              <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Mood before</Type>
              <MoodDots value={moodBefore} onChange={setMoodBefore} size={16} />
            </View>
            <View style={{ flex: 1, marginTop: 16 }}>
              <Type token="eyebrow" dim uppercase style={{ marginBottom: 8 }}>Mood after</Type>
              <MoodDots value={moodAfter} onChange={setMoodAfter} size={16} />
            </View>
          </View>

          <Type token="eyebrow" dim uppercase style={{ marginTop: 16, marginBottom: 8 }}>Note (optional)</Type>
          <TextInput
            value={note} onChangeText={setNote} placeholder="Anything else worth remembering…"
            placeholderTextColor={colors.textDim}
            multiline textAlignVertical="top"
            style={[styles.input, styles.notesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
          />
        </ScrollView>

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
            style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}
          >
            <Type token="label" color={colors.onPrimary} style={{ textAlign: 'center' }}>{entry ? 'Save' : 'Log it'}</Type>
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
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  row2: { flexDirection: 'row', gap: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  notesInput: { minHeight: 70 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, justifyContent: 'center' },
  deleteBtn: { borderWidth: 1, borderColor: 'transparent' },
});
