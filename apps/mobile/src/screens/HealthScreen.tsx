import React, { useMemo, useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { VitalsComposer } from '../components/VitalsComposer';
import { MedicationComposer } from '../components/MedicationComposer';
import { formatRelativeTime } from '../util/relativeTime';
import { requestBiometricUnlock, getBiometricCheck, type BiometricResult } from '../secure/biometric';
import { dosesFor, type Medication, type NewMedication } from '../storage/medical';
import type { VitalEntry, NewVitalEntry } from '../storage/vitals';

type Tab = 'biometrics' | 'medical';

function VitalCard({ entry, onPress }: { entry: VitalEntry; onPress: () => void }) {
  const { colors } = useTheme();
  const parts: string[] = [];
  if (entry.weightLb != null) parts.push(`${entry.weightLb} lb`);
  if (entry.restingHr != null) parts.push(`${entry.restingHr} bpm`);
  if (entry.systolic != null && entry.diastolic != null) parts.push(`${entry.systolic}/${entry.diastolic}`);
  return (
    <Pressable onPress={onPress}>
      <Card style={{ gap: 6, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Type token="body" style={{ flex: 1 }}>{parts.length ? parts.join(' · ') : 'Note only'}</Type>
          <Type token="mono" dim>{formatRelativeTime(entry.createdAt)}</Type>
        </View>
        {entry.note ? <Type token="caption" dim numberOfLines={2}>{entry.note}</Type> : null}
      </Card>
    </Pressable>
  );
}

function MedicationRow({ medication, lastDoseAt, onLogDose, onEdit }: {
  medication: Medication; lastDoseAt: number | null; onLogDose: () => void; onEdit: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Card style={{ gap: 8, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Type token="body">{medication.name}</Type>
          <Type token="mono" dim style={{ marginTop: 2 }}>
            {medication.dosage || 'No dosage set'} · {lastDoseAt ? `last taken ${formatRelativeTime(lastDoseAt)}` : 'not yet logged'}
          </Type>
          {medication.notes ? <Type token="caption" dim style={{ marginTop: 4 }} numberOfLines={2}>{medication.notes}</Type> : null}
        </View>
        <Pressable onPress={onEdit} hitSlop={8} accessibilityLabel={`Edit ${medication.name}`}>
          <Icon name="pen" size={16} color={colors.textDim} />
        </Pressable>
      </View>
      <Pressable
        onPress={onLogDose}
        style={[styles.doseBtn, { borderColor: colors.primary }]}
        accessibilityLabel={`Log a dose of ${medication.name}`}
      >
        <Icon name="check" size={14} color={colors.primary} />
        <Type token="label" color={colors.primary}>Log dose taken now</Type>
      </Pressable>
    </Card>
  );
}

function MedicalGate({ onUnlocked }: { onUnlocked: () => void }) {
  const { colors, radius } = useTheme();
  const [status, setStatus] = useState<'idle' | 'checking' | 'unavailable' | 'failed'>('idle');

  const tryUnlock = async () => {
    setStatus('checking');
    const result: BiometricResult = await requestBiometricUnlock('Verify to view Medical');
    if (result === 'success') { onUnlocked(); return; }
    if (result === 'unavailable') { setStatus('unavailable'); return; }
    setStatus('failed');
  };

  return (
    <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="lock" size={24} color={colors.primary} />
      </View>
      <Type token="h3">Medical is protected</Type>
      <Type token="body" dim style={{ textAlign: 'center', maxWidth: 340 }}>
        Beyond your vault, Medical asks for one more check before it opens. It re-locks every time you leave this section.
      </Type>
      <Pressable onPress={tryUnlock} style={[styles.unlockBtn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
        <Icon name="lock" size={15} color={colors.onPrimary} />
        <Type token="label" color={colors.onPrimary}>Unlock with biometrics</Type>
      </Pressable>
      {status === 'failed' && (
        <Type token="caption" color={colors.primary}>That didn't verify — try again.</Type>
      )}
      {status === 'unavailable' && (
        <View style={{ alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Type token="caption" dim style={{ textAlign: 'center', maxWidth: 320 }}>
            No biometric lock is set up on this device, so Medical can't add its second check right now — it's still
            behind your vault passphrase.
          </Type>
          <Pressable onPress={onUnlocked} style={[styles.continueBtn, { borderColor: colors.border }]}>
            <Type token="label">Continue anyway</Type>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

export function HealthScreen() {
  const { colors, radius } = useTheme();
  const {
    vitals, addVital, editVital, deleteVital,
    medications, medicationDoses, medicalNotes,
    addMedication, editMedication, removeMedication, logMedicationDose, saveMedicalNotes,
  } = useAppState();

  const [tab, setTab] = useState<Tab>('biometrics');
  const [medicalUnlocked, setMedicalUnlocked] = useState(false);

  const [vitalsComposerOpen, setVitalsComposerOpen] = useState(false);
  const [editingVital, setEditingVital] = useState<VitalEntry | null>(null);
  const [medComposerOpen, setMedComposerOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [notesDraft, setNotesDraft] = useState(medicalNotes);
  const [notesDirty, setNotesDirty] = useState(false);

  const lastDoseByMed = useMemo(() => {
    const map = new Map<string, number>();
    for (const med of medications) {
      const doses = dosesFor(medicationDoses, med.id);
      if (doses.length) map.set(med.id, doses[0].takenAt);
    }
    return map;
  }, [medications, medicationDoses]);

  const openNewVital = () => { setEditingVital(null); setVitalsComposerOpen(true); };
  const openEditVital = (v: VitalEntry) => { setEditingVital(v); setVitalsComposerOpen(true); };
  const closeVitalsComposer = () => { setVitalsComposerOpen(false); setEditingVital(null); };
  const saveVital = async (input: NewVitalEntry) => {
    if (editingVital) await editVital(editingVital, input);
    else await addVital(input);
    closeVitalsComposer();
  };
  const removeVitalNow = async () => {
    if (editingVital) await deleteVital(editingVital.id);
    closeVitalsComposer();
  };

  const openNewMed = () => { setEditingMed(null); setMedComposerOpen(true); };
  const openEditMed = (m: Medication) => { setEditingMed(m); setMedComposerOpen(true); };
  const closeMedComposer = () => { setMedComposerOpen(false); setEditingMed(null); };
  const saveMed = async (input: NewMedication) => {
    if (editingMed) await editMedication(editingMed, input);
    else await addMedication(input);
    closeMedComposer();
  };
  const removeMedNow = async () => {
    if (editingMed) await removeMedication(editingMed);
    closeMedComposer();
  };

  const commitNotes = async () => {
    await saveMedicalNotes(notesDraft);
    setNotesDirty(false);
  };

  const tabs = (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
      {([['biometrics', 'Biometrics'], ['medical', 'Medical']] as [Tab, string][]).map(([t, label]) => {
        const on = t === tab;
        return (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.primary : colors.surfaceAlt }]}
          >
            {t === 'medical' && <Icon name="lock" size={12} color={on ? colors.onPrimary : colors.textDim} />}
            <Type token="label" color={on ? colors.onPrimary : colors.text}>{label}</Type>
          </Pressable>
        );
      })}
    </View>
  );

  const biometricsBody = (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Type token="body" dim>
            {vitals.length === 0 ? 'Nothing logged yet' : `${vitals.length} entr${vitals.length === 1 ? 'y' : 'ies'}`}
          </Type>
        </View>
        <Pressable onPress={openNewVital} style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
          <Icon name="plus" size={16} color={colors.onPrimary} />
          <Type token="label" color={colors.onPrimary}>Add entry</Type>
        </Pressable>
      </View>
      {vitals.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
          <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="health" size={22} color={colors.textDim} />
          </View>
          <Type token="h3">Nothing logged yet</Type>
          <Type token="body" dim style={{ textAlign: 'center', maxWidth: 340 }}>
            Weight, resting heart rate, blood pressure — whatever you want to keep an eye on.
          </Type>
        </Card>
      ) : (
        <View>{vitals.map((v) => <VitalCard key={v.id} entry={v} onPress={() => openEditVital(v)} />)}</View>
      )}
    </View>
  );

  const medicalBody = !medicalUnlocked ? (
    <MedicalGate onUnlocked={() => setMedicalUnlocked(true)} />
  ) : (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Type token="body" dim>
            {medications.length === 0 ? 'No medications added' : `${medications.length} medication${medications.length === 1 ? '' : 's'}`}
          </Type>
        </View>
        <Pressable onPress={() => setMedicalUnlocked(false)} hitSlop={8} style={styles.lockNowBtn}>
          <Icon name="lock" size={13} color={colors.textDim} />
          <Type token="caption" dim>Lock now</Type>
        </Pressable>
        <Pressable onPress={openNewMed} style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
          <Icon name="plus" size={16} color={colors.onPrimary} />
          <Type token="label" color={colors.onPrimary}>Add medication</Type>
        </Pressable>
      </View>

      {medications.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
          <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="pill" size={22} color={colors.textDim} />
          </View>
          <Type token="h3">No medications added</Type>
          <Type token="body" dim style={{ textAlign: 'center', maxWidth: 340 }}>
            Add what you take and log each dose as you go — no cadence to keep up with, just a record.
          </Type>
        </Card>
      ) : (
        <View>
          {medications.map((m) => (
            <MedicationRow
              key={m.id}
              medication={m}
              lastDoseAt={lastDoseByMed.get(m.id) ?? null}
              onLogDose={() => logMedicationDose(m.id)}
              onEdit={() => openEditMed(m)}
            />
          ))}
        </View>
      )}

      <Card style={{ gap: 10 }}>
        <Type token="eyebrow" dim uppercase>Medical notes</Type>
        <TextInput
          value={notesDraft}
          onChangeText={(t) => { setNotesDraft(t); setNotesDirty(t !== medicalNotes); }}
          placeholder="Conditions, allergies, providers — whatever's worth having on hand…"
          placeholderTextColor={colors.textDim}
          multiline
          textAlignVertical="top"
          style={[styles.notesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
        />
        {notesDirty && (
          <Pressable onPress={commitNotes} style={[styles.saveNotesBtn, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
            <Type token="label" color={colors.onPrimary}>Save notes</Type>
          </Pressable>
        )}
      </Card>
    </View>
  );

  return (
    <View style={{ gap: 16 }}>
      <View style={{ paddingHorizontal: 4 }}>
        <Type token="h1">Health</Type>
      </View>
      {tabs}
      {tab === 'biometrics' ? biometricsBody : medicalBody}
      {vitalsComposerOpen && (
        <VitalsComposer
          entry={editingVital ?? undefined}
          onCancel={closeVitalsComposer}
          onSave={saveVital}
          onDelete={editingVital ? removeVitalNow : undefined}
        />
      )}
      {medComposerOpen && (
        <MedicationComposer
          medication={editingMed ?? undefined}
          onCancel={closeMedComposer}
          onSave={saveMed}
          onDelete={editingMed ? removeMedNow : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  unlockBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12, marginTop: 6 },
  continueBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  lockNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 8 },
  doseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.3, borderRadius: 999, paddingVertical: 10 },
  notesInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 90 },
  saveNotesBtn: { alignItems: 'center', paddingVertical: 11, alignSelf: 'flex-start', paddingHorizontal: 18 },
});
