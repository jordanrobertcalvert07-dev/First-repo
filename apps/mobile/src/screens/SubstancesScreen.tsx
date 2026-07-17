import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { MoodDots } from '../ui/MoodDots';
import { SubstanceUseComposer } from '../components/SubstanceUseComposer';
import { formatRelativeTime } from '../util/relativeTime';
import {
  SUBSTANCES, SUBSTANCE_LABEL, usesFor,
  type Substance, type SubstanceUseEntry, type NewSubstanceUse,
} from '../storage/substances';

function SubstanceTile({ substance, lastUsedAt, count, onPress }: {
  substance: Substance; lastUsedAt: number | null; count: number; onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width: '100%' }}>
      <Card style={{ gap: 4 }}>
        <Type token="body">{SUBSTANCE_LABEL[substance]}</Type>
        <Type token="mono" dim>
          {lastUsedAt ? `last logged ${formatRelativeTime(lastUsedAt)}` : 'No entries yet'}
          {count > 0 ? ` · ${count} total` : ''}
        </Type>
      </Card>
    </Pressable>
  );
}

function UseEntryCard({ entry, onPress }: { entry: SubstanceUseEntry; onPress: () => void }) {
  const { colors } = useTheme();
  const details = [entry.amount, entry.method, entry.context].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onPress}>
      <Card style={{ gap: 6, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Type token="body" style={{ flex: 1 }}>{details || 'Logged'}</Type>
          <Type token="mono" dim>{formatRelativeTime(entry.occurredAt)}</Type>
        </View>
        {entry.trigger ? <Type token="caption" dim>Trigger: {entry.trigger}</Type> : null}
        {(entry.moodBefore != null || entry.moodAfter != null) && (
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {entry.moodBefore != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Type token="caption" dim>Before</Type>
                <MoodDots value={entry.moodBefore} size={6} />
              </View>
            )}
            {entry.moodAfter != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Type token="caption" dim>After</Type>
                <MoodDots value={entry.moodAfter} size={6} />
              </View>
            )}
          </View>
        )}
        {entry.note ? <Type token="caption" dim numberOfLines={2}>{entry.note}</Type> : null}
      </Card>
    </Pressable>
  );
}

function SubstanceDetail({ substance, onBack }: { substance: Substance; onBack: () => void }) {
  const { colors, radius } = useTheme();
  const { substanceUses, addSubstanceUse, editSubstanceUse, deleteSubstanceUse } = useAppState();
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<SubstanceUseEntry | null>(null);

  const uses = useMemo(() => usesFor(substanceUses, substance), [substanceUses, substance]);

  const openNew = () => { setEditing(null); setComposerOpen(true); };
  const openEdit = (u: SubstanceUseEntry) => { setEditing(u); setComposerOpen(true); };
  const close = () => { setComposerOpen(false); setEditing(null); };
  const save = async (input: NewSubstanceUse) => {
    if (editing) await editSubstanceUse(editing, input);
    else await addSubstanceUse(input);
    close();
  };
  const remove = async () => {
    if (editing) await deleteSubstanceUse(editing.id);
    close();
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
        <Pressable onPress={onBack} hitSlop={8} accessibilityLabel="Back to substances">
          <Icon name="close" size={18} color={colors.textDim} />
        </Pressable>
        <Type token="h1" style={{ flex: 1 }}>{SUBSTANCE_LABEL[substance]}</Type>
        <Pressable onPress={openNew} style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
          <Icon name="plus" size={16} color={colors.onPrimary} />
          <Type token="label" color={colors.onPrimary}>Log now</Type>
        </Pressable>
      </View>

      {uses.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
          <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="substance" size={22} color={colors.textDim} />
          </View>
          <Type token="h3">No entries yet</Type>
          <Type token="body" dim style={{ textAlign: 'center', maxWidth: 340 }}>
            Neutral, factual logging — amount, method, context, mood. Nothing here is judged.
          </Type>
        </Card>
      ) : (
        <View>{uses.map((u) => <UseEntryCard key={u.id} entry={u} onPress={() => openEdit(u)} />)}</View>
      )}

      {composerOpen && (
        <SubstanceUseComposer
          substance={substance}
          entry={editing ?? undefined}
          onCancel={close}
          onSave={save}
          onDelete={editing ? remove : undefined}
        />
      )}
    </View>
  );
}

export function SubstancesScreen() {
  const { colors } = useTheme();
  const { substanceUses } = useAppState();
  const [selected, setSelected] = useState<Substance | null>(null);

  const stats = useMemo(() => {
    const map = new Map<Substance, { lastUsedAt: number | null; count: number }>();
    for (const s of SUBSTANCES) {
      const uses = usesFor(substanceUses, s);
      map.set(s, { lastUsedAt: uses[0]?.occurredAt ?? null, count: uses.length });
    }
    return map;
  }, [substanceUses]);

  if (selected) {
    return <SubstanceDetail substance={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View style={{ gap: 16 }}>
      <View style={{ paddingHorizontal: 4 }}>
        <Type token="h1">Substances</Type>
        <Type token="body" dim style={{ marginTop: 4 }}>
          Each one tracked on its own — neutral, factual, just for you.
        </Type>
      </View>
      <View style={{ gap: 12 }}>
        {SUBSTANCES.map((s) => {
          const stat = stats.get(s)!;
          return (
            <SubstanceTile
              key={s}
              substance={s}
              lastUsedAt={stat.lastUsedAt}
              count={stat.count}
              onPress={() => setSelected(s)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
});
