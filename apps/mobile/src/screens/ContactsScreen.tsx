import React, { useMemo, useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { ContactComposer } from '../components/ContactComposer';
import { formatRelativeTime } from '../util/relativeTime';
import {
  sortByUrgency, overdueBy, reachOutLabel,
  type Contact, type NewContact,
} from '../storage/contacts';

type Filter = 'all' | 'personal' | 'professional' | 'support';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ContactCard({ contact, onPress, onMarkContacted }: { contact: Contact; onPress: () => void; onMarkContacted: () => void }) {
  const { colors } = useTheme();
  const now = Date.now();
  const overdue = overdueBy(contact, now);
  const urgent = overdue != null && overdue > 0;

  return (
    <Pressable onPress={onPress}>
      <Card style={{ gap: 8, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}>
            <Type token="label">{initials(contact.name)}</Type>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Type token="body">{contact.name}</Type>
              {contact.supportNetwork && <Icon name="heart" size={13} color={colors.primary} />}
            </View>
            <Type token="mono" dim style={urgent ? { color: colors.primary } : undefined}>
              {contact.category === 'personal' ? 'Personal' : 'Professional'} · {reachOutLabel(contact, now)}
              {contact.lastContactedAt ? ` · last ${formatRelativeTime(contact.lastContactedAt)}` : ''}
            </Type>
          </View>
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onMarkContacted(); }}
            hitSlop={8}
            accessibilityLabel={`Mark ${contact.name} as contacted today`}
            style={[styles.markBtn, { borderColor: colors.primary }]}
          >
            <Icon name="message" size={15} color={colors.primary} />
          </Pressable>
        </View>
        {contact.notes ? <Type token="caption" dim numberOfLines={2}>{contact.notes}</Type> : null}
      </Card>
    </Pressable>
  );
}

export function ContactsScreen({ wide }: { wide: boolean }) {
  const { colors, radius } = useTheme();
  const { contacts, addContact, editContact, deleteContact, markContactedNow } = useAppState();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const now = Date.now();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filter === 'personal' && c.category !== 'personal') return false;
      if (filter === 'professional' && c.category !== 'professional') return false;
      if (filter === 'support' && !c.supportNetwork) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.notes.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [contacts, filter, query]);

  const sorted = useMemo(() => sortByUrgency(filtered, now), [filtered]);
  const overdue = sorted.filter((c) => (overdueBy(c, now) ?? -1) > 0);
  const overdueIds = new Set(overdue.map((c) => c.id));
  const rest = sorted.filter((c) => !overdueIds.has(c.id));

  const openNew = () => { setEditing(null); setComposerOpen(true); };
  const openEdit = (c: Contact) => { setEditing(c); setComposerOpen(true); };
  const closeComposer = () => { setComposerOpen(false); setEditing(null); };

  const save = async (input: NewContact) => {
    if (editing) await editContact(editing, input);
    else await addContact(input);
    closeComposer();
  };
  const remove = async () => {
    if (editing) await deleteContact(editing);
    closeComposer();
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Type token="h1">Contacts</Type>
        <Type token="body" dim style={{ marginTop: 4 }}>
          {contacts.length === 0
            ? 'Nobody added yet'
            : overdue.length > 0
              ? `${overdue.length} to reach out to`
              : `${contacts.length} contact${contacts.length === 1 ? '' : 's'}, all caught up`}
        </Type>
      </View>
      <Pressable onPress={openNew} style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
        <Icon name="plus" size={16} color={colors.onPrimary} />
        <Type token="label" color={colors.onPrimary}>Add contact</Type>
      </Pressable>
    </View>
  );

  const filters = (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingHorizontal: 4 }}>
      {([
        ['all', 'All'], ['personal', 'Personal'], ['professional', 'Professional'], ['support', 'Support network'],
      ] as [Filter, string][]).map(([f, label]) => {
        const on = f === filter;
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
        placeholder="Search your contacts…"
        placeholderTextColor={colors.textDim}
        style={{ flex: 1, color: colors.text, fontSize: 14, paddingVertical: 4 }}
      />
    </View>
  );

  const body = sorted.length === 0 ? (
    <Card style={{ alignItems: 'center', paddingVertical: 44, gap: 8 }}>
      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="contacts" size={22} color={colors.textDim} />
      </View>
      <Type token="h3">{contacts.length === 0 ? 'Nobody added yet' : 'No matches'}</Type>
      <Type token="body" dim style={{ textAlign: 'center', maxWidth: 340 }}>
        {contacts.length === 0
          ? 'Add the people you want to stay close to — personal or professional — and an optional reach-out cadence.'
          : 'Try a different search or filter.'}
      </Type>
    </Card>
  ) : (
    <View>
      {overdue.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <Type token="eyebrow" dim uppercase style={{ marginBottom: 8, marginLeft: 4 }}>Needs a reach-out</Type>
          {overdue.map((c) => (
            <ContactCard key={c.id} contact={c} onPress={() => openEdit(c)} onMarkContacted={() => markContactedNow(c.id)} />
          ))}
        </View>
      )}
      {rest.length > 0 && (
        <View>
          {overdue.length > 0 && <Type token="eyebrow" dim uppercase style={{ marginBottom: 8, marginLeft: 4 }}>Everyone else</Type>}
          {rest.map((c) => (
            <ContactCard key={c.id} contact={c} onPress={() => openEdit(c)} onMarkContacted={() => markContactedNow(c.id)} />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={[{ gap: 16 }, wide && { maxWidth: 720 }]}>
      {header}
      {filters}
      {search}
      {body}
      {composerOpen && (
        <ContactComposer
          contact={editing ?? undefined}
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
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  markBtn: { width: 30, height: 30, borderRadius: 10, borderWidth: 1.3, alignItems: 'center', justifyContent: 'center' },
});
