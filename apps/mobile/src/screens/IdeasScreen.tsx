import React, { useMemo, useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { formatRelativeTime } from '../util/relativeTime';
import type { Idea } from '../storage/ideas';

type Tab = 'inbox' | 'kept' | 'discarded';
interface RowAction { icon: string; label: string; onPress: () => void; tone?: 'primary' }

function IdeaRow({ idea, last, actions }: { idea: Idea; last: boolean; actions: RowAction[] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Type token="body">{idea.text}</Type>
        <Type token="mono" dim style={{ marginTop: 4 }}>{formatRelativeTime(idea.createdAt)}</Type>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            hitSlop={8}
            accessibilityLabel={a.label}
            style={[styles.actionBtn, { borderColor: a.tone === 'primary' ? colors.primary : colors.border }]}
          >
            <Icon name={a.icon} size={15} color={a.tone === 'primary' ? colors.primary : colors.textDim} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function IdeasScreen({ wide }: { wide: boolean }) {
  const { colors, radius, font } = useTheme();
  const { ideas, addIdea, setIdeaTriage, removeIdeaPermanently } = useAppState();
  const [tab, setTab] = useState<Tab>('inbox');
  const [draft, setDraft] = useState('');

  const inbox = useMemo(() => ideas.filter((i) => i.status === 'inbox'), [ideas]);
  const kept = useMemo(() => ideas.filter((i) => i.status === 'kept'), [ideas]);
  const discarded = useMemo(() => ideas.filter((i) => i.status === 'discarded'), [ideas]);
  const shown = tab === 'inbox' ? inbox : tab === 'kept' ? kept : discarded;

  const capture = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    addIdea(trimmed);
    setDraft('');
  };

  const header = (
    <View style={{ paddingHorizontal: 4 }}>
      <Type token="h1">Ideas</Type>
      <Type token="body" dim style={{ marginTop: 4 }}>
        {inbox.length === 0 ? 'Inbox is clear' : `${inbox.length} waiting for triage`}
      </Type>
    </View>
  );

  const quickCapture = (
    <View style={[styles.captureBar, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm }]}>
      <View style={[styles.spark, { backgroundColor: colors.primary }]} />
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={capture}
        placeholder="Drop an idea, worry-free — triage it later…"
        placeholderTextColor={colors.textDim}
        returnKeyType="send"
        blurOnSubmit={false}
        style={[styles.captureInput, { color: colors.text, fontFamily: font.families.bodyRegular }]}
      />
      <Pressable
        accessibilityLabel="Add idea"
        onPress={capture}
        style={[styles.captureSend, { backgroundColor: colors.primary, borderRadius: radius.xs, opacity: draft.trim() ? 1 : 0.5 }]}
      >
        <Icon name="plus" size={18} color={colors.onPrimary} />
      </Pressable>
    </View>
  );

  const tabs = (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
      {([
        ['inbox', `Inbox (${inbox.length})`],
        ['kept', `Kept (${kept.length})`],
        ['discarded', `Discarded (${discarded.length})`],
      ] as [Tab, string][]).map(([t, label]) => {
        const on = t === tab;
        return (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
          >
            <Type token="label" color={on ? colors.onPrimary : colors.text}>{label}</Type>
          </Pressable>
        );
      })}
    </View>
  );

  const actionsFor = (idea: Idea): RowAction[] => {
    if (idea.status === 'inbox') return [
      { icon: 'check', label: `Keep this idea`, tone: 'primary', onPress: () => setIdeaTriage(idea, 'kept') },
      { icon: 'close', label: `Discard this idea`, onPress: () => setIdeaTriage(idea, 'discarded') },
    ];
    if (idea.status === 'kept') return [
      { icon: 'restore', label: `Move back to inbox`, onPress: () => setIdeaTriage(idea, 'inbox') },
      { icon: 'close', label: `Discard this idea`, onPress: () => setIdeaTriage(idea, 'discarded') },
    ];
    return [
      { icon: 'restore', label: `Move back to inbox`, onPress: () => setIdeaTriage(idea, 'inbox') },
      { icon: 'close', label: `Delete for good`, onPress: () => removeIdeaPermanently(idea.id) },
    ];
  };

  const emptyCopy: Record<Tab, { title: string; body: string }> = {
    inbox: { title: 'Inbox is clear', body: 'Drop ideas above whenever they strike. Nothing here needs your attention right now.' },
    kept: { title: 'Nothing kept yet', body: 'Ideas you keep during triage land here.' },
    discarded: { title: 'Nothing discarded', body: 'Ideas you set aside land here — not judged, just parked. You can always bring one back.' },
  };

  const body = shown.length === 0 ? (
    <Card style={{ alignItems: 'center', paddingVertical: 44, gap: 8 }}>
      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="ideas" size={22} color={colors.textDim} />
      </View>
      <Type token="h3">{emptyCopy[tab].title}</Type>
      <Type token="body" dim style={{ textAlign: 'center', maxWidth: 340 }}>{emptyCopy[tab].body}</Type>
    </Card>
  ) : (
    <Card>
      {shown.map((idea, i) => (
        <IdeaRow key={idea.id} idea={idea} last={i === shown.length - 1} actions={actionsFor(idea)} />
      ))}
    </Card>
  );

  return (
    <View style={[{ gap: 16 }, wide && { maxWidth: 720 }]}>
      {header}
      {quickCapture}
      {tabs}
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  captureBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 8, paddingVertical: 8, borderWidth: 1 },
  spark: { width: 20, height: 20, borderRadius: 10 },
  captureInput: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 6 },
  captureSend: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13 },
  actionBtn: { width: 30, height: 30, borderRadius: 10, borderWidth: 1.3, alignItems: 'center', justifyContent: 'center' },
});
