import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Type } from '../ui/Type';
import { Icon } from '../ui/Icon';

interface Props {
  mode: 'setup' | 'unlock';
  onSetup: (passphrase: string) => Promise<void>;
  onUnlock: (passphrase: string) => Promise<boolean>;
}

/**
 * Web-only unlock screen. There's no OS keychain in a browser, so a passphrase is
 * what stands between the encrypted vault and anyone with access to this browser
 * profile — see the note about the web/phone security gap in Settings and
 * docs/STACK.md. Phone skips this entirely; the key lives in the OS keychain.
 */
export function VaultGateScreen({ mode, onSetup, onUnlock }: Props) {
  const { colors, radius } = useTheme();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (mode === 'setup') {
      if (pass.length < 8) return setError('Use at least 8 characters.');
      if (pass !== confirm) return setError("Passphrases don't match.");
      setBusy(true);
      try { await onSetup(pass); } finally { setBusy(false); }
    } else {
      setBusy(true);
      try {
        const ok = await onUnlock(pass);
        if (!ok) setError('Incorrect passphrase.');
      } finally { setBusy(false); }
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface }]}>
      <View style={{ maxWidth: 380, width: '100%', gap: 18 }}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <View style={[styles.mark, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="lock" size={22} color={colors.primary} />
          </View>
          <Type token="h2" style={{ textAlign: 'center' }}>
            {mode === 'setup' ? 'Protect your data' : 'Welcome back'}
          </Type>
          <Type token="caption" dim style={{ textAlign: 'center' }}>
            {mode === 'setup'
              ? "Set a passphrase to encrypt what you log in this browser. There's no way to recover it if it's lost — write it down somewhere safe."
              : 'Enter your passphrase to unlock your data on this device.'}
          </Type>
        </View>

        <TextInput
          value={pass}
          onChangeText={setPass}
          placeholder="Passphrase"
          placeholderTextColor={colors.textDim}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
        />
        {mode === 'setup' && (
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm passphrase"
            placeholderTextColor={colors.textDim}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
          />
        )}
        {error && <Type token="caption" color={colors.primary}>{error}</Type>}

        <Pressable
          onPress={submit}
          style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.sm, opacity: busy ? 0.7 : 1 }]}
        >
          <Type token="label" color={colors.onPrimary} style={{ textAlign: 'center' }}>
            {busy ? 'Please wait…' : mode === 'setup' ? 'Create vault' : 'Unlock'}
          </Type>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mark: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  btn: { paddingVertical: 14, justifyContent: 'center' },
});
