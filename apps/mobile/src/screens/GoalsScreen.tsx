import React, { useMemo, useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { GoalComposer } from '../components/GoalComposer';
import { formatRelativeTime } from '../util/relativeTime';
import { milestoneProgress, type Goal, type Milestone, type NewGoal, type GoalStatus } from '../storage/goals';
import type { RoutineAction } from '../storage/routines';

type Tab = 'active' | 'achieved' | 'graveyard';

function MilestoneRow({ milestone, editable, onToggle, onRemove }: {
  milestone: Milestone; editable: boolean; onToggle: () => void; onRemove: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.milestoneRow}>
      <Pressable
        onPress={onToggle}
        disabled={!editable}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: milestone.done }}
        accessibilityLabel={milestone.title}
        style={[styles.milestoneCheck, { borderColor: colors.primary, backgroundColor: milestone.done ? colors.primary : 'transparent' }]}
      >
        {milestone.done && <Icon name="check" size={11} color={colors.onPrimary} />}
      </Pressable>
      <Type token="body" style={[{ flex: 1 }, milestone.done ? { textDecorationLine: 'line-through', opacity: 0.6 } : null]}>
        {milestone.title}
      </Type>
      {editable && (
        <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={`Remove milestone: ${milestone.title}`}>
          <Icon name="close" size={14} color={colors.textDim} />
        </Pressable>
      )}
    </View>
  );
}

function GoalCard({ goal, routineActions, onEdit, onAchieve, onGraveyard, onReactivate, onAddMilestone, onToggleMilestone, onRemoveMilestone }: {
  goal: Goal;
  routineActions: RoutineAction[];
  onEdit: () => void;
  onAchieve: () => void;
  onGraveyard: () => void;
  onReactivate: () => void;
  onAddMilestone: (title: string) => void;
  onToggleMilestone: (id: string) => void;
  onRemoveMilestone: (id: string) => void;
}) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');
  const { done, total } = milestoneProgress(goal);
  const pct = total ? done / total : 0;
  const linkedTitles = goal.linkedActionIds
    .map((id) => routineActions.find((a) => a.id === id)?.title)
    .filter((t): t is string => Boolean(t));
  const editable = goal.status === 'active';

  const addNow = () => {
    const t = draft.trim();
    if (!t) return;
    onAddMilestone(t);
    setDraft('');
  };

  const dateLabel = goal.status === 'active'
    ? `started ${formatRelativeTime(goal.createdAt)}`
    : goal.status === 'achieved'
      ? `achieved ${formatRelativeTime(goal.resolvedAt ?? goal.createdAt)}`
      : `set aside ${formatRelativeTime(goal.resolvedAt ?? goal.createdAt)}`;

  return (
    <Card style={{ gap: 12, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Type token="h3">{goal.title}</Type>
            <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
              <Type token="caption" dim>{goal.timeframe === 'short' ? 'Short-term' : 'Long-term'}</Type>
            </View>
          </View>
          <Type token="mono" dim style={{ marginTop: 4 }}>{dateLabel}</Type>
          {goal.notes ? <Type token="caption" dim style={{ marginTop: 6 }} numberOfLines={2}>{goal.notes}</Type> : null}
          {linkedTitles.length > 0 && (
            <Type token="mono" dim style={{ marginTop: 6 }}>Linked: {linkedTitles.join(', ')}</Type>
          )}
        </View>
        <Pressable onPress={onEdit} hitSlop={8} accessibilityLabel={`Edit ${goal.title}`}>
          <Icon name="pen" size={16} color={colors.textDim} />
        </Pressable>
      </View>

      {total > 0 && (
        <View>
          <View style={[styles.barTrack, { backgroundColor: colors.surfaceAlt }]}>
            <View style={[styles.barFill, { backgroundColor: colors.primary, width: `${pct * 100}%` }]} />
          </View>
          <Type token="mono" dim style={{ marginTop: 4 }}>{done}/{total} milestones</Type>
        </View>
      )}

      {goal.milestones.length > 0 && (
        <View>
          {goal.milestones.map((m) => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              editable={editable}
              onToggle={() => onToggleMilestone(m.id)}
              onRemove={() => onRemoveMilestone(m.id)}
            />
          ))}
        </View>
      )}

      {editable && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={addNow}
            placeholder="Add a milestone…"
            placeholderTextColor={colors.textDim}
            returnKeyType="done"
            blurOnSubmit={false}
            style={[styles.milestoneInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
          />
          <Pressable
            onPress={addNow}
            accessibilityLabel={`Add milestone to ${goal.title}`}
            style={[styles.miniBtn, { backgroundColor: colors.primary, opacity: draft.trim() ? 1 : 0.5 }]}
          >
            <Icon name="plus" size={14} color={colors.onPrimary} />
          </Pressable>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {goal.status === 'active' ? (
          <>
            <Pressable onPress={onAchieve} style={[styles.footBtn, { borderColor: colors.primary }]}>
              <Type token="label" color={colors.primary}>Mark achieved</Type>
            </Pressable>
            <Pressable onPress={onGraveyard} style={[styles.footBtn, { borderColor: colors.border }]}>
              <Type token="label" color={colors.textDim}>Set aside</Type>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={onReactivate} style={[styles.footBtn, styles.reactivateBtn, { borderColor: colors.primary }]}>
            <Icon name="restore" size={14} color={colors.primary} />
            <Type token="label" color={colors.primary}>Reactivate</Type>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

export function GoalsScreen({ wide }: { wide: boolean }) {
  const { colors, radius } = useTheme();
  const {
    goals, routineActions, addGoal, editGoal, changeGoalStatus, deleteGoal,
    addGoalMilestone, toggleGoalMilestone, removeGoalMilestone,
  } = useAppState();
  const [tab, setTab] = useState<Tab>('active');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const active = useMemo(() => goals.filter((g) => g.status === 'active'), [goals]);
  const achieved = useMemo(() => goals.filter((g) => g.status === 'achieved'), [goals]);
  const graveyard = useMemo(() => goals.filter((g) => g.status === 'abandoned'), [goals]);
  const shown = tab === 'active' ? active : tab === 'achieved' ? achieved : graveyard;

  const openNew = () => { setEditing(null); setComposerOpen(true); };
  const openEdit = (g: Goal) => { setEditing(g); setComposerOpen(true); };
  const closeComposer = () => { setComposerOpen(false); setEditing(null); };

  const save = async (input: NewGoal) => {
    if (editing) await editGoal(editing, input);
    else await addGoal(input);
    closeComposer();
  };
  const remove = async () => {
    if (editing) await deleteGoal(editing.id);
    closeComposer();
  };
  const setStatus = (g: Goal, status: GoalStatus) => changeGoalStatus(g, status);

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Type token="h1">Goals</Type>
        <Type token="body" dim style={{ marginTop: 4 }}>
          {active.length === 0 ? 'Nothing active yet' : `${active.length} active goal${active.length === 1 ? '' : 's'}`}
        </Type>
      </View>
      <Pressable onPress={openNew} style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
        <Icon name="plus" size={16} color={colors.onPrimary} />
        <Type token="label" color={colors.onPrimary}>Add goal</Type>
      </Pressable>
    </View>
  );

  const tabs = (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
      {([
        ['active', `Active (${active.length})`],
        ['achieved', `Achieved (${achieved.length})`],
        ['graveyard', `Graveyard (${graveyard.length})`],
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

  const emptyCopy: Record<Tab, { title: string; body: string }> = {
    active: { title: 'Nothing active yet', body: 'Add a short-term or long-term goal, break it into milestones, and check them off as you go.' },
    achieved: { title: 'Nothing achieved yet', body: 'Goals you mark achieved land here.' },
    graveyard: { title: 'Nothing set aside', body: 'Goals you let go of land here — no judgment, just a record. You can always reactivate one.' },
  };

  const body = shown.length === 0 ? (
    <Card style={{ alignItems: 'center', paddingVertical: 44, gap: 8 }}>
      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="goals" size={22} color={colors.textDim} />
      </View>
      <Type token="h3">{emptyCopy[tab].title}</Type>
      <Type token="body" dim style={{ textAlign: 'center', maxWidth: 340 }}>{emptyCopy[tab].body}</Type>
    </Card>
  ) : (
    <View>
      {shown.map((g) => (
        <GoalCard
          key={g.id}
          goal={g}
          routineActions={routineActions}
          onEdit={() => openEdit(g)}
          onAchieve={() => setStatus(g, 'achieved')}
          onGraveyard={() => setStatus(g, 'abandoned')}
          onReactivate={() => setStatus(g, 'active')}
          onAddMilestone={(title) => addGoalMilestone(g, title)}
          onToggleMilestone={(id) => toggleGoalMilestone(g, id)}
          onRemoveMilestone={(id) => removeGoalMilestone(g, id)}
        />
      ))}
    </View>
  );

  return (
    <View style={[{ gap: 16 }, wide && { maxWidth: 720 }]}>
      {header}
      {tabs}
      {body}
      {composerOpen && (
        <GoalComposer
          goal={editing ?? undefined}
          routineActions={routineActions}
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
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  milestoneCheck: { width: 20, height: 20, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  milestoneInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  miniBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  footBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  reactivateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
