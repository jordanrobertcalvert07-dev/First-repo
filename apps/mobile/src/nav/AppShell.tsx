import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeuristicCaptureEngine, type CaptureEngine, type CaptureProposal } from '@lifelike/core';
import { AnthropicCaptureEngine } from '../ai/anthropic';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { CaptureBar } from '../components/CaptureBar';
import { ReviewSheet } from '../components/ReviewSheet';
import { TodayScreen } from '../screens/TodayScreen';
import { SettingsScreen } from '../screens/Settings';
import { PlaceholderScreen, LockedScreen } from '../screens/Simple';
import { SECTIONS, PHONE_TABS, type Section } from './sections';

interface Pending { utterance: string; proposals: CaptureProposal[] }

const initialRoute = (): string => {
  if (Platform.OS === 'web') {
    try { if (globalThis.location?.search.includes('screen=settings')) return 'settings'; } catch { /* ignore */ }
  }
  return 'today';
};

export function AppShell() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const { colors } = useTheme();
  const { commit, settings } = useAppState();
  const insets = useSafeAreaInsets();

  const [route, setRoute] = useState<string>(initialRoute);
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const engine: CaptureEngine = useMemo(
    () => (settings.apiKey ? new AnthropicCaptureEngine(settings.apiKey) : new HeuristicCaptureEngine()),
    [settings.apiKey],
  );

  const flash = (msg: string) => { setNotice(msg); setTimeout(() => setNotice((n) => (n === msg ? null : n)), 4500); };

  const capture = async (text: string) => {
    setBusy(true);
    try {
      const result = await engine.propose(text, { now: new Date() });
      if (result.proposals.length) setPending({ utterance: text, proposals: result.proposals });
      else if (result.clarifyingQuestion) flash(result.clarifyingQuestion);
      else flash("Couldn't find anything to log in that — try adding a little detail.");
    } catch (err) {
      // Fall back to the offline parser if the AI call fails (bad key, no network…).
      const fallback = await new HeuristicCaptureEngine().propose(text, { now: new Date() });
      if (fallback.proposals.length) {
        setPending({ utterance: text, proposals: fallback.proposals });
        flash('AI unavailable — used the offline parser. Check your key in Settings.');
      } else {
        flash(`Capture failed: ${(err as Error).message.slice(0, 80)}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const onSave = (kept: CaptureProposal[]) => {
    if (kept.length) { commit(kept); flash(`Saved to ${kept.map((p) => p.section).join(', ')}`); }
    setPending(null);
  };

  const active = SECTIONS.find((s) => s.key === route);
  const screen =
    route === 'settings' ? <SettingsScreen /> :
    !active || active.key === 'today' ? <TodayScreen wide={wide} onExample={capture} /> :
    active.phoneOnly && (wide || Platform.OS === 'web') ? <LockedScreen title={active.label} /> :
    <PlaceholderScreen title={active.label} />;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[colors.skyTop, colors.skyBottom]} style={StyleSheet.absoluteFill} />

      {wide ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Sidebar route={route} onSelect={setRoute} />
          <View style={{ flex: 1 }}>
            <View style={[styles.topbar, { borderBottomColor: colors.border, paddingTop: insets.top + 14 }]}>
              <View style={{ flex: 1, maxWidth: 720 }}>
                <CaptureBar variant="web" onSubmit={capture} busy={busy} />
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
            <CaptureBar variant="phone" onSubmit={capture} busy={busy} />
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>{screen}</ScrollView>
          <TabBar route={route} onSelect={setRoute} bottomInset={insets.bottom} />
        </View>
      )}

      {notice && (
        <View pointerEvents="none" style={[styles.notice, { top: insets.top + (wide ? 76 : 78) }]}>
          <View style={[styles.noticeInner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Type token="caption" style={{ textAlign: 'center' }}>{notice}</Type>
          </View>
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

function Sidebar({ route, onSelect }: { route: string; onSelect: (k: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <View style={styles.brand}>
        <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
        <Type token="h3">LifeLike</Type>
      </View>
      {SECTIONS.map((s) => {
        const on = s.key === route;
        return (
          <Pressable key={s.key} onPress={() => onSelect(s.key)} style={[styles.navItem, on && { backgroundColor: colors.surfaceAlt }]}>
            <Icon name={s.key} size={19} color={on ? colors.primary : colors.textDim} />
            <Type token="body" color={on ? colors.primary : colors.textDim} style={{ flex: 1 }}>{s.label}</Type>
            {s.phoneOnly && <Icon name="lock" size={14} color={colors.textDim} />}
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => onSelect('settings')}
        style={[styles.navItem, { marginTop: 'auto' }, route === 'settings' && { backgroundColor: colors.surfaceAlt }]}
      >
        <Icon name="settings" size={19} color={route === 'settings' ? colors.primary : colors.textDim} />
        <Type token="body" color={route === 'settings' ? colors.primary : colors.textDim} style={{ flex: 1 }}>Settings</Type>
      </Pressable>
    </View>
  );
}

function TabBar({ route, onSelect, bottomInset }: { route: string; onSelect: (k: string) => void; bottomInset: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tabbar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(bottomInset, 8) + 8 }]}>
      {PHONE_TABS.map((key) => {
        const sec: Section | undefined = SECTIONS.find((s) => s.key === key);
        const label = key === 'more' ? 'More' : sec?.label ?? key;
        const target = key === 'more' ? 'settings' : key;
        const iconName = key === 'more' ? 'settings' : key;
        const on = target === route;
        return (
          <Pressable key={key} onPress={() => onSelect(target)} style={styles.tab}>
            <Icon name={iconName} size={22} color={on ? colors.primary : colors.textDim} />
            <Type token="caption" color={on ? colors.primary : colors.textDim}>{label}</Type>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { paddingHorizontal: 24, paddingBottom: 14, borderBottomWidth: 1, flexDirection: 'row' },
  sidebar: { width: 236, borderRightWidth: 1, paddingHorizontal: 14, paddingTop: 22, paddingBottom: 16, gap: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, paddingBottom: 18 },
  brandDot: { width: 26, height: 26, borderRadius: 13 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  tabbar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 9, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  notice: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20, zIndex: 30 },
  noticeInner: { borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, maxWidth: 460, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
});
