import React, { useMemo, useState } from 'react';
import { Modal, View, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import type { CaptureProposal } from '@lifelike/core';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';

interface EditableField {
  key: string;
  label: string;
  value: string;
  removed: boolean;
}
interface EditableProposal {
  section: string;
  icon: string;
  note?: string;
  fields: EditableField[];
  excluded: boolean;
}

interface Props {
  utterance: string;
  proposals: CaptureProposal[];
  onCancel: () => void;
  onSave: (kept: CaptureProposal[]) => void;
}

/** The editable diff. Every field can be changed or removed; whole cards dropped.
 * Save commits only what remains — never a silent write. */
export function ReviewSheet({ utterance, proposals, onCancel, onSave }: Props) {
  const { colors, radius } = useTheme();
  const [draft, setDraft] = useState<EditableProposal[]>(() =>
    proposals.map((p) => ({
      section: p.section,
      icon: p.icon,
      note: p.note,
      excluded: false,
      fields: p.fields.map((f) => ({ ...f, removed: false })),
    })),
  );

  const keptCount = useMemo(() => draft.filter((p) => !p.excluded).length, [draft]);

  const setField = (pi: number, fi: number, value: string) =>
    setDraft((d) => d.map((p, i) => (i !== pi ? p : { ...p, fields: p.fields.map((f, j) => (j === fi ? { ...f, value } : f)) })));
  const removeField = (pi: number, fi: number) =>
    setDraft((d) => d.map((p, i) => (i !== pi ? p : { ...p, fields: p.fields.map((f, j) => (j === fi ? { ...f, removed: true } : f)) })));
  const toggleCard = (pi: number) =>
    setDraft((d) => d.map((p, i) => (i === pi ? { ...p, excluded: !p.excluded } : p)));

  const save = () => {
    const kept: CaptureProposal[] = draft
      .filter((p) => !p.excluded)
      .map((p) => ({
        section: p.section,
        kind: proposals.find((x) => x.section === p.section)?.kind ?? 'idea',
        icon: p.icon,
        note: p.note,
        fields: p.fields.filter((f) => !f.removed).map(({ key, label, value }) => ({ key, label, value })),
      }));
    onSave(kept);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Type token="h2">Review before saving</Type>
            <Type token="caption" dim style={{ marginTop: 2 }}>
              LifeLike read this into {draft.length} section{draft.length === 1 ? '' : 's'}. Nothing is saved yet — edit,
              remove a field, or drop a card.
            </Type>
          </View>
          <Pressable onPress={onCancel} hitSlop={10} accessibilityLabel="Cancel">
            <Icon name="close" size={22} color={colors.textDim} />
          </Pressable>
        </View>

        <View style={[styles.utter, { backgroundColor: colors.surfaceAlt, borderColor: colors.accent }]}>
          <Type token="body" style={{ fontStyle: 'italic' }}>“{utterance}”</Type>
        </View>

        <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 8 }}>
          {draft.map((p, pi) => (
            <View
              key={pi}
              style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: p.excluded ? 0.4 : 1 }]}
            >
              <View style={styles.cardHead}>
                <View style={[styles.cardIco, { backgroundColor: colors.surface }]}>
                  <Icon name={p.icon} size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Type token="label">{p.section}</Type>
                  {p.note ? <Type token="caption" dim>{p.note}</Type> : null}
                </View>
                <Pressable onPress={() => toggleCard(pi)} hitSlop={8} accessibilityLabel={p.excluded ? 'Include' : 'Drop'}>
                  <Icon name={p.excluded ? 'plus' : 'close'} size={18} color={colors.textDim} />
                </Pressable>
              </View>

              {p.fields.map((f, fi) =>
                f.removed ? null : (
                  <View key={fi} style={styles.field}>
                    <Type token="eyebrow" dim uppercase style={{ width: 92 }}>{f.label}</Type>
                    <TextInput
                      value={f.value}
                      onChangeText={(v) => setField(pi, fi, v)}
                      placeholder="—"
                      placeholderTextColor={colors.textDim}
                      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                    />
                    <Pressable onPress={() => removeField(pi, fi)} hitSlop={8} accessibilityLabel="Remove field">
                      <Icon name="close" size={15} color={colors.textDim} />
                    </Pressable>
                  </View>
                ),
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.actions}>
          <Pressable
            onPress={onCancel}
            style={[styles.btn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 }]}
          >
            <Type token="label" style={{ textAlign: 'center' }}>Cancel</Type>
          </Pressable>
          <Pressable onPress={save} style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
            <Type token="label" color={colors.onPrimary} style={{ textAlign: 'center' }}>
              Save {keptCount} section{keptCount === 1 ? '' : 's'}
            </Type>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    alignSelf: 'center',
    width: '100%',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderWidth: 1,
    padding: 18,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  utter: { borderLeftWidth: 3, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIco: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  input: { flex: 1, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, justifyContent: 'center' },
});
