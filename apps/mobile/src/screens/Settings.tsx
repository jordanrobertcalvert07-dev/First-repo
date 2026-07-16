import React, { useState } from 'react';
import { View, Switch, TextInput, Pressable, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useAppState } from '../state/AppState';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';

function Row({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
        <Type token="body">{label}</Type>
        {help ? <Type token="caption" dim style={{ marginTop: 2 }}>{help}</Type> : null}
      </View>
      {children}
    </View>
  );
}

export function SettingsScreen() {
  const { colors, radius } = useTheme();
  const { settings, setLockNight, setApiKey } = useAppState();
  const [draftKey, setDraftKey] = useState('');
  const hasKey = !!settings.apiKey;

  return (
    <View style={{ gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
      <Type token="h1">Settings</Type>

      <Card>
        <Type token="eyebrow" dim uppercase>Appearance</Type>
        <View style={{ height: 6 }} />
        <Row label="Lock to night" help="Keep the calm night theme on regardless of the time of day.">
          <Switch
            value={settings.lockNight}
            onValueChange={setLockNight}
            trackColor={{ true: colors.primary, false: colors.surfaceAlt }}
            thumbColor="#fff"
          />
        </Row>
      </Card>

      <Card>
        <Type token="eyebrow" dim uppercase>AI capture</Type>
        <View style={{ height: 6 }} />
        <Type token="body" style={{ marginBottom: 4 }}>
          {hasKey ? 'Claude is handling capture.' : 'Using the free built-in parser.'}
        </Type>
        <Type token="caption" dim style={{ marginBottom: 14 }}>
          Optional: connect your own Anthropic API key to let Claude read what you type and file it far more
          accurately (it understands the whole sentence instead of matching keywords). It's pay-as-you-go —
          a few cents at most per capture. Without a key, LifeLike uses the free built-in parser.
        </Type>

        {hasKey ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.pill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Icon name="check" size={15} color={colors.accent} />
              <Type token="caption">Key saved ({settings.apiKey!.slice(0, 7)}…)</Type>
            </View>
            <Pressable onPress={() => setApiKey(null)} style={[styles.btn, { borderColor: colors.border }]}>
              <Type token="label">Remove</Type>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <TextInput
              value={draftKey}
              onChangeText={setDraftKey}
              placeholder="sk-ant-…"
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            />
            <Pressable
              onPress={() => { if (draftKey.trim()) { setApiKey(draftKey.trim()); setDraftKey(''); } }}
              style={[styles.save, { backgroundColor: colors.primary, borderRadius: radius.sm, opacity: draftKey.trim() ? 1 : 0.5 }]}
            >
              <Type token="label" color={colors.onPrimary} style={{ textAlign: 'center' }}>Save key</Type>
            </Pressable>
          </View>
        )}

        <Type token="caption" dim style={{ marginTop: 12 }}>
          {Platform.OS === 'web'
            ? 'On the web build your key is stored in this browser (less protected than on your phone). '
            : 'Your key is stored in this device’s secure keychain. '}
          It is never written into the app’s code and is sent only to Anthropic, straight from your device.
        </Type>
      </Card>

      <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View style={[styles.lk, { backgroundColor: colors.surfaceAlt }]}>
          <Icon name="lock" size={17} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Type token="label">Medical &amp; Substances stay on this phone</Type>
          <Type token="caption" dim style={{ marginTop: 2 }}>
            Those sections never sync to the browser. Per-section sync controls and the biometric lock arrive
            in a later phase.
          </Type>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  save: { paddingVertical: 13, justifyContent: 'center' },
  btn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  lk: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
