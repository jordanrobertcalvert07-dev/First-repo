import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppFonts } from './src/fonts';
import { AppStateProvider, useAppState } from './src/state/AppState';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { AppShell } from './src/nav/AppShell';
import { VaultGateScreen } from './src/screens/VaultGate';

function Gate() {
  const { vaultStatus, setupVault, unlockVault } = useAppState();
  if (vaultStatus === 'loading') return <View style={{ flex: 1 }} />;
  if (vaultStatus === 'needs-setup') return <VaultGateScreen mode="setup" onSetup={setupVault} onUnlock={unlockVault} />;
  if (vaultStatus === 'locked') return <VaultGateScreen mode="unlock" onSetup={setupVault} onUnlock={unlockVault} />;
  return <AppShell />;
}

export default function App() {
  const fontsLoaded = useAppFonts();

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          {fontsLoaded ? <Gate /> : <View style={{ flex: 1, backgroundColor: '#16131d' }} />}
        </ThemeProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
