import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppFonts } from './src/fonts';
import { AppStateProvider } from './src/state/AppState';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { AppShell } from './src/nav/AppShell';

export default function App() {
  const fontsLoaded = useAppFonts();

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          {fontsLoaded ? <AppShell /> : <View style={{ flex: 1, backgroundColor: '#16131d' }} />}
        </ThemeProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
