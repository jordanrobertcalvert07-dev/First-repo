import React, { useMemo, useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { MoodDots } from '../ui/MoodDots';
import { JournalComposer } from '../components/JournalComposer';
import { formatRelativeTime } from '../util/relativeTime';
import {
  JOURNAL_KINDS, JOURNAL_KIND_LABEL, JOURNAL_KIND_ICON, dayLabel,
  type JournalEntry, type JournalKind, type NewJournalEntry,
} from '../storage/journals';

type Filter = 'all' | JournalKind;

function EntryCard({ entry, onPress }: { entry: JournalEntry; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress}>
      <Card style={{ gap: 8, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.kindDot, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name={JOURNAL_KIND_ICON[entry.kind]} size={14} color={colors.primary} />
          </View>
          <Type token="label">{JOURNAL_KIND_LABEL[entry.kind]}</Type>
          <Type token="mono" dim style={{ marginLeft: 'auto' }}>{formatRelativeTime(entry.createdAt)}</Type>
        </View>
        <Type token="body" numberOfLines={4}>{entry.body}</Type>
        {entry.mood != null && <MoodDots value={entry.mood} />}
      </Card>
    </Pressable>
  );
}

export function JournalsScreen({ wide }: { wide: boolean }) {
  const { colors, radius } = useTheme();
  const { journalEntries, addJournalEntry, editJournalEntry, deleteJournalEntry } = useAppState();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return journalEntries.filter((e) => {
      if (filter !== 'all' && e.kind !== filter) return false;
      if (q && !e.body.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [journalEntries, filter, query]);

  const groups = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const e of filtered) {
      const label = dayLabel(e.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const openNew = () => { setEditing(null); setComposerOpen(true); };
  const openEdit = (e: JournalEntry) => { setEditing(e); setComposerOpen(true); };
  const closeComposer = () => { setComposerOpen(false); setEditing(null); };

  const save = async (input: NewJournalEntry) => {
    if (editing) await editJournalEntry(editing, input);
    else await addJournalEntry(input);
    closeComposer();
  };
  const remove = async () => {
    if (editing) await deleteJournalEntry(editing.id);
    closeComposer();
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Type token="h1">Journals</Type>
        <Type token="body" dim style={{ marginTop: 4 }}>
          {journalEntries.length === 0
            ? 'Nothing written yet'
            : `${journalEntries.length} entr${journalEntries.length === 1 ? 'y' : 'ies'} across daily, sleep, cannabis, and recovery`}
        </Type>
      </View>
      <Pressable onPress={openNew} style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
        <Icon name="plus" size={16} color={colors.onPrimary} />
        <Type token="label" color={colors.onPrimary}>New entry</Type>
      </Pressable>
    </View>
  );

  const filters = (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingHorizontal: 4 }}>
      {(['all', ...JOURNAL_KINDS] as Filter[]).map((f) => {
        const on = f === filter;
        const label = f === 'all' ? 'All' : JOURNAL_KIND_LABEL[f];
        return (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
          >
            <Type token="label" color={on ? colors.onPrimary : colors.text}>{label}</Type>
          </Pressable>
        );
      })}
    </View>
  );

  const search = (
    <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
      <Icon name="search" size={16} color={colors.textDim} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search your journals…"
        placeholderTextColor={colors.textDim}
        style={{ flex: 1, color: colors.text, fontSize: 14, paddingVertical: 4 }}
      />
    </View>
  );

  const body = groups.length === 0 ? (
    <Card style={{ alignItems: 'center', paddingVertical: 44, gap: 8 }}>
      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="journals" size={22} color={colors.textDim} />
      </View>
      <Type token="h3">{journalEntries.length === 0 ? 'Nothing written yet' : 'No matches'}</Type>
      <Type token="body" dim style={{ textAlign: 'center', maxWidth: 340 }}>
        {journalEntries.length === 0
          ? 'Daily reflections, sleep notes, cannabis check-ins, recovery journaling — write however it comes out.'
          : 'Try a different search or filter.'}
      </Type>
    </Card>
  ) : (
    <View>
      {groups.map(([label, entries]) => (
        <View key={label} style={{ marginBottom: 8 }}>
          <Type token="eyebrow" dim uppercase style={{ marginBottom: 8, marginLeft: 4 }}>{label}</Type>
          {entries.map((e) => <EntryCard key={e.id} entry={e} onPress={() => openEdit(e)} />)}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[{ gap: 16 }, wide && { maxWidth: 720 }]}>
      {header}
      {filters}
      {search}
      {body}
      {composerOpen && (
        <JournalComposer
          entry={editing ?? undefined}
          defaultKind={filter === 'all' ? 'daily' : filter}
          onCancel={closeComposer}
          onSave={save}
          onDelete={editing ? remove : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 4 },
  kindDot: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
