import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeuristicCaptureEngine, type CaptureProposal } from '@lifelike/core';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { CaptureBar } from '../components/CaptureBar';
import { ReviewSheet } from '../components/ReviewSheet';
import { TodayScreen } from '../screens/TodayScreen';
import { PlaceholderScreen, LockedScreen } from '../screens/Simple';
import { SECTIONS, PHONE_TABS, type Section } from './sections';

interface Pending {
  utterance: string;
  proposals: CaptureProposal[];
}

export function AppShell() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const { colors } = useTheme();
  const { commit } = useAppState();
  const insets = useSafeAreaInsets();

  const [section, setSection] = useState('today');
  const [pending, setPending] = useState<Pending | null>(null);
  const engine = useMemo(() => new HeuristicCaptureEngine(), []);

  const capture = async (text: string) => {
    const result = await engine.propose(text, { now: new Date() });
    if (result.proposals.length) setPending({ utterance: text, proposals: result.proposals });
  };
  const onSave = (kept: CaptureProposal[]) => {
    if (kept.length) commit(kept);
    setPending(null);
  };

  const active = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0]!;
  const screen =
    active.key === 'today' ? (
      <TodayScreen wide={wide} onExample={capture} />
    ) : active.phoneOnly && (wide || Platform.OS === 'web') ? (
      <LockedScreen title={active.label} />
    ) : (
      <PlaceholderScreen title={active.label} />
    );

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[colors.skyTop, colors.skyBottom]} style={StyleSheet.absoluteFill} />

      {wide ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Sidebar current={section} onSelect={setSection} />
          <View style={{ flex: 1 }}>
            <View style={[styles.topbar, { borderBottomColor: colors.border, paddingTop: insets.top + 14 }]}>
              <View style={{ flex: 1, maxWidth: 720 }}>
                <CaptureBar variant="web" onSubmit={capture} />
              </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60, maxWidth: 1180, width: '100%', alignSelf: 'center' }}>
              {screen}
            </ScrollView>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 14, paddingBottom: 8 }}>
            <CaptureBar variant="phone" onSubmit={capture} />
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>{screen}</ScrollView>
          <TabBar current={section} onSelect={setSection} bottomInset={insets.bottom} />
        </View>
      )}

      {pending && (
        <ReviewSheet
          utterance={pending.utterance}
          proposals={pending.proposals}
          onCancel={() => setPending(null)}
          onSave={onSave}
        />
      )}
    </View>
  );
}

function Sidebar({ current, onSelect }: { current: string; onSelect: (k: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <View style={styles.brand}>
        <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
        <Type token="h3">LifeLike</Type>
      </View>
      {SECTIONS.map((s) => {
        const on = s.key === current;
        return (
          <Pressable
            key={s.key}
            onPress={() => onSelect(s.key)}
            style={[styles.navItem, on && { backgroundColor: colors.surfaceAlt }]}
          >
            <Icon name={s.key} size={19} color={on ? colors.primary : colors.textDim} />
            <Type token="body" color={on ? colors.primary : colors.textDim} style={{ flex: 1 }}>{s.label}</Type>
            {s.phoneOnly && <Icon name="lock" size={14} color={colors.textDim} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function TabBar({ current, onSelect, bottomInset }: { current: string; onSelect: (k: string) => void; bottomInset: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tabbar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(bottomInset, 8) + 8 }]}>
      {PHONE_TABS.map((key) => {
        const sec: Section | undefined = SECTIONS.find((s) => s.key === key);
        const label = key === 'more' ? 'More' : sec?.label ?? key;
        const on = key === current;
        return (
          <Pressable key={key} onPress={() => onSelect(key === 'more' ? 'goals' : key)} style={styles.tab}>
            <Icon name={key} size={22} color={on ? colors.primary : colors.textDim} />
            <Type token="caption" color={on ? colors.primary : colors.textDim}>{label}</Type>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { paddingHorizontal: 24, paddingBottom: 14, borderBottomWidth: 1, flexDirection: 'row' },
  sidebar: { width: 236, borderRightWidth: 1, paddingHorizontal: 14, paddingTop: 22, gap: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, paddingBottom: 18 },
  brandDot: { width: 26, height: 26, borderRadius: 13 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  tabbar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 9, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
});
